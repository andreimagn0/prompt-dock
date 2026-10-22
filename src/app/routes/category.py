from fastapi import APIRouter, HTTPException

from app.core.dependencies import DbSession
from app.repository.category import get_category, list_categories
from app.repository.skill import list_public_skills
from app.schemas.category import CategoryResponse, CategoryWithSkills

router = APIRouter()

# GET /categories: every category, sorted by name

@router.get("/categories")
def browse_categories(db: DbSession) -> list[CategoryResponse]:
    return list_categories(db)


# GET /categories/{category_id}: one category and its public skills (404 if missing)

@router.get("/categories/{category_id}")
def category_detail(category_id: int, db: DbSession) -> CategoryWithSkills:
    category = get_category(db, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    # public only: category.skills would also include private skills
    skills, _ = list_public_skills(db, category_id=category_id, limit=None)

    return CategoryWithSkills(
        id=category.id,
        name=category.name,
        description=category.description,
        skills=skills,
    )
