'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  Send,
  RefreshCw,
  CheckCircle2,
  Zap,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { TradingFloorMap } from '@/components/company/trading-floor-map';
import { EmployeeDeskModal } from '@/components/company/employee-desk-modal';

export default function CompanyTeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'floor' | 'grid'>('floor');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/company/team');
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team || []);
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    const interval = setInterval(fetchTeam, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendReport = async () => {
    setActionLoading('report');
    setReportLoading(true);
    setReportResult(null);
    try {
      const res = await fetch('/api/company/report', { method: 'POST' });
      const data = await res.json();
      setReportResult(data);
    } catch (err: any) {
      setReportResult({ error: err.message });
    } finally {
      setReportLoading(false);
      setActionLoading(null);
    }
  };

  const handleRunSwingScan = async () => {
    setActionLoading('swing');
    try {
      const res = await fetch('/api/trade', { method: 'POST' });
      const data = await res.json();
      setReportResult({ success: true, message: 'Swing delivery scan cycle completed across NIFTY 50.' });
      await fetchTeam();
    } catch (err: any) {
      setReportResult({ error: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunScalpTick = async () => {
    setActionLoading('scalp');
    try {
      const res = await fetch('/api/scalper/tick');
      const data = await res.json();
      setReportResult({ success: true, message: data.message || '1-minute intraday scalp tick executed.' });
      await fetchTeam();
    } catch (err: any) {
      setReportResult({ error: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetCircuitBreaker = async () => {
    setActionLoading('reset');
    try {
      await fetch('/api/scalper/state', { method: 'POST' });
      setReportResult({ success: true, message: 'CRO Dev reset daily circuit breaker state.' });
      await fetchTeam();
    } catch (err: any) {
      setReportResult({ error: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && team.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-3 bg-black">
        <div className="h-8 w-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        <p className="text-xs font-mono text-zinc-400">Loading Autopaisa Quant Floor Blueprint...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8 bg-black text-white font-mono selection:bg-white selection:text-black">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1">
              <Building2 className="h-3 w-3 text-white" /> Virtual Quant Firm
            </span>
            <span className="text-xs text-zinc-500 font-sans">Autopaisa Capital</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Company Trading Floor Plan
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-sans max-w-2xl">
            Interactive top-down architectural layout of Autopaisa Quant Capital. View employee desks, live workstation telemetry, and trigger direct desk actions.
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center space-x-3 font-sans">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('floor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
                viewMode === 'floor'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Floor Plan View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Employee Grid
            </button>
          </div>

          <button
            onClick={fetchTeam}
            className="inline-flex items-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all font-mono"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleSendReport}
            disabled={reportLoading}
            className="inline-flex items-center space-x-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-md font-mono"
          >
            <Send className={`h-4 w-4 text-black ${reportLoading ? 'animate-spin' : ''}`} />
            <span>{reportLoading ? 'Sending...' : 'Trigger Kabir EOD Report'}</span>
          </button>
        </div>
      </div>

      {/* Execution Feedback Banner */}
      {reportResult && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs font-mono flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Send className="h-4 w-4 text-white" />
            <span>{reportResult.message || reportResult.error}</span>
          </div>
          <span className="text-[10px] text-zinc-500">{new Date().toLocaleTimeString()}</span>
        </div>
      )}

      {/* VIEW MODE 1: TOP-DOWN ARCHITECTURAL FLOOR PLAN VIEW */}
      {viewMode === 'floor' ? (
        <TradingFloorMap
          team={team}
          onRunSwingScan={handleRunSwingScan}
          onRunScalpTick={handleRunScalpTick}
          onSendReport={handleSendReport}
          onResetCircuitBreaker={handleResetCircuitBreaker}
          onSelectEmployee={(emp) => setSelectedEmployee(emp)}
          actionLoading={actionLoading}
        />
      ) : (
        /* VIEW MODE 2: EMPLOYEE ROSTER GRID */
        <div className="space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-white" /> Virtual Employee Roster
            </h2>
            <span className="text-xs text-zinc-500 font-sans">Autopaisa Capital Organizational Chart</span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {team.map((emp) => (
              <div
                key={emp.id}
                onClick={() => setSelectedEmployee(emp)}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-5 hover:border-zinc-700 transition-all relative overflow-hidden group cursor-pointer"
              >
                <div className="flex items-start justify-between border-b border-zinc-900 pb-4 font-sans">
                  <div className="flex items-center space-x-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black border border-zinc-800 text-2xl group-hover:scale-105 transition-transform">
                      {emp.avatar}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-extrabold text-white font-mono">{emp.name}</h3>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono">
                          {emp.role}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-sans">{emp.title} • {emp.department}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-zinc-900 text-white border border-zinc-800 font-mono">
                    {emp.stats?.status || 'Active'}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed bg-black p-3 rounded-xl border border-zinc-900 font-sans">
                  {emp.bio}
                </p>

                <div className="grid grid-cols-4 gap-2 text-center bg-black rounded-xl p-3 border border-zinc-900 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-sans block">Scans</span>
                    <span className="font-bold text-white">{emp.stats?.totalSignals || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-sans block">Trades</span>
                    <span className="font-bold text-white">{emp.stats?.totalTrades || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-sans block">Win Rate</span>
                    <span className="font-bold text-white">{emp.stats?.winRate || 100}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-sans block">Net P&L</span>
                    <span className="font-bold text-white">
                      {(emp.stats?.totalPnL || 0) >= 0 ? '+' : ''}₹{(emp.stats?.totalPnL || 0).toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 font-mono">
                  <span>Assigned Desk: <b className="text-white">{emp.desk}</b></span>
                  <span className="text-[10px] font-mono text-zinc-600">ID: #{emp.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMPLOYEE DESK MODAL DIALOG */}
      <EmployeeDeskModal
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
}
