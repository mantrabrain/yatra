import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { normalizeCurrencyPosition } from "../../lib/currency-display";

export interface BookingsOverviewPoint {
  label: string;
  count: number;
  amount: number;
}

interface BookingsOverviewChartProps {
  data: BookingsOverviewPoint[];
  currency: string;
  currencyPosition?: string;
  currencyDecimals?: number;
}

const BookingsOverviewChart: React.FC<BookingsOverviewChartProps> = ({
  data,
  currency,
  currencyPosition = "left",
  currencyDecimals = 2,
}) => {
  const currencySymbolMap: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    GHS: "₵",
    AUD: "A$",
    CAD: "C$",
  };

  const symbol = currencySymbolMap[currency] || currency || "";

  const formatAmount = (value: number, { compact }: { compact: boolean }) => {
    const v = Number(value) || 0;
    const decimals = Math.max(0, Math.min(4, currencyDecimals));

    const formatCore = (num: number, useK: boolean) => {
      if (compact && useK && Math.abs(num) >= 1000) {
        const base = (num / 1000).toFixed(1);
        return `${base}k`;
      }
      return num.toFixed(decimals);
    };

    const useK = compact;
    const core = formatCore(v, useK);
    const mode = normalizeCurrencyPosition(currencyPosition);

    switch (mode) {
      case "right":
        return `${core}${symbol}`;
      case "left_space":
        return `${symbol} ${core}`;
      case "right_space":
        return `${core} ${symbol}`;
      case "left":
      default:
        return `${symbol}${core}`;
    }
  };
  const safeData = Array.isArray(data)
    ? data.map((d) => ({
        month: d.label,
        bookings: d.count ?? 0,
        amount: d.amount ?? 0,
      }))
    : [];

  if (!safeData.length) {
    return (
      <div className="flex items-center justify-center h-[140px] text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={safeData}
          margin={{ top: 16, right: 16, left: 24, bottom: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontFamily: "inherit", fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis
            yAxisId="left"
            allowDecimals={false}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            tick={{ fontFamily: "inherit", fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) =>
              formatAmount(value, { compact: true })
            }
            tick={{ fontFamily: "inherit", fontSize: 11, fill: "#6b7280" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
            formatter={(value: any, name: any) => {
              if (name === "Bookings") {
                return [value, "Bookings"];
              }
              if (name === "Amount") {
                const formatted = formatAmount(Number(value) || 0, {
                  compact: false,
                });
                return [formatted, "Amount"];
              }
              return [value, name];
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="bookings"
            name="Bookings"
            radius={[4, 4, 0, 0]}
            fill="#3b82f6"
          />
          <Bar
            yAxisId="right"
            dataKey="amount"
            name="Amount"
            radius={[4, 4, 0, 0]}
            fill="#10b981"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BookingsOverviewChart;
