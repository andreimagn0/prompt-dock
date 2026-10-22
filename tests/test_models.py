from collections.abc import Generator

import pytest
from sqlalchemy import create_engine, delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.models import Category, Skill, User


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
    session.flush()
    return user


def make_category(session: Session, name: str = "Writing") -> Category:
    category = Category(name=name)
    session.add(category)
    session.flush()
    return category


def make_skill(
    session: Session,
    user: User,
    category: Category,
    parent: Skill | None = None,
) -> Skill:
    skill = Skill(
        title="Summarize",
        description="Summarizes text",
        content="Summarize the following:",
        user=user,
        category=category,
        parent_skill=parent,
    )
    session.add(skill)
    session.flush()
    return skill


def test_skill_links_to_user_and_category(session: Session) -> None:
    user = make_user(session)
    category = make_category(session)
    skill = make_skill(session, user, category)
    session.commit()

    assert skill.user_id == user.id
    assert skill.category_id == category.id
    assert user.skills == [skill]
    assert category.skills == [skill]


def test_skill_defaults(session: Session) -> None:
    skill = make_skill(session, make_user(session), make_category(session))
    session.commit()

    assert skill.is_public is True
    assert skill.current_version == 1
    assert skill.created_at is not None
    assert skill.updated_at is not None


def test_skill_updated_at_changes_on_update(session: Session) -> None:
    skill = make_skill(session, make_user(session), make_category(session))
    session.commit()
    original = skill.updated_at

    skill.title = "Summarize better"
    session.commit()

    assert skill.updated_at > original


def test_skill_with_unknown_category_is_rejected(session: Session) -> None:
    user = make_user(session)
    session.add(
        Skill(
            title="Orphan",
            description="No category",
            content="...",
            user_id=user.id,
            category_id=999,
        )
    )

    with pytest.raises(IntegrityError):
        session.commit()


def test_category_names_are_unique(session: Session) -> None:
    make_category(session, "Writing")

    with pytest.raises(IntegrityError):
        make_category(session, "Writing")


def test_deleting_user_deletes_their_skills(session: Session) -> None:
    user = make_user(session)
    make_skill(session, user, make_category(session))
    session.commit()

    session.execute(delete(User).where(User.id == user.id))
    session.commit()

    assert session.scalars(select(Skill)).all() == []


def test_deleting_original_keeps_fork_with_null_parent(session: Session) -> None:
    user = make_user(session)
    category = make_category(session)
    original = make_skill(session, user, category)
    fork = make_skill(session, user, category, parent=original)
    session.commit()

    session.execute(delete(Skill).where(Skill.id == original.id))
    session.commit()
    session.expire_all()

    assert session.get(Skill, fork.id).parent_skill_id is None
