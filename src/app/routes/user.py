from typing import Annotated
from fastapi import APIRouter
from sqlalchemy.orm import Session 

from app.core.auth import verify_password
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserPublic, UserResponse, UserUpdate

router = APIRouter()


