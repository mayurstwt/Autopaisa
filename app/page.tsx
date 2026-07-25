'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Activity,
  ArrowUpRight,
  PlusCircle,
  RefreshCw,
  Zap,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const [balance, setBalance] = useState<number | null>(null);
  const [holdingsValue, setHoldingsValue] = useState<number>(0);
  const [holdingsCount, setHoldingsCount] = useState<number>(0);
  const [holdingsList, setHoldingsList] = useState<any[]>([]);
  const [todayPnL, setTodayPnL] = useState<number | null>(null);
  const [recentSignals, setRecentSignals] = useState<any[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<Array<{ date: string; balance: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch current balance
      const balanceRes = await fetch('/api/wallet');
      if (!balanceRes.ok) throw new Error('Failed to fetch wallet balance');
      const balanceData = await balanceRes.json();
      setBalance(balanceData.balance);

      // 2. Fetch holdings to calculate total holdings value
      const holdingsRes = await fetch('/api/holdings');
      if (holdingsRes.ok) {
        const holdingsData = await holdingsRes.json();
        setHoldingsList(holdingsData);
        setHoldingsCount(holdingsData.length);
        const totalHoldingsVal = holdingsData.reduce((sum: number, h: any) => {
          const price = h.currentPrice || h.avg_buy_price || 0;
          return sum + (h.quantity * price);
        }, 0);
        setHoldingsValue(totalHoldingsVal);
      }

      // 3. Fetch transactions for history & today's P&L
      const transactionsRes = await fetch('/api/transactions?limit=1000');
      if (!transactionsRes.ok) throw new Error('Failed to fetch transactions');
      const transactions = await transactionsRes.json();

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTransactions = transactions
        .map((t: any) => ({
          ...t,
          date: new Date(t.created_at)
        }))
        .filter((t: any) => t.date >= thirtyDaysAgo);

      // Calculate Today's P&L
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTransactions = recentTransactions.filter((t: any) => {
        const tDate = new Date(t.created_at);
        tDate.setHours(0, 0, 0, 0);
        return tDate.getTime() === today.getTime() && (t.type === 'trade_buy' || t.type === 'trade_sell');
      });

      const todayPnLValue = todayTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      setTodayPnL(todayPnLValue);

      // Build daily balance history chart
      const dailyBalances: Map<string, number> = new Map();
      recentTransactions
        .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
        .forEach((t: any) => {
          const dateStr = t.date.toISOString().split('T')[0];
          dailyBalances.set(dateStr, Number(t.balance_after));
        });

      const historyArray: { date: string; balance: number }[] = Array.from(dailyBalances.entries())
        .map(([date, balance]) => ({ date, balance }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // If history is small, add current balance as latest point
      if (historyArray.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!dailyBalances.has(todayStr) && balanceData.balance) {
          historyArray.push({ date: todayStr, balance: balanceData.balance });
        }
      }
      setBalanceHistory(historyArray);

      // 4. Fetch recent strategy signals
      const signalsRes = await fetch('/api/signals?limit=5');
      if (signalsRes.ok) {
        const signalsData = await signalsRes.json();
        setRecentSignals(signalsData);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const totalPortfolioValue = (balance ?? 0) + holdingsValue;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute h-full w-full rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Zap className="h-5 w-5 text-indigo-400" />
        </div>
        <p className="text-sm font-medium text-slate-400">Syncing live portfolio data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-6 text-center text-rose-300">
          <p className="font-semibold text-lg">Failed to load dashboard</p>
          <p className="mt-1 text-sm text-rose-400/80">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Banner / Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Dashboard
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20">
              <Zap className="h-3 w-3 text-indigo-400" />
              Bot Active
            </span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time NIFTY 50 paper trading overview and strategy performance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <Link
            href="/wallet"
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Cash</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Portfolio Value */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PieChart className="h-16 w-16 text-indigo-400" />
          </div>
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
            <PieChart className="h-4 w-4 text-indigo-400" />
            <span>Total Portfolio Value</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ₹{totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center space-x-1">
            <span>Cash + Active Stock Holdings</span>
          </p>
        </div>

        {/* Available Cash Balance */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="h-16 w-16 text-cyan-400" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
              <Wallet className="h-4 w-4 text-cyan-400" />
              <span>Available Wallet Cash</span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-cyan-400 tracking-tight">
              ₹{(balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Ready for trade signals</span>
            <Link href="/wallet" className="text-indigo-400 hover:underline flex items-center text-[10px]">
              Manage <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Today's Realized P&L */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {todayPnL !== null && todayPnL >= 0 ? (
              <TrendingUp className="h-16 w-16 text-emerald-400" />
            ) : (
              <TrendingDown className="h-16 w-16 text-rose-400" />
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
            {todayPnL !== null && todayPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-400" />
            )}
            <span>Today's Realized P&L</span>
          </div>
          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              todayPnL !== null && todayPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {todayPnL !== null ? (
                `${todayPnL >= 0 ? '+' : ''}₹${todayPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ) : (
                '₹0.00'
              )}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Executed trade profits & losses today
          </p>
        </div>

        {/* Active Positions */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers className="h-16 w-16 text-violet-400" />
          </div>
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
            <Layers className="h-4 w-4 text-violet-400" />
            <span>Open Holdings</span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {holdingsCount}
            </p>
            <span className="text-xs text-slate-400">/ 5 max positions</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Holdings value: ₹{holdingsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <Link href="/portfolio" className="text-indigo-400 hover:underline flex items-center text-[10px]">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Portfolio Balance Growth
            </h2>
            <p className="text-xs text-slate-400">Last 30 days wallet balance history</p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>30 Day Trend</span>
            </span>
          </div>
        </div>

        {balanceHistory.length > 0 ? (
          <div className="h-[300px] sm:h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1e293b' }}
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1e293b' }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length && label) {
                      const val = payload[0].value as number;
                      return (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-xl backdrop-blur text-xs">
                          <p className="font-semibold text-slate-400">
                            {new Date(label).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="mt-1 text-base font-extrabold text-indigo-400">
                            ₹{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#balanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[250px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-400">
            <Activity className="h-8 w-8 text-slate-600 mb-2" />
            <p className="font-medium text-sm text-slate-300">No balance history recorded yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Deposit fake funds or execute trades to start generating performance chart data.
            </p>
          </div>
        )}
      </div>

      {/* Dashboard Bottom Widgets Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Active Holdings Preview */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-violet-400" />
                Current Stock Holdings ({holdingsList.length})
              </h2>
              <Link href="/portfolio" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
                <span>View Full Portfolio</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {holdingsList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800/80 p-6 text-center text-slate-400">
                <p className="text-xs">No active open positions currently.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  The Autopaisa worker automatically buys NIFTY 50 stocks during market hours based on SMA20/50 crossover & RSI14 signals.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {holdingsList.slice(0, 3).map((holding: any) => {
                  const currentPrice = holding.currentPrice || holding.avg_buy_price || 0;
                  const value = holding.quantity * currentPrice;
                  const pnl = value - (holding.quantity * holding.avg_buy_price);
                  const isPositive = pnl >= 0;

                  return (
                    <div key={holding.symbol} className="flex items-center justify-between rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 hover:border-slate-700 transition-all">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-white">{holding.symbol}</span>
                          <span className="text-xs text-slate-400">Qty: {holding.quantity}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Avg: ₹{holding.avg_buy_price?.toFixed(2)} | Current: ₹{currentPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-white">₹{value.toFixed(2)}</p>
                        <p className={`text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Strategy Signals Preview */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-400" />
                Recent Strategy Signals
              </h2>
              <Link href="/activity" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
                <span>View All Activity</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentSignals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800/80 p-6 text-center text-slate-400">
                <p className="text-xs">No strategy signals recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Worker logs and signal evaluations will appear here as market ticks run.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSignals.slice(0, 3).map((sig: any) => {
                  const sigType = sig.signal?.toLowerCase();
                  const isBuy = sigType === 'buy';
                  const isSell = sigType === 'sell';

                  return (
                    <div key={sig.id} className="flex items-center justify-between rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase ${
                          isBuy ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          isSell ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {sig.signal}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-white">{sig.symbol}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[220px]">
                            {sig.reason || 'Routine signal check'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          sig.acted_on ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {sig.acted_on ? 'Executed' : 'Ignored'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(sig.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}