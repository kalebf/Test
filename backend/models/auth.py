from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.connection import Base

class AuthCredentials(Base):
    __tablename__ = "authcredentials"   

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    
    password_hash = Column(String, nullable=False)
    password_algo = Column(String, default="bcrypt", nullable=False)
    password_updated_at = Column(TIMESTAMP, server_default=func.now())

    
    failed_attempts = Column(Integer, default=0, nullable=False)
    last_failed_at = Column(TIMESTAMP)
    last_login = Column(TIMESTAMP)

    # Relationship back to User
    user = relationship("User", back_populates="auth_credentials")
