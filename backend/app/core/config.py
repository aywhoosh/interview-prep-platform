import os
from dotenv import load_dotenv

load_dotenv()  # loads backend/.env

def _csv(s: str | None) -> list[str]:
    if not s:
        return []
    return [x.strip() for x in s.split(",") if x.strip()]

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
    CORS_ORIGINS: list[str] = _csv(os.getenv("CORS_ORIGINS", "http://localhost:5173"))

    # simple defaults shown for clarity
    RL_PROBLEMS_CREATE = (10, 60)       # 10 per 60 seconds
    RL_TESTCASES_CREATE = (60, 60)      # 60 per minute
    RL_SUBMISSIONS_CREATE = (30, 60)    # 30 per minute
    RL_AUTH_LOGIN = (15, 60)            # 15 per minute
    RL_AUTH_REGISTER = (5, 3600)        # 5 per hour
