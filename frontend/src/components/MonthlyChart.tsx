'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { MonthlyPoint } from '@/lib/types';
import { Calendar } from 'lucide-react';

interface MonthlyChartProps {
  data: MonthlyPoint[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const monthLabels = [
    'M1', 'M2', 'M3', 'M4', 'M5', 'M6',
    'M7', 'M8', 'M9', 'M10', 'M11', 'M12'
  ];

  const formattedData = data.map((d, i) => ({
    ...d,
    label: monthLabels[i] || `M${d.month}`
  }));

  const formatNumber = (val: number) => {
    if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M';
    if (val >= 1e3) return (val / 1e3).toFixed(1) + 'k';
    return val.toLocaleString();
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="mb-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          12-Month Rollout Volume Breakdown
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Aggregated 4-week monthly volume across scenarios
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={formatNumber} />
            <Tooltip
              formatter={(value: any, name: any) => [
                typeof value === 'number' ? Math.round(value).toLocaleString() : value,
                name
              ]}
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#1E293B',
                borderRadius: '0.75rem',
                color: '#F8FAFC',
                fontSize: '12px'
              }}
            />
            <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }} />
            <Bar dataKey="bear_rx" name="Bear Monthly" fill="#fcd34d" radius={[4, 4, 0, 0]} />
            <Bar dataKey="hybrid_rx" name="Base Hybrid" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="bull_rx" name="Bull Monthly" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
