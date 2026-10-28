"""Local forecast inputs from DuckDB or the repo CSVs, prepared by R.

Databricks gold tables are not queried. ``gold_product``,
``gold_bass_features``, and ``gold_weekly_rx`` correspond to the files
under ``data/`` (and to the DuckDB tables bootstrap loads). R fits the
historical Bass ``p`` and ``q`` values that those CSVs do not contain.

Set ``FORECAST_DATA_SOURCE=databricks`` only to see the explicit gap error.
The default is ``local``.
"""

from __future__ import annotations

import hashlib
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import pandas as pd

import backend.database as database

SIMILARITY_CSV = "similarity+analog_features_final.csv"
BASS_CSV = "bass_final.csv"
WEEKLY_CSV = "weekly_rx_final.csv"

SIMILARITY_COLUMNS = [
    "product_id",
    "therapeutic_area",
    "indication",
    "active_ingredient",
    "pharmacological_class",
    "mechanism_of_action",
    "route_of_administration",
    "target_population",
    "addressable_population",
    "competition_level",
    "relative_price_index",
    "market_access_level",
    "clinical_evidence_strength",
]
BASS_COLUMNS = [
    "product_id",
    "addressable_population",
    "estimated_penetration",
    "competition_level",
    "market_access_level",
    "relative_price_index",
    "marketing_awareness",
    "launch_strength",
    "physician_awareness",
    "clinical_evidence_strength",
    "treatment_familiarity",
]
WEEKLY_COLUMNS = [
    "product_id",
    "week_since_launch",
    "weekly_rx",
    "cumulative_rx",
]

DUCKDB_TABLES = {
    "similarity": ("analog_products", SIMILARITY_COLUMNS),
    "bass": ("bass_final", BASS_COLUMNS),
    "weekly": ("weekly_rx_final", WEEKLY_COLUMNS),
}

R_SCRIPT = Path(__file__).resolve().parent / "r" / "prepare_forecast_inputs.R"

DATABRICKS_REMOVED = (
    "Databricks is not a forecast runtime. gold_product, gold_bass_features, "
    "and gold_weekly_rx are prepared locally from data/*.csv or from the "
    "DuckDB tables created by python -m backend.bootstrap_duckdb. "
    "Historical Bass p and q are fit by backend/r/prepare_forecast_inputs.R. "
    "There is no warehouse host, HTTP path, or token. "
    "Set FORECAST_DATA_SOURCE=local, or leave it unset. "
    "Refreshing the catalog means replacing those CSVs; this repo has no "
    "other clinical extract."
)


def _data_dir(data_dir: str | Path | None) -> Path:
    if data_dir is None:
        return database.BASE_DIR / "data"
    path = Path(data_dir)
    if not path.is_absolute():
        path = (database.BASE_DIR / path).resolve()
    return path


def _rscript() -> str:
    configured = (os.getenv("RSCRIPT_PATH") or "Rscript").strip() or "Rscript"
    resolved = configured if os.path.sep in configured else shutil.which(configured)
    if not resolved:
        raise RuntimeError(
            "Rscript was not found. Install R and ensure Rscript is on PATH "
            "(macOS: the CRAN R package or `brew install r`; "
            "Ubuntu: `sudo apt-get install r-base-core`). "
            "Override the binary with RSCRIPT_PATH."
        )
    return resolved


def _duckdb_frame(duckdb_path: Path, table: str, columns: list[str]):
    import duckdb

    if not duckdb_path.is_file():
        return None
    con = duckdb.connect(str(duckdb_path), read_only=True)
    try:
        tables = {
            row[0]
            for row in con.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'main'
                """
            ).fetchall()
        }
        if table not in tables:
            return None
        present = [
            row[0]
            for row in con.execute(f"DESCRIBE {table}").fetchall()
        ]
        if any(column not in present for column in columns):
            return None
        count = con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        if not count:
            return None
        selected = ", ".join(columns)
        frame = con.execute(f"SELECT {selected} FROM {table}").fetchdf()
    except duckdb.Error:
        return None
    finally:
        con.close()
    if frame is None or frame.empty:
        return None
    return frame


def resolve_forecast_sources(
    data_dir: str | Path | None = None,
    duckdb_path: str | Path | None = None,
) -> dict[str, dict[str, str]]:
    """Return the file each forecast frame will be read from.

    DuckDB wins when the bootstrapped table exists and has the required
    columns. Otherwise the matching CSV under ``data/`` is used.
    """
    directory = _data_dir(data_dir)
    csv_names = {
        "similarity": SIMILARITY_CSV,
        "bass": BASS_CSV,
        "weekly": WEEKLY_CSV,
    }
    if duckdb_path is None:
        db_path = database.DUCKDB_PATH
    else:
        db_path = Path(duckdb_path)
    sources: dict[str, dict[str, str]] = {}
    for key, (table, columns) in DUCKDB_TABLES.items():
        frame = _duckdb_frame(db_path, table, columns)
        csv_path = directory / csv_names[key]
        if frame is not None:
            sources[key] = {
                "origin": f"duckdb:{table}",
                "duckdb_path": str(db_path),
                "rows": str(len(frame)),
            }
        else:
            sources[key] = {
                "origin": f"csv:{csv_path.name}",
                "path": str(csv_path),
                "rows": "",
            }
    return sources


def _fingerprint(data_dir: Path, duckdb_path: Path, sources: dict) -> str:
    parts = [f"script:{R_SCRIPT.stat().st_mtime_ns}:{R_SCRIPT.stat().st_size}"]
    for key, csv_name in (
        ("similarity", SIMILARITY_CSV),
        ("bass", BASS_CSV),
        ("weekly", WEEKLY_CSV),
    ):
        origin = sources[key]["origin"]
        parts.append(origin)
        if origin.startswith("csv:"):
            path = data_dir / csv_name
            stat = path.stat()
            parts.append(f"{stat.st_mtime_ns}:{stat.st_size}")
        else:
            stat = duckdb_path.stat()
            parts.append(f"{duckdb_path}:{stat.st_mtime_ns}:{stat.st_size}:{sources[key]['rows']}")
    digest = hashlib.sha256("\n".join(parts).encode()).hexdigest()
    return digest[:20]


def _cache_dir() -> Path:
    configured = (os.getenv("FORECAST_CACHE_DIR") or "").strip()
    if configured:
        path = Path(configured)
        if not path.is_absolute():
            path = (database.BASE_DIR / path).resolve()
    else:
        path = database.BASE_DIR / "data" / ".forecast_cache"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _stage_inputs(data_dir: Path, duckdb_path: Path, stage: Path) -> dict[str, dict[str, str]]:
    sources = resolve_forecast_sources(data_dir, duckdb_path)
    filenames = {
        "similarity": "similarity_input.csv",
        "bass": "bass_input.csv",
        "weekly": "weekly_input.csv",
    }
    csv_names = {
        "similarity": SIMILARITY_CSV,
        "bass": BASS_CSV,
        "weekly": WEEKLY_CSV,
    }
    for key, (table, columns) in DUCKDB_TABLES.items():
        dest = stage / filenames[key]
        if sources[key]["origin"].startswith("duckdb:"):
            frame = _duckdb_frame(duckdb_path, table, columns)
            if frame is None:
                raise RuntimeError(f"DuckDB table {table} disappeared while staging.")
            frame.to_csv(dest, index=False)
        else:
            src = data_dir / csv_names[key]
            if not src.is_file():
                raise FileNotFoundError(
                    f"Forecast CSV not found at {src}. "
                    "Expected the files shipped under data/."
                )
            shutil.copyfile(src, dest)
        sources[key]["staged"] = str(dest)
    return sources


def _read_prepared(directory: Path) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    similarity = pd.read_csv(directory / "similarity.csv")
    bass = pd.read_csv(directory / "bass.csv")
    weekly = pd.read_csv(directory / "weekly.csv")
    for frame in (similarity, bass, weekly):
        if "product_id" in frame.columns:
            frame["product_id"] = frame["product_id"].astype(str)
    required = {"p_fit", "q_fit", "m", "fit_r2"}
    missing = required.difference(bass.columns)
    if missing:
        raise RuntimeError(
            "R preparation did not return Bass fit columns: "
            + ", ".join(sorted(missing))
        )
    return similarity, bass, weekly


def load_forecast_frames(
    data_dir: str | Path | None = None,
    duckdb_path: str | Path | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Return similarity, Bass, and weekly frames for the forecasting engine."""
    source_name = (os.getenv("FORECAST_DATA_SOURCE") or "local").strip().lower()
    if source_name in {"databricks", "warehouse"}:
        raise RuntimeError(DATABRICKS_REMOVED)
    if source_name not in {"local", "r", "duckdb", "csv"}:
        raise RuntimeError(
            f"Unknown FORECAST_DATA_SOURCE={source_name!r}. Use local."
        )

    directory = _data_dir(data_dir)
    db_path = database.DUCKDB_PATH if duckdb_path is None else Path(duckdb_path)
    sources = resolve_forecast_sources(directory, db_path)
    cache = _cache_dir() / _fingerprint(directory, db_path, sources)
    prepared_names = ("similarity.csv", "bass.csv", "weekly.csv")
    if all((cache / name).is_file() for name in prepared_names):
        return _read_prepared(cache)

    rscript = _rscript()
    with tempfile.TemporaryDirectory(prefix="pharmalaunch-forecast-") as tmp:
        stage = Path(tmp)
        staged = _stage_inputs(directory, db_path, stage)
        out = stage / "prepared"
        out.mkdir()
        completed = subprocess.run(
            [
                rscript,
                str(R_SCRIPT),
                "--similarity",
                staged["similarity"]["staged"],
                "--bass",
                staged["bass"]["staged"],
                "--weekly",
                staged["weekly"]["staged"],
                "--out",
                str(out),
            ],
            check=False,
            capture_output=True,
            text=True,
            timeout=300,
        )
        if completed.returncode != 0:
            detail = (completed.stderr or completed.stdout or "").strip()
            raise RuntimeError(
                "R failed while preparing forecast inputs "
                f"(exit {completed.returncode}). {detail}"
            )
        summary = (completed.stdout or "").strip().splitlines()
        if summary:
            print(summary[-1])
        cache.mkdir(parents=True, exist_ok=True)
        for name in ("similarity.csv", "bass.csv", "weekly.csv"):
            shutil.copyfile(out / name, cache / name)
        return _read_prepared(out)
