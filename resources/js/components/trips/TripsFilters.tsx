/**
 * Trips Filters Component
 * Modular filter component for trips
 */

import React from 'react';
import { __ } from '../../lib/i18n';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { Search, X } from 'lucide-react';

interface TripsFiltersProps {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
}

/**
 * Trips Filters Component
 */
export const TripsFilters: React.FC<TripsFiltersProps> = ({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onReset,
}) => {
  const hasFilters = search || status !== 'all';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder={__('Search trips...', 'Search trips...')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full md:w-48"
        >
          <option value="all">{__('All Status', 'All Status')}</option>
          <option value="active">{__('Active', 'Active')}</option>
          <option value="draft">{__('Draft', 'Draft')}</option>
          <option value="inactive">{__('Inactive', 'Inactive')}</option>
        </Select>

        {hasFilters && (
          <Button
            variant="outline"
            onClick={onReset}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            {__('Reset', 'Reset')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TripsFilters;

