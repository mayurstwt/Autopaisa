'use client';

import { useEffect, useState } from 'react';
import {
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Info,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function TradesPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/trades?limit=100');
      if (!res.ok) throw new Error('Failed to fetch executed trades');
      const data = await res.json();
      setTrades(data);
    } catch (err: any) {
      setError(err.message || 'Error loading trade history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrades();
  };

  const toggleExpand = (id: string) => {
    setExpandedTradeId(expandedTradeId === id ? null : id);
  };

  // Metrics summary
  const buyTrades = trades.filter((t) => t.side === 'buy');
  const sellTrades = trades.filter((t) => t.side === 'sell');
  const totalChargesPaid = trades.reduce((sum, t) => sum + Number(t.total_charges || 0), 0);
  const totalRealizedPnL = sellTrades.reduce((sum, t) => sum + Number(t.realized_pnl || 0), 0);
  const isRealizedPositive = totalRealizedPnL >= 0;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading executed trades...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <History className="h-7 w-7 text-indigo-400" />
            Executed Trades
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Realized trade logs with Zerodha/Groww-style fee & tax breakdown
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Trades'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 text-xs text-rose-300">
          Error: {error}
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-5">
        <div className="glass-card rounded-2xl p-5">
          <span className="text-xs font-medium text-slate-400">Total Executed</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{trades.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Completed market orders</p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <span className="text-xs font-medium text-slate-400">Buy Orders</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">{buyTrades.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Acquisitions</p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <span className="text-xs font-medium text-slate-400">Sell Orders</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2">{sellTrades.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Liquidations</p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <span className="text-xs font-medium text-slate-400">Total Realized P&L</span>
          <p className={`text-2xl sm:text-3xl font-extrabold mt-2 ${isRealizedPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isRealizedPositive ? `+₹${totalRealizedPnL.toFixed(2)}` : `-₹${Math.abs(totalRealizedPnL).toFixed(2)}`}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Closed trades profit/loss</p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <span className="text-xs font-medium text-slate-400">Total Charges</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mt-2">
            ₹{totalChargesPaid.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">STT, Brokerage & Taxes</p>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-slate-800">
            <History className="h-8 w-8 text-slate-600" />
          </div>
          <h3 className="text-base font-bold text-white">No Executed Trades Yet</h3>
          <p className="max-w-md text-xs text-slate-400">
            The strategy engine continuously evaluates SMA crossover and RSI signals during market hours. Executed orders will automatically be recorded here.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile View Cards */}
          <div className="space-y-4 md:hidden">
            {trades.map((trade: any) => {
              const isBuy = trade.side === 'buy';
              const netAmount = Number(trade.net_amount ?? trade.amount ?? 0);
              const pnl = trade.realized_pnl !== null && trade.realized_pnl !== undefined ? Number(trade.realized_pnl) : null;
              const isExpanded = expandedTradeId === trade.id;

              return (
                <div key={trade.id} className="glass-card rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 text-xs font-extrabold rounded-lg uppercase ${
                        isBuy ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {trade.side}
                      </span>
                      <span className="font-extrabold text-base text-white">{trade.symbol}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(trade.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Quantity</span>
                      <span className="font-semibold text-slate-200">{trade.quantity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Executed Price</span>
                      <span className="font-semibold text-slate-200">₹{trade.price?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Trade Value</span>
                      <span className="font-semibold text-slate-200">₹{trade.trade_value?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Charges</span>
                      <span className="font-semibold text-indigo-400">₹{trade.total_charges?.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">{isBuy ? 'Net Outflow' : 'Realized P&L'}</span>
                    {isBuy ? (
                      <span className="font-extrabold text-sm text-slate-300">
                        -₹{Math.abs(netAmount).toFixed(2)}
                      </span>
                    ) : (
                      <span className={`font-extrabold text-sm ${pnl !== null && pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pnl !== null ? (pnl >= 0 ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`) : `+₹${netAmount.toFixed(2)}`}
                      </span>
                    )}
                  </div>

                  {trade.reason && (
                    <p className="text-[11px] text-slate-400 bg-slate-900/60 rounded-lg p-2 border border-slate-800/50">
                      <strong className="text-slate-300 font-medium">Signal Logic:</strong> {trade.reason}
                    </p>
                  )}

                  {/* Expandable Fee Breakdown Toggle */}
                  <button
                    onClick={() => toggleExpand(trade.id)}
                    className="w-full pt-1 flex items-center justify-center space-x-1 text-[11px] text-indigo-400 hover:underline"
                  >
                    <span>{isExpanded ? 'Hide Fee Breakdown' : 'View Fee Breakdown'}</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  {isExpanded && (
                    <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-[11px] space-y-1.5 text-slate-300 font-mono">
                      <div className="flex justify-between"><span>Brokerage:</span><span>₹{trade.brokerage?.toFixed(2) ?? '0.00'}</span></div>
                      <div className="flex justify-between"><span>STT:</span><span>₹{trade.stt?.toFixed(2) ?? '0.00'}</span></div>
                      <div className="flex justify-between"><span>NSE Charges:</span><span>₹{trade.exchange_charges?.toFixed(2) ?? '0.00'}</span></div>
                      <div className="flex justify-between"><span>SEBI Fee:</span><span>₹{trade.sebi_charges?.toFixed(2) ?? '0.00'}</span></div>
                      <div className="flex justify-between"><span>Stamp Duty:</span><span>₹{trade.stamp_duty?.toFixed(2) ?? '0.00'}</span></div>
                      <div className="flex justify-between"><span>GST (18%):</span><span>₹{trade.gst?.toFixed(2) ?? '0.00'}</span></div>
                      <div className="flex justify-between border-t border-slate-800 pt-1 font-bold text-indigo-300"><span>Total Fees:</span><span>₹{trade.total_charges?.toFixed(2) ?? '0.00'}</span></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-slate-800/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Symbol</th>
                  <th className="py-4 px-6 text-center">Action</th>
                  <th className="py-4 px-6 text-right">Qty</th>
                  <th className="py-4 px-6 text-right">Price</th>
                  <th className="py-4 px-6 text-right">Trade Value</th>
                  <th className="py-4 px-6 text-right">Charges</th>
                  <th className="py-4 px-6 text-right">Realized P&L / Net</th>
                  <th className="py-4 px-6">Strategy Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {trades.map((trade: any) => {
                  const isBuy = trade.side === 'buy';
                  const netAmount = Number(trade.net_amount ?? trade.amount ?? 0);
                  const pnl = trade.realized_pnl !== null && trade.realized_pnl !== undefined ? Number(trade.realized_pnl) : null;

                  return (
                    <tr key={trade.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(trade.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-bold text-white">{trade.symbol}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase border ${
                          isBuy ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium">{trade.quantity}</td>
                      <td className="py-4 px-6 text-right font-mono">₹{trade.price?.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right font-mono">₹{trade.trade_value?.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right font-mono text-indigo-300">
                        ₹{trade.total_charges?.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-extrabold">
                        {isBuy ? (
                          <span className="text-slate-300">-₹{Math.abs(netAmount).toFixed(2)}</span>
                        ) : pnl !== null ? (
                          <div>
                            <span className={pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {pnl >= 0 ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-sans font-normal">
                              Net Cash: +₹{netAmount.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-emerald-400">+₹{netAmount.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400 max-w-[220px] truncate" title={trade.reason || ''}>
                        {trade.reason || 'Technical indicator signal'}
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