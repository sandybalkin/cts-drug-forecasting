# PharmaLaunch PRO — Enterprise Launch Forecasting Platform (PostgreSQL 17 Version)

**PharmaLaunch PRO** is an enterprise-grade pharmaceutical commercial launch forecasting and decision support platform. It integrates a **12-Dimensional Gower Similarity Matrix** with **Non-Linear Bass Diffusion Trajectory Fitting** and **PostgreSQL 17 Database Persistence** to predict 52-week post-launch revenue, prescription uptake, and scenario sensitivity curves for pre-launch drug candidates.

---

## 🌟 Key Platform Features & Functions

### 1. 🧬 Hybrid Quantitative Launch Forecasting Engine
- **Gower Similarity Distance Matrix**: Evaluates candidate drug similarity across 12 clinical & commercial dimensions against a database of **150 validated historical drug launches**.
  - **Categorical Factors (7)**: Therapeutic Area, Primary Indication, Active Ingredient, Pharmacological Class, Mechanism of Action (MoA), Route of Administration, Target Population.
  - **Continuous Factors (5)**: Addressable Population, Competition Level, Relative Price Index, Market Access Level, Clinical Evidence Strength.
- **Bass Diffusion Trajectory Fit**: Estimates Innovation ($p$), Imitation ($q$), and Market Capacity ($M$) parameters using standardized Ridge regression and clinical evidence scores.
- **Hybrid Curve Weighting**: Blends top-$k$ analog historical curves with Bass diffusion curves (default: **10% Analog / 90% Bass**) under strict $100\%$ sum constraints.

### 2. 🗄️ PostgreSQL 17 Enterprise Database Architecture
- **Persistent Input Records**: Stores every candidate parameter run into `user_forecast_inputs`.
- **Complete Forecast Outputs**: Persists complete calculated 52-week weekly trajectories, 12-month projections, Bass fits, and analog rankings into `forecast_records` / `forecast_results`.
- **Analog Catalog**: PostgreSQL table `analog_products` housing all 150 benchmark drug launches with filtered query endpoints.
- **Post-Launch Performance Tracking**: Table `actual_launch_rx` for comparing predicted curves against real post-launch prescription numbers.
- **Organization & Role RBAC**: Manages organizational profiles and user roles (*Launch Director, Forecast Analyst, Commercial Associate, Management Viewer*).

### 3. 🎯 5-Step Guided Launch Setup Wizard
- **Step 1: Clinical & Product Identity**: Select recommended features using clean `<select>` dropdown UI controls or manual input.
- **Step 2: Market & Access Factors**: Addressable population, competition index, price index, access level.
- **Step 3: Commercial & Launch Support Drivers**: Marketing investment, launch support score, physician awareness.
- **Step 4: Hybrid Weighting & Analog Selection**: Interactive sliders for Top-$k$ analog selection ($1\text{--}10$) and Analog/Bass blend weights ($0\%\text{--}100\%$).
- **Step 5: Review & Executive Execution**: Pre-run review summary with instant calculation dispatch.

### 4. 📈 Interactive Analytics & Scenario Studio
- **52-Week Weekly Trajectory Chart**: Interactive dual-axis visualizer showing Base, Bull, and Bear scenarios alongside analog curves.
- **12-Month Projections**: Aggregated monthly adoption curves for executive reporting.
- **Scenario Sensitivity Studio**: Real-time simulation of market access shifts, competitive entry, and marketing support changes.
- **Full-Width Benchmark Analog Table**: Comprehensive view of top matching analog products, similarity scores, and historical 52-week Rx figures.

---

## 🛠️ Project Architecture & Directory Structure

```
CTS/
├── backend/
│   ├── database.py              # PostgreSQL 17 engine & session configuration
│   ├── models.py                # SQLAlchemy ORM models (Users, Orgs, Forecasts, Analogs)
│   ├── schemas.py               # Pydantic request/response validation schemas
│   ├── main.py                  # FastAPI application entry point & CORS configuration
│   ├── forecasting/
│   │   ├── engine.py            # Main ForecastingEngine orchestrator
│   │   ├── analog.py            # 12-Dimensional Gower similarity matrix engine
│   │   ├── bass.py              # Non-linear Bass diffusion parameter fitting
│   │   └── scenario_analysis.py # Scenario sensitivity simulation engine
│   └── routers/
│       ├── auth.py              # Sign-up, sign-in & JWT session management
│       └── forecast.py          # Forecast calculation, save, history & options endpoints
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Main Dashboard
│   │   │   ├── login/page.tsx    # Splash landing & auth page (No navbars layout)
│   │   │   ├── forecast/new/     # 5-Step Launch Forecast Wizard (Dropdown UI)
│   │   │   ├── forecast/results/ # 52-Week Forecast Analysis Studio
│   │   │   ├── forecast/explanations/ # Provenance & Methodology documentation
│   │   │   ├── analogs/          # PostgreSQL 150 Analog Catalog view
│   │   │   └── saved/            # Saved DB Forecast Records
│   │   ├── components/
│   │   │   ├── Sidebar.tsx       # Enterprise navigation sidebar (Auto-suppressed on /login)
│   │   │   ├── Header.tsx        # Top header bar
│   │   │   ├── AnalogTable.tsx   # Benchmark analog table component
│   │   │   ├── WeeklyChart.tsx   # Recharts 52-week trajectory visualizer
│   │   │   ├── MonthlyChart.tsx  # Recharts 12-month visualizer
│   │   │   └── ScenarioAnalysisStudio.tsx # Sensitivity simulation studio
│   │   └── lib/
│   │       ├── api.ts            # REST API client bindings
│   │       └── types.ts          # TypeScript domain interfaces
├── data/                        # Benchmark analog CSV datasets
├── .env                         # Database connection string configuration
└── README.md                    # Platform documentation
```

---

## 🚀 API Endpoints Overview

### Authentication & Workspace (`/api/auth`)
- `POST /api/auth/signup`: Register new pharmaceutical organization & user account.
- `POST /api/auth/signin`: Authenticate user and issue JWT session details.

### Forecasting & Analytics (`/api`)
- `POST /api/forecast`: Compute 52-week hybrid launch forecast (returns Bass parameters, analogs, weekly/monthly points).
- `POST /api/forecast/recalculate`: Recalculate forecast with modified penetration or parameters.
- `POST /api/scenario-analysis`: Run sensitivity simulations for market access and competitive entry.
- `POST /api/forecast/save`: Persist complete input parameters, Bass parameters, and outputs into PostgreSQL 17.
- `GET /api/forecast/history`: Fetch saved forecast execution history from PostgreSQL 17.
- `GET /api/analogs`: Query historical analog catalog with search and therapeutic area filters.
- `GET /api/options`: Fetch unique values for input selection dropdowns.

---

## ⚙️ Local Development Setup

### 1. Backend Setup (FastAPI & PostgreSQL 17)
```bash
# Navigate to project root
cd CTS

# Install backend dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic pandas numpy scikit-learn python-dotenv

# Set up PostgreSQL database connection in .env
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/pharmalaunch

# Start backend server
uvicorn backend.main:app --reload --port 8000
```

### 2. Frontend Setup (Next.js 14)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License & Attribution

Developed for enterprise pharmaceutical commercial launch planning and decision support. Powered by **FastAPI**, **Next.js**, **PostgreSQL 17**, **Recharts**, and **Tailwind CSS**.
