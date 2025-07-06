
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { drawingToolsTable } from '../db/schema';
import { type GetDrawingToolsQuery, type CreateDrawingToolInput } from '../schema';
import { getDrawingTools } from '../handlers/get_drawing_tools';

// Test data
const btcSymbol = 'BTC/USD';
const ethSymbol = 'ETH/USD';

const testDrawingTool1: CreateDrawingToolInput = {
  symbol: btcSymbol,
  tool_type: 'trend_line',
  start_x: 1640995200, // Unix timestamp (without milliseconds)
  start_y: 47000.50,
  end_x: 1641081600,
  end_y: 48500.25,
  color: '#ff0000',
  stroke_width: 3,
  label: 'Upward trend'
};

const testDrawingTool2: CreateDrawingToolInput = {
  symbol: btcSymbol,
  tool_type: 'support_resistance',
  start_x: 1641168000,
  start_y: 46000.75,
  end_x: null,
  end_y: null,
  color: '#00ff00',
  stroke_width: 2,
  label: 'Support level'
};

const testDrawingTool3: CreateDrawingToolInput = {
  symbol: ethSymbol,
  tool_type: 'rectangle',
  start_x: 1641254400,
  start_y: 3800.25,
  end_x: 1641340800,
  end_y: 4200.75,
  color: '#0000ff',
  stroke_width: 1,
  label: null
};

describe('getDrawingTools', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return drawing tools for a specific symbol', async () => {
    // Create test drawing tools
    await db.insert(drawingToolsTable).values([
      {
        symbol: testDrawingTool1.symbol,
        tool_type: testDrawingTool1.tool_type,
        start_x: testDrawingTool1.start_x.toString(),
        start_y: testDrawingTool1.start_y.toString(),
        end_x: testDrawingTool1.end_x?.toString() || null,
        end_y: testDrawingTool1.end_y?.toString() || null,
        color: testDrawingTool1.color,
        stroke_width: testDrawingTool1.stroke_width,
        label: testDrawingTool1.label
      },
      {
        symbol: testDrawingTool2.symbol,
        tool_type: testDrawingTool2.tool_type,
        start_x: testDrawingTool2.start_x.toString(),
        start_y: testDrawingTool2.start_y.toString(),
        end_x: testDrawingTool2.end_x?.toString() || null,
        end_y: testDrawingTool2.end_y?.toString() || null,
        color: testDrawingTool2.color,
        stroke_width: testDrawingTool2.stroke_width,
        label: testDrawingTool2.label
      },
      {
        symbol: testDrawingTool3.symbol,
        tool_type: testDrawingTool3.tool_type,
        start_x: testDrawingTool3.start_x.toString(),
        start_y: testDrawingTool3.start_y.toString(),
        end_x: testDrawingTool3.end_x?.toString() || null,
        end_y: testDrawingTool3.end_y?.toString() || null,
        color: testDrawingTool3.color,
        stroke_width: testDrawingTool3.stroke_width,
        label: testDrawingTool3.label
      }
    ]).execute();

    const query: GetDrawingToolsQuery = {
      symbol: btcSymbol
    };

    const result = await getDrawingTools(query);

    expect(result).toHaveLength(2);
    
    // Check that all returned tools belong to the correct symbol
    result.forEach(tool => {
      expect(tool.symbol).toEqual(btcSymbol);
    });

    // Check numeric type conversions
    expect(typeof result[0].start_x).toBe('number');
    expect(typeof result[0].start_y).toBe('number');
    
    // Check that nullable numeric fields are handled correctly
    const trendLineTool = result.find(tool => tool.tool_type === 'trend_line');
    expect(trendLineTool).toBeDefined();
    expect(typeof trendLineTool!.end_x).toBe('number');
    expect(typeof trendLineTool!.end_y).toBe('number');

    const supportTool = result.find(tool => tool.tool_type === 'support_resistance');
    expect(supportTool).toBeDefined();
    expect(supportTool!.end_x).toBeNull();
    expect(supportTool!.end_y).toBeNull();
  });

  it('should return empty array when no drawing tools exist for symbol', async () => {
    const query: GetDrawingToolsQuery = {
      symbol: 'NONEXISTENT/SYMBOL'
    };

    const result = await getDrawingTools(query);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return tools ordered by creation date descending', async () => {
    // Create tools with different timestamps
    const tool1 = await db.insert(drawingToolsTable).values({
      symbol: btcSymbol,
      tool_type: 'trend_line',
      start_x: '1000',
      start_y: '100',
      end_x: null,
      end_y: null,
      color: '#ff0000',
      stroke_width: 2,
      label: 'First tool'
    }).returning().execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const tool2 = await db.insert(drawingToolsTable).values({
      symbol: btcSymbol,
      tool_type: 'rectangle',
      start_x: '2000',
      start_y: '200',
      end_x: '3000',
      end_y: '300',
      color: '#00ff00',
      stroke_width: 1,
      label: 'Second tool'
    }).returning().execute();

    const query: GetDrawingToolsQuery = {
      symbol: btcSymbol
    };

    const result = await getDrawingTools(query);

    expect(result).toHaveLength(2);
    
    // Check that results are ordered by creation date descending (newest first)
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
    expect(result[0].label).toEqual('Second tool');
    expect(result[1].label).toEqual('First tool');
  });

  it('should handle all drawing tool types correctly', async () => {
    const toolTypes = ['trend_line', 'support_resistance', 'rectangle', 'fibonacci'] as const;
    
    // Create one tool of each type
    for (const toolType of toolTypes) {
      await db.insert(drawingToolsTable).values({
        symbol: btcSymbol,
        tool_type: toolType,
        start_x: '1000',
        start_y: '100',
        end_x: toolType === 'rectangle' ? '2000' : null,
        end_y: toolType === 'rectangle' ? '200' : null,
        color: '#ffffff',
        stroke_width: 1,
        label: `${toolType} tool`
      }).execute();
    }

    const query: GetDrawingToolsQuery = {
      symbol: btcSymbol
    };

    const result = await getDrawingTools(query);

    expect(result).toHaveLength(4);
    
    // Check that all tool types are represented
    const resultToolTypes = result.map(tool => tool.tool_type);
    toolTypes.forEach(toolType => {
      expect(resultToolTypes).toContain(toolType);
    });
  });
});
