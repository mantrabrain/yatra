/**
 * Abandoned Booking Recovery Premium Page
 * 
 * Premium upgrade page for Abandoned Booking Recovery module.
 * Shows when Yatra Pro is not active or module is not enabled.
 * 
 * @package Yatra
 * @since 3.0.0
 */

import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { __ } from '../../lib/i18n';
import { 
  RefreshCw, 
  DollarSign, 
  Users, 
  Clock, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  Mail,
  Send,
  TrendingUp,
  BarChart,
  AlertCircle,
  Shield,
  Zap
} from 'lucide-react';

// Premium Upgrade Component
const AbandonedRecoveryPremium: React.FC = () => {
  const features = [
    {
      icon: Mail,
      title: __('Automated Recovery Emails'),
      description: __('Send automated follow-up emails to customers who abandoned their bookings.')
    },
    {
      icon: Clock,
      title: __('Smart Timing'),
      description: __('Configure intelligent timing for recovery emails based on customer behavior.')
    },
    {
      icon: BarChart,
      title: __('Recovery Analytics'),
      description: __('Track recovery rates, email performance, and revenue recovered.')
    },
    {
      icon: Zap,
      title: __('Instant Notifications'),
      description: __('Get real-time alerts when new abandoned bookings are detected.')
    }
  ];

  const stats = [
    {
      icon: TrendingUp,
      value: '35%',
      label: __('Average Recovery Rate')
    },
    {
      icon: DollarSign,
      value: '$2.5k',
      label: __('Revenue Recovered')
    },
    {
      icon: Users,
      value: '89%',
      label: __('Customer Retention')
    },
    {
      icon: Mail,
      value: '1.2k',
      label: __('Emails Sent')
    }
  ];

  const recoverySteps = [
    {
      icon: AlertCircle,
      title: __('Detection'),
      description: __('Automatically detect when a booking is abandoned during checkout.'),
      timing: __('Real-time')
    },
    {
      icon: Mail,
      title: __('First Follow-up'),
      description: __('Send initial recovery email within customizable timeframe.'),
      timing: __('1-2 hours')
    },
    {
      icon: Send,
      title: __('Sequence Emails'),
      description: __('Send multiple follow-up emails with increasing urgency.'),
      timing: __('24-72 hours')
    },
    {
      icon: Shield,
      title: __('Conversion'),
      description: __('Track recovered bookings and calculate recovery success.'),
      timing: __('Ongoing')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Premium Notice */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                {__('Premium Feature')}
              </h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                {__('Abandoned Booking Recovery is a premium module. Upgrade to Yatra Pro to recover lost revenue.')}
              </p>
            </div>
          </div>
          <Button 
            className="bg-amber-600 text-white hover:bg-amber-700 px-6 py-2 text-sm font-medium"
            onClick={() => window.open('https://wpyatra.com/pricing?module=abandoned-recovery', '_blank')}
          >
            {__('Upgrade to Pro')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-6">
          <RefreshCw className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {__('Abandoned Booking Recovery')}
          </h1>
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-md">
            <Sparkles className="w-3 h-3 mr-1" />
            {__('PRO')}
          </div>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {__('Recover lost revenue from abandoned bookings with intelligent automated email sequences and recovery analytics.')}
        </p>
      </div>

      {/* Stats Preview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border border-gray-200 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          {__('Powerful Features')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recovery Process */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          {__('How Recovery Works')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recoverySteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {step.description}
                      </p>
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        {step.timing}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:pr-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {__('Recover Lost Revenue')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {__('Turn abandoned bookings into completed reservations with intelligent automated recovery sequences and maximize your revenue with Yatra Pro.')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{__('Automated recovery emails')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{__('Smart timing sequences')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{__('Recovery analytics')}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Button 
              className="bg-green-600 text-white hover:bg-green-700 px-8 py-3 text-sm font-medium mb-3"
              onClick={() => window.open('https://wpyatra.com/pricing?module=abandoned-recovery', '_blank')}
            >
              {__('Upgrade to Pro')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {__('14-day money-back guarantee')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbandonedRecoveryPremium;
