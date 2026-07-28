import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { initializeScalperStorage } from '@/lib/scalper/scalper-strategy';

export async function GET() {
  try {
    await initializeScalperStorage();
    const { data, error } = await supabaseAdmin.from('scalper_state').select('*').limit(1).single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching scalper state:', error);
    return NextResponse.json({ error: 'Failed to fetch scalper state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Reset Circuit Breaker / Cooldown state
    await initializeScalperStorage();
    const { data, error } = await supabaseAdmin
      .from('scalper_state')
      .update({
        daily_pnl: 0.0,
        is_disabled_today: false,
        cooldown_until: null,
        last_trade_result: null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, state: data });
  } catch (error: any) {
    console.error('Error resetting scalper state:', error);
    return NextResponse.json({ error: 'Failed to reset scalper state' }, { status: 500 });
  }
}
