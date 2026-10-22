"""Reusable FastAPI dependencies."""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.settings import settings
from app.models.user import User

DbSession = Annotated[Session, Depends(get_db)]

bearer = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(creds.credentials, settings.secret_key, algorithms=[settings.algorithm])
        user = db.get(User, int(payload["sub"]))
    except Exception:
        user = None
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user