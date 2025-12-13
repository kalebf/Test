from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from sqlalchemy import text

from database.connection import Base, engine, SessionLocal
from routers.auth_router import router as auth_router
from routers.goals import router as goals_router
from routers.dashboard_router import router as dashboard_router
from routers.chat_router import router as chat_router  # NEW
from core.config import settings

print(">>> USING DATABASE URL:", settings.DATABASE_URL)

from models.user import User
from models.auth import AuthCredentials
from models.profile import Profile
from models.business import Business
from models.role import Role
from models.categories import Category
from models.transactions import Transaction
from models.budgets import Budget
from models.budget_entries import BudgetEntry
from models.llmlogs import LLMLog

app = FastAPI(title="ClariFi API", version="1.0.0")

Base.metadata.create_all(bind=engine)

# configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Include routers
app.include_router(auth_router)
app.include_router(goals_router)
app.include_router(dashboard_router)
app.include_router(chat_router)  # NEW

@app.get("/")
def root():
    return {"status": "OK"}

@app.get("/db-test")
def db_test():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1;"))
        return {"db_status": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="ClariFi API",
        version="1.0.0",
        description="API docs",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    for path in openapi_schema["paths"].values():
        for method in path.values():
            method.setdefault("security", [{"BearerAuth": []}])

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi