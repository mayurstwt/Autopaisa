// app/api/trade/route.ts
import { NextResponse } from 'next/server'
import { processTradingCycle } from '@/lib/strategy'

export async function POST() {
  try {
    await processTradingCycle()
    return NextResponse.json({ success: true, message: 'Trading cycle completed' })
  } catch (error: any) {
    console.error('Error triggering trade:', error)
    return NextResponse.json({ error: 'Failed to trigger trade' }, { status: 500 })
  }
}