/**
 * Duration Section Component
 * Handles: Duration & schedule (trip type, days, availability, seasonal)
 * 
 * This is a placeholder - extract content from TripForm.tsx case 'duration'
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import { TripFormSectionProps } from '../types';
import { SectionHeader } from '../shared/SectionHeader';

export const DurationSection: React.FC<TripFormSectionProps> = () => {
  // TODO: Extract duration section content from TripForm.tsx (lines ~2024-2271)
  
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Calendar}
        title="Duration & Schedule"
        description="Define trip duration, type, and availability schedule"
      />
      
      {/* TODO: Add duration form fields */}
      <p className="text-sm text-gray-500">Section content to be extracted from TripForm.tsx</p>
    </div>
  );
};

