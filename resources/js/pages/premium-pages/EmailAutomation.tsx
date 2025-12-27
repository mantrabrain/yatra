/**
 * Email Automation Premium Page
 * 
 * Premium upgrade page for Email Automation module.
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
  Mail, 
  FileText, 
  Clock, 
  Users, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  Send,
  Bell,
  Megaphone,
  BarChart,
  Zap,
  CreditCard,
  Calendar
} from 'lucide-react';

// Premium Upgrade Component
const EmailAutomationPremium: React.FC = () => {
  const features = [
    {
      icon: FileText,
      title: __('Custom Email Templates'),
      description: __('Edit and customize all system email templates with your branding.')
    },
    {
      icon: Clock,
      title: __('Automated Sequences'),
      description: __('Create drip campaigns and automated email sequences for different triggers.')
    },
    {
      icon: Send,
      title: __('Smart Triggers'),
      description: __('Set up automatic emails based on booking status, payments, and customer actions.')
    },
    {
      icon: BarChart,
      title: __('Email Analytics'),
      description: __('Track email delivery rates, open rates, and engagement metrics.')
    }
  ];

  const stats = [
    {
      icon: BarChart,
      value: '68%',
      label: __('Higher Open Rates')
    },
    {
      icon: Users,
      value: '3.5x',
      label: __('Booking Conversion')
    },
    {
      icon: Zap,
      value: '24/7',
      label: __('Automation')
    }
  ];

  const emailTypes = [
    {
      icon: Bell,
      title: __('Booking Confirmations'),
      description: __('Instant booking confirmation emails with all details.'),
      trigger: __('On booking creation')
    },
    {
      icon: CreditCard,
      title: __('Payment Notifications'),
      description: __('Payment received, failed, and refund notifications.'),
      trigger: __('On payment status change')
    },
    {
      icon: Calendar,
      title: __('Trip Reminders'),
      description: __('Pre-trip reminders and departure notifications.'),
      trigger: __('Before trip date')
    },
    {
      icon: Megaphone,
      title: __('Marketing Emails'),
      description: __('Promotional campaigns and newsletter broadcasts.'),
      trigger: __('Manual/automated')
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
                {__('Email Automation is a premium module. Upgrade to Yatra Pro to unlock advanced email marketing.')}
              </p>
            </div>
          </div>
          <Button 
            className="bg-amber-600 text-white hover:bg-amber-700 px-6 py-2 text-sm font-medium"
            onClick={() => window.open('https://wpyatra.com/pricing?module=email-automation', '_blank')}
          >
            {__('Upgrade to Pro')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-6">
          <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {__('Email Automation')}
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          {__('Create powerful email campaigns, automate customer communication, and track engagement with Yatra Pro.')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          {__('Powerful Email Features')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-semibold mb-2">{feature.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Email Types */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          {__('Automated Email Types')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {emailTypes.map((emailType, index) => {
            const Icon = emailType.icon;
            return (
              <Card key={index} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {emailType.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {emailType.description}
                      </p>
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {emailType.trigger}
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:pr-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {__('Unlock Email Automation')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {__('Transform your customer communication with intelligent email automation and drive more bookings with Yatra Pro.')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{__('Custom email templates')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{__('Automated sequences')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{__('Email analytics')}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 text-sm font-medium mb-3"
              onClick={() => window.open('https://wpyatra.com/pricing?module=email-automation', '_blank')}
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

export default EmailAutomationPremium;
