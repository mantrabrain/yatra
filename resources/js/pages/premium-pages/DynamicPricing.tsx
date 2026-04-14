/**
 * Dynamic Pricing Premium Page
 *
 * Premium upgrade page for Dynamic Pricing module.
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
  Target,
  DollarSign,
  Calendar,
  Users,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  BarChart,
  Clock,
  Activity,
} from "lucide-react";

// Premium Upgrade Component
const DynamicPricingPremium: React.FC = () => {
  const features = [
    {
      icon: Target,
      title: __("Smart Pricing Rules"),
      description: __(
        "Create intelligent pricing rules based on demand, season, and booking patterns.",
      ),
    },
    {
      icon: Calendar,
      title: __("Time-based Pricing"),
      description: __(
        "Set different prices for early bookings, last-minute deals, and peak seasons.",
      ),
    },
    {
      icon: Users,
      title: __("Group Pricing"),
      description: __(
        "Offer tiered pricing based on group size and booking volume.",
      ),
    },
    {
      icon: BarChart,
      title: __("Revenue Analytics"),
      description: __(
        "Track pricing performance and optimize your revenue strategy.",
      ),
    },
  ];

  const stats = [
    {
      icon: TrendingUp,
      value: "42%",
      label: __("Revenue Increase"),
    },
    {
      icon: Users,
      value: "3.2x",
      label: __("Booking Conversion"),
    },
    {
      icon: Target,
      value: "Unlimited",
      label: __("Pricing Rules"),
    },
    {
      icon: DollarSign,
      value: "Auto",
      label: __("Price Optimization"),
    },
  ];

  const popularRules = [
    {
      icon: Clock,
      title: __("Early Bird Discounts"),
      description: __("Reward early bookings with attractive discounts."),
      discount: __("Save up to 20%"),
    },
    {
      icon: Zap,
      title: __("Last-minute Deals"),
      description: __("Fill remaining spots with dynamic last-minute pricing."),
      discount: __("Save up to 30%"),
    },
    {
      icon: Calendar,
      title: __("Seasonal Pricing"),
      description: __(
        "Adjust prices automatically based on peak and off-peak seasons.",
      ),
      discount: __("Varies by season"),
    },
    {
      icon: Users,
      title: __("Group Discounts"),
      description: __("Offer better rates for larger group bookings."),
      discount: __("Save 10-25%"),
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
                  "Dynamic Pricing is a premium module. Upgrade to Yatra Pro to unlock intelligent pricing automation.",
                )}
              </p>
            </div>
          </div>
          <Button
            className="bg-amber-600 text-white hover:bg-amber-700 px-6 py-2 text-sm font-medium"
            onClick={() =>
              window.open(
                "https://wpyatra.com/pricing?module=dynamic-pricing",
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-6">
          <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {__("Dynamic Pricing")}
          </h1>
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-md">
            <Sparkles className="w-3 h-3 mr-1" />
            {__("PRO")}
          </div>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {__(
            "Maximize your revenue with intelligent pricing that automatically adjusts based on demand, season, and booking patterns.",
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
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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

      {/* Popular Rules */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          {__("Popular Pricing Rules")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularRules.map((rule, index) => {
            const Icon = rule.icon;
            return (
              <Card
                key={index}
                className="border border-gray-200 dark:border-gray-700"
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-semibold mb-2">{rule.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {rule.description}
                    </p>
                    <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                      {rule.discount}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <Card className="mb-12 border border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {__("How It Works")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {__("Intelligent pricing in 4 simple steps")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold mb-2">{__("1. Set Rules")}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__(
                  "Define pricing rules based on demand, season, and booking patterns",
                )}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold mb-2">{__("2. Monitor Demand")}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__("System tracks booking patterns and demand in real-time")}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold mb-2">{__("3. Auto-Adjust")}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__(
                  "Prices automatically adjust based on your predefined rules",
                )}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="font-semibold mb-2">
                {__("4. Maximize Revenue")}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__("Optimize pricing for maximum revenue and occupancy")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:pr-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {__("Unlock Dynamic Pricing")}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {__(
                "Get intelligent price adjustments and maximize your revenue with Yatra Pro.",
              )}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {__("Early bird discounts")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {__("Last-minute deals")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {__("Demand-based pricing")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 text-sm font-medium mb-3"
              onClick={() =>
                window.open(
                  "https://wpyatra.com/pricing?module=dynamic-pricing",
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

export default DynamicPricingPremium;
