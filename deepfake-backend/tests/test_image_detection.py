from io import BytesIO

from PIL import Image


def test_image_detection_calls_configured_pipeline(monkeypatch, client):
    response = client.post("/api/v1/auth/register", json={
        "email": "test-image@example.com", "password": "VeryStrongPassword123!"
    })
    assert response.status_code == 201

    def fake_analysis(path):
        assert path.exists()
        return {
            "verdict": "likely_manipulated",
            "fake_probability": 0.91,
            "model_id": "test-model",
            "total_frames": 1,
            "scored_frames": 1,
            "duration_seconds": None,
            "frame_results": [{
                "frame_index": 0, "timestamp_seconds": 0.0,
                "fake_probability": 0.91, "verdict": "likely_manipulated", "note": None,
            }],
            "suspicious_segments": [],
        }

    monkeypatch.setattr("app.main.analyze_image_path", fake_analysis)
    buffer = BytesIO()
    Image.new("RGB", (160, 160), (125, 130, 140)).save(buffer, format="JPEG")
    buffer.seek(0)
    result = client.post(
        "/api/v1/detections/image",
        files={"file": ("sample.jpg", buffer.getvalue(), "image/jpeg")},
    )
    assert result.status_code == 201, result.text
    data = result.json()
    assert data["status"] == "completed"
    assert data["verdict"] == "likely_manipulated"
    assert data["fake_probability"] == 0.91

    history = client.get("/api/v1/detections")
    assert history.status_code == 200
    assert len(history.json()) == 1

    # Authenticated users must not be able to read another user's result.
    other = client.post("/api/v1/auth/register", json={
        "email": "another-user@example.com", "password": "AnotherStrongPassword123!"
    })
    assert other.status_code == 201
    other_token = other.json()["access_token"]
    forbidden = client.get(
        f"/api/v1/detections/{data['id']}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert forbidden.status_code == 404


def test_image_upload_rejects_unsupported_extension(client):
    client.post("/api/v1/auth/register", json={"email": "a@example.com", "password": "StrongPassword123!"})
    response = client.post("/api/v1/detections/image", files={"file": ("payload.exe", b"bad", "application/octet-stream")})
    assert response.status_code == 415


def test_v1_detect_ai_generated_compatibility_route(monkeypatch, client):
    def fake_analysis(path):
        return {
            "verdict": "likely_manipulated",
            "fake_probability": 0.85,
            "model_id": "KoreaPeter/ms-eff-gcvit-deepfake-b0-ff-plus-plus",
            "total_frames": 1,
            "scored_frames": 1,
            "duration_seconds": None,
            "frame_results": [],
            "suspicious_segments": [],
        }

    monkeypatch.setattr("app.main.analyze_image_path", fake_analysis)
    buffer = BytesIO()
    Image.new("RGB", (100, 100), (200, 100, 50)).save(buffer, format="PNG")
    buffer.seek(0)

    res = client.post("/v1/detect/ai-generated", files={"image": ("face.png", buffer.getvalue(), "image/png")})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["engine"] == "ai-generated-detector"
    assert data["score"] == 85
    assert data["status"] == "flagged"

    health = client.get("/v1/health")
    assert health.status_code == 200
    assert health.json()["ok"] is True
