from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


def _load_environment_files() -> None:
    """Load local env files so backend and frontend share DATABASE_URL in dev."""
    project_root = Path(__file__).resolve().parents[3]

    candidates = [
        project_root / "backend" / ".env",
        project_root / "frontend" / ".env",
        project_root / "frontend" / ".env.local",
    ]

    for env_file in candidates:
        if env_file.exists():
            load_dotenv(env_file, override=False)


_load_environment_files()


def _parse_cors_origins(raw_value: str | None) -> list[str]:
    if not raw_value:
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]

    origins = [origin.strip() for origin in raw_value.split(",")]
    return [origin for origin in origins if origin]


@dataclass(frozen=True)
class Settings:
    app_name: str
    api_v1_prefix: str
    database_url: str | None
    cors_origins: list[str]


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "Loyd Coffee Shop Growth System API"),
        api_v1_prefix=os.getenv("API_V1_PREFIX", "/api/v1"),
        database_url=os.getenv("DATABASE_URL"),
        cors_origins=_parse_cors_origins(os.getenv("BACKEND_CORS_ORIGINS")),
    )
