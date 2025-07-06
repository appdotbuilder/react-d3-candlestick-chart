
import { useRef, useState, useCallback } from 'react';
import type { Candle, DrawingTool, CreateDrawingToolInput } from '../../../server/src/schema';

interface CandleChartProps {
  candles: Candle[];
  drawingTools: DrawingTool[];
  activeDrawingTool: 'trend_line' | 'support_resistance' | 'rectangle' | 'fibonacci' | null;
  onCreateDrawingTool: (tool: CreateDrawingToolInput) => void;
  symbol: string;
}

interface Point {
  x: number;
  y: number;
}

export function CandleChart({ 
  candles, 
  drawingTools, 
  activeDrawingTool, 
  onCreateDrawingTool,
  symbol 
}: CandleChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<Point | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<Point | null>(null);

  const margin = { top: 20, right: 60, bottom: 40, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.bottom - margin.top;

  // Helper functions for scaling
  const getXScale = useCallback((candles: Candle[]) => {
    if (candles.length === 0) return { min: 0, max: width, scale: () => 0 };
    
    const minTime = Math.min(...candles.map(c => c.timestamp.getTime()));
    const maxTime = Math.max(...candles.map(c => c.timestamp.getTime()));
    const timeRange = maxTime - minTime || 1;
    
    return {
      min: minTime,
      max: maxTime,
      scale: (timestamp: number) => ((timestamp - minTime) / timeRange) * width
    };
  }, [width]);

  const getYScale = useCallback((candles: Candle[]) => {
    if (candles.length === 0) return { min: 0, max: height, scale: () => height, inverse: () => 0 };
    
    const minPrice = Math.min(...candles.map(c => Math.min(c.low, c.high)));
    const maxPrice = Math.max(...candles.map(c => Math.max(c.low, c.high)));
    const priceRange = maxPrice - minPrice || 1;
    const padding = priceRange * 0.1;
    
    return {
      min: minPrice - padding,
      max: maxPrice + padding,
      scale: (price: number) => height - ((price - (minPrice - padding)) / (priceRange + 2 * padding)) * height,
      inverse: (y: number) => (minPrice - padding) + ((height - y) / height) * (priceRange + 2 * padding)
    };
  }, [height]);

  const formatPrice = (price: number): string => `$${price.toFixed(2)}`;
  const formatDate = (date: Date): string => {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const xScale = getXScale(candles);
  const yScale = getYScale(candles);

  const handleMouseDown = (event: React.MouseEvent<SVGRectElement>) => {
    if (!activeDrawingTool) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = event.clientX - rect.left - margin.left;
    const y = event.clientY - rect.top - margin.top;
    
    setIsDrawing(true);
    setDrawingStart({ x, y });
    setCurrentDrawing({ x, y });
  };

  const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
    if (!isDrawing || !drawingStart) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = event.clientX - rect.left - margin.left;
    const y = event.clientY - rect.top - margin.top;
    
    setCurrentDrawing({ x, y });
  };

  const handleMouseUp = (event: React.MouseEvent<SVGRectElement>) => {
    if (!isDrawing || !drawingStart || !activeDrawingTool) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = event.clientX - rect.left - margin.left;
    const y = event.clientY - rect.top - margin.top;
    
    // Convert coordinates to data values
    const startPrice = yScale.inverse(drawingStart.y);
    const endPrice = yScale.inverse(y);
    
    const toolData: CreateDrawingToolInput = {
      symbol,
      tool_type: activeDrawingTool,
      start_x: drawingStart.x,
      start_y: startPrice,
      end_x: x,
      end_y: endPrice,
      color: '#2563eb',
      stroke_width: 2,
      label: null
    };
    
    onCreateDrawingTool(toolData);
    
    setIsDrawing(false);
    setDrawingStart(null);
    setCurrentDrawing(null);
  };

  // Generate grid lines
  const xGridLines = [];
  const yGridLines = [];
  
  for (let i = 0; i <= 10; i++) {
    const x = (width / 10) * i;
    xGridLines.push(x);
    
    const y = (height / 10) * i;
    yGridLines.push(y);
  }

  // Generate axis labels
  const xAxisLabels = [];
  const yAxisLabels = [];
  
  if (candles.length > 0) {
    for (let i = 0; i <= 5; i++) {
      const timeRatio = i / 5;
      const timestamp = xScale.min + (xScale.max - xScale.min) * timeRatio;
      const x = xScale.scale(timestamp);
      xAxisLabels.push({
        x,
        label: formatDate(new Date(timestamp))
      });
    }
    
    for (let i = 0; i <= 5; i++) {
      const priceRatio = i / 5;
      const price = yScale.min + (yScale.max - yScale.min) * priceRatio;
      const y = yScale.scale(price);
      yAxisLabels.push({
        y,
        label: formatPrice(price)
      });
    }
  }

  const candleWidth = Math.max(2, width / Math.max(candles.length, 1) * 0.7);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={svgRef}
        width={width + margin.left + margin.right}
        height={height + margin.top + margin.bottom}
        className="border border-gray-200 rounded-lg bg-white"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.3"/>
          </pattern>
        </defs>
        
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Grid */}
          {xGridLines.map((x, gridIndex) => (
            <line
              key={`x-grid-${gridIndex}`}
              x1={x}
              y1={0}
              x2={x}
              y2={height}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.3"
            />
          ))}
          
          {yGridLines.map((y, gridIndex) => (
            <line
              key={`y-grid-${gridIndex}`}
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.3"
            />
          ))}
          
          {/* Candles */}
          {candles.map((candle) => {
            const x = xScale.scale(candle.timestamp.getTime());
            const yHigh = yScale.scale(candle.high);
            const yLow = yScale.scale(candle.low);
            const yOpen = yScale.scale(candle.open);
            const yClose = yScale.scale(candle.close);
            
            const isGreen = candle.close > candle.open;
            const color = isGreen ? '#22c55e' : '#ef4444';
            
            return (
              <g key={candle.id}>
                {/* High-low line */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={color}
                  strokeWidth="1"
                />
                
                {/* Open-close rectangle */}
                <rect
                  x={x - candleWidth / 2}
                  y={Math.min(yOpen, yClose)}
                  width={candleWidth}
                  height={Math.abs(yClose - yOpen)}
                  fill={isGreen ? color : '#fff'}
                  stroke={color}
                  strokeWidth="1"
                />
                
                {/* Volume bar */}
                <rect
                  x={x - candleWidth / 2}
                  y={height - (candle.volume / 1000000) * 20}
                  width={candleWidth}
                  height={(candle.volume / 1000000) * 20}
                  fill="#94a3b8"
                  opacity="0.3"
                />
              </g>
            );
          })}
          
          {/* Drawing tools */}
          {drawingTools.map((tool) => {
            const startX = tool.start_x;
            const startY = yScale.scale(tool.start_y);
            const endX = tool.end_x || startX;
            const endY = tool.end_y ? yScale.scale(tool.end_y) : startY;

            switch (tool.tool_type) {
              case 'trend_line':
              case 'support_resistance': {
                return (
                  <g key={tool.id}>
                    <line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke={tool.color}
                      strokeWidth={tool.stroke_width}
                      strokeDasharray={tool.tool_type === 'support_resistance' ? '5,5' : 'none'}
                    />
                    {tool.label && (
                      <text
                        x={startX}
                        y={startY - 5}
                        fill={tool.color}
                        fontSize="12"
                      >
                        {tool.label}
                      </text>
                    )}
                  </g>
                );
              }
              
              case 'rectangle': {
                return (
                  <g key={tool.id}>
                    <rect
                      x={Math.min(startX, endX)}
                      y={Math.min(startY, endY)}
                      width={Math.abs(endX - startX)}
                      height={Math.abs(endY - startY)}
                      fill="none"
                      stroke={tool.color}
                      strokeWidth={tool.stroke_width}
                    />
                    {tool.label && (
                      <text
                        x={Math.min(startX, endX)}
                        y={Math.min(startY, endY) - 5}
                        fill={tool.color}
                        fontSize="12"
                      >
                        {tool.label}
                      </text>
                    )}
                  </g>
                );
              }
              
              case 'fibonacci': {
                const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
                const fibHeight = Math.abs(endY - startY);
                return (
                  <g key={tool.id}>
                    {levels.map((level, levelIndex) => {
                      const y = Math.min(startY, endY) + fibHeight * level;
                      return (
                        <g key={levelIndex}>
                          <line
                            x1={Math.min(startX, endX)}
                            x2={Math.max(startX, endX)}
                            y1={y}
                            y2={y}
                            stroke={tool.color}
                            strokeWidth="1"
                            strokeDasharray="2,2"
                            opacity="0.7"
                          />
                          <text
                            x={Math.max(startX, endX) + 5}
                            y={y}
                            dy="0.35em"
                            fill={tool.color}
                            fontSize="10"
                          >
                            {(level * 100).toFixed(1)}%
                          </text>
                        </g>
                      );
                    })}
                    {tool.label && (
                      <text
                        x={startX}
                        y={startY - 5}
                        fill={tool.color}
                        fontSize="12"
                      >
                        {tool.label}
                      </text>
                    )}
                  </g>
                );
              }
              
              default:
                return null;
            }
          })}
          
          {/* Drawing preview */}
          {isDrawing && drawingStart && currentDrawing && activeDrawingTool && (
            <g opacity="0.7">
              {activeDrawingTool === 'trend_line' && (
                <line
                  x1={drawingStart.x}
                  y1={drawingStart.y}
                  x2={currentDrawing.x}
                  y2={currentDrawing.y}
                  stroke="#2563eb"
                  strokeWidth="2"
                />
              )}
              
              {activeDrawingTool === 'support_resistance' && (
                <line
                  x1={drawingStart.x}
                  y1={drawingStart.y}
                  x2={currentDrawing.x}
                  y2={currentDrawing.y}
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}
              
              {activeDrawingTool === 'rectangle' && (
                <rect
                  x={Math.min(drawingStart.x, currentDrawing.x)}
                  y={Math.min(drawingStart.y, currentDrawing.y)}
                  width={Math.abs(currentDrawing.x - drawingStart.x)}
                  height={Math.abs(currentDrawing.y - drawingStart.y)}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                />
              )}
              
              {activeDrawingTool === 'fibonacci' && (
                <g>
                  {[0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map((level, levelIndex) => {
                    const fibHeight = Math.abs(currentDrawing.y - drawingStart.y);
                    const y = Math.min(drawingStart.y, currentDrawing.y) + fibHeight * level;
                    return (
                      <line
                        key={levelIndex}
                        x1={Math.min(drawingStart.x, currentDrawing.x)}
                        x2={Math.max(drawingStart.x, currentDrawing.x)}
                        y1={y}
                        y2={y}
                        stroke="#2563eb"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                    );
                  })}
                </g>
              )}
            </g>
          )}
          
          {/* Interaction overlay */}
          <rect
            width={width}
            height={height}
            fill="transparent"
            style={{ cursor: activeDrawingTool ? 'crosshair' : 'default' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
          
          {/* Axes */}
          <g>
            {/* X-axis */}
            <line
              x1={0}
              y1={height}
              x2={width}
              y2={height}
              stroke="#6b7280"
              strokeWidth="1"
            />
            
            {/* Y-axis */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={height}
              stroke="#6b7280"
              strokeWidth="1"
            />
            
            {/* X-axis labels */}
            {xAxisLabels.map((label, labelIndex) => (
              <text
                key={labelIndex}
                x={label.x}
                y={height + 15}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="12"
              >
                {label.label}
              </text>
            ))}
            
            {/* Y-axis labels */}
            {yAxisLabels.map((label, labelIndex) => (
              <text
                key={labelIndex}
                x={-10}
                y={label.y}
                textAnchor="end"
                dy="0.35em"
                fill="#6b7280"
                fontSize="12"
              >
                {label.label}
              </text>
            ))}
          </g>
        </g>
      </svg>
      
      {activeDrawingTool && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            ✏️ Drawing mode: <strong>{activeDrawingTool.replace('_', ' ')}</strong>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Click and drag on the chart to draw. Click the tool again to exit drawing mode.
          </div>
        </div>
      )}
    </div>
  );
}
