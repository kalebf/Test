from pydantic import BaseModel

class BudgetEntryBase(BaseModel):
    category_id: int
    planned: float

class BudgetEntryCreate(BudgetEntryBase):
    pass

class BudgetEntryOut(BudgetEntryBase):
    id: int
    budget_id: int
    user_id: int
    
    class Config:
        from_attributes = True