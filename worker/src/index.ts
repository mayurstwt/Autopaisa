import { processTradingCycle } from './strategy';
import cron from 'node-cron';
import { isMarketHours, isMarketDay } from './market-hours';

// Main function that runs the trading cycle
async function runTradingCycle() {
  console.log(`[${new Date().toISOString()}] Starting trading cycle...`);
  
  try {
    await processTradingCycle();
    console.log(`[${new Date().toISOString()}] Trading cycle completed successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in trading cycle:`, error);
  }
}

// Check if current time is within market hours (9:15 AM - 3:30 PM IST, Mon-Fri)
function shouldRunNow(): boolean {
  return isMarketDay() && isMarketHours();
}

async function startWorker() {
  console.log('Starting Autopaisa worker...');
  console.log(`Market status: ${shouldRunNow() ? 'OPEN' : 'CLOSED'}`);

  // Run immediately if market is open
  if (shouldRunNow()) {
    await runTradingCycle();
  }

  // Schedule to run every 5 minutes during market hours
  const task = cron.schedule('*/5 * * * *', async () => {
    if (shouldRunNow()) {
      await runTradingCycle();
    } else {
      console.log(`[${new Date().toISOString()}] Market is closed, skipping trading cycle`);
    }
  }, {
    timezone: 'Asia/Kolkata', // Important: set timezone to IST
  });

  console.log('Worker scheduled to run every 5 minutes during market hours (9:15 AM - 3:30 PM IST, Mon-Fri)');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Received SIGINT. Stopping worker...');
    task.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Stopping worker...');
    task.stop();
    process.exit(0);
  });
}

startWorker().catch((err) => {
  console.error('Fatal worker error:', err);
});
