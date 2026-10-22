from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query

from app.core.dependencies import DbSession
from app.repository.skill import list_public_skills
from app.schemas.skill import SkillList

router = APIRouter()

# GET /skills: browse, search, filter, sort, and page through public skills
# rating and trending are in the API spec but need reviews; they return 400 for now

@router.get("/skills")
def browse_skills(
    db: DbSession,
    search: str | None = None,
    category_id: int | None = None,
    sort: Literal["newest", "oldest", "title", "rating", "trending"] = "newest",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
) -> SkillList:
    try:
        skills, total = list_public_skills(
            db,
            search=search,
            category_id=category_id,
            sort=sort,
            page=page,
            limit=limit,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Sort not supported yet")

    return SkillList(data=skills, page=page, limit=limit, total=total)
