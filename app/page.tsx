'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  ShieldCheck,
  Send,
  RefreshCw,
  Zap,
  CheckCircle2,
  ArrowRight,
  Wallet,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function Homepage() {
  const [team, setTeam] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [teamRes, walletRes, stateRes] = await Promise.all([
        fetch('/api/company/team'),
        fetch('/api/scalper/wallet'),
        fetch('/api/scalper/state'),
      ]);

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeam(teamData.team || []);
      }

      if (walletRes.ok) {
        setWallet(await walletRes.json());
      }

      if (stateRes.ok) {
        setState(await stateRes.json());
      }
    } catch (err) {
      console.error('Error fetching employee status homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const balance = wallet?.balance || 10000000;
  const dailyPnL = state?.daily_pnl || 0;
  const isPositivePnL = dailyPnL >= 0;

  if (loading && team.length === 0) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center space-y-3 bg-black">
        <div className="h-8 w-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        <p className="text-xs font-mono text-zinc-400">Loading Employee Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8 bg-black text-white selection:bg-white selection:text-black">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Live Org Telemetry
            </span>
            <span className="text-xs font-mono text-zinc-500">Autopaisa Quant Firm</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white font-mono">
            Employee Status Dashboard
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-sans max-w-2xl">
            Real-time operational metrics for all 5 virtual employees managing the ₹1 Crore firm budget.
          </p>
        </div>

        {/* Action Quick Links */}
        <div className="flex items-center space-x-3">
          <Link
            href="/scalper"
            className="inline-flex items-center space-x-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black hover:bg-zinc-200 transition-all shadow-md font-mono"
          >
            <Zap className="h-4 w-4" />
            <span>Open Scalper Desk</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <Link
            href="/company"
            className="inline-flex items-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all font-mono"
          >
            <Building2 className="h-4 w-4" />
            <span>Floor Plan</span>
          </Link>
        </div>
      </div>

      {/* Firm Unified ₹1 Cr Capital Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Unified ₹1 Cr Portfolio Balance */}
        <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950 space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Unified Firm Portfolio Capital</span>
            <Wallet className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-zinc-500">Starting Budget: ₹10,000,000.00 (₹1 Crore)</p>
        </div>

        {/* Realized Daily P&L */}
        <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950 space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Today's Realized Firm P&L</span>
            <Activity className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-extrabold text-white flex items-center gap-1.5">
            <span>{isPositivePnL ? '+' : ''}₹{dailyPnL.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-zinc-500">Combined Scalper & Swing Performance</p>
        </div>

        {/* Circuit Breaker Status */}
        <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950 space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>CRO Risk Protection (-2% Limit)</span>
            <ShieldCheck className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="flex items-center space-x-2">
            {state?.is_disabled_today ? (
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-900 text-white border border-zinc-700">
                🛑 SHUTDOWN (-2% hit)
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-900 text-white border border-zinc-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" /> ACTIVE & GUARDED
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500">Max Daily Drawdown Limit: -₹200,000</p>
        </div>
      </div>

      {/* Virtual Employees Status List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Users className="h-5 w-5 text-white" /> Virtual Staff Operational Status
          </h2>
          <span className="text-xs font-mono text-zinc-500">5 Active Team Members</span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {team.map((emp) => (
            <div
              key={emp.id}
              className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950 space-y-4 hover:border-zinc-700 transition-all font-mono"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-2xl">
                    {emp.avatar}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-extrabold text-white">{emp.name}</h3>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {emp.role}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans">{emp.title} • {emp.department}</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-zinc-900 text-white border border-zinc-700">
                  {emp.stats?.status || 'Active'}
                </span>
              </div>

              {/* Bio */}
              <p className="text-xs text-zinc-300 font-sans leading-relaxed bg-black p-3 rounded-xl border border-zinc-900">
                {emp.bio}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 text-center bg-black rounded-xl p-3 border border-zinc-900 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 font-sans block">Scans</span>
                  <span className="font-bold text-white">{emp.stats?.totalSignals || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-sans block">Trades</span>
                  <span className="font-bold text-white">{emp.stats?.totalTrades || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-sans block">Win Rate</span>
                  <span className="font-bold text-white">{emp.stats?.winRate || 100}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-sans block">P&L</span>
                  <span className="font-bold text-white">
                    {(emp.stats?.totalPnL || 0) >= 0 ? '+' : ''}₹{(emp.stats?.totalPnL || 0).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}