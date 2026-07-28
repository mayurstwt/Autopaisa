import { NextResponse } from 'next/server';
import { processScalperCycle } from '@/lib/scalper/scalper-strategy';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processScalperCycle();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error executing scalper tick:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to execute scalper cycle', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
