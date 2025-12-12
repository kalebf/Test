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
from models.profile import Profile
from routers.auth_router import verify_token
from models.budgets import Budget

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== HELPER FUNCTIONS ==========

def fetch_recent_purchases_helper(user_id: int, db: Session, limit: int = 10):
    """Helper function to fetch recent purchases"""
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
    ).order_by(desc(Transaction.created_at)).limit(limit).all()
    
    # Map category IDs to specific item names for personal expenses
    category_item_map = {
        1: "Rent Payment",           # Housing
        2: "Grocery Shopping",       # Food  
        3: "Gas Station",            # Transportation
        4: "Movie Tickets",          # Entertainment
        5: "Doctor Visit",           # Healthcare
        6: "Insurance Premium",      # Insurance
        7: "Savings Deposit",        # Savings
        8: "Miscellaneous Expense",  # Other Expense
        22: "Office Rent",           # Office Rent (if personal user has this)
        23: "Salary Payment",        # Employee Salaries (unlikely for personal)
        24: "Software Purchase",     # Software Licenses
        25: "Marketing Expense",     # Marketing (unlikely for personal)
        26: "Utility Bill",          # Utilities
        27: "Business Development",  # Business Development (unlikely)
        28: "Product Development",   # Product Development (unlikely)
        29: "Training Course",       # Employee Training
        30: "Business Operations",   # Business Operations (unlikely)
    }
    
    # Fallback generic items based on category names
    category_generic_map = {
        "Housing": "Housing Expense",
        "Food": "Food Purchase", 
        "Transportation": "Transportation",
        "Entertainment": "Entertainment",
        "Healthcare": "Healthcare",
        "Insurance": "Insurance",
        "Savings": "Savings Transfer",
        "Other Expense": "Expense",
        "Utilities": "Utility Bill",
    }
    
    result = []
    for t in transactions:
        # Try to get the most specific item name
        item_name = "Purchase"
        
        # First, try to use category_id mapping
        if t.category_id and t.category_id in category_item_map:
            item_name = category_item_map[t.category_id]
        # Then try category name generic mapping
        elif t.category and t.category.name:
            category_name = t.category.name
            if category_name in category_generic_map:
                item_name = category_generic_map[category_name]
            else:
                # Use category name itself
                item_name = category_name
        
        # Add some variety for common categories based on amount
        if t.category_id == 2:  # Food
            if abs(t.amount) < 30:
                item_name = "Coffee Shop"
            elif abs(t.amount) < 80:
                item_name = "Restaurant Meal"
            else:
                item_name = "Grocery Shopping"
        
        elif t.category_id == 3:  # Transportation
            if abs(t.amount) < 40:
                item_name = "Bus/Train Fare"
            elif abs(t.amount) < 100:
                item_name = "Gas Station"
            else:
                item_name = "Car Maintenance"
        
        elif t.category_id == 4:  # Entertainment
            if abs(t.amount) < 30:
                item_name = "Streaming Service"
            elif abs(t.amount) < 60:
                item_name = "Movie Tickets"
            else:
                item_name = "Concert/Event"
        
        elif t.category_id == 26:  # Utilities
            if abs(t.amount) < 100:
                item_name = "Internet Bill"
            elif abs(t.amount) < 150:
                item_name = "Electricity Bill"
            else:
                item_name = "Utility Bundle"
        
        result.append({
            "id": t.id,
            "item": item_name,
            "date": t.created_at.strftime("%Y-%m-%d") if t.created_at else "Unknown",
            "amount": f"${abs(t.amount):.2f}"
        })
    
    return result

def fetch_expense_categories_helper(user_id: int, db: Session, month: str = None):
    """Helper function to fetch expense categories"""
    query = db.query(
        Category.name,
        Category.id,
        func.sum(Transaction.amount).label("total")
    ).join(
        Transaction,
        Transaction.category_id == Category.id
    ).filter(
        Transaction.user_id == user_id,
        Category.kind == "expense",
    )
    
    if month:
        # Filter by month if provided
        try:
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
        except ValueError:
            # If month format is invalid, ignore the filter
            pass
    
    results = query.group_by(Category.id, Category.name).all()
    
    # Color palette for the pie chart
    colors = [
        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
        "#FF9F40", "#FF6384", "#C9CBCF", "#4BC0C0", "#FF6384"
    ]
    
    return [
        {
            "name": name,
            "value": abs(float(total)) if total else 0.0,
            "color": colors[i % len(colors)]
        }
        for i, (name, _, total) in enumerate(results) if total is not None
    ]

def fetch_user_goals_helper(user_id: int, db: Session):
    """Helper function to fetch user goals"""
    goals = db.query(Goal).filter(Goal.user_id == user_id).all()  # Changed user.id to user_id
    
    # List of nice colors for goals
    goal_colors = [
        "#36A2EB",  # Blue
        "#FF6384",  # Pink/Red
        "#FFCE56",  # Yellow
        "#4BC0C0",  # Teal
        "#9966FF",  # Purple
        "#FF9F40",  # Orange
        "#C9CBCF",  # Gray
        "#7D5BA6",  # Your brand purple
        "#89CE94",  # Your brand green
        "#643173",  # Your brand dark purple
    ]
    
    return [
        {
            "id": g.id,
            "name": g.name,
            "target": g.target_amount,
            "current": g.current_amount,
            "type": g.type,
            "status": g.status,
            "color": goal_colors[i % len(goal_colors)]  # Assign unique color
        }
        for i, g in enumerate(goals)
    ]
# ========== API ENDPOINTS ==========

@router.get("/recent-purchases")
def get_recent_purchases_endpoint(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get recent transactions for the current user"""
    return fetch_recent_purchases_helper(user.id, db, limit)

@router.get("/expense-categories")
def get_expense_categories_endpoint(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db),
    month: str = None
):
    """Get expense categories with totals for the current user"""
    return fetch_expense_categories_helper(user.id, db, month)

@router.get("/goals")
def get_user_goals_endpoint(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get goals for the current user"""
    return fetch_user_goals_helper(user.id, db)

# ========== DASHBOARD SUMMARY ENDPOINT ==========

@router.get("/summary")
def get_dashboard_summary(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get all dashboard data in one endpoint"""
    
    # Get recent purchases
    recent_purchases = fetch_recent_purchases_helper(user.id, db, limit=10)
    
    # Get expense categories (current month)
    current_month = datetime.now().strftime("%Y-%m")
    expense_categories = fetch_expense_categories_helper(user.id, db, month=current_month)
    
    # Get goals
    goals = fetch_user_goals_helper(user.id, db)
    
    # Get user name from profile
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    user_name = ""
    
    if profile and profile.display_name:
        user_name = profile.display_name
    elif user.email:
        # Fallback to email username
        user_name = user.email.split('@')[0]
    
    return {
        "recent_purchases": recent_purchases,
        "expense_categories": expense_categories,
        "goals": goals,
        "user_name": user_name
    }

# Add to dashboard_router.py

# Update your dashboard_router.py - add more debugging

# IN dashboard_router.py - UPDATE WITH CORRECT CATEGORIES

@router.get("/business/summary")
def get_business_dashboard_summary(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get business dashboard data for the current user"""
    
    print(f"DEBUG: Getting business summary for user {user.id} ({user.email})")
    
    # Check if user has a profile
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    
    if not profile:
        print(f"DEBUG: No profile found for user {user.id}")
        raise HTTPException(
            status_code=403, 
            detail="User profile not found. Please complete your profile."
        )
    
    if not profile.is_business:
        raise HTTPException(
            status_code=403, 
            detail="User is not a business user"
        )
    
    # BUSINESS CATEGORIES BASED ON YOUR DATABASE:
    # Income: 17-21
    # Expenses: 22-30
    business_income_ids = [17, 18, 19, 20, 21]      # Client Payments, Software License Revenue, etc.
    business_expense_ids = list(range(22, 31))      # 22 through 30
    
    print(f"DEBUG: Business income category IDs: {business_income_ids}")
    print(f"DEBUG: Business expense category IDs: {business_expense_ids}")
    
    # Calculate total business income
    income_result = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user.id,
        Transaction.category_id.in_(business_income_ids),
        Transaction.amount > 0  # Income should be positive
    ).scalar()
    
    total_income = float(income_result) if income_result else 0.0
    
    # Calculate total business expenses (negative amounts, take absolute value)
    expense_result = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user.id,
        Transaction.category_id.in_(business_expense_ids),
        Transaction.amount < 0  # Expenses should be negative
    ).scalar()
    
    total_expenses = abs(float(expense_result)) if expense_result else 0.0
    
    print(f"DEBUG: Total business income: ${total_income:.2f}")
    print(f"DEBUG: Total business expenses: ${total_expenses:.2f}")
    
    # Get recent business income transactions (last 10)
    recent_income = db.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.category_id.in_(business_income_ids),
        Transaction.amount > 0
    ).order_by(desc(Transaction.created_at)).limit(10).all()
    
    # Get recent business expense transactions (last 10)
    recent_expenses = db.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.category_id.in_(business_expense_ids),
        Transaction.amount < 0
    ).order_by(desc(Transaction.created_at)).limit(10).all()
    
    print(f"DEBUG: Found {len(recent_income)} income transactions, {len(recent_expenses)} expense transactions")
    
    # Format recent income for frontend
    formatted_income = []
    for trans in recent_income:
        category_name = trans.category.name if trans.category else "Business Income"
        formatted_income.append({
            "id": trans.id,
            "description": category_name,
            "date": trans.created_at.strftime("%Y-%m-%d") if trans.created_at else "Unknown",
            "amount": f"${trans.amount:,.2f}"  # Already positive
        })
    
    # Format recent expenses for frontend
    formatted_expenses = []
    for trans in recent_expenses:
        category_name = trans.category.name if trans.category else "Business Expense"
        formatted_expenses.append({
            "id": trans.id,
            "description": category_name,
            "date": trans.created_at.strftime("%Y-%m-%d") if trans.created_at else "Unknown",
            "amount": f"${abs(trans.amount):,.2f}"  # Convert negative to positive for display
        })
    
    # Get quarterly data - REAL CALCULATION
    now = datetime.now()
    current_year = now.year
    
    # Define quarters
    quarters_config = [
        {"name": "Q1", "start": datetime(current_year, 1, 1), "end": datetime(current_year, 3, 31)},
        {"name": "Q2", "start": datetime(current_year, 4, 1), "end": datetime(current_year, 6, 30)},
        {"name": "Q3", "start": datetime(current_year, 7, 1), "end": datetime(current_year, 9, 30)},
        {"name": "Q4", "start": datetime(current_year, 10, 1), "end": datetime(current_year, 12, 31)}
    ]
    
    quarterly_income = []
    quarterly_expenses = []
    
    for quarter in quarters_config:
        # Calculate income for this quarter
        income_q = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user.id,
            Transaction.category_id.in_(business_income_ids),
            Transaction.amount > 0,
            Transaction.created_at >= quarter["start"],
            Transaction.created_at <= quarter["end"]
        ).scalar()
        
        # Calculate expenses for this quarter (take absolute value)
        expense_q = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user.id,
            Transaction.category_id.in_(business_expense_ids),
            Transaction.amount < 0,
            Transaction.created_at >= quarter["start"],
            Transaction.created_at <= quarter["end"]
        ).scalar()
        
        quarterly_income.append({
            "quarter": quarter["name"],
            "amount": float(income_q) if income_q else 0.0
        })
        
        quarterly_expenses.append({
            "quarter": quarter["name"],
            "amount": abs(float(expense_q)) if expense_q else 0.0  # Convert to positive
        })
    
    # Get budget data
    budget = db.query(Budget).filter(Budget.user_id == user.id).first()
    
    # Handle budget total - check if field exists
    if budget:
        # Check if budget has total_amount attribute
        if hasattr(budget, 'total_amount'):
            budget_total = budget.total_amount
        else:
            print("WARNING: Budget model doesn't have total_amount field, using default")
            budget_total = 100000
    else:
        # Create a default budget if none exists
        budget_total = 100000
    
    # Budget used is total expenses
    budget_used = total_expenses
    
    print(f"DEBUG: Budget - used: ${budget_used:.2f}, total: ${budget_total:.2f}")
    
    return {
        "budget": {
            "used": budget_used,
            "total": budget_total
        },
        "incomeData": quarterly_income,
        "expenseData": quarterly_expenses,
        "recentIncome": formatted_income,
        "recentExpenses": formatted_expenses,
        "business_name": profile.business_name or "My Business",
        "stats": {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_profit": total_income - total_expenses,
            "budget_percentage": (budget_used / budget_total * 100) if budget_total > 0 else 0
        }
    }
    
@router.get("/business/debug")
def debug_business_data(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Debug endpoint to see what business data exists"""
    
    # Check profile
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    
    # Get all business transactions
    business_income_ids = [17, 18, 19, 20, 21]
    business_expense_ids = list(range(22, 31))
    
    all_business_ids = business_income_ids + business_expense_ids
    
    # Get all transactions
    all_transactions = db.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.category_id.in_(all_business_ids)
    ).all()
    
    # Format for display
    formatted_tx = []
    for tx in all_transactions:
        category_name = tx.category.name if tx.category else f"Category {tx.category_id}"
        formatted_tx.append({
            "id": tx.id,
            "category_id": tx.category_id,
            "category_name": category_name,
            "amount": tx.amount,
            "created_at": tx.created_at.strftime("%Y-%m-%d") if tx.created_at else None,
            "type": "income" if tx.amount > 0 else "expense"
        })
    
    # Check categories
    categories = db.query(Category).filter(Category.id.in_(all_business_ids)).all()
    
    return {
        "user_id": user.id,
        "email": user.email,
        "profile_exists": profile is not None,
        "is_business": profile.is_business if profile else False,
        "business_name": profile.business_name if profile else None,
        "total_transactions": len(all_transactions),
        "transactions": formatted_tx,
        "categories": [{"id": c.id, "name": c.name, "kind": c.kind} for c in categories],
        "business_income_ids": business_income_ids,
        "business_expense_ids": business_expense_ids
    }