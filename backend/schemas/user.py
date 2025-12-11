from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .auth_credentials import AuthCredentialsOut


class UserOut(BaseModel):
    id: int
    email: str
    role_id: int
    business_id: Optional[int]
    admin_email: Optional[str]
    created_at: datetime

    auth_credentials: Optional[AuthCredentialsOut] = None

    class Config:
        orm_mode = True
