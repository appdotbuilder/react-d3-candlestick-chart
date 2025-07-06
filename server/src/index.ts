
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createCandleInputSchema, 
  getCandlesQuerySchema, 
  createDrawingToolInputSchema,
  getDrawingToolsQuerySchema,
  updateDrawingToolInputSchema
} from './schema';

// Import handlers
import { createCandle } from './handlers/create_candle';
import { getCandles } from './handlers/get_candles';
import { createDrawingTool } from './handlers/create_drawing_tool';
import { getDrawingTools } from './handlers/get_drawing_tools';
import { updateDrawingTool } from './handlers/update_drawing_tool';
import { deleteDrawingTool } from './handlers/delete_drawing_tool';
import { bulkCreateCandles } from './handlers/bulk_create_candles';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Candle data endpoints
  createCandle: publicProcedure
    .input(createCandleInputSchema)
    .mutation(({ input }) => createCandle(input)),
  
  getCandles: publicProcedure
    .input(getCandlesQuerySchema)
    .query(({ input }) => getCandles(input)),
  
  bulkCreateCandles: publicProcedure
    .input(z.array(createCandleInputSchema))
    .mutation(({ input }) => bulkCreateCandles(input)),
  
  // Drawing tools endpoints
  createDrawingTool: publicProcedure
    .input(createDrawingToolInputSchema)
    .mutation(({ input }) => createDrawingTool(input)),
  
  getDrawingTools: publicProcedure
    .input(getDrawingToolsQuerySchema)
    .query(({ input }) => getDrawingTools(input)),
  
  updateDrawingTool: publicProcedure
    .input(updateDrawingToolInputSchema)
    .mutation(({ input }) => updateDrawingTool(input)),
  
  deleteDrawingTool: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteDrawingTool(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
