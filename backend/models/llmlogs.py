from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.connection import Base

class LLMLog(Base):
    __tablename__ = "llmlogs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(String(100))
    prompt = Column(Text)
    response = Column(Text)
    timestamp = Column(TIMESTAMP, server_default=func.now())

    # Relationship
    user = relationship("User")