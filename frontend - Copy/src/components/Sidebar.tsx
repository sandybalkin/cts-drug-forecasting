'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  PlusCircle, 
  TrendingUp, 
  Database, 
  Building2, 
  ShieldCheck, 
  History,
  LogOut,
  UserCheck,
  Award,
  BookOpen
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [orgName, setOrgName] = useState('Novartis Commercial');
  const [userEmail, setUserEmail] = useState('us_commercial@pharmalaunch.com');
  const [role, setRole] = useState('launch_director');

  useEffect(() => {
    const cachedOrg = localStorage.getItem('pharmalaunch_org');
    const cachedEmail = localStorage.getItem('pharmalaunch_user_email');
    const cachedRole = localStorage.getItem('pharmalaunch_role');
    if (cachedOrg) setOrgName(cachedOrg);
    if (cachedEmail) setUserEmail(cachedEmail);
    if (cachedRole) setRole(cachedRole);
  }, []);

  if (pathname === '/login') {
    return null;
  }

  const roleLabels: Record<string, string> = {
    launch_director: 'Launch Director',
    forecast_analyst: 'Forecast Analyst',
    commercial_associate: 'Commercial Associate',
    management_viewer: 'Management Viewer (Read-Only)'
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'New Launch Forecast', href: '/forecast/new', icon: PlusCircle },
    { name: 'Forecast Analysis', href: '/forecast/results', icon: TrendingUp },
    { name: 'Forecast Explanations', href: '/forecast/explanations', icon: BookOpen },
    { name: 'Analog Database', href: '/analogs', icon: Database },
    { name: 'Saved DB Forecasts', href: '/saved', icon: History },
    { name: 'Sign In / Account', href: '/login', icon: UserCheck },
  ];

  const handleLogout = () => {
    localStorage.removeItem('pharmalaunch_token');
    localStorage.removeItem('pharmalaunch_org');
    localStorage.removeItem('pharmalaunch_user_email');
    localStorage.removeItem('pharmalaunch_role');
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-slate-950 text-slate-200 flex flex-col min-h-screen border-r border-slate-800/80 shadow-2xl select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-black text-xl">
          P
        </div>
        <div>
          <h1 className="font-bold text-slate-100 tracking-wide text-base leading-tight">
            PharmaLaunch <span className="text-cyan-400 font-extrabold text-xs px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/50">PRO</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Launch Forecasting Platform</p>
        </div>
      </div>

      {/* Workspace Indicator & Auth Link */}
      <div className="mx-3 my-4 p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="text-xs overflow-hidden">
              <p className="text-slate-200 font-semibold leading-none truncate">{orgName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{userEmail}</p>
            </div>
          </div>
          <Link 
            href="/login"
            title="Account / Login"
            className="text-slate-400 hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <UserCheck className="w-4 h-4" />
          </Link>
        </div>
        <div className="pt-1 border-t border-slate-800/60 flex items-center gap-1.5 text-[10px] font-semibold text-cyan-400">
          <Award className="w-3 h-3 text-cyan-400" />
          <span className="truncate">{roleLabels[role] || 'Launch Director'}</span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 space-y-1.5">
        <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-md shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Engine Status & Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-300">PostgreSQL 17 Live</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 font-semibold"
          >
            <LogOut className="w-3 h-3" /> Logout
          </button>
        </div>
        <p className="text-[11px] text-slate-400 leading-normal">
          Bass Diffusion + Gower Analogs + PostgreSQL 17
        </p>
      </div>
    </aside>
  );
}
