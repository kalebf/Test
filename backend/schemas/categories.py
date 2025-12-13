from pydantic import BaseModel
from typing import Optional

class CategoryBase(BaseModel):
    name: str
    kind: str  
    parent_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True