/**
 * Skeleton Loader for RecurringRuleForm
 * Shows a skeleton UI while the form data is loading
 */

import React from "react";
import { Card, CardContent, CardHeader } from "../ui/card";

export const RecurringRuleFormSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
        </div>
      </div>

      {/* Form Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>

          {/* Recurrence Pattern Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 animate-pulse">
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-44"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Days of Week */}
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-3"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"
                    ></div>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>

              {/* Excluded Dates */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Availability Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 animate-pulse">
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-44"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-80 mt-2 animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing Type Info */}
              <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-72"></div>
                  </div>
                </div>
              </div>

              {/* Price Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>

              {/* Inventory Management */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-44 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time & Location Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 animate-pulse">
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
              </div>
              <div className="flex gap-2 mt-2 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time Slots Header */}
              <div className="flex items-center justify-between animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>

              {/* Empty Time Slots Placeholder */}
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 mx-auto mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto"></div>
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>

              {/* Cutoff Hours */}
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 animate-pulse">
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mt-2 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4 animate-pulse"></div>
              <div className="space-y-2 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-6 bg-gray-200 dark:bg-gray-700 rounded"
                  ></div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3 animate-pulse">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>

          {/* Help Alert */}
          <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringRuleFormSkeleton;
