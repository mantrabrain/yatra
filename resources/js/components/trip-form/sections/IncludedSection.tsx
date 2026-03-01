/**
 * Included Section Component
 * Handles: What's included/excluded at trip level
 */

import React from "react";
import { CheckSquare, Plus, X, AlertCircle } from "lucide-react";
import { TripFormSectionProps } from "../types";
import { SectionHeader } from "../shared/SectionHeader";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { __ } from "../../../lib/i18n";

// Custom Textarea component since it doesn't exist in UI
const Textarea: React.FC<{
  value: string;
  onChange: (e: any) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}> = ({ value, onChange, placeholder, rows = 3, className = "" }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${className}`}
  />
);

interface TripAmenityItem {
  title: string;
  description: string;
}

interface IncludedSectionProps extends TripFormSectionProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
}

export const IncludedSection: React.FC<IncludedSectionProps> = ({
  formData,
  onFieldChange,
}) => {
  const [newIncludedItem, setNewIncludedItem] = React.useState<TripAmenityItem>({
    title: "",
    description: "",
  });

  const [newExcludedItem, setNewExcludedItem] = React.useState<TripAmenityItem>({
    title: "",
    description: "",
  });

  const included_items = formData.included_items || [];
  const excluded_items = formData.excluded_items || [];

  const addIncludedItem = () => {
    if (newIncludedItem.title.trim()) {
      const updatedItems = [...included_items, { ...newIncludedItem }];
      onFieldChange("included_items", updatedItems);
      setNewIncludedItem({ title: "", description: "" });
    }
  };

  const addExcludedItem = () => {
    if (newExcludedItem.title.trim()) {
      const updatedItems = [...excluded_items, { ...newExcludedItem }];
      onFieldChange("excluded_items", updatedItems);
      setNewExcludedItem({ title: "", description: "" });
    }
  };

  const removeIncludedItem = (index: number) => {
    const updatedItems = included_items.filter((_: any, i: number) => i !== index);
    onFieldChange("included_items", updatedItems);
  };

  const removeExcludedItem = (index: number) => {
    const updatedItems = excluded_items.filter((_: any, i: number) => i !== index);
    onFieldChange("excluded_items", updatedItems);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={CheckSquare}
        title="What's Included & Excluded"
        description="Specify what is included and excluded in your trip pricing"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Included Items */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                {__("What's Included", "yatra")}
              </h3>
              <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {included_items.length} {__("items", "yatra")}
              </Badge>
            </div>

            {/* Add New Included Item */}
            <div className="space-y-4 mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
              <div className="space-y-3">
                <Input
                  placeholder={__("Item title (e.g., Airport Transfer)", "yatra")}
                  value={newIncludedItem.title}
                  onChange={(e: any) =>
                    setNewIncludedItem({ ...newIncludedItem, title: e.target.value })
                  }
                  className="border-green-300 dark:border-green-700 focus:ring-green-500 focus:border-green-500"
                />
                <Textarea
                  placeholder={__("Detailed description (optional)", "yatra")}
                  value={newIncludedItem.description}
                  onChange={(e: any) =>
                    setNewIncludedItem({ ...newIncludedItem, description: e.target.value })
                  }
                  rows={3}
                  className="border-green-300 dark:border-green-700 focus:ring-green-500 focus:border-green-500 resize-none"
                />
              </div>
              <Button
                onClick={addIncludedItem}
                disabled={!newIncludedItem.title.trim()}
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                {__("Add Included Item", "yatra")}
              </Button>
            </div>

            {/* Existing Included Items */}
            <div className="space-y-2">
              {included_items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{__("No included items added yet", "yatra")}</p>
                </div>
              ) : (
                included_items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="group flex items-start justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex-1 pr-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIncludedItem(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all duration-200 p-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Excluded Items */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                {__("What's Excluded", "yatra")}
              </h3>
              <Badge variant="error" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {excluded_items.length} {__("items", "yatra")}
              </Badge>
            </div>

            {/* Add New Excluded Item */}
            <div className="space-y-4 mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-xl border border-red-200 dark:border-red-800 shadow-sm">
              <div className="space-y-3">
                <Input
                  placeholder={__("Item title (e.g., International Flights)", "yatra")}
                  value={newExcludedItem.title}
                  onChange={(e: any) =>
                    setNewExcludedItem({ ...newExcludedItem, title: e.target.value })
                  }
                  className="border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500"
                />
                <Textarea
                  placeholder={__("Detailed description (optional)", "yatra")}
                  value={newExcludedItem.description}
                  onChange={(e: any) =>
                    setNewExcludedItem({ ...newExcludedItem, description: e.target.value })
                  }
                  rows={3}
                  className="border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>
              <Button
                onClick={addExcludedItem}
                disabled={!newExcludedItem.title.trim()}
                size="sm"
                className="w-full bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                {__("Add Excluded Item", "yatra")}
              </Button>
            </div>

            {/* Existing Excluded Items */}
            <div className="space-y-2">
              {excluded_items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <X className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{__("No excluded items added yet", "yatra")}</p>
                </div>
              ) : (
                excluded_items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="group flex items-start justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex-1 pr-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExcludedItem(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all duration-200 p-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Tips */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">
                {__("Tips for Included/Excluded Items:", "yatra")}
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>{__("Be specific about what's included (meals, transport, guides, etc.)", "yatra")}</li>
                <li>{__("Clearly mention what's NOT included to avoid confusion", "yatra")}</li>
                <li>{__("Include items that affect pricing decisions", "yatra")}</li>
                <li>{__("Keep descriptions concise but informative", "yatra")}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
