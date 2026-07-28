import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export interface IntradayScalpData {
  symbol: string;
  currentPrice: number;
  vwap: number;
  currentVolume: number;
  avg20mVolume: number;
  volumeRatio: number;
  candlesCount: number;
}

/**
 * Fetch 1-minute intraday candles for today and compute VWAP & Relative Volume metrics
 */
export async function fetchIntradayScalpData(symbol: string): Promise<IntradayScalpData> {
  const maxRetries = 3;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Fetch 1-minute intraday chart data for current trading day
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const chartResult = await yahooFinance.chart(symbol, {
        period1: startDate,
        interval: '1m',
      });

      const quotes = (chartResult.quotes || []).filter(
        (q: any) => q && typeof q.close === 'number' && q.close > 0 && typeof q.volume === 'number'
      );

      if (quotes.length === 0) {
        throw new Error(`No 1-minute intraday quotes returned for ${symbol}`);
      }

      // Determine current price from meta or latest quote
      const currentPrice = parseFloat(
        (
          chartResult.meta?.regularMarketPrice ??
          chartResult.meta?.chartPreviousClose ??
          quotes[quotes.length - 1].close ??
          0
        ).toFixed(2)
      );

      // Calculate VWAP = Sum(Typical Price * Volume) / Sum(Volume)
      let cumPV = 0;
      let cumVol = 0;

      for (const q of quotes) {
        const close = q.close || 0;
        const high = q.high ?? close;
        const low = q.low ?? close;
        const vol = q.volume || 1;

        const typicalPrice = (high + low + close) / 3;
        cumPV += typicalPrice * vol;
        cumVol += vol;
      }

      const vwap = cumVol > 0 ? parseFloat((cumPV / cumVol).toFixed(2)) : currentPrice;

      // Current candle volume (most recent quote)
      const currentVolume = quotes[quotes.length - 1].volume || 0;

      // Calculate 20-minute average volume (excluding current candle if possible)
      const recent20 = quotes.slice(Math.max(0, quotes.length - 21), quotes.length - 1);
      const total20Vol = recent20.reduce((acc: number, q: any) => acc + (q.volume || 0), 0);
      const avg20mVolume = recent20.length > 0 ? Math.round(total20Vol / recent20.length) : currentVolume || 1;

      const volumeRatio = avg20mVolume > 0 ? parseFloat((currentVolume / avg20mVolume).toFixed(2)) : 1.0;

      return {
        symbol,
        currentPrice,
        vwap,
        currentVolume,
        avg20mVolume,
        volumeRatio,
        candlesCount: quotes.length,
      };
    } catch (error) {
      console.warn(`[Scalper Market Data] Attempt ${attempt + 1} failed for ${symbol}:`, error);
      if (attempt < maxRetries - 1) {
        await delay(1000 * (attempt + 1));
      } else {
        throw new Error(`Failed to fetch intraday scalp data for ${symbol}: ${error}`);
      }
    }
  }

  throw new Error(`Unexpected error fetching scalp market data for ${symbol}`);
}
