
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Candle } from '../../../server/src/schema';

interface DataPanelProps {
  candles: Candle[];
  onAddSampleData: () => void;
  isLoading: boolean;
}

export function DataPanel({ candles, onAddSampleData, isLoading }: DataPanelProps) {
  const stats = candles.length > 0 ? {
    highest: Math.max(...candles.map(c => c.high)),
    lowest: Math.min(...candles.map(c => c.low)),
    avgVolume: candles.reduce((acc, c) => acc + c.volume, 0) / candles.length,
    totalVolume: candles.reduce((acc, c) => acc + c.volume, 0),
  } : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            📊 Market Data
            <Badge variant="outline">{candles.length} candles</Badge>
          </CardTitle>
          
          <Button
            onClick={onAddSampleData}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            {isLoading ? '⏳ Adding...' : '➕ Add Sample Data'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-800">
                ${stats.highest.toFixed(2)}
              </div>
              <div className="text-sm text-green-600">High</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-800">
                ${stats.lowest.toFixed(2)}
              </div>
              <div className="text-sm text-red-600">Low</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-800">
                {stats.avgVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-blue-600">Avg Volume</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-800">
                {stats.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-purple-600">Total Volume</div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="border rounded-lg">
          <ScrollArea className="h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Open</TableHead>
                  <TableHead>High</TableHead>
                  <TableHead>Low</TableHead>
                  <TableHead>Close</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No data available. The backend is using stub data.
                      <br />
                      <span className="text-sm">Sample data has been generated for demonstration.</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  candles.slice().reverse().map((candle: Candle) => {
                    const change = candle.close - candle.open;
                    const changePercent = (change / candle.open) * 100;
                    const isPositive = change >= 0;
                    
                    return (
                      <TableRow key={candle.id}>
                        <TableCell className="font-medium">
                          {candle.timestamp.toLocaleDateString()}
                        </TableCell>
                        <TableCell>${candle.open.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">
                          ${candle.high.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          ${candle.low.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${candle.close.toFixed(2)}
                        </TableCell>
                        <TableCell>{candle.volume.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={isPositive ? "default" : "destructive"}>
                            {isPositive ? '+' : ''}{change.toFixed(2)}
                            ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
