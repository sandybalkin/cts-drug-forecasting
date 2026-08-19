'use client';

import React, { useState } from 'react';
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
import { WeeklyPoint, BassParams } from '@/lib/types';
import { Layers, Activity } from 'lucide-react';

interface WeeklyChartProps {
  data: WeeklyPoint[];
  bassParams: BassParams;
}

export default function WeeklyChart({ data, bassParams }: WeeklyChartProps) {
  const [viewType, setViewType] = useState<'weekly' | 'cumulative'>('weekly');
  const [showDecomposition, setShowDecomposition] = useState(false);

  const formatNumber = (val: number) => {
    if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M';
    if (val >= 1e3) return (val / 1e3).toFixed(1) + 'k';
    return val.toLocaleString();
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            52-Week Launch Trajectory Curve
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewType === 'weekly' ? 'Weekly Prescription Adoption (Rx)' : 'Cumulative Adoption Progress'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewType('weekly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewType === 'weekly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Rx
          </button>
          <button
            onClick={() => setViewType('cumulative')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewType === 'cumulative'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cumulative Rx
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1" />
          <button
            onClick={() => setShowDecomposition(!showDecomposition)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              showDecomposition
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Bass vs Analog
          </button>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="week"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              tickFormatter={(w) => `W${w}`}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              tickFormatter={formatNumber}
            />
            <Tooltip
              formatter={(value: any, name: any) => [
                typeof value === 'number' ? Math.round(value).toLocaleString() : value,
                name
              ]}
              labelFormatter={(label) => `Week ${label}`}
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#1E293B',
                borderRadius: '0.75rem',
                color: '#F8FAFC',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingBottom: '16px' }}
            />

            {viewType === 'cumulative' && (
              <ReferenceLine
                y={bassParams.m_hat}
                label={{
                  value: `Market Potential M = ${formatNumber(bassParams.m_hat)}`,
                  fill: '#64748b',
                  fontSize: 11,
                  position: 'insideTopRight'
                }}
                stroke="#94a3b8"
                strokeDasharray="4 4"
              />
            )}

            {viewType === 'weekly' ? (
              <>
                <Line
                  type="monotone"
                  dataKey="bull_rx"
                  name="Bull Scenario (+20%)"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="hybrid_rx"
                  name="Base Hybrid Forecast"
                  stroke="#2563eb"
                  strokeWidth={3.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="bear_rx"
                  name="Bear Scenario (-20%)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                {showDecomposition && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="bass_rx"
                      name="Bass Model Only"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      strokeDasharray="2 2"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="analog_rx"
                      name="Analog Blended Only"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="2 2"
                      dot={false}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="cumulative_bull_rx"
                  name="Bull Cumulative"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative_hybrid_rx"
                  name="Base Hybrid Cumulative"
                  stroke="#2563eb"
                  strokeWidth={3.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative_bear_rx"
                  name="Bear Cumulative"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
