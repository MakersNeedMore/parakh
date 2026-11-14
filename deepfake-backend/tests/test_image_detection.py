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


def test_unauthenticated_upload_rejected_early(client):
    # Early middleware check rejects unauthenticated uploads immediately
    response = client.post("/api/v1/detections/image", files={"file": ("sample.jpg", b"123", "image/jpeg")})
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_tiny_image_rejected(client):
    reg = client.post("/api/v1/auth/register", json={"email": "tiny@example.com", "password": "StrongPassword123!"})
    token = reg.json()["access_token"]
    buffer = BytesIO()
    # 10x10 image is too small to contain a detectable human face
    Image.new("RGB", (10, 10), (120, 120, 120)).save(buffer, format="JPEG")
    buffer.seek(0)
    response = client.post(
        "/api/v1/detections/image",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("tiny.jpg", buffer.getvalue(), "image/jpeg")},
    )
    assert response.status_code == 422
    assert "too small" in response.json()["detail"]


def test_mp4_magic_bytes_must_be_at_offset_4(client):
    reg = client.post("/api/v1/auth/register", json={"email": "mp4test@example.com", "password": "StrongPassword123!"})
    token = reg.json()["access_token"]
    # Malicious payload with "ftyp" placed at byte 20 instead of offset 4
    junk_payload = b"\x00" * 20 + b"ftyp" + b"\x00" * 40
    response = client.post(
        "/api/v1/detections/video",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("fake.mp4", junk_payload, "video/mp4")},
    )
    assert response.status_code == 422
    assert "media signature" in response.json()["detail"]


def test_image_upload_rejects_spoofed_magic_bytes(client):
    reg = client.post("/api/v1/auth/register", json={"email": "spoof@example.com", "password": "StrongPassword123!"})
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    # Malicious file disguised as JPEG
    response = client.post(
        "/api/v1/detections/image",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("malicious.jpg", b"NOT_A_REAL_JPEG_IMAGE_PAYLOAD", "image/jpeg")},
    )
    assert response.status_code == 422
    assert "media signature" in response.json()["detail"]


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

    # Test alternate prefixed path and 'file' parameter compatibility
    res_prefixed = client.post("/api/v1/detect/ai-generated", files={"file": ("face.png", buffer.getvalue(), "image/png")})
    assert res_prefixed.status_code == 200
    assert res_prefixed.json()["score"] == 85


def test_root_path_detection_routes(monkeypatch, client):
    reg = client.post("/auth/register", json={"email": "rootroutes@example.com", "password": "Password12345!"})
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    def fake_analysis(path):
        return {
            "verdict": "likely_authentic",
            "fake_probability": 0.05,
            "model_id": "test-model",
            "total_frames": 1,
            "scored_frames": 1,
            "duration_seconds": 1.0,
            "frame_results": [{"frame_index": 0, "timestamp_seconds": 0.0, "fake_probability": 0.05, "verdict": "likely_authentic", "note": None}],
            "suspicious_segments": [],
        }

    monkeypatch.setattr("app.main.analyze_image_path", fake_analysis)
    buffer = BytesIO()
    Image.new("RGB", (100, 100), (200, 100, 50)).save(buffer, format="JPEG")
    buffer.seek(0)

    # Post detection at root path /detections/image
    created = client.post("/detections/image", headers=headers, files={"file": ("face.jpg", buffer.getvalue(), "image/jpeg")})
    assert created.status_code == 201
    det_id = created.json()["id"]

    # Test root GET /detections/{id}
    get_res = client.get(f"/detections/{det_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == det_id

    # Test root GET /detections/{id}/frames
    frames_res = client.get(f"/detections/{det_id}/frames", headers=headers)
    assert frames_res.status_code == 200
    assert len(frames_res.json()["frames"]) == 1

    # Test root GET /detections/{id}/timeline
    tl_res = client.get(f"/detections/{det_id}/timeline", headers=headers)
    assert tl_res.status_code == 200
    assert "duration_seconds" in tl_res.json()

    # Test root DELETE /detections/{id}
    del_res = client.delete(f"/detections/{det_id}", headers=headers)
    assert del_res.status_code == 204
    assert client.get(f"/detections/{det_id}", headers=headers).status_code == 404
