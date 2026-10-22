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
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(temp_engine)

    session = sessionmaker(bind=temp_engine)()
    yield session

    session.close()
    temp_engine.dispose()


@pytest.fixture
def client(session: Session) -> TestClient:
    app = FastAPI()
    app.include_router(api_router)
    app.dependency_overrides[get_db] = lambda: session
    return TestClient(app)


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


def skill_body(category: Category, **overrides) -> dict:
    body = {
        "title": "Summarize",
        "description": "Summarizes text",
        "content": "Prompt text",
        "category_id": category.id,
    }
    return body | overrides


# create


def test_create_skill(client: TestClient, session: Session) -> None:
    user = make_user(session)
    category = make_category(session)

    response = client.post(
        "/skills", json=skill_body(category, user_id=999), headers=auth(user)
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user_id"] == user.id
    assert body["current_version"] == 1
    assert body["is_public"] is True


def test_create_skill_requires_login(client: TestClient, session: Session) -> None:
    response = client.post("/skills", json=skill_body(make_category(session)))

    assert response.status_code == 401


def test_create_skill_unknown_category_is_400(
    client: TestClient, session: Session
) -> None:
    user = make_user(session)

    response = client.post(
        "/skills",
        json={
            "title": "Summarize",
            "description": "Summarizes text",
            "content": "Prompt text",
            "category_id": 999,
        },
        headers=auth(user),
    )

    assert response.status_code == 400


# update


def test_owner_updates_skill(client: TestClient, session: Session) -> None:
    user = make_user(session)
    skill = make_skill(session, user, make_category(session))

    response = client.put(
        f"/skills/{skill.id}", json={"title": "New title"}, headers=auth(user)
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "New title"
    assert body["description"] == "Summarizes text"
    assert body["current_version"] == 2


def test_update_by_non_owner_is_403(client: TestClient, session: Session) -> None:
    owner = make_user(session, "andrei")
    other = make_user(session, "fadi")
    skill = make_skill(session, owner, make_category(session))

    response = client.put(
        f"/skills/{skill.id}", json={"title": "Hijacked"}, headers=auth(other)
    )

    assert response.status_code == 403


def test_update_private_skill_by_non_owner_is_404(
    client: TestClient, session: Session
) -> None:
    owner = make_user(session, "andrei")
    other = make_user(session, "fadi")
    skill = make_skill(session, owner, make_category(session), is_public=False)

    response = client.put(
        f"/skills/{skill.id}", json={"title": "Hijacked"}, headers=auth(other)
    )

    assert response.status_code == 404


def test_update_unknown_skill_is_404(client: TestClient, session: Session) -> None:
    user = make_user(session)

    response = client.put("/skills/999", json={"title": "X"}, headers=auth(user))

    assert response.status_code == 404


def test_update_unknown_category_is_400(client: TestClient, session: Session) -> None:
    user = make_user(session)
    skill = make_skill(session, user, make_category(session))

    response = client.put(
        f"/skills/{skill.id}", json={"category_id": 999}, headers=auth(user)
    )

    assert response.status_code == 400


def test_update_requires_login(client: TestClient, session: Session) -> None:
    skill = make_skill(session, make_user(session), make_category(session))

    response = client.put(f"/skills/{skill.id}", json={"title": "X"})

    assert response.status_code == 401


# delete


def test_owner_deletes_skill(client: TestClient, session: Session) -> None:
    user = make_user(session)
    skill = make_skill(session, user, make_category(session))
    skill_id = skill.id

    response = client.delete(f"/skills/{skill_id}", headers=auth(user))

    assert response.status_code == 200
    assert response.json() == {"message": "Skill deleted"}
    assert session.get(Skill, skill_id) is None


def test_delete_by_non_owner_is_403(client: TestClient, session: Session) -> None:
    owner = make_user(session, "andrei")
    other = make_user(session, "fadi")
    skill = make_skill(session, owner, make_category(session))

    response = client.delete(f"/skills/{skill.id}", headers=auth(other))

    assert response.status_code == 403


def test_delete_unknown_skill_is_404(client: TestClient, session: Session) -> None:
    user = make_user(session)

    response = client.delete("/skills/999", headers=auth(user))

    assert response.status_code == 404


def test_delete_requires_login(client: TestClient, session: Session) -> None:
    skill = make_skill(session, make_user(session), make_category(session))

    response = client.delete(f"/skills/{skill.id}")

    assert response.status_code == 401
