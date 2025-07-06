
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { candlesTable } from '../db/schema';
import { type CreateCandleInput } from '../schema';
import { createCandle } from '../handlers/create_candle';
import { eq } from 'drizzle-orm';

// Valid test input with proper OHLC relationships
const testInput: CreateCandleInput = {
  symbol: 'BTCUSD',
  timestamp: new Date('2024-01-01T12:00:00Z'),
  open: 50000.0,
  high: 52000.0,
  low: 49000.0,
  close: 51000.0,
  volume: 1000.5
};

describe('createCandle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a candle with valid OHLC data', async () => {
    const result = await createCandle(testInput);

    // Basic field validation
    expect(result.symbol).toEqual('BTCUSD');
    expect(result.timestamp).toEqual(testInput.timestamp);
    expect(result.open).toEqual(50000.0);
    expect(result.high).toEqual(52000.0);
    expect(result.low).toEqual(49000.0);
    expect(result.close).toEqual(51000.0);
    expect(result.volume).toEqual(1000.5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.open).toBe('number');
    expect(typeof result.high).toBe('number');
    expect(typeof result.low).toBe('number');
    expect(typeof result.close).toBe('number');
    expect(typeof result.volume).toBe('number');
  });

  it('should save candle to database', async () => {
    const result = await createCandle(testInput);

    const candles = await db.select()
      .from(candlesTable)
      .where(eq(candlesTable.id, result.id))
      .execute();

    expect(candles).toHaveLength(1);
    expect(candles[0].symbol).toEqual('BTCUSD');
    expect(candles[0].timestamp).toEqual(testInput.timestamp);
    expect(parseFloat(candles[0].open)).toEqual(50000.0);
    expect(parseFloat(candles[0].high)).toEqual(52000.0);
    expect(parseFloat(candles[0].low)).toEqual(49000.0);
    expect(parseFloat(candles[0].close)).toEqual(51000.0);
    expect(parseFloat(candles[0].volume)).toEqual(1000.5);
    expect(candles[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject invalid OHLC data - high less than open', async () => {
    const invalidInput: CreateCandleInput = {
      ...testInput,
      high: 48000.0, // High less than open (50000)
      open: 50000.0,
      low: 47000.0,
      close: 49000.0
    };

    await expect(createCandle(invalidInput)).rejects.toThrow(/high price must be greater than or equal to/i);
  });

  it('should reject invalid OHLC data - low greater than close', async () => {
    const invalidInput: CreateCandleInput = {
      ...testInput,
      high: 52000.0,
      open: 50000.0,
      low: 51500.0, // Low greater than close (51000)
      close: 51000.0
    };

    await expect(createCandle(invalidInput)).rejects.toThrow(/low price must be less than or equal to/i);
  });

  it('should accept valid edge case - all prices equal', async () => {
    const edgeCaseInput: CreateCandleInput = {
      ...testInput,
      open: 50000.0,
      high: 50000.0,
      low: 50000.0,
      close: 50000.0
    };

    const result = await createCandle(edgeCaseInput);

    expect(result.open).toEqual(50000.0);
    expect(result.high).toEqual(50000.0);
    expect(result.low).toEqual(50000.0);
    expect(result.close).toEqual(50000.0);
  });

  it('should handle zero volume correctly', async () => {
    const zeroVolumeInput: CreateCandleInput = {
      ...testInput,
      volume: 0
    };

    const result = await createCandle(zeroVolumeInput);

    expect(result.volume).toEqual(0);
    expect(typeof result.volume).toBe('number');
  });
});
