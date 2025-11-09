/**
 * FAQs Section Component
 * Handles: Frequently asked questions
 * 
 * This is a placeholder - extract content from TripForm.tsx case 'faqs'
 */

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { TripFormSectionProps } from '../types';
import { SectionHeader } from '../shared/SectionHeader';

export const FAQsSection: React.FC<TripFormSectionProps> = () => {
  // TODO: Extract FAQs section content from TripForm.tsx (lines ~3735-3799)
  
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={HelpCircle}
        title="FAQs"
        description="Add frequently asked questions about your trip"
      />
      
      {/* TODO: Add FAQ form fields */}
      <p className="text-sm text-gray-500">Section content to be extracted from TripForm.tsx</p>
    </div>
  );
};

