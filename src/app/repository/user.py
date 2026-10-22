"""Database operations for users."""

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.auth import hash_password
from app.models.user import User


def get_user(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_user_by_login(db: Session, identifier: str) -> User | None:
    """Find a user by email or username."""
    return db.query(User).filter(or_(User.email == identifier, User.username == identifier)).first()


def username_taken(db: Session, username: str) -> bool:
    return db.query(User).filter(User.username == username).first() is not None


def email_taken(db: Session, email: str) -> bool:
    return db.query(User).filter(User.email == email).first() is not None


def create_user(db: Session, username: str, email: str, password: str) -> User:
    user = User(username=username, email=email, password_hash=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, username: str | None, email: str | None) -> User:
    if username:
        user.username = username
    if email:
        user.email = email
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()
