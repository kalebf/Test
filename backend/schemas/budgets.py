from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from .budget_entries import BudgetEntryOut

class BudgetBase(BaseModel):
    budget_id: str
    month: date

class BudgetCreate(BudgetBase):
    entries: List['BudgetEntryCreate']

class BudgetOut(BudgetBase):
    id: int
    user_id: int
    updated_at: datetime
    entries: List[BudgetEntryOut] = []
    
    class Config:
        from_attributes = True

try:
    from .budget_entries import BudgetEntryCreate
except ImportError:
    class BudgetEntryCreate(BaseModel):
        category_id: int
        planned: float