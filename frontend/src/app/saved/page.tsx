'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Database, Calendar, ArrowRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { fetchSavedForecasts } from '@/lib/api';
import { SavedForecastRecord } from '@/lib/types';
import Link from 'next/link';

export default function SavedForecastsPage() {
  const [records, setRecords] = useState<SavedForecastRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedForecasts()
      .then(setRecords)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Saved Forecast Records (PostgreSQL Database)"
        subtitle="Historical saved scenarios and commercial launch forecast runs"
        backHref="/"
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3 text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Querying PostgreSQL database...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
            <Database className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No saved forecasts in database yet</p>
            <p className="text-xs text-slate-400 mt-1">Run a forecast and click 'Save to Database' on the results page</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Database Records ({records.length})</h3>
                <p className="text-xs text-slate-500">Saved launch model configurations and outputs</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                PostgreSQL Connected
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-5">ID</th>
                    <th className="py-3.5 px-5">Product Name</th>
                    <th className="py-3.5 px-5">Therapeutic Area</th>
                    <th className="py-3.5 px-5">Base 52w Rx</th>
                    <th className="py-3.5 px-5">Bull 52w Rx</th>
                    <th className="py-3.5 px-5">Bear 52w Rx</th>
                    <th className="py-3.5 px-5">Created At</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {records.map((r) => {
                    const encodedPayload = encodeURIComponent(JSON.stringify({
                      product_inputs: r.input_json,
                      top_k: r.forecast_result_json?.assumptions?.top_k || 3,
                      w_analog: r.forecast_result_json?.assumptions?.w_analog || 0.10
                    }));

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5 font-mono font-bold text-slate-500">#{r.id}</td>
                        <td className="py-4 px-5 font-bold text-slate-900">{r.product_name}</td>
                        <td className="py-4 px-5">{r.therapeutic_area}</td>
                        <td className="py-4 px-5 font-mono font-bold text-blue-600">
                          {Math.round(r.base_52w_rx).toLocaleString()} Rx
                        </td>
                        <td className="py-4 px-5 font-mono font-semibold text-emerald-600">
                          {Math.round(r.bull_52w_rx).toLocaleString()} Rx
                        </td>
                        <td className="py-4 px-5 font-mono font-semibold text-amber-600">
                          {Math.round(r.bear_52w_rx).toLocaleString()} Rx
                        </td>
                        <td className="py-4 px-5 text-slate-400 font-mono text-[11px]">
                          {r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <Link
                            href={`/forecast/results?data=${encodedPayload}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                          >
                            Load Analysis <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
