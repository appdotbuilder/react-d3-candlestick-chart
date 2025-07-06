
import { db } from '../db';
import { drawingToolsTable } from '../db/schema';
import { type CreateDrawingToolInput, type DrawingTool } from '../schema';

export const createDrawingTool = async (input: CreateDrawingToolInput): Promise<DrawingTool> => {
  try {
    // Insert drawing tool record
    const result = await db.insert(drawingToolsTable)
      .values({
        symbol: input.symbol,
        tool_type: input.tool_type,
        start_x: input.start_x.toString(), // Convert number to string for numeric column
        start_y: input.start_y.toString(), // Convert number to string for numeric column
        end_x: input.end_x?.toString() || null, // Convert number to string for numeric column, handle null
        end_y: input.end_y?.toString() || null, // Convert number to string for numeric column, handle null
        color: input.color,
        stroke_width: input.stroke_width,
        label: input.label
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const drawingTool = result[0];
    return {
      ...drawingTool,
      start_x: parseFloat(drawingTool.start_x), // Convert string back to number
      start_y: parseFloat(drawingTool.start_y), // Convert string back to number
      end_x: drawingTool.end_x ? parseFloat(drawingTool.end_x) : null, // Convert string back to number, handle null
      end_y: drawingTool.end_y ? parseFloat(drawingTool.end_y) : null // Convert string back to number, handle null
    };
  } catch (error) {
    console.error('Drawing tool creation failed:', error);
    throw error;
  }
};
