/**
 * Stat Card Component
 * Ultra-minimal SaaS-style stat card
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange';
  loading?: boolean;
}

/**
 * Stat Card Component - Ultra minimal design
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  loading = false,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700/50 p-4 hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {value}
            </p>
          )}
          {trend && !loading && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                vs last month
              </span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50`}>
          <Icon className={`w-4 h-4 ${
            color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
            color === 'green' ? 'text-green-600 dark:text-green-400' :
            color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
            'text-orange-600 dark:text-orange-400'
          }`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
