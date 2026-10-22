"""Database operations for categories."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category


def list_categories(db: Session) -> list[Category]:
    """Return every category, sorted by name."""

    return list(db.scalars(select(Category).order_by(Category.name)))


def get_category(db: Session, category_id: int) -> Category | None:
    """Return one category, or None if it doesn't exist."""

    return db.get(Category, category_id)
