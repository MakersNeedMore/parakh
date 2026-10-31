from functools import lru_cache
from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Parakh Deepfake Detection API"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    secret_key: str = "insecure-development-secret-change-before-deploying"
    access_token_minutes: int = 30
    algorithm: str = "HS256"
    database_url: str = "sqlite:///./deepfake.db"
    upload_dir: Path = Path("./uploads")
    cors_origins: str = "http://localhost:3000,http://localhost:5173,https://anuragverma0907.github.io,https://parakh.xyz,https://pixpect.xyz"
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

    @field_validator("fake_threshold")
    @classmethod
    def validate_threshold(cls, value: float) -> float:
        if not 0.0 < value < 1.0:
            raise ValueError("FAKE_THRESHOLD must be between 0 and 1")
        return value

    @model_validator(mode="after")
    def validate_prod_settings(self):
        if self.environment.lower() == "production":
            if len(self.secret_key) < 32 or self.secret_key.startswith("insecure-") or "replace-this" in self.secret_key:
                raise ValueError("Set a unique SECRET_KEY of at least 32 characters in production")
            if not self.cookie_secure:
                raise ValueError("COOKIE_SECURE=true is required in production")
            if self.cookie_samesite == "none" and not self.cookie_secure:
                raise ValueError("SameSite=None requires Secure cookies")
            if "*" in self.cors_origin_list:
                raise ValueError("Wildcard CORS origins are not allowed in production")
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
