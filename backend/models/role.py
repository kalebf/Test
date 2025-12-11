from sqlalchemy import Column, Integer, String
from database.connection import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    role_name = Column(String, unique=True, nullable=False)
    permission_level = Column(String, nullable=False)