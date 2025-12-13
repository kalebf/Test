from sqlalchemy import Column, Integer, String, Date, TIMESTAMP, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.connection import Base

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True)
    budget_id = Column(String(50), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    month = Column(Date, nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    updated_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    user = relationship("User")
    entries = relationship("BudgetEntry", back_populates="budget", cascade="all, delete-orphan")