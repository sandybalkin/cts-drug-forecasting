export interface ProductInputs {
  product_id: string;
  product_name: string;
  therapeutic_area: string;
  indication: string;
  active_ingredient: string;
  pharmacological_class: string;
  mechanism_of_action: string;
  route_of_administration: string;
  target_population: string;
  addressable_population: number;
  estimated_penetration: number;
  competition_level: number;
  relative_price_index: number;
  market_access_level: number;
  clinical_evidence_strength: number;
  marketing_awareness: number;
  launch_strength: number;
  physician_awareness: number;
  treatment_familiarity: number;
}

export interface ForecastRequest {
  product_inputs: ProductInputs;
  top_k: number;
  w_analog: number;
}

export interface RecalculateRequest {
  product_inputs: ProductInputs;
  top_k: number;
  w_analog: number;
  estimated_penetration?: number;
}

export interface ScenarioAnalysisRequest {
  product_inputs: ProductInputs;
  top_k: number;
  w_analog: number;
  scenario_preset?: string;
  market_access_change: number;
  launch_support_change: number;
  competitive_pressure: number;
  competitor_entry_week: number;
  mitigation_strength: number;
}

export interface BassParams {
  p_hat: number;
  q_hat: number;
  m_hat: number;
  addressable_population: number;
  estimated_penetration: number;
}

export interface SummaryTotals {
  base_52w_rx: number;
  bull_52w_rx: number;
  bear_52w_rx: number;
  bass_only_52w_rx: number;
  analog_only_52w_rx: number;
}

export interface Assumptions {
  top_k: number;
  w_analog: number;
  w_bass: number;
}

export interface AnalogItem {
  product_id: string;
  weight: number;
  similarity: number;
  similarity_pct: number;
  historical_52w_rx: number;
  details: {
    therapeutic_area?: string;
    indication?: string;
    active_ingredient?: string;
    pharmacological_class?: string;
    route_of_administration?: string;
    competition_level?: number;
    market_access_level?: number;
  };
}

export interface WeeklyPoint {
  week: number;
  analog_rx: number;
  bass_rx: number;
  hybrid_rx: number;
  bull_rx: number;
  bear_rx: number;
  cumulative_analog_rx: number;
  cumulative_bass_rx: number;
  cumulative_hybrid_rx: number;
  cumulative_bull_rx: number;
  cumulative_bear_rx: number;
}

export interface MonthlyPoint {
  month: number;
  hybrid_rx: number;
  bull_rx: number;
  bear_rx: number;
  cumulative_hybrid_rx: number;
  cumulative_bull_rx: number;
  cumulative_bear_rx: number;
}

export interface Explanations {
  why_analogs: string;
  why_bass_p: string;
  why_bass_q: string;
  why_m: string;
}

export interface ForecastResponse {
  bass_params: BassParams;
  summary_totals: SummaryTotals;
  assumptions: Assumptions;
  analogs: AnalogItem[];
  weekly_forecast: WeeklyPoint[];
  monthly_forecast: MonthlyPoint[];
  explanations: Explanations;
}

export interface FormOptions {
  therapeutic_areas: string[];
  indications: string[];
  pharmacological_classes: string[];
  routes_of_administration: string[];
  target_populations: string[];
}

export interface AnalogCatalogProduct {
  product_id: string;
  therapeutic_area: string;
  indication: string;
  active_ingredient: string;
  pharmacological_class: string;
  mechanism_of_action: string;
  route_of_administration: string;
  target_population: string;
  addressable_population: number;
  competition_level: number;
  relative_price_index: number;
  market_access_level: number;
  clinical_evidence_strength: number;
}

export interface SavedForecastRecord {
  id: number;
  product_id: string;
  product_name: string;
  therapeutic_area: string;
  indication: string;
  addressable_population: number;
  base_52w_rx: number;
  bull_52w_rx: number;
  bear_52w_rx: number;
  created_at: string;
  input_json: ProductInputs;
  forecast_result_json: ForecastResponse;
}

export interface ScenarioWeeklyPoint {
  week: number;
  baseline_rx: number;
  scenario_rx: number;
  difference_rx: number;
  is_competitor_entry: boolean;
}

export interface ScenarioExplanation {
  assumptions_changed: string[];
  individual_effects: string[];
  directional_impact: string;
  overall_impact: string;
}

export interface ScenarioAnalysisResponse {
  preset_name: string;
  baseline_52w_rx: number;
  scenario_52w_rx: number;
  scenario_impact_pct: number;
  peak_weekly_rx: number;
  peak_week: number;
  competitor_entry_week: number;
  weekly_comparison: ScenarioWeeklyPoint[];
  explanation: ScenarioExplanation;
}
