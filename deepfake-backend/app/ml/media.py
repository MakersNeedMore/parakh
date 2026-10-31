from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import cv2
from PIL import Image, ImageFile

from app.config import settings

Image.MAX_IMAGE_PIXELS = settings.max_image_pixels
ImageFile.LOAD_TRUNCATED_IMAGES = False


class InvalidMediaError(ValueError):
    pass


@dataclass(frozen=True)
class VideoInfo:
    fps: float
    frame_count: int
    duration_seconds: float
    width: int
    height: int


def open_validated_image(path: str | Path) -> Image.Image:
    try:
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            if image.width * image.height > settings.max_image_pixels:
                raise InvalidMediaError("Image pixel count exceeds the configured limit")
            return image.convert("RGB")
    except InvalidMediaError:
        raise
    except Exception as exc:
        raise InvalidMediaError("Invalid or unsupported image. Use JPEG, PNG, or WebP.") from exc


def inspect_video(path: str | Path) -> VideoInfo:
    capture = cv2.VideoCapture(str(path))
    try:
        if not capture.isOpened():
            raise InvalidMediaError("Unable to open video. Ensure the MP4 file is valid and decodable.")
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        duration = frame_count / fps if fps > 0 and frame_count > 0 else 0.0
        if width <= 0 or height <= 0 or frame_count <= 0 or fps <= 0 or duration <= 0:
            raise InvalidMediaError("Video metadata is incomplete or unsupported")
        if duration > settings.max_video_seconds:
            raise InvalidMediaError(
                f"Video duration ({duration:.1f}s) exceeds the {settings.max_video_seconds}s limit"
            )
        return VideoInfo(fps=fps, frame_count=frame_count, duration_seconds=duration, width=width, height=height)
    finally:
        capture.release()


def sample_video_frames(path: str | Path, requested_samples: int):
    """Yield (frame_index, timestamp_seconds, PIL RGB image) at evenly spaced positions."""
    info = inspect_video(path)
    count = max(1, min(int(requested_samples), settings.max_video_samples, info.frame_count))
    # Integer indices include the first and last frame when count > 1.
    if count == 1:
        indices = [0]
    else:
        indices = sorted({round(i * (info.frame_count - 1) / (count - 1)) for i in range(count)})

    capture = cv2.VideoCapture(str(path))
    try:
        for frame_index in indices:
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            ok, frame = capture.read()
            if not ok or frame is None:
                continue
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(rgb)
            yield frame_index, frame_index / info.fps, image
    finally:
        capture.release()
