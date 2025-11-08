/**
 * Simple Line Chart Component
 * Lightweight line chart for displaying trends
 * Modular and extensible for Pro version enhancements
 */

import React from 'react';
import { __ } from '../../lib/i18n';

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  title: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
}

/**
 * Simple Line Chart Component
 * Renders a basic line chart using SVG
 */
export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  title,
  height = 200,
  color = '#3b82f6',
  showGrid = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        {__('No data available', 'No data available')}
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  const width = 100;
  const chartHeight = height - 40;
  const padding = 10;

  // Calculate points for the line
  const points = data.map((point, index) => {
    const x = padding + (index * (width - 2 * padding)) / (data.length - 1 || 1);
    const y = chartHeight - padding - ((point.value - minValue) / range) * (chartHeight - 2 * padding);
    return { x, y, value: point.value, label: point.label };
  });

  // Create path for the line
  const pathData = points.map((point, index) => {
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ');

  // Create area path (for fill)
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`;

  return (
    <div className="w-full h-full">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      )}
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines - subtle */}
        {showGrid && (
          <g stroke="#f3f4f6" strokeWidth="0.5" className="dark:stroke-gray-700">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartHeight - padding - (ratio * (chartHeight - 2 * padding));
              return <line key={ratio} x1={padding} y1={y} x2={width - padding} y2={y} />;
            })}
          </g>
        )}

        {/* Area fill - subtle */}
        <path
          d={areaPath}
          fill={color}
          fillOpacity="0.08"
          className="dark:opacity-20"
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="white"
              stroke={color}
              strokeWidth="2"
              className="hover:r-4 transition-all"
            />
            <title>{`${point.label}: ${point.value}`}</title>
          </g>
        ))}

        {/* X-axis labels */}
        {points.map((point, index) => {
          // Show all labels but space them better
          const shouldShow = index === 0 || index === data.length - 1 || index % Math.max(1, Math.floor(data.length / 4)) === 0;
          if (shouldShow) {
            // Split long labels (like "MayJun" -> "May" / "Jun")
            const labelParts = point.label.length > 5 
              ? (point.label.match(/.{1,3}/g) || [point.label])
              : [point.label];
            
            return (
              <g key={index}>
                {labelParts.map((part, partIndex) => (
                  <text
                    key={partIndex}
                    x={point.x}
                    y={chartHeight - 5 + (partIndex * 10)}
                    textAnchor="middle"
                    className="text-xs fill-gray-500 dark:fill-gray-400"
                  >
                    {part}
                  </text>
                ))}
              </g>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

export default SimpleLineChart;

