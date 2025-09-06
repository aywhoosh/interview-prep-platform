from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordRequestForm, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.user import User
from ..schemas.user import UserCreate, UserRead
from ..core.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, decode_token
from ..core.ratelimit import limit_dep
from ..core.config import Settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = Settings()
bearer_scheme = HTTPBearer()

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

@router.post("/register", response_model=UserRead, summary="Register a new user",
             dependencies=[Depends(limit_dep("auth_register", *settings.RL_AUTH_REGISTER))])
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", summary="Login and get access token",
             dependencies=[Depends(limit_dep("auth_login", *settings.RL_AUTH_LOGIN))])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(subject=str(user.id), expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer"}

def get_current_user(
    db: Session = Depends(get_db),
    creds: HTTPAuthorizationCredentials = Security(bearer_scheme)
) -> User:
    token = creds.credentials
    sub = decode_token(token)
    if sub is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).get(int(sub))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive or missing user")
    return user
