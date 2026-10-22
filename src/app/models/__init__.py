"""Import every model so each one registers on Base.metadata."""

from app.models.category import Category
from app.models.skill import Skill
from app.models.user import User

__all__ = ["Category", "Skill", "User"]
