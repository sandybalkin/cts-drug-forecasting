'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Building2, Mail, Lock, User, ArrowRight, ShieldCheck, CheckCircle2, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);

  const [orgName, setOrgName] = useState('Novartis Commercial');
  const [fullName, setFullName] = useState('US Commercial Director');
  const [email, setEmail] = useState('us_commercial@pharmalaunch.com');
  const [password, setPassword] = useState('pharma123');
  const [role, setRole] = useState('launch_director');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const endpoint = isSignUp 
      ? 'http://localhost:8000/api/auth/signup' 
      : 'http://localhost:8000/api/auth/signin';

    const payload = isSignUp 
      ? { organization_name: orgName, full_name: fullName, email, password, role }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      localStorage.setItem('pharmalaunch_token', data.token);
      localStorage.setItem('pharmalaunch_org', data.organization_name);
      localStorage.setItem('pharmalaunch_user_email', data.email);
      localStorage.setItem('pharmalaunch_role', data.role || 'launch_director');

      setSuccess(isSignUp ? 'Organization account created! Redirecting to Dashboard...' : 'Signed in successfully! Redirecting to Dashboard...');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-white select-none relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <Header
        title="PharmaLaunch PRO — Enterprise Launch Forecasting Platform"
        subtitle="PostgreSQL 17 Database Authentication & Quantitative Forecast Engine Portal"
        hideExport={true}
      />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-xl shadow-blue-500/25 border border-cyan-400/30">
              P
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              PharmaLaunch <span className="text-cyan-400 font-extrabold text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">PRO</span>
            </h1>
            <h2 className="text-base font-bold text-slate-200">
              {isSignUp ? 'Register Launch Organization' : 'Sign In to Enterprise Workspace'}
            </h2>
            <p className="text-xs text-slate-400">
              {isSignUp 
                ? 'Create a pharmaceutical organization profile connected to PostgreSQL 17'
                : 'Access your persistent forecast studio and PostgreSQL historical records'
              }
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl text-center font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Organization Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Novartis Commercial"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    User Role Assignment
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none"
                    >
                      <option value="launch_director">Launch Director / Head Analyst (Full Access)</option>
                      <option value="forecast_analyst">Forecast Analyst (Analyst & Scenario Access)</option>
                      <option value="commercial_associate">Commercial / Launch Associate (Inputs & Actuals)</option>
                      <option value="management_viewer">Management / Stakeholder Viewer (Read-Only)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="commercial@pharmalaunch.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all mt-2"
            >
              {loading ? (
                <span>Processing PostgreSQL 17 Request...</span>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Organization Account' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              {isSignUp 
                ? 'Already have an organization account? Sign In'
                : 'Need to register a new launching organization? Sign Up'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
