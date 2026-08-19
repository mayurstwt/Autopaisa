'use client';

import React from 'react';
import {
  X,
  Monitor,
  Building2,
  Send,
  CheckCircle2
} from 'lucide-react';

interface EmployeeDeskModalProps {
  employee: any | null;
  onClose: () => void;
  onRunAction?: (actionType: string) => void;
  actionLoading?: string | null;
}

export function EmployeeDeskModal({
  employee,
  onClose,
  onRunAction,
  actionLoading,
}: EmployeeDeskModalProps) {
  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150 font-mono text-white selection:bg-white selection:text-black">
      <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl overflow-hidden space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black border border-zinc-800 text-3xl">
              {employee.avatar}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-extrabold text-white">{employee.name}</h3>
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-sans">
                  {employee.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans">{employee.title} • {employee.department}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-black p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workstation Specification Overview */}
        <div className="space-y-3 font-sans">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
            <Monitor className="h-4 w-4 text-white" /> Workstation Telemetry & Duties
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed bg-black p-4 rounded-2xl border border-zinc-900">
            {employee.bio}
          </p>
        </div>

        {/* Live Performance Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-black rounded-2xl p-4 border border-zinc-900 text-xs">
          <div>
            <span className="text-[10px] text-zinc-500 font-sans block">Scans</span>
            <span className="font-extrabold text-white text-sm">{employee.stats?.totalSignals || 0}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-sans block">Trades</span>
            <span className="font-extrabold text-white text-sm">{employee.stats?.totalTrades || 0}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-sans block">Win Rate</span>
            <span className="font-extrabold text-white text-sm">{employee.stats?.winRate || 100}%</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-sans block">Net P&L</span>
            <span className="font-extrabold text-white text-sm">
              {(employee.stats?.totalPnL || 0) >= 0 ? '+' : ''}₹{(employee.stats?.totalPnL || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Desk Metadata & Assigned Strategy */}
        <div className="space-y-2 text-xs text-zinc-300 bg-black p-4 rounded-2xl border border-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 font-sans">Assigned Desk:</span>
            <span className="font-bold text-white">{employee.desk}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 font-sans">Current Status:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-900 text-white border border-zinc-800">
              {employee.stats?.status || 'Active'}
            </span>
          </div>
        </div>

        {/* Desk Action Controls */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all font-sans"
          >
            Close Desk Window
          </button>
        </div>
      </div>
    </div>
  );
}
