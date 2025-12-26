/**
 * Day Form Fields Component
 * Displays the form fields for creating/editing a day
 */

import React from 'react';
import { Info, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { SearchableSelect } from '../ui/searchable-select';
import { HelpText } from '../ui/help-text';
import { __ } from '../../lib/i18n';

interface DayFormFieldsProps {
  formData: {
    trip_id: string;
    day: string;
    day_title: string;
    day_description: string;
  };
  errors: Record<string, string>;
  tripsData: any[];
  isLoadingTrips: boolean;
  isEditMode?: boolean; // If true, disable trip field
  isSingleDayTrip?: boolean; // If true, hide/disable day number field
  onFieldChange: (field: keyof DayFormFieldsProps['formData'], value: any) => void;
}
 export const DayFormFields: React.FC<DayFormFieldsProps> = ({
  formData,
  errors,
  tripsData,
  isLoadingTrips,
  isEditMode = false,
  isSingleDayTrip = false,
  onFieldChange,
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{__('Day Information', 'Day Information')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="trip_id" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {__('Trip', 'Trip')} <span className="text-red-500">*</span>
              {isEditMode && (
                <span title={__('This field cannot be changed in edit mode', 'This field cannot be changed in edit mode')}>
                  <Lock className="w-4 h-4 text-gray-400" />
                </span>
              )}
            </label>
            <HelpText 
              text={isEditMode 
                ? __('The trip cannot be changed when editing a day.', 'The trip cannot be changed when editing a day.')
                : __('Select the trip this day belongs to.', 'Select the trip this day belongs to.')
              }
              className="mb-2"
            />
            <div className="relative">
              <SearchableSelect
                value={formData.trip_id}
                onChange={(value) => onFieldChange('trip_id', value)}
                options={[
                  { value: '', label: __('-- Select a Trip --', '-- Select a Trip --') },
                  ...((Array.isArray(tripsData) ? tripsData : []).map((trip: any) => ({
                    value: trip.id.toString(),
                    label: `${trip.title || trip.name || ''}${trip.trip_type === 'single_day' ? ' (Single Day)' : trip.trip_type === 'multi_day' ? ' (Multi-Day)' : ''}`,
                  })) || [])
                ]}
                placeholder={__('Search or select a trip...', 'Search or select a trip...')}
                searchPlaceholder={__('Search by trip name or ID...', 'Search by trip name or ID...')}
                className={errors.trip_id ? 'border-red-500' : ''}
                error={!!errors.trip_id}
                required
                disabled={isLoadingTrips || isEditMode}
              />
              {isEditMode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
            {errors.trip_id && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <Info className="w-4 h-4" />
                {errors.trip_id}
              </p>
            )}
          </div>

          {!isSingleDayTrip && (
            <div>
              <label htmlFor="day" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {__('Day Number', 'Day Number')} <span className="text-red-500">*</span>
              </label>
              <HelpText 
                text={__('Which day number is this in the itinerary?', 'Which day number is this in the itinerary?')}
                className="mb-2"
              />
              <Input
                id="day"
                type="number"
                min="1"
                value={formData.day}
                onChange={(e) => onFieldChange('day', e.target.value)}
                className={errors.day ? 'border-red-500' : ''}
                required
              />
              {errors.day && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  {errors.day}
                </p>
              )}
            </div>
          )}
          {isSingleDayTrip && (
            <div>
              <label htmlFor="day" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {__('Entry Number', 'Entry Number')} <span className="text-red-500">*</span>
              </label>
              <HelpText 
                text={__('Entry number for ordering entries in this single-day trip.', 'Entry number for ordering entries in this single-day trip.')}
                className="mb-2"
              />
              <Input
                id="day"
                type="number"
                min="1"
                value={formData.day}
                onChange={(e) => onFieldChange('day', e.target.value)}
                className={errors.day ? 'border-red-500' : ''}
                required
              />
              {errors.day && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  {errors.day}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="day_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {__('Day Title (Optional)', 'Day Title (Optional)')}
          </label>
          <HelpText 
            text={__('A descriptive title for this day (e.g., "Arrival & Welcome to Paradise").', 'A descriptive title for this day (e.g., "Arrival & Welcome to Paradise").')}
            className="mb-2"
          />
          <Input
            id="day_title"
            type="text"
            value={formData.day_title}
            onChange={(e) => onFieldChange('day_title', e.target.value)}
            placeholder={__('e.g., Arrival & Welcome to Paradise', 'e.g., Arrival & Welcome to Paradise')}
          />
        </div>

        <div>
          <label htmlFor="day_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {__('Day Description (Optional)', 'Day Description (Optional)')}
          </label>
          <HelpText 
            text={__('A detailed description of what happens on this day, activities, highlights, etc.', 'A detailed description of what happens on this day, activities, highlights, etc.')}
            className="mb-2"
          />
          <textarea
            id="day_description"
            value={formData.day_description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onFieldChange('day_description', e.target.value)}
            placeholder={__('Describe the activities, highlights, and details for this day...', 'Describe the activities, highlights, and details for this day...')}
            rows={4}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.day_description ? 'border-red-500' : ''}`}
          />
          {errors.day_description && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <Info className="w-4 h-4" />
              {errors.day_description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

