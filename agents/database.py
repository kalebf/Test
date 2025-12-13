from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import StaticPool
from .config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    poolclass=StaticPool,
    connect_args={"options": "-c timezone=utc"}
)

SessionLocal = scoped_session(
    sessionmaker(autocommit=False, autoflush=False, bind=engine)
)

def get_db():
    """Dependency for FastAPI to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()