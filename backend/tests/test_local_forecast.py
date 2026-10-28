"""Forecast inputs come from local CSVs, DuckDB, and R — not Databricks."""

import os
from pathlib import Path

import numpy as np
import pytest

from backend.bootstrap_duckdb import bootstrap
from backend.forecasting.engine import ForecastingEngine
from backend.local_forecast_data import (
    DATABRICKS_REMOVED,
    load_forecast_frames,
    resolve_forecast_sources,
)

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"


def test_backend_does_not_import_databricks():
    for path in (ROOT / "backend").rglob("*.py"):
        if "tests" in path.parts:
            continue
        source = path.read_text()
        assert "import databricks" not in source
        assert "from databricks" not in source
        assert "databricks.sql" not in source
        assert "DATABRICKS_TOKEN" not in source


def test_databricks_source_is_rejected(monkeypatch):
    monkeypatch.setenv("FORECAST_DATA_SOURCE", "databricks")
    with pytest.raises(RuntimeError) as exc:
        load_forecast_frames(DATA, duckdb_path=Path("/tmp/does-not-exist.duckdb"))
    assert "Databricks is not a forecast runtime" in str(exc.value)
    assert DATABRICKS_REMOVED.split(".")[0] in str(exc.value)


def test_sources_fall_back_to_repo_csvs(tmp_path):
    sources = resolve_forecast_sources(
        DATA, duckdb_path=tmp_path / "missing.duckdb"
    )
    assert sources["similarity"]["origin"] == "csv:similarity+analog_features_final.csv"
    assert sources["bass"]["origin"] == "csv:bass_final.csv"
    assert sources["weekly"]["origin"] == "csv:weekly_rx_final.csv"


def test_sources_prefer_bootstrapped_duckdb_tables(tmp_path):
    target = tmp_path / "pharmalaunch.duckdb"
    bootstrap(duckdb_path=target, data_dir=DATA, load_reference=True)
    sources = resolve_forecast_sources(DATA, duckdb_path=target)
    assert sources["similarity"]["origin"] == "duckdb:analog_products"
    assert sources["bass"]["origin"] == "duckdb:bass_final"
    assert sources["weekly"]["origin"] == "duckdb:weekly_rx_final"
    assert sources["weekly"]["rows"] == "7800"


def test_r_prepares_bass_fits_and_engine_runs(tmp_path, monkeypatch):
    similarity, bass, weekly = load_forecast_frames(
        DATA, duckdb_path=tmp_path / "missing.duckdb"
    )
    assert len(similarity) == 150
    assert len(bass) == 150
    assert len(weekly) == 7800
    assert set(bass["product_id"]) == set(similarity["product_id"])
    assert bass["p_fit"].between(0.0001, 0.5).all()
    assert bass["q_fit"].between(0.001, 3.0).all()
    expected_m = bass["addressable_population"] * bass["estimated_penetration"]
    assert np.allclose(bass["m"], expected_m, rtol=1e-6, atol=1e-4)

    engine = ForecastingEngine(str(DATA))
    engine.similarity_df = similarity
    engine.bass_df = bass
    engine.weekly_df = weekly
    from backend.forecasting.bass import BassModelTrainer

    engine.trainer = BassModelTrainer()
    engine.trainer.fit(bass, weekly)
    engine.is_initialized = True

    result = engine.run(
        {
            "product_id": "TEST_DRUG_001",
            "therapeutic_area": "Oncology",
            "indication": "Cancer",
            "active_ingredient": "Test Ingredient",
            "pharmacological_class": "Test Class",
            "mechanism_of_action": "Test Mechanism",
            "route_of_administration": "Oral",
            "target_population": "Adults",
            "addressable_population": 100000,
            "estimated_penetration": 0.10,
            "competition_level": 5,
            "relative_price_index": 1.0,
            "market_access_level": 5,
            "marketing_awareness": 7,
            "launch_strength": 7,
            "physician_awareness": 7,
            "clinical_evidence_strength": 8,
            "treatment_familiarity": 6,
        },
        top_k=3,
        w_analog=0.10,
    )

    assert len(result["weekly_forecast"]) == 52
    assert len(result["monthly_forecast"]) == 12
    assert len(result["analogs"]) == 3
    assert result["bass_params"]["m_hat"] == 10000
    assert (
        result["summary_totals"]["bear_52w_rx"]
        < result["summary_totals"]["base_52w_rx"]
        < result["summary_totals"]["bull_52w_rx"]
    )
    assert result["weekly_forecast"][-1]["cumulative_hybrid_rx"] > 0
    assert result["monthly_forecast"][-1]["cumulative_hybrid_rx"] > 0
    assert result["assumptions"] == {"top_k": 3, "w_analog": 0.10, "w_bass": 0.90}
    assert "why_analogs" in result["explanations"]

    # Cached preparation does not call R again.
    calls = {"n": 0}
    real_run = __import__("subprocess").run

    def _counting_run(*args, **kwargs):
        calls["n"] += 1
        return real_run(*args, **kwargs)

    monkeypatch.setattr("backend.local_forecast_data.subprocess.run", _counting_run)
    again, _, _ = load_forecast_frames(DATA, duckdb_path=tmp_path / "missing.duckdb")
    assert calls["n"] == 0
    assert len(again) == 150


def test_engine_initialize_uses_local_loader():
    engine = ForecastingEngine(str(DATA))
    engine.initialize()
    assert engine.is_initialized
    assert engine.similarity_df.shape[0] == 150
    assert "p_fit" in engine.bass_df.columns
    assert engine.weekly_df.shape[0] == 7800
    assert os.environ["FORECAST_DATA_SOURCE"] == "local"
