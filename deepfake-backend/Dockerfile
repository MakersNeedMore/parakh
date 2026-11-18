# Parakh DeepGuard inference API.
# Works unchanged on Render (Docker web service), Hugging Face Spaces (Docker SDK),
# Railway, Fly.io and local docker compose.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000 \
    HF_HOME=/service/.cache/huggingface \
    YOLO_CONFIG_DIR=/service/.cache/ultralytics \
    MPLCONFIGDIR=/service/.cache/matplotlib \
    DATABASE_URL=sqlite:////service/data/deepfake.db \
    UPLOAD_DIR=/service/uploads \
    MODEL_DEVICE=cpu

WORKDIR /service
RUN apt-get update && apt-get install -y --no-install-recommends libglib2.0-0 libgomp1 libgl1 ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# CPU-only PyTorch wheels: ~5x smaller image than the default CUDA build.
# Override with --build-arg TORCH_INDEX_URL=https://download.pytorch.org/whl/cu121 for GPU hosts.
ARG TORCH_INDEX_URL=https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir --index-url ${TORCH_INDEX_URL} "torch>=2.4.0" "torchvision>=0.19.0"

COPY requirements.txt requirements-ml.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-ml.txt

# Bake the pinned model snapshot into the image so cold starts do not depend on
# a Hugging Face download. Set --build-arg PRELOAD_MODEL=0 to skip.
ARG PRELOAD_MODEL=1
ARG DEEPFAKE_MODEL_ID=KoreaPeter/ms-eff-gcvit-deepfake-b0-ff-plus-plus
ARG MODEL_REVISION=fc6fc9594ae35a6880ffa3f8e128239968703a25
RUN if [ "$PRELOAD_MODEL" = "1" ]; then \
      python -c "from huggingface_hub import snapshot_download; snapshot_download('${DEEPFAKE_MODEL_ID}', revision='${MODEL_REVISION}')" \
      || echo 'WARNING: model preload failed; it will download on the first request.'; \
    fi

COPY app ./app
COPY scripts ./scripts

# Hugging Face Spaces runs the container as uid 1000 (not root), so every path the
# app writes to must be writable by any user.
RUN mkdir -p /service/uploads /service/data /service/.cache \
    && chmod -R 777 /service/uploads /service/data /service/.cache

EXPOSE 8000
# sh -c so $PORT (injected by Render/Railway/etc.) is honoured.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
