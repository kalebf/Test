from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
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
from models.budget_entries import BudgetEntry

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def fetch_recent_purchases_helper(user_id: int, db: Session, limit: int = 10):
    """Helper function to fetch recent purchases"""
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
    ).order_by(desc(Transaction.created_at)).limit(limit).all()
    
    # Map category IDs to specific item names for personal expenses
    category_item_map = {
        1: "Rent Payment",
        2: "Grocery Shopping",
        3: "Gas Station",
        4: "Movie Tickets",
        5: "Doctor Visit",
        6: "Insurance Premium",
        7: "Savings Deposit",
        8: "Miscellaneous Expense",
        22: "Office Rent",
        23: "Salary Payment",
        24: "Software Purchase",
        25: "Marketing Expense",
        26: "Utility Bill",
        27: "Business Development",
        28: "Product Development",
        29: "Training Course",
        30: "Business Operations",
    }
    
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
        item_name = "Purchase"
        
        if t.category_id and t.category_id in category_item_map:
            item_name = category_item_map[t.category_id]
        elif t.category and t.category.name:
            category_name = t.category.name
            if category_name in category_generic_map:
                item_name = category_generic_map[category_name]
            else:
                item_name = category_name
        
        if t.category_id == 2:
            if abs(t.amount) < 30:
                item_name = "Coffee Shop"
            elif abs(t.amount) < 80:
                item_name = "Restaurant Meal"
            else:
                item_name = "Grocery Shopping"
        elif t.category_id == 3:
            if abs(t.amount) < 40:
                item_name = "Bus/Train Fare"
            elif abs(t.amount) < 100:
                item_name = "Gas Station"
            else:
                item_name = "Car Maintenance"
        elif t.category_id == 4:
            if abs(t.amount) < 30:
                item_name = "Streaming Service"
            elif abs(t.amount) < 60:
                item_name = "Movie Tickets"
            else:
                item_name = "Concert/Event"
        elif t.category_id == 26:
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
            pass
    
    results = query.group_by(Category.id, Category.name).all()
    
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
    goals = db.query(Goal).filter(Goal.user_id == user_id).all()
    
    goal_colors = [
        "#36A2EB", "#FF6384", "#FFCE56", "#4BC0C0", "#9966FF",
        "#FF9F40", "#C9CBCF", "#7D5BA6", "#89CE94", "#643173",
    ]
    
    return [
        {
            "id": g.id,
            "name": g.name,
            "target": g.target_amount,
            "current": g.current_amount,
            "type": g.type,
            "status": g.status,
            "color": goal_colors[i % len(goal_colors)]
        }
        for i, g in enumerate(goals)
    ]


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

@router.get("/summary")
def get_dashboard_summary(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get all dashboard data in one endpoint"""
    
    recent_purchases = fetch_recent_purchases_helper(user.id, db, limit=10)
    current_month = datetime.now().strftime("%Y-%m")
    expense_categories = fetch_expense_categories_helper(user.id, db, month=current_month)
    goals = fetch_user_goals_helper(user.id, db)
    
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    user_name = ""
    
    if profile and profile.display_name:
        user_name = profile.display_name
    elif user.email:
        user_name = user.email.split('@')[0]
    
    return {
        "recent_purchases": recent_purchases,
        "expense_categories": expense_categories,
        "goals": goals,
        "user_name": user_name
    }


@router.get("/business/summary")
def get_business_dashboard_summary(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get business dashboard data for the current user - works for both business_admin and business_subuser"""
    
    print(f"=== BUSINESS DASHBOARD FOR USER {user.id} ===")
    
    # Get profile
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    business_id = user.business_id
    if not business_id:
        raise HTTPException(status_code=400, detail="User is not associated with a business")
    
    print(f"Business ID: {business_id}")
    
    # Get the business admin user for this business
    admin_user = db.query(User).filter(
        User.business_id == business_id,
        User.role_id == 2  # business_admin role
    ).first()
    
    if not admin_user:
        raise HTTPException(status_code=404, detail="Business admin not found")
    
    print(f"Using business admin user_id: {admin_user.id} for data")
    
    # USE ADMIN'S USER_ID FOR ALL DATA QUERIES
    target_user_id = admin_user.id
    
    # Business category IDs
    business_income_ids = [17, 18, 19, 20, 21]
    business_expense_ids = [22, 23, 24, 25, 26, 27, 28, 29, 30]
    
    print(f"Business income category IDs: {business_income_ids}")
    print(f"Business expense category IDs: {business_expense_ids}")
    
    # Get TOTAL BUDGET from budget_entries
    budget_entry = db.query(BudgetEntry).filter(
        BudgetEntry.user_id == target_user_id
    ).first()
    
    if budget_entry:
        total_budget = float(budget_entry.planned)
        print(f"Budget from budget_entries: ${total_budget}")
    else:
        # Just use default budget
        total_budget = 60000.0
        print(f"Using default budget: ${total_budget}")
    
    # Calculate TOTAL EXPENSES
    expense_result = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == target_user_id,
        Transaction.category_id.in_(business_expense_ids)
    ).scalar()
    
    total_expenses = abs(float(expense_result)) if expense_result else 0.0
    print(f"Total Expenses: ${total_expenses}")
    
    # Calculate TOTAL INCOME
    income_result = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == target_user_id,
        Transaction.category_id.in_(business_income_ids)
    ).scalar()
    
    total_income = float(income_result) if income_result else 0.0
    print(f"Total Income: ${total_income}")
    
    # Budget used = total expenses
    budget_used = total_expenses
    budget_percentage = (budget_used / total_budget * 100) if total_budget > 0 else 0
    
    print(f"Budget: ${budget_used:.2f} used / ${total_budget:.2f} total = {budget_percentage:.1f}%")
    
    # Get current year
    current_year = datetime.now().year
    
    # QUARTERLY INCOME DATA
    quarterly_income_data = db.query(
        func.floor((extract('month', Transaction.created_at) - 1) / 3).label('quarter_num'),
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == target_user_id,
        Transaction.category_id.in_(business_income_ids),
        extract('year', Transaction.created_at) == current_year
    ).group_by('quarter_num').all()
    
    # Build quarterly income array
    quarterly_income = [
        {"quarter": "Q1", "amount": 0.0},
        {"quarter": "Q2", "amount": 0.0},
        {"quarter": "Q3", "amount": 0.0},
        {"quarter": "Q4", "amount": 0.0}
    ]
    
    for q_num, total in quarterly_income_data:
        if q_num is not None and 0 <= int(q_num) <= 3:
            quarterly_income[int(q_num)]["amount"] = float(total) if total else 0.0
    
    print(f"Quarterly Income: {quarterly_income}")
    
    # QUARTERLY EXPENSE DATA
    quarterly_expense_data = db.query(
        func.floor((extract('month', Transaction.created_at) - 1) / 3).label('quarter_num'),
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == target_user_id,
        Transaction.category_id.in_(business_expense_ids),
        extract('year', Transaction.created_at) == current_year
    ).group_by('quarter_num').all()
    
    # Build quarterly expense array
    quarterly_expenses = [
        {"quarter": "Q1", "amount": 0.0},
        {"quarter": "Q2", "amount": 0.0},
        {"quarter": "Q3", "amount": 0.0},
        {"quarter": "Q4", "amount": 0.0}
    ]
    
    for q_num, total in quarterly_expense_data:
        if q_num is not None and 0 <= int(q_num) <= 3:
            quarterly_expenses[int(q_num)]["amount"] = abs(float(total)) if total else 0.0
    
    print(f"Quarterly Expenses: {quarterly_expenses}")
    
    # Get recent income transactions
    recent_income = db.query(Transaction).filter(
        Transaction.user_id == target_user_id,
        Transaction.category_id.in_(business_income_ids)
    ).order_by(desc(Transaction.created_at)).limit(10).all()
    
    # Get recent expense transactions
    recent_expenses = db.query(Transaction).filter(
        Transaction.user_id == target_user_id,
        Transaction.category_id.in_(business_expense_ids)
    ).order_by(desc(Transaction.created_at)).limit(10).all()
    
    print(f"Recent transactions: {len(recent_income)} income, {len(recent_expenses)} expenses")
    
    # Format income for frontend
    formatted_income = []
    for trans in recent_income:
        category_name = trans.category.name if trans.category else f"Income Category {trans.category_id}"
        formatted_income.append({
            "id": trans.id,
            "description": category_name,
            "date": trans.created_at.strftime("%Y-%m-%d") if trans.created_at else "Unknown",
            "amount": f"${trans.amount:,.2f}"
        })
    
    # Format expenses for frontend
    formatted_expenses = []
    for trans in recent_expenses:
        category_name = trans.category.name if trans.category else f"Expense Category {trans.category_id}"
        formatted_expenses.append({
            "id": trans.id,
            "description": category_name,
            "date": trans.created_at.strftime("%Y-%m-%d") if trans.created_at else "Unknown",
            "amount": f"${abs(trans.amount):,.2f}"
        })
    
    # Prepare response
    response_data = {
        "budget": {
            "used": float(budget_used),
            "total": float(total_budget)
        },
        "incomeData": quarterly_income,
        "expenseData": quarterly_expenses,
        "recentIncome": formatted_income,
        "recentExpenses": formatted_expenses,
        "business_name": profile.business_name or "Business",
        "stats": {
            "total_income": float(total_income),
            "total_expenses": float(total_expenses),
            "net_profit": float(total_income - total_expenses),
            "budget_percentage": float(budget_percentage)
        }
    }
    
    print(f"=== FINAL RESPONSE DATA ===")
    print(f"Budget: ${response_data['budget']['used']} / ${response_data['budget']['total']}")
    print(f"Income Data: {response_data['incomeData']}")
    print(f"Expense Data: {response_data['expenseData']}")
    print(f"Recent Income: {len(response_data['recentIncome'])} items")
    print(f"Recent Expenses: {len(response_data['recentExpenses'])} items")
    
    return response_data


@router.get("/business/goals")
def get_business_goals(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get business goals - works for both business_admin and business_subuser"""
    
    print(f"=== FETCHING BUSINESS GOALS FOR USER {user.id} ===")
    
    # Get business_id
    business_id = user.business_id
    if not business_id:
        raise HTTPException(status_code=400, detail="User is not associated with a business")
    
    # Find the business admin for this business
    admin_user = db.query(User).filter(
        User.business_id == business_id,
        User.role_id == 2  # business_admin role
    ).first()
    
    if not admin_user:
        raise HTTPException(status_code=404, detail="Business admin not found")
    
    print(f"Using business admin user_id: {admin_user.id} for goals")
    
    # Get all business goals for the admin
    goals = db.query(Goal).filter(
        Goal.user_id == admin_user.id,
        Goal.type == "business"
    ).all()
    
    print(f"Found {len(goals)} business goals")
    
    # Department color mapping
    department_colors = {
        "Sales": "#7D5BA6",
        "Marketing": "#6BB577",
        "Operations": "#4BC0C0",
        "R&D": "#9966FF",
        "HR": "#FF9F40",
        "Finance": "#8B5CF6",
        "IT": "#36A2EB",
        "Customer Support": "#FF6B8B",
        "General": "#A0AEC0",
        "Revenue": "#E63946",
        "Campaign": "#F77F00",
        "Cost": "#06A77D",
        "Product": "#2A9D8F",
        "Training": "#9D4EDD",
        "Development": "#4361EE"
    }
    
    # Format goals for frontend
    formatted_goals = []
    for i, goal in enumerate(goals):
        department = "General"
        goal_name_lower = goal.name.lower()
        
        # Check for specific keywords in order of priority
        if "revenue" in goal_name_lower or "sales" in goal_name_lower:
            department = "Revenue"
        elif "marketing" in goal_name_lower or "campaign" in goal_name_lower:
            department = "Campaign"
        elif "cost" in goal_name_lower or "reduction" in goal_name_lower:
            department = "Cost"
        elif "product" in goal_name_lower:
            department = "Product"
        elif "training" in goal_name_lower or "employee" in goal_name_lower:
            department = "Training"
        elif "development" in goal_name_lower:
            department = "Development"
        elif "operations" in goal_name_lower:
            department = "Operations"
        elif "finance" in goal_name_lower:
            department = "Finance"
        elif "hr" in goal_name_lower or "human" in goal_name_lower:
            department = "HR"
        elif "it" in goal_name_lower or "technology" in goal_name_lower:
            department = "IT"
        elif "support" in goal_name_lower or "customer" in goal_name_lower:
            department = "Customer Support"
        
        formatted_goals.append({
            "id": goal.id,
            "name": goal.name,
            "target": float(goal.target_amount),
            "current": float(goal.current_amount),
            "department": department,
            "color": department_colors.get(department, "#A0AEC0"),
            "status": goal.status
        })
    
    print(f"Returning {len(formatted_goals)} formatted goals")
    
    return formatted_goals

@router.post("/business/goals")
def create_business_goal(
    goal_data: dict,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Create a new business goal"""
    
    # Get business_id
    business_id = user.business_id
    if not business_id:
        raise HTTPException(status_code=400, detail="User is not associated with a business")
    
    # Find the business admin
    admin_user = db.query(User).filter(
        User.business_id == business_id,
        User.role_id == 2
    ).first()
    
    if not admin_user:
        raise HTTPException(status_code=404, detail="Business admin not found")
    
    # Create goal for the admin (shared across business)
    new_goal = Goal(
        user_id=admin_user.id,
        name=goal_data.get("name"),
        type="business",
        target_amount=float(goal_data.get("amount")),
        current_amount=0.0,
        status="on_track"
    )
    
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    
    return {
        "message": "Business goal created successfully",
        "goal_id": new_goal.id
    }

@router.put("/business/goals/{goal_id}")
def update_business_goal(
    goal_id: int,
    goal_data: dict,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update a business goal"""
    
    # Get business_id
    business_id = user.business_id
    if not business_id:
        raise HTTPException(status_code=400, detail="User is not associated with a business")
    
    # Find the business admin
    admin_user = db.query(User).filter(
        User.business_id == business_id,
        User.role_id == 2
    ).first()
    
    if not admin_user:
        raise HTTPException(status_code=404, detail="Business admin not found")
    
    # Get the goal
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == admin_user.id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Update goal fields
    if "name" in goal_data:
        goal.name = goal_data["name"]
    if "target" in goal_data:
        goal.target_amount = float(goal_data["target"])
    if "current" in goal_data:
        goal.current_amount = float(goal_data["current"])
    
    # Update status based on current vs target
    if goal.current_amount >= goal.target_amount:
        goal.status = "completed"
    else:
        goal.status = "on_track"
    
    db.commit()
    db.refresh(goal)
    
    return {
        "message": "Business goal updated successfully",
        "goal_id": goal.id
    }

@router.delete("/business/goals/{goal_id}")
def delete_business_goal(
    goal_id: int,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Delete a business goal"""
    
    # Get business_id
    business_id = user.business_id
    if not business_id:
        raise HTTPException(status_code=400, detail="User is not associated with a business")
    
    # Find the business admin
    admin_user = db.query(User).filter(
        User.business_id == business_id,
        User.role_id == 2
    ).first()
    
    if not admin_user:
        raise HTTPException(status_code=404, detail="Business admin not found")
    
    # Get the goal
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == admin_user.id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    db.delete(goal)
    db.commit()
    
    return {
        "message": "Business goal deleted successfully"
    }

@router.get("/business/test/{user_id}")
def test_business_data(user_id: int, db: Session = Depends(get_db)):
    """Test endpoint to see business data for any user"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    budget_entries = db.query(BudgetEntry).filter(BudgetEntry.user_id == user_id).all()
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
    
    business_income_ids = [17, 18, 19, 20, 21]
    business_expense_ids = [22, 23, 24, 25, 26, 27, 28, 29, 30]
    
    income_tx = [t for t in transactions if t.category_id in business_income_ids]
    expense_tx = [t for t in transactions if t.category_id in business_expense_ids]
    
    return {
        "user": {
            "id": user.id,
            "email": user.email
        },
        "profile": {
            "exists": profile is not None,
            "is_business": profile.is_business if profile else False,
            "business_name": profile.business_name if profile else None
        },
        "budget_entries": [
            {
                "id": be.id,
                "budget_id": be.budget_id,
                "category_id": be.category_id,
                "planned": be.planned,
                "user_id": be.user_id
            } for be in budget_entries
        ],
        "transactions": {
            "total": len(transactions),
            "income": len(income_tx),
            "expenses": len(expense_tx),
            "income_list": [
                {
                    "id": t.id,
                    "category_id": t.category_id,
                    "category_name": t.category.name if t.category else None,
                    "amount": t.amount,
                    "date": t.created_at
                } for t in income_tx
            ],
            "expense_list": [
                {
                    "id": t.id,
                    "category_id": t.category_id,
                    "category_name": t.category.name if t.category else None,
                    "amount": t.amount,
                    "date": t.created_at
                } for t in expense_tx
            ]
        }
    }