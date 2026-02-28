/**
 * Skeleton Loader for AvailabilityForm
 * Shows a skeleton UI while the form data is loading
 */

import React from "react";
import { Card, CardContent, CardHeader } from "../ui/card";

export const AvailabilityFormSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-56 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-80"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>

      {/* Form Skeleton */}
      <div className="space-y-6 animate-pulse">
        {/* Date Information Card */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>

            {/* Location Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-52"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-52"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Availability Card */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-44 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pricing Type Info Box */}
            <div className="p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-80"></div>
                </div>
              </div>
            </div>

            {/* Price Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>

            {/* Inventory Management Section */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-44 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-56"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-44"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                </div>
              </div>
            </div>

            {/* Block Date Section */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-44"></div>
                </div>
              </div>
            </div>

            {/* Status Field */}
            <div className="mt-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14 mb-2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityFormSkeleton;
