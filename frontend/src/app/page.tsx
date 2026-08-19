'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { 
  PlusCircle, 
  TrendingUp, 
  Database, 
  BrainCircuit, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  FileSpreadsheet,
  Activity,
  Layers
} from 'lucide-react';
import { DEFAULT_PRODUCT_INPUTS } from '@/lib/api';

export default function DashboardPage() {
  const [checkingAuth, setCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('pharmalaunch_token');
    if (!token) {
      window.location.href = '/login';
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const defaultPayload = encodeURIComponent(JSON.stringify({
    product_inputs: DEFAULT_PRODUCT_INPUTS,
    top_k: 3,
    w_analog: 0.10
  }));

  if (checkingAuth) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-3 bg-slate-900 min-h-screen">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider">Authenticating Workspace Account...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Executive Forecast Dashboard"
        subtitle="Enterprise Decision Support & Launch Curve Analytics Platform"
      />

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-cyan-300 border border-cyan-500/30">
                <Zap className="w-3.5 h-3.5" /> Quantitative Launch Engine Active
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Predict 52-Week Pharmaceutical Launch Trajectories
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Seamlessly analyze pre-launch market attributes and historical drug launch curves for high-precision 52-week revenue and adoption trajectories.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                href={`/forecast/results?data=${defaultPayload}`}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-sm text-white shadow-lg shadow-blue-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:-translate-y-0.5"
              >
                <Zap className="w-4 h-4" /> Run Apixaban Benchmark
              </Link>
              <Link
                href="/forecast/new"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-sm text-white border border-white/15 backdrop-blur-md transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Create Custom Launch
              </Link>
            </div>
          </div>
        </div>

        {/* Analytics KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Historical Analogs</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">150 Products</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Fully Validated Curves
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Database className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Default Blend Weight</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">10% / 90%</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Analog & Diffusion Weighting
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Model R² Performance</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">0.895 Mean</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                Median Correlation: 0.929
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scenarios Calculated</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">Bull / Base / Bear</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                ±20% Market Sensitivity
              </p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
              <BrainCircuit className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Active Pipeline Candidates Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active Launch Pipeline Forecasts</h3>
              <p className="text-xs text-slate-500">Commercial launches undergoing quantitative sensitivity modeling</p>
            </div>
            <Link
              href="/forecast/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/60"
            >
              <PlusCircle className="w-3.5 h-3.5" /> New Forecast
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-5">Product Name</th>
                  <th className="py-3.5 px-5">Therapeutic Area</th>
                  <th className="py-3.5 px-5">Indication</th>
                  <th className="py-3.5 px-5">Addressable Pop.</th>
                  <th className="py-3.5 px-5">Base 52w Rx Total</th>
                  <th className="py-3.5 px-5">Top Analogs</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    NEW_P020 (Apixaban Candidate)
                  </td>
                  <td className="py-4 px-5">Cardiology</td>
                  <td className="py-4 px-5">Atrial Fibrillation</td>
                  <td className="py-4 px-5 font-mono">649,430</td>
                  <td className="py-4 px-5 font-mono font-bold text-blue-600">97,334 Rx</td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                      P020, P065, P051
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Link
                      href={`/forecast/results?data=${defaultPayload}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      View Analysis <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    ONCO_X1 (Immuno-Oncology)
                  </td>
                  <td className="py-4 px-5">Oncology</td>
                  <td className="py-4 px-5">Non-Small Cell Lung Cancer</td>
                  <td className="py-4 px-5 font-mono">180,000</td>
                  <td className="py-4 px-5 font-mono font-bold text-slate-800">42,500 Rx</td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                      P012, P044, P088
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Link
                      href="/forecast/new"
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      Edit Inputs <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
