import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchMarketData } from '@/lib/market'

export async function GET() {
  try {
    // Get active holdings (quantity > 0)
    const { data: holdingsData, error: holdingsError } = await supabaseAdmin
      .from('holdings')
      .select('symbol, quantity, avg_buy_price')
      .gt('quantity', 0)

    if (holdingsError) throw holdingsError

    // If no holdings, return empty array
    if (!holdingsData || holdingsData.length === 0) {
      return NextResponse.json([])
    }

    // For each holding, get current price and calculate P&L
    const holdingsWithPrices = await Promise.all(
      holdingsData.map(async (holding) => {
        try {
          // Get current market data for this symbol
          const marketData = await fetchMarketData(holding.symbol)
          const currentPrice = marketData.currentPrice

          // Calculate unrealized P&L
          const unrealizedPnl = (currentPrice - holding.avg_buy_price) * holding.quantity
          const unrealizedPnlPercent =
            holding.avg_buy_price > 0
              ? ((currentPrice - holding.avg_buy_price) / holding.avg_buy_price) * 100
              : 0

          return {
            ...holding,
            currentPrice,
            unrealizedPnl: parseFloat(unrealizedPnl.toFixed(2)),
            unrealizedPnlPercent: parseFloat(unrealizedPnlPercent.toFixed(2))
          }
        } catch (error) {
          // If we can't get price for a symbol, still return the holding but with null price
          console.warn(`Could not fetch price for ${holding.symbol}:`, error)
          return {
            ...holding,
            currentPrice: null,
            unrealizedPnl: 0,
            unrealizedPnlPercent: 0
          }
        }
      })
    )

    return NextResponse.json(holdingsWithPrices)
  } catch (error: any) {
    console.error('Error fetching holdings:', error)
    return NextResponse.json({ error: 'Failed to fetch holdings' }, { status: 500 })
  }
}
