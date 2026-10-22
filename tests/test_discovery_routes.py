from collections.abc import Generator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.api.v1.routes import api_router
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
    session: Session,
    user: User,
    category: Category,
    title: str = "Summarize",
    description: str = "Summarizes text",
    is_public: bool = True,
) -> Skill:
    skill = Skill(
        title=title,
        description=description,
        content="Prompt text",
        user_id=user.id,
        category_id=category.id,
        is_public=is_public,
    )
    session.add(skill)
    session.commit()
    return skill


def titles(response) -> list[str]:
    return [skill["title"] for skill in response.json()["data"]]


def test_browse_categories_sorted_by_name(client: TestClient, session: Session) -> None:
    make_category(session, "Writing")
    make_category(session, "Coding")

    response = client.get("/categories")

    assert response.status_code == 200
    assert [c["name"] for c in response.json()] == ["Coding", "Writing"]


def test_category_detail_shows_public_skills_only(
    client: TestClient, session: Session
) -> None:
    user = make_user(session)
    category = make_category(session)
    make_skill(session, user, category, title="Public")
    make_skill(session, user, category, title="Private", is_public=False)

    response = client.get(f"/categories/{category.id}")

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Writing"
    assert [s["title"] for s in body["skills"]] == ["Public"]


def test_category_detail_unknown_is_404(client: TestClient) -> None:
    response = client.get("/categories/999")

    assert response.status_code == 404


def test_browse_skills_hides_private(client: TestClient, session: Session) -> None:
    user = make_user(session)
    category = make_category(session)
    make_skill(session, user, category, title="Public")
    make_skill(session, user, category, title="Private", is_public=False)

    response = client.get("/skills")

    assert response.status_code == 200
    assert titles(response) == ["Public"]
    assert response.json()["total"] == 1


def test_browse_skills_search_and_filter(client: TestClient, session: Session) -> None:
    user = make_user(session)
    writing = make_category(session, "Writing")
    coding = make_category(session, "Coding")
    make_skill(session, user, writing, title="Email writer")
    make_skill(session, user, coding, title="Email parser")
    make_skill(session, user, coding, title="Bug finder")

    searched = client.get("/skills", params={"search": "EMAIL", "sort": "title"})
    filtered = client.get(
        "/skills", params={"category_id": coding.id, "sort": "title"}
    )

    assert titles(searched) == ["Email parser", "Email writer"]
    assert titles(filtered) == ["Bug finder", "Email parser"]


def test_browse_skills_pages(client: TestClient, session: Session) -> None:
    user = make_user(session)
    category = make_category(session)
    for title in ["A", "B", "C", "D", "E"]:
        make_skill(session, user, category, title=title)

    response = client.get("/skills", params={"sort": "title", "page": 2, "limit": 2})

    body = response.json()
    assert titles(response) == ["C", "D"]
    assert (body["page"], body["limit"], body["total"]) == (2, 2, 5)


def test_browse_skills_unsupported_sort_is_400(client: TestClient) -> None:
    response = client.get("/skills", params={"sort": "rating"})

    assert response.status_code == 400


@pytest.mark.parametrize(
    "params",
    [{"limit": 0}, {"limit": 101}, {"page": 0}, {"sort": "bogus"}],
)
def test_browse_skills_rejects_bad_params(client: TestClient, params: dict) -> None:
    response = client.get("/skills", params=params)

    assert response.status_code == 422
