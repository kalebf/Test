from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LLMLogBase(BaseModel):
    session_id: Optional[str] = None
    prompt: str
    response: str

class LLMLogCreate(LLMLogBase):
    pass

class LLMLogOut(LLMLogBase):
    id: int
    user_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True