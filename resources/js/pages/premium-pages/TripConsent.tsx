/**
 * Trip Consent Premium Page
 * 
 * Premium upgrade page for Trip Consent module.
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
  FileSignature, 
  Shield, 
  Clock, 
  Users, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  PenTool,
  ClipboardCheck,
  Send,
  Eye,
  Download,
  Mail,
  Calendar,
  Zap,
  Camera
} from 'lucide-react';

// Premium Upgrade Component
const TripConsentPremium: React.FC = () => {
  const features = [
    {
      icon: FileSignature,
      title: __('Digital Signatures'),
      description: __('Create legally binding consent forms with digital signature capabilities.')
    },
    {
      icon: Shield,
      title: __('Legal Compliance'),
      description: __('Ensure GDPR and privacy regulation compliance with proper consent management.')
    },
    {
      icon: ClipboardCheck,
      title: __('Custom Forms'),
      description: __('Build custom consent forms with conditional logic and required fields.')
    },
    {
      icon: Send,
      title: __('Email Delivery'),
      description: __('Automatically send consent forms to customers via email for electronic signing.')
    }
  ];

  const stats = [
    {
      icon: CheckCircle,
      value: '100%',
      label: __('Legal Compliance')
    },
    {
      icon: Users,
      value: '15k',
      label: __('Forms Signed')
    },
    {
      icon: Clock,
      value: '60s',
      label: __('Average Sign Time')
    },
    {
      icon: Shield,
      value: 'AES256',
      label: __('Encryption')
    }
  ];

  const consentTypes = [
    {
      icon: FileSignature,
      title: __('Liability Waivers'),
      description: __('Protect your business with comprehensive liability waiver forms.'),
      required: true
    },
    {
      icon: PenTool,
      title: __('Medical Declarations'),
      description: __('Collect medical information and emergency contact details.'),
      required: false
    },
    {
      icon: Camera,
      title: __('Photo Releases'),
      description: __('Get permission to use customer photos for marketing purposes.'),
      required: false
    },
    {
      icon: Shield,
      title: __('Privacy Policies'),
      description: __('Ensure customers agree to your privacy and data handling policies.'),
      required: true
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
                {__('Trip Consent is a premium module. Upgrade to Yatra Pro to manage digital consent forms.')}
              </p>
            </div>
          </div>
          <Button 
            className="bg-amber-600 text-white hover:bg-amber-700 px-6 py-2 text-sm font-medium"
            onClick={() => window.open('https://wpyatra.com/pricing?module=trip-consent', '_blank')}
          >
            {__('Upgrade to Pro')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-6">
          <FileSignature className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {__('Trip Consent Forms')}
          </h1>
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-md">
            <Sparkles className="w-3 h-3 mr-1" />
            {__('PRO')}
          </div>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {__('Create legally compliant consent forms with digital signatures and automate the collection process with Yatra Pro.')}
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
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
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
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
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

      {/* Consent Types */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          {__('Consent Form Types')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {consentTypes.map((consentType, index) => {
            const Icon = consentType.icon;
            return (
              <Card key={index} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {consentType.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {consentType.description}
                      </p>
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {consentType.required ? __('Required') : __('Optional')}
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
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:pr-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {__('Ensure Legal Compliance')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {__('Protect your business and customers with professional consent forms and digital signatures powered by Yatra Pro.')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{__('Digital signatures')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{__('Legal compliance')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{__('Automated delivery')}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Button 
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-3 text-sm font-medium mb-3"
              onClick={() => window.open('https://wpyatra.com/pricing?module=trip-consent', '_blank')}
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

export default TripConsentPremium;
