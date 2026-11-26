"""Reusable FastAPI dependencies."""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.settings import settings
from app.models.user import User

DbSession = Annotated[Session, Depends(get_db)]

bearer = HTTPBearer(auto_error=False)


def _user_from_token(request: Request, creds: HTTPAuthorizationCredentials | None, db: Session) -> User | None:
    """Find the user from the Authorization header, or from the login cookie."""

    token = creds.credentials if creds else request.cookies.get("access_token")
    if token is None:
        return None
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return db.get(User, int(payload["sub"]))
    except Exception:
        return None


def get_current_user(
        request: Request,
        creds: HTTPAuthorizationCredentials | None = Depends(bearer),
        db: Session = Depends(get_db)
    ) -> User:

    user = _user_from_token(request, creds, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


def get_optional_user(
        request: Request,
        creds: HTTPAuthorizationCredentials | None = Depends(bearer),
        db: Session = Depends(get_db)
    ) -> User | None:

    """Like get_current_user, but returns None instead of a 401 when there is no valid token"""

    return _user_from_token(request, creds, db)