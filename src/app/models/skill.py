from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..core.database import Base
from datetime import datetime, timezone

class Skill(Base):
    __tablename__ = 'skills'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    current_version = Column(Integer, nullable=False, default=1)
    created_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
    is_public = Column(Integer, nullable=False, default=1)  # 1 for public, 0 for private


    # relationships
    parent_skill_id = Column(Integer, ForeignKey('skills.id'), nullable=True)
    parent_skill = relationship("Skill", remote_side=[id], backref="forks")

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user = relationship("User", back_populates="skills")

    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    category = relationship("Category", back_populates="skills")
