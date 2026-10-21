"""Parakh forensic inference backend.

Serves the CommunityForensics AI-generated-image detector over HTTP so the
Next.js frontend never downloads or runs model weights itself.

Config: backend/.env (see backend/.env.example) — HOST, PORT, CORS_ORIGINS.
Frontend points at it via NEXT_PUBLIC_PARAKH_BACKEND (see root .env.example).

Run:
    pip install -r requirements.txt
    python scripts/download_model.py   # one-time (~40 MB)
    uvicorn app:app --port 8000        # or: python app.py

Endpoint:
    POST /v1/detect/ai-generated  (multipart: image=<file>)
    -> { engine, model, score, label, status, runtimeMs, details, limitations }
"""
import io
import os
import time

import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass  # python-dotenv optional; env vars / defaults still work

MODEL_PRIMARY = os.path.join(os.path.dirname(__file__), "models", "model_q4f16.onnx")
MODEL_FALLBACK = os.path.join(os.path.dirname(__file__), "models", "model_int8.onnx")
MODEL_ID = "onnx-community/CommunityForensics-DeepfakeDet-ViT-ONNX"
VERSION = "CommunityForensics-DeepfakeDet-ViT (self-hosted ONNX, MIT)"

# CLIP-style preprocessing the model expects: shortest edge 440, center-crop 384.
CLIP_MEAN = np.array([0.4815, 0.4578, 0.4082], dtype=np.float32)
CLIP_STD = np.array([0.2686, 0.2613, 0.2758], dtype=np.float32)

_session = None
_session_path = None


def get_session():
    global _session, _session_path
    if _session is not None:
        return _session, _session_path
    import onnxruntime as ort

    for path in (MODEL_PRIMARY, MODEL_FALLBACK):
        if os.path.exists(path):
            opts = ort.SessionOptions()
            opts.intra_op_num_threads = max(1, (os.cpu_count() or 4) - 1)
            _session = ort.InferenceSession(path, sess_options=opts, providers=["CPUExecutionProvider"])
            _session_path = path
            return _session, _session_path
    raise RuntimeError(
        "No model weights found. Run `python scripts/download_model.py` first "
        "(downloads ~40 MB into backend/models/)."
    )


def preprocess(img: Image.Image) -> np.ndarray:
    img = img.convert("RGB")
    w, h = img.size
    scale = 440.0 / min(w, h)
    img = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.BICUBIC)
    w2, h2 = img.size
    left, top = (w2 - 384) // 2, (h2 - 384) // 2
    img = img.crop((left, top, left + 384, top + 384))
    arr = np.asarray(img, dtype=np.float32) / 255.0
    arr = (arr - CLIP_MEAN) / CLIP_STD
    return arr.transpose(2, 0, 1)[np.newaxis, :].astype(np.float32)


def sigmoid(x: float) -> float:
    return float(1.0 / (1.0 + np.exp(-x)))


def _cors_origins():
    raw = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


app = FastAPI(title="Parakh Inference", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/v1/health")
def health():
    ready = os.path.exists(MODEL_PRIMARY) or os.path.exists(MODEL_FALLBACK)
    return {"ok": True, "modelReady": ready, "model": MODEL_ID}


@app.post("/v1/detect/ai-generated")
async def detect_ai_generated(image: UploadFile = File(...)):
    t0 = time.perf_counter()
    raw = await image.read()
    if not raw:
        return JSONResponse({"status": "error", "detail": "empty upload"}, status_code=400)
    if len(raw) > 25 * 1024 * 1024:
        return JSONResponse({"status": "error", "detail": "file too large (25 MB max)"}, status_code=413)
    try:
        session, used_path = get_session()
    except RuntimeError as e:
        return JSONResponse({"status": "model-missing", "detail": str(e)}, status_code=503)
    try:
        img = Image.open(io.BytesIO(raw))
    except Exception:
        return JSONResponse({"status": "error", "detail": "unreadable image"}, status_code=400)

    tensor = preprocess(img)
    input_name = session.get_inputs()[0].name
    logit = float(session.run(None, {input_name: tensor})[0].ravel()[0])
    fake_prob = min(1.0, max(0.0, sigmoid(logit)))
    score = round(fake_prob * 100)
    status = "flagged" if fake_prob >= 0.6 else ("uncertain" if fake_prob >= 0.4 else "likely-real")
    runtime_ms = round((time.perf_counter() - t0) * 1000)
    return {
        "engine": "ai-generated-detector",
        "name": "AI-Generated Image Detector",
        "version": f"{VERSION} [{os.path.basename(used_path)}]",
        "score": score,
        "status": status,
        "runtimeMs": runtime_ms,
        "details": [
            f"AI-generation probability: {fake_prob * 100:.1f}%",
            "Model trained on ~2.7M images across ~4,800 generators (Community Forensics).",
            f"Backend: ONNX Runtime CPU ({os.path.basename(used_path)}).",
        ],
        "limitations": [
            "Statistical detector: 97.2% reported accuracy, ~2.1% FP rate — not a verdict.",
            "Heavy post-processing (recompress, resize, screenshots) can weaken the signal.",
        ],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", "8000")),
    )
