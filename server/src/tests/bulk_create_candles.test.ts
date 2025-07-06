
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { candlesTable } from '../db/schema';
import { type CreateCandleInput } from '../schema';
import { bulkCreateCandles } from '../handlers/bulk_create_candles';
import { eq } from 'drizzle-orm';

// Test data for bulk creation
const testCandles: CreateCandleInput[] = [
  {
    symbol: 'BTCUSD',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    open: 45000.50,
    high: 45500.75,
    low: 44800.25,
    close: 45200.00,
    volume: 1500.5
  },
  {
    symbol: 'BTCUSD',
    timestamp: new Date('2024-01-01T01:00:00Z'),
    open: 45200.00,
    high: 45800.25,
    low: 45100.75,
    close: 45600.50,
    volume: 1250.75
  },
  {
    symbol: 'ETHUSD',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    open: 3200.25,
    high: 3250.75,
    low: 3180.50,
    close: 3220.00,
    volume: 850.25
  }
];

describe('bulkCreateCandles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create multiple candles in bulk', async () => {
    const result = await bulkCreateCandles(testCandles);

    expect(result).toHaveLength(3);
    
    // Verify first candle
    expect(result[0].symbol).toEqual('BTCUSD');
    expect(result[0].open).toEqual(45000.50);
    expect(result[0].high).toEqual(45500.75);
    expect(result[0].low).toEqual(44800.25);
    expect(result[0].close).toEqual(45200.00);
    expect(result[0].volume).toEqual(1500.5);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second candle
    expect(result[1].symbol).toEqual('BTCUSD');
    expect(result[1].open).toEqual(45200.00);
    expect(result[1].high).toEqual(45800.25);
    expect(result[1].low).toEqual(45100.75);
    expect(result[1].close).toEqual(45600.50);
    expect(result[1].volume).toEqual(1250.75);

    // Verify third candle (different symbol)
    expect(result[2].symbol).toEqual('ETHUSD');
    expect(result[2].open).toEqual(3200.25);
    expect(result[2].high).toEqual(3250.75);
    expect(result[2].low).toEqual(3180.50);
    expect(result[2].close).toEqual(3220.00);
    expect(result[2].volume).toEqual(850.25);
  });

  it('should save all candles to database', async () => {
    const result = await bulkCreateCandles(testCandles);

    // Query all candles from database
    const candles = await db.select()
      .from(candlesTable)
      .execute();

    expect(candles).toHaveLength(3);

    // Verify database storage and numeric conversions
    const btcCandles = candles.filter(c => c.symbol === 'BTCUSD');
    expect(btcCandles).toHaveLength(2);
    
    // Find the first BTC candle by timestamp
    const firstBtcCandle = btcCandles.find(c => 
      c.timestamp.getTime() === new Date('2024-01-01T00:00:00Z').getTime()
    );
    expect(firstBtcCandle).toBeDefined();
    expect(parseFloat(firstBtcCandle!.open)).toEqual(45000.50);
    expect(parseFloat(firstBtcCandle!.high)).toEqual(45500.75);
    expect(parseFloat(firstBtcCandle!.low)).toEqual(44800.25);
    expect(parseFloat(firstBtcCandle!.close)).toEqual(45200.00);
    expect(parseFloat(firstBtcCandle!.volume)).toEqual(1500.5);

    const ethCandles = candles.filter(c => c.symbol === 'ETHUSD');
    expect(ethCandles).toHaveLength(1);
    expect(parseFloat(ethCandles[0].open)).toEqual(3200.25);
    expect(parseFloat(ethCandles[0].volume)).toEqual(850.25);
  });

  it('should handle empty array', async () => {
    const result = await bulkCreateCandles([]);

    expect(result).toHaveLength(0);

    // Verify no candles were created
    const candles = await db.select()
      .from(candlesTable)
      .execute();

    expect(candles).toHaveLength(0);
  });

  it('should handle single candle', async () => {
    const singleCandle = [testCandles[0]];
    const result = await bulkCreateCandles(singleCandle);

    expect(result).toHaveLength(1);
    expect(result[0].symbol).toEqual('BTCUSD');
    expect(result[0].open).toEqual(45000.50);
    expect(result[0].high).toEqual(45500.75);
    expect(result[0].low).toEqual(44800.25);
    expect(result[0].close).toEqual(45200.00);
    expect(result[0].volume).toEqual(1500.5);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should verify numeric type conversions', async () => {
    const result = await bulkCreateCandles(testCandles);

    // Verify all numeric fields are returned as numbers
    result.forEach(candle => {
      expect(typeof candle.open).toBe('number');
      expect(typeof candle.high).toBe('number');
      expect(typeof candle.low).toBe('number');
      expect(typeof candle.close).toBe('number');
      expect(typeof candle.volume).toBe('number');
    });
  });
});
