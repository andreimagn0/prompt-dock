from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.auth import verify_password
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.repository import user as user_repo
from app.repository.skill import list_public_skills
from app.schemas.skill import SkillList
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

    if data.username and data.username != current_user.username and user_repo.username_taken(db, data.username):
        raise HTTPException(status_code=409, detail="Username already taken")

    if data.email and data.email != current_user.email and user_repo.email_taken(db, data.email):
        raise HTTPException(status_code=409, detail="Email already taken")

    return user_repo.update_user(db, current_user, data.username, data.email)

@router.delete("/users/me")
def delete_profile(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],    
) -> dict:

    user_repo.delete_user(db, current_user)
    return {"message": "Account deleted successfully"}

# GET /api/users/{id}: public profile, no email shown
@router.get("/users/{id}")
def public_profile(
    id: int, 
    db: Annotated[Session, Depends(get_db)]
) -> UserPublic:

    user = user_repo.get_user(db, id)
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.get("/users/{id}/skills")
def user_skills(
    id: int,
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
) -> SkillList:
    if not user_repo.get_user(db, id): 
        raise HTTPException(status_code=404, detail="User not found")

    skills, total = list_public_skills(
        db, user_id=id, page=page, limit=limit
    )

    return SkillList(
        data=skills, 
        page=page, 
        limit=limit,
        total=total
    )
