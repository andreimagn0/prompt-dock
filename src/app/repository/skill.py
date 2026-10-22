"""Database operations for skills: discovery and management."""

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Skill
from app.schemas.skill import SkillCreate, SkillUpdate

# rating and trending need reviews; add them here once the Review model exists
SORTS = {
    "newest": (Skill.created_at.desc(), Skill.id.desc()),
    "oldest": (Skill.created_at.asc(), Skill.id.asc()),
    "title": (Skill.title.asc(), Skill.id.asc()),
}


def get_skill(db: Session, skill_id: int) -> Skill | None:
    """Return one skill of any visibility, or None if it doesn't exist."""

    return db.get(Skill, skill_id)


def list_public_skills(
    db: Session,
    *,
    search: str | None = None,
    category_id: int | None = None,
    user_id: int | None = None,
    sort: str = "newest",
    page: int = 1,
    limit: int = 10,
) -> tuple[list[Skill], int]:
    """Return one page of public skills and the total number that match."""

    if sort not in SORTS:
        raise ValueError(f"Unsupported sort: {sort}")

    filters = [Skill.is_public.is_(True)]
    if search:
        pattern = f"%{search}%"
        filters.append(
            or_(Skill.title.ilike(pattern), Skill.description.ilike(pattern))
        )
    if category_id is not None:
        filters.append(Skill.category_id == category_id)
    if user_id is not None:
        filters.append(Skill.user_id == user_id)

    total = db.scalar(select(func.count()).select_from(Skill).where(*filters))
    skills = db.scalars(
        select(Skill)
        .where(*filters)
        .order_by(*SORTS[sort])
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return list(skills), total


def create_skill(db: Session, data: SkillCreate, user_id: int) -> Skill:
    """Save a new skill owned by user_id."""

    skill = Skill(**data.model_dump(), user_id=user_id)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


def update_skill(db: Session, skill: Skill, data: SkillUpdate) -> Skill:
    """Apply only the fields that were sent, and bump the version number."""

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(skill, field, value)
    skill.current_version += 1
    db.commit()
    db.refresh(skill)
    return skill


def delete_skill(db: Session, skill: Skill) -> None:
    """Delete a skill. Its forks stay, with parent_skill_id set to null."""

    db.delete(skill)
    db.commit()
