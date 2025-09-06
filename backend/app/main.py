from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import Settings
from .routers import health, problems, auth, users, testcases, submissions

app = FastAPI(title="Interview Prep Platform API", version="0.3.0")
settings = Settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(problems.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(testcases.router)
app.include_router(submissions.router)

@app.get("/", summary="Root")
def root():
    return {"message": "Interview Prep Platform API"}
