"""Records of forked skills."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Fork(Base):
    __tablename__ = "forks"
    __table_args__ = (
        UniqueConstraint(
            "original_skill_id",
            "forked_skill_id",
            name="uq_original_forked_skill",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    original_skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id"), nullable=False, index=True
    )
    forked_skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id"), nullable=False, unique=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    original_skill = relationship("Skill", foreign_keys=[original_skill_id])
    forked_skill = relationship("Skill", foreign_keys=[forked_skill_id])
    user = relationship("User", back_populates="forks")