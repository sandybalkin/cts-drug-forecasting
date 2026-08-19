'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { runForecast, DEFAULT_PRODUCT_INPUTS } from '@/lib/api';
import { ForecastResponse, ProductInputs } from '@/lib/types';
import { 
  BookOpen, 
  BrainCircuit, 
  Database, 
  Layers, 
  TrendingUp, 
  FileSpreadsheet, 
  CheckCircle2, 
  Activity,
  Zap,
  Info,
  Sliders,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function ForecastExplanationsPage() {
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [productInputs, setProductInputs] = useState<ProductInputs>(DEFAULT_PRODUCT_INPUTS);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const cached = sessionStorage.getItem('latest_forecast_payload');
        let payload = {
          product_inputs: DEFAULT_PRODUCT_INPUTS,
          top_k: 3,
          w_analog: 0.10
        };

        if (cached) {
          payload = JSON.parse(cached);
        }

        setProductInputs(payload.product_inputs);
        const res = await runForecast(payload);
        setForecastData(res);
      } catch (err) {
        console.error('Failed to load forecast explanation data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase">Loading Forecast Explanations & Provenance Data...</p>
      </div>
    );
  }

  const bass = forecastData?.bass_params;
  const summary = forecastData?.summary_totals;
  const analogs = forecastData?.analogs || [];
  const explanations = forecastData?.explanations;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Forecast Model Explanations & Data Provenance"
        subtitle="Complete mathematical, statistical, and PostgreSQL 17 source attribution breakdown"
        backHref="/forecast/results"
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Candidate Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Active Candidate Explanation Profile
            </span>
            <h2 className="text-2xl font-black text-white">
              {productInputs.product_name || 'Apixaban Candidate'} ({productInputs.product_id || 'NEW_DRUG'})
            </h2>
            <p className="text-xs text-slate-300">
              {productInputs.therapeutic_area} | {productInputs.indication} | Addressable Population: {productInputs.addressable_population.toLocaleString()}
            </p>
          </div>

          <Link
            href="/forecast/results"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-lg shadow-blue-600/30 transition-all"
          >
            <TrendingUp className="w-4 h-4" /> View Launch Studio Curves
          </Link>
        </div>

        {/* Data Provenance & Source Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">PostgreSQL 17 Benchmark Database</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fetched from <span className="font-mono font-bold text-slate-800">analog_products</span> table containing 150 historical drug launch trajectory curves across 52 weeks.
            </p>
            <div className="pt-2 text-[11px] font-bold text-blue-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Verified Historical Records
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Bass Diffusion Model Fitting</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Parameters <span className="font-mono font-bold">p</span> (Innovation) and <span className="font-mono font-bold">q</span> (Imitation) derived using Standardized Ridge Regression fitted on 150 historical launches.
            </p>
            <div className="pt-2 text-[11px] font-bold text-purple-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Standardized Ridge Model Active
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Gower Similarity Distance Matrix</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calculated across 7 categorical attributes and 5 continuous numerical variables using range-normalized Manhattan distance.
            </p>
            <div className="pt-2 text-[11px] font-bold text-indigo-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Top {analogs.length} Benchmark Analogs Selected
            </div>
          </div>
        </div>

        {/* Detailed Explanation Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: Natural Language Model Explanations */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-200">
              <BookOpen className="w-5 h-5 text-blue-600" /> Executive Model Explanations
            </h3>

            {explanations && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Analog Curve Blend Rationale
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-4">
                    {explanations.why_analogs}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-950">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    Innovation Rate (p) Derivation
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-4">
                    {explanations.why_bass_p}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Imitation Rate (q) Derivation
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-4">
                    {explanations.why_bass_q}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Market Potential (M) Ceiling
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-4">
                    {explanations.why_m}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Mathematical Parameter Attribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-200">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" /> Bass Parameter Derivation Formulae
            </h3>

            {bass && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-purple-900">Innovation Parameter (p)</span>
                    <span className="font-mono font-black text-purple-700 text-sm">{bass.p_hat}</span>
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Driven by marketing awareness ({productInputs.marketing_awareness}/10), launch strength ({productInputs.launch_strength}/10), and physician awareness ({productInputs.physician_awareness}/10).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-indigo-900">Imitation Parameter (q)</span>
                    <span className="font-mono font-black text-indigo-700 text-sm">{bass.q_hat}</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Driven by clinical evidence strength ({productInputs.clinical_evidence_strength}/10) and treatment familiarity ({productInputs.treatment_familiarity}/10).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-blue-900">Market Potential (M)</span>
                    <span className="font-mono font-black text-blue-700 text-sm">{bass.m_hat.toLocaleString()} Rx</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    M = Addressable Population ({productInputs.addressable_population.toLocaleString()}) × Peak Penetration ({(productInputs.estimated_penetration * 100).toFixed(1)}%).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Selected Historical Analogs Provenance Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" /> Benchmark Analog Provenance (PostgreSQL 17 Data Source)
              </h3>
              <p className="text-xs text-slate-500">Historical launch curves queried directly from PostgreSQL 17 reference store</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 font-mono text-xs font-bold text-slate-700 rounded-lg">
              {analogs.length} Analogs Selected
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Analog Product ID</th>
                  <th className="py-3 px-4">Gower Similarity Score</th>
                  <th className="py-3 px-4">Hybrid Weighting %</th>
                  <th className="py-3 px-4">Historical 52w Rx Total</th>
                  <th className="py-3 px-4">PostgreSQL Data Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {analogs.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {a.product_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {a.similarity_pct.toFixed(1)}% Match
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {(a.weight * 100).toFixed(1)}% Weight
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {a.historical_52w_rx.toLocaleString()} Rx
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 font-semibold text-[11px]">
                      PostgreSQL 17 (analog_products)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
