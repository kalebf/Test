from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional # Use this if some fields are optional

class Settings(BaseSettings):
    # Existing fields:
    DATABASE_URL: str = "postgresql+psycopg2://clarifi_db_user:Fwe1upxTMYXo1xR8PMkoDaTGr8Xe35g3@dpg-d44kca8dl3ps73bdcn90-a.oregon-postgres.render.com:5432/clarifi_db"
    SECRET_KEY: str = "W1jmxhEMnfnIiOveoTZYv2c61-QIHVLFTBde8K4MKxU"     
    #My Local:postgresql+psycopg2://postgres:kalebf6201@localhost:5432/Test
    #Actual: postgresql+psycopg2://clarifi_db_user:Fwe1upxTMYXo1xR8PMkoDaTGr8Xe35g3@dpg-d44kca8dl3ps73bdcn90-a.oregon-postgres.render.com:5432/clarifi_db
    # Add the fields that were listed as "Extra inputs are not permitted" in the error:
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    LLM_MODEL: str = "llama3.2"  # Updated to match the new field name

    class Config:
        env_file = ".env" # which is good practice  


settings = Settings()
