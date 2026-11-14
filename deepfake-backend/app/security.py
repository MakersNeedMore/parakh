import secrets
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.config import settings

# Memory-hard hashing: OWASP-aligned parameters (19 MB memory, 2 iterations)
# Prevents memory exhaustion attacks under concurrent login attempts.
_password_hasher = PasswordHasher(time_cost=2, memory_cost=19456, parallelism=1)

# Precomputed dummy hash to ensure constant-time response for non-existent users (anti-enumeration)
_DUMMY_PASSWORD_HASH = _password_hasher.hash("dummy_constant_timing_secret_password")

# In-memory revocation cache for logged-out tokens
_REVOKED_TOKENS: set[str] = set()


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def dummy_verify_password(password: str) -> None:
    """Execute constant-time verification when an account is not found to prevent timing-based enumeration."""
    try:
        _password_hasher.verify(_DUMMY_PASSWORD_HASH, password)
    except Exception:
        pass


def revoke_token(token: str | None) -> None:
    if token:
        _REVOKED_TOKENS.add(token)


def is_token_revoked(token: str | None) -> bool:
    return bool(token and token in _REVOKED_TOKENS)


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "jti": secrets.token_hex(16),
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_minutes),
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> str | None:
    if is_token_revoked(token):
        return None
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        return user_id if isinstance(user_id, str) and user_id else None
    except jwt.PyJWTError:
        return None
