from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List
from database.connection import SessionLocal
from models.user import User
from models.transactions import Transaction
from models.categories import Category
from models.goals import Goal
from routers.auth_router import verify_token

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/recent-purchases")
def get_recent_purchases(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get recent transactions for the current user"""
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.amount < 0  # Only expenses (negative amounts)
    ).order_by(desc(Transaction.created_at)).limit(limit).all()
    
    return [
        {
            "id": t.id,
            "item": t.category.name if t.category else "Uncategorized",
            "date": t.created_at.strftime("%Y-%m-%d") if t.created_at else "Unknown",
            "amount": f"${abs(t.amount):.2f}"
        }
        for t in transactions
    ]

@router.get("/expense-categories")
def get_expense_categories(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db),
    month: str = None  # Optional: filter by month "YYYY-MM"
):
    """Get expense categories with totals for the current user"""
    query = db.query(
        Category.name,
        Category.id,
        func.sum(Transaction.amount).label("total")
    ).join(
        Transaction,
        Transaction.category_id == Category.id
    ).filter(
        Transaction.user_id == user.id,
        Category.kind == "expense",
        Transaction.amount < 0
    )
    
    if month:
        # Filter by month if provided
        year, month_num = map(int, month.split("-"))
        start_date = datetime(year, month_num, 1)
        if month_num == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month_num + 1, 1)
        
        query = query.filter(
            Transaction.created_at >= start_date,
            Transaction.created_at < end_date
        )
    
    results = query.group_by(Category.id, Category.name).all()
    
    # Color palette for the pie chart
    colors = [
        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
        "#FF9F40", "#FF6384", "#C9CBCF", "#4BC0C0", "#FF6384"
    ]
    
    return [
        {
            "name": name,
            "value": abs(float(total)),  # Use absolute value for expenses
            "color": colors[i % len(colors)]
        }
        for i, (name, _, total) in enumerate(results) if total
    ]

@router.get("/goals")
def get_user_goals(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get goals for the current user"""
    goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    
    return [
        {
            "id": g.id,
            "name": g.name,
            "target": g.target_amount,
            "current": g.current_amount,
            "type": g.type,
            "status": g.status,
            "color": "#36A2EB" if g.type == "savings" else "#FF6384"
        }
        for g in goals
    ]

