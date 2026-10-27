"""Load benchmark analog products from the CSV catalog into DuckDB."""

from __future__ import annotations

import os

import pandas as pd
from sqlalchemy.orm import Session

import backend.models as models

ANALOG_CSV = "similarity+analog_features_final.csv"


def seed_analog_products(db: Session, data_dir: str) -> int:
    """Insert benchmark products from ``similarity+analog_features_final.csv``.

    Returns the number of rows inserted. A catalog that already has 150 or
    more products is left unchanged, matching the previous startup seed.
    """
    count = db.query(models.AnalogProduct).count()

    if count >= 150:
        print(
            f"DuckDB analog_products table already contains "
            f"{count} benchmark products."
        )
        return 0

    sim_csv_path = os.path.join(data_dir, ANALOG_CSV)

    if not os.path.exists(sim_csv_path):
        print(
            f"Warning: Benchmark analog CSV not found at {sim_csv_path}"
        )
        return 0

    print("Populating benchmark analog products into DuckDB...")

    df = pd.read_csv(sim_csv_path)
    new_records = []

    for _, row in df.iterrows():
        pid = str(row.get("product_id", "")).strip()

        if not pid:
            continue

        existing = (
            db.query(models.AnalogProduct)
            .filter(models.AnalogProduct.product_id == pid)
            .first()
        )

        if existing:
            continue

        analog_item = models.AnalogProduct(
            product_id=pid,
            therapeutic_area=str(row.get("therapeutic_area", "Unassigned")),
            indication=str(row.get("indication", "General")),
            active_ingredient=(
                str(row.get("active_ingredient", ""))
                if pd.notna(row.get("active_ingredient"))
                else None
            ),
            pharmacological_class=(
                str(row.get("pharmacological_class", ""))
                if pd.notna(row.get("pharmacological_class"))
                else None
            ),
            mechanism_of_action=(
                str(row.get("mechanism_of_action", ""))
                if pd.notna(row.get("mechanism_of_action"))
                else None
            ),
            route_of_administration=(
                str(row.get("route_of_administration", "Oral"))
                if pd.notna(row.get("route_of_administration"))
                else "Oral"
            ),
            target_population=(
                str(row.get("target_population", "Adult"))
                if pd.notna(row.get("target_population"))
                else "Adult"
            ),
            addressable_population=(
                float(row.get("addressable_population", 0))
                if pd.notna(row.get("addressable_population"))
                else 0.0
            ),
            competition_level=(
                float(row.get("competition_level", 5.0))
                if pd.notna(row.get("competition_level"))
                else 5.0
            ),
            relative_price_index=(
                float(row.get("relative_price_index", 1.0))
                if pd.notna(row.get("relative_price_index"))
                else 1.0
            ),
            market_access_level=(
                float(row.get("market_access_level", 5.0))
                if pd.notna(row.get("market_access_level"))
                else 5.0
            ),
            clinical_evidence_strength=(
                float(row.get("clinical_evidence_strength", 5.0))
                if pd.notna(row.get("clinical_evidence_strength"))
                else 5.0
            ),
        )
        new_records.append(analog_item)

    if new_records:
        db.bulk_save_objects(new_records)
        db.commit()
        print(
            f"Successfully inserted {len(new_records)} "
            "benchmark analog products into DuckDB."
        )
    return len(new_records)
