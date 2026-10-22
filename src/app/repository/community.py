"""Database operations for community features."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.fork import Fork
from app.models.rating import Rating
from app.models.saved_skill import SavedSkill
from app.models.skill import Skill
from app.models.skill_version import SkillVersion


class CommunityRepository:
    """Database queries for versions, forks, comments, ratings, and saved skills."""

    def __init__(self, db: Session):
        self.db = db

    def get_skill(self, skill_id: int):
        return self.db.get(Skill, skill_id)

    def get_comment(self, comment_id: int):
        return self.db.get(Comment, comment_id)

    def get_rating(self, skill_id: int, user_id: int):
        statement = select(Rating).where(
            Rating.skill_id == skill_id,
            Rating.user_id == user_id,
        )
        return self.db.scalar(statement)

    def get_saved_skill(self, skill_id: int, user_id: int):
        statement = select(SavedSkill).where(
            SavedSkill.skill_id == skill_id,
            SavedSkill.user_id == user_id,
        )
        return self.db.scalar(statement)

    def list_comments(self, skill_id: int):
        statement = (
            select(Comment)
            .where(Comment.skill_id == skill_id)
            .order_by(Comment.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def list_versions(self, skill_id: int):
        statement = (
            select(SkillVersion)
            .where(SkillVersion.skill_id == skill_id)
            .order_by(SkillVersion.version_number.desc())
        )
        return list(self.db.scalars(statement).all())

    def list_saved_skills(self, user_id: int):
        statement = (
            select(SavedSkill)
            .where(SavedSkill.user_id == user_id)
            .order_by(SavedSkill.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def add(self, record):
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def delete(self, record):
        self.db.delete(record)
        self.db.commit()
