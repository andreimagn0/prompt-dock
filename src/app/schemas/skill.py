from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# create a new skill
# owner, version, and fork parent are set by the server, never by the client
class SkillCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1)
    content: str = Field(min_length=1)
    category_id: int
    is_public: bool = True

# edit a skill; only the fields sent are changed
class SkillUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=1)
    content: str | None = Field(default=None, min_length=1)
    category_id: int | None = None
    is_public: bool | None = None

# what the API returns for one skill (detail view and each list item)
# lists fields explicitly so the owner's private user data is never included
class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True) # lets this read from a SQLAlchemy object
    id: int
    title: str
    description: str
    content: str
    current_version: int
    parent_skill_id: int | None
    user_id: int
    category_id: int
    is_public: bool
    average_rating: float | None = None # calculated from reviews, not stored
    created_at: datetime
    updated_at: datetime

# one page of skills
class SkillList(BaseModel):
    data: list[SkillResponse]
    page: int
    limit: int
    total: int
