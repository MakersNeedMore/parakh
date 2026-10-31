from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: str
    email: EmailStr
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    user: UserOut
    message: str
    access_token: str | None = None


class FrameResult(BaseModel):
    frame_index: int
    timestamp_seconds: float
    fake_probability: float | None
    verdict: Literal["likely_manipulated", "likely_authentic", "not_scored"]
    note: str | None = None


class SuspiciousSegment(BaseModel):
    start_seconds: float
    end_seconds: float
    peak_fake_probability: float
    sampled_frames: int


class DetectionOut(BaseModel):
    id: str
    media_type: Literal["image", "video"]
    original_filename: str
    status: Literal["queued", "processing", "completed", "failed"]
    verdict: str | None = None
    fake_probability: float | None = None
    model_id: str
    total_frames: int
    scored_frames: int
    duration_seconds: float | None = None
    frame_results: list[FrameResult] | None = None
    suspicious_segments: list[SuspiciousSegment] | None = None
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)
