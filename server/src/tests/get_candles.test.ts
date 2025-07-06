
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { candlesTable } from '../db/schema';
import { type GetCandlesQuery, type CreateCandleInput } from '../schema';
import { getCandles } from '../handlers/get_candles';

// Test candle data
const testCandle1: CreateCandleInput = {
  symbol: 'BTCUSD',
  timestamp: new Date('2024-01-01T10:00:00Z'),
  open: 50000.0,
  high: 51000.0,
  low: 49500.0,
  close: 50800.0,
  volume: 1000.0
};

const testCandle2: CreateCandleInput = {
  symbol: 'BTCUSD',
  timestamp: new Date('2024-01-01T11:00:00Z'),
  open: 50800.0,
  high: 52000.0,
  low: 50500.0,
  close: 51200.0,
  volume: 1500.0
};

const testCandle3: CreateCandleInput = {
  symbol: 'ETHUSD',
  timestamp: new Date('2024-01-01T10:00:00Z'),
  open: 3000.0,
  high: 3100.0,
  low: 2950.0,
  close: 3050.0,
  volume: 500.0
};

describe('getCandles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return candles for specified symbol', async () => {
    // Insert test data
    await db.insert(candlesTable).values([
      {
        symbol: testCandle1.symbol,
        timestamp: testCandle1.timestamp,
        open: testCandle1.open.toString(),
        high: testCandle1.high.toString(),
        low: testCandle1.low.toString(),
        close: testCandle1.close.toString(),
        volume: testCandle1.volume.toString()
      },
      {
        symbol: testCandle2.symbol,
        timestamp: testCandle2.timestamp,
        open: testCandle2.open.toString(),
        high: testCandle2.high.toString(),
        low: testCandle2.low.toString(),
        close: testCandle2.close.toString(),
        volume: testCandle2.volume.toString()
      },
      {
        symbol: testCandle3.symbol,
        timestamp: testCandle3.timestamp,
        open: testCandle3.open.toString(),
        high: testCandle3.high.toString(),
        low: testCandle3.low.toString(),
        close: testCandle3.close.toString(),
        volume: testCandle3.volume.toString()
      }
    ]);

    const query: GetCandlesQuery = {
      symbol: 'BTCUSD',
      limit: 100
    };

    const results = await getCandles(query);

    expect(results).toHaveLength(2);
    expect(results[0].symbol).toBe('BTCUSD');
    expect(results[1].symbol).toBe('BTCUSD');
    
    // Verify numeric conversions
    expect(typeof results[0].open).toBe('number');
    expect(typeof results[0].high).toBe('number');
    expect(typeof results[0].low).toBe('number');
    expect(typeof results[0].close).toBe('number');
    expect(typeof results[0].volume).toBe('number');
    
    expect(results[0].open).toBe(50000.0);
    expect(results[0].high).toBe(51000.0);
    expect(results[0].low).toBe(49500.0);
    expect(results[0].close).toBe(50800.0);
    expect(results[0].volume).toBe(1000.0);
  });

  it('should order candles by timestamp ascending', async () => {
    // Insert test data in reverse order
    await db.insert(candlesTable).values([
      {
        symbol: testCandle2.symbol,
        timestamp: testCandle2.timestamp,
        open: testCandle2.open.toString(),
        high: testCandle2.high.toString(),
        low: testCandle2.low.toString(),
        close: testCandle2.close.toString(),
        volume: testCandle2.volume.toString()
      },
      {
        symbol: testCandle1.symbol,
        timestamp: testCandle1.timestamp,
        open: testCandle1.open.toString(),
        high: testCandle1.high.toString(),
        low: testCandle1.low.toString(),
        close: testCandle1.close.toString(),
        volume: testCandle1.volume.toString()
      }
    ]);

    const query: GetCandlesQuery = {
      symbol: 'BTCUSD',
      limit: 100
    };

    const results = await getCandles(query);

    expect(results).toHaveLength(2);
    // Should be ordered by timestamp ascending
    expect(results[0].timestamp).toEqual(testCandle1.timestamp);
    expect(results[1].timestamp).toEqual(testCandle2.timestamp);
  });

  it('should filter by date range', async () => {
    // Insert test data
    await db.insert(candlesTable).values([
      {
        symbol: testCandle1.symbol,
        timestamp: testCandle1.timestamp,
        open: testCandle1.open.toString(),
        high: testCandle1.high.toString(),
        low: testCandle1.low.toString(),
        close: testCandle1.close.toString(),
        volume: testCandle1.volume.toString()
      },
      {
        symbol: testCandle2.symbol,
        timestamp: testCandle2.timestamp,
        open: testCandle2.open.toString(),
        high: testCandle2.high.toString(),
        low: testCandle2.low.toString(),
        close: testCandle2.close.toString(),
        volume: testCandle2.volume.toString()
      }
    ]);

    const query: GetCandlesQuery = {
      symbol: 'BTCUSD',
      start_date: new Date('2024-01-01T10:30:00Z'),
      end_date: new Date('2024-01-01T11:30:00Z'),
      limit: 100
    };

    const results = await getCandles(query);

    expect(results).toHaveLength(1);
    expect(results[0].timestamp).toEqual(testCandle2.timestamp);
  });

  it('should respect limit parameter', async () => {
    // Insert multiple candles
    const candles = [];
    for (let i = 0; i < 5; i++) {
      candles.push({
        symbol: 'BTCUSD',
        timestamp: new Date(`2024-01-01T${10 + i}:00:00Z`),
        open: '50000',
        high: '51000',
        low: '49500',
        close: '50800',
        volume: '1000'
      });
    }

    await db.insert(candlesTable).values(candles);

    const query: GetCandlesQuery = {
      symbol: 'BTCUSD',
      limit: 3
    };

    const results = await getCandles(query);

    expect(results).toHaveLength(3);
  });

  it('should return empty array for non-existent symbol', async () => {
    const query: GetCandlesQuery = {
      symbol: 'NONEXISTENT',
      limit: 100
    };

    const results = await getCandles(query);

    expect(results).toHaveLength(0);
  });
});
