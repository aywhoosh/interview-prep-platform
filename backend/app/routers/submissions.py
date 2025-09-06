from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
import difflib, re

from ..db.session import get_db
from ..models.submission import Submission
from ..models.problem import Problem
from ..models.testcase import TestCase
from ..schemas.submission import (
    SubmissionCreate, SubmissionRead, SubmissionWithResults,
    SubmissionHead, SubmissionCode, DiffResponse, DiffSummary
)
from .auth import get_current_user
from ..services.runner import judge_python
from ..core.ratelimit import limit_dep
from ..core.config import Settings

router = APIRouter(prefix="/submissions", tags=["submissions"])
settings = Settings()

def _attempt_no(db: Session, user_id: int, problem_id: int, created_at) -> int:
    earlier = db.query(Submission).filter(
        and_(Submission.user_id == user_id,
             Submission.problem_id == problem_id,
             Submission.created_at <= created_at)
    ).order_by(Submission.created_at.asc(), Submission.id.asc()).all()
    for idx, s in enumerate(earlier, start=1):
        if s.created_at == created_at and s.id == earlier[idx-1].id:
            return idx
    return len(earlier)

@router.post("", response_model=SubmissionWithResults, summary="Submit code for a problem",
             dependencies=[Depends(limit_dep("submissions_create", *settings.RL_SUBMISSIONS_CREATE))])
def create_submission(payload: SubmissionCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    problem = db.query(Problem).get(payload.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    tests = db.query(TestCase).filter(TestCase.problem_id == payload.problem_id).order_by(TestCase.id.asc()).all()
    if not tests:
        raise HTTPException(status_code=400, detail="No testcases configured for this problem")

    if payload.language != "python":
        raise HTTPException(status_code=400, detail="Only python supported for now")

    status, results, total_ms = judge_python(
        code=payload.code,
        tests=[(t.input_text, t.expected_output) for t in tests],
        timeout_sec=2.0
    )

    passed = sum(1 for r in results if r["passed"])
    sub = Submission(
        problem_id=payload.problem_id,
        user_id=current_user.id if current_user else None,
        language=payload.language,
        code=payload.code,
        status=status,
        runtime_ms=total_ms,
        passed_count=passed,
        total_count=len(results),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    return {
        "id": sub.id,
        "problem_id": sub.problem_id,
        "user_id": sub.user_id,
        "language": sub.language,
        "status": sub.status,
        "runtime_ms": sub.runtime_ms,
        "passed_count": sub.passed_count,
        "total_count": sub.total_count,
        "created_at": sub.created_at,
        "results": results,
    }

@router.get("", response_model=List[SubmissionRead], summary="List my submissions for a problem or all")
def list_submissions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    problem_id: int | None = Query(default=None),
):
    q = db.query(Submission).filter(Submission.user_id == current_user.id)
    if problem_id is not None:
        q = q.filter(Submission.problem_id == problem_id)
    return q.order_by(Submission.id.desc()).all()

@router.get("/history", response_model=List[SubmissionHead], summary="List my submission history with attempt numbers")
def list_history(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    problem_id: int = Query(...),
):
    subs = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.problem_id == problem_id
    ).order_by(Submission.created_at.asc(), Submission.id.asc()).all()
    return [
        SubmissionHead(
            id=s.id,
            problem_id=s.problem_id,
            status=s.status,
            passed_count=s.passed_count,
            total_count=s.total_count,
            created_at=s.created_at,
            attempt_no=idx
        ) for idx, s in enumerate(subs, start=1)
    ]

@router.get("/{submission_id}/code", response_model=SubmissionCode, summary="Get code for one submission")
def get_code(submission_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    sub = db.query(Submission).get(submission_id)
    if not sub or sub.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    return SubmissionCode(id=sub.id, problem_id=sub.problem_id, code=sub.code)

def _semantic_summary_from_diff(diff_lines: list[str]) -> DiffSummary:
    added = 0
    removed = 0
    changed_funcs = set()
    idents_new = set()
    idents_old = set()

    import re
    ident_re = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")

    for line in diff_lines:
        if line.startswith('+++') or line.startswith('---') or line.startswith('@@'):
            continue
        if line.startswith('+'):
            added += 1
            if line.startswith('+def '):
                m = re.match(r'\+def\s+([A-Za-z_][A-Za-z0-9_]*)', line)
                if m:
                    changed_funcs.add(m.group(1))
            idents_new.update(ident_re.findall(line))
        elif line.startswith('-'):
            removed += 1
            if line.startswith('-def '):
                m = re.match(r'-def\s+([A-Za-z_][A-Za-z0-9_]*)', line)
                if m:
                    changed_funcs.add(m.group(1))
            idents_old.update(ident_re.findall(line))

    changed = list((idents_new ^ idents_old) - {'def', 'return', 'for', 'while', 'if', 'else', 'import', 'from', 'in', 'print'})
    changed = changed[:8]
    return DiffSummary(
        added_lines=added,
        removed_lines=removed,
        changed_functions=sorted(changed_funcs),
        changed_identifiers=changed
    )

@router.get("/diff", response_model=DiffResponse, summary="Diff two submissions of the same problem")
def diff_submissions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    problem_id: int = Query(...),
    new_id: Optional[int] = Query(None),
    old_id: Optional[int] = Query(None),
):
    subs = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.problem_id == problem_id
    ).order_by(Submission.created_at.asc(), Submission.id.asc()).all()

    if not subs or len(subs) < 2:
        raise HTTPException(status_code=400, detail="Not enough submissions to diff")

    sub_map = {s.id: s for s in subs}
    new = sub_map.get(new_id) if new_id else subs[-1]
    if not new:
        raise HTTPException(status_code=404, detail="new_id not found")
    if old_id is None:
        pos = subs.index(new)
        if pos == 0:
            raise HTTPException(status_code=400, detail="No previous attempt to compare")
        old = subs[pos - 1]
    else:
        old = sub_map.get(old_id)
        if not old:
            raise HTTPException(status_code=404, detail="old_id not found")

    old_lines = (old.code or "").splitlines()
    new_lines = (new.code or "").splitlines()
    diff_lines = list(difflib.unified_diff(
        old_lines, new_lines,
        fromfile=f"old_{old.id}.py",
        tofile=f"new_{new.id}.py",
        lineterm="",
        n=3
    ))
    summary = _semantic_summary_from_diff(diff_lines)
    return {
        "problem_id": problem_id,
        "new_id": new.id,
        "old_id": old.id,
        "summary": summary,
        "unified_diff": "\n".join(diff_lines)
    }
