
import { db } from '../db';
import { candlesTable } from '../db/schema';
import { type CreateCandleInput, type Candle } from '../schema';

export const bulkCreateCandles = async (candles: CreateCandleInput[]): Promise<Candle[]> => {
  try {
    if (candles.length === 0) {
      return [];
    }

    // Convert input data to database format with numeric conversions
    const candleData = candles.map(candle => ({
      symbol: candle.symbol,
      timestamp: candle.timestamp,
      open: candle.open.toString(),
      high: candle.high.toString(),
      low: candle.low.toString(),
      close: candle.close.toString(),
      volume: candle.volume.toString()
    }));

    // Insert all candles in a single operation
    const result = await db.insert(candlesTable)
      .values(candleData)
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    return result.map(candle => ({
      ...candle,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume)
    }));
  } catch (error) {
    console.error('Bulk candle creation failed:', error);
    throw error;
  }
};
