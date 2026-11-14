import os
import secrets
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_REPO_ROOT = _BACKEND_DIR.parent
_ENV_SEARCH_PATHS = (
    ".env",
    str(_REPO_ROOT / "backend" / ".env"),
    str(_REPO_ROOT / ".env"),
    str(_BACKEND_DIR / ".env"),
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_SEARCH_PATHS,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Parakh Deepfake Detection API"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    secret_key: str = "insecure-development-secret-change-before-deploying"
    access_token_minutes: int = 30
    algorithm: str = "HS256"
    database_url: str = "sqlite:///./deepfake.db"
    upload_dir: Path = Path("./uploads")
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:8000,http://127.0.0.1:8000,http://localhost:5173,https://anuragverma0907.github.io,https://parakh.xyz,https://pixpect.xyz"
    cookie_name: str = "deepfake_access"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    max_image_mb: int = 15
    max_video_mb: int = 100
    max_image_pixels: int = 40_000_000
    max_video_seconds: int = 180
    max_video_samples: int = 24
    default_video_samples: int = 12
    fake_threshold: float = 0.5
    deepfake_model_id: str = "KoreaPeter/ms-eff-gcvit-deepfake-b0-ff-plus-plus"
    model_revision: str | None = "fc6fc9594ae35a6880ffa3f8e128239968703a25"
    hf_token: str | None = None
    model_device: str = "auto"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @field_validator("cookie_samesite")
    @classmethod
    def validate_samesite(cls, value: str) -> str:
        value = value.lower()
        if value not in {"lax", "strict", "none"}:
            raise ValueError("COOKIE_SAMESITE must be lax, strict, or none")
        return value

    @field_validator("upload_dir", mode="after")
    @classmethod
    def resolve_upload_dir(cls, value: Path) -> Path:
        if not value.is_absolute():
            backend_root = Path(__file__).resolve().parent.parent
            return (backend_root / value).resolve()
        return value

    @field_validator("database_url", mode="after")
    @classmethod
    def resolve_sqlite_db(cls, value: str) -> str:
        if value.startswith("sqlite:///./"):
            rel_file = value.replace("sqlite:///./", "")
            backend_root = Path(__file__).resolve().parent.parent
            abs_path = (backend_root / rel_file).resolve().as_posix()
            return f"sqlite:///{abs_path}"
        return value

    @field_validator("fake_threshold")
    @classmethod
    def validate_threshold(cls, value: float) -> float:
        if not 0.0 < value < 1.0:
            raise ValueError("FAKE_THRESHOLD must be between 0 and 1")
        return value

    @model_validator(mode="after")
    def validate_prod_settings(self):
        env = self.environment.lower()
        is_prod = env in {"production", "prod", "live", "staging"}
        is_insecure_key = (
            len(self.secret_key) < 32
            or self.secret_key.startswith("insecure-")
            or "replace-this" in self.secret_key
        )
        if is_prod and is_insecure_key:
            raise ValueError("Set a unique SECRET_KEY of at least 32 characters in production environments")
        if is_prod:
            if not self.cookie_secure:
                raise ValueError("COOKIE_SECURE=true is required in production environments")
            if self.cookie_samesite == "none" and not self.cookie_secure:
                raise ValueError("SameSite=None requires Secure cookies")
            if "*" in self.cors_origin_list:
                raise ValueError("Wildcard CORS origins are not allowed in production environments")
        elif is_insecure_key:
            # For non-production or default deploys without an explicit SECRET_KEY,
            # generate an ephemeral random 256-bit key on startup so tokens cannot
            # be forged using the public repository placeholder string.
            self.secret_key = secrets.token_hex(32)
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
