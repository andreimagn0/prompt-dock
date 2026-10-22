from collections.abc import Generator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.api.v1.routes import api_router
from app.core.auth import create_access_token
from app.core.database import Base, get_db
from app.models import Category, Skill, User


@pytest.fixture
def session(tmp_path) -> Generator[Session, None, None]:
    temp_engine = create_engine(
        f"sqlite:///{tmp_path / 'community_test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(temp_engine)
    test_session = sessionmaker(bind=temp_engine)()
    yield test_session
    test_session.close()
    temp_engine.dispose()


@pytest.fixture
def client(session: Session) -> TestClient:
    app = FastAPI()
    app.include_router(api_router)
    app.dependency_overrides[get_db] = lambda: session
    yield TestClient(app)
    app.dependency_overrides.clear()


def make_user(session: Session, username: str = "andrei") -> User:
    user = User(
        username=username,
        email=f"{username}@example.com",
        password_hash="hashed",
    )
    session.add(user)
    session.commit()
    return user


def make_category(session: Session) -> Category:
    category = Category(name="Writing")
    session.add(category)
    session.commit()
    return category


def make_skill(
    session: Session, user: User, category: Category, is_public: bool = True
) -> Skill:
    skill = Skill(
        title="Summarize",
        description="Summarizes text",
        content="Prompt text",
        user_id=user.id,
        category_id=category.id,
        is_public=is_public,
    )
    session.add(skill)
    session.commit()
    return skill


def auth(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def test_list_comments_for_skill(client: TestClient, session: Session) -> None:
    user = make_user(session)
    skill = make_skill(session, user, make_category(session))

    response = client.get(f"/community/skills/{skill.id}/comments")

    assert response.status_code == 200
    assert response.json() == []


def test_create_comment_requires_login(
    client: TestClient, session: Session
) -> None:
    user = make_user(session)
    skill = make_skill(session, user, make_category(session))

    response = client.post(
        f"/community/skills/{skill.id}/comments",
        json={"content": "Helpful skill!"},
    )

    assert response.status_code == 401


def test_create_and_delete_comment(
    client: TestClient, session: Session
) -> None:
    user = make_user(session)
    skill = make_skill(session, user, make_category(session))

    created = client.post(
        f"/community/skills/{skill.id}/comments",
        json={"content": "Helpful skill!"},
        headers=auth(user),
    )

    assert created.status_code == 201
    comment_id = created.json()["id"]
    assert created.json()["content"] == "Helpful skill!"

    deleted = client.delete(
        f"/community/comments/{comment_id}", headers=auth(user)
    )
    assert deleted.status_code == 204


def test_comment_cannot_be_updated_by_another_user(
    client: TestClient, session: Session
) -> None:
    owner = make_user(session, "andrei")
    other = make_user(session, "fadi")
    skill = make_skill(session, owner, make_category(session))

    created = client.post(
        f"/community/skills/{skill.id}/comments",
        json={"content": "Original comment"},
        headers=auth(owner),
    )
    comment_id = created.json()["id"]

    response = client.put(
        f"/community/comments/{comment_id}",
        json={"content": "Changed comment"},
        headers=auth(other),
    )

    assert response.status_code == 403


def test_rate_skill(client: TestClient, session: Session) -> None:
    user = make_user(session)
    skill = make_skill(session, user, make_category(session))

    response = client.put(
        f"/community/skills/{skill.id}/rating",
        json={"value": 5},
        headers=auth(user),
    )

    assert response.status_code == 200
    assert response.json()["value"] == 5


def test_rating_out_of_range_is_rejected(
    client: TestClient, session: Session
) -> None:
    user = make_user(session)
    skill = make_skill(session, user, make_category(session))

    response = client.put(
        f"/community/skills/{skill.id}/rating",
        json={"value": 6},
        headers=auth(user),
    )

    assert response.status_code == 422


def test_save_and_unsave_skill(client: TestClient, session: Session) -> None:
    user = make_user(session)
    skill = make_skill(session, user, make_category(session))

    saved = client.post(
        f"/community/skills/{skill.id}/save", headers=auth(user)
    )
    assert saved.status_code == 201
    assert saved.json()["skill_id"] == skill.id

    duplicate = client.post(
        f"/community/skills/{skill.id}/save", headers=auth(user)
    )
    assert duplicate.status_code == 409

    unsaved = client.delete(
        f"/community/skills/{skill.id}/save", headers=auth(user)
    )
    assert unsaved.status_code == 204


def test_create_and_list_skill_version(
    client: TestClient, session: Session
) -> None:
    user = make_user(session)
    skill = make_skill(session, user, make_category(session))

    created = client.post(
        f"/community/skills/{skill.id}/versions",
        json={
            "version_number": 2,
            "title": "Summarize v2",
            "description": "Improved summary",
            "content": "Updated prompt",
        },
        headers=auth(user),
    )

    assert created.status_code == 201
    assert created.json()["version_number"] == 2

    listed = client.get(f"/community/skills/{skill.id}/versions")
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_non_owner_cannot_create_skill_version(
    client: TestClient, session: Session
) -> None:
    owner = make_user(session, "andrei")
    other = make_user(session, "fadi")
    skill = make_skill(session, owner, make_category(session))

    response = client.post(
        f"/community/skills/{skill.id}/versions",
        json={"version_number": 2, "title": "Unauthorized version"},
        headers=auth(other),
    )

    assert response.status_code == 403


def test_fork_private_skill_is_forbidden(
    client: TestClient, session: Session
) -> None:
    owner = make_user(session, "andrei")
    other = make_user(session, "fadi")
    category = make_category(session)
    original = make_skill(session, owner, category, is_public=False)
    forked = make_skill(session, other, category)

    response = client.post(
        "/community/forks",
        json={
            "original_skill_id": original.id,
            "forked_skill_id": forked.id,
        },
        headers=auth(other),
    )

    assert response.status_code == 403