import React from 'react';
import { createPortal } from 'react-dom';
import { Crown, X, Sparkles, CheckCircle2, ArrowRight, Zap } from 'lucide-react';
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

  const dialogContent = (
    <div className="fixed top-0 left-0 right-0 bottom-0 m-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center px-4 pb-4">
      <div className="relative w-full max-w-5xl">
        {/* Subtle premium glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-orange-400/20 to-orange-500/20 rounded-2xl blur-2xl"></div>
        
        <Card className="relative w-full shadow-2xl border border-orange-300/80 dark:border-orange-700/50 bg-white dark:bg-slate-900 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Premium accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500"></div>
          
          <CardHeader className="relative pb-4 pt-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gradient-to-b from-orange-50/30 to-transparent dark:from-orange-950/20">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-400 rounded-lg blur-md opacity-40"></div>
                  <div className="relative p-2.5 rounded-lg bg-gradient-to-br from-orange-500 to-orange-400 shadow-md">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {moduleName || __('Premium Feature', 'Premium Feature')}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {__('Unlock advanced capabilities with Pro', 'Unlock advanced capabilities with Pro')}
                  </CardDescription>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={__('Close', 'Close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="relative flex-1 overflow-hidden pt-6 px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Left Side - Module Description */}
              <div className="flex flex-col overflow-y-auto pr-3">
                <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    {__('What This Module Does', 'What This Module Does')}
                  </h3>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-5">
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-4">
                      {moduleDescription || (
                        moduleName
                          ? __('"{module}" is a premium feature that unlocks advanced capabilities for your tour and activity business. This module provides powerful tools and integrations designed to streamline your operations, enhance customer experience, and drive revenue growth.', '"{module}" is a premium feature that unlocks advanced capabilities for your tour and activity business. This module provides powerful tools and integrations designed to streamline your operations, enhance customer experience, and drive revenue growth.').replace('{module}', moduleName)
                          : __('This premium module unlocks advanced capabilities for your tour and activity business. It provides powerful tools and integrations designed to streamline your operations, enhance customer experience, and drive revenue growth.', 'This premium module unlocks advanced capabilities for your tour and activity business. It provides powerful tools and integrations designed to streamline your operations, enhance customer experience, and drive revenue growth.')
                      )}
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                          {__('Advanced automation and workflow optimization', 'Advanced automation and workflow optimization')}
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                          {__('Priority support and dedicated onboarding', 'Priority support and dedicated onboarding')}
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                          {__('Exclusive integrations with industry partners', 'Exclusive integrations with industry partners')}
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                          {__('Regular updates and new feature releases', 'Regular updates and new feature releases')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* Right Side - Video Tutorial */}
              <div className="flex flex-col space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  {__('Video Tutorial', 'Video Tutorial')}
                </h3>
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg bg-black flex-shrink-0">
                  {videoUrl ? (
                    <div className="relative w-full overflow-hidden aspect-video">
                      <iframe
                        src={videoUrl}
                        title={`${moduleName || 'Premium module'} tutorial`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center aspect-video text-center space-y-3 text-gray-400 dark:text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                      <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/40">
                        <Crown className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                      </div>
                      <p className="text-sm font-medium">{__('Video walkthrough coming soon.', 'Video walkthrough coming soon.')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-6 mt-6 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                {__('Maybe Later', 'Maybe Later')}
              </Button>
              <Button
                className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group"
                onClick={() => {
                  if (purchaseUrl) {
                    window.open(purchaseUrl, '_blank');
                  } else {
                    window.open('https://wpyatra.com/pricing', '_blank');
                  }
                }}
              >
                {__('Upgrade to Pro', 'Upgrade to Pro')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};
