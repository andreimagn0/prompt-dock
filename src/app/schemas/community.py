"""Request and response schemas for community features."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SkillVersionCreate(BaseModel):
    version_number: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=100)
    description: str | None = None
    content: str | None = None


class SkillVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill_id: int
    version_number: int
    title: str
    description: str | None
    content: str | None
    created_by: int
    created_at: datetime


class ForkCreate(BaseModel):
    original_skill_id: int = Field(gt=0)
    forked_skill_id: int = Field(gt=0)


class ForkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_skill_id: int
    forked_skill_id: int
    user_id: int
    created_at: datetime


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class CommentUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill_id: int
    user_id: int
    content: str
    created_at: datetime
    updated_at: datetime


class RatingCreate(BaseModel):
    value: int = Field(ge=1, le=5)


class RatingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill_id: int
    user_id: int
    value: int
    created_at: datetime
    updated_at: datetime


class SavedSkillCreate(BaseModel):
    skill_id: int = Field(gt=0)


class SavedSkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    skill_id: int
    created_at: datetime
