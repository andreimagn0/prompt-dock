from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import create_access_token, verify_password
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
    db: Annotated[Session, Depends(get_db)]
) -> Token:
    
    user = user_repo.get_user_by_login(db, data.identifier)

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username/email or password")

    return Token(access_token=create_access_token(user.id))