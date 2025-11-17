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
  videoUrl?: string;
  moduleDescription?: string;
}

export const PremiumUpgradeDialog: React.FC<PremiumUpgradeDialogProps> = ({
  open,
  onClose,
  moduleName,
  purchaseUrl,
  videoUrl,
  moduleDescription,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center px-4">
      <Card className="w-full max-w-3xl shadow-2xl border border-amber-200 dark:border-amber-500/40 bg-gradient-to-br from-white via-amber-50 to-amber-100 dark:from-slate-900 dark:via-amber-900/20 dark:to-slate-900">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl text-amber-800 dark:text-amber-200">
                <span className="p-2 rounded-full bg-amber-100 dark:bg-amber-500/30">
                  <Crown className="w-6 h-6 text-amber-500 dark:text-amber-200" />
                </span>
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
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-amber-300 dark:border-amber-500/50 bg-gradient-to-r from-amber-100 to-white dark:from-amber-900/30 dark:to-transparent p-4 space-y-3">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                {moduleDescription ||
                  (moduleName
                    ? __('“{module}” is available on Premium plans. Unlock advanced automation, integrations, and white-glove support.', '“{module}” is available on Premium plans. Unlock advanced automation, integrations, and white-glove support.').replace('{module}', moduleName)
                    : __('This module is available on Premium plans. Unlock advanced automation, integrations, and white-glove support.', 'This module is available on Premium plans. Unlock advanced automation, integrations, and white-glove support.'))}
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>{__('Automations tailored to tour and activity workflows', 'Automations tailored to tour and activity workflows')}</li>
                <li>{__('Priority onboarding and success engineering', 'Priority onboarding and success engineering')}</li>
                <li>{__('Exclusive integrations with OTA/CRM partners', 'Exclusive integrations with OTA/CRM partners')}</li>
              </ul>
            </div>

            <div className="rounded-lg border border-amber-200 dark:border-amber-500/50 bg-white dark:bg-slate-900 p-4 shadow-inner">
              {videoUrl ? (
                <div className="relative w-full overflow-hidden rounded-lg aspect-video">
                  <iframe
                    src={videoUrl}
                    title="Premium module demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-gray-500 dark:text-gray-300">
                  <Crown className="w-8 h-8 text-amber-500" />
                  <p>{__('Video walkthrough coming soon.', 'Video walkthrough coming soon.')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={onClose} className="border-amber-200 text-amber-700 dark:text-amber-200">
              {__('Maybe Later', 'Maybe Later')}
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                if (purchaseUrl) {
                  window.open(purchaseUrl, '_blank');
                } else {
                  window.open('https://wpyatra.com/pricing', '_blank');
                }
              }}
            >
              {__('Upgrade to Pro', 'Upgrade to Pro')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


