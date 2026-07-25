// worker/src/market.ts
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/**
 * Fetches current price and historical daily close prices for the last 60 trading days.
 * Returns an object with currentPrice and historicalCloses (array of { date: string, close: number } sorted ascending by date).
 * @param symbol NSE symbol with .NS suffix (e.g., 'RELIANCE.NS')
 * @throws Error if data cannot be fetched after retries
 */
export async function fetchMarketData(symbol: string): Promise<{
  currentPrice: number;
  historicalCloses: Array<{ date: string; close: number }>;
}> {
  const maxRetries = 3;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Calculate date range for historical closes (last ~4 months)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 4);

      // Use chart() module which fetches both current price metadata and quotes in a single resilient query
      const chartResult = await yahooFinance.chart(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d',
      });

      const quotes = chartResult.quotes || [];
      
      // Determine current price from meta or fallback to last valid close
      const currentPrice = chartResult.meta?.regularMarketPrice 
        ?? chartResult.meta?.chartPreviousClose
        ?? (quotes.length > 0 ? quotes[quotes.length - 1].close : 0)
        ?? 0;

      // Extract date and close, filter out null/invalid entries, and sort ascending
      const historicalCloses = quotes
        .filter((q: any) => q && q.date && typeof q.close === 'number' && q.close > 0)
        .map((q: any) => ({
          date: new Date(q.date).toISOString().split('T')[0], // YYYY-MM-DD
          close: q.close,
        }))
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Take the last 60 trading days
      const recent60 = historicalCloses.slice(Math.max(0, historicalCloses.length - 60));

      if (recent60.length === 0 || currentPrice === 0) {
        throw new Error(`Insufficient market data returned for ${symbol}`);
      }

      return {
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        historicalCloses: recent60,
      };
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} failed for symbol ${symbol}:`, error);
      if (attempt < maxRetries - 1) {
        await delay(1000 * (attempt + 1));
      } else {
        throw new Error(`Failed to fetch market data for ${symbol} after ${maxRetries} attempts: ${error}`);
      }
    }
  }

  throw new Error(`Unexpected error in fetchMarketData for ${symbol}`);
}
