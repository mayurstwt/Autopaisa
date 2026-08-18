import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { initializeScalperStorage, SCALPER_CONSTANTS } from '@/lib/scalper/scalper-strategy';

export async function GET() {
  try {
    await initializeScalperStorage();
    const { data, error } = await supabaseAdmin.from('scalper_wallet').select('*').limit(1).single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching scalper wallet:', error);
    return NextResponse.json({ error: 'Failed to fetch scalper wallet' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Reset scalper wallet balance back to starting balance (₹10,000,000 / ₹1 Crore)
    await initializeScalperStorage();
    const defaultBal = SCALPER_CONSTANTS.DEFAULT_BALANCE;
    const { data, error } = await supabaseAdmin
      .from('scalper_wallet')
      .update({ balance: defaultBal, starting_balance: defaultBal, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    // Reset daily P&L in scalper state
    await supabaseAdmin
      .from('scalper_state')
      .update({
        daily_pnl: 0.0,
        starting_daily_balance: defaultBal,
        is_disabled_today: false,
        cooldown_until: null,
        updated_at: new Date().toISOString(),
      });

    return NextResponse.json({ success: true, wallet: data });
  } catch (error: any) {
    console.error('Error resetting scalper wallet:', error);
    return NextResponse.json({ error: 'Failed to reset scalper wallet' }, { status: 500 });
  }
}
