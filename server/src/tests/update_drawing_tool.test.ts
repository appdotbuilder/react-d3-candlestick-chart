
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { drawingToolsTable } from '../db/schema';
import { type UpdateDrawingToolInput, type CreateDrawingToolInput } from '../schema';
import { updateDrawingTool } from '../handlers/update_drawing_tool';
import { eq } from 'drizzle-orm';

// Create a test drawing tool first
const createTestDrawingTool = async (): Promise<number> => {
  const testTool: CreateDrawingToolInput = {
    symbol: 'BTCUSD',
    tool_type: 'trend_line',
    start_x: 1000,
    start_y: 50000,
    end_x: 2000,
    end_y: 60000,
    color: '#ff0000',
    stroke_width: 3,
    label: 'Test Line'
  };

  const result = await db.insert(drawingToolsTable)
    .values({
      symbol: testTool.symbol,
      tool_type: testTool.tool_type,
      start_x: testTool.start_x.toString(),
      start_y: testTool.start_y.toString(),
      end_x: testTool.end_x?.toString() || null,
      end_y: testTool.end_y?.toString() || null,
      color: testTool.color,
      stroke_width: testTool.stroke_width,
      label: testTool.label
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateDrawingTool', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update drawing tool coordinates', async () => {
    const toolId = await createTestDrawingTool();

    const updateInput: UpdateDrawingToolInput = {
      id: toolId,
      start_x: 1500,
      start_y: 55000,
      end_x: 2500,
      end_y: 65000
    };

    const result = await updateDrawingTool(updateInput);

    expect(result.id).toEqual(toolId);
    expect(result.start_x).toEqual(1500);
    expect(result.start_y).toEqual(55000);
    expect(result.end_x).toEqual(2500);
    expect(result.end_y).toEqual(65000);
    expect(result.color).toEqual('#ff0000'); // Should keep original color
    expect(result.stroke_width).toEqual(3); // Should keep original stroke width
  });

  it('should update drawing tool styling', async () => {
    const toolId = await createTestDrawingTool();

    const updateInput: UpdateDrawingToolInput = {
      id: toolId,
      color: '#00ff00',
      stroke_width: 5,
      label: 'Updated Line'
    };

    const result = await updateDrawingTool(updateInput);

    expect(result.id).toEqual(toolId);
    expect(result.color).toEqual('#00ff00');
    expect(result.stroke_width).toEqual(5);
    expect(result.label).toEqual('Updated Line');
    expect(result.start_x).toEqual(1000); // Should keep original coordinates
    expect(result.start_y).toEqual(50000);
  });

  it('should handle nullable fields correctly', async () => {
    const toolId = await createTestDrawingTool();

    const updateInput: UpdateDrawingToolInput = {
      id: toolId,
      end_x: null,
      end_y: null,
      label: null
    };

    const result = await updateDrawingTool(updateInput);

    expect(result.id).toEqual(toolId);
    expect(result.end_x).toBeNull();
    expect(result.end_y).toBeNull();
    expect(result.label).toBeNull();
  });

  it('should save updates to database', async () => {
    const toolId = await createTestDrawingTool();

    const updateInput: UpdateDrawingToolInput = {
      id: toolId,
      start_x: 3000,
      color: '#0000ff',
      stroke_width: 1
    };

    await updateDrawingTool(updateInput);

    const tools = await db.select()
      .from(drawingToolsTable)
      .where(eq(drawingToolsTable.id, toolId))
      .execute();

    expect(tools).toHaveLength(1);
    expect(parseFloat(tools[0].start_x)).toEqual(3000);
    expect(tools[0].color).toEqual('#0000ff');
    expect(tools[0].stroke_width).toEqual(1);
  });

  it('should handle partial updates', async () => {
    const toolId = await createTestDrawingTool();

    const updateInput: UpdateDrawingToolInput = {
      id: toolId,
      start_x: 4000
    };

    const result = await updateDrawingTool(updateInput);

    expect(result.id).toEqual(toolId);
    expect(result.start_x).toEqual(4000);
    expect(result.start_y).toEqual(50000); // Should keep original
    expect(result.color).toEqual('#ff0000'); // Should keep original
    expect(result.stroke_width).toEqual(3); // Should keep original
  });

  it('should throw error for non-existent drawing tool', async () => {
    const updateInput: UpdateDrawingToolInput = {
      id: 999999,
      start_x: 1000
    };

    await expect(updateDrawingTool(updateInput)).rejects.toThrow(/drawing tool not found/i);
  });

  it('should handle numeric type conversions correctly', async () => {
    const toolId = await createTestDrawingTool();

    const updateInput: UpdateDrawingToolInput = {
      id: toolId,
      start_x: 1234.5678,
      start_y: 9876.5432
    };

    const result = await updateDrawingTool(updateInput);

    expect(typeof result.start_x).toBe('number');
    expect(typeof result.start_y).toBe('number');
    expect(result.start_x).toEqual(1234.5678);
    expect(result.start_y).toEqual(9876.5432);
  });
});
