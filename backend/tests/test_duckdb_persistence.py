"""Persistence tests against a temporary DuckDB file."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

import backend.database as database
from backend.bootstrap_duckdb import bootstrap
from backend.models import ForecastRecord, Organization, User
from backend.seed import seed_analog_products

ROOT = Path(__file__).resolve().parents[2]


def test_requirements_do_not_require_postgres():
    requirements = (ROOT / "requirements.txt").read_text().lower()
    example = (ROOT / ".env.example").read_text().lower()
    assert "psycopg" not in requirements
    assert "asyncpg" not in requirements
    assert "postgres" not in requirements
    assert "duckdb" in requirements
    assert "duckdb_path" in example
    assert "db_password" not in example
    assert "postgresql://" not in example

    for path in (ROOT / "backend").rglob("*.py"):
        if "tests" in path.parts:
            continue
        source = path.read_text()
        assert "psycopg" not in source, path
        assert "postgresql://" not in source, path
        assert "asyncpg" not in source, path


def test_relative_duckdb_path_resolves_from_repo_root():
    path = database.resolve_duckdb_path("data/pharmalaunch.duckdb")
    assert path == (database.BASE_DIR / "data" / "pharmalaunch.duckdb").resolve()
    assert str(database.DATABASE_URL).startswith("duckdb:")


def test_schema_uses_sequences_not_serial(isolated_duckdb):
    database.Base.metadata.create_all(bind=database.engine)
    with database.engine.connect() as connection:
        sequences = {
            row[0]
            for row in connection.execute(
                text("SELECT sequence_name FROM duckdb_sequences()")
            )
        }
        table_sql = connection.execute(
            text(
                "SELECT sql FROM duckdb_tables() WHERE table_name = 'organizations'"
            )
        ).scalar()
        json_type = connection.execute(
            text(
                """
                SELECT data_type
                FROM information_schema.columns
                WHERE table_name = 'forecast_records'
                  AND column_name = 'input_json'
                """
            )
        ).scalar()

    assert "organizations_id_seq" in sequences
    assert "forecast_records_id_seq" in sequences
    assert "nextval" in table_sql.lower()
    assert "serial" not in table_sql.lower()
    assert json_type.upper() == "JSON"


def test_seed_analog_products_is_idempotent(isolated_duckdb):
    database.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()
    try:
        from backend.models import AnalogProduct

        inserted = seed_analog_products(db, str(ROOT / "data"))
        assert inserted == 150
        assert db.query(AnalogProduct).count() == 150
        assert seed_analog_products(db, str(ROOT / "data")) == 0
        assert db.query(AnalogProduct).count() == 150
    finally:
        db.close()


def test_auth_constraints_and_json_roundtrip(isolated_duckdb):
    database.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()
    try:
        org = Organization(name="Acme Therapeutics")
        db.add(org)
        db.commit()
        db.refresh(org)
        assert org.id == 1

        user = User(
            email="analyst@example.com",
            hashed_password="hashed",
            full_name="Analyst",
            organization_id=org.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        duplicate = User(
            email="analyst@example.com",
            hashed_password="other",
            full_name="Duplicate",
        )
        db.add(duplicate)
        with pytest.raises(Exception):
            db.commit()
        db.rollback()

        orphan = User(
            email="orphan@example.com",
            hashed_password="hashed",
            full_name="Orphan",
            organization_id=9999,
        )
        db.add(orphan)
        with pytest.raises(Exception):
            db.commit()
        db.rollback()

        record = ForecastRecord(
            product_id="NEW1",
            product_name="Candidate",
            therapeutic_area="Oncology",
            indication="Cancer",
            addressable_population=1000.0,
            estimated_penetration=0.1,
            p_hat=0.01,
            q_hat=0.4,
            m_hat=100.0,
            base_52w_rx=10.0,
            bull_52w_rx=12.0,
            bear_52w_rx=8.0,
            top_k=3,
            w_analog=0.1,
            input_json={"product_id": "NEW1", "nested": [1, None]},
            bass_params_json={"p_hat": 0.01},
            analogs_used_json=[{"product_id": "P001"}],
            weekly_forecast_json=[{"week": 1, "hybrid_rx": 1.5}],
            monthly_forecast_json=[{"month": 1, "hybrid_rx": 4.0}],
            explanations_json={"note": "ok"},
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        db.expire_all()
        stored = db.query(ForecastRecord).one()
        assert stored.input_json == {"product_id": "NEW1", "nested": [1, None]}
        assert stored.weekly_forecast_json[0]["hybrid_rx"] == 1.5
        assert isinstance(stored.analogs_used_json, list)
    finally:
        db.close()


def test_app_boots_against_duckdb(isolated_duckdb):
    from backend.main import app
    from backend.models import AnalogProduct

    with TestClient(app) as client:
        root = client.get("/")
        assert root.status_code == 200
        assert root.json()["database"] == "DuckDB"
        assert root.json()["duckdb_path"].endswith("pharmalaunch.duckdb")

        health = client.get("/api/health")
        assert health.status_code == 200
        body = health.json()
        assert body["status"] == "healthy"
        assert body["database"] == "connected"
        assert body["database_engine"] == "DuckDB"
        assert body["benchmark_analogs_in_db"] == 150

        created = client.post(
            "/api/auth/signup",
            json={
                "organization_name": "Northstar Pharma",
                "full_name": "Launch Director",
                "email": "director@example.com",
                "password": "correct-horse",
                "role": "launch_director",
            },
        )
        assert created.status_code == 200, created.text
        payload = created.json()
        assert payload["organization_name"] == "Northstar Pharma"
        assert payload["email"] == "director@example.com"

        duplicate = client.post(
            "/api/auth/signup",
            json={
                "organization_name": "Northstar Pharma",
                "full_name": "Other",
                "email": "director@example.com",
                "password": "correct-horse",
            },
        )
        assert duplicate.status_code == 400

        signed_in = client.post(
            "/api/auth/signin",
            json={"email": "director@example.com", "password": "correct-horse"},
        )
        assert signed_in.status_code == 200
        assert signed_in.json()["user_id"] == payload["user_id"]

        rejected = client.post(
            "/api/auth/signin",
            json={"email": "director@example.com", "password": "wrong"},
        )
        assert rejected.status_code == 401

        lower = client.get("/api/analogs", params={"search": "beva"})
        upper = client.get("/api/analogs", params={"search": "BEVA"})
        assert lower.status_code == 200
        assert lower.json()["total"] >= 1
        assert lower.json()["total"] == upper.json()["total"]
        assert any(
            item["active_ingredient"] == "Bevacizumab"
            for item in lower.json()["analogs"]
        )

        oncology = client.get(
            "/api/analogs", params={"therapeutic_area": "Oncology"}
        )
        assert oncology.status_code == 200
        assert oncology.json()["total"] >= 1
        assert all(
            item["therapeutic_area"] == "Oncology"
            for item in oncology.json()["analogs"]
        )

        db = database.SessionLocal()
        try:
            db.add(
                ForecastRecord(
                    product_id="NEW1",
                    product_name="Candidate",
                    therapeutic_area="Oncology",
                    indication="Cancer",
                    addressable_population=1000.0,
                    estimated_penetration=0.1,
                    p_hat=0.01,
                    q_hat=0.4,
                    m_hat=100.0,
                    base_52w_rx=10.0,
                    bull_52w_rx=12.0,
                    bear_52w_rx=8.0,
                    top_k=3,
                    w_analog=0.1,
                    input_json={"product_id": "NEW1", "nested": [1, None]},
                    bass_params_json={"p_hat": 0.01},
                    analogs_used_json=[{"product_id": "P001"}],
                    weekly_forecast_json=[{"week": 1, "hybrid_rx": 1.5}],
                    monthly_forecast_json=[{"month": 1}],
                    explanations_json={"note": "ok"},
                )
            )
            db.commit()
        finally:
            db.close()

        history = client.get("/api/forecast/history")
        assert history.status_code == 200
        rows = history.json()
        assert len(rows) == 1
        assert rows[0]["input_json"]["nested"] == [1, None]
        assert rows[0]["weekly_forecast"][0]["hybrid_rx"] == 1.5
        assert rows[0]["id"] >= 1

        # Catalog remains queryable after the extra write.
        assert client.get("/api/analogs").json()["total"] == 150
        db = database.SessionLocal()
        try:
            assert db.query(AnalogProduct).count() == 150
        finally:
            db.close()


def test_bootstrap_loads_schema_and_csvs(tmp_path):
    target = tmp_path / "bootstrap.duckdb"
    summary = bootstrap(
        duckdb_path=target,
        data_dir=ROOT / "data",
    )
    assert summary["analog_products_inserted"] == 150
    assert summary["reference_tables"]["bass_final"] == 150
    assert summary["reference_tables"]["weekly_rx_final"] == 7800
    assert target.is_file()

    again = bootstrap(duckdb_path=target, data_dir=ROOT / "data")
    assert again["analog_products_inserted"] == 0

    check_engine = database.create_duckdb_engine(target)
    try:
        with check_engine.connect() as connection:
            analogs = connection.execute(
                text("SELECT COUNT(*) FROM analog_products")
            ).scalar()
            bass = connection.execute(
                text("SELECT COUNT(*) FROM bass_final")
            ).scalar()
        assert analogs == 150
        assert bass == 150
    finally:
        check_engine.dispose()
