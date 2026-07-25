'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  History,
  ArrowRightLeft,
  Activity,
  Wallet,
  Bot,
  CircleDot
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/trades', label: 'Trades', icon: History },
  { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
];

export function Navbar() {
  const pathname = usePathname();
  const [balance, setBalance] = useState<number | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);

  useEffect(() => {
    // Fetch wallet balance
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/wallet');
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balance);
        }
      } catch (err) {
        console.error('Error fetching navbar balance:', err);
      }
    };
    fetchBalance();

    // Market status check (IST time: 09:15 - 15:30, Mon-Fri)
    const checkMarket = () => {
      const now = new Date();
      // Parse IST hours and minutes
      const istDateStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const istDate = new Date(istDateStr);
      const day = istDate.getDay(); // 0 is Sunday, 6 is Saturday
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();

      const totalMinutes = hours * 60 + minutes;
      const openMinutes = 9 * 60 + 15;
      const closeMinutes = 15 * 60 + 30;

      const isWeekday = day >= 1 && day <= 5;
      const isOpen = isWeekday && totalMinutes >= openMinutes && totalMinutes <= closeMinutes;
      setIsMarketOpen(isOpen);
    };

    checkMarket();
    const interval = setInterval(checkMarket, 10000);
    return () => clearInterval(interval);
  }, [pathname]);

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                  <Bot className="h-5 w-5 text-indigo-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Paisa<span className="text-indigo-400">Bot</span>
                </span>
                <span className="text-[10px] tracking-wider text-slate-400 uppercase font-medium -mt-1">
                  Paper Trader
                </span>
              </div>
            </Link>

            {/* NSE Market Status Pill */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border border-slate-800 bg-slate-900/60 text-slate-300">
              <CircleDot className={`h-3 w-3 ${isMarketOpen ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span>{isMarketOpen ? 'NSE Market Open' : 'NSE Closed'}</span>
            </div>
          </div>

          {/* Right Header Controls: Balance & Desktop Nav */}
          <div className="flex items-center space-x-4">
            {/* Quick Balance Chip */}
            <Link
              href="/wallet"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-950/50 hover:border-indigo-500/50 transition-all text-xs font-semibold text-slate-200 shadow-sm shadow-indigo-950/50"
            >
              <Wallet className="h-3.5 w-3.5 text-indigo-400" />
              <span>
                {balance !== null
                  ? `₹${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '₹--'}
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 border-l border-slate-800/80 pl-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                      isActive
                        ? 'text-white bg-slate-800/80 font-semibold border border-slate-700/60 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl md:hidden px-2 pb-safe">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 w-full py-1 text-[11px] font-medium transition-all ${
                  isActive
                    ? 'text-indigo-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-500/15 border border-indigo-500/30' : ''}`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400 stroke-[2.5px]' : 'text-slate-400 stroke-2'}`} />
                </div>
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
