/**
 * Scheduled Payments Premium Page
 *
 * Premium upgrade page for the Scheduled Payments module.
 * Shows when Yatra Pro is not active or the module is not enabled.
 *
 * @package Yatra
 */

import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { __ } from "../../lib/i18n";
import {
  CalendarClock,
  CreditCard,
  Link as LinkIcon,
  BellRing,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ListChecks,
} from "lucide-react";

const ScheduledPaymentsPremium: React.FC = () => {
  const features = [
    {
      icon: CreditCard,
      title: __("Automatic balance collection"),
      description: __(
        "Take the deposit at checkout and let Yatra charge the remaining balance on the date you choose.",
      ),
    },
    {
      icon: LinkIcon,
      title: __("Secure payment links"),
      description: __(
        "For deposits paid by bank transfer or Pay Later, the customer gets a secure link to settle the balance.",
      ),
    },
    {
      icon: BellRing,
      title: __("Balance reminders"),
      description: __(
        "Reminder emails go out before the balance is due, with success and failure notices for you and the customer.",
      ),
    },
    {
      icon: ListChecks,
      title: __("Instalment plans"),
      description: __(
        "Split the balance into several instalments, or collect it in one payment a set number of days before departure.",
      ),
    },
    {
      icon: CalendarClock,
      title: __("Scheduled payments list"),
      description: __(
        "See every upcoming, paid, failed and cancelled balance payment in one place, and cancel any that should not run.",
      ),
    },
    {
      icon: ShieldCheck,
      title: __("Safe by design"),
      description: __(
        "A balance is re-checked before every charge, so a booking that was cancelled or already settled is never charged.",
      ),
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
                  "Scheduled Payments is a premium module. Upgrade to Yatra Pro to collect booking balances automatically.",
                )}
              </p>
            </div>
          </div>
          <Button
            className="bg-amber-600 text-white hover:bg-amber-700 px-6 py-2 text-sm font-medium"
            onClick={() =>
              window.open(
                "https://wpyatra.com/pricing?module=scheduled-payments",
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
          <CalendarClock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {__("Scheduled Payments")}
          </h1>
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-md">
            <Sparkles className="w-3 h-3 mr-1" />
            {__("PRO")}
          </div>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {__(
            "Let travellers pay a deposit today and have Yatra collect the balance before departure — automatically, or with a secure payment link.",
          )}
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <Card key={index} className="h-full">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 mb-4">
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduledPaymentsPremium;
