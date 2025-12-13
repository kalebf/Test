from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = ""
    SECRET_KEY: str = ""     
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    LLM_MODEL: str = "qwen3:0.6b"

    class Config:
        env_file = ".env" 


settings = Settings()
