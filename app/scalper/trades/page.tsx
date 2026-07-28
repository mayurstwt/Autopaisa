'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, RefreshCw, Zap, Layers, Activity, TrendingUp, TrendingDown } from 'lucide-react';

export default function ScalperTradesPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/scalper/trades?limit=100');
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
      }
    } catch (err) {
      console.error('Error fetching scalper trades:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrades();
  };

  // Metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.pnl > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const netPnLTotal = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);

  if (loading && trades.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading Scalper Trades History...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Intraday Scalper Space
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <History className="h-7 w-7 text-amber-400" /> Executed Scalp Trades History
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Realized intraday P&L, exit reasons (TP, Break-Even, SL), and win rate metrics.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Trades'}</span>
        </button>
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center space-x-2 border-b border-slate-800/60 pb-3">
        <Link
          href="/scalper"
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
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
          className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5"
        >
          <History className="h-3.5 w-3.5" /> Scalp Trades History
        </Link>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Total Scalp Trades</span>
          <div className="text-2xl font-extrabold text-white">{totalTrades}</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Win Rate</span>
          <div className="text-2xl font-extrabold text-amber-400">{winRate.toFixed(1)}%</div>
          <span className="text-[11px] text-slate-400">{winningTrades} Wins / {totalTrades - winningTrades} Losses & Scratches</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Total Scalp P&L</span>
          <div className={`text-2xl font-extrabold flex items-center gap-1 ${netPnLTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netPnLTotal >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            <span>₹{netPnLTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      {trades.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <History className="h-10 w-10 text-slate-600" />
          <h3 className="text-base font-bold text-white">No Executed Scalp Trades Yet</h3>
          <p className="text-xs text-slate-400 max-w-md">
            As the 1-minute engine opens and closes scalp positions, detailed trade performance will be logged here.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800/80">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Closed At</th>
                <th className="py-4 px-6">Symbol</th>
                <th className="py-4 px-6 text-center">Side</th>
                <th className="py-4 px-6 text-right">Entry Price</th>
                <th className="py-4 px-6 text-right">Exit Price</th>
                <th className="py-4 px-6 text-right">Qty</th>
                <th className="py-4 px-6 text-center">Exit Reason</th>
                <th className="py-4 px-6 text-right">Net P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {trades.map((t: any) => {
                const isProfitable = t.pnl > 0;
                const isScratch = t.exit_reason === 'break_even' || Math.abs(t.pnl) < 1;

                return (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-bold text-white">{t.symbol}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {t.side}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-slate-300">₹{Number(t.entry_price).toFixed(2)}</td>
                    <td className="py-4 px-6 text-right font-mono text-slate-300">₹{Number(t.exit_price).toFixed(2)}</td>
                    <td className="py-4 px-6 text-right font-mono text-slate-300">{t.quantity}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border ${
                        t.exit_reason === 'tp'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : isScratch
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      }`}>
                        {t.exit_reason === 'tp' ? 'TP (+0.20%)' : isScratch ? 'Break-Even' : 'SL (-0.50%)'}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-right font-mono font-bold ${
                      isProfitable ? 'text-emerald-400' : isScratch ? 'text-indigo-300' : 'text-rose-400'
                    }`}>
                      {isProfitable ? '+' : ''}₹{Number(t.pnl).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
