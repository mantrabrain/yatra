import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

export interface BookingStatusPoint {
  label: string;
  value: number;
  color: string;
}

interface BookingStatusChartProps {
  data: BookingStatusPoint[];
}

const BookingStatusChart: React.FC<BookingStatusChartProps> = ({ data }) => {
  const safeData = Array.isArray(data) ? data : [];

  const total = safeData.reduce((sum, item) => sum + (item.value || 0), 0);
  if (!safeData.length || total <= 0) {
    return (
      <div className="flex items-center justify-center h-[140px] text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  // Enrich data with percentage for legend/tooltip
  const chartData = safeData.map((item) => ({
    ...item,
    percent: total > 0 ? (item.value / total) * 100 : 0,
  }));

  const renderLegend: React.FC<any> = ({ payload }) => {
    if (!payload || !payload.length) return null;
    return (
      <div className="flex flex-col gap-1 text-xs sm:text-sm ml-4">
        {payload.map((entry: any, index: number) => {
          const color = entry.color;
          const label = entry.value as string;
          const percent = entry.payload?.percent ?? 0;
          const displayPercent = `${percent.toFixed(1)}%`;
          return (
            <div key={index} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
              <span className="ml-auto font-medium text-gray-900 dark:text-white">
                {displayPercent}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full" style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            cx="40%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, _: any, item: any) => `${item.payload.percent.toFixed(1)}%`}
            contentStyle={{ fontFamily: 'inherit', fontSize: 11 }}
          />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            wrapperStyle={{ fontFamily: 'inherit', fontSize: 11 }}
            content={renderLegend}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BookingStatusChart;
