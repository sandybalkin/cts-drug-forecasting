'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  Sliders, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  Zap, 
  ShieldAlert, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { ProductInputs, ScenarioAnalysisResponse } from '@/lib/types';
import { runScenarioAnalysis } from '@/lib/api';

interface ScenarioAnalysisStudioProps {
  productInputs: ProductInputs;
  topK: number;
  wAnalog: number;
}

export default function ScenarioAnalysisStudio({
  productInputs,
  topK,
  wAnalog,
}: ScenarioAnalysisStudioProps) {
  // Preset selection: 'base_case' | 'launch_upside' | 'competitive_downside' | 'custom'
  const [activePreset, setActivePreset] = useState<string>('base_case');

  // Adjustable sliders state
  const [marketAccessChange, setMarketAccessChange] = useState<number>(0.0);
  const [launchSupportChange, setLaunchSupportChange] = useState<number>(0.0);
  const [competitivePressure, setCompetitivePressure] = useState<number>(0.0);
  const [competitorEntryWeek, setCompetitorEntryWeek] = useState<number>(26);
  const [mitigationStrength, setMitigationStrength] = useState<number>(0.0);

  // Response state
  const [scenarioData, setScenarioData] = useState<ScenarioAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Apply Presets
  const applyPreset = (preset: 'base_case' | 'launch_upside' | 'competitive_downside') => {
    setActivePreset(preset);
    if (preset === 'base_case') {
      setMarketAccessChange(0.0);
      setLaunchSupportChange(0.0);
      setCompetitivePressure(0.0);
      setCompetitorEntryWeek(26);
      setMitigationStrength(0.0);
    } else if (preset === 'launch_upside') {
      setMarketAccessChange(0.15);
      setLaunchSupportChange(0.25);
      setCompetitivePressure(0.05);
      setCompetitorEntryWeek(36);
      setMitigationStrength(0.80);
    } else if (preset === 'competitive_downside') {
      setMarketAccessChange(-0.20);
      setLaunchSupportChange(-0.15);
      setCompetitivePressure(0.30);
      setCompetitorEntryWeek(16);
      setMitigationStrength(0.20);
    }
  };

  // Fetch Scenario Calculation
  const fetchScenario = useCallback(async () => {
    setLoading(true);
    try {
      const res = await runScenarioAnalysis({
        product_inputs: productInputs,
        top_k: topK,
        w_analog: wAnalog,
        scenario_preset: activePreset,
        market_access_change: marketAccessChange,
        launch_support_change: launchSupportChange,
        competitive_pressure: competitivePressure,
        competitor_entry_week: competitorEntryWeek,
        mitigation_strength: mitigationStrength,
      });
      setScenarioData(res);
    } catch (err) {
      console.error('Scenario calculation failed:', err);
    } finally {
      setLoading(false);
    }
  }, [
    productInputs,
    topK,
    wAnalog,
    activePreset,
    marketAccessChange,
    launchSupportChange,
    competitivePressure,
    competitorEntryWeek,
    mitigationStrength,
  ]);

  useEffect(() => {
    fetchScenario();
  }, [fetchScenario]);

  const handleSliderChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    setActivePreset('custom');
    setter(value);
  };

  return (
    <div className="space-y-6">
      {/* Header & Presets Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">What-If Scenario Analysis Layer</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate commercial shifts, launch execution support, and competitive entry impact on top of the 52-week Hybrid Forecast.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => applyPreset('base_case')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activePreset === 'base_case'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Base Case
          </button>
          <button
            onClick={() => applyPreset('launch_upside')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activePreset === 'launch_upside'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Launch Upside
          </button>
          <button
            onClick={() => applyPreset('competitive_downside')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activePreset === 'competitive_downside'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Competitive Downside
          </button>
        </div>
      </div>

      {/* Main Grid: Sliders on left, Recharts & KPIs on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls Panel (4 Columns) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-500" /> Scenario Assumptions
            </h4>
            {activePreset === 'custom' && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Custom Modified
              </span>
            )}
          </div>

          {/* 1. Market Access Change */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Market Access Change</span>
              <span className={`font-mono ${marketAccessChange > 0 ? 'text-emerald-600 font-bold' : marketAccessChange < 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                {marketAccessChange > 0 ? '+' : ''}{(marketAccessChange * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="-0.30"
              max="0.30"
              step="0.05"
              value={marketAccessChange}
              onChange={(e) => handleSliderChange(setMarketAccessChange, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-30% (Restricted)</span>
              <span>0%</span>
              <span>+30% (Favorable)</span>
            </div>
          </div>

          {/* 2. Launch Support / Promotion */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Launch Support / Promotion</span>
              <span className={`font-mono ${launchSupportChange > 0 ? 'text-emerald-600 font-bold' : launchSupportChange < 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                {launchSupportChange > 0 ? '+' : ''}{(launchSupportChange * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="-0.50"
              max="0.50"
              step="0.05"
              value={launchSupportChange}
              onChange={(e) => handleSliderChange(setLaunchSupportChange, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-50% (Low Push)</span>
              <span>0%</span>
              <span>+50% (Heavy Push)</span>
            </div>
          </div>

          {/* 3. Competitive Pressure */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Competitive Pressure</span>
              <span className="font-mono text-rose-600 font-bold">
                {(competitivePressure * 100).toFixed(0)}% Share Loss
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.50"
              step="0.05"
              value={competitivePressure}
              onChange={(e) => handleSliderChange(setCompetitivePressure, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (No Loss)</span>
              <span>25%</span>
              <span>50% (High Loss)</span>
            </div>
          </div>

          {/* 4. Competitor Entry Week */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Competitor Entry Week</span>
              <span className="font-mono text-indigo-700 font-bold">
                Week {competitorEntryWeek}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="52"
              step="1"
              value={competitorEntryWeek}
              onChange={(e) => handleSliderChange(setCompetitorEntryWeek, parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Week 1 (Early)</span>
              <span>Week 26</span>
              <span>Week 52 (Late)</span>
            </div>
          </div>

          {/* 5. Mitigation Strength */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Mitigation Defense Strength</span>
              <span className="font-mono text-emerald-600 font-bold">
                {(mitigationStrength * 100).toFixed(0)}% Offset
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={mitigationStrength}
              onChange={(e) => handleSliderChange(setMitigationStrength, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (Unmitigated)</span>
              <span>50%</span>
              <span>100% (Full Defense)</span>
            </div>
          </div>
        </div>

        {/* Right Output Panel (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Baseline 52w Rx */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Baseline 52w Rx</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                {scenarioData ? Math.round(scenarioData.baseline_52w_rx).toLocaleString() : '---'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Original Hybrid Model</span>
            </div>

            {/* Scenario 52w Rx */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Scenario 52w Rx</span>
              <span className="text-lg font-bold font-mono text-indigo-600 mt-1 block">
                {scenarioData ? Math.round(scenarioData.scenario_52w_rx).toLocaleString() : '---'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">What-If Adjusted Volume</span>
            </div>

            {/* Scenario Impact % */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Scenario Impact %</span>
              <div className="flex items-center gap-1 mt-1">
                {scenarioData && scenarioData.scenario_impact_pct >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-rose-600" />
                )}
                <span className={`text-lg font-bold font-mono ${scenarioData && scenarioData.scenario_impact_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {scenarioData ? (scenarioData.scenario_impact_pct > 0 ? '+' : '') + scenarioData.scenario_impact_pct.toFixed(1) + '%' : '---'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Volume Variance</span>
            </div>

            {/* Peak Weekly Rx & Week */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Peak Weekly Rx</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                {scenarioData ? Math.round(scenarioData.peak_weekly_rx).toLocaleString() : '---'}
              </span>
              <span className="text-[10px] text-indigo-700 font-semibold mt-0.5 block">
                {scenarioData ? `Peak Week ${scenarioData.peak_week}` : '---'}
              </span>
            </div>
          </div>

          {/* Dynamic 52-Week Recharts Comparison Line Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Baseline vs Scenario 52-Week Prescription Trajectory</h4>
                <p className="text-xs text-slate-500">
                  Weekly comparative volume showing real-time impact and competitor entry milestone
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-3 h-0.5 bg-blue-600 rounded-full" /> Baseline
                </span>
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <span className="w-3 h-0.5 bg-indigo-600 rounded-full" /> Scenario
                </span>
              </div>
            </div>

            <div className="h-[340px] w-full relative">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {scenarioData && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scenarioData.weekly_comparison} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis 
                      dataKey="week" 
                      tick={{ fill: '#64748B', fontSize: 11 }} 
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                      label={{ value: 'Launch Week (1 - 52)', position: 'insideBottom', offset: -10, fill: '#94A3B8', fontSize: 11 }}
                    />
                    <YAxis 
                      tick={{ fill: '#64748B', fontSize: 11 }} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any, name: any) => [
                        `${Math.round(val).toLocaleString()} Rx`, 
                        name === 'baseline_rx' ? 'Baseline Forecast' : 'Scenario Forecast'
                      ]}
                      labelFormatter={(wk) => `Week ${wk}`}
                    />
                    
                    {/* Competitor Entry Marker Line */}
                    <ReferenceLine 
                      x={competitorEntryWeek} 
                      stroke="#EF4444" 
                      strokeDasharray="4 4" 
                      strokeWidth={2}
                      label={{ 
                        value: `Competitor Entry (Wk ${competitorEntryWeek})`, 
                        position: 'top', 
                        fill: '#DC2626', 
                        fontSize: 11,
                        fontWeight: 'bold'
                      }} 
                    />

                    <Line 
                      type="monotone" 
                      dataKey="baseline_rx" 
                      stroke="#2563EB" 
                      strokeWidth={2} 
                      dot={false}
                      name="baseline_rx"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="scenario_rx" 
                      stroke="#7C3AED" 
                      strokeWidth={2.5} 
                      dot={false}
                      name="scenario_rx"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Scenario Explanation Card */}
          {scenarioData && scenarioData.explanation && (
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Info className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Scenario Plain-Language Analysis & Drivers</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Changed Assumptions */}
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-1.5">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">1. Changed Assumptions</span>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {scenarioData.explanation.assumptions_changed.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Individual Driver Effects */}
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-1.5">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">2. Driver Effects</span>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {scenarioData.explanation.individual_effects.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Overall Impact & Direction */}
              <div className="bg-indigo-950/60 p-4 rounded-xl border border-indigo-800/60 text-xs space-y-1">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">3. Directional Impact & 52-Week Summary</span>
                <p className="text-slate-200 leading-relaxed">{scenarioData.explanation.directional_impact}</p>
                <p className="text-slate-400 mt-1">{scenarioData.explanation.overall_impact}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
