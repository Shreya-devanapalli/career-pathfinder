from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/career_pathfinder"

    supabase_url: str = ""
    supabase_key: str = ""

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    jwt_secret: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    cors_origins: list[str] = [
    "http://localhost:5173",
    "http://localhost:5175",
]

    # Ignore retired provider variables (for example, GEMINI_API_KEY) so an
    # existing local .env continues to work during the Groq migration.
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
