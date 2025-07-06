
import { db } from '../db';
import { drawingToolsTable } from '../db/schema';
import { type GetDrawingToolsQuery, type DrawingTool } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getDrawingTools = async (query: GetDrawingToolsQuery): Promise<DrawingTool[]> => {
  try {
    const results = await db.select()
      .from(drawingToolsTable)
      .where(eq(drawingToolsTable.symbol, query.symbol))
      .orderBy(desc(drawingToolsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(tool => ({
      ...tool,
      start_x: parseFloat(tool.start_x),
      start_y: parseFloat(tool.start_y),
      end_x: tool.end_x ? parseFloat(tool.end_x) : null,
      end_y: tool.end_y ? parseFloat(tool.end_y) : null
    }));
  } catch (error) {
    console.error('Failed to get drawing tools:', error);
    throw error;
  }
};
