/**
 * Overview Section Component
 * Handles: Basic info, highlights, rich content, classification
 * 
 * This is a placeholder - extract content from TripForm.tsx case 'overview'
 */

import React from 'react';
import { FileText } from 'lucide-react';
import { TripFormSectionProps } from '../types';
import { SectionHeader } from '../shared/SectionHeader';

export const OverviewSection: React.FC<TripFormSectionProps> = () => {
  // TODO: Extract overview section content from TripForm.tsx
  // This section has tabs: basic, highlights, details, rich-content, classification
  
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={FileText}
        title="Trip Overview"
        description="Basic information, highlights, and trip details"
      />
      
      {/* TODO: Add tab navigation and content */}
      <p className="text-sm text-gray-500">Section content to be extracted from TripForm.tsx</p>
    </div>
  );
};

