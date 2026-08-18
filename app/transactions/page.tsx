'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  DollarSign,
  Filter,
  RefreshCw
} from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdraw' | 'trade_buy' | 'trade_sell'>('all');
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchTransactions = async (reset = false) => {
    const currentPage = reset ? 0 : page;
    if (reset) setPage(0);
    setLoading(true);
    setError(null);
    try {
      const offset = currentPage * limit;
      let url = `/api/transactions?limit=${limit}&offset=${offset}`;
      if (filter !== 'all') {
        url += `&type=${filter}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      setTransactions((prev) => (reset ? data : [...prev, ...data]));
    } catch (err: any) {
      setError(err.message || 'Error loading transaction logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(true);
  }, [filter]);

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  useEffect(() => {
    if (page > 0) {
      fetchTransactions(false);
    }
  }, [page]);

  const formatAmount = (amount: number) => {
    const abs = Math.abs(amount);
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}₹${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTxDetails = (type: string) => {
    switch (type) {
      case 'deposit':
        return {
          label: 'Wallet Deposit',
          icon: ArrowDownLeft,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20',
        };
      case 'withdraw':
        return {
          label: 'Wallet Withdrawal',
          icon: ArrowUpRight,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/20',
        };
      case 'trade_buy':
        return {
          label: 'Stock Buy Execution',
          icon: ShoppingCart,
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/10 border-indigo-500/20',
        };
      case 'trade_sell':
        return {
          label: 'Stock Sell (Cash Credited)',
          icon: DollarSign,
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/20',
        };
      default:
        return {
          label: type,
          icon: ArrowRightLeft,
          color: 'text-slate-400',
          bg: 'bg-slate-800 border-slate-700',
        };
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <ArrowRightLeft className="h-7 w-7 text-indigo-400" />
            Transaction History
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Complete wallet ledger for deposits, withdrawals, and trade debits/credits
          </p>
        </div>

        <button
          onClick={() => fetchTransactions(true)}
          disabled={loading}
          className="inline-flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card rounded-2xl p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium px-2 flex items-center gap-1">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </span>

        {(
          [
            { id: 'all', label: 'All Transactions' },
            { id: 'deposit', label: 'Deposits' },
            { id: 'withdraw', label: 'Withdrawals' },
            { id: 'trade_buy', label: 'Buy Trades' },
            { id: 'trade_sell', label: 'Sell Trades' },
          ] as const
        ).map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 text-xs text-rose-300">
          Error: {error}
        </div>
      )}

      {loading && transactions.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-3">
          <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Fetching wallet ledger...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <ArrowRightLeft className="h-10 w-10 text-slate-600" />
          <h3 className="text-base font-bold text-white">No Transactions Found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            No transaction ledger entries match the selected filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx: any) => {
            const details = getTxDetails(tx.type);
            const Icon = details.icon;
            const isCredit = tx.amount >= 0;

            return (
              <div
                key={tx.id}
                className="glass-card rounded-2xl p-4 sm:p-5 flex items-center justify-between hover:border-slate-700/80 transition-all"
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${details.bg}`}>
                    <Icon className={`h-5 w-5 ${details.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{details.label}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(tx.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-mono font-extrabold text-sm sm:text-base ${
                    tx.type === 'deposit' ? 'text-emerald-400' :
                    tx.type === 'trade_sell' ? 'text-cyan-400' : 'text-rose-400'
                  }`}>
                    {formatAmount(tx.amount)}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Balance: ₹{Number(tx.balance_after).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })}

          {!loading && transactions.length % limit === 0 && transactions.length > 0 && (
            <div className="pt-4 text-center">
              <button
                onClick={loadMore}
                className="rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-2.5 text-xs font-semibold text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 transition-all"
              >
                Load More Transactions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}