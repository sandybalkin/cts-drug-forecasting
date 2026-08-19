from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from backend.schemas import (
    ForecastRequest, 
    RecalculateRequest, 
    ForecastResponse,
    ScenarioAnalysisRequest,
    ScenarioAnalysisResponse
)
from backend.forecasting.engine import ForecastingEngine
from backend.forecasting.scenario_analysis import run_scenario_analysis
from backend.database import get_db
from backend.models import UserForecastInput, ForecastRecord, AnalogProduct

router = APIRouter(prefix="/api", tags=["forecast"])

# Global engine instance initialized in main
engine_instance: ForecastingEngine = None

def get_engine() -> ForecastingEngine:
    if engine_instance is None:
        raise HTTPException(status_code=500, detail="Forecasting engine is not initialized.")
    return engine_instance

@router.post("/forecast", response_model=ForecastResponse)
def calculate_forecast(req: ForecastRequest, engine: ForecastingEngine = Depends(get_engine)):
    try:
        drug_dict = req.product_inputs.model_dump() if hasattr(req.product_inputs, 'model_dump') else req.product_inputs.dict()
        result = engine.run(drug_dict, top_k=req.top_k, w_analog=req.w_analog)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/forecast/recalculate", response_model=ForecastResponse)
def recalculate_forecast(req: RecalculateRequest, engine: ForecastingEngine = Depends(get_engine)):
    try:
        drug_dict = req.product_inputs.model_dump() if hasattr(req.product_inputs, 'model_dump') else req.product_inputs.dict()
        if req.estimated_penetration is not None:
            drug_dict["estimated_penetration"] = req.estimated_penetration
        result = engine.run(drug_dict, top_k=req.top_k, w_analog=req.w_analog)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scenario-analysis", response_model=ScenarioAnalysisResponse)
def calculate_scenario_analysis(req: ScenarioAnalysisRequest, engine: ForecastingEngine = Depends(get_engine)):
    try:
        drug_dict = req.product_inputs.model_dump() if hasattr(req.product_inputs, 'model_dump') else req.product_inputs.dict()
        baseline_res = engine.run(drug_dict, top_k=req.top_k, w_analog=req.w_analog)
        
        baseline_weekly_rx = [pt["hybrid_rx"] for pt in baseline_res["weekly_forecast"]]
        
        scenario_res = run_scenario_analysis(
            baseline_weekly_rx=baseline_weekly_rx,
            market_access_change=req.market_access_change,
            launch_support_change=req.launch_support_change,
            competitive_pressure=req.competitive_pressure,
            competitor_entry_week=req.competitor_entry_week,
            mitigation_strength=req.mitigation_strength,
            preset_name=req.scenario_preset or "Custom"
        )
        return scenario_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/options")
def get_form_options(engine: ForecastingEngine = Depends(get_engine)):
    try:
        df = engine.similarity_df
        return {
            "therapeutic_areas": sorted([str(x) for x in df["therapeutic_area"].dropna().unique()]),
            "indications": sorted([str(x) for x in df["indication"].dropna().unique()]),
            "pharmacological_classes": sorted([str(x) for x in df["pharmacological_class"].dropna().unique()]),
            "routes_of_administration": sorted([str(x) for x in df["route_of_administration"].dropna().unique()]),
            "target_populations": sorted([str(x) for x in df["target_population"].dropna().unique()])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analogs")
def get_analogs_catalog(
    search: Optional[str] = Query(None),
    therapeutic_area: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    engine: ForecastingEngine = Depends(get_engine)
):
    """
    Queries 150 benchmark products directly from PostgreSQL 17 database.
    """
    try:
        query = db.query(AnalogProduct)
        
        if search:
            s = f"%{search.strip().lower()}%"
            query = query.filter(
                (AnalogProduct.product_id.ilike(s)) |
                (AnalogProduct.indication.ilike(s)) |
                (AnalogProduct.active_ingredient.ilike(s)) |
                (AnalogProduct.pharmacological_class.ilike(s))
            )
            
        if therapeutic_area and therapeutic_area != "All":
            query = query.filter(AnalogProduct.therapeutic_area == therapeutic_area)
            
        products = query.all()
        
        records = []
        for p in products:
            records.append({
                "product_id": p.product_id,
                "therapeutic_area": p.therapeutic_area,
                "indication": p.indication,
                "active_ingredient": p.active_ingredient or "",
                "pharmacological_class": p.pharmacological_class or "",
                "mechanism_of_action": p.mechanism_of_action or "",
                "route_of_administration": p.route_of_administration or "Oral",
                "target_population": p.target_population or "Adult",
                "addressable_population": p.addressable_population or 0.0,
                "competition_level": p.competition_level or 5.0,
                "relative_price_index": p.relative_price_index or 1.0,
                "market_access_level": p.market_access_level or 5.0,
                "clinical_evidence_strength": p.clinical_evidence_strength or 5.0
            })

        return {
            "total": len(records),
            "analogs": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/forecast/save")
def save_user_forecast(
    req: ForecastRequest, 
    db: Session = Depends(get_db),
    engine: ForecastingEngine = Depends(get_engine)
):
    """
    Computes and stores COMPLETE forecast output parameters, Bass parameters (p, q, m),
    52-week weekly trajectories, monthly trajectories, and explanations into PostgreSQL 17.
    """
    try:
        drug_dict = req.product_inputs.model_dump() if hasattr(req.product_inputs, 'model_dump') else req.product_inputs.dict()
        
        # Calculate full forecast results
        full_result = engine.run(drug_dict, top_k=req.top_k, w_analog=req.w_analog)

        # 1. Also store inputs in user_forecast_inputs table
        user_input_record = UserForecastInput(
            product_id=req.product_inputs.product_id,
            product_name=req.product_inputs.product_name,
            therapeutic_area=req.product_inputs.therapeutic_area,
            indication=req.product_inputs.indication,
            addressable_population=req.product_inputs.addressable_population,
            estimated_penetration=req.product_inputs.estimated_penetration,
            top_k=req.top_k,
            w_analog=req.w_analog,
            user_inputs_json=drug_dict
        )
        db.add(user_input_record)

        # 2. Store full forecast outputs in forecast_records table
        forecast_record = ForecastRecord(
            product_id=req.product_inputs.product_id,
            product_name=req.product_inputs.product_name,
            therapeutic_area=req.product_inputs.therapeutic_area,
            indication=req.product_inputs.indication,
            addressable_population=req.product_inputs.addressable_population,
            estimated_penetration=req.product_inputs.estimated_penetration,
            p_hat=full_result["bass_params"]["p_hat"],
            q_hat=full_result["bass_params"]["q_hat"],
            m_hat=full_result["bass_params"]["m_hat"],
            base_52w_rx=full_result["summary_totals"]["base_52w_rx"],
            bull_52w_rx=full_result["summary_totals"]["bull_52w_rx"],
            bear_52w_rx=full_result["summary_totals"]["bear_52w_rx"],
            top_k=req.top_k,
            w_analog=req.w_analog,
            input_json=drug_dict,
            bass_params_json=full_result["bass_params"],
            analogs_used_json=full_result["analogs"],
            weekly_forecast_json=full_result["weekly_forecast"],
            monthly_forecast_json=full_result["monthly_forecast"],
            explanations_json=full_result["explanations"]
        )
        db.add(forecast_record)

        db.commit()
        db.refresh(forecast_record)
        
        return {
            "status": "success",
            "message": "Complete forecast outputs, Bass parameters, and 52-week trajectory stored in PostgreSQL 17 database successfully",
            "id": forecast_record.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast/history")
def get_user_forecast_history(
    db: Session = Depends(get_db)
):
    """
    Retrieves full stored forecast calculation records directly from PostgreSQL 17 database.
    """
    try:
        records = db.query(ForecastRecord).order_by(ForecastRecord.created_at.desc()).all()
        results = []
        for r in records:
            results.append({
                "id": r.id,
                "product_id": r.product_id,
                "product_name": r.product_name,
                "therapeutic_area": r.therapeutic_area,
                "indication": r.indication,
                "addressable_population": r.addressable_population,
                "estimated_penetration": r.estimated_penetration,
                "p_hat": r.p_hat,
                "q_hat": r.q_hat,
                "m_hat": r.m_hat,
                "base_52w_rx": r.base_52w_rx,
                "bull_52w_rx": r.bull_52w_rx,
                "bear_52w_rx": r.bear_52w_rx,
                "top_k": r.top_k,
                "w_analog": r.w_analog,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "input_json": r.input_json,
                "bass_params": r.bass_params_json,
                "analogs": r.analogs_used_json,
                "weekly_forecast": r.weekly_forecast_json,
                "monthly_forecast": r.monthly_forecast_json,
                "explanations": r.explanations_json
            })
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
