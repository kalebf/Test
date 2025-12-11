from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    admin_email = Column(String, ForeignKey("users.email"))
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    auth_credentials = relationship(
        "AuthCredentials",
        back_populates="user",
        uselist=False
    )
    goals = relationship("Goal", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    budgets = relationship("Budget", back_populates="user")
    budget_entries = relationship("BudgetEntry", back_populates="user")
    llm_logs = relationship("LLMLog", back_populates="user")
    profile = relationship("Profile", back_populates="user", uselist=False)
    role = relationship("Role")