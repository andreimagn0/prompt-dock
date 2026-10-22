from pydantic import BaseModel, ConfigDict

from app.schemas.skill import SkillResponse

# what the API returns for one category
class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True) # lets this read from a SQLAlchemy object
    id: int
    name: str
    description: str | None = None

# one category plus its skills
# the route must pass public skills only; category.skills also holds private ones
class CategoryWithSkills(CategoryResponse):
    skills: list[SkillResponse]
