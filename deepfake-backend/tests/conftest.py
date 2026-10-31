import os

os.environ["DATABASE_URL"] = "sqlite:///./test_deepfake.db"
os.environ["SECRET_KEY"] = "test-only-secret-key-which-is-long-enough-123456"
os.environ["UPLOAD_DIR"] = "./test_uploads"
os.environ["COOKIE_SECURE"] = "false"
os.environ["ENVIRONMENT"] = "test"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
