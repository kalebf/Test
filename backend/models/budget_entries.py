from sqlalchemy import Column, Integer, Float, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from database.connection import Base

class BudgetEntry(Base):
    __tablename__ = "budgetentries"

    id = Column(Integer, primary_key=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    planned = Column(Float, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Check constraint for positive planned amount
    __table_args__ = (
        CheckConstraint('planned >= 0', name='check_planned_positive'),
    )

    # Relationships
    budget = relationship("Budget", back_populates="entries")
    category = relationship("Category", back_populates="budget_entries")
    user = relationship("User")