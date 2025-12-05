/**
 * Simple Bar Chart Component
 * Lightweight bar chart for displaying data
 */

import React from 'react';
import { __ } from '../../lib/i18n';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarData[];
  title: string;
  height?: number;
  showValues?: boolean;
}

/**
 * Simple Bar Chart Component
 */
export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  title,
  height = 200,
  showValues = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        {__('No data available', 'No data available')}
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = height - 60;
  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      )}
      <div className="flex items-end justify-between gap-3" style={{ height: `${chartHeight}px` }}>
        {data.map((item, index) => {
          const ratio = item.value / maxValue;
          // Height in pixels relative to chartHeight, with a strong minimum for non-zero values
          const barPixelHeight = item.value > 0 ? Math.max(ratio * chartHeight, 24) : 0;
          const color = item.color || defaultColors[index % defaultColors.length];
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center group min-w-0">
              <div className="relative w-full flex items-end justify-center mb-3" style={{ height: '100%' }}>
                <div
                  className="w-3/4 max-w-[32px] rounded-t-md transition-all hover:opacity-90 relative group/bar"
                  style={{
                    height: `${barPixelHeight}px`,
                    backgroundColor: color,
                    minHeight: item.value > 0 ? '24px' : '4px',
                  }}
                  title={`${item.label}: ${item.value}`}
                >
                  {showValues && item.value > 0 && (
                    <span
                      className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity"
                    >
                      {item.value}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center truncate w-full px-1">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimpleBarChart;

