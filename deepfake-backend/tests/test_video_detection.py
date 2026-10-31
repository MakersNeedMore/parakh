from pathlib import Path

import cv2
import numpy as np


def test_video_job_updates_detection_and_returns_frames(monkeypatch, client, tmp_path):
    auth = client.post("/api/v1/auth/register", json={
        "email": "video-user@example.com", "password": "StrongPassword123!"
    })
    assert auth.status_code == 201

    video_path = tmp_path / "short.mp4"
    writer = cv2.VideoWriter(str(video_path), cv2.VideoWriter_fourcc(*"mp4v"), 5.0, (64, 64))
    if not writer.isOpened():
        import pytest
        pytest.skip("OpenCV MP4 encoder unavailable in this environment")
    for i in range(5):
        frame = np.full((64, 64, 3), i * 20, dtype=np.uint8)
        writer.write(frame)
    writer.release()

    def fake_video_analysis(path, requested_samples=None):
        assert Path(path).exists()
        return {
            "verdict": "likely_manipulated",
            "fake_probability": 0.8,
            "model_id": "test-model",
            "total_frames": 3,
            "scored_frames": 3,
            "duration_seconds": 1.0,
            "frame_results": [
                {"frame_index": 0, "timestamp_seconds": 0.0, "fake_probability": 0.7, "verdict": "likely_manipulated", "note": None},
                {"frame_index": 2, "timestamp_seconds": 0.4, "fake_probability": 0.8, "verdict": "likely_manipulated", "note": None},
                {"frame_index": 4, "timestamp_seconds": 0.8, "fake_probability": 0.9, "verdict": "likely_manipulated", "note": None},
            ],
            "suspicious_segments": [
                {"start_seconds": 0.0, "end_seconds": 1.0, "peak_fake_probability": 0.9, "sampled_frames": 3}
            ],
        }

    monkeypatch.setattr("app.jobs.analyze_video_path", fake_video_analysis)
    response = client.post(
        "/api/v1/detections/video?num_frames=3",
        files={"file": ("short.mp4", video_path.read_bytes(), "video/mp4")},
    )
    assert response.status_code == 202, response.text
    detection_id = response.json()["id"]

    detail = client.get(f"/api/v1/detections/{detection_id}")
    assert detail.status_code == 200
    assert detail.json()["status"] == "completed"
    assert detail.json()["scored_frames"] == 3

    frames = client.get(f"/api/v1/detections/{detection_id}/frames")
    assert frames.status_code == 200
    assert len(frames.json()["frames"]) == 3

    timeline = client.get(f"/api/v1/detections/{detection_id}/timeline")
    assert timeline.status_code == 200
    assert timeline.json()["suspicious_segments"][0]["peak_fake_probability"] == 0.9
