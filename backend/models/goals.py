from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.connection import Base

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(Date, nullable=True)

    status = Column(String, default="on_track")

    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="goals")

