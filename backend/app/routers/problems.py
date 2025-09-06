from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..db.session import get_db
from ..models.problem import Problem
from ..schemas.problem import ProblemCreate, ProblemRead, ProblemPage
from .auth import get_current_user
from ..core.ratelimit import limit_dep
from ..core.config import Settings

router = APIRouter(prefix="/problems", tags=["problems"])
settings = Settings()

@router.get("", response_model=List[ProblemRead], summary="List problems (legacy simple list)")
def list_problems(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None, description="Search in title"),
    limit: int = 20,
    offset: int = 0,
):
    query = db.query(Problem)
    if q:
        query = query.filter(Problem.title.ilike(f"%{q}%"))
    return query.order_by(Problem.id.desc()).offset(offset).limit(limit).all()

@router.get("/search", response_model=ProblemPage, summary="Search problems with filters and pagination")
def search_problems(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None, description="Search in title or body"),
    domain: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    sort: str = Query(default="created_desc", description="created_desc|created_asc|title_asc"),
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    query = db.query(Problem)
    if q:
        pattern = f"%{q}%"
        query = query.filter(or_(Problem.title.ilike(pattern), Problem.body.ilike(pattern)))
    if domain:
        query = query.filter(Problem.domain == domain)
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty)

    total = query.count()

    if sort == "created_asc":
        query = query.order_by(Problem.created_at.asc(), Problem.id.asc())
    elif sort == "title_asc":
        query = query.order_by(Problem.title.asc())
    else:
        query = query.order_by(Problem.created_at.desc(), Problem.id.desc())

    items = query.offset(offset).limit(limit).all()
    return ProblemPage(items=items, total=total, limit=limit, offset=offset)

@router.post("", response_model=ProblemRead, summary="Create a problem",
             dependencies=[Depends(limit_dep("problems_create", *settings.RL_PROBLEMS_CREATE))])
def create_problem(payload: ProblemCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    existing = db.query(Problem).filter((Problem.title == payload.title) | (Problem.slug == payload.slug)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Problem with same title or slug exists")
    obj = Problem(
        title=payload.title,
        slug=payload.slug,
        body=payload.body,
        domain=payload.domain,
        difficulty=payload.difficulty,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
