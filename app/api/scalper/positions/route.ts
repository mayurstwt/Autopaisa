import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { squareOffAllScalpPositions, exitScalpPosition } from '@/lib/scalper/scalper-strategy';
import { fetchIntradayScalpData } from '@/lib/scalper/market-intraday';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('scalper_positions').select('*').order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching scalper positions:', error);
    return NextResponse.json({ error: 'Failed to fetch active scalp positions' }, { status: 500 });
  }
}

// POST endpoint to square off ALL active positions
export async function POST() {
  try {
    const result = await squareOffAllScalpPositions('eod_squareoff');
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error squaring off all positions:', error);
    return NextResponse.json({ error: error.message || 'Failed to square off positions' }, { status: 500 });
  }
}

// DELETE endpoint to exit a specific active position by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Position ID is required' }, { status: 400 });
    }

    const { data: pos, error: fetchErr } = await supabaseAdmin
      .from('scalper_positions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !pos) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    let exitPrice = pos.entry_price;
    try {
      const scalpData = await fetchIntradayScalpData(pos.symbol);
      if (scalpData && scalpData.currentPrice > 0) {
        exitPrice = scalpData.currentPrice;
      }
    } catch (e) {
      // Fallback to entry_price
    }

    await exitScalpPosition(pos, exitPrice, 'eod_squareoff');

    return NextResponse.json({
      success: true,
      message: `Exited scalp position for ${pos.symbol} @ ₹${exitPrice}. Capital returned to wallet.`,
    });
  } catch (error: any) {
    console.error('Error exiting position:', error);
    return NextResponse.json({ error: error.message || 'Failed to exit position' }, { status: 500 });
  }
}
