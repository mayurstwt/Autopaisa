import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
  const { sendScalpEntryNotification, sendScalpExitNotification, sendSwingTradeNotification } = await import('../lib/notifications');

  console.log('Testing Telegram Bot Notification System...');
  console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Missing');
  console.log('TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID ? 'Set' : 'Missing');

  console.log('\n--- 1. Testing Scalper Entry Notification ---');
  await sendScalpEntryNotification({
    symbol: 'IDFCFIRSTB.NS',
    side: 'sell',
    quantity: 1149,
    entryPrice: 84.43,
    investAmount: 97000.07,
    tpPrice: 84.14,
    slPrice: 85.06,
    entryFees: 15.20,
    walletBalance: 97000.00,
  });

  console.log('\n--- 2. Testing Scalper Exit Notification (TP Hit) ---');
  await sendScalpExitNotification({
    symbol: 'IDFCFIRSTB.NS',
    side: 'sell',
    entryPrice: 84.43,
    exitPrice: 84.14,
    quantity: 1149,
    exitReason: 'tp',
    netPnl: 251.87,
    pnlPercent: 0.0020,
    roundTripFees: 30.40,
    walletBalance: 100251.87,
  });

  console.log('\n--- 3. Testing Scalper Exit Notification (SL Hit) ---');
  await sendScalpExitNotification({
    symbol: 'IDEA.NS',
    side: 'buy',
    entryPrice: 12.90,
    exitPrice: 12.85,
    quantity: 7539,
    exitReason: 'sl',
    netPnl: -81.44,
    pnlPercent: -0.0050,
    roundTripFees: 24.60,
    walletBalance: 99918.56,
  });

  console.log('\n--- 4. Testing Swing Trade Notification ---');
  await sendSwingTradeNotification({
    symbol: 'RELIANCE.NS',
    side: 'buy',
    quantity: 10,
    price: 2500.00,
    totalCharges: 25.50,
    netAmount: -25025.50,
    walletBalance: 74974.50,
    reason: 'SMA 20 Bullish Crossover & RSI < 45',
  });

  console.log('\nAll test notifications dispatched!');
}

main().catch(console.error);
