import os
import pandas as pd
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.database import engine as db_engine, Base, get_db, SessionLocal
import backend.models as models
from backend.forecasting.engine import ForecastingEngine
import backend.routers.forecast as forecast_router
import backend.routers.auth as auth_router

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data"
)


def seed_analog_products_to_postgres(db: Session, data_dir: str):
    """
    Populates all benchmark products from similarity+analog_features_final.csv
    into PostgreSQL.
    """
    count = db.query(models.AnalogProduct).count()

    if count >= 150:
        print(
            f"PostgreSQL 17 analog_products table already contains "
            f"{count} benchmark products."
        )
        return

    sim_csv_path = os.path.join(
        data_dir,
        "similarity+analog_features_final.csv"
    )

    if not os.path.exists(sim_csv_path):
        print(
            f"Warning: Benchmark analog CSV not found at "
            f"{sim_csv_path}"
        )
        return

    print(
        "Populating benchmark analog products into PostgreSQL 17 database..."
    )

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
            therapeutic_area=str(
                row.get("therapeutic_area", "Unassigned")
            ),
            indication=str(
                row.get("indication", "General")
            ),
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
            f"benchmark analog products into PostgreSQL 17 database!"
        )


@asynccontextmanager
async def lifespan(app: FastAPI):

    # ---------------------------------------------------------
    # DATABASE INITIALIZATION
    # ---------------------------------------------------------
    print("Initializing PostgreSQL 17 database tables...")

    database_available = False

    try:
        Base.metadata.create_all(bind=db_engine)

        print(
            "PostgreSQL 17 database tables initialized successfully!"
        )

        database_available = True

    except Exception as e:
        print(
            "\nWARNING: PostgreSQL database initialization failed."
        )
        print(f"Database error: {e}")
        print(
            "The FastAPI server will continue running, "
            "but database-dependent endpoints may fail.\n"
        )

    # ---------------------------------------------------------
    # DATABASE SEEDING
    # ---------------------------------------------------------
    if database_available:

        db = SessionLocal()

        try:
            seed_analog_products_to_postgres(
                db,
                DATA_DIR
            )

        except Exception as e:
            print(
                f"WARNING: Database seeding failed: {e}"
            )

        finally:
            db.close()

    # ---------------------------------------------------------
    # FORECASTING ENGINE
    # ---------------------------------------------------------
    print(
        f"Initializing forecasting engine with data from "
        f"{DATA_DIR}..."
    )

    try:
        engine = ForecastingEngine(DATA_DIR)
        engine.initialize()

        forecast_router.engine_instance = engine

        print(
            "Forecasting engine initialized successfully!"
        )

    except Exception as e:
        print(
            f"WARNING: Forecasting engine initialization failed: {e}"
        )

    yield

    print("Shutting down forecasting engine...")


# -------------------------------------------------------------
# FASTAPI APPLICATION
# -------------------------------------------------------------

app = FastAPI(
    title="Pharmaceutical Launch Forecasting API",
    description=(
        "Backend engine for Bass diffusion model, Gower similarity "
        "analog selection, PostgreSQL 17 persistence, and hybrid "
        "forecast generation."
    ),
    version="1.0.0",
    lifespan=lifespan
)


# -------------------------------------------------------------
# CORS
# -------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------
# ROUTERS
# -------------------------------------------------------------

app.include_router(auth_router.router)
app.include_router(forecast_router.router)


# -------------------------------------------------------------
# ROOT ENDPOINT
# -------------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Pharmaceutical Launch Forecasting API",
        "database": "PostgreSQL 17",
        "docs_url": "/docs"
    }


# -------------------------------------------------------------
# HEALTH CHECK
# -------------------------------------------------------------

@app.get("/health")
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):

    try:
        db.execute(text("SELECT 1"))

        analog_count = (
            db.query(models.AnalogProduct).count()
        )

        forecast_count = (
            db.query(models.ForecastRecord).count()
        )

        return {
            "status": "healthy",
            "database": "connected",
            "database_engine": "PostgreSQL 17 (pharmalaunch)",
            "benchmark_analogs_in_db": analog_count,
            "saved_forecast_records_in_db": forecast_count
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )


# -------------------------------------------------------------
# DIRECT EXECUTION
# -------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )