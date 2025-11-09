/**
 * Shared Itinerary Entry Fields Component
 * Reusable form fields for itinerary entries - used by both ItineraryForm and ItinerarySection
 */

import React from 'react';
import { MapPin, Clock, DollarSign, X, Plus, Info } from 'lucide-react';
import { __ } from '../../../lib/i18n';
import { ItineraryEntry } from '../types';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { HelpText } from '../../ui/help-text';
import { Card, CardContent } from '../../ui/card';

interface ItineraryEntryFieldsProps {
  entry: Partial<ItineraryEntry>;
  errors?: Record<string, string>;
  itemTypes: Array<{ id: number; name: string; icon?: string }>;
  items: Array<{ id: number; name: string; type_id: number }>;
  newIncludedItem?: string;
  newExcludedItem?: string;
  onFieldChange: (field: keyof ItineraryEntry, value: any) => void;
  onIncludedItemChange?: (value: string) => void;
  onExcludedItemChange?: (value: string) => void;
  onAddIncludedItem?: () => void;
  onAddExcludedItem?: () => void;
  onRemoveIncludedItem?: (index: number) => void;
  onRemoveExcludedItem?: (index: number) => void;
  calculateDuration?: (startTime: string, endTime: string, timeType: string) => string;
  size?: 'default' | 'compact';
  showCardWrapper?: boolean;
}

export const ItineraryEntryFields: React.FC<ItineraryEntryFieldsProps> = ({
  entry,
  errors = {},
  itemTypes,
  items,
  newIncludedItem = '',
  newExcludedItem = '',
  onFieldChange,
  onIncludedItemChange,
  onExcludedItemChange,
  onAddIncludedItem,
  onAddExcludedItem,
  onRemoveIncludedItem,
  onRemoveExcludedItem,
  calculateDuration,
  size = 'default',
  showCardWrapper = false,
}) => {
  const isCompact = size === 'compact';
  const textSize = isCompact ? 'text-xs' : 'text-sm';
  const labelSize = isCompact ? 'text-xs' : 'text-sm';
  const autoDuration = calculateDuration 
    ? calculateDuration(entry.start_time || '', entry.end_time || '', entry.time_type || 'exact')
    : '';

  const renderField = (content: React.ReactNode) => {
    if (showCardWrapper) {
      return (
        <Card>
          <CardContent className="space-y-3">
            {content}
          </CardContent>
        </Card>
      );
    }
    return <div className="space-y-3">{content}</div>;
  };

  const content = (
    <>
      {/* Basic Information */}
      <div className="space-y-3">
        {!isCompact && (
          <h5 className={`${labelSize} font-semibold text-gray-900 dark:text-white`}>
            {__('Basic Information', 'Basic Information')}
          </h5>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}>
              {__('Item Type', 'Item Type')} <span className="text-red-500">*</span>
            </label>
            <HelpText 
              text={__('Select the type of item (Activity, Meal, Accommodation, etc.).', 'Select the type of item (Activity, Meal, Accommodation, etc.).')}
              className="mb-2"
            />
            <Select
              value={entry.item_type_id || ''}
              onChange={(e) => {
                onFieldChange('item_type_id', e.target.value);
                // Reset item_id when type changes
                onFieldChange('item_id', '');
              }}
              className={`${errors.item_type_id ? 'border-red-500' : ''} ${textSize}`}
              required
            >
              <option value="">{__('Select a type...', 'Select a type...')}</option>
              {itemTypes.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
            {errors.item_type_id && (
              <p className={`mt-1.5 ${textSize} text-red-600 dark:text-red-400 flex items-center gap-1`}>
                <Info className="w-4 h-4" />
                {errors.item_type_id}
              </p>
            )}
          </div>

          <div>
            <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}>
              {__('Item', 'Item')} <span className="text-red-500">*</span>
            </label>
            <HelpText 
              text={__('Select the specific item (Hiking, Lunch, Bus, etc.).', 'Select the specific item (Hiking, Lunch, Bus, etc.).')}
              className="mb-2"
            />
            <Select
              value={entry.item_id || ''}
              onChange={(e) => onFieldChange('item_id', e.target.value)}
              disabled={!entry.item_type_id || items.length === 0}
              className={`${errors.item_id ? 'border-red-500' : ''} ${textSize}`}
              required
            >
              <option value="">
                {!entry.item_type_id 
                  ? __('Select type first...', 'Select type first...')
                  : items.length === 0
                  ? __('No items available', 'No items available')
                  : __('Select an item...', 'Select an item...')}
              </option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            {errors.item_id && (
              <p className={`mt-1.5 ${textSize} text-red-600 dark:text-red-400 flex items-center gap-1`}>
                <Info className="w-4 h-4" />
                {errors.item_id}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}>
            {__('Entry Title', 'Entry Title')} <span className="text-red-500">*</span>
          </label>
          <HelpText 
            text={__('A descriptive title for this itinerary entry. Examples: "Arrival in Kathmandu", "Trek to Base Camp".', 'A descriptive title for this itinerary entry. Examples: "Arrival in Kathmandu", "Trek to Base Camp".')}
            className="mb-2"
          />
          <Input
            type="text"
            value={entry.title || ''}
            onChange={(e) => onFieldChange('title', e.target.value)}
            placeholder={__('e.g., Arrival in Kathmandu', 'e.g., Arrival in Kathmandu')}
            className={`${errors.title ? 'border-red-500' : ''} ${textSize}`}
            required
          />
          {errors.title && (
            <p className={`mt-1.5 ${textSize} text-red-600 dark:text-red-400 flex items-center gap-1`}>
              <Info className="w-4 h-4" />
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}>
            {__('Description', 'Description')}
          </label>
          <HelpText 
            text={__('Detailed description of what happens during this itinerary entry.', 'Detailed description of what happens during this itinerary entry.')}
            className="mb-2"
          />
          <textarea
            value={entry.description || ''}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder={__('Describe what happens during this entry...', 'Describe what happens during this entry...')}
            rows={isCompact ? 2 : 4}
            className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 ${textSize} ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none`}
          />
        </div>
      </div>

      {/* Location & Time */}
      <div className={`space-y-3 ${!isCompact ? 'pt-3 border-t border-gray-200 dark:border-gray-700' : ''}`}>
        {!isCompact && (
          <h5 className={`${labelSize} font-semibold text-gray-900 dark:text-white`}>
            {__('Location & Time', 'Location & Time')}
          </h5>
        )}

        <div>
          <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}>
            {__('Location', 'Location')}
          </label>
          <HelpText 
            text={__('Where does this activity take place? (e.g., "Resort restaurant", "Private beach")', 'Where does this activity take place? (e.g., "Resort restaurant", "Private beach")')}
            className="mb-2"
          />
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              value={entry.location || ''}
              onChange={(e) => onFieldChange('location', e.target.value)}
              placeholder={__('e.g., Resort restaurant', 'e.g., Resort restaurant')}
              className={`pl-9 ${textSize}`}
            />
          </div>
        </div>

        <div>
          <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}>
            {__('Time Type', 'Time Type')}
          </label>
          <HelpText 
            text={__('How should the time be displayed?', 'How should the time be displayed?')}
            className="mb-2"
          />
          <Select
            value={entry.time_type || 'exact'}
            onChange={(e) => onFieldChange('time_type', e.target.value)}
            className={textSize}
          >
            <option value="exact">{__('Exact Time', 'Exact Time')}</option>
            <option value="approximate">{__('Approximate Time', 'Approximate Time')}</option>
            <option value="all_day">{__('All Day', 'All Day')}</option>
            <option value="flexible">{__('Flexible', 'Flexible')}</option>
          </Select>
        </div>

        {entry.time_type !== 'all_day' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}>
                {__('Start Time', 'Start Time')}
              </label>
              <HelpText 
                text={__('When does this activity start?', 'When does this activity start?')}
                className="mb-2"
              />
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="time"
                  value={entry.start_time || ''}
                  onChange={(e) => {
                    onFieldChange('start_time', e.target.value);
                    // Auto-calculate duration if function provided
                    if (calculateDuration && entry.end_time) {
                      const newDuration = calculateDuration(e.target.value, entry.end_time, entry.time_type || 'exact');
                      if (newDuration && !entry.duration) {
                        onFieldChange('duration', newDuration);
                      }
                    }
                  }}
                  className={`${errors.start_time ? 'border-red-500 pl-9' : 'pl-9'} ${textSize}`}
                />
              </div>
              {errors.start_time && (
                <p className={`mt-1.5 ${textSize} text-red-600 dark:text-red-400 flex items-center gap-1`}>
                  <Info className="w-4 h-4" />
                  {errors.start_time}
                </p>
              )}
            </div>

            <div>
              <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}>
                {__('End Time', 'End Time')}
              </label>
              <HelpText 
                text={__('When does this activity end?', 'When does this activity end?')}
                className="mb-2"
              />
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="time"
                  value={entry.end_time || ''}
                  onChange={(e) => {
                    onFieldChange('end_time', e.target.value);
                    // Auto-calculate duration if function provided
                    if (calculateDuration && entry.start_time) {
                      const newDuration = calculateDuration(entry.start_time, e.target.value, entry.time_type || 'exact');
                      if (newDuration && !entry.duration) {
                        onFieldChange('duration', newDuration);
                      }
                    }
                  }}
                  className={`${errors.end_time ? 'border-red-500 pl-9' : 'pl-9'} ${textSize}`}
                />
              </div>
              {errors.end_time && (
                <p className={`mt-1.5 ${textSize} text-red-600 dark:text-red-400 flex items-center gap-1`}>
                  <Info className="w-4 h-4" />
                  {errors.end_time}
                </p>
              )}
            </div>
          </div>
        )}

        <div>
          <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}>
            {__('Duration', 'Duration')}
          </label>
          <HelpText 
            text={__('How long does this activity take? (e.g., "3 hours", "1 hour 30 minutes"). Leave empty to auto-calculate from times.', 'How long does this activity take? (e.g., "3 hours", "1 hour 30 minutes"). Leave empty to auto-calculate from times.')}
            className="mb-2"
          />
          <div className="relative">
            <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              value={entry.duration || ''}
              onChange={(e) => onFieldChange('duration', e.target.value)}
              placeholder={autoDuration || __('e.g., 3 hours', 'e.g., 3 hours')}
              className={`pl-9 ${textSize}`}
            />
          </div>
          {autoDuration && entry.time_type === 'exact' && !entry.duration && (
            <p className={`mt-1.5 ${isCompact ? 'text-xs' : 'text-xs'} text-gray-500 dark:text-gray-400`}>
              {__('Auto-calculated:', 'Auto-calculated:')} {autoDuration}
            </p>
          )}
        </div>
      </div>

      {/* Cost & Additional Information */}
      <div className={`space-y-3 ${!isCompact ? 'pt-3 border-t border-gray-200 dark:border-gray-700' : ''}`}>
        {!isCompact && (
          <h5 className={`${labelSize} font-semibold text-gray-900 dark:text-white`}>
            {__('Cost & Additional Information', 'Cost & Additional Information')}
          </h5>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}>
              {__('Cost', 'Cost')}
            </label>
            <HelpText 
              text={__('Optional cost for this activity. Leave empty if included in trip price.', 'Optional cost for this activity. Leave empty if included in trip price.')}
              className="mb-2"
            />
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={entry.cost || ''}
                onChange={(e) => onFieldChange('cost', e.target.value)}
                placeholder="0.00"
                className={`pl-9 ${textSize}`}
              />
            </div>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={entry.cost_per_person !== false}
                onChange={(e) => onFieldChange('cost_per_person', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`${textSize} text-gray-700 dark:text-gray-300`}>
                {__('Cost per person', 'Cost per person')}
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-1.5`}>
            {__('Notes / Instructions', 'Notes / Instructions')}
          </label>
          <HelpText 
            text={__('Additional notes or special instructions for this activity.', 'Additional notes or special instructions for this activity.')}
            className="mb-2"
          />
          <textarea
            value={entry.notes || ''}
            onChange={(e) => onFieldChange('notes', e.target.value)}
            placeholder={__('e.g., Please arrive 15 minutes early, Bring comfortable shoes...', 'e.g., Please arrive 15 minutes early, Bring comfortable shoes...')}
            rows={isCompact ? 2 : 3}
            className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 ${textSize} ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none`}
          />
        </div>

        {/* Included/Excluded Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-2`}>
              {__('Included Items', 'Included Items')}
            </label>
            <HelpText 
              text={__('Items or services included in this activity.', 'Items or services included in this activity.')}
              className="mb-2"
            />
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newIncludedItem}
                  onChange={(e) => onIncludedItemChange?.(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAddIncludedItem?.();
                    }
                  }}
                  placeholder={__('Add included item...', 'Add included item...')}
                  className={`flex-1 ${textSize}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onAddIncludedItem}
                  className={`flex-shrink-0 ${isCompact ? 'h-9 w-9' : ''}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(entry.included_items || []).map((item, index) => (
                  <Badge key={index} variant="info" className={`flex items-center gap-1.5 ${textSize}`}>
                    {item}
                    <button
                      type="button"
                      onClick={() => onRemoveIncludedItem?.(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={`block ${labelSize} font-medium text-gray-700 dark:text-gray-300 mb-2`}>
              {__('Excluded Items', 'Excluded Items')}
            </label>
            <HelpText 
              text={__('Items or services NOT included in this activity.', 'Items or services NOT included in this activity.')}
              className="mb-2"
            />
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newExcludedItem}
                  onChange={(e) => onExcludedItemChange?.(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAddExcludedItem?.();
                    }
                  }}
                  placeholder={__('Add excluded item...', 'Add excluded item...')}
                  className={`flex-1 ${textSize}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onAddExcludedItem}
                  className={`flex-shrink-0 ${isCompact ? 'h-9 w-9' : ''}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(entry.excluded_items || []).map((item, index) => (
                  <Badge key={index} variant="default" className={`flex items-center gap-1.5 ${textSize} border border-gray-300 dark:border-gray-600`}>
                    {item}
                    <button
                      type="button"
                      onClick={() => onRemoveExcludedItem?.(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return renderField(content);
};

