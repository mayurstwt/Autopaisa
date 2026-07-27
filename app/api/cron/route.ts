import { NextResponse } from 'next/server';
import { processTradingCycle } from '@/lib/strategy';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
    }

    console.log(`[${new Date().toISOString()}] Cron endpoint triggered. Running trading cycle...`);
    await processTradingCycle();

    return NextResponse.json({
      success: true,
      message: 'Trading cycle executed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error executing cron trading cycle:', error);
    return NextResponse.json(
      { error: 'Failed to execute trading cycle', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
