from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Response

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import create_access_token, verify_password
from app.core.settings import settings
from app.repository import user as user_repo

from app.schemas.user import UserResponse, UserRegister, UserLogin
from app.schemas.token import Token

router = APIRouter()

# POST /api/auth/register: create an account (hash the password, 409 if the email or username is taken)

@router.post("/auth/register", status_code=201)
def register(
    data: UserRegister,
    db: Annotated[Session, Depends(get_db)]
) -> UserResponse:

    if user_repo.username_taken(db, data.username) or user_repo.email_taken(db, data.email):
        raise HTTPException(status_code=409, detail="Email or username already taken")

    return user_repo.create_user(db, data.username, data.email, data.password)


@router.post("/auth/login", status_code=200)
def login(
    data: UserLogin, 
    response: Response,
    db: Annotated[Session, Depends(get_db)]
) -> Token:
    
    user = user_repo.get_user_by_login(db, data.identifier)

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username/email or password")

    token = create_access_token(user.id)
    response.set_cookie(
        key="access_token", 
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.environment == "production",
        max_age=settings.access_token_expire_minutes * 60,
    )

    return Token(access_token=token)

@router.post("/auth/logout", status_code=204)
def logout(response: Response) -> None: 
    response.delete_cookie("access_token")