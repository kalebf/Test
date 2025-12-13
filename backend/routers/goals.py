from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from models.goals import Goal
from models.user import User
from schemas.goals import GoalCreate, GoalUpdate, GoalOut
from routers.auth_router import verify_token
from datetime import date

router = APIRouter(prefix="/goals", tags=["Goals"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# GET ALL GOALS
@router.get("/", response_model=list[GoalOut])
def get_goals(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Only return goals for the current user
    return db.query(Goal).filter(Goal.user_id == user.id).all()


# CREATE GOAL
@router.post("/", response_model=GoalOut)
def create_goal(
    payload: GoalCreate,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    new_goal = Goal(
        user_id=user.id,
        name=payload.name,
        type=payload.type,
        target_amount=payload.target_amount,
        current_amount=payload.current_amount,
        target_date=payload.target_date,
        status="on_track"
    )
    
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal


# UPDATE GOAL
@router.put("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goal, key, value)

    # UPDATE STATUS RULES
    if goal.current_amount >= goal.target_amount:
        goal.status = "completed"
    elif goal.target_date and date.today() > goal.target_date:
        goal.status = "behind"
    else:
        goal.status = "on_track"

    db.commit()
    db.refresh(goal)
    return goal


# DELETE GOAL
@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}