"""Import every model so each one registers on Base.metadata."""

from app.models.category import Category
from app.models.comment import Comment
from app.models.fork import Fork
from app.models.rating import Rating
from app.models.saved_skill import SavedSkill
from app.models.skill import Skill
from app.models.skill_version import SkillVersion
from app.models.user import User

__all__ = [
    "Category",
    "Comment",
    "Fork",
    "Rating",
    "SavedSkill",
    "Skill",
    "SkillVersion",
    "User",
]