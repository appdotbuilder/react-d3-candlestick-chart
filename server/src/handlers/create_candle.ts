
import { db } from '../db';
import { candlesTable } from '../db/schema';
import { type CreateCandleInput, type Candle } from '../schema';

export const createCandle = async (input: CreateCandleInput): Promise<Candle> => {
  try {
    // Validate OHLC data integrity
    if (input.high < input.open || input.high < input.close || input.high < input.low) {
      throw new Error('High price must be greater than or equal to Open, Close, and Low prices');
    }
    
    if (input.low > input.open || input.low > input.close || input.low > input.high) {
      throw new Error('Low price must be less than or equal to Open, Close, and High prices');
    }

    // Insert candle record
    const result = await db.insert(candlesTable)
      .values({
        symbol: input.symbol,
        timestamp: input.timestamp,
        open: input.open.toString(),
        high: input.high.toString(),
        low: input.low.toString(),
        close: input.close.toString(),
        volume: input.volume.toString()
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const candle = result[0];
    return {
      ...candle,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume)
    };
  } catch (error) {
    console.error('Candle creation failed:', error);
    throw error;
  }
};
