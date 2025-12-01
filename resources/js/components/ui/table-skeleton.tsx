import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 5, 
  columns = 8 
}) => {
  return (
    <div className="animate-pulse">
      {/* Table Header Skeleton */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Table Rows Skeleton */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
                  colIndex === 0 ? 'w-3/4' : colIndex === columns - 1 ? 'w-1/2' : 'w-full'
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface DeparturesTableSkeletonProps {
  visibleColumns: {
    trip: boolean;
    date: boolean;
    time: boolean;
    capacity: boolean;
    booked: boolean;
    available: boolean;
    revenue: boolean;
    travelers: boolean;
    bookings: boolean;
    status: boolean;
    source: boolean;
  };
}

export const DeparturesTableSkeleton: React.FC<DeparturesTableSkeletonProps> = ({ 
  visibleColumns 
}) => {
  const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length + 1; // +1 for actions column
  
  return (
    <div className="animate-pulse">
      {/* Table Header */}
      <div className="grid gap-4 pb-3 mb-3 border-b border-gray-200 dark:border-gray-700" 
           style={{ gridTemplateColumns: `repeat(${visibleColumnCount}, 1fr)` }}>
        {visibleColumns.trip && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>}
        {visibleColumns.date && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>}
        {visibleColumns.time && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>}
        {visibleColumns.capacity && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>}
        {visibleColumns.booked && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14"></div>}
        {visibleColumns.available && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>}
        {visibleColumns.revenue && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>}
        {visibleColumns.travelers && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-18"></div>}
        {visibleColumns.bookings && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>}
        {visibleColumns.status && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14"></div>}
        {visibleColumns.source && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14"></div>}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div> {/* Actions */}
      </div>
      
      {/* Table Rows */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4" 
               style={{ gridTemplateColumns: `repeat(${visibleColumnCount}, 1fr)` }}>
            {visibleColumns.trip && (
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            )}
            {visibleColumns.date && (
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            )}
            {visibleColumns.time && (
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            )}
            {visibleColumns.capacity && (
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
            )}
            {visibleColumns.booked && (
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
            )}
            {visibleColumns.available && (
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
            )}
            {visibleColumns.revenue && (
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            )}
            {visibleColumns.travelers && (
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            )}
            {visibleColumns.bookings && (
              <div className="flex gap-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
              </div>
            )}
            {visibleColumns.status && (
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            )}
            {visibleColumns.source && (
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            )}
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
