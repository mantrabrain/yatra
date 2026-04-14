/**
 * Accommodation Section Component
 * Handles: Accommodation details
 *
 * This is a placeholder - extract content from TripForm.tsx case 'accommodation'
 */

import React from "react";
import { Bed } from "lucide-react";
import { TripFormSectionProps } from "../types";
import { SectionHeader } from "../shared/SectionHeader";

export const AccommodationSection: React.FC<TripFormSectionProps> = () => {
  // TODO: Extract accommodation section content from TripForm.tsx (lines ~2443-2526)

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Bed}
        title="Accommodation"
        description="Specify accommodation details for your trip"
      />

      {/* TODO: Add accommodation form fields */}
      <p className="text-sm text-gray-500">
        Section content to be extracted from TripForm.tsx
      </p>
    </div>
  );
};
