import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEODReportNotification } from '@/lib/notifications';

export async function POST() {
  try {
    const [swingTradesRes, scalpTradesRes, positionsRes, holdingsRes] = await Promise.all([
      supabaseAdmin.from('trades').select('*'),
      supabaseAdmin.from('scalper_trades').select('*'),
      supabaseAdmin.from('scalper_positions').select('id'),
      supabaseAdmin.from('holdings').select('id'),
    ]);

    const swingTrades = swingTradesRes.data || [];
    const scalpTrades = scalpTradesRes.data || [];
    const positions = positionsRes.data || [];
    const holdings = holdingsRes.data || [];

    const swingPnL = swingTrades.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const scalpPnL = scalpTrades.reduce((acc, t) => acc + Number(t.pnl || 0), 0);
    const netTotalPnL = swingPnL + scalpPnL;

    const totalBrokerage = swingTrades.reduce((acc, t) => acc + Number(t.total_charges || 0), 0) +
                           scalpTrades.reduce((acc, t) => acc + Number(t.brokerage || 0), 0);

    const totalTrades = swingTrades.length + scalpTrades.length;

    await sendEODReportNotification({
      totalTrades,
      swingPnL,
      scalpPnL,
      netTotalPnL,
      totalBrokerage,
      activeScalpPositions: positions.length,
      activeHoldings: holdings.length,
    });

    return NextResponse.json({
      success: true,
      message: 'End-of-Day Report compiled and dispatched by Reporter Kabir to Telegram.',
      summary: {
        totalTrades,
        swingPnL,
        scalpPnL,
        netTotalPnL,
        totalBrokerage,
      },
    });
  } catch (error: any) {
    console.error('Error generating company EOD report:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}
