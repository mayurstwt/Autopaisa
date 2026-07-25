'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

export default function ActivityPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/signals?limit=100');
      if (!res.ok) throw new Error('Failed to fetch activity signals');
      const data = await res.json();
      setSignals(data);
    } catch (err: any) {
      setError(err.message || 'Error loading activity log');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSignals();
  };

  if (loading && signals.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading strategy engine activity log...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="h-7 w-7 text-indigo-400" />
            Strategy Activity Log
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time evaluation log for SMA20/50 crossovers, RSI14 indicators, and trading decisions
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Activity'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 text-xs text-rose-300">
          Error: {error}
        </div>
      )}

      {signals.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Activity className="h-10 w-10 text-slate-600" />
          <h3 className="text-base font-bold text-white">No Strategy Signals Logged Yet</h3>
          <p className="text-xs text-slate-400 max-w-md">
            The worker engine evaluates signals across the 20 NIFTY 50 watchlist stocks every 5 minutes during market hours. Logs will populate here.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="space-y-4 md:hidden">
            {signals.map((signal: any) => {
              const sigType = signal.signal?.toLowerCase();
              const isBuy = sigType === 'buy';
              const isSell = sigType === 'sell';

              return (
                <div key={signal.id} className="glass-card rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 text-xs font-extrabold rounded-lg uppercase ${
                        isBuy ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        isSell ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {signal.signal}
                      </span>
                      <span className="font-extrabold text-base text-white">{signal.symbol}</span>
                    </div>

                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      signal.acted_on
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {signal.acted_on ? 'Executed' : 'Ignored'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">SMA20</span>
                      <span className="text-slate-200 font-bold">{signal.sma20 ? Number(signal.sma20).toFixed(2) : '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">SMA50</span>
                      <span className="text-slate-200 font-bold">{signal.sma50 ? Number(signal.sma50).toFixed(2) : '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">RSI14</span>
                      <span className="text-indigo-400 font-bold">{signal.rsi14 ? Number(signal.rsi14).toFixed(2) : '—'}</span>
                    </div>
                  </div>

                  {signal.reason && (
                    <p className="text-xs text-slate-300 bg-slate-900/40 rounded-lg p-2.5 border border-slate-800/40">
                      <strong className="text-indigo-400 font-medium">Analysis:</strong> {signal.reason}
                    </p>
                  )}

                  <p className="text-[10px] text-slate-400 text-right">
                    {new Date(signal.created_at).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-slate-800/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Time</th>
                  <th className="py-4 px-6">Symbol</th>
                  <th className="py-4 px-6 text-center">Signal</th>
                  <th className="py-4 px-6 text-right">SMA20</th>
                  <th className="py-4 px-6 text-right">SMA50</th>
                  <th className="py-4 px-6 text-right">RSI14</th>
                  <th className="py-4 px-6 text-center">Executed</th>
                  <th className="py-4 px-6">Analysis Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {signals.map((signal: any) => {
                  const sigType = signal.signal?.toLowerCase();
                  const isBuy = sigType === 'buy';
                  const isSell = sigType === 'sell';

                  return (
                    <tr key={signal.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(signal.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-bold text-white">{signal.symbol}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase border ${
                          isBuy ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                          isSell ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {signal.signal}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-300">
                        {signal.sma20 ? Number(signal.sma20).toFixed(2) : '—'}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-300">
                        {signal.sma50 ? Number(signal.sma50).toFixed(2) : '—'}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-semibold text-indigo-400">
                        {signal.rsi14 ? Number(signal.rsi14).toFixed(2) : '—'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          signal.acted_on
                            ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {signal.acted_on ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-300 max-w-[280px]">
                        {signal.reason || 'Routine indicator scan'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}