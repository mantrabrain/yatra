/**
 * Page Header Component
 * Reusable header for all pages with title, description, and actions
 * Supports role-based action visibility
 */

import React from 'react';
import { __ } from '../../lib/i18n';
import { ConditionalRender } from '../ui/conditional-render';

interface PageHeaderProps {
  title: string;
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
 *   title={__('Trips', 'Trips')}
 *   description={__('Manage your travel packages', 'Manage your travel packages')}
 *   actionCapability="yatra_edit_trips"
 *   actions={<Button>Add New</Button>}
 * />
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  actionCapability,
  actionRequirePro = false,
}) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{description}</p>
        )}
      </div>
      
      {actions && (
        <ConditionalRender
          capability={actionCapability}
          requirePro={actionRequirePro}
        >
          <div className="flex items-center gap-3">
            {actions}
          </div>
        </ConditionalRender>
      )}
    </div>
  );
};

export default PageHeader;

