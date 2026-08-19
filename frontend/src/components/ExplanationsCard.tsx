'use client';

import React from 'react';
import { Explanations, BassParams } from '@/lib/types';
import { BrainCircuit, Info, Zap, Scale, Target } from 'lucide-react';

interface ExplanationsCardProps {
  explanations: Explanations;
  bassParams: BassParams;
}

export default function ExplanationsCard({ explanations, bassParams }: ExplanationsCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-lg">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">Automated Explanation Layer</h3>
            <p className="text-xs text-slate-400">Methodological derivation & parameter justification</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
          Source of Truth Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Analog Selection Explanation */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-400 mb-1.5">
            <Scale className="w-4 h-4" /> Top Analog Selection Logic
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanations.why_analogs}
          </p>
        </div>

        {/* Market Potential Explanation */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
          <div className="flex items-center gap-2 font-bold text-sm text-cyan-400 mb-1.5">
            <Target className="w-4 h-4" /> Market Potential Derivation (M)
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanations.why_m}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-700/40 text-[11px] text-slate-400 font-mono">
            M = {bassParams.addressable_population.toLocaleString()} × {(bassParams.estimated_penetration * 100).toFixed(1)}% = {bassParams.m_hat.toLocaleString()} Rx
          </div>
        </div>

        {/* Bass Innovation p Explanation */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
          <div className="flex items-center gap-2 font-bold text-sm text-purple-400 mb-1.5">
            <Zap className="w-4 h-4" /> Innovation Rate (p = {bassParams.p_hat.toFixed(4)})
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanations.why_bass_p}
          </p>
        </div>

        {/* Bass Imitation q Explanation */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
          <div className="flex items-center gap-2 font-bold text-sm text-indigo-400 mb-1.5">
            <Info className="w-4 h-4" /> Imitation Rate (q = {bassParams.q_hat.toFixed(4)})
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanations.why_bass_q}
          </p>
        </div>
      </div>
    </div>
  );
}
