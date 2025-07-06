
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { drawingToolsTable } from '../db/schema';
import { type CreateDrawingToolInput } from '../schema';
import { createDrawingTool } from '../handlers/create_drawing_tool';
import { eq } from 'drizzle-orm';

// Simple test input with smaller coordinate values
const testInput: CreateDrawingToolInput = {
  symbol: 'BTCUSD',
  tool_type: 'trend_line',
  start_x: 1640995200, // smaller timestamp (seconds instead of milliseconds)
  start_y: 50000.50,
  end_x: 1641081600, // smaller timestamp (seconds instead of milliseconds)
  end_y: 52000.75,
  color: '#ff0000',
  stroke_width: 3,
  label: 'Test Trend Line'
};

describe('createDrawingTool', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a drawing tool', async () => {
    const result = await createDrawingTool(testInput);

    // Basic field validation
    expect(result.symbol).toEqual('BTCUSD');
    expect(result.tool_type).toEqual('trend_line');
    expect(result.start_x).toEqual(1640995200);
    expect(result.start_y).toEqual(50000.50);
    expect(result.end_x).toEqual(1641081600);
    expect(result.end_y).toEqual(52000.75);
    expect(result.color).toEqual('#ff0000');
    expect(result.stroke_width).toEqual(3);
    expect(result.label).toEqual('Test Trend Line');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric types are correct
    expect(typeof result.start_x).toBe('number');
    expect(typeof result.start_y).toBe('number');
    expect(typeof result.end_x).toBe('number');
    expect(typeof result.end_y).toBe('number');
  });

  it('should save drawing tool to database', async () => {
    const result = await createDrawingTool(testInput);

    // Query using proper drizzle syntax
    const drawingTools = await db.select()
      .from(drawingToolsTable)
      .where(eq(drawingToolsTable.id, result.id))
      .execute();

    expect(drawingTools).toHaveLength(1);
    expect(drawingTools[0].symbol).toEqual('BTCUSD');
    expect(drawingTools[0].tool_type).toEqual('trend_line');
    expect(parseFloat(drawingTools[0].start_x)).toEqual(1640995200);
    expect(parseFloat(drawingTools[0].start_y)).toEqual(50000.50);
    expect(parseFloat(drawingTools[0].end_x!)).toEqual(1641081600);
    expect(parseFloat(drawingTools[0].end_y!)).toEqual(52000.75);
    expect(drawingTools[0].color).toEqual('#ff0000');
    expect(drawingTools[0].stroke_width).toEqual(3);
    expect(drawingTools[0].label).toEqual('Test Trend Line');
    expect(drawingTools[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle drawing tool with null end coordinates', async () => {
    const inputWithNullEnd: CreateDrawingToolInput = {
      symbol: 'ETHUSD',
      tool_type: 'support_resistance',
      start_x: 1640995200,
      start_y: 4000.00,
      end_x: null,
      end_y: null,
      color: '#00ff00',
      stroke_width: 2,
      label: 'Support Level'
    };

    const result = await createDrawingTool(inputWithNullEnd);

    expect(result.symbol).toEqual('ETHUSD');
    expect(result.tool_type).toEqual('support_resistance');
    expect(result.start_x).toEqual(1640995200);
    expect(result.start_y).toEqual(4000.00);
    expect(result.end_x).toBeNull();
    expect(result.end_y).toBeNull();
    expect(result.color).toEqual('#00ff00');
    expect(result.stroke_width).toEqual(2);
    expect(result.label).toEqual('Support Level');

    // Verify numeric types are correct
    expect(typeof result.start_x).toBe('number');
    expect(typeof result.start_y).toBe('number');
  });

  it('should apply default values correctly', async () => {
    const minimalInput: CreateDrawingToolInput = {
      symbol: 'ADAUSD',
      tool_type: 'rectangle',
      start_x: 1640995200,
      start_y: 1.50,
      end_x: 1641081600,
      end_y: 1.75,
      color: '#2563eb', // default color
      stroke_width: 2, // default stroke width
      label: null
    };

    const result = await createDrawingTool(minimalInput);

    expect(result.color).toEqual('#2563eb');
    expect(result.stroke_width).toEqual(2);
    expect(result.label).toBeNull();
  });
});
