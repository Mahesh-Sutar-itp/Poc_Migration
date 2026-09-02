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


def _make_role_guard(*roles: str):
    """Create a dependency function that checks the user has one of the specified roles."""
    def _guard(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    _guard.__name__ = f"require_{'_'.join(r.lower() for r in roles)}"
    return _guard


_admin_guard = _make_role_guard("ADMIN")
_admin_or_plm_guard = _make_role_guard("ADMIN", "PLM_MANAGER")
_admin_or_plm_or_quality_guard = _make_role_guard("ADMIN", "PLM_MANAGER", "QUALITY_MANAGER")
_admin_or_purchasing_guard = _make_role_guard("ADMIN", "PURCHASING")
_admin_or_quality_guard = _make_role_guard("ADMIN", "QUALITY_MANAGER")
_mutating_guard = _make_role_guard("ADMIN", "PLM_MANAGER", "QUALITY_MANAGER", "PURCHASING")

# Use these as Annotated types in route signatures
AdminUser = Annotated[User, Depends(_admin_guard)]
AdminOrPLM = Annotated[User, Depends(_admin_or_plm_guard)]
AdminOrPLMOrQuality = Annotated[User, Depends(_admin_or_plm_or_quality_guard)]
AdminOrPurchasing = Annotated[User, Depends(_admin_or_purchasing_guard)]
AdminOrQuality = Annotated[User, Depends(_admin_or_quality_guard)]
MutatingUser = Annotated[User, Depends(_mutating_guard)]
