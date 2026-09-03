import logging
from datetime import datetime, timedelta, timezone

import jwt
import bcrypt as _bcrypt

from app.core.config import settings

logger = logging.getLogger(__name__)



ALGORITHM = "HS256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return _bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def create_access_token(username: str, role: str, full_name: str | None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(milliseconds=settings.jwt_expiration_ms)
    payload = {
        "sub": username,
        "role": role,
        "fullName": full_name,
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
