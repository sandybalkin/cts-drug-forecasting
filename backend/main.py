import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

import backend.database as database
from backend.database import get_db
import backend.models as models
from backend.seed import seed_analog_products
from backend.forecasting.engine import ForecastingEngine
import backend.routers.forecast as forecast_router
import backend.routers.auth as auth_router

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data"
)


@asynccontextmanager
async def lifespan(app: FastAPI):

    # ---------------------------------------------------------
    # DATABASE INITIALIZATION
    # ---------------------------------------------------------
    print(f"Initializing DuckDB tables at {database.DUCKDB_PATH}...")

    database_available = False

    try:
        database.Base.metadata.create_all(bind=database.engine)

        print("DuckDB tables initialized successfully.")

        database_available = True

    except Exception as e:
        print("\nWARNING: DuckDB database initialization failed.")
        print(f"Database error: {e}")
        print(
            "The FastAPI server will continue running, "
            "but database-dependent endpoints may fail.\n"
        )

    # ---------------------------------------------------------
    # DATABASE SEEDING
    # ---------------------------------------------------------
    if database_available:

        db = database.SessionLocal()

        try:
            seed_analog_products(
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
        "Initializing forecasting engine from local DuckDB/CSV inputs via R..."
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
        "analog selection, embedded DuckDB persistence, and hybrid "
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
        "database": "DuckDB",
        "duckdb_path": str(database.DUCKDB_PATH),
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
            "database_engine": "DuckDB",
            "duckdb_path": str(database.DUCKDB_PATH),
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