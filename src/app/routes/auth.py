from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()

# POST /api/auth/register: create an account (hash the password, 409 if the email or username is taken)

@router.post("/auth/register")
async def register():
    return {"message": "User registered successfully"}


@router.post("/auth/login")
async def login():
    return {"message": "User logged in successfully"}


# GET / PUT / DELETE /api/users/me: view, update, or delete your own profile (needs a token)

@router.get("/users/me")
async def profile(
    current_user: Annotated[User, Depends(get_current_user)]
) -> UserResponse:
    return current_user

@router.put("/users/me")
async def update_profile(
    current_user: Annotated[User, Depends(get_current_user)]
) -> UserResponse:
    return current_user

@router.delete("/users/me")
async def delete_profile(
    current_user: Annotated[User, Depends(get_current_user)]
) -> UserResponse:
    return current_user

# GET /api/users/{id}: public profile, no email shown
@router.get("/users/{id}")
async def public_profile(id: int):
    return {"message": f"Public profile for user {id} retrieved successfully"} 

# GET /api/users/{id}/skills: a user's public skills (needs Member 2's Skill model merged first)
@router.get("/users/{id}/skills")
async def user_skills(id: int):
    return {"message": f"Public skills for user {id} retrieved successfully"}
