"""Create the local DuckDB schema and load CSV data under ``data/``.

Usage (from the repository root):

    python -m backend.bootstrap_duckdb
    python -m backend.bootstrap_duckdb --duckdb-path data/pharmalaunch.duckdb
    python -m backend.bootstrap_duckdb --skip-reference-csv
"""

from __future__ import annotations

import argparse
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

import backend.database as database
from backend.seed import seed_analog_products

# Queryable copies of the forecasting CSVs. The forecasting engine still
# reads Databricks gold tables; these tables are the local DuckDB catalog.
REFERENCE_CSVS = {
    "bass_final": "bass_final.csv",
    "weekly_rx_final": "weekly_rx_final.csv",
}


def _sql_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def load_reference_csvs(connection, data_dir: Path) -> dict[str, int]:
    """Load ``data/*.csv`` reference tables with DuckDB ``read_csv_auto``."""
    loaded: dict[str, int] = {}
    for table_name, filename in REFERENCE_CSVS.items():
        if not table_name.isidentifier():
            raise ValueError(f"Unsafe table name: {table_name}")
        csv_path = (data_dir / filename).resolve()
        if not csv_path.is_file():
            print(f"Warning: reference CSV not found at {csv_path}")
            loaded[table_name] = 0
            continue
        connection.execute(
            text(
                f"CREATE OR REPLACE TABLE {table_name} AS "
                f"SELECT * FROM read_csv_auto({_sql_string(csv_path.as_posix())}, header=true)"
            )
        )
        loaded[table_name] = int(
            connection.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
            or 0
        )
        print(f"Loaded {loaded[table_name]} rows into DuckDB table {table_name}.")
    return loaded


def bootstrap(
    duckdb_path: str | Path | None = None,
    data_dir: str | Path | None = None,
    load_analogs: bool = True,
    load_reference: bool = True,
) -> dict:
    """Create schema, seed ``analog_products``, and optionally load reference CSVs."""
    path = (
        database.resolve_duckdb_path(str(duckdb_path))
        if duckdb_path is not None
        else database.resolve_duckdb_path()
    )
    if data_dir is None:
        data_path = database.BASE_DIR / "data"
    else:
        data_path = Path(data_dir)
        if not data_path.is_absolute():
            data_path = (database.BASE_DIR / data_path).resolve()

    local_engine = database.create_duckdb_engine(path)
    try:
        database.Base.metadata.create_all(bind=local_engine)
        inserted = 0
        if load_analogs:
            local_session = sessionmaker(
                autocommit=False, autoflush=False, bind=local_engine
            )
            db = local_session()
            try:
                inserted = seed_analog_products(db, str(data_path))
            finally:
                db.close()

        reference_counts: dict[str, int] = {}
        if load_reference:
            with local_engine.begin() as connection:
                reference_counts = load_reference_csvs(connection, data_path)
    finally:
        local_engine.dispose()

    summary = {
        "duckdb_path": str(path),
        "analog_products_inserted": inserted,
        "reference_tables": reference_counts,
    }
    print(f"DuckDB database ready at {path}")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create the PharmaLaunch DuckDB schema and load data/ CSVs."
    )
    parser.add_argument(
        "--duckdb-path",
        default=None,
        help="DuckDB file path (default: DUCKDB_PATH or data/pharmalaunch.duckdb)",
    )
    parser.add_argument(
        "--data-dir",
        default=None,
        help="Directory of seed CSVs (default: <repo>/data)",
    )
    parser.add_argument(
        "--skip-analogs",
        action="store_true",
        help="Create the schema without seeding analog_products",
    )
    parser.add_argument(
        "--skip-reference-csv",
        action="store_true",
        help="Do not load bass_final.csv or weekly_rx_final.csv",
    )
    args = parser.parse_args()
    bootstrap(
        duckdb_path=args.duckdb_path,
        data_dir=args.data_dir,
        load_analogs=not args.skip_analogs,
        load_reference=not args.skip_reference_csv,
    )


if __name__ == "__main__":
    main()
