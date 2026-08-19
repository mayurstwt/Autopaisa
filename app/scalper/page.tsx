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
  Layers,
  Cpu
} from 'lucide-react';

export default function ScalperDashboardPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningTick, setRunningTick] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resettingState, setResettingState] = useState(false);
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
    const interval = setInterval(fetchData, 5000);
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
    if (!confirm('Are you sure you want to reset the Scalper Wallet back to ₹10,000,000 (₹1 Crore)?')) return;
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

  const handleResetCircuitBreaker = async () => {
    setResettingState(true);
    try {
      await fetch('/api/scalper/state', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Error resetting circuit breaker state:', err);
    } finally {
      setResettingState(false);
    }
  };

  if (loading && !wallet) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-3 bg-black">
        <div className="h-8 w-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        <p className="text-xs font-mono text-zinc-400">Loading Intraday Scalper Engine...</p>
      </div>
    );
  }

  const dailyPnL = state?.daily_pnl || 0;
  const isPositivePnL = dailyPnL >= 0;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8 bg-black text-white font-mono selection:bg-white selection:text-black">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1">
              <Zap className="h-3 w-3 text-white" /> HFT Scalping Engine
            </span>
            <span className="text-xs text-zinc-500 font-sans">Unified ₹1 Cr Portfolio</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Scalper Bot Workspace
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-sans max-w-2xl">
            High-frequency intraday momentum engine (1-min candles, VWAP Magnet, 1.5x Volume Multiplier, Multi-position execution enabled).
          </p>
        </div>

        {/* Scalper Quick Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunTick}
            disabled={runningTick}
            className="inline-flex items-center space-x-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-md"
          >
            <Play className={`h-4 w-4 fill-black ${runningTick ? 'animate-spin' : ''}`} />
            <span>{runningTick ? 'Scanning 1m...' : 'Run 1m Scalp Tick'}</span>
          </button>

          {state?.is_disabled_today && (
            <button
              onClick={handleResetCircuitBreaker}
              disabled={resettingState}
              className="inline-flex items-center space-x-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${resettingState ? 'animate-spin' : ''}`} />
              <span>Clear Circuit Lock</span>
            </button>
          )}

          <button
            onClick={handleResetScalper}
            disabled={resetting}
            className="inline-flex items-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Wallet</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3 font-sans text-xs">
        <Link
          href="/scalper"
          className="px-3.5 py-1.5 rounded-xl bg-white text-black font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Layers className="h-3.5 w-3.5 text-black" /> Dashboard & Positions
        </Link>
        <Link
          href="/scalper/activity"
          className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
        >
          <Activity className="h-3.5 w-3.5" /> 1m Activity Log
        </Link>
        <Link
          href="/scalper/trades"
          className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
        >
          <History className="h-3.5 w-3.5" /> Scalp Trades History
        </Link>
      </div>

      {/* Execution Feedback Banner */}
      {tickResult && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs font-mono flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-white" />
            <span>{tickResult.message}</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">{new Date().toLocaleTimeString()}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono">
        {/* Scalp Wallet Balance */}
        <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950 space-y-2">
          <span className="text-xs text-zinc-400 font-sans">Scalper Portfolio Capital</span>
          <div className="text-2xl font-extrabold text-white">
            ₹{wallet?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '10,000,000.00'}
          </div>
          <p className="text-[11px] text-zinc-500 font-sans">Unified Budget: ₹10,000,000.00 (₹1 Crore)</p>
        </div>

        {/* Today's Realized Scalp P&L */}
        <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950 space-y-2">
          <span className="text-xs text-zinc-400 font-sans">Today's Scalper P&L</span>
          <div className="text-2xl font-extrabold text-white flex items-center gap-1.5">
            <span>{isPositivePnL ? '+' : ''}₹{dailyPnL.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-sans">Target: Multi-position execution</p>
        </div>

        {/* Circuit Breaker Status */}
        <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950 space-y-2">
          <div className="flex items-center justify-between font-sans">
            <span className="text-xs text-zinc-400">CRO Circuit Lock (-2%)</span>
            {state?.is_disabled_today && (
              <button
                onClick={handleResetCircuitBreaker}
                disabled={resettingState}
                className="text-[11px] font-bold text-white underline disabled:opacity-50"
              >
                {resettingState ? 'Resetting...' : 'Clear'}
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {state?.is_disabled_today ? (
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-zinc-900 text-white border border-zinc-700 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-white" /> SHUTDOWN (-2%)
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-zinc-900 text-white border border-zinc-800 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" /> ACTIVE & RUNNING
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 font-sans">Max Loss: -₹500,000 / day</p>
        </div>

        {/* Cooldown Status */}
        <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950 space-y-2">
          <span className="text-xs text-zinc-400 font-sans">Dynamic Cooldown Timer</span>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-bold text-white">
              {state?.cooldown_until && new Date(state.cooldown_until) > new Date()
                ? `Cooling (${Math.ceil((new Date(state.cooldown_until).getTime() - Date.now()) / 1000)}s)`
                : 'Ready for Entry'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 font-sans">30s Win / 120s Loss Cooldown</p>
        </div>
      </div>

      {/* 5 ACTIVE QUANTITATIVE STRATEGY DESKS SECTION */}
      <div className="space-y-4 font-sans">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <Cpu className="h-5 w-5 text-white" /> 5 Active Quantitative Strategy Desks
            </h2>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Operating continuously during market hours. Each strategy evaluates market data independently and places individual paper trades.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500 font-bold hidden sm:inline">5 Strategies Online</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 font-mono">
          {/* Strategy 1: Trend Following */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📈</span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Trend Following</h3>
                  <span className="text-[10px] text-zinc-500 font-sans">CTA / Trend Desk</span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-zinc-900 text-white border border-zinc-800">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Rides confirmed directional price trends using moving average crossovers (SMA20 &gt; SMA50) &amp; ADX momentum. Exits on trend reversal.
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-500 border-t border-zinc-900/60 font-sans">
              <span>Rule: <b className="text-zinc-300 font-mono">Price &gt; SMA20 &gt; SMA50</b></span>
              <span className="text-white font-mono">Auto-Execution</span>
            </div>
          </div>

          {/* Strategy 2: Mean Reversion */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-lg">⚖️</span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Mean Reversion</h3>
                  <span className="text-[10px] text-zinc-500 font-sans">Stat-Arb / Reversion Desk</span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-zinc-900 text-white border border-zinc-800">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Bets that price extremes snap back toward VWAP and RSI oversold bounds. Buys oversold dips below VWAP and sells overbought spikes.
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-500 border-t border-zinc-900/60 font-sans">
              <span>Rule: <b className="text-zinc-300 font-mono">Price &lt; VWAP Dip / RSI &lt; 35</b></span>
              <span className="text-white font-mono">Auto-Execution</span>
            </div>
          </div>

          {/* Strategy 3: Momentum Trading */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🚀</span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Momentum Trading</h3>
                  <span className="text-[10px] text-zinc-500 font-sans">HFT / Momentum Desk</span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-zinc-900 text-white border border-zinc-800">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Aggressive short-horizon momentum scanning. Capitalizes on rapid price acceleration coupled with volume confirmation (&ge; 1.5x 20m average).
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-500 border-t border-zinc-900/60 font-sans">
              <span>Rule: <b className="text-zinc-300 font-mono">Vol &ge; 1.5x & Velocity</b></span>
              <span className="text-white font-mono">Auto-Execution</span>
            </div>
          </div>

          {/* Strategy 4: Breakout Trading */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-lg">💥</span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Breakout Trading</h3>
                  <span className="text-[10px] text-zinc-500 font-sans">Breakout Desk</span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-zinc-900 text-white border border-zinc-800">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Enters when price breaks through defined 20-candle resistance/support consolidation ranges with volume surge confirmation.
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-500 border-t border-zinc-900/60 font-sans">
              <span>Rule: <b className="text-zinc-300 font-mono">20-Candle Range Breakout</b></span>
              <span className="text-white font-mono">Auto-Execution</span>
            </div>
          </div>

          {/* Strategy 5: Arbitrage / Stat-Arb */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3 hover:border-zinc-700 transition-all sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-lg">⚡</span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Arbitrage / Stat-Arb</h3>
                  <span className="text-[10px] text-zinc-500 font-sans">Quantitative Stat-Arb Suite</span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-zinc-900 text-white border border-zinc-800">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Exploits fleeting price discrepancies and statistical spread z-score divergence across correlated stocks for market-neutral gains.
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-500 border-t border-zinc-900/60 font-sans">
              <span>Rule: <b className="text-zinc-300 font-mono">Stat-Arb Z-Score Divergence</b></span>
              <span className="text-white font-mono">Auto-Execution</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Open Positions Section */}
      <div className="space-y-4 font-sans">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
            <Zap className="h-5 w-5 text-white" /> Active Scalp Positions
          </h2>
          <span className="text-xs font-mono text-zinc-500">{positions.length} Open Positions</span>
        </div>

        {positions.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center space-y-2">
            <Layers className="mx-auto h-8 w-8 text-zinc-600" />
            <h3 className="text-sm font-bold text-white font-mono">No Active Scalp Positions</h3>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto">
              The 1-minute engine scans for VWAP dips with 1.5x volume spikes across Nifty Smallcap 50. Click "Run 1m Scalp Tick" to execute a scan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 font-mono">
            {positions.map((pos) => (
              <div key={pos.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-white text-black mr-2">
                      {pos.side}
                    </span>
                    <span className="text-lg font-extrabold text-white">{pos.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block font-sans">Quantity</span>
                    <span className="font-bold text-white">{pos.quantity} shares</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-black rounded-xl p-3 border border-zinc-900">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-sans block">Entry Price</span>
                    <span className="font-bold text-white">₹{pos.entry_price}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-sans block">Take Profit (+0.60%)</span>
                    <span className="font-bold text-white">₹{pos.tp_price}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-sans block">Stop Loss (-0.30%)</span>
                    <span className="font-bold text-white">₹{pos.sl_price}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 font-sans text-xs">
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono">
                    {pos.break_even_triggered ? 'Break-Even Trailing Active' : 'Standard SL'}
                  </span>
                  <span className="text-[11px] text-zinc-500">Opened: {new Date(pos.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
