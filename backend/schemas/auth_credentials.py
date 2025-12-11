from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuthCredentialsBase(BaseModel):
    password_algo: Optional[str] = "bcrypt"
    failed_attempts: Optional[int] = 0
    last_failed_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    password_updated_at: Optional[datetime] = None

class AuthCredentialsCreate(AuthCredentialsBase):
    user_id: int

class AuthCredentialsOut(AuthCredentialsBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True
