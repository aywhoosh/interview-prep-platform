from pydantic import BaseModel, Field
from typing import List

class ProblemBase(BaseModel):
    title: str
    slug: str = Field(pattern=r"^[a-z0-9-]+$")
    body: str
    domain: str
    difficulty: str

class ProblemCreate(ProblemBase):
    pass

class ProblemRead(ProblemBase):
    id: int
    class Config:
        from_attributes = True

class ProblemPage(BaseModel):
    items: List[ProblemRead]
    total: int
    limit: int
    offset: int
