from typing import Any, Dict, List

import numpy as np
import torch
from transformers import Pipeline
from transformers.image_utils import load_image


class DeepfakeImagePipeline(Pipeline):
    """Raw image -> YOLO face detect/crop -> resize+normalize -> deepfake prob."""

    def _sanitize_parameters(self, **kwargs):
        pre = {
            k: kwargs[k]
            for k in ("margin_ratio", "conf_thres", "min_face_ratio", "tta_hflip")
            if k in kwargs
        }
        post = {"top_k": kwargs["top_k"]} if "top_k" in kwargs else {}
        return pre, {}, post

    def _ensure_detector(self, conf_thres: float):
        if getattr(self, "_detector", None) is not None:
            return
        import os
        from ultralytics import YOLO
        from huggingface_hub import hf_hub_download

        local_w1 = os.path.join(str(self.model.name_or_path), "yolov8n-face.pt")
        local_w2 = os.path.join(os.path.dirname(__file__), "yolov8n-face.pt")
        local_w3 = os.path.abspath(os.path.join(os.getcwd(), "model_weights", "yolov8n-face.pt"))

        if os.path.isfile(local_w1):
            weights = local_w1
        elif os.path.isfile(local_w2):
            weights = local_w2
        elif os.path.isfile(local_w3):
            weights = local_w3
        else:
            weights = hf_hub_download(self.model.name_or_path, "yolov8n-face.pt")
        self._detector = YOLO(weights, task="detect")
        try:
            self._detector.to("cpu")
        except Exception:
            pass
        self._conf_thres = conf_thres

    def _detect_and_crop(self, img, margin_ratio, conf_thres, min_face_ratio):
        res = self._detector(img, conf=conf_thres, device="cpu", verbose=False)[0]
        if len(res.boxes) == 0:
            return None

        data = res.boxes.data.cpu().numpy()      # [N, 6] xyxy, conf, cls
        faces = data[data[:, 5] == 0]            # cls 0 = face
        if len(faces) == 0:
            return None

        areas = (faces[:, 2] - faces[:, 0]) * (faces[:, 3] - faces[:, 1])
        idx = int(np.argmax(areas))
        h, w = img.shape[:2]
        if areas[idx] / (h * w) < min_face_ratio:
            return None

        xmin, ymin, xmax, ymax = faces[idx, :4]
        pad_w = int((xmax - xmin) * margin_ratio)
        pad_h = int((ymax - ymin) * margin_ratio)
        y1, y2 = max(int(ymin - pad_h), 0), min(int(ymax + pad_h), h)
        x1, x2 = max(int(xmin - pad_w), 0), min(int(xmax + pad_w), w)

        crop = img[y1:y2, x1:x2]
        return crop if crop.size else None

    def preprocess(self, image, margin_ratio=0.2, conf_thres=0.5,
                   min_face_ratio=0.01, tta_hflip=0.0) -> Dict[str, Any]:
        from deepguard.data import get_test_transforms

        self._ensure_detector(conf_thres)

        img = np.array(load_image(image))  # path/URL/PIL -> RGB HWC
        crop = self._detect_and_crop(img, margin_ratio, conf_thres, min_face_ratio)
        if crop is None:
            return {"pixel_values": None}

        img_size = list(self.model.config.img_size)  # [H, W]
        tfm = get_test_transforms(img_size=img_size, tta_hflip=tta_hflip)
        tensor = tfm(image=crop)["image"].unsqueeze(0)
        return {"pixel_values": tensor.to(self.device)}

    def _forward(self, model_inputs) -> Dict[str, Any]:
        if model_inputs["pixel_values"] is None:
            return {"logits": None}
        with torch.no_grad():
            logits = self.model(pixel_values=model_inputs["pixel_values"]).logits
        return {"logits": logits}

    def postprocess(self, model_outputs, top_k=None) -> List[Dict[str, Any]]:
        logits = model_outputs["logits"]
        if logits is None:
            return [{"label": "no_face_detected", "score": -1.0}]

        probs = logits.softmax(-1)[0].tolist()
        id2label = self.model.config.id2label
        out = [{"label": id2label[i], "score": float(p)} for i, p in enumerate(probs)]
        out.sort(key=lambda x: x["score"], reverse=True)
        return out[:top_k] if top_k else out