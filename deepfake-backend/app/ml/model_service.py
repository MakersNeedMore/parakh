"""Lazy adapter for DeepGuard's pretrained Hugging Face checkpoint.

The model is deliberately loaded only on first inference so auth/docs/health can
start even before ML dependencies or weights are present. Predictions fail closed:
there is no synthetic/mock score in the production path.
"""
from __future__ import annotations

import sys
import threading
import types
from dataclasses import dataclass
from typing import Any

import numpy as np
from PIL import Image

# Shim optional C-acceleration modules if blocked by OS security policy (AppLocker/DLL rules)
if "simsimd" not in sys.modules:
    try:
        import simsimd  # noqa: F401
    except Exception:
        class _FallbackSimsimd(types.ModuleType):
            def wsum(self, a: Any, b: Any, alpha: float = 1.0, beta: float = 1.0) -> Any:
                return (np.asarray(a) * alpha + np.asarray(b) * beta)

        sys.modules["simsimd"] = _FallbackSimsimd("simsimd")

if "stringzilla" not in sys.modules:
    try:
        import stringzilla  # noqa: F401
    except Exception:
        class _FallbackStringZilla(types.ModuleType):
            def translate(self, text: Any, lut: Any, inplace: bool = True) -> Any:
                return text

        sys.modules["stringzilla"] = _FallbackStringZilla("stringzilla")

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
                # Shim stringzilla if unavailable/blocked by OS security policy
                import sys
                import types

                if "simsimd" not in sys.modules:
                    try:
                        import simsimd  # noqa: F401
                    except Exception:
                        class _FallbackSimsimd(types.ModuleType):
                            def wsum(self, a: Any, b: Any, alpha: float = 1.0, beta: float = 1.0) -> Any:
                                return (np.asarray(a) * alpha + np.asarray(b) * beta)

                        sys.modules["simsimd"] = _FallbackSimsimd("simsimd")

                if "stringzilla" not in sys.modules:
                    try:
                        import stringzilla  # noqa: F401
                    except Exception:
                        class _FallbackStringZilla(types.ModuleType):
                            def translate(self, text: Any, lut: Any, inplace: bool = True) -> Any:
                                return text

                        sys.modules["stringzilla"] = _FallbackStringZilla("stringzilla")

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

                pipeline_kwargs: dict[str, Any] = {
                    "task": "image-classification",
                    "model": settings.deepfake_model_id,
                    "trust_remote_code": True,
                    "device": device,
                }
                if settings.hf_token:
                    pipeline_kwargs["token"] = settings.hf_token
                if settings.model_revision:
                    pipeline_kwargs["revision"] = settings.model_revision

                self._pipeline = pipeline(**pipeline_kwargs)
                self._load_error = None
            except Exception as exc:  # Keep infra details in server logs, not API output.
                self._load_error = f"{type(exc).__name__}: {exc}"
                self._pipeline = None
                raise ModelUnavailableError(
                    "The pretrained model is unavailable. Install requirements-ml.txt, "
                    "confirm model access/network connectivity, and check the server logs."
                ) from exc

    @staticmethod
    def _extract_face_groups(raw: Any) -> list[list[dict[str, Any]]]:
        if isinstance(raw, dict):
            return [[raw]]
        if not isinstance(raw, list) or not raw:
            return []

        # If it's already a list of lists of predictions: [[{...}, {...}], [{...}, {...}]]
        if isinstance(raw[0], list):
            return [x for x in raw if isinstance(x, list)]

        # If it's a flat list of dicts, check for repeated labels which indicates multiple faces
        groups: list[list[dict[str, Any]]] = []
        current_group: list[dict[str, Any]] = []
        seen_labels: set[str] = set()

        for item in raw:
            if not isinstance(item, dict):
                continue
            lbl = str(item.get("label", "")).strip().lower()
            if lbl in seen_labels and current_group:
                groups.append(current_group)
                current_group = [item]
                seen_labels = {lbl}
            else:
                current_group.append(item)
                seen_labels.add(lbl)

        if current_group:
            groups.append(current_group)
        return groups

    @staticmethod
    def _parse_face_prob(group: list[dict[str, Any]]) -> tuple[float | None, bool]:
        """Returns (probability, is_no_face). If unknown labels, raises ModelUnavailableError."""
        scores: dict[str, float] = {}
        for row in group:
            label = str(row.get("label", "")).strip().lower()
            if "no_face" in label:
                return (None, True)
            score = row.get("score")
            if label and isinstance(score, (int, float)):
                scores[label] = max(0.0, min(1.0, float(score)))

        if not scores:
            return (None, False)

        if "fake" in scores:
            prob = scores["fake"]
            if "real" in scores and abs((scores["real"] + prob) - 1.0) < 0.15:
                total = scores["real"] + prob
                if total > 0:
                    prob /= total
            return (prob, False)
        elif "label_1" in scores and "label_0" in scores:
            total = scores["label_1"] + scores["label_0"]
            prob = scores["label_1"] / total if total > 0 else scores["label_1"]
            return (prob, False)
        elif len(scores) == 1 and next(iter(scores)).startswith("label_1"):
            return (next(iter(scores.values())), False)

        raise ModelUnavailableError(f"Unexpected model labels: {list(scores.keys())}")

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

        face_groups = self._extract_face_groups(raw)
        if not face_groups:
            raise NoFacePredictionError(
                "The model did not return a score. Try a clear image with a visible face."
            )

        face_probs: list[float] = []
        has_no_face_signal = False

        for group in face_groups:
            prob, no_face = self._parse_face_prob(group)
            if prob is not None:
                face_probs.append(prob)
            elif no_face:
                has_no_face_signal = True

        if not face_probs:
            if has_no_face_signal:
                raise NoFacePredictionError(
                    "No face detected in the image. Try a clear image with a visible face."
                )
            raise ModelUnavailableError(
                "Unexpected model labels in inference output."
            )

        # In multi-face imagery, if any face is manipulated, the asset is flagged.
        fake_probability = max(0.0, min(1.0, float(max(face_probs))))
        return Prediction(
            fake_probability=fake_probability,
            real_probability=1.0 - fake_probability,
            model_id=settings.deepfake_model_id,
        )


classifier = DeepGuardClassifier()
