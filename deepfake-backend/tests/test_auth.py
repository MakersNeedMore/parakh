def register(client, email="student@example.com", password="VeryStrongPassword123!"):
    return client.post("/api/v1/auth/register", json={"email": email, "password": password})


def test_register_login_and_me(client):
    response = register(client)
    assert response.status_code == 201, response.text
    assert response.json()["user"]["email"] == "student@example.com"
    assert "deepfake_access" in response.headers.get("set-cookie", "")
    assert response.json()["access_token"]

    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "student@example.com"

    logout = client.post("/api/v1/auth/logout")
    assert logout.status_code == 204
    assert client.get("/api/v1/auth/me").status_code == 401

    login = client.post("/api/v1/auth/login", json={"email": "STUDENT@example.com", "password": "VeryStrongPassword123!"})
    assert login.status_code == 200, login.text
    assert client.get("/api/v1/auth/me").status_code == 200


def test_duplicate_email_is_rejected(client):
    assert register(client).status_code == 201
    duplicate = register(client, email="STUDENT@example.com")
    assert duplicate.status_code == 409


def test_invalid_credentials_do_not_authenticate(client):
    assert register(client).status_code == 201
    client.post("/api/v1/auth/logout")
    response = client.post("/api/v1/auth/login", json={"email": "student@example.com", "password": "wrong password"})
    assert response.status_code == 401
    assert client.get("/api/v1/auth/me").status_code == 401


def test_detection_requires_auth(client):
    response = client.get("/api/v1/detections")
    assert response.status_code == 401
