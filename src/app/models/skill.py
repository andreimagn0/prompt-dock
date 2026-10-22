"""Skill model: a prompt or AI skill owned by a user and filed under a category."""

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    current_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_public: Mapped[bool] = mapped_column(default=True, nullable=False)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"), nullable=False, index=True
    )
    parent_skill_id: Mapped[int | None] = mapped_column(
        ForeignKey("skills.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="skills")
    category: Mapped["Category"] = relationship(back_populates="skills")

    # Parent skill and its forks
    parent_skill: Mapped["Skill | None"] = relationship(
        "Skill", remote_side="Skill.id", back_populates="forked_skills"
    )
    forked_skills: Mapped[list["Skill"]] = relationship(
        "Skill", back_populates="parent_skill"
    )

    # Community feature relationships
    versions = relationship(
        "SkillVersion", back_populates="skill", cascade="all, delete-orphan"
    )
    comments = relationship(
        "Comment", back_populates="skill", cascade="all, delete-orphan"
    )
    ratings = relationship(
        "Rating", back_populates="skill", cascade="all, delete-orphan"
    )
    saved_by = relationship(
        "SavedSkill", back_populates="skill", cascade="all, delete-orphan"
    )