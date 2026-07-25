'use client';

import { useEffect, useState } from 'react';
import {
  Wallet,
  PlusCircle,
  MinusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [depositLoading, setDepositLoading] = useState<boolean>(false);
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      if (data.balance !== undefined) {
        setBalance(data.balance);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);
    setDepositError(null);
    setDepositSuccess(null);

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositError('Please enter a valid amount greater than ₹0');
      setDepositLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Deposit failed');
      }
      setDepositSuccess(`Successfully added ₹${amount.toLocaleString()} fake cash!`);
      setDepositAmount('');
      setBalance(data.balance);
    } catch (err: any) {
      setDepositError(err.message || 'Deposit failed');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    setWithdrawError(null);
    setWithdrawSuccess(null);

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawError('Please enter a valid amount greater than ₹0');
      setWithdrawLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Withdrawal failed');
      }
      setWithdrawSuccess(`Successfully withdrew ₹${amount.toLocaleString()} fake cash!`);
      setWithdrawAmount('');
      setBalance(data.balance);
    } catch (err: any) {
      setWithdrawError(err.message || 'Withdrawal failed');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const setPresetDeposit = (amt: number) => {
    setDepositAmount(amt.toString());
  };

  const setPresetWithdraw = (amt: number) => {
    setWithdrawAmount(amt.toString());
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <Wallet className="h-7 w-7 text-indigo-400" />
          Virtual Wallet Manager
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Manage your simulated paper trading capital (No real money involved)
        </p>
      </div>

      {/* Hero Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-950 p-6 sm:p-8 border border-indigo-500/30 shadow-2xl shadow-indigo-950/50">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Wallet className="h-48 w-48 text-indigo-400" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
              Autopaisa Simulated Wallet
            </span>
            <span className="flex items-center space-x-1 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Virtual Funds</span>
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400">Available Paper Balance</span>
            <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mt-1">
              ₹{balance !== null ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
            </p>
          </div>

          <div className="pt-2 text-xs text-slate-400 flex items-center space-x-2 border-t border-slate-800/80">
            <Zap className="h-3.5 w-3.5 text-indigo-400" />
            <span>Trades automatically deduct or credit this balance on execution.</span>
          </div>
        </div>
      </div>

      {/* Deposit & Withdraw Forms Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Deposit Card */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Deposit Virtual Cash</h2>
              <p className="text-xs text-slate-400">Add fake money to your trading wallet</p>
            </div>
          </div>

          {depositError && (
            <div className="flex items-center space-x-2 rounded-xl bg-rose-950/40 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{depositError}</span>
            </div>
          )}

          {depositSuccess && (
            <div className="flex items-center space-x-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{depositSuccess}</span>
            </div>
          )}

          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Deposit Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g. 50000"
                disabled={depositLoading}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[10000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPresetDeposit(amt)}
                    className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300 transition-all"
                  >
                    +₹{(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={depositLoading || !depositAmount || parseFloat(depositAmount) <= 0}
              className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{depositLoading ? 'Processing...' : 'Deposit Funds'}</span>
            </button>
          </form>
        </div>

        {/* Withdraw Card */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
              <ArrowUpRight className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Withdraw Virtual Cash</h2>
              <p className="text-xs text-slate-400">Remove fake funds from your wallet</p>
            </div>
          </div>

          {withdrawError && (
            <div className="flex items-center space-x-2 rounded-xl bg-rose-950/40 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{withdrawError}</span>
            </div>
          )}

          {withdrawSuccess && (
            <div className="flex items-center space-x-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{withdrawSuccess}</span>
            </div>
          )}

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Withdrawal Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="e.g. 10000"
                disabled={withdrawLoading}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[5000, 10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPresetWithdraw(amt)}
                    className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300 transition-all"
                  >
                    -₹{(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
              className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:from-rose-500 hover:to-rose-400 transition-all disabled:opacity-50"
            >
              <MinusCircle className="h-4 w-4" />
              <span>{withdrawLoading ? 'Processing...' : 'Withdraw Funds'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}