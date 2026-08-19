'use client';

import React from 'react';
import { Bell, Sparkles, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
  onExport?: () => void;
  hideExport?: boolean;
}

export default function Header({ title, subtitle, backHref, actions, onExport, hideExport = false }: HeaderProps) {
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      alert("Exporting launch forecast report...");
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-xs sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link
            href={backHref}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
              <Sparkles className="w-3 h-3" /> 52-Week Horizon
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        {!hideExport && (
          <>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" /> Export Report
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
