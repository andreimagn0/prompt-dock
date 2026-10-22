from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import hash_password, create_access_token, verify_password
from app.models.user import User

from app.schemas.user import UserResponse, UserRegister, UserLogin
from app.schemas.token import Token

router = APIRouter()

# POST /api/auth/register: create an account (hash the password, 409 if the email or username is taken)

@router.post("/auth/register", status_code=201)
def register(
    data: UserRegister,
    db: Annotated[Session, Depends(get_db)]
) -> UserResponse:

    taken = db.query(User).filter(or_(User.email == data.email, User.username == data.username)).first()
    if taken: 
        raise HTTPException(status_code=409, detail="Email or username already taken")

    user = User(username=data.username, email=data.email, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/auth/login", status_code=200)
def login(
    data: UserLogin, 
    db: Annotated[Session, Depends(get_db)]
) -> Token:
    
    user = db.query(User).filter(or_(User.email == data.identifier, User.username == data.identifier)).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username/email or password")

    return Token(access_token=create_access_token(user.id))