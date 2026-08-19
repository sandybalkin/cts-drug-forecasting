import { 
  ForecastRequest, 
  RecalculateRequest, 
  ForecastResponse, 
  FormOptions,
  AnalogCatalogProduct,
  SavedForecastRecord,
  ScenarioAnalysisRequest,
  ScenarioAnalysisResponse
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function fetchFormOptions(): Promise<FormOptions> {
  const res = await fetch(`${API_BASE_URL}/options`);
  if (!res.ok) {
    throw new Error('Failed to load form options from backend');
  }
  return res.json();
}

export async function runForecast(req: ForecastRequest): Promise<ForecastResponse> {
  const res = await fetch(`${API_BASE_URL}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Forecast API calculation failed' }));
    throw new Error(err.detail || 'Forecast API calculation failed');
  }
  return res.json();
}

export async function recalculateForecast(req: RecalculateRequest): Promise<ForecastResponse> {
  const res = await fetch(`${API_BASE_URL}/forecast/recalculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Recalculate API failed' }));
    throw new Error(err.detail || 'Recalculate API failed');
  }
  return res.json();
}

export async function runScenarioAnalysis(req: ScenarioAnalysisRequest): Promise<ScenarioAnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/scenario-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Scenario analysis API calculation failed' }));
    throw new Error(err.detail || 'Scenario analysis API calculation failed');
  }
  return res.json();
}

export async function fetchAnalogsCatalog(search?: string, therapeuticArea?: string): Promise<{ total: number; analogs: AnalogCatalogProduct[] }> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (therapeuticArea && therapeuticArea !== 'All') params.append('therapeutic_area', therapeuticArea);

  const res = await fetch(`${API_BASE_URL}/analogs?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch analog dataset');
  }
  return res.json();
}

export async function saveForecastToDB(req: ForecastRequest): Promise<{ status: string; message: string; id: number }> {
  const res = await fetch(`${API_BASE_URL}/forecast/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to save forecast to database' }));
    throw new Error(err.detail || 'Failed to save forecast to database');
  }
  return res.json();
}

export async function fetchSavedForecasts(): Promise<SavedForecastRecord[]> {
  const res = await fetch(`${API_BASE_URL}/forecast/history`);
  if (!res.ok) {
    throw new Error('Failed to fetch forecast history from database');
  }
  return res.json();
}

export const DEFAULT_PRODUCT_INPUTS = {
  product_id: 'NEW_P020',
  product_name: 'Apixaban Candidate (Cardiology)',
  therapeutic_area: 'Cardiology',
  indication: 'Atrial Fibrillation',
  active_ingredient: 'Apixaban',
  pharmacological_class: 'Anticoagulant (Factor Xa Inhibitor)',
  mechanism_of_action: 'Directly inhibits Factor Xa, reducing thrombin generation',
  route_of_administration: 'Oral',
  target_population: 'Adult',
  addressable_population: 649430,
  estimated_penetration: 0.15,
  competition_level: 6.1,
  relative_price_index: 1.33,
  market_access_level: 1.4,
  clinical_evidence_strength: 4.4,
  marketing_awareness: 7.0,
  launch_strength: 7.0,
  physician_awareness: 6.0,
  treatment_familiarity: 8.0
};
