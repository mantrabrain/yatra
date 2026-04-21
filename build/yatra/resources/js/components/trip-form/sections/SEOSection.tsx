/**
 * SEO Section Component
 * Handles: SEO settings
 *
 * This is a placeholder - extract content from TripForm.tsx case 'seo'
 */

import React from "react";
import { Search } from "lucide-react";
import { TripFormSectionProps } from "../types";
import { SectionHeader } from "../shared/SectionHeader";

export const SEOSection: React.FC<TripFormSectionProps> = () => {
  // TODO: Extract SEO section content from TripForm.tsx (lines ~3971-4018)

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Search}
        title="SEO Settings"
        description="Optimize your trip page for search engines"
      />

      {/* TODO: Add SEO form fields */}
      <p className="text-sm text-gray-500">
        Section content to be extracted from TripForm.tsx
      </p>
    </div>
  );
};
