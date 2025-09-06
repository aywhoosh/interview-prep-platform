from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.testcase import TestCase
from ..models.problem import Problem
from ..schemas.testcase import TestCaseCreate, TestCaseRead
from .auth import get_current_user
from ..core.ratelimit import limit_dep
from ..core.config import Settings

router = APIRouter(prefix="/testcases", tags=["testcases"])
settings = Settings()

@router.post("", response_model=TestCaseRead, summary="Create a testcase for a problem",
             dependencies=[Depends(limit_dep("testcases_create", *settings.RL_TESTCASES_CREATE))])
def create_testcase(payload: TestCaseCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    problem = db.query(Problem).get(payload.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    tc = TestCase(problem_id=payload.problem_id, input_text=payload.input_text, expected_output=payload.expected_output)
    db.add(tc)
    db.commit()
    db.refresh(tc)
    return tc

@router.get("/{problem_id}", response_model=List[TestCaseRead], summary="List testcases for a problem")
def list_testcases(problem_id: int, db: Session = Depends(get_db)):
    return db.query(TestCase).filter(TestCase.problem_id == problem_id).order_by(TestCase.id.asc()).all()
