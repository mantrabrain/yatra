/**
 * Page Header Component
 * Reusable header for all pages with title, description, and actions
 * Supports role-based action visibility
 */

import React from "react";
import { __ } from "../../lib/i18n";
import { ConditionalRender } from "../ui/conditional-render";

interface PageHeaderProps {
  title?: string; // Optional - title is now shown in top bar
  description?: string;
  actions?: React.ReactNode;
  actionCapability?: string;
  actionRequirePro?: boolean;
}

/**
 * Page Header Component
 *
 * @example
 * <PageHeader
 *   title={__('Trips', 'yatra')}
 *   description={__('Manage your travel packages', 'yatra')}
 *   actionCapability="yatra_edit_trips"
 *   actions={<Button>Add New</Button>}
 * />
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  description,
  actions,
  actionCapability,
  actionRequirePro = false,
}) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <ConditionalRender
          capability={actionCapability}
          requirePro={actionRequirePro}
        >
          <div className="flex items-center gap-3">{actions}</div>
        </ConditionalRender>
      )}
    </div>
  );
};

export default PageHeader;
