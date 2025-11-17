import React from 'react';
import { Crown, X } from 'lucide-react';
import { __ } from '../../lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface PremiumUpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  moduleName?: string;
  purchaseUrl?: string;
}

export const PremiumUpgradeDialog: React.FC<PremiumUpgradeDialogProps> = ({
  open,
  onClose,
  moduleName,
  purchaseUrl,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center px-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Crown className="w-6 h-6 text-amber-500" />
                {__('Unlock Premium Feature', 'Unlock Premium Feature')}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {__('Upgrade your plan to activate premium modules and deliver even more value to your travelers.', 'Upgrade your plan to activate premium modules and deliver even more value to your travelers.')}
              </CardDescription>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label={__('Close', 'Close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-200 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-500/10 p-4">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              {moduleName
                ? __('“{module}” is available on Premium plans. Unlock advanced automation, integrations, and white-glove support.', '“{module}” is available on Premium plans. Unlock advanced automation, integrations, and white-glove support.').replace('{module}', moduleName)
                : __('This module is available on Premium plans. Unlock advanced automation, integrations, and white-glove support.', 'This module is available on Premium plans. Unlock advanced automation, integrations, and white-glove support.')}
            </p>
          </div>

          <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>{__('Automations tailored to tour and activity workflows', 'Automations tailored to tour and activity workflows')}</li>
            <li>{__('Priority onboarding and success engineering', 'Priority onboarding and success engineering')}</li>
            <li>{__('Exclusive integrations with OTA/CRM partners', 'Exclusive integrations with OTA/CRM partners')}</li>
          </ul>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={onClose}>
              {__('Maybe Later', 'Maybe Later')}
            </Button>
            <Button
              onClick={() => {
                if (purchaseUrl) {
                  window.open(purchaseUrl, '_blank');
                } else {
                  window.open('https://wpyatra.com/pricing', '_blank');
                }
              }}
            >
              {__('View Premium Plans', 'View Premium Plans')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


