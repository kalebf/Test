from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database.connection import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    kind = Column(String(20), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"))

    # Self-referential relationship for subcategories
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    
    # Relationships
    transactions = relationship("Transaction", back_populates="category")
    budget_entries = relationship("BudgetEntry", back_populates="category")