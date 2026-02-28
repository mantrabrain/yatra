/**
 * Activity Section Component
 * Handles: Activity types & category (activity types, difficulty, category hierarchy)
 *
 * This is a placeholder - extract content from TripForm.tsx case 'activity'
 */

import React from "react";
import { Activity } from "lucide-react";
import { TripFormSectionProps } from "../types";
import { SectionHeader } from "../shared/SectionHeader";

export const ActivitySection: React.FC<TripFormSectionProps> = () => {
  // TODO: Extract activity section content from TripForm.tsx (lines ~2272-2442)

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Activity}
        title="Activity & Category"
        description="Classify your trip by activity types, difficulty level, and categories"
      />

      {/* TODO: Add activity form fields */}
      <p className="text-sm text-gray-500">
        Section content to be extracted from TripForm.tsx
      </p>
    </div>
  );
};
