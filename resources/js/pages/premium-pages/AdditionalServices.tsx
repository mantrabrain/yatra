/**
 * Additional Services Premium Page
 *
 * Premium upgrade page for Additional Services module.
 * Shows when Yatra Pro is not active or module is not enabled.
 *
 * @package Yatra
 * @since 3.0.0
 */

import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { __ } from "../../lib/i18n";
import {
  Package,
  DollarSign,
  Users,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Shield,
  TrendingUp,
  RotateCcw,
  FileText,
} from "lucide-react";

// Premium Upgrade Component
const AdditionalServicesPremium: React.FC = () => {
  const features = [
    {
      icon: Package,
      title: __("Service Management"),
      description: __(
        "Create and manage unlimited add-on services for your trips.",
      ),
    },
    {
      icon: DollarSign,
      title: __("Flexible Pricing"),
      description: __(
        "Set pricing per person, per booking, or per day with multiple options.",
      ),
    },
    {
      icon: Users,
      title: __("Trip Assignment"),
      description: __(
        "Assign services to specific trips or apply globally to all trips.",
      ),
    },
    {
      icon: Shield,
      title: __("Booking Integration"),
      description: __(
        "Seamless integration with booking process and payment collection.",
      ),
    },
  ];

  const stats = [
    {
      icon: TrendingUp,
      value: "25%",
      label: __("Revenue Increase"),
    },
    {
      icon: Users,
      value: "89%",
      label: __("Customer Satisfaction"),
    },
    {
      icon: Package,
      value: "Unlimited",
      label: __("Services"),
    },
    {
      icon: DollarSign,
      value: "Flexible",
      label: __("Pricing Options"),
    },
  ];

  const popularServices = [
    {
      icon: FileText,
      title: __("Travel Insurance"),
      description: __("Comprehensive travel coverage for peace of mind."),
      price: __("From $29/person"),
    },
    {
      icon: RotateCcw,
      title: __("Airport Transfers"),
      description: __("Hassle-free airport pickup and drop-off services."),
      price: __("From $45/transfer"),
    },
    {
      icon: Package,
      title: __("Equipment Rental"),
      description: __("Quality gear and equipment for outdoor activities."),
      price: __("From $15/day"),
    },
    {
      icon: Users,
      title: __("Meal Packages"),
      description: __(
        "Delicious meal options for different dietary requirements.",
      ),
      price: __("From $25/day"),
    },
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
                {__("Premium Feature")}
              </h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                {__(
                  "Additional Services is a premium module. Upgrade to Yatra Pro to unlock all features.",
                )}
              </p>
            </div>
          </div>
          <Button
            className="bg-amber-600 text-white hover:bg-amber-700 px-6 py-2 text-sm font-medium"
            onClick={() =>
              window.open(
                "https://wpyatra.com/pricing?module=additional-services",
                "_blank",
              )
            }
          >
            {__("Upgrade to Pro")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 mb-6">
          <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {__("Additional Services")}
          </h1>
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-md">
            <Sparkles className="w-3 h-3 mr-1" />
            {__("PRO")}
          </div>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {__(
            "Boost your revenue by offering optional add-ons like airport transfers, travel insurance, equipment rental, and meals during trip booking.",
          )}
        </p>
      </div>

      {/* Stats Preview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="border border-gray-200 dark:border-gray-700"
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
          {__("Powerful Features")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border border-gray-200 dark:border-gray-700"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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

      {/* Popular Services */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          {__("Popular Service Types")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className="border border-gray-200 dark:border-gray-700"
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-semibold mb-2">{service.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {service.description}
                    </p>
                    <div className="text-purple-600 dark:text-purple-400 font-semibold text-sm">
                      {service.price}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:pr-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {__("Unlock Additional Services")}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {__(
                "Offer premium add-ons and boost your revenue with Yatra Pro.",
              )}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {__("Airport transfers")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {__("Travel insurance")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {__("Equipment rental")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Button
              className="bg-purple-600 text-white hover:bg-purple-700 px-8 py-3 text-sm font-medium mb-3"
              onClick={() =>
                window.open(
                  "https://wpyatra.com/pricing?module=additional-services",
                  "_blank",
                )
              }
            >
              {__("Upgrade to Pro")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {__("14-day money-back guarantee")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalServicesPremium;
