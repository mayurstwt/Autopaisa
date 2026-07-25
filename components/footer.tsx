import { ShieldAlert, Bot } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 py-8 mb-16 md:mb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/50">
          <div className="flex items-center space-x-2">
            <Bot className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-sm text-slate-200">Autopaisa Trading Engine</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">v1.0.0</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <span>NSE Market Hours: Mon-Fri, 09:15 - 15:30 IST</span>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 space-x-3 text-xs text-slate-400">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <strong className="text-slate-300 font-medium">Disclaimer:</strong> Autopaisa is an educational simulation using fake money and real market prices. It is not investment advice and must never be connected to a real brokerage account or real funds.
          </p>
        </div>
      </div>
    </footer>
  );
}
