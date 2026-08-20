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
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-3 bg-black font-mono">
        <div className="h-8 w-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        <p className="text-xs text-zinc-400">Loading 1-Minute Scalper Signals Log...</p>
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
              <Zap className="h-3 w-3 text-white" /> 1m Scan Engine Log
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-7 w-7 text-white" /> 1-Minute Scalper Activity Log
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-sans">
            Real-time 1-minute VWAP magnet evaluations, Relative Volume ratios (&ge; 1.5x threshold), and scalp entry triggers.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Activity'}</span>
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
          className="px-3.5 py-1.5 rounded-xl bg-white text-black font-bold flex items-center gap-1.5 shadow-sm font-mono"
        >
          <Activity className="h-3.5 w-3.5 text-black" /> 1m Activity Log
        </Link>
        <Link
          href="/scalper/trades"
          className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 font-mono"
        >
          <History className="h-3.5 w-3.5" /> Scalp Trades History
        </Link>
      </div>

      {/* Table */}
      {signals.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Activity className="h-10 w-10 text-zinc-600" />
          <h3 className="text-sm font-bold text-white">No Scalper Signals Logged Yet</h3>
          <p className="text-xs text-zinc-400 max-w-md font-sans">
            Click "Run 1m Scalp Tick" on the Dashboard or trigger `/api/scalper/tick` to run a 1-minute VWAP and Volume scan.
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
                  <th className="py-4 px-6 text-center">Signal</th>
                  <th className="py-4 px-6 text-right">Price</th>
                  <th className="py-4 px-6 text-right">VWAP</th>
                  <th className="py-4 px-6 text-right">Vol Ratio (&ge; 1.5x)</th>
                  <th className="py-4 px-6 text-center">Acted On</th>
                  <th className="py-4 px-6">Analysis Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-200">
                {signals.map((sig: any) => {
                  const isBuy = sig.signal === 'buy';
                  const ratio = sig.volume_ratio ? Number(sig.volume_ratio) : 1.0;
                  const isHighVolume = ratio >= 1.5;
                  const formattedDateTime = new Date(sig.created_at).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  });

                  return (
                    <tr key={sig.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-4 px-6 text-xs text-zinc-400 whitespace-nowrap font-mono">
                        {formattedDateTime}
                      </td>
                      <td className="py-4 px-6 font-bold text-white">{sig.symbol}</td>
                      <td className="py-4 px-6 text-zinc-400">{sig.strategy_name || 'Mean Reversion'}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          isBuy ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}>
                          {sig.signal}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-zinc-300">
                        ₹{sig.current_price ? Number(sig.current_price).toFixed(2) : '—'}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-white font-bold">
                        ₹{sig.vwap ? Number(sig.vwap).toFixed(2) : '—'}
                      </td>
                      <td className="py-4 px-6 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          isHighVolume ? 'bg-zinc-900 text-white border border-zinc-700' : 'text-zinc-500'
                        }`}>
                          {ratio.toFixed(2)}x
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          sig.acted_on ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}>
                          {sig.acted_on ? 'Executed' : 'No'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-zinc-300 font-sans max-w-[280px]">
                        {sig.reason || 'Intraday VWAP/Volume scan'}
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
