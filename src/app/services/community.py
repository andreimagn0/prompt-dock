"""Business logic for community features."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.fork import Fork
from app.models.rating import Rating
from app.models.saved_skill import SavedSkill
from app.models.skill_version import SkillVersion
from app.repository.community import CommunityRepository
from app.schemas.community import (
    CommentCreate,
    CommentUpdate,
    RatingCreate,
    SkillVersionCreate,
)


class CommunityService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CommunityRepository(db)

    def list_comments(self, skill_id: int):
        self._require_skill(skill_id)
        return self.repo.list_comments(skill_id)

    def create_comment(
        self, skill_id: int, user_id: int, data: CommentCreate
    ):
        self._require_skill(skill_id)
        comment = Comment(
            skill_id=skill_id,
            user_id=user_id,
            content=data.content,
        )
        return self.repo.add(comment)

    def update_comment(
        self, comment_id: int, user_id: int, data: CommentUpdate
    ):
        comment = self._require_comment(comment_id)
        self._require_owner(comment.user_id, user_id)
        comment.content = data.content
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def delete_comment(self, comment_id: int, user_id: int):
        comment = self._require_comment(comment_id)
        self._require_owner(comment.user_id, user_id)
        self.repo.delete(comment)

    def create_or_update_rating(
        self, skill_id: int, user_id: int, data: RatingCreate
    ):
        self._require_skill(skill_id)
        rating = self.repo.get_rating(skill_id, user_id)

        if rating:
            rating.value = data.value
            self.db.commit()
            self.db.refresh(rating)
            return rating

        return self.repo.add(
            Rating(
                skill_id=skill_id,
                user_id=user_id,
                value=data.value,
            )
        )

    def save_skill(self, skill_id: int, user_id: int):
        self._require_skill(skill_id)

        if self.repo.get_saved_skill(skill_id, user_id):
            raise HTTPException(
                status_code=409,
                detail="Skill is already saved.",
            )

        return self.repo.add(
            SavedSkill(skill_id=skill_id, user_id=user_id)
        )

    def unsave_skill(self, skill_id: int, user_id: int):
        saved = self.repo.get_saved_skill(skill_id, user_id)
        if not saved:
            raise HTTPException(
                status_code=404,
                detail="Saved skill not found.",
            )
        self.repo.delete(saved)

    def list_saved_skills(self, user_id: int):
        return self.repo.list_saved_skills(user_id)

    def list_versions(self, skill_id: int):
        self._require_skill(skill_id)
        return self.repo.list_versions(skill_id)

    def create_version(
        self, skill_id: int, user_id: int, data: SkillVersionCreate
    ):
        skill = self._require_skill(skill_id)
        self._require_owner(skill.user_id, user_id)

        version = SkillVersion(
            skill_id=skill_id,
            version_number=data.version_number,
            title=data.title,
            description=data.description,
            content=data.content,
            created_by=user_id,
        )

        try:
            return self.repo.add(version)
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Could not create version. Check whether that version number already exists.",
            )

    def create_fork(
        self, original_skill_id: int, forked_skill_id: int, user_id: int
    ):
        original = self._require_skill(original_skill_id)
        forked = self._require_skill(forked_skill_id)

        if not original.is_public and original.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot fork a private skill you do not own.",
            )

        self._require_owner(forked.user_id, user_id)

        return self.repo.add(
            Fork(
                original_skill_id=original_skill_id,
                forked_skill_id=forked_skill_id,
                user_id=user_id,
            )
        )

    def _require_skill(self, skill_id: int):
        skill = self.repo.get_skill(skill_id)
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found.")
        return skill

    def _require_comment(self, comment_id: int):
        comment = self.repo.get_comment(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found.")
        return comment

    @staticmethod
    def _require_owner(owner_id: int, user_id: int):
        if owner_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action.",
            )