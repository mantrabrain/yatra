/**
 * Section Header Component
 * Reusable header for all trip form sections
 */

import React from "react";
import { LucideIcon } from "lucide-react";
import { __ } from "../../../lib/i18n";

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {__(title, title)}
        </h2>
      </div>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {__(description, description)}
        </p>
      )}
    </div>
  );
};
