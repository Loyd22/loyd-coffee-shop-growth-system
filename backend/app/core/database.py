from __future__ import annotations

from collections.abc import Generator
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

if not settings.database_url:
    raise RuntimeError(
        "DATABASE_URL is not set. Configure it in backend/.env or frontend/.env."
    )

UNSUPPORTED_QUERY_PARAMS = {
    "pgbouncer",
    "connection_limit",
    "pool_timeout",
    "schema",
}


def _sanitize_database_url(database_url: str) -> str:
    """
    Prisma URLs often include query params that psycopg/SQLAlchemy does not accept.
    We remove Prisma-only params so backend can reuse the same DATABASE_URL.
    """
    normalized = (
        database_url.replace("postgres://", "postgresql://", 1)
        if database_url.startswith("postgres://")
        else database_url
    )

    url_parts = urlsplit(normalized)
    query_pairs = parse_qsl(url_parts.query, keep_blank_values=True)
    filtered_pairs = [
        (key, value)
        for key, value in query_pairs
        if key not in UNSUPPORTED_QUERY_PARAMS
    ]

    return urlunsplit(
        (
            url_parts.scheme,
            url_parts.netloc,
            url_parts.path,
            urlencode(filtered_pairs),
            url_parts.fragment,
        )
    )


engine = create_engine(
    _sanitize_database_url(settings.database_url),
    future=True,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True,
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
