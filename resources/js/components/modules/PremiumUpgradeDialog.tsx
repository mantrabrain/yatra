import React from 'react';
import { createPortal } from 'react-dom';
import { Crown, X, Sparkles, CheckCircle2, ArrowRight, Zap, Play } from 'lucide-react';
import { __ } from '../../lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface PremiumUpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  moduleName?: string;
  purchaseUrl?: string;
  moduleDescription?: string;
}

export const PremiumUpgradeDialog: React.FC<PremiumUpgradeDialogProps> = ({
  open,
  onClose,
  moduleName,
  purchaseUrl,
  moduleDescription,
}) => {
  if (!open) return null;

  return createPortal(
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 m-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 pb-4"
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div className="relative w-full max-w-5xl">
        {/* Subtle premium glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-orange-400/20 to-orange-500/20 rounded-2xl blur-2xl"></div>
        
        <Card className="relative w-full shadow-2xl border border-orange-300/80 dark:border-orange-700/50 bg-white dark:bg-slate-900 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Premium accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500"></div>
          
          <CardHeader className="relative pb-4 pt-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gradient-to-b from-orange-50/30 to-transparent dark:from-orange-950/20">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {moduleName ? `${moduleName} - Premium Feature` : 'Premium Feature'}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                    {moduleDescription || 'This feature requires Yatra Pro to unlock powerful premium capabilities.'}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden pt-6 px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Left Side - Module Description */}
              <div className="flex flex-col overflow-y-auto pr-3">
                <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    {__('What This Module Does', 'What This Module Does')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {moduleDescription || __('This premium module adds advanced functionality to your Yatra booking system, helping you grow your business and streamline operations.', 'This premium module adds advanced functionality to your Yatra booking system, helping you grow your business and streamline operations.')}
                  </p>
                </div>

                {/* Feature List */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    {__('Key Features', 'Key Features')}
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{__('Advanced analytics and reporting', 'Advanced analytics and reporting')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{__('Automated workflows and notifications', 'Automated workflows and notifications')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{__('Enhanced customer management tools', 'Enhanced customer management tools')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{__('Priority support and updates', 'Priority support and updates')}</span>
                    </li>
                  </ul>
                </div>
                </div>
              </div>

              {/* Right Side - Video Preview */}
              <div className="flex flex-col">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4 text-orange-500" />
                    {__('See It In Action', 'See It In Action')}
                  </h4>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="text-center">
                      <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {__('Click to watch demo video', 'Click to watch demo video')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <div className="border-t border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upgrade to Yatra Pro and unlock this feature today
                </p>
              </div>
              <Button
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 group"
                onClick={() => window.open(purchaseUrl || 'https://wpyatra.com/pricing', '_blank')}
              >
                <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                {__('Upgrade to Pro', 'Upgrade to Pro')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>,
    document.body
  );
};
