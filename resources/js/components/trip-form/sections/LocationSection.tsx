/**
 * Location Section Component
 * Handles: Location & geography (destination, coordinates, landmarks)
 * 
 * This is a placeholder - extract content from TripForm.tsx case 'location'
 */

import React from 'react';
import { MapPin } from 'lucide-react';
import { TripFormSectionProps } from '../types';
import { SectionHeader } from '../shared/SectionHeader';

export const LocationSection: React.FC<TripFormSectionProps> = () => {
  // TODO: Extract location section content from TripForm.tsx (lines ~1876-2023)
  
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={MapPin}
        title="Location & Geography"
        description="Specify where your trip takes place, including destinations, coordinates, and key landmarks"
      />
      
      {/* TODO: Add location form fields */}
      <p className="text-sm text-gray-500">Section content to be extracted from TripForm.tsx</p>
    </div>
  );
};

