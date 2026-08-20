'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, RefreshCw, Zap, Layers, Activity } from 'lucide-react';

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
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-3 bg-black font-mono">
        <div className="h-8 w-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        <p className="text-xs text-zinc-400">Loading Scalper Executed Trades History...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8 bg-black text-white font-mono selection:bg-white selection:text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1">
              <Zap className="h-3 w-3 text-white" /> Executed Ledger
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <History className="h-7 w-7 text-white" /> Executed Scalp Trades History
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-sans">
            Realized intraday P&L, exit reasons (TP, Break-Even, SL, EOD Squareoff), and win rate metrics.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Trades'}</span>
        </button>
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3 font-sans text-xs">
        <Link
          href="/scalper"
          className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 font-mono"
        >
          <Layers className="h-3.5 w-3.5" /> Dashboard & Positions
        </Link>
        <Link
          href="/scalper/activity"
          className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 font-mono"
        >
          <Activity className="h-3.5 w-3.5" /> 1m Activity Log
        </Link>
        <Link
          href="/scalper/trades"
          className="px-3.5 py-1.5 rounded-xl bg-white text-black font-bold flex items-center gap-1.5 shadow-sm font-mono"
        >
          <History className="h-3.5 w-3.5 text-black" /> Scalp Trades History
        </Link>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950 space-y-1">
          <span className="text-xs text-zinc-400 font-sans">Total Executed Trades</span>
          <div className="text-2xl font-extrabold text-white">{totalTrades}</div>
        </div>

        <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950 space-y-1">
          <span className="text-xs text-zinc-400 font-sans">Win Rate</span>
          <div className="text-2xl font-extrabold text-white">{winRate.toFixed(1)}%</div>
          <span className="text-[11px] text-zinc-500 font-sans">{winningTrades} Wins / {totalTrades - winningTrades} Losses & Scratches</span>
        </div>

        <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950 space-y-1">
          <span className="text-xs text-zinc-400 font-sans">Total Realized Scalp P&L</span>
          <div className="text-2xl font-extrabold text-white">
            {netPnLTotal >= 0 ? '+' : ''}₹{netPnLTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Trades Table */}
      {trades.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <History className="h-10 w-10 text-zinc-600" />
          <h3 className="text-sm font-bold text-white">No Executed Scalp Trades Yet</h3>
          <p className="text-xs text-zinc-400 max-w-md font-sans">
            As the 1-minute engine opens and closes scalp positions, detailed trade performance will be logged here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-4 px-6">Date &amp; Time</th>
                  <th className="py-4 px-6">Symbol</th>
                  <th className="py-4 px-6">Strategy</th>
                  <th className="py-4 px-6 text-center">Side</th>
                  <th className="py-4 px-6 text-right">Entry Price</th>
                  <th className="py-4 px-6 text-right">Exit Price</th>
                  <th className="py-4 px-6 text-right">Qty</th>
                  <th className="py-4 px-6 text-center">Exit Reason</th>
                  <th className="py-4 px-6 text-right">Net P&amp;L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-200">
                {trades.map((t: any) => {
                  const isProfitable = t.pnl > 0;
                  const formattedDateTime = new Date(t.created_at).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  });
                  return (
                    <tr key={t.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-4 px-6 text-xs text-zinc-400 whitespace-nowrap font-mono">
                        {formattedDateTime}
                      </td>
                      <td className="py-4 px-6 font-bold text-white">{t.symbol}</td>
                      <td className="py-4 px-6 text-zinc-400">{t.strategy_name || 'Mean Reversion'}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white text-black">
                          {t.side}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-zinc-300">₹{Number(t.entry_price).toFixed(2)}</td>
                      <td className="py-4 px-6 text-right font-mono text-zinc-300">₹{Number(t.exit_price).toFixed(2)}</td>
                      <td className="py-4 px-6 text-right font-mono text-zinc-300">{t.quantity}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-800 uppercase">
                          {t.exit_reason === 'tp' ? 'TP (+0.60%)' : t.exit_reason === 'sl' ? 'SL (-0.30%)' : 'EOD Squareoff'}
                        </span>
                      </td>
                      <td className={`py-4 px-6 text-right font-mono font-bold ${
                        isProfitable ? 'text-white font-extrabold' : 'text-zinc-400'
                      }`}>
                        {isProfitable ? '+' : ''}₹{Number(t.pnl).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
