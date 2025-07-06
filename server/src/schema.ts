
import { z } from 'zod';

// Candle data schema for OHLCV (Open, High, Low, Close, Volume)
export const candleSchema = z.object({
  id: z.number(),
  symbol: z.string(),
  timestamp: z.coerce.date(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  created_at: z.coerce.date()
});

export type Candle = z.infer<typeof candleSchema>;

// Input schema for creating candle data
export const createCandleInputSchema = z.object({
  symbol: z.string().min(1),
  timestamp: z.coerce.date(),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().nonnegative()
});

export type CreateCandleInput = z.infer<typeof createCandleInputSchema>;

// Schema for technical analysis drawing tools
export const drawingToolTypeSchema = z.enum(['trend_line', 'support_resistance', 'rectangle', 'fibonacci']);

export const drawingToolSchema = z.object({
  id: z.number(),
  symbol: z.string(),
  tool_type: drawingToolTypeSchema,
  start_x: z.number(), // timestamp or x-coordinate
  start_y: z.number(), // price value
  end_x: z.number().nullable(), // for lines and rectangles
  end_y: z.number().nullable(), // for lines and rectangles
  color: z.string(),
  stroke_width: z.number().default(2),
  label: z.string().nullable(),
  created_at: z.coerce.date()
});

export type DrawingTool = z.infer<typeof drawingToolSchema>;

// Input schema for creating drawing tools
export const createDrawingToolInputSchema = z.object({
  symbol: z.string().min(1),
  tool_type: drawingToolTypeSchema,
  start_x: z.number(),
  start_y: z.number(),
  end_x: z.number().nullable(),
  end_y: z.number().nullable(),
  color: z.string().default('#2563eb'),
  stroke_width: z.number().positive().default(2),
  label: z.string().nullable()
});

export type CreateDrawingToolInput = z.infer<typeof createDrawingToolInputSchema>;

// Input schema for updating drawing tools
export const updateDrawingToolInputSchema = z.object({
  id: z.number(),
  start_x: z.number().optional(),
  start_y: z.number().optional(),
  end_x: z.number().nullable().optional(),
  end_y: z.number().nullable().optional(),
  color: z.string().optional(),
  stroke_width: z.number().positive().optional(),
  label: z.string().nullable().optional()
});

export type UpdateDrawingToolInput = z.infer<typeof updateDrawingToolInputSchema>;

// Query schemas
export const getCandlesQuerySchema = z.object({
  symbol: z.string().min(1),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  limit: z.number().int().positive().max(1000).default(100)
});

export type GetCandlesQuery = z.infer<typeof getCandlesQuerySchema>;

export const getDrawingToolsQuerySchema = z.object({
  symbol: z.string().min(1)
});

export type GetDrawingToolsQuery = z.infer<typeof getDrawingToolsQuerySchema>;
