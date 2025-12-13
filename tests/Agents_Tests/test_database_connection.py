from sqlalchemy import text
from database.connection import engine


def test_database_connection():
    """
    Verify that the database connection can be established.
    """
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        assert result.scalar() == 1
