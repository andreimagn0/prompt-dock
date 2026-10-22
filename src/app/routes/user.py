from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import verify_password
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserPublic, UserResponse, UserUpdate

router = APIRouter()

# GET / PUT / DELETE /api/users/me: view, update, or delete your own profile (needs a token)

@router.get("/users/me")
def profile(
    current_user: Annotated[User, Depends(get_current_user)]
) -> UserResponse:
    return current_user

@router.put("/users/me")
def update_profile(
    data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> UserResponse:

    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    if data.username and data.username != current_user.username:
        if db.query(User).filter(User.username == data.username).first():
            raise HTTPException(status_code=409, detail="Username already taken")
        current_user.username = data.username

    if data.email and data.email != current_user.email:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=409, detail="Email already taken")
        current_user.email = data.email

    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/users/me")
def delete_profile(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],    
) -> dict:

    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}

# GET /api/users/{id}: public profile, no email shown
@router.get("/users/{id}")
def public_profile(
    id: int, 
    db: Annotated[Session, Depends(get_db)]
) -> UserPublic:

    user = db.get(User, id)
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")

    return user

# THE FOLLOWING IS NOT COMPLETE AND NEEDS SKILL SCHEME IMPLEMENTATION FIRST

# # GET /api/users/{id}/skills: a user's public skills (needs Member 2's Skill model merged first)
# @router.get("/users/{id}/skills")
# def user_skills(
#     id: int,
#     db: Annotated[Session, Depends(get_db)]
# ):
