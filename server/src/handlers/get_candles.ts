
import { db } from '../db';
import { candlesTable } from '../db/schema';
import { type GetCandlesQuery, type Candle } from '../schema';
import { eq, gte, lte, and, asc, type SQL } from 'drizzle-orm';

export const getCandles = async (query: GetCandlesQuery): Promise<Candle[]> => {
  try {
    // Start with base query
    let baseQuery = db.select().from(candlesTable);

    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Always filter by symbol
    conditions.push(eq(candlesTable.symbol, query.symbol));

    // Add date range filters if provided
    if (query.start_date) {
      conditions.push(gte(candlesTable.timestamp, query.start_date));
    }

    if (query.end_date) {
      conditions.push(lte(candlesTable.timestamp, query.end_date));
    }

    // Apply where clause
    const filteredQuery = baseQuery.where(and(...conditions));

    // Apply ordering and limit
    const finalQuery = filteredQuery
      .orderBy(asc(candlesTable.timestamp))
      .limit(query.limit);

    const results = await finalQuery.execute();

    // Convert numeric fields back to numbers
    return results.map(candle => ({
      ...candle,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume)
    }));
  } catch (error) {
    console.error('Failed to fetch candles:', error);
    throw error;
  }
};
