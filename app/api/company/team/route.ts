import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const DEFAULT_COMPANY_TEAM = [
  {
    id: 'vikram',
    name: 'Vikram',
    role: 'Swing Trading Specialist',
    title: 'Senior Delivery Analyst',
    avatar: '📈',
    department: 'Delivery Desk',
    desk: 'Nifty 50 Swing',
    bio: 'Analyzes daily SMA20/50 golden crosses and RSI momentum for delivery trades.',
    active: true,
  },
  {
    id: 'riya',
    name: 'Riya',
    role: 'Intraday Scalp Specialist',
    title: 'HFT Scalping Specialist',
    avatar: '⚡',
    department: 'Scalping Desk',
    desk: 'Nifty Smallcap 50 Intraday',
    bio: 'Monitors 1-minute VWAP dips and relative volume spikes (>=1.5x) for quick intraday scalps.',
    active: true,
  },
  {
    id: 'dev',
    name: 'Dev',
    role: 'Chief Risk Officer',
    title: 'Head of Risk & Safety',
    avatar: '🛡️',
    department: 'Risk Management',
    desk: 'Firm Safety Desk',
    bio: 'Enforces strict -2.0% daily circuit breakers, max position allocation limits, and stop losses.',
    active: true,
  },
  {
    id: 'ananya',
    name: 'Ananya',
    role: 'Finance & Fee Lead',
    title: 'Chief Financial Officer',
    avatar: '💼',
    department: 'Finance & Accounting',
    desk: 'Capital & Ledger',
    bio: 'Manages Zerodha/Groww fee calculations, tax breakdowns, and wallet balance settlements.',
    active: true,
  },
  {
    id: 'kabir',
    name: 'Kabir',
    role: 'Telegram Compliance Officer',
    title: 'Communications Lead',
    avatar: '📢',
    department: 'Investor Relations',
    desk: 'Telegram Alerts',
    bio: 'Formats live trade signals, CRO alerts, and daily EOD performance summaries for Telegram.',
    active: true,
  },
];

export async function GET() {
  try {
    // 1. Fetch team metadata from Supabase
    const { data: teamData, error: teamErr } = await supabaseAdmin
      .from('company_team')
      .select('*')
      .order('id');

    const employees = (teamErr || !teamData || teamData.length === 0)
      ? DEFAULT_COMPANY_TEAM
      : teamData;

    // 2. Fetch trade & signal stats to calculate live employee performance metrics
    const [swingTradesRes, scalpTradesRes, swingSignalsRes, scalpSignalsRes] = await Promise.all([
      supabaseAdmin.from('trades').select('*'),
      supabaseAdmin.from('scalper_trades').select('*'),
      supabaseAdmin.from('signals_log').select('id, symbol, created_at'),
      supabaseAdmin.from('scalper_signals_log').select('id, symbol, created_at'),
    ]);

    const swingTrades = swingTradesRes.data || [];
    const scalpTrades = scalpTradesRes.data || [];
    const swingSignals = swingSignalsRes.data || [];
    const scalpSignals = scalpSignalsRes.data || [];

    // Calculate metrics per employee
    const swingWins = swingTrades.filter(t => (t.amount || 0) > 0).length;
    const swingPnL = swingTrades.reduce((acc, t) => acc + (t.amount || 0), 0);

    const scalpWins = scalpTrades.filter(t => (t.pnl || 0) > 0).length;
    const scalpPnL = scalpTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);

    const enrichedTeam = employees.map(emp => {
      let stats = {
        totalSignals: 0,
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        status: 'Active',
      };

      if (emp.name === 'Vikram') {
        stats.totalSignals = swingSignals.length;
        stats.totalTrades = swingTrades.length;
        stats.totalPnL = swingPnL;
        stats.winRate = swingTrades.length > 0 ? Math.round((swingWins / swingTrades.length) * 100) : 100;
        stats.status = 'Scanning Nifty 50';
      } else if (emp.name === 'Riya') {
        stats.totalSignals = scalpSignals.length;
        stats.totalTrades = scalpTrades.length;
        stats.totalPnL = scalpPnL;
        stats.winRate = scalpTrades.length > 0 ? Math.round((scalpWins / scalpTrades.length) * 100) : 100;
        stats.status = 'Scanning Smallcap 1m';
      } else if (emp.name === 'Dev') {
        stats.totalSignals = swingSignals.length + scalpSignals.length;
        stats.totalTrades = swingTrades.length + scalpTrades.length;
        stats.totalPnL = swingPnL + scalpPnL;
        stats.winRate = 100;
        stats.status = 'Risk Guard Active';
      } else if (emp.name === 'Ananya') {
        const totalCharges = swingTrades.reduce((acc, t) => acc + (t.total_charges || 0), 0) +
                             scalpTrades.reduce((acc, t) => acc + (t.brokerage || 0), 0);
        stats.totalSignals = swingTrades.length + scalpTrades.length;
        stats.totalTrades = swingTrades.length + scalpTrades.length;
        stats.totalPnL = -totalCharges;
        stats.winRate = 100;
        stats.status = 'Ledger Audited';
      } else if (emp.name === 'Kabir') {
        stats.totalSignals = swingTrades.length + scalpTrades.length;
        stats.totalTrades = swingTrades.length + scalpTrades.length;
        stats.totalPnL = swingPnL + scalpPnL;
        stats.winRate = 100;
        stats.status = 'Telegram Connected';
      }

      return {
        ...emp,
        stats,
      };
    });

    return NextResponse.json({
      success: true,
      team: enrichedTeam,
    });
  } catch (error: any) {
    console.error('Error fetching company team:', error);
    return NextResponse.json({
      success: false,
      team: DEFAULT_COMPANY_TEAM.map(e => ({
        ...e,
        stats: { totalSignals: 0, totalTrades: 0, winRate: 100, totalPnL: 0, status: 'Active' },
      })),
    });
  }
}
