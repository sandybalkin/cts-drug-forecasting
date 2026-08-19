import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Project root = one level above backend/
BASE_DIR = Path(__file__).resolve().parent.parent

# Explicitly load the project's .env file
ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE)

DB_PASSWORD = os.getenv("DB_PASSWORD")

if not DB_PASSWORD:
    raise RuntimeError(f"DB_PASSWORD is not set. Expected .env at: {ENV_FILE}")

# URL-encode the password so special characters like @ work correctly
encoded_password = quote_plus(DB_PASSWORD)

DATABASE_URL = (
    f"postgresql://postgres:{encoded_password}"
    f"@localhost:5432/pharmalaunch"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()