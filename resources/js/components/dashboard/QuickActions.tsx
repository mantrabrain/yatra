/**
 * Quick Actions Widget
 * Provides quick access to common actions
 */

import React from 'react';
import { __ } from '../../lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, FileText, Calendar, BarChart3, Settings } from 'lucide-react';
import { ConditionalRender } from '../ui/conditional-render';

interface QuickActionsProps {
  onCreateTrip?: () => void;
  onGenerateReport?: () => void;
  onViewCalendar?: () => void;
  onViewAnalytics?: () => void;
  onViewSettings?: () => void;
}

/**
 * Quick Actions Widget
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  onCreateTrip,
  onGenerateReport,
  onViewCalendar,
  onViewAnalytics,
  onViewSettings,
}) => {

  const actions = [
    {
      label: __('Create New Trip', 'Create New Trip'),
      icon: Plus,
      onClick: onCreateTrip,
      capability: 'yatra_edit_trips',
      color: 'blue',
    },
    {
      label: __('Generate Report', 'Generate Report'),
      icon: FileText,
      onClick: onGenerateReport,
      capability: 'yatra_view_reports',
      color: 'green',
    },
    {
      label: __('View Calendar', 'View Calendar'),
      icon: Calendar,
      onClick: onViewCalendar,
      capability: 'yatra_view_bookings',
      color: 'purple',
    },
    {
      label: __('View Analytics', 'View Analytics'),
      icon: BarChart3,
      onClick: onViewAnalytics,
      capability: 'yatra_view_reports',
      color: 'orange',
    },
    {
      label: __('Settings', 'Settings'),
      icon: Settings,
      onClick: onViewSettings,
      capability: 'manage_yatra',
      color: 'gray',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{__('Quick Actions', 'Quick Actions')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <ConditionalRender
              key={action.label}
              capability={action.capability}
            >
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 h-16 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={action.onClick}
              >
                <action.icon className={`w-4 h-4 text-${action.color}-600 dark:text-${action.color}-400`} />
                <span className="text-xs text-center leading-tight">{action.label}</span>
              </Button>
            </ConditionalRender>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;

