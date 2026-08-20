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

export async function POST() {
  try {
    await initializeScalperStorage();
    const defaultBal = SCALPER_CONSTANTS.DEFAULT_BALANCE;

    // Fetch existing wallet and state row IDs
    const [wRes, sRes] = await Promise.all([
      supabaseAdmin.from('scalper_wallet').select('id').limit(1).single(),
      supabaseAdmin.from('scalper_state').select('id').limit(1).single(),
    ]);

    if (wRes.data) {
      await supabaseAdmin
        .from('scalper_wallet')
        .update({ balance: defaultBal, starting_balance: defaultBal, updated_at: new Date().toISOString() })
        .eq('id', wRes.data.id);
    }

    if (sRes.data) {
      await supabaseAdmin
        .from('scalper_state')
        .update({
          daily_pnl: 0.0,
          starting_daily_balance: defaultBal,
          is_disabled_today: false,
          cooldown_until: null,
          last_trade_result: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sRes.data.id);
    }

    // Delete any lingering active scalp positions
    await supabaseAdmin.from('scalper_positions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Fetch updated wallet
    const { data: updatedWallet } = await supabaseAdmin.from('scalper_wallet').select('*').limit(1).single();

    return NextResponse.json({
      success: true,
      wallet: updatedWallet,
      message: 'Portfolio capital successfully reset to ₹1 Crore (₹10,000,000.00) for tomorrow.',
    });
  } catch (error: any) {
    console.error('Error resetting scalper wallet:', error);
    return NextResponse.json({ error: error.message || 'Failed to reset scalper wallet' }, { status: 500 });
  }
}
