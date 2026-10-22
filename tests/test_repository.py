from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.models import Category, Skill, User
from app.repository.category import get_category, list_categories
from app.repository.skill import (
    create_skill,
    delete_skill,
    get_skill,
    list_public_skills,
    update_skill,
)
from app.schemas.skill import SkillCreate, SkillUpdate


@pytest.fixture
def session(tmp_path) -> Generator[Session, None, None]:
    temp_engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    Base.metadata.create_all(temp_engine)

    session = sessionmaker(bind=temp_engine)()
    yield session

    session.close()
    temp_engine.dispose()


def make_user(session: Session, username: str = "andrei") -> User:
    user = User(
        username=username,
        email=f"{username}@example.com",
        password_hash="hashed",
    )
    session.add(user)
    session.commit()
    return user


def make_category(session: Session, name: str = "Writing") -> Category:
    category = Category(name=name)
    session.add(category)
    session.commit()
    return category


def new_skill(
    session: Session,
    user: User,
    category: Category,
    title: str = "Summarize",
    description: str = "Summarizes text",
    is_public: bool = True,
) -> Skill:
    data = SkillCreate(
        title=title,
        description=description,
        content="Prompt text",
        category_id=category.id,
        is_public=is_public,
    )
    return create_skill(session, data, user_id=user.id)


def test_list_categories_sorted_by_name(session: Session) -> None:
    make_category(session, "Writing")
    make_category(session, "Coding")

    assert [c.name for c in list_categories(session)] == ["Coding", "Writing"]


def test_get_category_unknown_returns_none(session: Session) -> None:
    assert get_category(session, 999) is None


def test_create_skill_sets_owner_and_version(session: Session) -> None:
    user = make_user(session)
    skill = new_skill(session, user, make_category(session))

    assert skill.id is not None
    assert skill.user_id == user.id
    assert skill.current_version == 1
    assert get_skill(session, skill.id) is skill


def test_get_skill_unknown_returns_none(session: Session) -> None:
    assert get_skill(session, 999) is None


def test_list_public_skills_hides_private(session: Session) -> None:
    user = make_user(session)
    category = make_category(session)
    new_skill(session, user, category, title="Public")
    new_skill(session, user, category, title="Private", is_public=False)

    skills, total = list_public_skills(session)

    assert [s.title for s in skills] == ["Public"]
    assert total == 1


def test_list_public_skills_search(session: Session) -> None:
    user = make_user(session)
    category = make_category(session)
    new_skill(session, user, category, title="Email writer")
    new_skill(session, user, category, title="Bug finder", description="Reads EMAIL logs")
    new_skill(session, user, category, title="Recipe helper", description="Cooking")

    skills, total = list_public_skills(session, search="email", sort="title")

    assert [s.title for s in skills] == ["Bug finder", "Email writer"]
    assert total == 2


def test_list_public_skills_filters(session: Session) -> None:
    andrei = make_user(session, "andrei")
    fadi = make_user(session, "fadi")
    writing = make_category(session, "Writing")
    coding = make_category(session, "Coding")
    new_skill(session, andrei, writing, title="A")
    new_skill(session, andrei, coding, title="B")
    new_skill(session, fadi, coding, title="C")

    by_category, _ = list_public_skills(session, category_id=coding.id, sort="title")
    by_user, _ = list_public_skills(session, user_id=andrei.id, sort="title")

    assert [s.title for s in by_category] == ["B", "C"]
    assert [s.title for s in by_user] == ["A", "B"]


def test_list_public_skills_sorts(session: Session) -> None:
    user = make_user(session)
    category = make_category(session)
    for title in ["B", "C", "A"]:
        new_skill(session, user, category, title=title)

    newest, _ = list_public_skills(session, sort="newest")
    oldest, _ = list_public_skills(session, sort="oldest")
    by_title, _ = list_public_skills(session, sort="title")

    assert [s.title for s in newest] == ["A", "C", "B"]
    assert [s.title for s in oldest] == ["B", "C", "A"]
    assert [s.title for s in by_title] == ["A", "B", "C"]


def test_list_public_skills_pages(session: Session) -> None:
    user = make_user(session)
    category = make_category(session)
    for title in ["A", "B", "C", "D", "E"]:
        new_skill(session, user, category, title=title)

    skills, total = list_public_skills(session, sort="title", page=2, limit=2)

    assert [s.title for s in skills] == ["C", "D"]
    assert total == 5


def test_list_public_skills_rejects_unknown_sort(session: Session) -> None:
    with pytest.raises(ValueError):
        list_public_skills(session, sort="rating")


def test_update_skill_changes_only_sent_fields(session: Session) -> None:
    skill = new_skill(session, make_user(session), make_category(session))

    update_skill(session, skill, SkillUpdate(title="New title"))

    assert skill.title == "New title"
    assert skill.description == "Summarizes text"
    assert skill.current_version == 2


def test_delete_skill_keeps_forks(session: Session) -> None:
    user = make_user(session)
    category = make_category(session)
    original = new_skill(session, user, category, title="Original")
    fork = Skill(
        title="Fork",
        description="Copy",
        content="Prompt text",
        user_id=user.id,
        category_id=category.id,
        parent_skill_id=original.id,
    )
    session.add(fork)
    session.commit()

    delete_skill(session, original)

    assert get_skill(session, original.id) is None
    assert get_skill(session, fork.id).parent_skill_id is None
