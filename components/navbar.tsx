'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Wallet,
  Bot,
  CircleDot,
  Zap,
  Building2
} from 'lucide-react';

const navItems = [
  { href: '/scalper', label: 'Scalper Bot ⚡', icon: Zap },
  { href: '/company', label: 'Team 🏢', icon: Building2 },
];

export function Navbar() {
  const pathname = usePathname();
  const [balance, setBalance] = useState<number | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);

  useEffect(() => {
    // Fetch scalper wallet balance (unified ₹1 Cr capital pool)
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/scalper/wallet');
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balance || 10000000);
        }
      } catch (err) {
        console.error('Error fetching navbar balance:', err);
      }
    };
    fetchBalance();

    // Market status check (IST time: 09:15 - 15:30, Mon-Fri)
    const checkMarket = () => {
      const now = new Date();
      const istDateStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const istDate = new Date(istDateStr);
      const day = istDate.getDay();
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
      {/* Black and White Sleek Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black p-0.5 shadow-md transition-transform group-hover:scale-105">
                <Bot className="h-5 w-5 text-black" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Auto<span className="text-zinc-400">Paisa</span>
                </span>
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase font-mono -mt-1">
                  Quant Firm
                </span>
              </div>
            </Link>

            {/* NSE Market Status Pill */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono border border-zinc-800 bg-zinc-950 text-zinc-300">
              <CircleDot className={`h-3 w-3 ${isMarketOpen ? 'text-white animate-pulse' : 'text-zinc-500'}`} />
              <span>{isMarketOpen ? 'NSE Market Open' : 'NSE Closed'}</span>
            </div>
          </div>

          {/* Right Header Controls: Balance & 2 Navigation Items */}
          <div className="flex items-center space-x-4">
            {/* Quick Balance Chip (Unified ₹1 Cr Portfolio) */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-mono font-bold text-white shadow-sm">
              <Wallet className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                {balance !== null
                  ? `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '₹10,000,000.00'}
              </span>
            </div>

            {/* Desktop Navigation Links (Only Scalper & Team) */}
            <nav className="hidden md:flex items-center space-x-1 border-l border-zinc-800 pl-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      isActive
                        ? 'text-black bg-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Only Scalper & Team) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-black md:hidden px-4 pb-safe">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 w-full py-1 text-xs font-bold transition-all ${
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-zinc-800 border border-zinc-700' : ''}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] tracking-tight font-mono">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
