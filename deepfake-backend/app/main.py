from __future__ import annotations

import logging
import re
import secrets
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine, get_db
from app.dependencies import get_current_user
from app.jobs import process_video_job
from app.ml.media import InvalidMediaError, inspect_video, open_validated_image
from app.ml.model_service import ModelUnavailableError, NoFacePredictionError, classifier
from app.ml.pipeline import analyze_image_path
from app.models import Detection, User
from app.schemas import AuthResponse, DetectionOut, LoginRequest, RegisterRequest, UserOut
from app.security import create_access_token, decode_access_token, dummy_verify_password, hash_password, revoke_token, verify_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
_VIDEO_EXTENSIONS = {".mp4"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    # Recover stranded in-flight detection jobs from an ungraceful restart
    try:
        with SessionLocal() as db:
            stranded = db.scalars(
                select(Detection).where(Detection.status.in_(["queued", "processing"]))
            ).all()
            for d in stranded:
                d.status = "failed"
                d.error_message = "Analysis interrupted by server restart."
                d.completed_at = datetime.now(timezone.utc)
            if stranded:
                db.commit()
                logger.info("Marked %d stranded detection jobs as failed on startup", len(stranded))
    except Exception:
        logger.exception("Failed to recover stranded detection jobs on startup")
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "Authenticated deepfake image/video analysis API using a configurable pretrained model. "
        "Model scores are indicators, not proof of authenticity or manipulation."
    ),
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)


@app.middleware("http")
async def early_auth_and_size_guard(request: Request, call_next):
    # 1. Early Content-Length check for upload routes to reject oversized payloads immediately
    if request.method == "POST" and any(request.url.path.endswith(p) for p in ("/detections/image", "/detections/video", "/detect/ai-generated")):
        cl = request.headers.get("content-length")
        if cl and cl.isdigit():
            max_allowed = settings.max_video_mb * 1024 * 1024 if "video" in request.url.path else settings.max_image_mb * 1024 * 1024
            if int(cl) > max_allowed:
                return Response(
                    content=f'{{"detail":"Upload exceeds the {max_allowed // (1024 * 1024)} MB limit"}}',
                    status_code=413,
                    media_type="application/json",
                )

    # 2. Early authentication check for protected detection routes to reject unauthenticated
    # requests immediately before Starlette streams or spools multipart body bytes to disk.
    if request.method == "POST" and ("/detections/image" in request.url.path or "/detections/video" in request.url.path):
        token = None
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1].strip()
        if not token:
            token = request.cookies.get(settings.cookie_name)

        user_id = decode_access_token(token) if token else None
        if not user_id:
            return Response(
                content='{"detail":"Not authenticated"}',
                status_code=401,
                media_type="application/json",
            )

    return await call_next(request)


_RATE_LIMITS: dict[str, list[float]] = {}
_RATE_LIMIT_LOCK = threading.Lock()


def _check_rate_limit(client_ip: str, max_requests: int = 25, window_seconds: int = 60) -> None:
    now = time.time()
    with _RATE_LIMIT_LOCK:
        history = [t for t in _RATE_LIMITS.get(client_ip, []) if now - t < window_seconds]
        if len(history) >= max_requests:
            raise HTTPException(status_code=429, detail="Too many authentication requests. Please wait a moment.")
        history.append(now)
        _RATE_LIMITS[client_ip] = history


def _safe_original_filename(filename: str | None) -> str:
    candidate = (filename or "upload").replace("\\", "/").split("/")[-1].strip()
    candidate = re.sub(r"[^A-Za-z0-9._ -]", "_", candidate)
    return (candidate[:250] or "upload")


def _validate_magic_bytes(header: bytes, ext: str) -> bool:
    if ext in {".jpg", ".jpeg"}:
        return header.startswith(b"\xff\xd8\xff")
    if ext == ".png":
        return header.startswith(b"\x89PNG\r\n\x1a\n")
    if ext == ".webp":
        return len(header) >= 12 and header.startswith(b"RIFF") and header[8:12] == b"WEBP"
    if ext == ".mp4":
        return len(header) >= 8 and (header[4:8] in (b"ftyp", b"moov"))
    return False


async def _save_upload(upload: UploadFile, allowed_extensions: set[str], max_bytes: int) -> tuple[Path, str]:
    # Reject oversized requests early if Content-Length or upload.size is provided
    content_length = upload.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Upload exceeds the {max_bytes // (1024 * 1024)} MB limit")
    if upload.size is not None and upload.size > max_bytes:
        raise HTTPException(status_code=413, detail=f"Upload exceeds the {max_bytes // (1024 * 1024)} MB limit")

    original = _safe_original_filename(upload.filename)
    ext = Path(original).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file extension. Allowed: {', '.join(sorted(allowed_extensions))}",
        )

    # Secure destination inside upload_dir
    safe_dir = settings.upload_dir.resolve()
    safe_dir.mkdir(parents=True, exist_ok=True)
    destination = (safe_dir / f"{uuid4().hex}{ext}").resolve()
    if not destination.is_relative_to(safe_dir):
        raise HTTPException(status_code=400, detail="Invalid upload destination path")

    written = 0
    first_chunk = True
    try:
        with destination.open("wb") as out:
            while chunk := await upload.read(1024 * 1024):
                if first_chunk:
                    if not _validate_magic_bytes(chunk, ext):
                        raise HTTPException(
                            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                            detail="File content does not match the expected media signature",
                        )
                    first_chunk = False
                written += len(chunk)
                if written > max_bytes:
                    raise HTTPException(status_code=413, detail=f"Upload exceeds the {max_bytes // (1024 * 1024)} MB limit")
                out.write(chunk)
        if written == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        return destination, original
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await upload.close()


def _set_auth_cookie(response: Response, user_id: str) -> str:
    token = create_access_token(user_id)
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.access_token_minutes * 60,
        path="/",
    )
    return token


def _apply_result(detection: Detection, result: dict) -> None:
    detection.status = "completed"
    detection.verdict = result["verdict"]
    detection.fake_probability = result["fake_probability"]
    detection.model_id = result["model_id"]
    detection.total_frames = result["total_frames"]
    detection.scored_frames = result["scored_frames"]
    detection.duration_seconds = result["duration_seconds"]
    detection.frame_results = result["frame_results"]
    detection.suspicious_segments = result["suspicious_segments"]
    detection.error_message = None
    detection.completed_at = datetime.now(timezone.utc)


@app.get("/", tags=["system"])
def root():
    return {"name": settings.app_name, "version": app.version, "docs": "/docs", "api_prefix": settings.api_prefix}


@app.get("/v1/health", tags=["system"])
@app.get(f"{settings.api_prefix}/health", tags=["system"], include_in_schema=False)
def v1_health():
    return {"ok": True, "modelReady": classifier.model_loaded, "model": settings.deepfake_model_id}


@app.post("/v1/detect/ai-generated", tags=["detection"])
@app.post(f"{settings.api_prefix}/detect/ai-generated", tags=["detection"], include_in_schema=False)
async def detect_ai_generated(
    image: UploadFile | None = File(None),
    file: UploadFile | None = File(None),
):
    upload = image or file
    if upload is None:
        raise HTTPException(status_code=400, detail="Missing image or file upload in request body")
    path, original = await _save_upload(upload, _IMAGE_EXTENSIONS, settings.max_image_mb * 1024 * 1024)
    try:
        t0 = datetime.now(timezone.utc)
        result = await run_in_threadpool(analyze_image_path, path)
        fake_prob = float(result["fake_probability"])
        score = round(fake_prob * 100)
        status_val = "flagged" if fake_prob >= settings.fake_threshold else ("uncertain" if fake_prob >= 0.4 else "likely-real")
        runtime_ms = round((datetime.now(timezone.utc) - t0).total_seconds() * 1000)
        return {
            "engine": "ai-generated-detector",
            "name": "AI-Generated Image Detector",
            "version": f"DeepGuard-FaceForensics++ ({result['model_id']})",
            "score": score,
            "status": status_val,
            "runtimeMs": runtime_ms,
            "details": [
                f"Deepfake / manipulation probability: {fake_prob * 100:.1f}%",
                f"Verdict: {result['verdict']}",
                f"Model: {result['model_id']}",
            ],
            "limitations": [
                "Statistical detector based on FaceForensics++: not definitive proof of manipulation.",
                "Heavy post-processing, recompression, or extreme angles can influence scores.",
            ],
        }
    except Exception as exc:
        logger.exception("AI generation detection error")
        return {
            "engine": "ai-generated-detector",
            "name": "AI-Generated Image Detector",
            "version": "DeepGuard",
            "score": None,
            "status": "unavailable",
            "runtimeMs": 0,
            "details": [f"Detection unavailable: {str(exc)}"],
            "limitations": ["Ensure clear face image is provided."],
        }
    finally:
        path.unlink(missing_ok=True)


@app.get("/health", tags=["system"])
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"
    model_st = classifier.status()
    # Mask internal exception details from public health check
    if "load_error" in model_st and model_st["load_error"]:
        model_st["load_error"] = "Error initializing model. Check server logs."
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "model": model_st,
        "inference_ready": classifier.model_loaded,
        "note": "The model is loaded lazily on the first inference request.",
    }


@app.post(f"{settings.api_prefix}/auth/register", response_model=AuthResponse, status_code=201, tags=["authentication"])
@app.post("/auth/register", response_model=AuthResponse, status_code=201, tags=["authentication"], include_in_schema=False)
def register(payload: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)
    email = str(payload.email).strip().lower()
    if len(payload.password) < 10:
        raise HTTPException(status_code=422, detail="Password must be at least 10 characters")
    user = User(email=email, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    token = _set_auth_cookie(response, user.id)
    return AuthResponse(user=UserOut.model_validate(user), message="Account created", access_token=token)


@app.post(f"{settings.api_prefix}/auth/login", response_model=AuthResponse, tags=["authentication"])
@app.post("/auth/login", response_model=AuthResponse, tags=["authentication"], include_in_schema=False)
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)
    email = str(payload.email).strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    # Same response for unknown account and wrong password reduces account enumeration.
    if not user:
        dummy_verify_password(payload.password)
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not verify_password(payload.password, user.password_hash) or not user.is_active:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = _set_auth_cookie(response, user.id)
    return AuthResponse(user=UserOut.model_validate(user), message="Login successful", access_token=token)


@app.post(f"{settings.api_prefix}/auth/logout", status_code=204, tags=["authentication"])
@app.post("/auth/logout", status_code=204, tags=["authentication"], include_in_schema=False)
def logout(request: Request, response: Response) -> None:
    cookie_token = request.cookies.get(settings.cookie_name)
    if cookie_token:
        revoke_token(cookie_token)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        revoke_token(auth_header.split(" ", 1)[1].strip())
    response.delete_cookie(key=settings.cookie_name, path="/", secure=settings.cookie_secure, httponly=True, samesite=settings.cookie_samesite)
    return None


@app.get(f"{settings.api_prefix}/auth/me", response_model=UserOut, tags=["authentication"])
@app.get("/auth/me", response_model=UserOut, tags=["authentication"], include_in_schema=False)
def me(user: User = Depends(get_current_user)):
    return user


@app.post(f"{settings.api_prefix}/detections/image", response_model=DetectionOut, status_code=201, tags=["detection"])
@app.post("/detections/image", response_model=DetectionOut, status_code=201, tags=["detection"], include_in_schema=False)
async def detect_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    path, original = await _save_upload(file, _IMAGE_EXTENSIONS, settings.max_image_mb * 1024 * 1024)
    detection = Detection(
        owner_id=user.id,
        media_type="image",
        original_filename=original,
        status="processing",
        model_id=settings.deepfake_model_id,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)
    try:
        # Validate before sending pixels to the remote-code model pipeline.
        open_validated_image(path)
        result = await run_in_threadpool(analyze_image_path, path)
        _apply_result(detection, result)
        db.commit()
        db.refresh(detection)
        return detection
    except InvalidMediaError as exc:
        db.rollback()
        det = db.get(Detection, detection.id)
        if det:
            det.status = "failed"
            det.error_message = str(exc)
            det.completed_at = datetime.now(timezone.utc)
            db.commit()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except NoFacePredictionError as exc:
        db.rollback()
        det = db.get(Detection, detection.id)
        if det:
            det.status = "failed"
            det.error_message = str(exc)
            det.completed_at = datetime.now(timezone.utc)
            db.commit()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ModelUnavailableError as exc:
        logger.exception("Image model unavailable")
        db.rollback()
        det = db.get(Detection, detection.id)
        if det:
            det.status = "failed"
            det.error_message = "Inference model unavailable. Check ML dependencies, model access, and server logs."
            det.completed_at = datetime.now(timezone.utc)
            db.commit()
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected image detection failure")
        db.rollback()
        det = db.get(Detection, detection.id)
        if det:
            det.status = "failed"
            det.error_message = "Image processing failed. Check server logs."
            det.completed_at = datetime.now(timezone.utc)
            db.commit()
        raise HTTPException(status_code=500, detail="Image processing failed. Check server logs.") from exc
    finally:
        path.unlink(missing_ok=True)


@app.post(f"{settings.api_prefix}/detections/video", response_model=DetectionOut, status_code=202, tags=["detection"])
@app.post("/detections/video", response_model=DetectionOut, status_code=202, tags=["detection"], include_in_schema=False)
async def detect_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    num_frames: int = Query(default=settings.default_video_samples, ge=1, le=settings.max_video_samples),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    path, original = await _save_upload(file, _VIDEO_EXTENSIONS, settings.max_video_mb * 1024 * 1024)
    try:
        await run_in_threadpool(inspect_video, path)
    except InvalidMediaError as exc:
        path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    detection = Detection(
        owner_id=user.id,
        media_type="video",
        original_filename=original,
        status="queued",
        model_id=settings.deepfake_model_id,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)
    background_tasks.add_task(process_video_job, detection.id, str(path), num_frames)
    return detection


@app.get(f"{settings.api_prefix}/detections", response_model=list[DetectionOut], tags=["detection"])
@app.get("/detections", response_model=list[DetectionOut], tags=["detection"], include_in_schema=False)
def list_detections(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Detection).where(Detection.owner_id == user.id).order_by(Detection.created_at.desc()).offset(offset).limit(limit)
    return list(db.scalars(query).all())


@app.get(f"{settings.api_prefix}/detections/{{detection_id}}", response_model=DetectionOut, tags=["detection"])
@app.get("/detections/{detection_id}", response_model=DetectionOut, tags=["detection"], include_in_schema=False)
def get_detection(detection_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    detection = db.get(Detection, detection_id)
    if detection is None or detection.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Detection not found")
    return detection


@app.get(f"{settings.api_prefix}/detections/{{detection_id}}/frames", tags=["detection"])
@app.get("/detections/{detection_id}/frames", tags=["detection"], include_in_schema=False)
def get_detection_frames(detection_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    detection = db.get(Detection, detection_id)
    if detection is None or detection.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Detection not found")
    return {"detection_id": detection.id, "status": detection.status, "frames": detection.frame_results or []}


@app.get(f"{settings.api_prefix}/detections/{{detection_id}}/timeline", tags=["detection"])
@app.get("/detections/{detection_id}/timeline", tags=["detection"], include_in_schema=False)
def get_detection_timeline(detection_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    detection = db.get(Detection, detection_id)
    if detection is None or detection.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Detection not found")
    return {
        "detection_id": detection.id,
        "status": detection.status,
        "duration_seconds": detection.duration_seconds,
        "aggregation_method": "arithmetic_mean_of_scored_sampled_frame_probabilities",
        "suspicious_segments": detection.suspicious_segments or [],
        "note": "Timeline intervals are approximate because only sampled frames are analysed.",
    }


@app.delete(f"{settings.api_prefix}/detections/{{detection_id}}", status_code=204, tags=["detection"])
@app.delete("/detections/{detection_id}", status_code=204, tags=["detection"], include_in_schema=False)
def delete_detection(detection_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> None:
    detection = db.get(Detection, detection_id)
    if detection is None or detection.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Detection not found")
    db.delete(detection)
    db.commit()
    return None
    return None
