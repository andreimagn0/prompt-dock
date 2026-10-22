"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Shared application settings.

    Values are loaded from a root-level ``.env`` file when it exists. Real
    environment variables take precedence over values in that file, and the
    defaults below keep local development runnable before a ``.env`` file is
    created.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Prompt-Dock API"
    environment: str = "development"
    database_url: str = "sqlite:///./prompt_dock.db"
    # HS256 needs at least 32 bytes; set a long random SECRET_KEY outside development
    secret_key: str = "dev-only-change-me-not-for-production-use"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30


@lru_cache
def get_settings() -> Settings:
    """Return one cached settings instance for the application."""

    return Settings()


settings = get_settings()
