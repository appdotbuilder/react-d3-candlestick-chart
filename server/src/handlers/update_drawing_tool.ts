
import { db } from '../db';
import { drawingToolsTable } from '../db/schema';
import { type UpdateDrawingToolInput, type DrawingTool } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDrawingTool = async (input: UpdateDrawingToolInput): Promise<DrawingTool> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.start_x !== undefined) {
      updateData.start_x = input.start_x.toString();
    }
    if (input.start_y !== undefined) {
      updateData.start_y = input.start_y.toString();
    }
    if (input.end_x !== undefined) {
      updateData.end_x = input.end_x?.toString() || null;
    }
    if (input.end_y !== undefined) {
      updateData.end_y = input.end_y?.toString() || null;
    }
    if (input.color !== undefined) {
      updateData.color = input.color;
    }
    if (input.stroke_width !== undefined) {
      updateData.stroke_width = input.stroke_width;
    }
    if (input.label !== undefined) {
      updateData.label = input.label;
    }

    // Update the drawing tool
    const result = await db.update(drawingToolsTable)
      .set(updateData)
      .where(eq(drawingToolsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Drawing tool not found');
    }

    // Convert numeric fields back to numbers
    const drawingTool = result[0];
    return {
      ...drawingTool,
      start_x: parseFloat(drawingTool.start_x),
      start_y: parseFloat(drawingTool.start_y),
      end_x: drawingTool.end_x ? parseFloat(drawingTool.end_x) : null,
      end_y: drawingTool.end_y ? parseFloat(drawingTool.end_y) : null
    };
  } catch (error) {
    console.error('Drawing tool update failed:', error);
    throw error;
  }
};
