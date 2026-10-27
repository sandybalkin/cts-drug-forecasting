# PharmaLaunch PRO — Enterprise Launch Forecasting Platform (DuckDB)

**PharmaLaunch PRO** is an enterprise-grade pharmaceutical commercial launch forecasting and decision support platform. It integrates a **12-Dimensional Gower Similarity Matrix** with **Non-Linear Bass Diffusion Trajectory Fitting** and an **embedded DuckDB database** to predict 52-week post-launch revenue, prescription uptake, and scenario sensitivity curves for pre-launch drug candidates.

The local application database is a single DuckDB file (default `data/pharmalaunch.duckdb`). PostgreSQL is not required. Databricks gold tables remain the source for the forecasting engine when those credentials are configured; they are separate from this local database.

---

## Key Platform Features & Functions

### 1. Hybrid Quantitative Launch Forecasting Engine
- **Gower Similarity Distance Matrix**: Evaluates candidate drug similarity across 12 clinical & commercial dimensions against a database of **150 validated historical drug launches**.
  - **Categorical Factors (7)**: Therapeutic Area, Primary Indication, Active Ingredient, Pharmacological Class, Mechanism of Action (MoA), Route of Administration, Target Population.
  - **Continuous Factors (5)**: Addressable Population, Competition Level, Relative Price Index, Market Access Level, Clinical Evidence Strength.
- **Bass Diffusion Trajectory Fit**: Estimates Innovation ($p$), Imitation ($q$), and Market Capacity ($M$) parameters using standardized Ridge regression and clinical evidence scores.
- **Hybrid Curve Weighting**: Blends top-$k$ analog historical curves with Bass diffusion curves (default: **10% Analog / 90% Bass**) under strict $100\%$ sum constraints.

### 2. Embedded DuckDB Database
- **File database**: `DUCKDB_PATH` points at a local file. There is no database server and no database password.
- **Persistent Input Records**: Stores every candidate parameter run in `user_forecast_inputs`.
- **Complete Forecast Outputs**: Persists calculated 52-week trajectories, 12-month projections, Bass fits, and analog rankings in `forecast_records`.
- **Analog Catalog**: `analog_products` holds the benchmark drug launches, seeded from `data/similarity+analog_features_final.csv`, with search and therapeutic-area filters.
- **Reference CSV tables**: `python -m backend.bootstrap_duckdb` also loads `bass_final` and `weekly_rx_final` so the CSVs under `data/` can be queried in DuckDB. The forecasting math does not read those tables; it still calls the Databricks gold-table loader.
- **Organization & Role RBAC**: `organizations` and `users` store organization profiles and roles (*Launch Director, Forecast Analyst, Commercial Associate, Management Viewer*).

### 3. 5-Step Guided Launch Setup Wizard
- **Step 1: Clinical & Product Identity**: Select recommended features using clean `<select>` dropdown UI controls or manual input.
- **Step 2: Market & Access Factors**: Addressable population, competition index, price index, access level.
- **Step 3: Commercial & Launch Support Drivers**: Marketing investment, launch support score, physician awareness.
- **Step 4: Hybrid Weighting & Analog Selection**: Interactive sliders for Top-$k$ analog selection ($1\text{--}10$) and Analog/Bass blend weights ($0\%\text{--}100\%$).
- **Step 5: Review & Executive Execution**: Pre-run review summary with instant calculation dispatch.

### 4. Interactive Analytics & Scenario Studio
- **52-Week Weekly Trajectory Chart**: Interactive dual-axis visualizer showing Base, Bull, and Bear scenarios alongside analog curves.
- **12-Month Projections**: Aggregated monthly adoption curves for executive reporting.
- **Scenario Sensitivity Studio**: Real-time simulation of market access shifts, competitive entry, and marketing support changes.
- **Full-Width Benchmark Analog Table**: Comprehensive view of top matching analog products, similarity scores, and historical 52-week Rx figures.

---

## Project Architecture & Directory Structure

```
.
├── backend/
│   ├── database.py              # Embedded DuckDB engine, SERIAL→sequence DDL
│   ├── bootstrap_duckdb.py      # Create the DuckDB file, schema, and CSV loads
│   ├── seed.py                  # analog_products seed from data/*.csv
│   ├── models.py                # SQLAlchemy ORM models (Users, Orgs, Forecasts, Analogs)
│   ├── schemas.py               # Pydantic request/response validation schemas
│   ├── main.py                  # FastAPI application entry point & CORS configuration
│   ├── databricks_db.py         # Optional Databricks SQL connection (unchanged)
│   ├── databricks_data.py       # Gold-table loader used by the forecast engine
│   ├── forecasting/
│   │   ├── engine.py            # Main ForecastingEngine orchestrator
│   │   ├── analog.py            # 12-Dimensional Gower similarity matrix engine
│   │   ├── bass.py              # Non-linear Bass diffusion parameter fitting
│   │   └── scenario_analysis.py # Scenario sensitivity simulation engine
│   └── routers/
│       ├── auth.py              # Sign-up, sign-in & session tokens
│       └── forecast.py          # Forecast calculation, save, history & options endpoints
├── frontend/
│   └── src/app/                 # Next.js dashboard, wizard, analogs, saved records
├── data/                        # Benchmark CSVs and the default DuckDB file
├── requirements.txt
├── .env.example                 # DUCKDB_PATH
└── README.md
```

---

## API Endpoints Overview

### Authentication & Workspace (`/api/auth`)
- `POST /api/auth/signup`: Register a new pharmaceutical organization and user account.
- `POST /api/auth/signin`: Authenticate a user and issue a session token.

### Forecasting & Analytics (`/api`)
- `POST /api/forecast`: Compute a 52-week hybrid launch forecast (Bass parameters, analogs, weekly/monthly points). Requires the Databricks-backed forecasting engine.
- `POST /api/forecast/recalculate`: Recalculate a forecast with modified penetration or parameters.
- `POST /api/scenario-analysis`: Run sensitivity simulations for market access and competitive entry.
- `POST /api/forecast/save`: Persist input parameters, Bass parameters, and outputs into DuckDB.
- `GET /api/forecast/history`: Fetch saved forecast execution history from DuckDB.
- `GET /api/analogs`: Query the DuckDB analog catalog with search and therapeutic area filters. This route does not call the forecasting engine.
- `GET /api/options`: Fetch unique values for input selection dropdowns.
- `GET /api/health`: Report DuckDB connectivity, the file path, and row counts.

`GET /` returns `"database": "DuckDB"` plus `duckdb_path`.

---

## Local Development Setup

### 1. Backend (FastAPI & embedded DuckDB)

```bash
# From the repository root
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Optional: copy the example env. The default path works with no .env file.
cp .env.example .env

# Create the schema, seed analog_products, and load the reference CSVs
python -m backend.bootstrap_duckdb

# Start the API
uvicorn backend.main:app --reload --port 8000
```

The server also creates tables and seeds `analog_products` on startup, so the bootstrap command is only required when you want the `bass_final` and `weekly_rx_final` tables loaded up front.

Forecast curves still load from Databricks gold tables (`databricks-sql-connector`, plus `DATABRICKS_SERVER_HOSTNAME`, `DATABRICKS_HTTP_PATH`, and `DATABRICKS_TOKEN`). That client is not required to boot the API, sign in, or query the DuckDB catalog. The import happens only when the forecasting engine initializes.

Open API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

`DB_PASSWORD` and a `postgresql://` `DATABASE_URL` are not read. If an old `.env` still contains them, startup prints a one-line notice and continues with DuckDB.

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Tests

```bash
pip install -r requirements-dev.txt
pytest
```

Tests use a temporary DuckDB file per test. They do not open `data/pharmalaunch.duckdb`.

---

## Dialect translation

duckdb-engine speaks SQLAlchemy by subclassing the PostgreSQL dialect, which still emits PostgreSQL DDL. The local schema is rewritten as follows. Nothing in this list is a runtime dependency on PostgreSQL.

| PostgreSQL construct | What this app does in DuckDB |
| --- | --- |
| `SERIAL` / `BIGSERIAL` / `SMALLSERIAL` | DuckDB has neither these pseudo-types nor `GENERATED … AS IDENTITY` (rejected by DuckDB 2.0). `backend/database.py` rewrites them to `INTEGER`/`BIGINT`/`SMALLINT DEFAULT nextval('<table>_<column>_seq')` and creates the sequence before the table. Inserted ids still come back through `RETURNING`. |
| `JSONB` | Not used. Document columns are SQLAlchemy `JSON`, stored as DuckDB `JSON`. The API returns Python dicts and lists. JSONB operators (`@>`, `?`) and GIN indexes are not used. |
| `UUID` | No UUID columns. DuckDB has a `UUID` type if one is added later. |
| Arrays | No array columns. The DuckDB equivalent is `LIST`. |
| `ILIKE` | Supported by DuckDB. Analog search still uses SQLAlchemy `ilike()`, which compiles to `ILIKE`. |
| `ON CONFLICT` | Supported by DuckDB. The seed does not use it; it skips product ids that already exist. |
| `RETURNING` | Supported. SQLAlchemy uses it when refreshing inserted primary keys. |
| `DISTINCT ON` | Not used. |
| Schemas, `search_path`, extensions | One embedded catalog, schema `main`. No `pgcrypto` or `uuid-ossp`. |
| `VARCHAR(n)` | Accepted in DDL. DuckDB stores `VARCHAR` and does not enforce the length. |
| Foreign keys | Declared on `users` and `forecast_records` and enforced by DuckDB. |
| Connection pool / server | Embedded file, `NullPool` (one DuckDB connection per session). Do not point several server processes at the same file for concurrent writes; DuckDB allows one writer. |

Forecasting curve math is unchanged. Only the local persistence layer and the copy that named PostgreSQL moved to DuckDB.

---

## License & Attribution

Developed for enterprise pharmaceutical commercial launch planning and decision support. Powered by **FastAPI**, **Next.js**, **DuckDB**, **Recharts**, and **Tailwind CSS**.
