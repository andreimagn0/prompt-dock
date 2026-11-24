"""Fill the local database with sample data.

Run from the repo root:
    PYTHONPATH=src uv run python -m app.seed

Safe to run more than once: anything that already exists is skipped.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import hash_password
from app.core.database import Base, SessionLocal, engine
from app.models import Category, SavedSkill, Skill, User

PASSWORD = "password123"

CATEGORIES = [
    "Studying & Education",
    "Coding & Technology",
    "Writing & Communication",
    "Work & Productivity",
    "Creative & Design",
    "Cooking & Recipes",
    "Personal Development",
    "Research & Analysis",
    "Business & Finance",
    "Entertainment & Hobbies",
]

USERS = [
    ("alice", "alice@example.com"),
    ("bob", "bob@example.com"),
]

# (title, description, content, category, owner)
SKILLS = [
    ("Plan 5 dinners from my fridge", "Turns what you have into a week of dinners.",
     "Here is what is in my fridge: {ingredients}. Plan 5 simple dinners using mostly these items.",
     "Cooking & Recipes", "alice"),
    ("Explain this error like I'm new", "Plain-language explanations of error messages.",
     "Explain this error message as if I just started programming: {error}",
     "Coding & Technology", "bob"),
    ("Budget my month", "Builds a simple monthly budget.",
     "My monthly income is {income}. My fixed costs are {costs}. Suggest a simple budget.",
     "Business & Finance", "alice"),
    ("Tone control for emails", "Rewrites an email in a chosen tone.",
     "Rewrite this email to sound {tone}: {email}",
     "Writing & Communication", "bob"),
    ("Study plan generator", "Creates a study schedule before an exam.",
     "I have an exam on {topic} in {days} days. Make a daily study plan.",
     "Studying & Education", "alice"),
]

# (username, skill title)
SAVED = [
    ("alice", "Explain this error like I'm new"),
    ("bob", "Plan 5 dinners from my fridge"),
]

def get_or_create(db: Session, model, lookup: dict, **fields):
    """Return the row matching lookup, creating it if it doesn't exist."""
    existing = db.scalars(select(model).filter_by(**lookup)).first()
    if existing:
        return existing
    row = model(**lookup, **fields)
    db.add(row)
    db.flush()  # gives the new row an id right away
    return row


def seed(db: Session) -> None:
    categories = {name: get_or_create(db, Category, {"name": name}) for name in CATEGORIES}

    users = {
        username: get_or_create(db, User, {"username": username},
        email=email, 
        password_hash=hash_password(PASSWORD))
        
        for username, email in USERS
    }

    skills = {}
    for title, description, content, category, owner in SKILLS:
        skills[title] = get_or_create(
            db, Skill, {"title": title, "user_id": users[owner].id},
            description=description, content=content,
            category_id=categories[category].id,
        )

    for username, title in SAVED:
        get_or_create(db, SavedSkill, {"user_id": users[username].id, "skill_id": skills[title].id})

    db.commit()

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db)
    print("Seed data added.")