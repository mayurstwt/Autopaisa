import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const symbol = searchParams.get('symbol');

    // Fetch all trades in chronological order to compute FIFO / Average Cost Realized P&L
    const { data: allTrades, error } = await supabaseAdmin
      .from('trades')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const positionMap: Record<string, { qty: number; totalCost: number }> = {};

    const enrichedTrades = (allTrades || []).map((t: any) => {
      const sym = t.symbol;
      if (!positionMap[sym]) {
        positionMap[sym] = { qty: 0, totalCost: 0 };
      }

      let realized_pnl: number | null = null;
      let realized_pnl_percent: number | null = null;

      if (t.side === 'buy') {
        positionMap[sym].qty += Number(t.quantity);
        positionMap[sym].totalCost += Math.abs(Number(t.amount || t.trade_value));
      } else if (t.side === 'sell') {
        const currentQty = positionMap[sym].qty;
        const currentTotalCost = positionMap[sym].totalCost;

        const avgBuyPrice = currentQty > 0 ? currentTotalCost / currentQty : Number(t.price);
        const costBasis = avgBuyPrice * Number(t.quantity);
        const netProceeds = Number(t.amount || t.trade_value);

        realized_pnl = netProceeds - costBasis;
        realized_pnl_percent = costBasis > 0 ? (realized_pnl / costBasis) * 100 : 0;

        // Update remaining holding inventory
        positionMap[sym].qty = Math.max(0, currentQty - Number(t.quantity));
        positionMap[sym].totalCost = Math.max(0, currentTotalCost - costBasis);
      }

      return {
        ...t,
        realized_pnl: realized_pnl !== null ? parseFloat(realized_pnl.toFixed(2)) : null,
        realized_pnl_percent: realized_pnl_percent !== null ? parseFloat(realized_pnl_percent.toFixed(2)) : null,
      };
    });

    // Filter by symbol if requested
    let filteredTrades = enrichedTrades;
    if (symbol) {
      filteredTrades = enrichedTrades.filter((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
    }

    // Sort descending for display (most recent first)
    filteredTrades.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination slice
    const paginatedTrades = filteredTrades.slice(offset, offset + limit);

    return NextResponse.json(paginatedTrades);
  } catch (error: any) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}