from fastapi import APIRouter, Depends
from ..schemas.user import UserRead
from ..models.user import User
from .auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserRead, summary="Get current user")
def read_me(current_user: User = Depends(get_current_user)):
    return current_user
