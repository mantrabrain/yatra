/**
 * Simple Pie Chart Component
 * Lightweight pie/donut chart for displaying proportions
 */

import React from 'react';
import { __ } from '../../lib/i18n';

interface PieData {
  label: string;
  value: number;
  color: string;
}

interface SimplePieChartProps {
  data: PieData[];
  title: string;
  size?: number;
  showLegend?: boolean;
  donut?: boolean;
}

/**
 * Simple Pie Chart Component
 */
export const SimplePieChart: React.FC<SimplePieChartProps> = ({
  data,
  title,
  size = 200,
  showLegend = true,
  donut = false,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        {__('No data available', 'yatra')}
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        {__('No data available', 'yatra')}
      </div>
    );
  }
  const center = size / 2;
  const radius = donut ? size / 3 : size / 2 - 10;
  const innerRadius = donut ? size / 4 : 0;

  let currentAngle = -90; // Start from top

  const paths = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Calculate arc path
    const startX = center + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = center + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = center + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = center + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    let pathData = '';
    if (donut && innerRadius > 0) {
      // Donut chart
      const innerStartX = center + innerRadius * Math.cos((startAngle * Math.PI) / 180);
      const innerStartY = center + innerRadius * Math.sin((startAngle * Math.PI) / 180);
      const innerEndX = center + innerRadius * Math.cos((endAngle * Math.PI) / 180);
      const innerEndY = center + innerRadius * Math.sin((endAngle * Math.PI) / 180);

      pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} L ${innerEndX} ${innerEndY} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY} Z`;
    } else {
      // Regular pie chart
      pathData = `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
    }

    currentAngle += angle;

    return {
      path: pathData,
      color: item.color,
      label: item.label,
      value: item.value,
      percentage: percentage.toFixed(1),
    };
  });

  return (
    <div className="w-full h-full">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      )}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {paths.map((path, index) => (
            <path
              key={index}
              d={path.path}
              fill={path.color}
              stroke="#fff"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <title>{`${path.label}: ${path.value} (${path.percentage}%)`}</title>
            </path>
          ))}
        </svg>

        {showLegend && (
          <div className="flex flex-col gap-2">
            {paths.map((path, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: path.color }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {path.label}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white ml-auto">
                  {path.percentage}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplePieChart;

