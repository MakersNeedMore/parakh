from __future__ import annotations

import math
from pathlib import Path
from statistics import mean

from PIL import Image

from app.config import settings
from app.ml.media import inspect_video, open_validated_image, sample_video_frames
from app.ml.model_service import NoFacePredictionError, classifier


def verdict_for(score: float) -> str:
    return "likely_manipulated" if score >= settings.fake_threshold else "likely_authentic"


def analyze_image_path(path: str | Path) -> dict:
    image = open_validated_image(path)
    prediction = classifier.predict_image(image)
    return {
        "verdict": prediction.verdict,
        "fake_probability": prediction.fake_probability,
        "model_id": prediction.model_id,
        "total_frames": 1,
        "scored_frames": 1,
        "duration_seconds": None,
        "frame_results": [{
            "frame_index": 0,
            "timestamp_seconds": 0.0,
            "fake_probability": prediction.fake_probability,
            "verdict": prediction.verdict,
            "note": None,
        }],
        "suspicious_segments": [],
        "aggregation_method": "single_image_probability",
    }


def _timeline(frame_results: list[dict], duration: float, sample_gap: float) -> list[dict]:
    threshold = settings.fake_threshold
    suspicious = [
        row for row in frame_results
        if row["fake_probability"] is not None and row["fake_probability"] >= threshold
    ]
    if not suspicious:
        return []

    radius = max(0.05, sample_gap / 2.0)
    intervals = []
    for row in suspicious:
        timestamp = float(row["timestamp_seconds"])
        start = max(0.0, timestamp - radius)
        end = min(duration, timestamp + radius)
        intervals.append({
            "start_seconds": start,
            "end_seconds": end,
            "peak_fake_probability": float(row["fake_probability"]),
            "sampled_frames": 1,
        })

    merged: list[dict] = []
    for item in intervals:
        if merged and item["start_seconds"] <= merged[-1]["end_seconds"] + 1e-6:
            merged[-1]["end_seconds"] = max(merged[-1]["end_seconds"], item["end_seconds"])
            merged[-1]["peak_fake_probability"] = max(
                merged[-1]["peak_fake_probability"], item["peak_fake_probability"]
            )
            merged[-1]["sampled_frames"] += item["sampled_frames"]
        else:
            merged.append(item)
    return merged


def analyze_video_path(path: str | Path, requested_samples: int | None = None) -> dict:
    info = inspect_video(path)
    requested_samples = requested_samples or settings.default_video_samples
    raw_frames = list(sample_video_frames(path, requested_samples))
    frame_results: list[dict] = []
    for frame_index, timestamp, image in raw_frames:
        try:
            prediction = classifier.predict_image(image)
            score = prediction.fake_probability
            frame_results.append({
                "frame_index": int(frame_index),
                "timestamp_seconds": round(float(timestamp), 3),
                "fake_probability": round(float(score), 6),
                "verdict": verdict_for(score),
                "note": None,
            })
        except NoFacePredictionError as exc:
            frame_results.append({
                "frame_index": int(frame_index),
                "timestamp_seconds": round(float(timestamp), 3),
                "fake_probability": None,
                "verdict": "not_scored",
                "note": str(exc),
            })

    scored = [row for row in frame_results if row["fake_probability"] is not None]
    if not scored:
        raise NoFacePredictionError("No sampled frame could be scored. Try a video with clearly visible faces.")

    scores = [float(row["fake_probability"]) for row in scored]
    aggregate_score = mean(scores)
    # Sample intervals are approximate; this is not frame-by-frame continuous analysis.
    sample_gap = info.duration_seconds / max(1, len(raw_frames) - 1) if len(raw_frames) > 1 else info.duration_seconds
    segments = _timeline(frame_results, info.duration_seconds, sample_gap)
    return {
        "verdict": verdict_for(aggregate_score),
        "fake_probability": round(aggregate_score, 6),
        "model_id": settings.deepfake_model_id,
        "total_frames": len(frame_results),
        "scored_frames": len(scored),
        "duration_seconds": round(info.duration_seconds, 3),
        "frame_results": frame_results,
        "suspicious_segments": segments,
        "aggregation_method": "arithmetic_mean_of_scored_sampled_frame_probabilities",
        "sampling_note": "Only sampled frames were analysed; timeline boundaries are approximate.",
    }
