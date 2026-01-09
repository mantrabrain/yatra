/**
 * Activity Accordion Component
 * Displays multiple activities in an accordion format for day mode
 */

import React from 'react';
import { ChevronUp, ChevronDown, X, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ItineraryEntryFields } from '../trip-form/shared/ItineraryEntryFields';
import { __ } from '../../lib/i18n';
import { ActivityForm } from '../../hooks/useItineraryFormValidation';

interface ActivityAccordionProps {
  activityForms: ActivityForm[];
  errors: Record<string, string>;
  itemTypes: any[];
  items: any[];
  activityIncludedItems: Record<string, string>;
  activityExcludedItems: Record<string, string>;
  onToggleExpand: (activityId: string) => void;
  onRemoveActivity: (activityId: string) => void;
  onAddActivity: () => void;
  onFieldChange: (activityId: string, field: string, value: any) => void;
  onIncludedItemChange: (activityId: string, value: string) => void;
  onExcludedItemChange: (activityId: string, value: string) => void;
  onAddIncludedItem: (activityId: string) => void;
  onAddExcludedItem: (activityId: string) => void;
  onRemoveIncludedItem: (activityId: string, index: number) => void;
  onRemoveExcludedItem: (activityId: string, index: number) => void;
  calculateDuration: (startTime?: string, endTime?: string, timeType?: string) => string;
}

export const ActivityAccordion: React.FC<ActivityAccordionProps> = ({
  activityForms,
  errors,
  itemTypes,
  items,
  activityIncludedItems,
  activityExcludedItems,
  onToggleExpand,
  onRemoveActivity,
  onAddActivity,
  onFieldChange,
  onIncludedItemChange,
  onExcludedItemChange,
  onAddIncludedItem,
  onAddExcludedItem,
  onRemoveIncludedItem,
  onRemoveExcludedItem,
  calculateDuration,
}) => {
  return (
    <>
      {activityForms.length > 0 && (
        <div className="space-y-3">
          {activityForms.map((activityForm, index) => (
            <Card key={activityForm.id} className="mt-3">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {__('Activity', 'yatra')} {index + 1}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleExpand(activityForm.id)}
                      className="h-8 w-8"
                    >
                      {activityForm.isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveActivity(activityForm.id)}
                      className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400"
                      title={__('Remove Activity', 'yatra')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {activityForm.isExpanded && (
                <CardContent>
                  <ItineraryEntryFields
                    entry={{
                      item_type_id: activityForm.data.item_type_id || '',
                      item_id: activityForm.data.item_id || '',
                      title: activityForm.data.title || '',
                      description: activityForm.data.description || '',
                      location: activityForm.data.location || '',
                      duration: activityForm.data.duration || '',
                      start_time: activityForm.data.start_time || '08:00',
                      end_time: activityForm.data.end_time || '17:00',
                      time_type: (activityForm.data.time_type || 'exact') as 'exact' | 'approximate' | 'all_day' | 'flexible',
                      cost: activityForm.data.cost || '',
                      cost_per_person: activityForm.data.cost_per_person !== false,
                      notes: activityForm.data.notes || '',
                      included_items: activityForm.data.included_items || [],
                      excluded_items: activityForm.data.excluded_items || [],
                    }}
                    errors={errors}
                    itemTypes={itemTypes}
                    items={items}
                    newIncludedItem={activityIncludedItems[activityForm.id] || ''}
                    newExcludedItem={activityExcludedItems[activityForm.id] || ''}
                    onFieldChange={(field: string, value: any) => onFieldChange(activityForm.id, field, value)}
                    onIncludedItemChange={(value: string) => onIncludedItemChange(activityForm.id, value)}
                    onExcludedItemChange={(value: string) => onExcludedItemChange(activityForm.id, value)}
                    onAddIncludedItem={() => onAddIncludedItem(activityForm.id)}
                    onAddExcludedItem={() => onAddExcludedItem(activityForm.id)}
                    onRemoveIncludedItem={(idx: number) => onRemoveIncludedItem(activityForm.id, idx)}
                    onRemoveExcludedItem={(idx: number) => onRemoveExcludedItem(activityForm.id, idx)}
                    calculateDuration={calculateDuration}
                    size="default"
                    showCardWrapper={false}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Activity Button - Below all activities */}
      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          onClick={onAddActivity}
          className="w-full flex items-center justify-center gap-2 border-dashed"
        >
          <Plus className="w-4 h-4" />
          {__('Add Activity', 'yatra')}
        </Button>
      </div>
    </>
  );
};

