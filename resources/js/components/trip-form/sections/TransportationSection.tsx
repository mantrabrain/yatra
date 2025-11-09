/**
 * Transportation Section Component
 * Handles: Transportation details
 * 
 * This is a placeholder - extract content from TripForm.tsx case 'transportation'
 */

import React from 'react';
import { Car } from 'lucide-react';
import { TripFormSectionProps } from '../types';
import { SectionHeader } from '../shared/SectionHeader';

export const TransportationSection: React.FC<TripFormSectionProps> = () => {
  // TODO: Extract transportation section content from TripForm.tsx (lines ~2527-2622)
  
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Car}
        title="Transportation"
        description="Specify transportation details for your trip"
      />
      
      {/* TODO: Add transportation form fields */}
      <p className="text-sm text-gray-500">Section content to be extracted from TripForm.tsx</p>
    </div>
  );
};

