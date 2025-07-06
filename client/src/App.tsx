
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CandleChart } from '@/components/CandleChart';
import { DrawingToolsPanel } from '@/components/DrawingToolsPanel';
import { DataPanel } from '@/components/DataPanel';
import { trpc } from '@/utils/trpc';
import type { Candle, DrawingTool, CreateCandleInput, CreateDrawingToolInput } from '../../server/src/schema';

function App() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [drawingTools, setDrawingTools] = useState<DrawingTool[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState<'trend_line' | 'support_resistance' | 'rectangle' | 'fibonacci' | null>(null);

  // Sample symbols for demo
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META'];

  // Generate sample candle data for demonstration
  const generateSampleData = useCallback(() => {
    const sampleCandles: Candle[] = [];
    const now = new Date();
    let basePrice = 150;
    
    for (let i = 30; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const open = basePrice + (Math.random() - 0.5) * 10;
      const volatility = Math.random() * 8 + 2;
      const high = open + Math.random() * volatility;
      const low = open - Math.random() * volatility;
      const close = low + Math.random() * (high - low);
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      sampleCandles.push({
        id: i,
        symbol: selectedSymbol,
        timestamp,
        open,
        high,
        low,
        close,
        volume,
        created_at: timestamp
      });
      
      basePrice = close;
    }
    
    setCandles(sampleCandles);
  }, [selectedSymbol]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [candlesResult, drawingToolsResult] = await Promise.all([
        trpc.getCandles.query({ symbol: selectedSymbol, limit: 100 }),
        trpc.getDrawingTools.query({ symbol: selectedSymbol })
      ]);
      
      setCandles(candlesResult);
      setDrawingTools(drawingToolsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Generate sample data for demonstration since backend is stubbed
      generateSampleData();
    } finally {
      setIsLoading(false);
    }
  }, [selectedSymbol, generateSampleData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateDrawingTool = async (toolData: CreateDrawingToolInput) => {
    try {
      const newTool = await trpc.createDrawingTool.mutate(toolData);
      setDrawingTools(prev => [...prev, newTool]);
    } catch (error) {
      console.error('Failed to create drawing tool:', error);
      // For demo purposes, add tool locally (backend is stubbed)
      const demoTool: DrawingTool = {
        id: Date.now(),
        ...toolData,
        created_at: new Date()
      };
      setDrawingTools(prev => [...prev, demoTool]);
    }
  };

  const handleDeleteDrawingTool = async (toolId: number) => {
    try {
      await trpc.deleteDrawingTool.mutate(toolId);
      setDrawingTools(prev => prev.filter(tool => tool.id !== toolId));
    } catch (error) {
      console.error('Failed to delete drawing tool:', error);
      // For demo purposes, remove tool locally
      setDrawingTools(prev => prev.filter(tool => tool.id !== toolId));
    }
  };

  const handleAddSampleData = async () => {
    const newCandle: CreateCandleInput = {
      symbol: selectedSymbol,
      timestamp: new Date(),
      open: 150 + Math.random() * 20,
      high: 160 + Math.random() * 20,
      low: 140 + Math.random() * 20,
      close: 155 + Math.random() * 20,
      volume: Math.floor(Math.random() * 500000) + 100000
    };

    try {
      const createdCandle = await trpc.createCandle.mutate(newCandle);
      setCandles(prev => [...prev, createdCandle]);
    } catch (error) {
      console.error('Failed to create candle:', error);
    }
  };

  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
  const priceChange = candles.length > 1 ? currentPrice - candles[candles.length - 2].close : 0;
  const priceChangePercent = candles.length > 1 ? (priceChange / candles[candles.length - 2].close) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📈 Trading Chart</h1>
            <p className="text-gray-600">Interactive candle chart with technical analysis tools</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {symbols.map(symbol => (
                  <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={loadData} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? '🔄 Loading...' : '🔄 Refresh'}
            </Button>
          </div>
        </div>

        {/* Price Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${currentPrice.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">{selectedSymbol}</div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={priceChange >= 0 ? "default" : "destructive"}>
                  {priceChange >= 0 ? '📈' : '📉'} 
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
                </Badge>
                <Badge variant={priceChangePercent >= 0 ? "default" : "destructive"}>
                  {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600">
                Volume: {candles.length > 0 ? candles[candles.length - 1].volume.toLocaleString() : '0'}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Drawing Tools Panel */}
          <div className="xl:col-span-1">
            <DrawingToolsPanel
              activeDrawingTool={activeDrawingTool}
              onToolSelect={setActiveDrawingTool}
              drawingTools={drawingTools}
              onDeleteTool={handleDeleteDrawingTool}
            />
          </div>

          {/* Chart */}
          <div className="xl:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 {selectedSymbol} Chart
                  <Badge variant="outline">{candles.length} candles</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CandleChart
                  candles={candles}
                  drawingTools={drawingTools}
                  activeDrawingTool={activeDrawingTool}
                  onCreateDrawingTool={handleCreateDrawingTool}
                  symbol={selectedSymbol}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Data Panel */}
        <div className="mt-6">
          <DataPanel
            candles={candles}
            onAddSampleData={handleAddSampleData}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
