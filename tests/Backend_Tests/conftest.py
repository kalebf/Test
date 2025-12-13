import sys
import os
import pytest
from fastapi.testclient import TestClient

# -------------------------------
# Set required env vars for tests
# -------------------------------
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")

# --------------------------------
# Add backend/ to Python path
# --------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
sys.path.insert(0, BACKEND_DIR)

from main import app  # backend/main.py


@pytest.fixture
def client():
    return TestClient(app)

