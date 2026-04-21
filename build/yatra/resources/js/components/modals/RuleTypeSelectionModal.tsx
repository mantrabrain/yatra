/**
 * Rule Type Selection Modal
 *
 * Modal popup for selecting dynamic pricing rule type
 *
 * @package Yatra
 * @since 3.0.0
 */

import React from "react";
import {
  Calendar,
  Clock,
  TrendingUp,
  Package,
  Sun,
  Target,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";

interface RuleTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (ruleType: string) => void;
}

const RULE_TYPES = [
  {
    id: "early_bird",
    name: __("Early Bird Discount"),
    description: __("Reward customers who book well in advance"),
    icon: Calendar,
    color: "blue",
    example: __("Example: 10% off for bookings 30+ days early"),
  },
  {
    id: "last_minute",
    name: __("Last Minute Deals"),
    description: __("Fill remaining spots close to departure"),
    icon: Clock,
    color: "orange",
    example: __("Example: 15% off for bookings within 7 days"),
  },
  {
    id: "demand",
    name: __("Demand-Based Pricing"),
    description: __("Adjust prices based on booking velocity"),
    icon: TrendingUp,
    color: "green",
    example: __("Example: Increase price for hot trips, decrease for slow"),
  },
  {
    id: "inventory",
    name: __("Inventory-Based"),
    description: __("Price changes based on remaining capacity"),
    icon: Package,
    color: "purple",
    example: __("Example: Higher price when few spots left"),
  },
  {
    id: "seasonal",
    name: __("Seasonal Pricing"),
    description: __("Adjust for peak and off-peak seasons"),
    icon: Sun,
    color: "yellow",
    example: __("Example: 25% premium during summer months"),
  },
  {
    id: "time_based",
    name: __("Time-Based"),
    description: __("Different prices for weekends vs weekdays"),
    icon: Target,
    color: "indigo",
    example: __("Example: 10% more for weekend bookings"),
  },
];

export const RuleTypeSelectionModal: React.FC<RuleTypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  const handleSelectType = (ruleType: string) => {
    onSelectType(ruleType);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={__("What type of pricing rule do you want to create?")}
      description={__("Choose the rule type that best fits your needs")}
      size="lg"
      maxWidthClassName="max-w-5xl"
      footer={
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {__("Cancel")}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {RULE_TYPES.map((ruleType) => {
          const Icon = ruleType.icon;
          const iconBgColors = {
            blue: "bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800",
            orange:
              "bg-orange-100 dark:bg-orange-900/50 group-hover:bg-orange-200 dark:group-hover:bg-orange-800",
            green:
              "bg-green-100 dark:bg-green-900/50 group-hover:bg-green-200 dark:group-hover:bg-green-800",
            purple:
              "bg-purple-100 dark:bg-purple-900/50 group-hover:bg-purple-200 dark:group-hover:bg-purple-800",
            yellow:
              "bg-yellow-100 dark:bg-yellow-900/50 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800",
            indigo:
              "bg-indigo-100 dark:bg-indigo-900/50 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800",
          };
          const iconColors = {
            blue: "text-blue-600 dark:text-blue-400",
            orange: "text-orange-600 dark:text-orange-400",
            green: "text-green-600 dark:text-green-400",
            purple: "text-purple-600 dark:text-purple-400",
            yellow: "text-yellow-600 dark:text-yellow-400",
            indigo: "text-indigo-600 dark:text-indigo-400",
          };
          const borderColors = {
            blue: "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20",
            orange:
              "hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20",
            green:
              "hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20",
            purple:
              "hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20",
            yellow:
              "hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20",
            indigo:
              "hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
          };
          return (
            <button
              key={ruleType.id}
              onClick={() => handleSelectType(ruleType.id)}
              className={`flex flex-col items-center p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl ${borderColors[ruleType.color as keyof typeof borderColors]} transition-all group text-left`}
            >
              <div
                className={`w-14 h-14 ${iconBgColors[ruleType.color as keyof typeof iconBgColors]} rounded-full flex items-center justify-center mb-4 transition-colors`}
              >
                <Icon
                  className={`w-7 h-7 ${iconColors[ruleType.color as keyof typeof iconColors]}`}
                />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-center">
                {ruleType.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                {ruleType.description}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center italic">
                {ruleType.example}
              </p>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
