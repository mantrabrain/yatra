/**
 * Itinerary Section Component
 * Simple launch button to open the full itinerary builder
 */

import React, { useMemo } from "react";
import { Calendar, ExternalLink, AlertCircle } from "lucide-react";
import { __ } from "../../../lib/i18n";
import { SectionHeader } from "../shared";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";

interface ItinerarySectionProps {
  formData: any;
  isEditMode: boolean;
  tripId: number | null;
}

export const ItinerarySection: React.FC<ItinerarySectionProps> = ({
  formData,
  isEditMode,
  tripId,
}) => {
  const itineraryLink = useMemo(() => {
    if (!isEditMode || !tripId) return null;
    return `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=itinerary&trip_id=${tripId}`;
  }, [isEditMode, tripId]);

  return (
    <>
      <div className="space-y-6">
        <SectionHeader
          icon={Calendar}
          title="Itinerary Builder"
          description="Create detailed day-by-day itineraries with our professional itinerary builder"
        />

        {/* Launch Itinerary Builder Card */}
        {itineraryLink ? (
          <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-2">
                  <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {__("Professional Itinerary Builder", "yatra")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    {__(
                      "Create detailed day-by-day itineraries with activities, meals, accommodation, transportation, and more. Build professional trip schedules that help travelers understand the complete experience.",
                      "yatra",
                    )}
                  </p>
                </div>

                {/* Current Itinerary Stats */}
                {formData.itinerary_days &&
                  formData.itinerary_days.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formData.itinerary_days.length}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {formData.itinerary_days.length === 1
                            ? __("Day", "yatra")
                            : __("Days", "yatra")}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formData.itinerary_days.reduce(
                            (sum: number, day: any) =>
                              sum + (day.entries?.length || 0),
                            0,
                          )}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {__("Activities", "yatra")}
                        </div>
                      </div>
                    </div>
                  )}

                <div>
                  <Button
                    type="button"
                    onClick={() =>
                      window.open(
                        itineraryLink,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    {__("Launch Itinerary Builder", "yatra")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {__("Save Trip First", "yatra")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {__(
                  "Please save this trip first to access the itinerary builder. The builder will automatically load this trip for you.",
                  "yatra",
                )}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};
