"""
config.py — App configuration using Pydantic Settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Groq
    GROQ_API_KEY: str = "your_groq_api_key_here"

    # PostgreSQL
    DATABASE_URL: str = "postgresql://karma:karma123@localhost:5432/karma_images"

    # FastAPI
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # LangChain / Agent
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    MAX_MEMORY_MESSAGES: int = 10


settings = Settings()
