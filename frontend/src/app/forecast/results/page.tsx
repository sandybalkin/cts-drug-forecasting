'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import WeeklyChart from '@/components/WeeklyChart';
import MonthlyChart from '@/components/MonthlyChart';
import AnalogTable from '@/components/AnalogTable';
import ScenarioAnalysisStudio from '@/components/ScenarioAnalysisStudio';
import { runForecast, recalculateForecast, saveForecastToDB, DEFAULT_PRODUCT_INPUTS } from '@/lib/api';
import { ForecastResponse, ProductInputs } from '@/lib/types';
import { 
  TrendingUp, 
  Sparkles, 
  Sliders, 
  Layers, 
  Award, 
  BrainCircuit, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Check,
  Zap,
  BarChart3,
  Lock,
  PlusCircle,
  FileQuestion
} from 'lucide-react';
import Link from 'next/link';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Candidate Load State
  const [hasCandidateLoaded, setHasCandidateLoaded] = useState(true);

  // Role State
  const [role, setRole] = useState('launch_director');

  // Tab State: 'forecast_results' | 'scenario_analysis'
  const [activeTab, setActiveTab] = useState<'forecast_results' | 'scenario_analysis'>('forecast_results');

  const [productInputs, setProductInputs] = useState<ProductInputs>(DEFAULT_PRODUCT_INPUTS);
  const [topK, setTopK] = useState(3);
  const [wAnalog, setWAnalog] = useState(0.10);
  const [penetration, setPenetration] = useState(0.15);

  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);

  useEffect(() => {
    const cachedRole = localStorage.getItem('pharmalaunch_role');
    if (cachedRole) setRole(cachedRole);

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const rawData = searchParams.get('data');
        let payload: any = null;

        if (rawData) {
          payload = JSON.parse(decodeURIComponent(rawData));
        } else {
          const cached = sessionStorage.getItem('latest_forecast_payload');
          if (cached) {
            payload = JSON.parse(cached);
          }
        }

        if (!payload) {
          setHasCandidateLoaded(false);
          setLoading(false);
          return;
        }

        setHasCandidateLoaded(true);
        setProductInputs(payload.product_inputs);
        setTopK(payload.top_k || 3);
        setWAnalog(payload.w_analog || 0.10);
        setPenetration(payload.product_inputs.estimated_penetration || 0.15);

        const result = await runForecast(payload);
        setForecastData(result);
      } catch (err: any) {
        console.error('Forecast loading error:', err);
        setError(err.message || 'Failed to calculate forecast model');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  const loadDefaultCandidate = () => {
    const defaultPayload = {
      product_inputs: DEFAULT_PRODUCT_INPUTS,
      top_k: 3,
      w_analog: 0.10
    };
    sessionStorage.setItem('latest_forecast_payload', JSON.stringify(defaultPayload));
    window.location.href = `/forecast/results?data=${encodeURIComponent(JSON.stringify(defaultPayload))}`;
  };

  const isReadOnly = role === 'management_viewer';
  const isMethodologyRestricted = role === 'commercial_associate';

  const handleRecalculate = async (newTopK?: number, newWAnalog?: number, newPenetration?: number) => {
    if (isReadOnly) return;

    const activeTopK = newTopK !== undefined ? newTopK : topK;
    const activeWAnalog = newWAnalog !== undefined ? newWAnalog : wAnalog;
    const activePen = newPenetration !== undefined ? newPenetration : penetration;

    setRecalculating(true);
    try {
      const reqPayload = {
        product_inputs: {
          ...productInputs,
          estimated_penetration: activePen
        },
        top_k: activeTopK,
        w_analog: activeWAnalog,
        estimated_penetration: activePen
      };

      const result = await recalculateForecast(reqPayload);
      setForecastData(result);
    } catch (err: any) {
      console.error('Recalculation error:', err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleSaveToDB = async () => {
    if (isReadOnly) return;

    setSaving(true);
    try {
      const payload = {
        product_inputs: {
          ...productInputs,
          estimated_penetration: penetration
        },
        top_k: topK,
        w_analog: wAnalog
      };
      await saveForecastToDB(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportReport = () => {
    if (!forecastData) return;

    const lines: string[] = [];
    lines.push("PHARMALAUNCH PRO — 52-WEEK LAUNCH FORECAST REPORT");
    lines.push(`Product Name,${productInputs.product_name || 'Apixaban Candidate'}`);
    lines.push(`Candidate ID,${productInputs.product_id || 'NEW_DRUG'}`);
    lines.push(`Therapeutic Area,${productInputs.therapeutic_area}`);
    lines.push(`Indication,${productInputs.indication}`);
    lines.push(`Addressable Population,${productInputs.addressable_population}`);
    lines.push(`Estimated Penetration,${(penetration * 100).toFixed(1)}%`);
    lines.push("");

    lines.push("BASS DIFFUSION PARAMETERS");
    lines.push(`Innovation Parameter (p),${forecastData.bass_params.p_hat}`);
    lines.push(`Imitation Parameter (q),${forecastData.bass_params.q_hat}`);
    lines.push(`Market Potential (M),${forecastData.bass_params.m_hat}`);
    lines.push("");

    lines.push("FORECAST SUMMARY TOTALS");
    lines.push(`Base 52-Week Hybrid Rx,${forecastData.summary_totals.base_52w_rx}`);
    lines.push(`Bull Scenario (+20% M),${forecastData.summary_totals.bull_52w_rx}`);
    lines.push(`Bear Scenario (-20% M),${forecastData.summary_totals.bear_52w_rx}`);
    lines.push("");

    lines.push("SELECTED BENCHMARK ANALOGS");
    lines.push("Product ID,Similarity %,Weight,Historical 52w Rx");
    forecastData.analogs.forEach((a) => {
      lines.push(`${a.product_id},${a.similarity_pct}%,${a.weight},${a.historical_52w_rx}`);
    });
    lines.push("");

    lines.push("52-WEEK WEEKLY TRAJECTORY");
    lines.push("Week,Hybrid Rx,Bass Rx,Analog Rx,Bull Rx,Bear Rx,Cumulative Hybrid Rx");
    forecastData.weekly_forecast.forEach((w) => {
      lines.push(`${w.week},${w.hybrid_rx},${w.bass_rx},${w.analog_rx},${w.bull_rx},${w.bear_rx},${w.cumulative_hybrid_rx}`);
    });
    lines.push("");

    lines.push("12-MONTH ROLLOUT TRAJECTORY");
    lines.push("Month,Hybrid Rx,Bull Rx,Bear Rx,Cumulative Hybrid Rx");
    forecastData.monthly_forecast.forEach((m) => {
      lines.push(`${m.month},${m.hybrid_rx},${m.bull_rx},${m.bear_rx},${m.cumulative_hybrid_rx}`);
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(lines.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `PharmaLaunch_Forecast_Report_${productInputs.product_id || 'Candidate'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wide uppercase">Executing Bass Diffusion & Gower Similarity Engine...</p>
      </div>
    );
  }

  // Clean Empty State when no candidate is loaded
  if (!hasCandidateLoaded) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
        <Header
          title="Launch Forecast Studio"
          subtitle="No Active Launch Candidate Selected"
        />
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            <FileQuestion className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">No Product Info Feed Loaded</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              No forecast graphs or ranges are displayed in the default state until a product launch candidate is selected or feed parameters are submitted.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              onClick={loadDefaultCandidate}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-lg shadow-blue-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Load Default Apixaban Candidate
            </button>
            <Link
              href="/forecast/new"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-xs text-white shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Create Custom Candidate
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !forecastData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-red-600 space-y-3">
        <AlertCircle className="w-10 h-10" />
        <p className="text-sm font-bold">{error || 'Forecast data unavailable'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg"
        >
          Retry Calculation
        </button>
      </div>
    );
  }

  const { bass_params, summary_totals, assumptions, analogs, weekly_forecast, monthly_forecast, explanations } = forecastData;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={`${productInputs.product_name || 'Apixaban Candidate'} — Launch Forecast Studio`}
        subtitle={`${productInputs.therapeutic_area} | ${productInputs.indication} | Addressable Pop: ${productInputs.addressable_population.toLocaleString()}`}
        backHref="/forecast/new"
        onExport={handleExportReport}
        actions={
          !isReadOnly && (
            <button
              onClick={handleSaveToDB}
              disabled={saving}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all border ${
                savedSuccess
                  ? 'bg-emerald-500 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300'
              }`}
            >
              {saving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Saved to PostgreSQL
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" /> Save to Database
                </>
              )}
            </button>
          )
        }
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('forecast_results')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'forecast_results'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> 52-Week Forecast Studio
            </button>
            <button
              onClick={() => setActiveTab('scenario_analysis')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'scenario_analysis'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-4 h-4" /> Scenario Analysis (What-If Layer)
            </button>
          </div>

          <div className="flex items-center gap-3 pr-4 text-xs">
            {isReadOnly && (
              <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1 text-[11px]">
                <Lock className="w-3 h-3 text-amber-600" /> Read-Only Mode (Management Viewer)
              </span>
            )}
            <span className="font-semibold text-slate-500">
              Candidate ID: <span className="font-mono text-slate-900 font-bold">{productInputs.product_id || 'NEW_DRUG'}</span>
            </span>
          </div>
        </div>

        {/* Tab 1: 52-Week Forecast Studio */}
        {activeTab === 'forecast_results' && (
          <div className="space-y-8">
            {/* Metric Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Base 52-Week Rx Total</p>
                <h3 className="text-3xl font-black text-blue-600 mt-1 font-mono">
                  {summary_totals.base_52w_rx.toLocaleString()} <span className="text-xs font-bold text-slate-500">Rx</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Base Hybrid Forecast ({Math.round(assumptions.w_analog * 100)}% Analog / {Math.round(assumptions.w_bass * 100)}% Bass)
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Bull Scenario (+20% M)</p>
                <h3 className="text-3xl font-black text-emerald-600 mt-1 font-mono">
                  {summary_totals.bull_52w_rx.toLocaleString()} <span className="text-xs font-bold text-slate-500">Rx</span>
                </h3>
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  +10% p & q, +20% Market Penetration
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Bear Scenario (-20% M)</p>
                <h3 className="text-3xl font-black text-amber-600 mt-1 font-mono">
                  {summary_totals.bear_52w_rx.toLocaleString()} <span className="text-xs font-bold text-slate-500">Rx</span>
                </h3>
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                  -10% p & q, -20% Market Penetration
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Market Potential (M)</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1 font-mono">
                  {bass_params.m_hat.toLocaleString()} <span className="text-xs font-bold text-slate-500">Rx</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {(bass_params.estimated_penetration * 100).toFixed(1)}% Peak Penetration
                </p>
              </div>
            </div>

            {/* Main Grid: Chart vs Live Sensitivity Control Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Cols: Charts */}
              <div className="lg:col-span-2 space-y-8">
                <WeeklyChart data={weekly_forecast} bassParams={bass_params} />
                <MonthlyChart data={monthly_forecast} />
              </div>

              {/* Right 1 Col: Real-time Sensitivity Control Sidebar */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 sticky top-24">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      Live Sensitivity Controls
                    </h3>
                    {recalculating && (
                      <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Recalculating...
                      </span>
                    )}
                  </div>

                  {/* 1. Peak Penetration */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">Peak Penetration Rate</span>
                      <span className="font-bold text-blue-600 font-mono">{(penetration * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      disabled={isReadOnly}
                      min="0.01"
                      max="0.50"
                      step="0.005"
                      value={penetration}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setPenetration(val);
                        handleRecalculate(topK, wAnalog, val);
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                    />
                    <p className="text-[11px] text-slate-400">Scales total addressable market potential (M)</p>
                  </div>

                  {/* 2. Top-K Analogs Slider (Restored Original Format) */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">Top-K Benchmark Analogs</span>
                      <span className="font-bold text-blue-600 font-mono">{topK} Analogs</span>
                    </div>
                    <input
                      type="range"
                      disabled={isReadOnly}
                      min="1"
                      max="10"
                      step="1"
                      value={topK}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setTopK(val);
                        handleRecalculate(val, wAnalog, penetration);
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                    />
                    <p className="text-[11px] text-slate-400">Blends top K most similar historical launches</p>
                  </div>

                  {/* 3. Analog vs Bass Blend Weight */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">Analog vs Bass Weight</span>
                      <span className="font-bold text-blue-600 font-mono">
                        {Math.round(wAnalog * 100)}% Analog / {Math.round((1 - wAnalog) * 100)}% Bass
                      </span>
                    </div>
                    <input
                      type="range"
                      disabled={isReadOnly || isMethodologyRestricted}
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={wAnalog}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setWAnalog(val);
                        handleRecalculate(topK, val, penetration);
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>100% Bass</span>
                      <span>50/50</span>
                      <span>100% Analog</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Selected Benchmark Analogs Table */}
            <div className="w-full">
              <AnalogTable analogs={analogs} />
            </div>
          </div>
        )}

        {/* Tab 2: Scenario Analysis Studio */}
        {activeTab === 'scenario_analysis' && (
          <ScenarioAnalysisStudio
            productInputs={productInputs}
            topK={topK}
            wAnalog={wAnalog}
          />
        )}
      </div>
    </div>
  );
}

export default function ForecastResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase">Loading Launch Studio...</p>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
