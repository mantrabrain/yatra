/**
 * Included Section Component
 * Handles: What's included/excluded
 * 
 * This is a placeholder - extract content from TripForm.tsx case 'included'
 */

import React from 'react';
import { CheckSquare } from 'lucide-react';
import { TripFormSectionProps } from '../types';
import { SectionHeader } from '../shared/SectionHeader';

export const IncludedSection: React.FC<TripFormSectionProps> = () => {
  // TODO: Extract included section content from TripForm.tsx (lines ~3583-3697)
  
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={CheckSquare}
        title="What's Included"
        description="Specify what is included and excluded in your trip"
      />
      
      {/* TODO: Add included/excluded form fields */}
      <p className="text-sm text-gray-500">Section content to be extracted from TripForm.tsx</p>
    </div>
  );
};

