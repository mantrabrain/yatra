import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { X, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { __ } from '../../lib/i18n';

type SortOrder = 'asc' | 'desc';

interface FilterOption {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
}

interface SearchFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusChange: (filter: string) => void;
  statusOptions: FilterOption[];
  sortBy: string;
  onSortByChange: (field: string) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  sortOptions: SortOption[];
  onResetFilters: () => void;
  hasFilters: boolean;
  placeholder?: string;
}

export const SearchFilterToolbar: React.FC<SearchFilterToolbarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  sortOptions,
  onResetFilters,
  hasFilters,
  placeholder = 'Search...'
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
      {/* Search - give more space on large screens */}
      <div className="relative min-w-0 w-full lg:flex-[3]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="w-full lg:w-48 lg:flex-none"
      >
        {statusOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      {/* Sort By */}
      <Select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
        className="w-full lg:w-48 lg:flex-none"
      >
        {sortOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
            {sortBy === option.value && (
              sortOrder === 'asc' 
                ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-gray-600 dark:text-gray-300" />
                : <ArrowDown className="w-3.5 h-3.5 ml-1 text-gray-600 dark:text-gray-300" />
            )}
          </option>
        ))}
      </Select>

      {/* Sort Order */}
      <Button
        variant="outline"
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        className="h-11 px-4 flex items-center gap-1.5 flex-shrink-0"
        title={sortOrder === 'asc' ? __('Ascending', 'Ascending') : __('Descending', 'Descending')}
      >
        {sortOrder === 'asc' ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
        <span className="text-xs">{sortOrder === 'asc' ? __('Asc', 'Asc') : __('Desc', 'Desc')}</span>
      </Button>

      {/* Reset Button */}
      {hasFilters && (
        <Button
          variant="outline"
          onClick={onResetFilters}
          className="h-11 flex items-center gap-2 flex-shrink-0"
        >
          <X className="w-4 h-4" />
          {__('Reset', 'Reset')}
        </Button>
      )}
    </div>
  );
};
