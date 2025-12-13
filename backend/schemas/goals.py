from pydantic import BaseModel, Field
from datetime import date, datetime 

class GoalBase(BaseModel):
    name: str
    type: str  # "savings", "debt"
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(0, ge=0)
    target_date: date | None = None


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    target_amount: float | None = Field(None, gt=0)
    current_amount: float | None = Field(None, ge=0)
    target_date: date | None = None
    status: str | None = None


class GoalOut(GoalBase):
    id: int
    status: str
    created_at: datetime 

    class Config:
        from_attributes = True
