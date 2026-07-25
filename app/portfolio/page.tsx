'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  PieChart,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = async () => {
    try {
      const res = await fetch('/api/holdings');
      if (!res.ok) throw new Error('Failed to fetch portfolio holdings');
      const data = await res.json();
      setHoldings(data);
    } catch (err: any) {
      setError(err.message || 'Error loading holdings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHoldings();
  };

  // Calculate totals
  const totalInvestment = holdings.reduce((sum, h) => sum + (h.quantity * h.avg_buy_price), 0);
  const totalCurrentValue = holdings.reduce((sum, h) => {
    const currentPrice = h.currentPrice || h.avg_buy_price || 0;
    return sum + (h.quantity * currentPrice);
  }, 0);
  const totalPnL = totalCurrentValue - totalInvestment;
  const totalPnLPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;
  const isOverallPositive = totalPnL >= 0;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading portfolio positions...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Briefcase className="h-7 w-7 text-indigo-400" />
            Portfolio Holdings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time open positions held by Autopaisa trading engine
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Prices'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 text-xs text-rose-300">
          Error: {error}
        </div>
      )}

      {/* Portfolio Summary Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
        {/* Total Current Value */}
        <div className="glass-card rounded-2xl p-5">
          <span className="text-xs font-medium text-slate-400">Total Portfolio Value</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            ₹{totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Current market worth of positions</p>
        </div>

        {/* Invested Capital */}
        <div className="glass-card rounded-2xl p-5">
          <span className="text-xs font-medium text-slate-400">Total Capital Invested</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-300 mt-2">
            ₹{totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cost basis of open positions</p>
        </div>

        {/* Unrealized P&L */}
        <div className="glass-card rounded-2xl p-5">
          <span className="text-xs font-medium text-slate-400">Total Unrealized P&L</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <p className={`text-2xl sm:text-3xl font-extrabold ${isOverallPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isOverallPositive ? `+₹${totalPnL.toFixed(2)}` : `-₹${Math.abs(totalPnL).toFixed(2)}`}
            </p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isOverallPositive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}>
              {isOverallPositive ? `+${totalPnLPercent.toFixed(2)}%` : `${totalPnLPercent.toFixed(2)}%`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Unrealized gains or losses across holdings</p>
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-slate-800">
            <Briefcase className="h-8 w-8 text-slate-600" />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-bold text-white">No Open Stock Holdings</h3>
            <p className="mt-1 text-xs text-slate-400">
              Autopaisa will automatically trigger BUY trades during Indian market hours (09:15 – 15:30 IST) when a stock meets SMA20/50 crossover & RSI14 criteria.
            </p>
          </div>
          <Link
            href="/activity"
            className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-all"
          >
            <span>Check Bot Signal Activity</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="space-y-4 md:hidden">
            {holdings.map((holding: any) => {
              const currentPrice = holding.currentPrice || holding.avg_buy_price || 0;
              const value = holding.quantity * currentPrice;
              const pnl = value - (holding.quantity * holding.avg_buy_price);
              const pnlPercent = holding.quantity * holding.avg_buy_price > 0 ?
                (pnl / (holding.quantity * holding.avg_buy_price)) * 100 : 0;
              const isPositive = pnl >= 0;

              return (
                <div key={holding.symbol} className="glass-card rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-base text-white">{holding.symbol}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {holding.quantity} Shares
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      isPositive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}>
                      {isPositive ? `+${pnlPercent.toFixed(2)}%` : `${pnlPercent.toFixed(2)}%`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Avg Buy Price</span>
                      <span className="font-semibold text-slate-200">₹{holding.avg_buy_price?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Current Live Price</span>
                      <span className="font-semibold text-slate-200">₹{currentPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Investment</span>
                      <span className="font-semibold text-slate-200">₹{(holding.quantity * holding.avg_buy_price).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Current Value</span>
                      <span className="font-bold text-white">₹{value.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Unrealized P&L</span>
                    <span className={`font-extrabold text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-slate-800/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Symbol</th>
                  <th className="py-4 px-6 text-right">Quantity</th>
                  <th className="py-4 px-6 text-right">Avg Buy Price</th>
                  <th className="py-4 px-6 text-right">Current Price</th>
                  <th className="py-4 px-6 text-right">Position Value</th>
                  <th className="py-4 px-6 text-right">Unrealized P&L</th>
                  <th className="py-4 px-6 text-right">Return (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {holdings.map((holding: any) => {
                  const currentPrice = holding.currentPrice || holding.avg_buy_price || 0;
                  const value = holding.quantity * currentPrice;
                  const pnl = value - (holding.quantity * holding.avg_buy_price);
                  const pnlPercent = holding.quantity * holding.avg_buy_price > 0 ?
                    (pnl / (holding.quantity * holding.avg_buy_price)) * 100 : 0;
                  const isPositive = pnl >= 0;

                  return (
                    <tr key={holding.symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-white flex items-center space-x-2">
                        <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono text-xs">
                          {holding.symbol.substring(0, 2)}
                        </div>
                        <span>{holding.symbol}</span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium">{holding.quantity}</td>
                      <td className="py-4 px-6 text-right font-mono">₹{holding.avg_buy_price?.toFixed(2) ?? '0.00'}</td>
                      <td className="py-4 px-6 text-right font-mono text-slate-100">₹{currentPrice.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right font-mono font-semibold text-white">₹{value.toFixed(2)}</td>
                      <td className={`py-4 px-6 text-right font-mono font-extrabold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isPositive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}>
                          {isPositive ? `+${pnlPercent.toFixed(2)}%` : `${pnlPercent.toFixed(2)}%`}
                        </span>
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