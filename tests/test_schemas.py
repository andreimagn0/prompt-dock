from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.models import Category, Skill, User
from app.schemas.category import CategoryResponse, CategoryWithSkills
from app.schemas.skill import SkillCreate, SkillList, SkillResponse, SkillUpdate

NOW = datetime(2026, 10, 21, tzinfo=timezone.utc)

SKILL_KEYS = {
    "id",
    "title",
    "description",
    "content",
    "current_version",
    "parent_skill_id",
    "user_id",
    "category_id",
    "is_public",
    "average_rating",
    "created_at",
    "updated_at",
}


def make_skill() -> Skill:
    owner = User(
        id=1,
        username="andrei",
        email="andrei@example.com",
        password_hash="hashed",
    )
    return Skill(
        id=1,
        title="Summarize",
        description="Summarizes text",
        content="Summarize the following:",
        current_version=1,
        is_public=True,
        user_id=1,
        category_id=1,
        parent_skill_id=None,
        created_at=NOW,
        updated_at=NOW,
        user=owner,
    )


def test_skill_create_defaults_to_public() -> None:
    skill = SkillCreate(
        title="Summarize",
        description="Summarizes text",
        content="Summarize the following:",
        category_id=1,
    )

    assert skill.is_public is True


def test_skill_create_requires_content() -> None:
    with pytest.raises(ValidationError):
        SkillCreate(title="Summarize", description="Summarizes text", category_id=1)


def test_skill_create_rejects_long_title() -> None:
    with pytest.raises(ValidationError):
        SkillCreate(
            title="x" * 101,
            description="Summarizes text",
            content="Summarize the following:",
            category_id=1,
        )


def test_skill_create_ignores_client_owner() -> None:
    skill = SkillCreate(
        title="Summarize",
        description="Summarizes text",
        content="Summarize the following:",
        category_id=1,
        user_id=99,
    )

    assert "user_id" not in skill.model_dump()


def test_skill_update_only_dumps_fields_sent() -> None:
    update = SkillUpdate(title="New title")

    assert update.model_dump(exclude_unset=True) == {"title": "New title"}


def test_skill_response_excludes_private_fields() -> None:
    data = SkillResponse.model_validate(make_skill()).model_dump()

    assert set(data) == SKILL_KEYS
    assert data["average_rating"] is None
    assert "andrei@example.com" not in str(data)
    assert "hashed" not in str(data)


def test_category_response_reads_from_model() -> None:
    category = Category(id=1, name="Writing", description=None)

    data = CategoryResponse.model_validate(category).model_dump()

    assert data == {"id": 1, "name": "Writing", "description": None}


def test_category_with_skills_includes_skills() -> None:
    detail = CategoryWithSkills(
        id=1,
        name="Writing",
        description=None,
        skills=[SkillResponse.model_validate(make_skill())],
    )

    assert [skill.title for skill in detail.skills] == ["Summarize"]


def test_skill_list_holds_page_info() -> None:
    page = SkillList(
        data=[SkillResponse.model_validate(make_skill())],
        page=1,
        limit=10,
        total=1,
    )

    assert page.model_dump(include={"page", "limit", "total"}) == {
        "page": 1,
        "limit": 10,
        "total": 1,
    }
    assert len(page.data) == 1
