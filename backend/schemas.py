from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ProductInputs(BaseModel):
    product_id: Optional[str] = "NEW_DRUG"
    product_name: Optional[str] = "New Product Candidate"
    therapeutic_area: str = "Cardiology"
    indication: str = "Atrial Fibrillation"
    active_ingredient: str = "Apixaban"
    pharmacological_class: str = "Anticoagulant (Factor Xa Inhibitor)"
    mechanism_of_action: str = "Directly inhibits Factor Xa, reducing thrombin generation"
    route_of_administration: str = "Oral"
    target_population: str = "Adult"
    addressable_population: float = Field(..., gt=0, description="Addressable patient population count")
    estimated_penetration: float = Field(0.15, ge=0.001, le=1.0, description="Estimated peak market penetration (0 to 1)")
    competition_level: float = Field(5.0, ge=1.0, le=10.0, description="1-10 index")
    relative_price_index: float = Field(1.0, ge=0.1, le=5.0, description="Price ratio vs market avg")
    market_access_level: float = Field(5.0, ge=1.0, le=10.0, description="1-10 index")
    clinical_evidence_strength: float = Field(5.0, ge=1.0, le=10.0, description="1-10 index")
    marketing_awareness: float = Field(5.0, ge=1.0, le=10.0, description="1-10 index")
    launch_strength: float = Field(5.0, ge=1.0, le=10.0, description="1-10 index")
    physician_awareness: float = Field(5.0, ge=1.0, le=10.0, description="1-10 index")
    treatment_familiarity: float = Field(5.0, ge=1.0, le=10.0, description="1-10 index")

class ForecastRequest(BaseModel):
    product_inputs: ProductInputs
    top_k: int = Field(3, ge=1, le=10, description="Number of top analogs (1 to 10)")
    w_analog: float = Field(0.10, ge=0.0, le=1.0, description="Weight assigned to analog forecast curve (0.0 to 1.0)")

class RecalculateRequest(BaseModel):
    product_inputs: ProductInputs
    top_k: int = Field(3, ge=1, le=10)
    w_analog: float = Field(0.10, ge=0.0, le=1.0)
    estimated_penetration: Optional[float] = None

class ScenarioAnalysisRequest(BaseModel):
    product_inputs: ProductInputs
    top_k: int = Field(3, ge=1, le=10)
    w_analog: float = Field(0.10, ge=0.0, le=1.0)
    scenario_preset: Optional[str] = "custom" # "base_case", "launch_upside", "competitive_downside", "custom"
    market_access_change: float = Field(0.0, ge=-0.50, le=0.50, description="% shift in market access level (-50% to +50%)")
    launch_support_change: float = Field(0.0, ge=-0.50, le=0.50, description="% shift in promotion/launch support (-50% to +50%)")
    competitive_pressure: float = Field(0.0, ge=0.0, le=0.60, description="% competitive market share loss (0% to 60%)")
    competitor_entry_week: int = Field(26, ge=1, le=52, description="Week number of competitor entry (1 to 52)")
    mitigation_strength: float = Field(0.0, ge=0.0, le=1.0, description="% mitigation offset of competitive loss (0% to 100%)")

class BassParamsResponse(BaseModel):
    p_hat: float
    q_hat: float
    m_hat: float
    addressable_population: float
    estimated_penetration: float

class SummaryTotalsResponse(BaseModel):
    base_52w_rx: float
    bull_52w_rx: float
    bear_52w_rx: float
    bass_only_52w_rx: float
    analog_only_52w_rx: float

class AssumptionsResponse(BaseModel):
    top_k: int
    w_analog: float
    w_bass: float

class AnalogItemResponse(BaseModel):
    product_id: str
    weight: float
    similarity: float
    similarity_pct: float
    historical_52w_rx: float
    details: Dict[str, Any]

class WeeklyPointResponse(BaseModel):
    week: int
    analog_rx: float
    bass_rx: float
    hybrid_rx: float
    bull_rx: float
    bear_rx: float
    cumulative_analog_rx: float
    cumulative_bass_rx: float
    cumulative_hybrid_rx: float
    cumulative_bull_rx: float
    cumulative_bear_rx: float

class MonthlyPointResponse(BaseModel):
    month: int
    hybrid_rx: float
    bull_rx: float
    bear_rx: float
    cumulative_hybrid_rx: float
    cumulative_bull_rx: float
    cumulative_bear_rx: float

class ExplanationsResponse(BaseModel):
    why_analogs: str
    why_bass_p: str
    why_bass_q: str
    why_m: str

class ForecastResponse(BaseModel):
    bass_params: BassParamsResponse
    summary_totals: SummaryTotalsResponse
    assumptions: AssumptionsResponse
    analogs: List[AnalogItemResponse]
    weekly_forecast: List[WeeklyPointResponse]
    monthly_forecast: List[MonthlyPointResponse]
    explanations: ExplanationsResponse

class ScenarioWeeklyPoint(BaseModel):
    week: int
    baseline_rx: float
    scenario_rx: float
    difference_rx: float
    is_competitor_entry: bool

class ScenarioExplanationResponse(BaseModel):
    assumptions_changed: List[str]
    individual_effects: List[str]
    directional_impact: str
    overall_impact: str

class ScenarioAnalysisResponse(BaseModel):
    preset_name: str
    baseline_52w_rx: float
    scenario_52w_rx: float
    scenario_impact_pct: float
    peak_weekly_rx: float
    peak_week: int
    competitor_entry_week: int
    weekly_comparison: List[ScenarioWeeklyPoint]
    explanation: ScenarioExplanationResponse
