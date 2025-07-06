
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';

// Enum for drawing tool types
export const drawingToolTypeEnum = pgEnum('drawing_tool_type', ['trend_line', 'support_resistance', 'rectangle', 'fibonacci']);

// Candle data table for OHLCV data
export const candlesTable = pgTable('candles', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  open: numeric('open', { precision: 20, scale: 8 }).notNull(),
  high: numeric('high', { precision: 20, scale: 8 }).notNull(),
  low: numeric('low', { precision: 20, scale: 8 }).notNull(),
  close: numeric('close', { precision: 20, scale: 8 }).notNull(),
  volume: numeric('volume', { precision: 20, scale: 8 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Drawing tools table for technical analysis annotations
export const drawingToolsTable = pgTable('drawing_tools', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull(),
  tool_type: drawingToolTypeEnum('tool_type').notNull(),
  start_x: numeric('start_x', { precision: 20, scale: 8 }).notNull(), // timestamp or x-coordinate
  start_y: numeric('start_y', { precision: 20, scale: 8 }).notNull(), // price value
  end_x: numeric('end_x', { precision: 20, scale: 8 }), // for lines and rectangles
  end_y: numeric('end_y', { precision: 20, scale: 8 }), // for lines and rectangles
  color: text('color').notNull().default('#2563eb'),
  stroke_width: integer('stroke_width').notNull().default(2),
  label: text('label'), // optional text label
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Candle = typeof candlesTable.$inferSelect;
export type NewCandle = typeof candlesTable.$inferInsert;
export type DrawingTool = typeof drawingToolsTable.$inferSelect;
export type NewDrawingTool = typeof drawingToolsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  candles: candlesTable,
  drawingTools: drawingToolsTable
};
