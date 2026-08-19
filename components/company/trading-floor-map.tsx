'use client';

import React from 'react';
import {
  TrendingUp,
  Zap,
  ShieldCheck,
  Building2,
  Send,
  Play,
  RotateCcw,
  Activity,
  CheckCircle2,
  Monitor,
  Cpu
} from 'lucide-react';

interface TradingFloorMapProps {
  team: any[];
  onRunSwingScan?: () => void;
  onRunScalpTick?: () => void;
  onSendReport?: () => void;
  onResetCircuitBreaker?: () => void;
  onSelectEmployee?: (employee: any) => void;
  actionLoading?: string | null;
}

export function TradingFloorMap({
  team,
  onRunSwingScan,
  onRunScalpTick,
  onSendReport,
  onResetCircuitBreaker,
  onSelectEmployee,
  actionLoading,
}: TradingFloorMapProps) {
  const empMap = (team || []).reduce((acc: any, emp: any) => {
    acc[emp.id] = emp;
    return acc;
  }, {});

  const vikram = empMap['vikram'] || {};
  const riya = empMap['riya'] || {};
  const dev = empMap['dev'] || {};
  const ananya = empMap['ananya'] || {};
  const kabir = empMap['kabir'] || {};

  return (
    <div className="relative w-full rounded-3xl border border-zinc-800 bg-black p-4 sm:p-6 lg:p-8 overflow-hidden shadow-2xl font-mono text-white selection:bg-white selection:text-black">
      {/* Blueprint Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Top Header Badge & Floor Status */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5 mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Top-Down Architectural Floor Plan
              </span>
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Autopaisa Quant Trading Floor</h2>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs text-zinc-400 bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800">
          <span className="flex items-center gap-1.5 text-white font-semibold">
            <span className="h-2 w-2 rounded-full bg-white" /> 5 Desks Active
          </span>
          <span className="text-zinc-600">|</span>
          <span>NSE Realtime Telemetry</span>
        </div>
      </div>

      {/* TOP-DOWN ARCHITECTURAL FLOOR PLAN CONTAINER */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT WING: TRADING DESKS (Vikram & Riya) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-white" /> Active Execution Wing
            </span>
            <span className="text-[10px] text-zinc-500">Section A1-A2</span>
          </div>

          {/* DESK 1: SWING TRADING DESK (Analyst Vikram) */}
          <div 
            onClick={() => onSelectEmployee?.(vikram)}
            className="group relative rounded-2xl border border-zinc-800 bg-zinc-950 p-5 hover:border-zinc-600 transition-all cursor-pointer shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-2xl group-hover:scale-110 transition-transform">
                  📈
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-white text-base">Analyst Vikram</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                      Swing Desk
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans">Senior Delivery Analyst • Nifty 50 SMA20/50</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800 text-[11px]">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                <span className="font-medium text-white">Active Scan</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 bg-black p-3.5 rounded-xl border border-zinc-900 text-xs">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-zinc-400" />
                <div>
                  <span className="text-[10px] text-zinc-500 block font-sans">Screen</span>
                  <span className="text-white font-bold">NIFTY 50 Charts</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-zinc-400" />
                <div>
                  <span className="text-[10px] text-zinc-500 block font-sans">Signals</span>
                  <span className="text-white font-bold">{vikram.stats?.totalSignals || 0} Evaluated</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-zinc-400" />
                <div>
                  <span className="text-[10px] text-zinc-500 block font-sans">Delivery P&L</span>
                  <span className="text-white font-bold">₹{(vikram.stats?.totalPnL || 0).toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-zinc-500 font-sans flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white" /> Click desk for full telemetry
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRunSwingScan?.();
                }}
                disabled={actionLoading === 'swing'}
                className="inline-flex items-center space-x-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-md"
              >
                <Play className={`h-3 w-3 fill-black ${actionLoading === 'swing' ? 'animate-spin' : ''}`} />
                <span>{actionLoading === 'swing' ? 'Scanning...' : 'Run Swing Scan'}</span>
              </button>
            </div>
          </div>

          {/* DESK 2: INTRADAY SCALPING DESK (Scalper Riya) */}
          <div 
            onClick={() => onSelectEmployee?.(riya)}
            className="group relative rounded-2xl border border-zinc-800 bg-zinc-950 p-5 hover:border-zinc-600 transition-all cursor-pointer shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-2xl group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-white text-base">Scalper Riya</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                      HFT Scalp Desk
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans">Intraday Specialist • Smallcap 1m VWAP & Vol</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800 text-[11px]">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                <span className="font-medium text-white">1m Tick Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 bg-black p-3.5 rounded-xl border border-zinc-900 text-xs">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-zinc-400" />
                <div>
                  <span className="text-[10px] text-zinc-500 block font-sans">Filter</span>
                  <span className="text-white font-bold">1.5x Vol Spike</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-zinc-400" />
                <div>
                  <span className="text-[10px] text-zinc-500 block font-sans">Scalp Trades</span>
                  <span className="text-white font-bold">{riya.stats?.totalTrades || 0} Executed</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-zinc-400" />
                <div>
                  <span className="text-[10px] text-zinc-500 block font-sans">Scalper P&L</span>
                  <span className="text-white font-bold">₹{(riya.stats?.totalPnL || 0).toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-zinc-500 font-sans flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white" /> Click desk for full scalper metrics
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRunScalpTick?.();
                }}
                disabled={actionLoading === 'scalp'}
                className="inline-flex items-center space-x-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-md"
              >
                <Zap className={`h-3 w-3 text-black ${actionLoading === 'scalp' ? 'animate-spin' : ''}`} />
                <span>{actionLoading === 'scalp' ? 'Scanning 1m...' : 'Run 1m Scalp Tick'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT WING: MANAGEMENT & CONTROL ROOMS (Dev, Ananya, Kabir) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-white" /> Executive Control Wing
            </span>
            <span className="text-[10px] text-zinc-500">Section B1-B3</span>
          </div>

          {/* ROOM 3: CHIEF RISK OFFICER COMMAND ROOM (CRO Dev) */}
          <div 
            onClick={() => onSelectEmployee?.(dev)}
            className="group relative rounded-2xl border border-zinc-800 bg-zinc-950 p-4.5 hover:border-zinc-600 transition-all cursor-pointer shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-xl group-hover:scale-110 transition-transform">
                  🛡️
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">CRO Dev</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">Chief Risk Officer • Circuit Breakers</p>
                </div>
              </div>

              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                -2% Limit
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 bg-black p-2.5 rounded-lg border border-zinc-900">
              Status: <span className="text-white font-bold">Safety Guard Enforced</span>. Drawdown limit monitored.
            </p>
          </div>

          {/* ROOM 4: CFO FINANCE & LEDGER SUITE (Ananya) */}
          <div 
            onClick={() => onSelectEmployee?.(ananya)}
            className="group relative rounded-2xl border border-zinc-800 bg-zinc-950 p-4.5 hover:border-zinc-600 transition-all cursor-pointer shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-xl group-hover:scale-110 transition-transform">
                  💼
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Finance Lead Ananya</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">CFO • Zerodha/Groww Fee Ledger</p>
                </div>
              </div>

              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                Ledger Audited
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 bg-black p-2.5 rounded-lg border border-zinc-900">
              Status: Auditing brokerage, STT, and capital settlements.
            </p>
          </div>

          {/* ROOM 5: MEDIA & TELEGRAM COMPLIANCE TOWER (Kabir) */}
          <div 
            onClick={() => onSelectEmployee?.(kabir)}
            className="group relative rounded-2xl border border-zinc-800 bg-zinc-950 p-4.5 hover:border-zinc-600 transition-all cursor-pointer shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-xl group-hover:scale-110 transition-transform">
                  📢
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Reporter Kabir</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">Telegram Compliance & EOD Reports</p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendReport?.();
                }}
                disabled={actionLoading === 'report'}
                className="inline-flex items-center space-x-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-black hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-sm"
              >
                <Send className={`h-3 w-3 ${actionLoading === 'report' ? 'animate-spin' : ''}`} />
                <span>{actionLoading === 'report' ? 'Sending...' : 'Send EOD'}</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-300 bg-black p-2.5 rounded-lg border border-zinc-900 flex items-center justify-between">
              <span>Telegram Bot: <b className="text-white">Connected</b></span>
              <span className="text-[10px] text-zinc-500">EOD Dispatch Ready</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
