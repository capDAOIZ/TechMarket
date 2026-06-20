from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://techjobs:techjobs@localhost:5432/techjobs"
    data_lake_root: Path = Path("data-lake")
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000"
    )
    log_level: str = "INFO"
    external_request_timeout_seconds: float = 30.0
    external_request_max_retries: int = 3
    external_request_backoff_seconds: float = 1.0
    external_request_delay_seconds: float = 0.1
    adzuna_app_id: str | None = None
    adzuna_app_key: str | None = None
    adzuna_country: str = "es"
    adzuna_category: str = "it-jobs"
    adzuna_default_limit: int = 100

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
