from pydantic import BaseModel

class TestCaseBase(BaseModel):
    problem_id: int
    input_text: str
    expected_output: str

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseRead(TestCaseBase):
    id: int
    class Config:
        from_attributes = True
