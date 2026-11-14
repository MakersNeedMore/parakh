"""Parakh Forensic Inference & Authentication Backend.

Unified entry point. Automatically exposes the complete DeepGuard
AI/ML model (KoreaPeter/ms-eff-gcvit-deepfake-b0-ff-plus-plus) with full
Argon2id authentication, SQLite/PostgreSQL database models, and dual
route compatibility (/api/v1/... and /...) from deepfake-backend.
"""
import os
import sys

_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_BACKEND_DIR = os.path.join(_PROJECT_ROOT, "deepfake-backend")
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

# Expose FastAPI application instance from deepfake-backend
from app.main import app  # noqa: F401

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True, app_dir=_BACKEND_DIR)
