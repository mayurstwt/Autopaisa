import { ShieldAlert, Bot } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black py-8 mb-16 md:mb-0 text-white font-mono selection:bg-white selection:text-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-zinc-900">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-black font-bold">
              <Bot className="h-3.5 w-3.5 text-black" />
            </div>
            <span className="font-extrabold text-sm text-white font-mono">Autopaisa Quant Engine</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">v2.0.0</span>
          </div>
          <div className="text-xs text-zinc-500 flex items-center space-x-2 font-mono">
            <span>NSE Market Hours: Mon-Fri, 09:15 - 15:30 IST</span>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 space-x-3 text-xs text-zinc-400 font-sans">
          <ShieldAlert className="h-4 w-4 text-white shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <strong className="text-white font-mono font-bold">Disclaimer:</strong> Autopaisa is an educational simulation using fake money and real market prices. It is not investment advice and must never be connected to a real brokerage account or real funds.
          </p>
        </div>
      </div>
    </footer>
  );
}
