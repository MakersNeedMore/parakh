from __future__ import annotations

import logging
import re
import secrets
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
from app.database import Base, engine, get_db
from app.dependencies import get_current_user
from app.jobs import process_video_job
from app.ml.media import InvalidMediaError, inspect_video, open_validated_image
from app.ml.model_service import ModelUnavailableError, NoFacePredictionError, classifier
from app.ml.pipeline import analyze_image_path
from app.models import Detection, User
from app.schemas import AuthResponse, DetectionOut, LoginRequest, RegisterRequest, UserOut
from app.security import create_access_token, hash_password, verify_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
_VIDEO_EXTENSIONS = {".mp4"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
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


def _safe_original_filename(filename: str | None) -> str:
    candidate = (filename or "upload").replace("\\", "/").split("/")[-1].strip()
    candidate = re.sub(r"[^A-Za-z0-9._ -]", "_", candidate)
    return (candidate[:250] or "upload")


async def _save_upload(upload: UploadFile, allowed_extensions: set[str], max_bytes: int) -> tuple[Path, str]:
    original = _safe_original_filename(upload.filename)
    ext = Path(original).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file extension. Allowed: {', '.join(sorted(allowed_extensions))}",
        )
    destination = settings.upload_dir / f"{uuid4().hex}{ext}"
    written = 0
    try:
        with destination.open("wb") as out:
            while chunk := await upload.read(1024 * 1024):
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


@app.get("/health", tags=["system"])
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "model": classifier.status(),
        "inference_ready": classifier.model_loaded,
        "note": "The model is loaded lazily on the first inference request.",
    }


@app.post(f"{settings.api_prefix}/auth/register", response_model=AuthResponse, status_code=201, tags=["authentication"])
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
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
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    # Same response for unknown account and wrong password reduces account enumeration.
    if not user or not verify_password(payload.password, user.password_hash) or not user.is_active:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = _set_auth_cookie(response, user.id)
    return AuthResponse(user=UserOut.model_validate(user), message="Login successful", access_token=token)


@app.post(f"{settings.api_prefix}/auth/logout", status_code=204, tags=["authentication"])
def logout(response: Response) -> None:
    response.delete_cookie(key=settings.cookie_name, path="/", secure=settings.cookie_secure, httponly=True, samesite=settings.cookie_samesite)
    return None


@app.get(f"{settings.api_prefix}/auth/me", response_model=UserOut, tags=["authentication"])
def me(user: User = Depends(get_current_user)):
    return user


@app.post(f"{settings.api_prefix}/detections/image", response_model=DetectionOut, status_code=201, tags=["detection"])
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
        detection.status = "failed"
        detection.error_message = str(exc)
        detection.completed_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except NoFacePredictionError as exc:
        detection.status = "failed"
        detection.error_message = str(exc)
        detection.completed_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ModelUnavailableError as exc:
        logger.exception("Image model unavailable")
        detection.status = "failed"
        detection.error_message = "Inference model unavailable. Check ML dependencies, model access, and server logs."
        detection.completed_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected image detection failure")
        detection.status = "failed"
        detection.error_message = "Image processing failed. Check server logs."
        detection.completed_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(status_code=500, detail="Image processing failed. Check server logs.") from exc
    finally:
        path.unlink(missing_ok=True)


@app.post(f"{settings.api_prefix}/detections/video", response_model=DetectionOut, status_code=202, tags=["detection"])
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
def list_detections(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Detection).where(Detection.owner_id == user.id).order_by(Detection.created_at.desc()).offset(offset).limit(limit)
    return list(db.scalars(query).all())


@app.get(f"{settings.api_prefix}/detections/{{detection_id}}", response_model=DetectionOut, tags=["detection"])
def get_detection(detection_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    detection = db.get(Detection, detection_id)
    if detection is None or detection.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Detection not found")
    return detection


@app.get(f"{settings.api_prefix}/detections/{{detection_id}}/frames", tags=["detection"])
def get_detection_frames(detection_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    detection = db.get(Detection, detection_id)
    if detection is None or detection.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Detection not found")
    return {"detection_id": detection.id, "status": detection.status, "frames": detection.frame_results or []}


@app.get(f"{settings.api_prefix}/detections/{{detection_id}}/timeline", tags=["detection"])
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
def delete_detection(detection_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> None:
    detection = db.get(Detection, detection_id)
    if detection is None or detection.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Detection not found")
    db.delete(detection)
    db.commit()
    return None
