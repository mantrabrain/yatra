/**
 * Recurring Availability Rule Form
 * Create and edit recurring availability patterns
 */

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  Clock,
  DollarSign,
  RefreshCw,
  Plus,
  X,
  AlertCircle,
  Eye,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { SearchableSelect } from "../components/ui/searchable-select";
import { DatePicker } from "../components/ui/date-picker";
import { TimePicker } from "../components/ui/time-picker";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Alert } from "../components/ui/alert";
import { useNavigate } from "../hooks/useNavigate";
import { apiClient } from "../lib/api-client";
import { useToast } from "../components/ui/toast";
import { RecurringRuleFormSkeleton } from "../components/availability/RecurringRuleFormSkeleton";
import { LocationPicker } from "../components/trip-form/LocationPicker";

function coordFromApi(v: unknown): string {
  if (v == null || v === "") return "";
  return String(v);
}

interface Trip {
  id: number;
  title: string;
  trip_type?: "single_day" | "multi_day";
  duration_days?: number;
  starting_location?: string;
  ending_location?: string;
  starting_latitude?: string | number;
  starting_longitude?: string | number;
  ending_latitude?: string | number;
  ending_longitude?: string | number;
  pricing_type?: "regular" | "traveler_based";
}

interface TravelerCategory {
  id: number;
  name?: string;
  label?: string;
  description?: string;
  min_age?: number;
  max_age?: number;
  age_min?: number;
  age_max?: number;
  status?: string;
}

interface TravelerPricing {
  category_id: number;
  original_price: number;
  sale_price?: number;
}

interface TimeSlot {
  departure_time: string;
  arrival_time: string;
  seats: number;
  price: number;
  sale_price?: number;
  traveler_pricing?: TravelerPricing[];
}

interface RecurringRule {
  id?: number;
  trip_id: number;
  name: string;
  rule_type: "weekly" | "monthly" | "interval";
  days_of_week: number[];
  week_of_month?: "first" | "second" | "third" | "fourth" | "last";
  day_of_week?: number;
  interval_days?: number;
  start_date: string;
  end_date?: string;
  excluded_dates: string[];
  months: number[]; // Array of month numbers (1-12) to filter by
  time_slots: TimeSlot[]; // For single-day trips with multiple slots
  pricing_type: "regular" | "traveler_based"; // Allow override of trip's pricing type
  original_price?: number;
  sale_price?: number;
  traveler_pricing?: TravelerPricing[]; // For traveler-based pricing
  seats_total: number;
  departure_time?: string;
  arrival_time?: string;
  from_location?: string;
  to_location?: string;
  from_latitude?: string;
  from_longitude?: string;
  to_latitude?: string;
  to_longitude?: string;
  cutoff_hours: number;
  alert_threshold: number;
  status: "active" | "inactive";
}

const dayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const weekOptions = [
  { value: "first", label: "First" },
  { value: "second", label: "Second" },
  { value: "third", label: "Third" },
  { value: "fourth", label: "Fourth" },
  { value: "last", label: "Last" },
];

const RecurringRuleForm: React.FC = () => {
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Get parameters from URL
  const params = new URLSearchParams(window.location.search);
  const ruleId = params.get("id");
  const tripIdFromUrl = params.get("trip_id");
  const isEditing = !!ruleId;

  // Form state
  const [formData, setFormData] = useState<RecurringRule>({
    trip_id: tripIdFromUrl ? parseInt(tripIdFromUrl) : 0,
    name: "",
    rule_type: "weekly",
    days_of_week: [0], // Sunday by default
    week_of_month: "first",
    day_of_week: 0,
    interval_days: 7,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    excluded_dates: [],
    months: [], // Empty = all months, otherwise specific months (1-12)
    time_slots: [], // For single-day trips with multiple slots
    pricing_type: "regular", // Will be updated based on trip's pricing type
    original_price: undefined,
    sale_price: undefined,
    traveler_pricing: [], // For traveler-based pricing
    seats_total: 20,
    departure_time: "",
    arrival_time: "",
    from_location: "",
    to_location: "",
    from_latitude: "",
    from_longitude: "",
    to_latitude: "",
    to_longitude: "",
    cutoff_hours: 24,
    alert_threshold: 5,
    status: "active",
  });

  const [newExcludedDate, setNewExcludedDate] = useState("");
  const [previewData, setPreviewData] = useState<{
    total: number;
    dates: any[];
  } | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Fetch trips for dropdown
  const { data: tripsData } = useQuery({
    queryKey: ["trips", "all"],
    queryFn: async () => {
      const response = await apiClient.get("/trips", {
        params: { per_page: 100, status: "publish" },
      });
      return {
        trips: (response?.data || []).map((trip: any) => {
          // Some endpoints return `pricing_type` as "regular" even when the trip is
          // effectively traveler-based (price types configured). Infer the effective
          // pricing type from `price_types` when present so the Rules UI reflects
          // real trip configuration.
          const rawPriceTypes = trip.price_types;
          const hasTravelerPricing =
            Array.isArray(rawPriceTypes) ? rawPriceTypes.length > 0 : false;
          const effectivePricingType =
            hasTravelerPricing ? "traveler_based" : trip.pricing_type || "regular";

          return {
            id: Number(trip.id) || 0,
            title: trip.title,
            trip_type:
              trip.trip_type ||
              (trip.duration_days <= 1 ? "single_day" : "multi_day"),
            duration_days: trip.duration_days || 1,
            starting_location: trip.starting_location,
            ending_location: trip.ending_location,
            pricing_type: effectivePricingType,
          };
        }) as Trip[],
      };
    },
  });

  // Fetch traveler categories
  const { data: travelerCategories = [] } = useQuery({
    queryKey: ["traveler-categories"],
    queryFn: async () => {
      const response = await apiClient.get("/traveler-categories", {
        params: { per_page: 100 },
      });
      return (response?.data || []) as TravelerCategory[];
    },
  });

  // Get selected trip details
  const selectedTrip = tripsData?.trips.find((t) => t.id === formData.trip_id);
  const { data: tripForLocations } = useQuery({
    queryKey: ["trip", formData.trip_id, "recurring-rule-locations"],
    queryFn: async () => {
      const response = await apiClient.get(`/trips/${formData.trip_id}`);
      return response?.data || response || null;
    },
    enabled: formData.trip_id > 0,
    staleTime: 5 * 60 * 1000,
  });
  const { data: fallbackTripData } = useQuery({
    queryKey: ["trip", formData.trip_id, "recurring-rule-form"],
    queryFn: async () => {
      if (!formData.trip_id || selectedTrip) {
        return null;
      }
      const response = await apiClient.get(`/trips/${formData.trip_id}`);
      return response?.data || response || null;
    },
    enabled: !!formData.trip_id && !selectedTrip,
    staleTime: 5 * 60 * 1000,
  });
  const effectiveTrip =
    selectedTrip ||
    (fallbackTripData
      ? {
          id: Number(fallbackTripData.id) || formData.trip_id,
          title: fallbackTripData.title,
        }
      : null);
  const tripNameLabel = effectiveTrip?.title || __("Unnamed Trip", "yatra");
  let headerDescription = __(
    "Set up automatic availability patterns for your trips",
    "yatra",
  );
  if (effectiveTrip) {
    headerDescription = `${isEditing ? __("Edit", "yatra") : __("Add", "yatra")} ${__("availability rule for", "yatra")} ${tripNameLabel} (Trip ID: ${effectiveTrip.id})`;
  } else if (formData.trip_id) {
    headerDescription = `${isEditing ? __("Edit", "yatra") : __("Add", "yatra")} ${__("availability rule for Trip ID:", "yatra")} ${formData.trip_id}`;
  }
  const isSingleDayTrip =
    selectedTrip?.trip_type === "single_day" ||
    (selectedTrip?.duration_days || 1) <= 1;
  // Use form's pricing_type which defaults to trip's pricing type but can be overridden
  const isTravelerBasedPricing = formData.pricing_type === "traveler_based";

  // Fetch existing rule if editing
  const { data: existingRule, isLoading: isLoadingRule } = useQuery({
    queryKey: ["recurring-availability", ruleId],
    queryFn: async () => {
      if (!ruleId) return null;
      const response = await apiClient.get(`/recurring-availability/${ruleId}`);
      return response?.data || response; // Unwrap data property from API response
    },
    enabled: !!ruleId,
  });

  // Update form when existing rule is loaded
  useEffect(() => {
    if (existingRule && tripsData) {
      // Parse days_of_week - handle both array and string formats
      let daysOfWeek = [0]; // Default to Sunday
      if (
        existingRule.days_of_week_array &&
        Array.isArray(existingRule.days_of_week_array)
      ) {
        daysOfWeek = existingRule.days_of_week_array;
      } else if (existingRule.days_of_week) {
        if (typeof existingRule.days_of_week === "string") {
          daysOfWeek = existingRule.days_of_week
            .split(",")
            .map(Number)
            .filter((n: number) => !isNaN(n));
        } else if (Array.isArray(existingRule.days_of_week)) {
          daysOfWeek = existingRule.days_of_week.map(Number);
        }
      }

      // Ensure rule_type is properly typed
      const ruleType = (existingRule.rule_type || "weekly") as
        | "weekly"
        | "monthly"
        | "interval";

      // Prefer the *trip's effective* pricing type over any stale rule.pricing_type.
      // Trips can be traveler-based simply by having price_types configured, even if
      // trip.pricing_type is still "regular".
      const tripRow = tripsData.trips.find((t) => t.id === Number(existingRule.trip_id));
      const effectivePricingType =
        tripRow?.pricing_type ||
        ((tripForLocations as any)?.price_types &&
        Array.isArray((tripForLocations as any).price_types) &&
        (tripForLocations as any).price_types.length > 0
          ? "traveler_based"
          : (tripForLocations as any)?.pricing_type) ||
        "regular";

      setFormData({
        trip_id: existingRule.trip_id || 0,
        name: existingRule.name || "",
        rule_type: ruleType,
        days_of_week: daysOfWeek.length > 0 ? daysOfWeek : [0],
        week_of_month: existingRule.week_of_month || "first",
        day_of_week: existingRule.day_of_week ?? 0,
        interval_days: existingRule.interval_days || 7,
        start_date:
          existingRule.start_date || new Date().toISOString().split("T")[0],
        end_date: existingRule.end_date || "",
        excluded_dates: Array.isArray(existingRule.excluded_dates)
          ? existingRule.excluded_dates
          : [],
        months: Array.isArray(existingRule.months) ? existingRule.months : [],
        time_slots: Array.isArray(existingRule.time_slots)
          ? existingRule.time_slots
          : [],
        pricing_type: effectivePricingType as "regular" | "traveler_based",
        original_price: existingRule.original_price,
        sale_price: existingRule.sale_price,
        traveler_pricing: Array.isArray(existingRule.traveler_pricing)
          ? existingRule.traveler_pricing
          : [],
        seats_total: existingRule.seats_total || 20,
        departure_time: existingRule.departure_time || "",
        arrival_time: existingRule.arrival_time || "",
        from_location: existingRule.from_location || "",
        to_location: existingRule.to_location || "",
        from_latitude: coordFromApi(existingRule.from_latitude),
        from_longitude: coordFromApi(existingRule.from_longitude),
        to_latitude: coordFromApi(existingRule.to_latitude),
        to_longitude: coordFromApi(existingRule.to_longitude),
        cutoff_hours: existingRule.cutoff_hours || 24,
        alert_threshold: existingRule.alert_threshold || 5,
        status: existingRule.status || "active",
      });
    }
  }, [existingRule, tripsData, tripForLocations]);

  // Set pricing type based on selected trip when not editing
  useEffect(() => {
    if (!isEditing && !existingRule) {
      const inferred = (() => {
        const priceTypes = (tripForLocations as any)?.price_types;
        const hasTravelerPricing = Array.isArray(priceTypes) && priceTypes.length > 0;
        return (hasTravelerPricing
          ? "traveler_based"
          : (selectedTrip?.pricing_type || (tripForLocations as Trip)?.pricing_type || "regular")
        ) as "regular" | "traveler_based";
      })();

      setFormData((prev) => ({
        ...prev,
        ...(selectedTrip || tripForLocations
          ? {
              pricing_type: inferred,
            }
          : {}),
        ...(tripForLocations
          ? {
              from_location:
                prev.from_location ||
                (tripForLocations as Trip).starting_location ||
                "",
              to_location:
                prev.to_location ||
                (tripForLocations as Trip).ending_location ||
                "",
              from_latitude:
                prev.from_latitude ||
                coordFromApi((tripForLocations as Trip).starting_latitude),
              from_longitude:
                prev.from_longitude ||
                coordFromApi((tripForLocations as Trip).starting_longitude),
              to_latitude:
                prev.to_latitude ||
                coordFromApi((tripForLocations as Trip).ending_latitude),
              to_longitude:
                prev.to_longitude ||
                coordFromApi((tripForLocations as Trip).ending_longitude),
            }
          : {}),
      }));
    }
  }, [isEditing, selectedTrip, tripForLocations, existingRule]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: RecurringRule) => {
      // `days_of_week` is a JSON column on the backend; send the array as-is
      // and let the API JSON-encode it. Sending a CSV string (e.g. "0,1,2,3")
      // is rejected by MySQL with "Invalid JSON text".
      return await apiClient.post("/recurring-availability", {
        ...data,
        days_of_week: Array.isArray(data.days_of_week) ? data.days_of_week : [],
        // Normalize month-week selector to backend contract.
        week_of_month:
          data.rule_type === "monthly"
            ? ((data.week_of_month || "first") as string).toLowerCase()
            : data.week_of_month,
        // On create, omit empty arrays to keep payload small.
        time_slots: data.time_slots.length > 0 ? data.time_slots : undefined,
        traveler_pricing:
          data.traveler_pricing && data.traveler_pricing.length > 0
            ? data.traveler_pricing
            : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-availability"] });
      showToast(__("Recurring rule created successfully", "yatra"), "success");
      navigate({
        subpage: "trips",
        tab: "availability",
        trip_id: formData.trip_id.toString(),
      });
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to create rule", "yatra"),
        "error",
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: RecurringRule) => {
      return await apiClient.put(`/recurring-availability/${ruleId}`, {
        ...data,
        days_of_week: Array.isArray(data.days_of_week) ? data.days_of_week : [],
        week_of_month:
          data.rule_type === "monthly"
            ? ((data.week_of_month || "first") as string).toLowerCase()
            : data.week_of_month,
        // IMPORTANT: on update, send empty arrays explicitly to clear persisted
        // JSON columns; omitting the key leaves the old value in DB.
        time_slots: Array.isArray(data.time_slots) ? data.time_slots : [],
        traveler_pricing: Array.isArray(data.traveler_pricing)
          ? data.traveler_pricing
          : [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-availability"] });
      showToast(__("Recurring rule updated successfully", "yatra"), "success");
      navigate({
        subpage: "trips",
        tab: "availability",
        trip_id: formData.trip_id.toString(),
      });
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to update rule", "yatra"),
        "error",
      );
    },
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (data: RecurringRule) => {
      return await apiClient.post("/recurring-availability/preview", {
        ...data,
        days_of_week: Array.isArray(data.days_of_week) ? data.days_of_week : [],
        week_of_month:
          data.rule_type === "monthly"
            ? ((data.week_of_month || "first") as string).toLowerCase()
            : data.week_of_month,
        time_slots: data.time_slots.length > 0 ? data.time_slots : undefined,
        traveler_pricing:
          data.traveler_pricing && data.traveler_pricing.length > 0
            ? data.traveler_pricing
            : undefined,
        preview_limit: 20,
      });
    },
    onSuccess: (response) => {
      // Unwrap the data property from API response
      const previewResult = response?.data || response;
      setPreviewData(previewResult);
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to generate preview", "yatra"),
        "error",
      );
    },
  });

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.trip_id) {
      showToast(__("Please select a trip", "yatra"), "error");
      return;
    }

    if (formData.rule_type === "weekly" && formData.days_of_week.length === 0) {
      showToast(
        __("Please select at least one day of the week", "yatra"),
        "error",
      );
      return;
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  // Handle day toggle for weekly rules
  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort((a, b) => a - b),
    }));
  };

  // Add excluded date
  const addExcludedDate = () => {
    if (newExcludedDate && !formData.excluded_dates.includes(newExcludedDate)) {
      setFormData((prev) => ({
        ...prev,
        excluded_dates: [...prev.excluded_dates, newExcludedDate].sort(),
      }));
      setNewExcludedDate("");
    }
  };

  // Remove excluded date
  const removeExcludedDate = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      excluded_dates: prev.excluded_dates.filter((d) => d !== date),
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingRule) {
    return <RecurringRuleFormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isEditing
            ? __("Edit Recurring Rule", "yatra")
            : __("Create Recurring Rule", "yatra")
        }
        description={headerDescription}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              navigate({
                subpage: "trips",
                tab: "availability",
                trip_id: formData.trip_id?.toString() || tripIdFromUrl || "",
              })
            }
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {__("Back to Availability", "yatra")}
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>{__("Basic Information", "yatra")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("Trip", "yatra")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      value={formData.trip_id?.toString() || ""}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          trip_id: parseInt(value) || 0,
                          // Reset pricing when trip changes and set pricing_type based on new trip
                          pricing_type: (tripsData?.trips.find(
                            (t) => t.id === parseInt(value),
                          )?.pricing_type || "regular") as
                            | "regular"
                            | "traveler_based",
                          traveler_pricing: [],
                          original_price: undefined,
                          sale_price: undefined,
                        }))
                      }
                      options={[
                        { value: "", label: __("-- Select Trip --", "yatra") },
                        ...(tripsData?.trips.map((trip) => ({
                          value: trip.id.toString(),
                          label: `${trip.title} (${trip.pricing_type === "traveler_based" ? "Traveler-Based" : "Regular"})`,
                        })) || []),
                      ]}
                      placeholder={__("Select a trip", "yatra")}
                      disabled={isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("Rule Name", "yatra")}
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder={__("e.g., Weekend Departures", "yatra")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__("Rule Type", "yatra")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.rule_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rule_type: e.target.value as
                          | "weekly"
                          | "monthly"
                          | "interval",
                      }))
                    }
                  >
                    <option value="weekly">
                      {__("Weekly (specific days)", "yatra")}
                    </option>
                    <option value="monthly">
                      {__("Monthly (e.g., first Sunday)", "yatra")}
                    </option>
                    <option value="interval">
                      {__("Interval (every X days)", "yatra")}
                    </option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pattern Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  {__("Recurrence Pattern", "yatra")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.rule_type === "weekly" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {__("Days of Week", "yatra")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {dayOptions.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            formData.days_of_week.includes(day.value)
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.rule_type === "monthly" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__("Week of Month", "yatra")}
                      </label>
                      <Select
                        value={formData.week_of_month || "first"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            week_of_month: e.target.value as any,
                          }))
                        }
                      >
                        {weekOptions.map((week) => (
                          <option key={week.value} value={week.value}>
                            {week.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__("Day of Week", "yatra")}
                      </label>
                      <Select
                        value={formData.day_of_week?.toString() || "0"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            day_of_week: parseInt(e.target.value),
                          }))
                        }
                      >
                        {dayOptions.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                )}

                {formData.rule_type === "interval" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("Every X Days", "yatra")}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={formData.interval_days || 7}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          interval_days: parseInt(e.target.value) || 7,
                        }))
                      }
                    />
                  </div>
                )}

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("Start Date", "yatra")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.start_date}
                      onChange={(value: string) =>
                        setFormData((prev) => ({ ...prev, start_date: value }))
                      }
                      placeholder={__("Select start date", "yatra")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__("End Date", "yatra")}{" "}
                      <span className="text-gray-400">
                        ({__("optional", "yatra")})
                      </span>
                    </label>
                    <DatePicker
                      value={formData.end_date || ""}
                      onChange={(value: string) =>
                        setFormData((prev) => ({ ...prev, end_date: value }))
                      }
                      minDate={
                        formData.start_date
                          ? new Date(formData.start_date)
                          : undefined
                      }
                      placeholder={__("Select end date (optional)", "yatra")}
                    />
                  </div>
                </div>

                {/* Month Filter */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__("Specific Months", "yatra")}{" "}
                    <span className="text-gray-400">
                      ({__("optional - leave empty for all months", "yatra")})
                    </span>
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {[
                      { value: 1, label: __("January", "yatra") },
                      { value: 2, label: __("February", "yatra") },
                      { value: 3, label: __("March", "yatra") },
                      { value: 4, label: __("April", "yatra") },
                      { value: 5, label: __("May", "yatra") },
                      { value: 6, label: __("June", "yatra") },
                      { value: 7, label: __("July", "yatra") },
                      { value: 8, label: __("August", "yatra") },
                      { value: 9, label: __("September", "yatra") },
                      { value: 10, label: __("October", "yatra") },
                      { value: 11, label: __("November", "yatra") },
                      { value: 12, label: __("December", "yatra") },
                    ].map((month) => (
                      <label
                        key={month.value}
                        className={`flex items-center justify-center px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                          formData.months.includes(month.value)
                            ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300"
                            : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.months.includes(month.value)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData((prev) => ({
                              ...prev,
                              months: checked
                                ? [...prev.months, month.value].sort(
                                    (a, b) => a - b,
                                  )
                                : prev.months.filter((m) => m !== month.value),
                            }));
                          }}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">
                          {month.label.slice(0, 3)}
                        </span>
                      </label>
                    ))}
                  </div>
                  {formData.months.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {__("Selected:", "yatra")} {formData.months.length}{" "}
                      {formData.months.length === 1
                        ? __("month", "yatra")
                        : __("months", "yatra")}
                    </p>
                  )}
                </div>

                {/* Excluded Dates */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__("Excluded Dates", "yatra")}{" "}
                    <span className="text-gray-400">
                      ({__("holidays, etc.", "yatra")})
                    </span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <DatePicker
                        value={newExcludedDate}
                        onChange={(value: string) => setNewExcludedDate(value)}
                        placeholder={__("Select date to exclude", "yatra")}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addExcludedDate}
                      disabled={!newExcludedDate}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.excluded_dates.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.excluded_dates.map((date) => (
                        <Badge
                          key={date}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {new Date(date + "T00:00:00").toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                          <button
                            type="button"
                            onClick={() => removeExcludedDate(date)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Capacity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {__("Pricing & Availability", "yatra")}
                </CardTitle>
                <CardDescription>
                  {__(
                    "Set pricing for traveler categories and seat availability for this rule",
                    "yatra",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing Override Info */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <svg
                        className="w-5 h-5 text-amber-600 dark:text-amber-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {__("Pricing Override (Optional)", "yatra")}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {__(
                          "Leave pricing fields empty to use the trip's default pricing. Fill them in only if you want to override the default pricing for dates generated by this rule.",
                          "yatra",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pricing Type Info - Inherited from Trip */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${isTravelerBasedPricing ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}
                    >
                      {isTravelerBasedPricing ? (
                        <svg
                          className="w-5 h-5 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {isTravelerBasedPricing
                          ? __("Traveler-Based Pricing", "yatra")
                          : __("Regular Pricing", "yatra")}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {isTravelerBasedPricing
                          ? __(
                              "This trip uses traveler category pricing. Set prices for each category below.",
                              "yatra",
                            )
                          : __(
                              "This trip uses regular pricing. Set a single price for all travelers below.",
                              "yatra",
                            )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Regular Pricing Fields */}
                {!isTravelerBasedPricing && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {__("Original Price", "yatra")}{" "}
                          <span className="text-gray-400 text-xs">
                            ({__("Optional", "yatra")})
                          </span>
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={formData.original_price || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              original_price:
                                parseFloat(e.target.value) || undefined,
                            }))
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {__("Sale Price", "yatra")}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={formData.sale_price || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              sale_price:
                                parseFloat(e.target.value) || undefined,
                            }))
                          }
                          placeholder="0.00"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {__("Leave empty if no discount", "yatra")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Traveler-Based Pricing */}
                {isTravelerBasedPricing && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__("Traveler Category Pricing", "yatra")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        {__(
                          "Add pricing for traveler categories. Categories are managed in Traveler Categories page.",
                          "yatra",
                        )}
                      </p>
                    </div>

                    {/* Active Categories Filter */}
                    {(() => {
                      const activeCategories = travelerCategories.filter(
                        (cat: TravelerCategory) =>
                          cat.status === "active" || cat.status === "publish",
                      );

                      if (activeCategories.length === 0) {
                        return (
                          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {__(
                                "No active traveler categories found.",
                                "yatra",
                              )}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                (window.location.href =
                                  "?page=yatra&subpage=traveler-categories&action=create")
                              }
                              className="flex items-center gap-2 mx-auto"
                            >
                              <Plus className="w-4 h-4" />
                              {__("Create Category", "yatra")}
                            </Button>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {/* Add Pricing Button with Dropdown */}
                          <div className="relative">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setShowCategorySelector(!showCategorySelector)
                              }
                              className="flex items-center gap-2"
                              disabled={
                                activeCategories.filter(
                                  (cat) =>
                                    !formData.traveler_pricing?.some(
                                      (tp) => tp.category_id === cat.id,
                                    ),
                                ).length === 0
                              }
                            >
                              <Plus className="w-4 h-4" />
                              {__("Add Pricing", "yatra")}
                            </Button>

                            {/* Category Selection Dropdown */}
                            {showCategorySelector && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowCategorySelector(false)}
                                />
                                <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                                  <div className="p-2">
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 px-3 py-2 mb-1">
                                      {__(
                                        "Select a category to add pricing",
                                        "yatra",
                                      )}
                                    </div>
                                    {activeCategories.filter(
                                      (cat) =>
                                        !formData.traveler_pricing?.some(
                                          (tp) => tp.category_id === cat.id,
                                        ),
                                    ).length === 0 ? (
                                      <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                                        {__(
                                          "All categories have pricing added",
                                          "yatra",
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        {activeCategories
                                          .filter(
                                            (cat) =>
                                              !formData.traveler_pricing?.some(
                                                (tp) =>
                                                  tp.category_id === cat.id,
                                              ),
                                          )
                                          .map((category: TravelerCategory) => {
                                            const minAge =
                                              category.age_min ??
                                              category.min_age;
                                            const maxAge =
                                              category.age_max ??
                                              category.max_age;
                                            const ageRange =
                                              minAge !== undefined ||
                                              maxAge !== undefined
                                                ? minAge !== undefined &&
                                                  maxAge !== undefined
                                                  ? `${minAge}-${maxAge} ${__("years", "yatra")}`
                                                  : minAge !== undefined
                                                    ? `${minAge}+ ${__("years", "yatra")}`
                                                    : maxAge !== undefined
                                                      ? `${__("Under", "yatra")} ${maxAge} ${__("years", "yatra")}`
                                                      : ""
                                                : null;
                                            const categoryName =
                                              category.label ||
                                              category.name ||
                                              `Category ${category.id}`;

                                            return (
                                              <button
                                                key={category.id}
                                                type="button"
                                                onClick={() => {
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    traveler_pricing: [
                                                      ...(prev.traveler_pricing ||
                                                        []),
                                                      {
                                                        category_id:
                                                          category.id,
                                                        original_price: 0,
                                                        sale_price: undefined,
                                                      },
                                                    ],
                                                  }));
                                                  setShowCategorySelector(
                                                    false,
                                                  );
                                                }}
                                                className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                              >
                                                <div className="font-medium text-sm text-gray-900 dark:text-white">
                                                  {categoryName}
                                                  {ageRange && (
                                                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                      ({ageRange})
                                                    </span>
                                                  )}
                                                </div>
                                                {category.description && (
                                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {category.description}
                                                  </div>
                                                )}
                                              </button>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Added Pricing List */}
                          {formData.traveler_pricing &&
                            formData.traveler_pricing.length > 0 && (
                              <div className="space-y-3">
                                {formData.traveler_pricing.map(
                                  (pricing, index) => {
                                    const category = activeCategories.find(
                                      (cat) => cat.id === pricing.category_id,
                                    );
                                    if (!category) return null;

                                    const minAge =
                                      category.age_min ?? category.min_age;
                                    const maxAge =
                                      category.age_max ?? category.max_age;
                                    const categoryName =
                                      category.label ||
                                      category.name ||
                                      `Category ${pricing.category_id}`;

                                    return (
                                      <div
                                        key={pricing.category_id}
                                        className="p-4 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                                      >
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {categoryName}
                                                {(minAge !== undefined ||
                                                  maxAge !== undefined) && (
                                                  <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                    (
                                                    {minAge !== undefined &&
                                                    maxAge !== undefined
                                                      ? `${minAge}-${maxAge} ${__("years", "yatra")}`
                                                      : minAge !== undefined
                                                        ? `${minAge}+ ${__("years", "yatra")}`
                                                        : maxAge !== undefined
                                                          ? `${__("Under", "yatra")} ${maxAge} ${__("years", "yatra")}`
                                                          : ""}
                                                    )
                                                  </span>
                                                )}
                                              </h4>
                                            </div>
                                            {category.description && (
                                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {category.description}
                                              </p>
                                            )}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const categoryIdToRemove =
                                                pricing.category_id;
                                              setFormData((prev) => ({
                                                ...prev,
                                                traveler_pricing: (
                                                  prev.traveler_pricing || []
                                                ).filter(
                                                  (tp) =>
                                                    tp.category_id !==
                                                    categoryIdToRemove,
                                                ),
                                              }));
                                            }}
                                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title={__(
                                              "Remove Pricing",
                                              "yatra",
                                            )}
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                              {__("Original Price", "yatra")}{" "}
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            </label>
                                            <Input
                                              type="number"
                                              min={0}
                                              step="0.01"
                                              value={
                                                pricing.original_price || ""
                                              }
                                              onChange={(e) => {
                                                const newPricing = [
                                                  ...(formData.traveler_pricing ||
                                                    []),
                                                ];
                                                newPricing[
                                                  index
                                                ].original_price =
                                                  parseFloat(e.target.value) ||
                                                  0;
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  traveler_pricing: newPricing,
                                                }));
                                              }}
                                              placeholder="0.00"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                              {__("Sale Price", "yatra")} (
                                              {__("Optional", "Optional")})
                                            </label>
                                            <Input
                                              type="number"
                                              min={0}
                                              step="0.01"
                                              value={pricing.sale_price || ""}
                                              onChange={(e) => {
                                                const newPricing = [
                                                  ...(formData.traveler_pricing ||
                                                    []),
                                                ];
                                                newPricing[index].sale_price =
                                                  parseFloat(e.target.value) ||
                                                  undefined;
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  traveler_pricing: newPricing,
                                                }));
                                              }}
                                              className="text-sm"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Inventory Management - Common for both pricing types */}
                {selectedTrip && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                      {__("Inventory Management", "yatra")}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {__("Total Capacity", "yatra")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={formData.seats_total}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              seats_total: parseInt(e.target.value) || 1,
                            }))
                          }
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {__(
                            "Maximum number of seats available for this rule",
                            "yatra",
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {__("Alert Threshold", "yatra")}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.alert_threshold}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              alert_threshold: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {__(
                            "Alert when available seats drop below this number",
                            "yatra",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* No trip selected message */}
                {!selectedTrip && (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {__("Select a trip above to configure pricing", "yatra")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Time & Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {__("Time & Location", "yatra")}
                </CardTitle>
                {selectedTrip && (
                  <CardDescription>
                    <Badge
                      variant={isSingleDayTrip ? "default" : "outline"}
                      className="mr-2"
                    >
                      {isSingleDayTrip
                        ? __("Single-Day Trip", "yatra")
                        : __("Multi-Day Trip", "yatra")}
                    </Badge>
                    {!isSingleDayTrip && selectedTrip.duration_days && (
                      <span className="text-gray-500">
                        ({selectedTrip.duration_days} {__("days", "yatra")})
                      </span>
                    )}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Single-Day Trip: Multiple Time Slots */}
                {isSingleDayTrip && formData.trip_id > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {__("Time Slots", "yatra")}
                        <span className="text-gray-400 ml-1">
                          ({__("for each recurring day", "yatra")})
                        </span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            time_slots: [
                              ...prev.time_slots,
                              {
                                departure_time: "09:00",
                                arrival_time: "17:00",
                                seats: 20,
                                price: 0,
                                traveler_pricing: isTravelerBasedPricing
                                  ? []
                                  : undefined,
                              },
                            ],
                          }))
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {__("Add Slot", "yatra")}
                      </Button>
                    </div>

                    {formData.time_slots.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {__("No time slots added yet", "yatra")}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {__(
                            "Add multiple time slots for tours throughout the day (e.g., morning, afternoon, evening)",
                            "yatra",
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.time_slots.map((slot, index) => (
                          <div
                            key={index}
                            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {__("Slot", "yatra")} {index + 1}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    time_slots: prev.time_slots.filter(
                                      (_, i) => i !== index,
                                    ),
                                  }))
                                }
                                className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="space-y-3">
                              {/* Time fields on first line */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    {__("Departure Time", "yatra")}
                                  </label>
                                  <TimePicker
                                    value={slot.departure_time || ""}
                                    onChange={(value: string) => {
                                      const newSlots = [...formData.time_slots];
                                      newSlots[index].departure_time = value;
                                      setFormData((prev) => ({
                                        ...prev,
                                        time_slots: newSlots,
                                      }));
                                    }}
                                    placeholder="09:00"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    {__("Arrival Time", "yatra")}
                                  </label>
                                  <TimePicker
                                    value={slot.arrival_time || ""}
                                    onChange={(value: string) => {
                                      const newSlots = [...formData.time_slots];
                                      newSlots[index].arrival_time = value;
                                      setFormData((prev) => ({
                                        ...prev,
                                        time_slots: newSlots,
                                      }));
                                    }}
                                    placeholder="17:00"
                                  />
                                </div>
                              </div>

                              {/* Seats, Price and Sale Price on second line */}
                              {!isTravelerBasedPricing && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                      {__("Seats", "yatra")}
                                    </label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={slot.seats}
                                      onChange={(e) => {
                                        const newSlots = [
                                          ...formData.time_slots,
                                        ];
                                        newSlots[index].seats =
                                          parseInt(e.target.value) || 1;
                                        setFormData((prev) => ({
                                          ...prev,
                                          time_slots: newSlots,
                                        }));
                                      }}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                      {__("Price", "yatra")}
                                    </label>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={slot.price || ""}
                                      onChange={(e) => {
                                        const newSlots = [
                                          ...formData.time_slots,
                                        ];
                                        newSlots[index].price =
                                          parseFloat(e.target.value) || 0;
                                        setFormData((prev) => ({
                                          ...prev,
                                          time_slots: newSlots,
                                        }));
                                      }}
                                      className="text-sm"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                      {__("Sale Price", "yatra")}
                                    </label>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={slot.sale_price || ""}
                                      onChange={(e) => {
                                        const newSlots = [
                                          ...formData.time_slots,
                                        ];
                                        newSlots[index].sale_price =
                                          parseFloat(e.target.value) ||
                                          undefined;
                                        setFormData((prev) => ({
                                          ...prev,
                                          time_slots: newSlots,
                                        }));
                                      }}
                                      className="text-sm"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* For traveler-based pricing, only show seats on second line */}
                              {isTravelerBasedPricing && (
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    {__("Seats", "yatra")}
                                  </label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={slot.seats}
                                    onChange={(e) => {
                                      const newSlots = [...formData.time_slots];
                                      newSlots[index].seats =
                                        parseInt(e.target.value) || 1;
                                      setFormData((prev) => ({
                                        ...prev,
                                        time_slots: newSlots,
                                      }));
                                    }}
                                    className="text-sm"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Traveler Pricing for Time Slot - only show when traveler-based */}
                            {isTravelerBasedPricing && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      {__("Traveler Category Pricing", "yatra")}
                                    </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {__(
                                        "Set pricing for each traveler category for this time slot",
                                        "yatra",
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {(() => {
                                  const activeCategories =
                                    travelerCategories.filter(
                                      (cat: TravelerCategory) =>
                                        cat.status === "active" ||
                                        cat.status === "publish",
                                    );
                                  const slotTravelerPricing =
                                    slot.traveler_pricing || [];
                                  const availableCategories =
                                    activeCategories.filter(
                                      (cat) =>
                                        !slotTravelerPricing.some(
                                          (tp) => tp.category_id === cat.id,
                                        ),
                                    );

                                  return (
                                    <div className="space-y-3">
                                      {/* Add Pricing Button with Dropdown */}
                                      <div className="relative">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            // Toggle dropdown for this specific slot
                                            const dropdownId = `slot-${index}-category-dropdown`;
                                            const dropdown =
                                              document.getElementById(
                                                dropdownId,
                                              );
                                            if (dropdown) {
                                              dropdown.classList.toggle(
                                                "hidden",
                                              );
                                            }
                                          }}
                                          disabled={
                                            availableCategories.length === 0
                                          }
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          {__("Add Pricing", "yatra")}
                                        </Button>

                                        {/* Category Selection Dropdown */}
                                        <div
                                          id={`slot-${index}-category-dropdown`}
                                          className="hidden absolute top-full left-0 mt-2 w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto"
                                        >
                                          <div className="p-2">
                                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 px-3 py-2 mb-1">
                                              {__(
                                                "Select a category to add pricing",
                                                "yatra",
                                              )}
                                            </div>
                                            {availableCategories.length ===
                                            0 ? (
                                              <div className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                                                {__(
                                                  "All categories have pricing added",
                                                  "yatra",
                                                )}
                                              </div>
                                            ) : (
                                              <div className="space-y-1">
                                                {availableCategories.map(
                                                  (
                                                    category: TravelerCategory,
                                                  ) => {
                                                    const minAge =
                                                      category.age_min ??
                                                      category.min_age;
                                                    const maxAge =
                                                      category.age_max ??
                                                      category.max_age;
                                                    const ageRange =
                                                      minAge !== undefined ||
                                                      maxAge !== undefined
                                                        ? minAge !==
                                                            undefined &&
                                                          maxAge !== undefined
                                                          ? `${minAge}-${maxAge} ${__("years", "yatra")}`
                                                          : minAge !== undefined
                                                            ? `${minAge}+ ${__("years", "yatra")}`
                                                            : `${__("Under", "yatra")} ${maxAge} ${__("years", "yatra")}`
                                                        : null;
                                                    const categoryName =
                                                      category.label ||
                                                      category.name ||
                                                      `Category ${category.id}`;

                                                    return (
                                                      <button
                                                        key={category.id}
                                                        type="button"
                                                        onClick={() => {
                                                          const newSlots = [
                                                            ...formData.time_slots,
                                                          ];
                                                          if (
                                                            !newSlots[index]
                                                              .traveler_pricing
                                                          ) {
                                                            newSlots[
                                                              index
                                                            ].traveler_pricing =
                                                              [];
                                                          }
                                                          newSlots[
                                                            index
                                                          ].traveler_pricing = [
                                                            ...newSlots[index]
                                                              .traveler_pricing!,
                                                            {
                                                              category_id:
                                                                category.id,
                                                              original_price: 0,
                                                              sale_price:
                                                                undefined,
                                                            },
                                                          ];
                                                          setFormData(
                                                            (prev) => ({
                                                              ...prev,
                                                              time_slots:
                                                                newSlots,
                                                            }),
                                                          );
                                                          // Hide dropdown
                                                          const dropdown =
                                                            document.getElementById(
                                                              `slot-${index}-category-dropdown`,
                                                            );
                                                          if (dropdown)
                                                            dropdown.classList.add(
                                                              "hidden",
                                                            );
                                                        }}
                                                        className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                      >
                                                        <div className="font-medium text-xs text-gray-900 dark:text-white">
                                                          {categoryName}
                                                          {ageRange && (
                                                            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                              ({ageRange})
                                                            </span>
                                                          )}
                                                        </div>
                                                        {category.description && (
                                                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                            {
                                                              category.description
                                                            }
                                                          </div>
                                                        )}
                                                      </button>
                                                    );
                                                  },
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Added Pricing List */}
                                      {slotTravelerPricing.length > 0 && (
                                        <div className="space-y-2">
                                          {slotTravelerPricing.map(
                                            (tp, tpIndex) => {
                                              const category =
                                                activeCategories.find(
                                                  (cat) =>
                                                    cat.id === tp.category_id,
                                                );
                                              if (!category) return null;

                                              const minAge =
                                                category.age_min ??
                                                category.min_age;
                                              const maxAge =
                                                category.age_max ??
                                                category.max_age;
                                              const categoryName =
                                                category.label ||
                                                category.name ||
                                                `Category ${tp.category_id}`;

                                              return (
                                                <div
                                                  key={tp.category_id}
                                                  className="p-3 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                                                >
                                                  <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                                        {categoryName}
                                                        {(minAge !==
                                                          undefined ||
                                                          maxAge !==
                                                            undefined) && (
                                                          <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                            (
                                                            {minAge !==
                                                              undefined &&
                                                            maxAge !== undefined
                                                              ? `${minAge}-${maxAge}`
                                                              : minAge !==
                                                                  undefined
                                                                ? `${minAge}+`
                                                                : `<${maxAge}`}{" "}
                                                            {__(
                                                              "years",
                                                              "yatra",
                                                            )}
                                                            )
                                                          </span>
                                                        )}
                                                      </span>
                                                    </div>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const categoryIdToRemove =
                                                          tp.category_id;
                                                        setFormData((prev) => {
                                                          const newSlots = [
                                                            ...prev.time_slots,
                                                          ];
                                                          if (!newSlots[index]) {
                                                            return prev;
                                                          }
                                                          newSlots[index] = {
                                                            ...newSlots[index],
                                                            traveler_pricing: (
                                                              newSlots[index]
                                                                .traveler_pricing ||
                                                              []
                                                            ).filter(
                                                              (p) =>
                                                                p.category_id !==
                                                                categoryIdToRemove,
                                                            ),
                                                          };
                                                          return {
                                                            ...prev,
                                                            time_slots: newSlots,
                                                          };
                                                        });
                                                      }}
                                                      className="p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    >
                                                      <X className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                        {__("Price", "yatra")}{" "}
                                                        <span className="text-red-500">
                                                          *
                                                        </span>
                                                      </label>
                                                      <Input
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={
                                                          tp.original_price ||
                                                          ""
                                                        }
                                                        onChange={(e) => {
                                                          const newSlots = [
                                                            ...formData.time_slots,
                                                          ];
                                                          if (
                                                            newSlots[index] &&
                                                            newSlots[index]
                                                              .traveler_pricing
                                                          ) {
                                                            newSlots[
                                                              index
                                                            ].traveler_pricing![
                                                              tpIndex
                                                            ].original_price =
                                                              parseFloat(
                                                                e.target.value,
                                                              ) || 0;
                                                            setFormData(
                                                              (prev) => ({
                                                                ...prev,
                                                                time_slots:
                                                                  newSlots,
                                                              }),
                                                            );
                                                          }
                                                        }}
                                                        className="text-xs"
                                                        placeholder="0.00"
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                        {__("Sale", "yatra")}
                                                      </label>
                                                      <Input
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={
                                                          tp.sale_price || ""
                                                        }
                                                        onChange={(e) => {
                                                          const newSlots = [
                                                            ...formData.time_slots,
                                                          ];
                                                          if (
                                                            newSlots[index] &&
                                                            newSlots[index]
                                                              .traveler_pricing
                                                          ) {
                                                            newSlots[
                                                              index
                                                            ].traveler_pricing![
                                                              tpIndex
                                                            ].sale_price =
                                                              parseFloat(
                                                                e.target.value,
                                                              ) || undefined;
                                                            setFormData(
                                                              (prev) => ({
                                                                ...prev,
                                                                time_slots:
                                                                  newSlots,
                                                              }),
                                                            );
                                                          }
                                                        }}
                                                        className="text-xs"
                                                        placeholder="0.00"
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            },
                                          )}
                                        </div>
                                      )}

                                      {slotTravelerPricing.length === 0 && (
                                        <div className="text-center py-3 bg-gray-100 dark:bg-gray-800 rounded border border-dashed border-gray-300 dark:border-gray-600">
                                          <p className="text-xs text-gray-500">
                                            {__(
                                              'Click "Add Pricing" to set prices for traveler categories',
                                              "yatra",
                                            )}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* If no time slots, show default fields as fallback */}
                    {formData.time_slots.length === 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          {__(
                            "Or use default time (applies to all generated dates):",
                            "yatra",
                          )}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {__("Default Start Time", "yatra")}
                            </label>
                            <TimePicker
                              value={formData.departure_time || ""}
                              onChange={(value: string) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  departure_time: value,
                                }))
                              }
                              placeholder="09:00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {__("Default End Time", "yatra")}
                            </label>
                            <TimePicker
                              value={formData.arrival_time || ""}
                              onChange={(value: string) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  arrival_time: value,
                                }))
                              }
                              placeholder="17:00"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Multi-Day Trip: Single Departure Time */}
                {!isSingleDayTrip && formData.trip_id > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__("Departure Time", "yatra")}
                      </label>
                      <TimePicker
                        value={formData.departure_time || ""}
                        onChange={(value: string) =>
                          setFormData((prev) => ({
                            ...prev,
                            departure_time: value,
                          }))
                        }
                        placeholder="08:00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__("Return Time", "yatra")}{" "}
                        <span className="text-gray-400">
                          ({__("on final day", "yatra")})
                        </span>
                      </label>
                      <TimePicker
                        value={formData.arrival_time || ""}
                        onChange={(value: string) =>
                          setFormData((prev) => ({
                            ...prev,
                            arrival_time: value,
                          }))
                        }
                        placeholder="18:00"
                      />
                    </div>
                  </div>
                )}

                {/* No trip selected */}
                {!formData.trip_id && (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {__(
                        "Select a trip above to configure time settings",
                        "yatra",
                      )}
                    </p>
                  </div>
                )}

                {/* Location & Cutoff - always shown when trip selected */}
                {formData.trip_id > 0 && (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                              {__("Starting Point", "yatra")}
                            </h4>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              {__("Where the journey begins", "yatra")}
                            </p>
                          </div>
                          {formData.from_latitude &&
                            formData.from_longitude && (
                              <div
                                className="w-2 h-2 bg-blue-500 rounded-full"
                                title={__("Coordinates set", "yatra")}
                              />
                            )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {__("From location (departure)", "yatra")}
                          </label>
                          <LocationPicker
                            value={{
                              name: formData.from_location || "",
                              latitude: formData.from_latitude || "",
                              longitude: formData.from_longitude || "",
                            }}
                            onChange={(loc) =>
                              setFormData((prev) => ({
                                ...prev,
                                from_location: loc.name,
                                from_latitude: loc.latitude,
                                from_longitude: loc.longitude,
                              }))
                            }
                            label=""
                            placeholder={__(
                              "Search for starting location...",
                              "yatra",
                            )}
                            helpText=""
                            required={false}
                            defaultMapCenter={
                              formData.from_latitude && formData.from_longitude
                                ? [
                                    parseFloat(formData.from_latitude),
                                    parseFloat(formData.from_longitude),
                                  ]
                                : tripForLocations?.starting_latitude &&
                                    tripForLocations?.starting_longitude
                                  ? [
                                      parseFloat(
                                        String(
                                          tripForLocations.starting_latitude,
                                        ),
                                      ),
                                      parseFloat(
                                        String(
                                          tripForLocations.starting_longitude,
                                        ),
                                      ),
                                    ]
                                  : [20, 0]
                            }
                            defaultZoom={
                              formData.from_latitude && formData.from_longitude
                                ? 13
                                : tripForLocations?.starting_latitude &&
                                    tripForLocations?.starting_longitude
                                  ? 13
                                  : 2
                            }
                            mapHeight="300px"
                            showMapButton={false}
                            searchLimit={8}
                            __={__}
                            className=""
                            mapClassName="rounded-lg"
                            showManualCoordinateFields
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {__(
                              "Default: trip starting location. Set per rule to override.",
                              "yatra",
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-green-900 dark:text-green-100">
                              {__("Ending Point", "yatra")}
                            </h4>
                            <p className="text-xs text-green-700 dark:text-green-300">
                              {__("Where the journey concludes", "yatra")}
                            </p>
                          </div>
                          {formData.to_latitude && formData.to_longitude && (
                            <div
                              className="w-2 h-2 bg-green-500 rounded-full"
                              title={__("Coordinates set", "yatra")}
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {__("To location (destination)", "yatra")}
                          </label>
                          <LocationPicker
                            value={{
                              name: formData.to_location || "",
                              latitude: formData.to_latitude || "",
                              longitude: formData.to_longitude || "",
                            }}
                            onChange={(loc) =>
                              setFormData((prev) => ({
                                ...prev,
                                to_location: loc.name,
                                to_latitude: loc.latitude,
                                to_longitude: loc.longitude,
                              }))
                            }
                            label=""
                            placeholder={__(
                              "Search for ending location...",
                              "yatra",
                            )}
                            helpText=""
                            required={false}
                            defaultMapCenter={
                              formData.to_latitude && formData.to_longitude
                                ? [
                                    parseFloat(formData.to_latitude),
                                    parseFloat(formData.to_longitude),
                                  ]
                                : tripForLocations?.ending_latitude &&
                                    tripForLocations?.ending_longitude
                                  ? [
                                      parseFloat(
                                        String(
                                          tripForLocations.ending_latitude,
                                        ),
                                      ),
                                      parseFloat(
                                        String(
                                          tripForLocations.ending_longitude,
                                        ),
                                      ),
                                    ]
                                  : formData.from_latitude &&
                                      formData.from_longitude
                                    ? [
                                        parseFloat(formData.from_latitude),
                                        parseFloat(formData.from_longitude),
                                      ]
                                    : tripForLocations?.starting_latitude &&
                                        tripForLocations?.starting_longitude
                                      ? [
                                          parseFloat(
                                            String(
                                              tripForLocations.starting_latitude,
                                            ),
                                          ),
                                          parseFloat(
                                            String(
                                              tripForLocations.starting_longitude,
                                            ),
                                          ),
                                        ]
                                      : [20, 0]
                            }
                            defaultZoom={
                              formData.to_latitude && formData.to_longitude
                                ? 13
                                : tripForLocations?.ending_latitude &&
                                    tripForLocations?.ending_longitude
                                  ? 13
                                  : formData.from_latitude &&
                                      formData.from_longitude
                                    ? 13
                                    : tripForLocations?.starting_latitude &&
                                        tripForLocations?.starting_longitude
                                      ? 13
                                      : 2
                            }
                            mapHeight="300px"
                            showMapButton={false}
                            searchLimit={8}
                            __={__}
                            className=""
                            mapClassName="rounded-lg"
                            showManualCoordinateFields
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {__(
                              "Default: trip ending location. Set per rule to override.",
                              "yatra",
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {__("Booking Cutoff (hours before)", "yatra")}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.cutoff_hours}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            cutoff_hours: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>{__("Status", "yatra")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as "active" | "inactive",
                    }))
                  }
                >
                  <option value="active">{__("Active", "yatra")}</option>
                  <option value="inactive">{__("Inactive", "yatra")}</option>
                </Select>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {__("Preview", "yatra")}
                </CardTitle>
                <CardDescription>
                  {__("See which dates will be generated", "yatra")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-4"
                  onClick={() => previewMutation.mutate(formData)}
                  disabled={previewMutation.isPending || !formData.trip_id}
                >
                  {previewMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  {__("Generate Preview", "yatra")}
                </Button>

                {previewData && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {__("Total dates:", "yatra")}
                      </span>
                      <Badge variant="success">{previewData.total}</Badge>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {previewData.dates &&
                        Array.isArray(previewData.dates) &&
                        previewData.dates.map((date: any, index: number) => (
                          <div
                            key={index}
                            className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded flex justify-between"
                          >
                            <span>
                              {new Date(date.departure_date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            {date.departure_time && (
                              <span className="text-gray-500">
                                {date.departure_time}
                              </span>
                            )}
                          </div>
                        ))}
                      {previewData.total > 20 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{previewData.total - 20} {__("more dates", "yatra")}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isEditing
                      ? __("Update Rule", "yatra")
                      : __("Create Rule", "yatra")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      navigate({
                        subpage: "trips",
                        tab: "availability",
                        trip_id:
                          formData.trip_id?.toString() || tripIdFromUrl || "",
                      })
                    }
                  >
                    {__("Cancel", "yatra")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Alert>
              <div className="ml-2">
                <h4 className="font-medium">{__("How it works", "yatra")}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {__(
                    "Dates are generated automatically based on your pattern. Manually added specific dates will take priority over generated dates.",
                    "yatra",
                  )}
                </p>
              </div>
            </Alert>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RecurringRuleForm;
