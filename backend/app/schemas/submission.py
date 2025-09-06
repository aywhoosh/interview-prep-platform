from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TestResult(BaseModel):
    idx: int
    passed: bool
    status: str
    stdout: str = ""
    stderr: str = ""
    runtime_ms: float | None = None

class SubmissionCreate(BaseModel):
    problem_id: int
    language: str = Field(pattern=r"^(python)$")
    code: str

class SubmissionRead(BaseModel):
    id: int
    problem_id: int
    user_id: int | None
    language: str
    status: str
    runtime_ms: float | None = None
    passed_count: int
    total_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class SubmissionWithResults(SubmissionRead):
    results: List[TestResult]

# For history list with attempt numbers
class SubmissionHead(BaseModel):
    id: int
    problem_id: int
    status: str
    passed_count: int
    total_count: int
    created_at: datetime
    attempt_no: int

    class Config:
        from_attributes = True

# For fetching code of a single submission
class SubmissionCode(BaseModel):
    id: int
    problem_id: int
    code: str

# Diff response schema
class DiffSummary(BaseModel):
    added_lines: int
    removed_lines: int
    changed_functions: List[str]
    changed_identifiers: List[str]

class DiffResponse(BaseModel):
    problem_id: int
    new_id: int
    old_id: int
    summary: DiffSummary
    unified_diff: str
