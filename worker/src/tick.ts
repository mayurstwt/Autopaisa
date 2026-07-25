import { processTradingCycle } from './strategy';
import { isMarketHours, isMarketDay } from './market-hours';

async function runTick() {
  const isDay = isMarketDay();
  const isHours = isMarketHours();

  console.log(`[${new Date().toISOString()}] Single-tick worker execution...`);
  console.log(`Market Status: ${isDay ? 'Market Day' : 'Non-Market Day'}, ${isHours ? 'Trading Hours' : 'Outside Trading Hours'}`);

  if (isDay && isHours) {
    console.log(`[${new Date().toISOString()}] Market is open. Executing trading cycle...`);
    await processTradingCycle();
    console.log(`[${new Date().toISOString()}] Trading cycle completed successfully.`);
  } else {
    console.log(`[${new Date().toISOString()}] Market is currently closed. Skipping trading cycle.`);
  }
}

runTick().catch((err) => {
  console.error(`[${new Date().toISOString()}] Fatal error during tick execution:`, err);
  process.exit(1);
});
