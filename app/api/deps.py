import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.repositories import user_repository

logger = logging.getLogger(__name__)

_bearer = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    try:
        payload = decode_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    username: str | None = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = user_repository.find_by_username(db, username)
    if not user or not user.enabled:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or disabled")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: str):
    """Return a dependency that checks the current user has one of the specified roles."""
    def _guard(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return Depends(_guard)


def require_admin() -> User:
    return require_roles("ADMIN")


# Pre-built dependency annotations for common role combos
AdminUser = require_roles("ADMIN")
AdminOrPLM = require_roles("ADMIN", "PLM_MANAGER")
AdminOrPLMOrQuality = require_roles("ADMIN", "PLM_MANAGER", "QUALITY_MANAGER")
AdminOrPurchasing = require_roles("ADMIN", "PURCHASING")
AdminOrQuality = require_roles("ADMIN", "QUALITY_MANAGER")
MutatingUser = require_roles("ADMIN", "PLM_MANAGER", "QUALITY_MANAGER", "PURCHASING")
