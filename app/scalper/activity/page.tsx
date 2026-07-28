'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, RefreshCw, Zap, Layers, History } from 'lucide-react';

export default function ScalperActivityPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/scalper/signals?limit=100');
      if (res.ok) {
        const data = await res.json();
        setSignals(data);
      }
    } catch (err) {
      console.error('Error fetching scalper signals log:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSignals();
  };

  if (loading && signals.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading 1-Minute Scalper Signals Log...</p>
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
            <Activity className="h-7 w-7 text-amber-400" /> 1-Minute Scalper Activity Log
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time 1-minute VWAP magnet evaluations, Relative Volume ratios (1.5x threshold), and scalp entry triggers.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Activity'}</span>
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
          className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5"
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

      {/* Table */}
      {signals.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Activity className="h-10 w-10 text-slate-600" />
          <h3 className="text-base font-bold text-white">No Scalper Signals Logged Yet</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Click "Run 1m Scalp Tick" on the Dashboard or trigger `/api/scalper/tick` to run a 1-minute VWAP and Volume scan.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800/80">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Time</th>
                <th className="py-4 px-6">Symbol</th>
                <th className="py-4 px-6 text-center">Signal</th>
                <th className="py-4 px-6 text-right">Price</th>
                <th className="py-4 px-6 text-right">VWAP</th>
                <th className="py-4 px-6 text-right">Vol Ratio (Min 1.5x)</th>
                <th className="py-4 px-6 text-center">Acted On</th>
                <th className="py-4 px-6">Analysis Reasoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {signals.map((sig: any) => {
                const isBuy = sig.signal === 'buy';
                const ratio = sig.volume_ratio ? Number(sig.volume_ratio) : 1.0;
                const isHighVolume = ratio >= 1.5;

                return (
                  <tr key={sig.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(sig.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-4 px-6 font-bold text-white">{sig.symbol}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase border ${
                        isBuy ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {sig.signal}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-slate-300">
                      ₹{sig.current_price ? Number(sig.current_price).toFixed(2) : '—'}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-amber-400">
                      ₹{sig.vwap ? Number(sig.vwap).toFixed(2) : '—'}
                    </td>
                    <td className="py-4 px-6 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        isHighVolume ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400'
                      }`}>
                        {ratio.toFixed(2)}x
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        sig.acted_on ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {sig.acted_on ? 'Executed' : 'No'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-300 max-w-[280px]">
                      {sig.reason || 'Intraday VWAP/Volume scan'}
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
