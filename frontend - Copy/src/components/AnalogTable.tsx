'use client';

import React from 'react';
import { AnalogItem } from '@/lib/types';
import { Award, Layers, Shield } from 'lucide-react';

interface AnalogTableProps {
  analogs: AnalogItem[];
}

export default function AnalogTable({ analogs }: AnalogTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Top Benchmark Launch Analogs ({analogs.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Derived via multi-attribute similarity matrix on historical products
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
          Automated Benchmarking
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Analog ID</th>
              <th className="py-3 px-4">Similarity</th>
              <th className="py-3 px-4">Blend Weight</th>
              <th className="py-3 px-4">Therapeutic Area</th>
              <th className="py-3 px-4">Indication</th>
              <th className="py-3 px-4">Route</th>
              <th className="py-3 px-4 text-right">52w Historical Rx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {analogs.map((item, idx) => (
              <tr key={item.product_id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  {item.product_id}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${item.similarity_pct}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-800">{item.similarity_pct}%</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-semibold text-blue-600">
                  {(item.weight * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4">{item.details?.therapeutic_area || 'Cardiology'}</td>
                <td className="py-3.5 px-4">{item.details?.indication || 'Hypertension'}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {item.details?.route_of_administration || 'Oral'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                  {item.historical_52w_rx.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
