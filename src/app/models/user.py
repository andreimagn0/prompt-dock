
"""User database model."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    username: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Skills created by this user
    skills = relationship(
        "Skill",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # Community feature relationships
    comments = relationship("Comment", back_populates="user")
    ratings = relationship("Rating", back_populates="user")
    saved_skills = relationship("SavedSkill", back_populates="user")
    versions = relationship("SkillVersion", back_populates="creator")
    forks = relationship("Fork", back_populates="user")
