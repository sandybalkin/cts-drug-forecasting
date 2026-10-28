"""Keep tests off the repository's data/pharmalaunch.duckdb file.

This runs before test modules import the backend, so the engine created at
import time already points at a throwaway file. Each test then rebinds to its
own temporary file.
"""

import os
import tempfile
from pathlib import Path

import pytest

_SESSION_DIR = Path(tempfile.mkdtemp(prefix="pharmalaunch-duckdb-"))
os.environ["DUCKDB_PATH"] = str(_SESSION_DIR / "import.duckdb")
os.environ["FORECAST_CACHE_DIR"] = str(_SESSION_DIR / "forecast-cache")
os.environ["FORECAST_DATA_SOURCE"] = "local"


@pytest.fixture(autouse=True)
def isolated_duckdb(tmp_path):
    import backend.database as database

    path = tmp_path / "pharmalaunch.duckdb"
    database.init_database(path)
    yield path
