
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { drawingToolsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteDrawingTool } from '../handlers/delete_drawing_tool';

describe('deleteDrawingTool', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing drawing tool', async () => {
    // Create a test drawing tool
    const testTool = await db.insert(drawingToolsTable)
      .values({
        symbol: 'BTCUSD',
        tool_type: 'trend_line',
        start_x: '100.0',
        start_y: '50000.0',
        end_x: '200.0',
        end_y: '52000.0',
        color: '#2563eb',
        stroke_width: 2,
        label: 'Test Line'
      })
      .returning()
      .execute();

    const toolId = testTool[0].id;

    // Delete the drawing tool
    const result = await deleteDrawingTool(toolId);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify the tool was deleted from database
    const tools = await db.select()
      .from(drawingToolsTable)
      .where(eq(drawingToolsTable.id, toolId))
      .execute();

    expect(tools).toHaveLength(0);
  });

  it('should return false for non-existent drawing tool', async () => {
    // Try to delete a non-existent tool
    const result = await deleteDrawingTool(999999);

    // Should return false since no record was found
    expect(result).toBe(false);
  });

  it('should not affect other drawing tools', async () => {
    // Create multiple test drawing tools
    const testTool1 = await db.insert(drawingToolsTable)
      .values({
        symbol: 'BTCUSD',
        tool_type: 'trend_line',
        start_x: '100.0',
        start_y: '50000.0',
        end_x: '200.0',
        end_y: '52000.0',
        color: '#2563eb',
        stroke_width: 2,
        label: 'Test Line 1'
      })
      .returning()
      .execute();

    const testTool2 = await db.insert(drawingToolsTable)
      .values({
        symbol: 'ETHUSD',
        tool_type: 'rectangle',
        start_x: '150.0',
        start_y: '3000.0',
        end_x: '250.0',
        end_y: '3500.0',
        color: '#dc2626',
        stroke_width: 3,
        label: 'Test Rectangle'
      })
      .returning()
      .execute();

    // Delete only the first tool
    const result = await deleteDrawingTool(testTool1[0].id);

    expect(result).toBe(true);

    // Verify first tool was deleted
    const deletedTool = await db.select()
      .from(drawingToolsTable)
      .where(eq(drawingToolsTable.id, testTool1[0].id))
      .execute();

    expect(deletedTool).toHaveLength(0);

    // Verify second tool still exists
    const remainingTool = await db.select()
      .from(drawingToolsTable)
      .where(eq(drawingToolsTable.id, testTool2[0].id))
      .execute();

    expect(remainingTool).toHaveLength(1);
    expect(remainingTool[0].label).toBe('Test Rectangle');
  });
});
