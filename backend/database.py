"""Embedded DuckDB persistence for the local PharmaLaunch database.

The SQLAlchemy dialect (duckdb-engine) still inherits PostgreSQL DDL, which
emits ``SERIAL`` / ``BIGSERIAL`` / ``SMALLSERIAL``. DuckDB does not provide
those pseudo-types (and DuckDB 2.0 rejects ``GENERATED ... AS IDENTITY``),
so this module rewrites them to ``nextval`` sequences before ``CREATE TABLE``.

JSONB is not used. Structured documents are SQLAlchemy ``JSON`` columns,
which DuckDB stores as JSON. ``ILIKE`` is native DuckDB and is left unchanged.

Connection configuration is ``DUCKDB_PATH`` (default ``data/pharmalaunch.duckdb``).
``DB_PASSWORD`` and a PostgreSQL ``DATABASE_URL`` are ignored.
"""

from __future__ import annotations

import os
import re
from pathlib import Path

import duckdb_engine
from dotenv import load_dotenv
from sqlalchemy import create_engine, event, text
from sqlalchemy.dialects.postgresql.base import PGDDLCompiler
from sqlalchemy.engine.url import URL
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy.sql.sqltypes import Integer

_IDENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE)

DEFAULT_RELATIVE_PATH = "data/pharmalaunch.duckdb"


def identity_sequence_name(table_name: str, column_name: str) -> str:
    """Sequence backing a former SERIAL/BIGSERIAL primary key."""
    name = f"{table_name}_{column_name}_seq"
    if not _IDENT.fullmatch(name):
        raise ValueError(f"Refusing unsafe DuckDB sequence name: {name!r}")
    return name


def _needs_identity_sequence(column) -> bool:
    """True for the single integer primary key duckdb-engine would emit as SERIAL."""
    table = column.table
    if table is None or not column.primary_key:
        return False
    if column is not getattr(table, "_autoincrement_column", None):
        return False
    return isinstance(column.type, Integer)


class DuckDBDDLCompiler(PGDDLCompiler):
    """Compile PostgreSQL serial primary keys as DuckDB ``nextval`` defaults."""

    def get_column_specification(self, column, **kwargs):
        spec = super().get_column_specification(column, **kwargs)
        if "SERIAL" not in spec:
            return spec
        sequence = identity_sequence_name(column.table.name, column.name)
        # BIGSERIAL / SMALLSERIAL contain the substring SERIAL; replace those first.
        spec = spec.replace(
            " BIGSERIAL", f" BIGINT DEFAULT nextval('{sequence}')", 1
        )
        spec = spec.replace(
            " SMALLSERIAL", f" SMALLINT DEFAULT nextval('{sequence}')", 1
        )
        spec = spec.replace(
            " SERIAL", f" INTEGER DEFAULT nextval('{sequence}')", 1
        )
        return spec


# Patch the dialect class before any engine is constructed.
duckdb_engine.Dialect.ddl_compiler = DuckDBDDLCompiler


def resolve_duckdb_path(raw: str | None = None) -> Path:
    """Resolve a DuckDB file path. Relative paths are from the repository root."""
    if raw is None:
        raw = os.getenv("DUCKDB_PATH", "")
    raw = (raw or "").strip() or DEFAULT_RELATIVE_PATH
    path = Path(raw).expanduser()
    if not path.is_absolute():
        path = (BASE_DIR / path).resolve()
    else:
        path = path.resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def duckdb_url(path: Path) -> str:
    """SQLAlchemy URL for an embedded DuckDB file."""
    return str(URL.create("duckdb", database=path.as_posix()))


def create_duckdb_engine(path: Path):
    """Open an embedded DuckDB file.

    ``NullPool`` gives each session its own DuckDB connection. DuckDB
    connections are not safe to share across FastAPI worker threads, and a
    pooled connection checked out concurrently corrupts the session.
    """
    return create_engine(duckdb_url(path), poolclass=NullPool)


def _ensure_identity_sequences(target, connection, **kw) -> None:
    tables = list(target.sorted_tables)
    for table in tables:
        for column in table.columns:
            if not _needs_identity_sequence(column):
                continue
            sequence = identity_sequence_name(table.name, column.name)
            connection.execute(
                text(f"CREATE SEQUENCE IF NOT EXISTS {sequence} START 1")
            )


Base = declarative_base()
event.listen(Base.metadata, "before_create", _ensure_identity_sequences)

DUCKDB_PATH = resolve_duckdb_path()
DATABASE_URL = duckdb_url(DUCKDB_PATH)

_ignored_pg = []
if os.getenv("DB_PASSWORD"):
    _ignored_pg.append("DB_PASSWORD")
_database_url = os.getenv("DATABASE_URL", "")
if _database_url.startswith("postgresql"):
    _ignored_pg.append("DATABASE_URL")
if _ignored_pg:
    print(
        "Ignoring legacy PostgreSQL settings "
        f"({', '.join(_ignored_pg)}). Using embedded DuckDB at {DUCKDB_PATH}."
    )

engine = create_duckdb_engine(DUCKDB_PATH)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_database(duckdb_path: str | Path | None = None):
    """Point this process at a DuckDB file. Tests pass a temporary path."""
    global engine, DUCKDB_PATH, DATABASE_URL
    if duckdb_path is None:
        DUCKDB_PATH = resolve_duckdb_path()
    else:
        DUCKDB_PATH = resolve_duckdb_path(str(duckdb_path))
    DATABASE_URL = duckdb_url(DUCKDB_PATH)
    engine.dispose()
    engine = create_duckdb_engine(DUCKDB_PATH)
    SessionLocal.configure(bind=engine)
    return engine


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
