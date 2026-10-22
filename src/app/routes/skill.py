from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies import DbSession, get_current_user
from app.models import Skill, User
from app.repository.category import get_category
from app.repository.skill import (
    create_skill,
    delete_skill,
    get_skill,
    list_public_skills,
    update_skill,
)
from app.schemas.skill import SkillCreate, SkillList, SkillResponse, SkillUpdate

router = APIRouter()

CurrentUser = Annotated[User, Depends(get_current_user)]


# load a skill the current user owns
# 404 if missing, or if private and not theirs (don't reveal it exists); 403 if public and not theirs
def get_owned_skill(db: DbSession, skill_id: int, user: User) -> Skill:
    skill = get_skill(db, skill_id)
    if skill is None or (not skill.is_public and skill.user_id != user.id):
        raise HTTPException(status_code=404, detail="Skill not found")
    if skill.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not the owner of this skill")
    return skill


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


# POST /skills: create a skill owned by the logged-in user (400 if the category doesn't exist)

@router.post("/skills", status_code=201)
def new_skill(data: SkillCreate, db: DbSession, user: CurrentUser) -> SkillResponse:
    if get_category(db, data.category_id) is None:
        raise HTTPException(status_code=400, detail="Category not found")

    return create_skill(db, data, user_id=user.id)


# PUT /skills/{skill_id}: owner edits their skill; only the fields sent change, version goes up by 1

@router.put("/skills/{skill_id}")
def edit_skill(
    skill_id: int, data: SkillUpdate, db: DbSession, user: CurrentUser
) -> SkillResponse:
    skill = get_owned_skill(db, skill_id, user)
    if data.category_id is not None and get_category(db, data.category_id) is None:
        raise HTTPException(status_code=400, detail="Category not found")

    return update_skill(db, skill, data)


# DELETE /skills/{skill_id}: owner deletes their skill; forks stay with parent_skill_id set to null

@router.delete("/skills/{skill_id}")
def remove_skill(skill_id: int, db: DbSession, user: CurrentUser) -> dict[str, str]:
    skill = get_owned_skill(db, skill_id, user)
    delete_skill(db, skill)

    return {"message": "Skill deleted"}
