# Prompt Dock

Prompt Dock is a website where users can create, discover, save, rate, and share AI prompts and skills.

The backend uses FastAPI, SQLAlchemy, SQLite, Pydantic, JWT authentication, password hashing, and pytest.

The frontend uses Next.js (App Router), React, TypeScript, Axios, Tailwind CSS, ShadCN UI, Jest, and React Testing Library.

## Setup

You will need Python 3.12 or newer, `uv`, and Node.js with `npm`.

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

Make sure `ALLOWED_ORIGINS` in `.env` includes `http://localhost:3000`. Otherwise the browser blocks requests from the frontend.

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

## Sample Data

Fill your local database with sample categories, users, and skills:

```bash
PYTHONPATH=src uv run python -m app.seed
```

Run it from the project folder, not from `src/`. It is safe to run more than once.

It creates two users you can log in with:

| Username | Password |
|---|---|
| `alice` | `password123` |
| `bob` | `password123` |

## Run the Frontend

In a second terminal, go to the frontend folder and install the dependencies:

```bash
cd frontend
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Start the frontend with:

```bash
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

The backend needs to be running at the same time.

## Run with Docker

If you have Docker installed, you can run the whole app with one command instead of the steps above.

Create `.env` first (see Setup), then run:

```bash
docker compose up --build
```

The frontend runs at `http://localhost:3000` and the backend at `http://localhost:8000`. Sample data is added automatically.

To stop it, press Ctrl+C. To reset the database, run:

```bash
docker compose down -v
```

## Run the Tests

Run all tests with:

```bash
uv run pytest
```

The tests cover authentication, users, categories, skills, community features, database behavior, repositories, schemas, and settings.

Run the frontend tests from the `frontend/` folder with:

```bash
npm test
```

The frontend tests use Jest and React Testing Library and live in `frontend/src/__tests__/`.

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

The backend lives in `src/app/`:

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

The frontend lives in `frontend/src/`:

```text
frontend/src/
├── __tests__/
├── api/
├── app/
│   ├── (auth)/
│   ├── (main)/
│   │   └── (protected)/
│   └── layout.tsx
├── components/
└── context/
```

- `__tests__`: Frontend tests
- `api`: Axios client and one file per area (`auth.ts`, `users.ts`, `skills.ts`, `categories.ts`, `community.ts`)
- `app`: Pages. Each folder is a URL, and each page file is named `page.tsx`
- `app/(auth)`: Full-width pages (login and sign up)
- `app/(main)`: Pages inside the centered container
- `app/(main)/(protected)`: Pages that need a login
- `components`: Shared UI. `ui/` holds the ShadCN components and `layout/` holds the navbar and app shell
- `context`: Login state (`AuthContext`)

Folders in parentheses are route groups. They share a layout but do not appear in the URL.

To call the backend, add a function to the matching file in `api/` and import `api` from `./api`. It adds the login token automatically. Use `getErrorMessage(error)` to show API errors to users.

To add a page, create a folder in `app/` with a `page.tsx` inside it. Pages that need a login go inside `(main)/(protected)/`. Pages that use state or hooks need `"use client"` as their first line.

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