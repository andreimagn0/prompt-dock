from collections.abc import Generator

import pytest
from sqlalchemy import ForeignKey, create_engine, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    Session,
    mapped_column,
    sessionmaker,
)

from app.core.database import Base, engine, get_db


class ScratchBase(DeclarativeBase):
    """Test-only base so scratch tables stay out of the app metadata."""


class Parent(ScratchBase):
    __tablename__ = "test_parent"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]


class Child(ScratchBase):
    __tablename__ = "test_child"

    id: Mapped[int] = mapped_column(primary_key=True)
    parent_id: Mapped[int] = mapped_column(ForeignKey("test_parent.id"))


@pytest.fixture
def temp_session(tmp_path) -> Generator[Session, None, None]:
    temp_engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    ScratchBase.metadata.create_all(temp_engine)

    session = sessionmaker(bind=temp_engine)()
    yield session

    session.close()
    temp_engine.dispose()


def test_get_db_yields_session_and_closes_it() -> None:
    generator = get_db()
    db = next(generator)

    assert isinstance(db, Session)
    assert db.get_bind() is engine

    db.connection()
    assert db.in_transaction()

    with pytest.raises(StopIteration):
        next(generator)

    assert not db.in_transaction()


def test_sqlite_foreign_keys_are_enabled() -> None:
    with engine.connect() as connection:
        assert connection.execute(text("PRAGMA foreign_keys")).scalar() == 1


def test_shared_base_has_no_test_tables() -> None:
    assert "test_parent" not in Base.metadata.tables
    assert "test_child" not in Base.metadata.tables


def test_base_models_round_trip(temp_session: Session) -> None:
    temp_session.add(Parent(id=1, name="parent"))
    temp_session.commit()

    parent = temp_session.scalars(select(Parent)).one()

    assert parent.name == "parent"


def test_foreign_key_violation_is_rejected(temp_session: Session) -> None:
    temp_session.add(Child(id=1, parent_id=999))

    with pytest.raises(IntegrityError):
        temp_session.commit()
