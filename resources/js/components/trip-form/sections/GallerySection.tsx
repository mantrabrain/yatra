/**
 * Gallery Section Component
 * Handles: Photo gallery
 *
 * This is a placeholder - extract content from TripForm.tsx case 'gallery'
 */

import React from "react";
import { Image } from "lucide-react";
import { TripFormSectionProps } from "../types";
import { SectionHeader } from "../shared/SectionHeader";

export const GallerySection: React.FC<TripFormSectionProps> = () => {
  // TODO: Extract gallery section content from TripForm.tsx (lines ~3698-3734)

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Image}
        title="Photo Gallery"
        description="Upload and manage trip photos"
      />

      {/* TODO: Add gallery upload/management */}
      <p className="text-sm text-gray-500">
        Section content to be extracted from TripForm.tsx
      </p>
    </div>
  );
};
