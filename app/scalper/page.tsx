'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  Activity,
  History,
  Layers
} from 'lucide-react';

export default function ScalperDashboardPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningTick, setRunningTick] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [tickResult, setTickResult] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [wRes, sRes, pRes] = await Promise.all([
        fetch('/api/scalper/wallet'),
        fetch('/api/scalper/state'),
        fetch('/api/scalper/positions'),
      ]);

      if (wRes.ok) setWallet(await wRes.json());
      if (sRes.ok) setState(await sRes.json());
      if (pRes.ok) setPositions(await pRes.json());
    } catch (err) {
      console.error('Error fetching scalper dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Auto refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRunTick = async () => {
    setRunningTick(true);
    setTickResult(null);
    try {
      const res = await fetch('/api/scalper/tick');
      const data = await res.json();
      setTickResult(data);
      await fetchData();
    } catch (err: any) {
      setTickResult({ status: 'error', message: err.message });
    } finally {
      setRunningTick(false);
    }
  };

  const handleResetScalper = async () => {
    if (!confirm('Are you sure you want to reset the Scalper Wallet back to ₹100,000 and clear state?')) return;
    setResetting(true);
    try {
      await fetch('/api/scalper/wallet', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Error resetting scalper:', err);
    } finally {
      setResetting(false);
    }
  };

  if (loading && !wallet) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading Intraday Scalper Engine...</p>
      </div>
    );
  }

  const dailyPnL = state?.daily_pnl || 0;
  const isPositivePnL = dailyPnL >= 0;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Intraday Scalping Space
            </span>
            <span className="text-xs font-semibold text-slate-400">Isolated Paper Bot</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Scalper Bot Workspace
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
            High-frequency intraday momentum engine (1-min candles, VWAP Magnet, 1.5x Volume Multiplier, +0.20% TP & Break-Even Trailing).
          </p>
        </div>

        {/* Scalper Quick Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunTick}
            disabled={runningTick}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
          >
            <Play className={`h-4 w-4 fill-slate-950 ${runningTick ? 'animate-spin' : ''}`} />
            <span>{runningTick ? 'Scanning 1m...' : 'Run 1m Scalp Tick'}</span>
          </button>

          <button
            onClick={handleResetScalper}
            disabled={resetting}
            className="inline-flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Scalper</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center space-x-2 border-b border-slate-800/60 pb-3">
        <Link
          href="/scalper"
          className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5"
        >
          <Layers className="h-3.5 w-3.5" /> Dashboard & Positions
        </Link>
        <Link
          href="/scalper/activity"
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
        >
          <Activity className="h-3.5 w-3.5" /> 1m Activity Log
        </Link>
        <Link
          href="/scalper/trades"
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
        >
          <History className="h-3.5 w-3.5" /> Scalp Trades History
        </Link>
      </div>

      {/* Execution Feedback Banner */}
      {tickResult && (
        <div className={`rounded-xl border p-4 text-xs font-medium flex items-center justify-between ${
          tickResult.status === 'trade_opened'
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
            : tickResult.status === 'error'
            ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>{tickResult.message}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleTimeString()}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Scalp Wallet Balance */}
        <div className="glass-card rounded-2xl p-5 space-y-2 border border-slate-800/80">
          <span className="text-xs font-medium text-slate-400">Scalper Wallet Balance</span>
          <div className="text-2xl font-extrabold text-white">
            ₹{wallet?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '100,000.00'}
          </div>
          <p className="text-[11px] text-slate-400">Starting Capital: ₹{wallet?.starting_balance?.toLocaleString() || '100,000'}</p>
        </div>

        {/* Today's Realized Scalp P&L */}
        <div className="glass-card rounded-2xl p-5 space-y-2 border border-slate-800/80">
          <span className="text-xs font-medium text-slate-400">Today's Scalper P&L</span>
          <div className={`text-2xl font-extrabold flex items-center gap-1.5 ${isPositivePnL ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositivePnL ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            <span>₹{dailyPnL.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-slate-400">Goal: ₹1,000+ daily profit</p>
        </div>

        {/* Circuit Breaker Status */}
        <div className="glass-card rounded-2xl p-5 space-y-2 border border-slate-800/80">
          <span className="text-xs font-medium text-slate-400">Circuit Breaker (-2% Drawdown)</span>
          <div className="flex items-center space-x-2">
            {state?.is_disabled_today ? (
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" /> SHUTDOWN (-2% hit)
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> ACTIVE & RUNNING
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Max Loss Limit: -₹2,000 / day</p>
        </div>

        {/* Cooldown Status */}
        <div className="glass-card rounded-2xl p-5 space-y-2 border border-slate-800/80">
          <span className="text-xs font-medium text-slate-400">Dynamic Cooldown Timer</span>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <span className="text-sm font-bold text-white">
              {state?.cooldown_until && new Date(state.cooldown_until) > new Date()
                ? `Cooling (${Math.ceil((new Date(state.cooldown_until).getTime() - Date.now()) / 1000)}s)`
                : 'Ready for Entry'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">30s Win / 120s Loss Cooldown</p>
        </div>
      </div>

      {/* Active Open Positions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" /> Active Open Scalp Positions
          </h2>
          <span className="text-xs font-semibold text-slate-400">{positions.length} Open Position</span>
        </div>

        {positions.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center space-y-2">
            <Layers className="mx-auto h-8 w-8 text-slate-600" />
            <h3 className="text-sm font-bold text-white">No Active Scalp Positions</h3>
            <p className="text-xs text-slate-400">
              The 1-minute engine scans for VWAP dips with 1.5x volume spikes. Click "Run 1m Scalp Tick" to execute a scan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {positions.map((pos) => (
              <div key={pos.id} className="glass-card rounded-2xl p-5 space-y-4 border border-amber-500/30">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mr-2">
                      {pos.side}
                    </span>
                    <span className="text-lg font-extrabold text-white">{pos.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-400 block">Quantity</span>
                    <span className="font-bold text-white">{pos.quantity} shares</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-slate-950 rounded-xl p-3 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Entry Price</span>
                    <span className="font-bold text-white">₹{pos.entry_price}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 font-sans block">Take Profit (+0.20%)</span>
                    <span className="font-bold text-emerald-400">₹{pos.tp_price}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 font-sans block">Stop Loss (-0.50%)</span>
                    <span className="font-bold text-rose-400">₹{pos.sl_price}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                      pos.break_even_triggered
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {pos.break_even_triggered ? 'Break-Even Trailing Active ($0 Risk)' : 'Standard SL'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Opened: {new Date(pos.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
