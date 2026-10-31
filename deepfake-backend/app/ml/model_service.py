"""Lazy adapter for DeepGuard's pretrained Hugging Face checkpoint.

The model is deliberately loaded only on first inference so auth/docs/health can
start even before ML dependencies or weights are present. Predictions fail closed:
there is no synthetic/mock score in the production path.
"""
from __future__ import annotations

import threading
from dataclasses import dataclass
from typing import Any

from PIL import Image

from app.config import settings


class ModelUnavailableError(RuntimeError):
    """Raised when the configured pretrained model cannot be loaded or run."""


class NoFacePredictionError(ValueError):
    """Raised when the model pipeline cannot score an image/face."""


@dataclass(frozen=True)
class Prediction:
    fake_probability: float
    real_probability: float
    model_id: str

    @property
    def verdict(self) -> str:
        return "likely_manipulated" if self.fake_probability >= settings.fake_threshold else "likely_authentic"


class DeepGuardClassifier:
    def __init__(self) -> None:
        self._pipeline: Any | None = None
        self._load_lock = threading.Lock()
        self._inference_lock = threading.Lock()
        self._load_error: str | None = None

    @property
    def model_loaded(self) -> bool:
        return self._pipeline is not None

    @property
    def load_error(self) -> str | None:
        return self._load_error

    def status(self) -> dict[str, object]:
        return {
            "configured_model_id": settings.deepfake_model_id,
            "loaded": self.model_loaded,
            "device_preference": settings.model_device,
            "load_error": self._load_error,
        }

    def _ensure_loaded(self) -> None:
        if self._pipeline is not None:
            return
        with self._load_lock:
            if self._pipeline is not None:
                return
            try:
                # Loading custom model code is explicitly enabled for this chosen
                # DeepGuard model. Review the model card/code before changing IDs.
                from transformers import pipeline
                import torch

                requested_device = settings.model_device.lower()
                if requested_device == "auto":
                    device = 0 if torch.cuda.is_available() else -1
                elif requested_device in {"cpu", "-1"}:
                    device = -1
                elif requested_device.isdigit():
                    device = int(requested_device)
                else:
                    raise ValueError("MODEL_DEVICE must be auto, cpu, -1, or a CUDA device index")

                self._pipeline = pipeline(
                    "image-classification",
                    model=settings.deepfake_model_id,
                    trust_remote_code=True,
                    device=device,
                )
                self._load_error = None
            except Exception as exc:  # Keep infra details in server logs, not API output.
                self._load_error = f"{type(exc).__name__}: {exc}"
                self._pipeline = None
                raise ModelUnavailableError(
                    "The pretrained model is unavailable. Install requirements-ml.txt, "
                    "confirm model access/network connectivity, and check the server logs."
                ) from exc

    @staticmethod
    def _flatten_predictions(raw: Any) -> list[dict[str, Any]]:
        if isinstance(raw, dict):
            return [raw]
        if isinstance(raw, list):
            flattened: list[dict[str, Any]] = []
            for item in raw:
                if isinstance(item, dict):
                    flattened.append(item)
                elif isinstance(item, list):
                    flattened.extend(x for x in item if isinstance(x, dict))
            return flattened
        return []

    def predict_image(self, image: Image.Image) -> Prediction:
        self._ensure_loaded()
        try:
            # Calls are serialized to limit memory pressure and protect model
            # pipeline internals on a shared CPU/GPU worker.
            with self._inference_lock:
                raw = self._pipeline(
                    image.convert("RGB"),
                    top_k=None,
                    margin_ratio=0.2,
                    conf_thres=0.5,
                    min_face_ratio=0.01,
                    tta_hflip=0.0,
                )
        except Exception as exc:
            self._load_error = f"Inference {type(exc).__name__}: {exc}"
            raise ModelUnavailableError(
                "Model inference failed. Check the server logs and verify model/dependency compatibility."
            ) from exc

        rows = self._flatten_predictions(raw)
        if not rows:
            raise NoFacePredictionError(
                "The model did not return a score. Try a clear image with a visible face."
            )

        # Handle face detection failure from the pipeline (e.g. YOLO found no face)
        for row in rows:
            label = str(row.get("label", "")).strip().lower()
            if "no_face" in label:
                raise NoFacePredictionError(
                    "No face detected in the image. Try a clear image with a visible face."
                )

        scores: dict[str, float] = {}
        for row in rows:
            label = str(row.get("label", "")).strip().lower()
            score = row.get("score")
            if label and isinstance(score, (int, float)):
                scores[label] = max(0.0, min(1.0, float(score)))

        # DeepGuard's model card specifies labels 'real' and 'fake'.
        if "fake" in scores:
            fake_probability = scores["fake"]
            if "real" in scores and abs((scores["real"] + fake_probability) - 1.0) < 0.1:
                total = scores["real"] + fake_probability
                if total > 0:
                    fake_probability /= total
        elif "label_1" in scores and "label_0" in scores:
            total = scores["label_1"] + scores["label_0"]
            fake_probability = scores["label_1"] / total if total > 0 else scores["label_1"]
        elif len(scores) == 1 and next(iter(scores)).startswith("label_1"):
            fake_probability = next(iter(scores.values()))
        else:
            raise ModelUnavailableError(
                f"Unexpected model labels {sorted(scores)}; expected 'real' and 'fake'."
            )

        fake_probability = max(0.0, min(1.0, float(fake_probability)))
        return Prediction(
            fake_probability=fake_probability,
            real_probability=1.0 - fake_probability,
            model_id=settings.deepfake_model_id,
        )


classifier = DeepGuardClassifier()
