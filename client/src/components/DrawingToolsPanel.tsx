
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DrawingTool } from '../../../server/src/schema';

interface DrawingToolsPanelProps {
  activeDrawingTool: 'trend_line' | 'support_resistance' | 'rectangle' | 'fibonacci' | null;
  onToolSelect: (tool: 'trend_line' | 'support_resistance' | 'rectangle' | 'fibonacci' | null) => void;
  drawingTools: DrawingTool[];
  onDeleteTool: (toolId: number) => void;
}

export function DrawingToolsPanel({ 
  activeDrawingTool, 
  onToolSelect, 
  drawingTools, 
  onDeleteTool 
}: DrawingToolsPanelProps) {
  
  const tools = [
    { id: 'trend_line', name: 'Trend Line', icon: '📈', description: 'Draw trend lines' },
    { id: 'support_resistance', name: 'Support/Resistance', icon: '📊', description: 'Mark support/resistance levels' },
    { id: 'rectangle', name: 'Rectangle', icon: '⬜', description: 'Draw rectangular areas' },
    { id: 'fibonacci', name: 'Fibonacci', icon: '🌀', description: 'Fibonacci retracement levels' }
  ] as const;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎨 Drawing Tools
          <Badge variant="outline">{drawingTools.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tool Selection */}
        <div className="space-y-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeDrawingTool === tool.id ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
              onClick={() => onToolSelect(activeDrawingTool === tool.id ? null : tool.id)}
            >
              <span className="mr-2">{tool.icon}</span>
              {tool.name}
            </Button>
          ))}
        </div>

        {activeDrawingTool && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800">
              Drawing: {tools.find(t => t.id === activeDrawingTool)?.name}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Click and drag on the chart to draw
            </div>
          </div>
        )}

        <Separator />

        {/* Existing Tools */}
        <div>
          <h4 className="text-sm font-medium mb-2">📋 Active Tools</h4>
          
          {drawingTools.length === 0 ? (
            <p className="text-sm text-gray-500">No drawing tools yet</p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {drawingTools.map((tool: DrawingTool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {tools.find(t => t.id === tool.tool_type)?.icon}
                      </span>
                      <div>
                        <div className="text-xs font-medium">
                          {tool.tool_type.replace('_', ' ')}
                        </div>
                        {tool.label && (
                          <div className="text-xs text-gray-500">
                            {tool.label}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tool.color }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTool(tool.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator />

        {/* Instructions */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="font-medium">💡 How to use:</div>
          <div>• Select a drawing tool above</div>
          <div>• Click and drag on the chart</div>
          <div>• Click the tool again to exit drawing mode</div>
        </div>
      </CardContent>
    </Card>
  );
}
