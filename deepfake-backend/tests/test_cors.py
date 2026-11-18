

def test_github_pages_origin_is_allowed_for_api_preflight(client):
    origin = "https://anuragverma0907.github.io"
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == origin
    assert response.headers.get("access-control-allow-credentials") == "true"


import pytest


@pytest.mark.parametrize("origin", ["https://parakh.xyz", "https://www.parakh.xyz"])
def test_parakh_apex_and_www_origins_are_allowed(client, origin):
    response = client.options(
        "/v1/detect/ai-generated",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization",
        },
    )
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == origin


def test_unknown_origin_is_rejected(client):
    response = client.options(
        "/v1/detect/ai-generated",
        headers={"Origin": "https://parakh.xyz.evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert response.headers.get("access-control-allow-origin") is None
