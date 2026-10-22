# Prompt Dock Backend

Prompt Dock is our backend for a website where users can create, discover, save, rate, and share AI prompts and skills.

The backend uses FastAPI, SQLAlchemy, SQLite, Pydantic, JWT authentication, password hashing, and pytest.

## Setup

You will need Python 3.12 or newer and `uv`.

Clone the repository and enter the project folder:

```bash
git clone https://github.com/andreimagn0/prompt-dock.git
cd prompt-dock
```

Install the dependencies:

```bash
uv sync
```

Create a local environment file:

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder `SECRET_KEY` with a secure secret. Do not commit `.env` to GitHub.

## Run the Backend

Start the server with:

```bash
uv run uvicorn --app-dir src app.main:app --reload
```

The backend runs at:

```text
http://127.0.0.1:8000
```

The interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

## Run the Tests

Run all tests with:

```bash
uv run pytest
```

The tests cover authentication, users, categories, skills, community features, database behavior, repositories, schemas, and settings.

## Main Features

The API currently supports:

- User registration and login
- JWT authentication
- User profiles
- Category browsing
- Public skill discovery
- Creating, updating, and deleting skills
- Ratings and comments
- Reports
- Saved skills
- Skill version history
- Skill forks

API endpoints use the `/api/v1` prefix.

## Project Structure

```text
src/app/
├── api/
├── core/
├── models/
├── repository/
├── routes/
├── schemas/
├── services/
└── main.py

tests/
```

The main folders are:

- `models`: Database models
- `schemas`: Request and response validation
- `repository`: Database queries
- `services`: Application logic
- `routes`: API endpoints
- `core`: Settings, authentication, and database setup
- `tests`: Automated tests

## Database

The project uses SQLite by default. The database URL is:

```text
sqlite:///./prompt_dock.db
```

The database tables are created when the application starts.

## Authentication and Security

Passwords are hashed before being stored. Password hashes are not included in API responses.

Users need a valid JWT to access protected routes. Users can only edit or delete their own skills.

The application also includes CORS configuration and request logging. Logs include the request method, path, status code, and processing time, but do not include passwords or JWT tokens.

## Team Workflow

Each team member works on a separate branch. Changes are tested and submitted through a pull request before being merged into `main`.

To update your local copy:

```bash
git checkout main
git pull
```