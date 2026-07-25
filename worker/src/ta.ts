export function sma(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(0);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    }
  }
  return result;
}

export function rsi(data: number[], period: number): number[] {
  const gains: number[] = new Array(data.length).fill(0);
  const losses: number[] = new Array(data.length).fill(0);
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change >= 0) {
      gains[i] = change;
      losses[i] = 0;
    } else {
      gains[i] = 0;
      losses[i] = -change;
    }
  }

  const avgGain: number[] = new Array(data.length).fill(0);
  const avgLoss: number[] = new Array(data.length).fill(0);
  // First average
  let sumGain = 0;
  let sumLoss = 0;
  for (let i = 0; i < period; i++) {
    sumGain += gains[i];
    sumLoss += losses[i];
  }
  avgGain[period - 1] = sumGain / period;
  avgLoss[period - 1] = sumLoss / period;

  // Wilder's smoothing
  for (let i = period; i < data.length; i++) {
    avgGain[i] = (avgGain[i - 1] * (period - 1) + gains[i]) / period;
    avgLoss[i] = (avgLoss[i - 1] * (period - 1) + losses[i]) / period;
  }

  const rsiValues: number[] = new Array(data.length).fill(0);
  for (let i = period - 1; i < data.length; i++) {
    if (avgLoss[i] === 0) {
      rsiValues[i] = 100;
    } else {
      const rs = avgGain[i] / avgLoss[i];
      rsiValues[i] = 100 - (100 / (1 + rs));
    }
  }
  return rsiValues;
}
