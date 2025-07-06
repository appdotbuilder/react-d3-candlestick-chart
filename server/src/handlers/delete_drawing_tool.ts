
import { db } from '../db';
import { drawingToolsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteDrawingTool = async (id: number): Promise<boolean> => {
  try {
    // Delete the drawing tool by ID
    const result = await db.delete(drawingToolsTable)
      .where(eq(drawingToolsTable.id, id))
      .returning({ id: drawingToolsTable.id })
      .execute();

    // Return true if a record was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Drawing tool deletion failed:', error);
    throw error;
  }
};
