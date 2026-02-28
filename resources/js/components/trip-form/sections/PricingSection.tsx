/**
 * Pricing Section Component
 * Handles: Pricing & payment
 *
 * This is a placeholder - extract content from TripForm.tsx case 'pricing'
 */

import React from "react";
import { DollarSign } from "lucide-react";
import { TripFormSectionProps } from "../types";
import { SectionHeader } from "../shared/SectionHeader";

export const PricingSection: React.FC<TripFormSectionProps> = () => {
  // TODO: Extract pricing section content from TripForm.tsx (lines ~2623-3153)

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={DollarSign}
        title="Pricing & Payment"
        description="Set pricing options and payment terms"
      />

      {/* TODO: Add pricing form fields */}
      <p className="text-sm text-gray-500">
        Section content to be extracted from TripForm.tsx
      </p>
    </div>
  );
};
