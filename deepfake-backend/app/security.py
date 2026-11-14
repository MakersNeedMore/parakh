import secrets
import threading
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.config import settings

# Memory-hard hashing: OWASP-aligned parameters (19 MB memory, 2 iterations)
_password_hasher = PasswordHasher(time_cost=2, memory_cost=19456, parallelism=1)

# Concurrency cap on password hashing (max 4 concurrent hashes = ~76 MB total RAM peak)
_HASH_SEMAPHORE = threading.BoundedSemaphore(4)

# Precomputed dummy hash to ensure constant-time response for non-existent users (anti-enumeration)
_DUMMY_PASSWORD_HASH = _password_hasher.hash("dummy_constant_timing_secret_password")

# In-memory revocation cache mapping token string to expiration timestamp (with auto-pruning)
_REVOKED_TOKENS: dict[str, float] = {}
_REVOCATION_LOCK = threading.Lock()


def hash_password(password: str) -> str:
    with _HASH_SEMAPHORE:
        return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        with _HASH_SEMAPHORE:
            return _password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def dummy_verify_password(password: str) -> None:
    """Execute constant-time verification when an account is not found to prevent timing-based enumeration."""
    try:
        with _HASH_SEMAPHORE:
            _password_hasher.verify(_DUMMY_PASSWORD_HASH, password)
    except Exception:
        pass


def revoke_token(token: str | None) -> None:
    if not token:
        return
    now = datetime.now(timezone.utc).timestamp()
    with _REVOCATION_LOCK:
        # Periodic pruning of expired entries to prevent unbounded memory growth
        if len(_REVOKED_TOKENS) > 500:
            expired = [t for t, exp in _REVOKED_TOKENS.items() if exp < now]
            for t in expired:
                _REVOKED_TOKENS.pop(t, None)
        token_exp = now + (settings.access_token_minutes * 60)
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            if "exp" in unverified:
                token_exp = float(unverified["exp"])
        except Exception:
            pass
        _REVOKED_TOKENS[token] = token_exp


def is_token_revoked(token: str | None) -> bool:
    if not token:
        return False
    with _REVOCATION_LOCK:
        exp = _REVOKED_TOKENS.get(token)
        if exp is None:
            return False
        if exp < datetime.now(timezone.utc).timestamp():
            _REVOKED_TOKENS.pop(token, None)
            return False
        return True


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
