from fastapi import APIRouter
from app.routes import auth, user, category, skill, community

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(user.router)
api_router.include_router(category.router)
api_router.include_router(skill.router)
api_router.include_router(community.router)