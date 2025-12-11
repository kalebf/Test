from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from database.connection import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    display_name = Column(String)
    is_business = Column(Boolean, default=False)
    business_name = Column(String)
