# Interview Preparation Platform - Starter

A minimal full stack starter:
- Backend: FastAPI (Python) with SQLAlchemy and Postgres
- Frontend: React + Vite
- Dev Orchestration: Docker Compose

## Quick start with Docker

1. Ensure Docker and Docker Compose are installed.
2. From the repo root, run:

```bash
docker compose up --build
```

3. Services
- Backend API at http://localhost:8000
- API docs at http://localhost:8000/docs
- Frontend at http://localhost:5173

4. Stop with Ctrl+C, or run in detached mode with `docker compose up -d`.

## Local dev without Docker

Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/interview_prep"  # set your own if needed
uvicorn app.main:app --reload
```

Frontend
```bash
cd frontend
npm install
npm run dev
```

## Next steps

- Add Alembic migrations
- Build auth (JWT) and a simple users table
- Add Problem CRUD fully with pagination and search
- Add submissions and a basic runner for Python only
- Add SQL Studio module and image OCR intake later


## Auth quick test

1. Start with Docker `docker compose up --build`.
2. Open http://localhost:5173, use the Login box to register and log in. A token is saved to localStorage.
3. Create a problem. The POST endpoint requires a Bearer token, so only logged-in users can create.

Alternatively via curl:
```bash
# register
curl -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d '{"email":"demo@example.com","password":"secret123"}'
# login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login -H "Content-Type: application/x-www-form-urlencoded" -d "username=demo@example.com&password=secret123" | python -c 'import sys, json; print(json.load(sys.stdin)["access_token"])')
# create a problem
curl -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title":"Two Sum","slug":"two-sum","body":"Find indices that add to target","domain":"dsa","difficulty":"easy"}' http://localhost:8000/problems
```
