from fastapi import APIRouter
from app.routes import category, skill

api_router = APIRouter()
api_router.include_router(category.router)
api_router.include_router(skill.router)
