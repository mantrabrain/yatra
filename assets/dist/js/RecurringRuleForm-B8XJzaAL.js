import { j as jsxRuntimeExports, t as useQueryClient, r as reactExports, u as useQuery, v as useMutation, z as ArrowLeft, J as RefreshCw, aw as Plus, ax as X, as as DollarSign, az as AlertCircle, ar as Clock, q as MapPin, aD as CheckCircle2, aQ as Eye, aV as Save } from "./react-vendor-CqkbFEvK.js";
import { u as useToast, _ as __, a as apiClient } from "./index-fqW8jODk.js";
import { C as Card, f as CardHeader, d as CardContent, P as PageHeader, B as Button, g as CardTitle, x as SearchableSelect, I as Input, S as Select, D as DatePicker, e as Badge, h as CardDescription, T as TimePicker, L as LocationPicker, A as Alert, a3 as useNavigate } from "../../admin/dist/js/app.js";
const RecurringRuleFormSkeleton = () => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-96" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded w-40" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 animate-pulse", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded w-44" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: [...Array(7)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"
                },
                i
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 border-t border-gray-200 dark:border-gray-700 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded w-44" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-80 mt-2 animate-pulse" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-full" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 dark:bg-gray-700 rounded w-72" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 border-t border-gray-200 dark:border-gray-700 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 bg-gray-200 dark:bg-gray-700 rounded w-44 mb-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded w-36" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 mt-2 animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 bg-gray-200 dark:bg-gray-700 rounded w-28" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 mx-auto mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mt-2 animate-pulse" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4 animate-pulse" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 animate-pulse", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "h-6 bg-gray-200 dark:bg-gray-700 rounded"
              },
              i
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 animate-pulse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 bg-gray-200 dark:bg-gray-700 rounded" })
        ] })
      ] })
    ] })
  ] });
};
function coordFromApi(v) {
  if (v == null || v === "") return "";
  return String(v);
}
const dayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
];
const weekOptions = [
  { value: "first", label: "First" },
  { value: "second", label: "Second" },
  { value: "third", label: "Third" },
  { value: "fourth", label: "Fourth" },
  { value: "last", label: "Last" }
];
const RecurringRuleForm = () => {
  var _a, _b;
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const ruleId = params.get("id");
  const tripIdFromUrl = params.get("trip_id");
  const isEditing = !!ruleId;
  const [formData, setFormData] = reactExports.useState({
    trip_id: tripIdFromUrl ? parseInt(tripIdFromUrl) : 0,
    name: "",
    rule_type: "weekly",
    days_of_week: [0],
    // Sunday by default
    week_of_month: "first",
    day_of_week: 0,
    interval_days: 7,
    start_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    end_date: "",
    excluded_dates: [],
    months: [],
    // Empty = all months, otherwise specific months (1-12)
    time_slots: [],
    // For single-day trips with multiple slots
    pricing_type: "regular",
    // Will be updated based on trip's pricing type
    original_price: void 0,
    sale_price: void 0,
    traveler_pricing: [],
    // For traveler-based pricing
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
    status: "active"
  });
  const [newExcludedDate, setNewExcludedDate] = reactExports.useState("");
  const [previewData, setPreviewData] = reactExports.useState(null);
  const [showCategorySelector, setShowCategorySelector] = reactExports.useState(false);
  const { data: tripsData } = useQuery({
    queryKey: ["trips", "all"],
    queryFn: async () => {
      const response = await apiClient.get("/trips", {
        params: { per_page: 100, status: "publish" }
      });
      return {
        trips: ((response == null ? void 0 : response.data) || []).map((trip) => {
          const rawPriceTypes = trip.price_types;
          const hasTravelerPricing = Array.isArray(rawPriceTypes) ? rawPriceTypes.length > 0 : false;
          const effectivePricingType = hasTravelerPricing ? "traveler_based" : trip.pricing_type || "regular";
          return {
            id: Number(trip.id) || 0,
            title: trip.title,
            trip_type: trip.trip_type || (trip.duration_days <= 1 ? "single_day" : "multi_day"),
            duration_days: trip.duration_days || 1,
            starting_location: trip.starting_location,
            ending_location: trip.ending_location,
            pricing_type: effectivePricingType
          };
        })
      };
    }
  });
  const { data: travelerCategories = [] } = useQuery({
    queryKey: ["traveler-categories"],
    queryFn: async () => {
      const response = await apiClient.get("/traveler-categories", {
        params: { per_page: 100 }
      });
      return (response == null ? void 0 : response.data) || [];
    }
  });
  const selectedTrip = tripsData == null ? void 0 : tripsData.trips.find((t) => t.id === formData.trip_id);
  const { data: tripForLocations } = useQuery({
    queryKey: ["trip", formData.trip_id, "recurring-rule-locations"],
    queryFn: async () => {
      const response = await apiClient.get(`/trips/${formData.trip_id}`);
      return (response == null ? void 0 : response.data) || response || null;
    },
    enabled: formData.trip_id > 0,
    staleTime: 5 * 60 * 1e3
  });
  const { data: fallbackTripData } = useQuery({
    queryKey: ["trip", formData.trip_id, "recurring-rule-form"],
    queryFn: async () => {
      if (!formData.trip_id || selectedTrip) {
        return null;
      }
      const response = await apiClient.get(`/trips/${formData.trip_id}`);
      return (response == null ? void 0 : response.data) || response || null;
    },
    enabled: !!formData.trip_id && !selectedTrip,
    staleTime: 5 * 60 * 1e3
  });
  const effectiveTrip = selectedTrip || (fallbackTripData ? {
    id: Number(fallbackTripData.id) || formData.trip_id,
    title: fallbackTripData.title
  } : null);
  const tripNameLabel = (effectiveTrip == null ? void 0 : effectiveTrip.title) || __("Unnamed Trip", "yatra");
  let headerDescription = __(
    "Set up automatic availability patterns for your trips",
    "yatra"
  );
  if (effectiveTrip) {
    headerDescription = `${isEditing ? __("Edit", "yatra") : __("Add", "yatra")} ${__("availability rule for", "yatra")} ${tripNameLabel} (Trip ID: ${effectiveTrip.id})`;
  } else if (formData.trip_id) {
    headerDescription = `${isEditing ? __("Edit", "yatra") : __("Add", "yatra")} ${__("availability rule for Trip ID:", "yatra")} ${formData.trip_id}`;
  }
  const isSingleDayTrip = (selectedTrip == null ? void 0 : selectedTrip.trip_type) === "single_day" || ((selectedTrip == null ? void 0 : selectedTrip.duration_days) || 1) <= 1;
  const isTravelerBasedPricing = formData.pricing_type === "traveler_based";
  const { data: existingRule, isLoading: isLoadingRule } = useQuery({
    queryKey: ["recurring-availability", ruleId],
    queryFn: async () => {
      if (!ruleId) return null;
      const response = await apiClient.get(`/recurring-availability/${ruleId}`);
      return (response == null ? void 0 : response.data) || response;
    },
    enabled: !!ruleId
  });
  reactExports.useEffect(() => {
    if (existingRule && tripsData) {
      let daysOfWeek = [0];
      if (existingRule.days_of_week_array && Array.isArray(existingRule.days_of_week_array)) {
        daysOfWeek = existingRule.days_of_week_array;
      } else if (existingRule.days_of_week) {
        if (typeof existingRule.days_of_week === "string") {
          daysOfWeek = existingRule.days_of_week.split(",").map(Number).filter((n) => !isNaN(n));
        } else if (Array.isArray(existingRule.days_of_week)) {
          daysOfWeek = existingRule.days_of_week.map(Number);
        }
      }
      const ruleType = existingRule.rule_type || "weekly";
      const tripRow = tripsData.trips.find((t) => t.id === Number(existingRule.trip_id));
      const effectivePricingType = (tripRow == null ? void 0 : tripRow.pricing_type) || ((tripForLocations == null ? void 0 : tripForLocations.price_types) && Array.isArray(tripForLocations.price_types) && tripForLocations.price_types.length > 0 ? "traveler_based" : tripForLocations == null ? void 0 : tripForLocations.pricing_type) || "regular";
      setFormData({
        trip_id: existingRule.trip_id || 0,
        name: existingRule.name || "",
        rule_type: ruleType,
        days_of_week: daysOfWeek.length > 0 ? daysOfWeek : [0],
        week_of_month: existingRule.week_of_month || "first",
        day_of_week: existingRule.day_of_week ?? 0,
        interval_days: existingRule.interval_days || 7,
        start_date: existingRule.start_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        end_date: existingRule.end_date || "",
        excluded_dates: Array.isArray(existingRule.excluded_dates) ? existingRule.excluded_dates : [],
        months: Array.isArray(existingRule.months) ? existingRule.months : [],
        time_slots: Array.isArray(existingRule.time_slots) ? existingRule.time_slots : [],
        pricing_type: effectivePricingType,
        original_price: existingRule.original_price,
        sale_price: existingRule.sale_price,
        traveler_pricing: Array.isArray(existingRule.traveler_pricing) ? existingRule.traveler_pricing : [],
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
        status: existingRule.status || "active"
      });
    }
  }, [existingRule, tripsData, tripForLocations]);
  reactExports.useEffect(() => {
    if (!isEditing && !existingRule) {
      const inferred = (() => {
        const priceTypes = tripForLocations == null ? void 0 : tripForLocations.price_types;
        const hasTravelerPricing = Array.isArray(priceTypes) && priceTypes.length > 0;
        return hasTravelerPricing ? "traveler_based" : (selectedTrip == null ? void 0 : selectedTrip.pricing_type) || (tripForLocations == null ? void 0 : tripForLocations.pricing_type) || "regular";
      })();
      setFormData((prev) => ({
        ...prev,
        ...selectedTrip || tripForLocations ? {
          pricing_type: inferred
        } : {},
        ...tripForLocations ? {
          from_location: prev.from_location || tripForLocations.starting_location || "",
          to_location: prev.to_location || tripForLocations.ending_location || "",
          from_latitude: prev.from_latitude || coordFromApi(tripForLocations.starting_latitude),
          from_longitude: prev.from_longitude || coordFromApi(tripForLocations.starting_longitude),
          to_latitude: prev.to_latitude || coordFromApi(tripForLocations.ending_latitude),
          to_longitude: prev.to_longitude || coordFromApi(tripForLocations.ending_longitude)
        } : {}
      }));
    }
  }, [isEditing, selectedTrip, tripForLocations, existingRule]);
  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await apiClient.post("/recurring-availability", {
        ...data,
        days_of_week: Array.isArray(data.days_of_week) ? data.days_of_week : [],
        // Normalize month-week selector to backend contract.
        week_of_month: data.rule_type === "monthly" ? (data.week_of_month || "first").toLowerCase() : data.week_of_month,
        // On create, omit empty arrays to keep payload small.
        time_slots: data.time_slots.length > 0 ? data.time_slots : void 0,
        traveler_pricing: data.traveler_pricing && data.traveler_pricing.length > 0 ? data.traveler_pricing : void 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-availability"] });
      showToast(__("Recurring rule created successfully", "yatra"), "success");
      navigate({
        subpage: "trips",
        tab: "availability",
        trip_id: formData.trip_id.toString()
      });
    },
    onError: (error) => {
      showToast(
        (error == null ? void 0 : error.message) || __("Failed to create rule", "yatra"),
        "error"
      );
    }
  });
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return await apiClient.put(`/recurring-availability/${ruleId}`, {
        ...data,
        days_of_week: Array.isArray(data.days_of_week) ? data.days_of_week : [],
        week_of_month: data.rule_type === "monthly" ? (data.week_of_month || "first").toLowerCase() : data.week_of_month,
        // IMPORTANT: on update, send empty arrays explicitly to clear persisted
        // JSON columns; omitting the key leaves the old value in DB.
        time_slots: Array.isArray(data.time_slots) ? data.time_slots : [],
        traveler_pricing: Array.isArray(data.traveler_pricing) ? data.traveler_pricing : []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-availability"] });
      showToast(__("Recurring rule updated successfully", "yatra"), "success");
      navigate({
        subpage: "trips",
        tab: "availability",
        trip_id: formData.trip_id.toString()
      });
    },
    onError: (error) => {
      showToast(
        (error == null ? void 0 : error.message) || __("Failed to update rule", "yatra"),
        "error"
      );
    }
  });
  const previewMutation = useMutation({
    mutationFn: async (data) => {
      return await apiClient.post("/recurring-availability/preview", {
        ...data,
        days_of_week: Array.isArray(data.days_of_week) ? data.days_of_week : [],
        week_of_month: data.rule_type === "monthly" ? (data.week_of_month || "first").toLowerCase() : data.week_of_month,
        time_slots: data.time_slots.length > 0 ? data.time_slots : void 0,
        traveler_pricing: data.traveler_pricing && data.traveler_pricing.length > 0 ? data.traveler_pricing : void 0,
        preview_limit: 20
      });
    },
    onSuccess: (response) => {
      const previewResult = (response == null ? void 0 : response.data) || response;
      setPreviewData(previewResult);
    },
    onError: (error) => {
      showToast(
        (error == null ? void 0 : error.message) || __("Failed to generate preview", "yatra"),
        "error"
      );
    }
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.trip_id) {
      showToast(__("Please select a trip", "yatra"), "error");
      return;
    }
    if (formData.rule_type === "weekly" && formData.days_of_week.length === 0) {
      showToast(
        __("Please select at least one day of the week", "yatra"),
        "error"
      );
      return;
    }
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };
  const toggleDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day) ? prev.days_of_week.filter((d) => d !== day) : [...prev.days_of_week, day].sort((a, b) => a - b)
    }));
  };
  const addExcludedDate = () => {
    if (newExcludedDate && !formData.excluded_dates.includes(newExcludedDate)) {
      setFormData((prev) => ({
        ...prev,
        excluded_dates: [...prev.excluded_dates, newExcludedDate].sort()
      }));
      setNewExcludedDate("");
    }
  };
  const removeExcludedDate = (date) => {
    setFormData((prev) => ({
      ...prev,
      excluded_dates: prev.excluded_dates.filter((d) => d !== date)
    }));
  };
  const isLoading = createMutation.isPending || updateMutation.isPending;
  if (isEditing && isLoadingRule) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(RecurringRuleFormSkeleton, {});
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: isEditing ? __("Edit Recurring Rule", "yatra") : __("Create Recurring Rule", "yatra"),
        description: headerDescription,
        actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => {
              var _a2;
              return navigate({
                subpage: "trips",
                tab: "availability",
                trip_id: ((_a2 = formData.trip_id) == null ? void 0 : _a2.toString()) || tripIdFromUrl || ""
              });
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
              __("Back to Availability", "yatra")
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("form", { onSubmit: handleSubmit, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Basic Information", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
                  __("Trip", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  SearchableSelect,
                  {
                    value: ((_a = formData.trip_id) == null ? void 0 : _a.toString()) || "",
                    onChange: (value) => setFormData((prev) => {
                      var _a2;
                      return {
                        ...prev,
                        trip_id: parseInt(value) || 0,
                        // Reset pricing when trip changes and set pricing_type based on new trip
                        pricing_type: ((_a2 = tripsData == null ? void 0 : tripsData.trips.find(
                          (t) => t.id === parseInt(value)
                        )) == null ? void 0 : _a2.pricing_type) || "regular",
                        traveler_pricing: [],
                        original_price: void 0,
                        sale_price: void 0
                      };
                    }),
                    options: [
                      { value: "", label: __("-- Select Trip --", "yatra") },
                      ...(tripsData == null ? void 0 : tripsData.trips.map((trip) => ({
                        value: trip.id.toString(),
                        label: `${trip.title} (${trip.pricing_type === "traveler_based" ? "Traveler-Based" : "Regular"})`
                      }))) || []
                    ],
                    placeholder: __("Select a trip", "yatra"),
                    disabled: isEditing
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Rule Name", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "text",
                    value: formData.name,
                    onChange: (e) => setFormData((prev) => ({
                      ...prev,
                      name: e.target.value
                    })),
                    placeholder: __("e.g., Weekend Departures", "yatra")
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
                __("Rule Type", "yatra"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: formData.rule_type,
                  onChange: (e) => setFormData((prev) => ({
                    ...prev,
                    rule_type: e.target.value
                  })),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "weekly", children: __("Weekly (specific days)", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "monthly", children: __("Monthly (e.g., first Sunday)", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "interval", children: __("Interval (every X days)", "yatra") })
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-5 h-5" }),
            __("Recurrence Pattern", "yatra")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            formData.rule_type === "weekly" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3", children: [
                __("Days of Week", "yatra"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: dayOptions.map((day) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => toggleDay(day.value),
                  className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.days_of_week.includes(day.value) ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`,
                  children: day.label
                },
                day.value
              )) })
            ] }),
            formData.rule_type === "monthly" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Week of Month", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Select,
                  {
                    value: formData.week_of_month || "first",
                    onChange: (e) => setFormData((prev) => ({
                      ...prev,
                      week_of_month: e.target.value
                    })),
                    children: weekOptions.map((week) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: week.value, children: week.label }, week.value))
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Day of Week", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Select,
                  {
                    value: ((_b = formData.day_of_week) == null ? void 0 : _b.toString()) || "0",
                    onChange: (e) => setFormData((prev) => ({
                      ...prev,
                      day_of_week: parseInt(e.target.value)
                    })),
                    children: dayOptions.map((day) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: day.value, children: day.label }, day.value))
                  }
                )
              ] })
            ] }),
            formData.rule_type === "interval" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Every X Days", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  min: 1,
                  max: 365,
                  value: formData.interval_days || 7,
                  onChange: (e) => setFormData((prev) => ({
                    ...prev,
                    interval_days: parseInt(e.target.value) || 7
                  }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
                  __("Start Date", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DatePicker,
                  {
                    value: formData.start_date,
                    onChange: (value) => setFormData((prev) => ({ ...prev, start_date: value })),
                    placeholder: __("Select start date", "yatra")
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
                  __("End Date", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-400", children: [
                    "(",
                    __("optional", "yatra"),
                    ")"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DatePicker,
                  {
                    value: formData.end_date || "",
                    onChange: (value) => setFormData((prev) => ({ ...prev, end_date: value })),
                    minDate: formData.start_date ? new Date(formData.start_date) : void 0,
                    placeholder: __("Select end date (optional)", "yatra")
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 border-t border-gray-200 dark:border-gray-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
                __("Specific Months", "yatra"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-400", children: [
                  "(",
                  __("optional - leave empty for all months", "yatra"),
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2", children: [
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
                { value: 12, label: __("December", "yatra") }
              ].map((month) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  className: `flex items-center justify-center px-3 py-2 rounded-md border cursor-pointer transition-colors ${formData.months.includes(month.value) ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: formData.months.includes(month.value),
                        onChange: (e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => ({
                            ...prev,
                            months: checked ? [...prev.months, month.value].sort(
                              (a, b) => a - b
                            ) : prev.months.filter((m) => m !== month.value)
                          }));
                        },
                        className: "sr-only"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: month.label.slice(0, 3) })
                  ]
                },
                month.value
              )) }),
              formData.months.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-2", children: [
                __("Selected:", "yatra"),
                " ",
                formData.months.length,
                " ",
                formData.months.length === 1 ? __("month", "yatra") : __("months", "yatra")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 border-t border-gray-200 dark:border-gray-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
                __("Excluded Dates", "yatra"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-400", children: [
                  "(",
                  __("holidays, etc.", "yatra"),
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DatePicker,
                  {
                    value: newExcludedDate,
                    onChange: (value) => setNewExcludedDate(value),
                    placeholder: __("Select date to exclude", "yatra")
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: addExcludedDate,
                    disabled: !newExcludedDate,
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" })
                  }
                )
              ] }),
              formData.excluded_dates.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: formData.excluded_dates.map((date) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Badge,
                {
                  variant: "outline",
                  className: "flex items-center gap-1",
                  children: [
                    (/* @__PURE__ */ new Date(date + "T00:00:00")).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => removeExcludedDate(date),
                        className: "ml-1 hover:text-red-500",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" })
                      }
                    )
                  ]
                },
                date
              )) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-5 h-5" }),
              __("Pricing & Availability", "yatra")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
              "Set pricing for traveler categories and seat availability for this rule",
              "yatra"
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-full bg-amber-100 dark:bg-amber-900/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "svg",
                {
                  className: "w-5 h-5 text-amber-600 dark:text-amber-400",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "path",
                    {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: 2,
                      d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    }
                  )
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white mb-1", children: __("Pricing Override (Optional)", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: __(
                  "Leave pricing fields empty to use the trip's default pricing. Fill them in only if you want to override the default pricing for dates generated by this rule.",
                  "yatra"
                ) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `p-2 rounded-full ${isTravelerBasedPricing ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`,
                  children: isTravelerBasedPricing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "svg",
                    {
                      className: "w-5 h-5 text-green-600 dark:text-green-400",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: 2,
                          d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        }
                      )
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "svg",
                    {
                      className: "w-5 h-5 text-blue-600 dark:text-blue-400",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: 2,
                          d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        }
                      )
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: isTravelerBasedPricing ? __("Traveler-Based Pricing", "yatra") : __("Regular Pricing", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: isTravelerBasedPricing ? __(
                  "This trip uses traveler category pricing. Set prices for each category below.",
                  "yatra"
                ) : __(
                  "This trip uses regular pricing. Set a single price for all travelers below.",
                  "yatra"
                ) })
              ] })
            ] }) }),
            !isTravelerBasedPricing && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
                  __("Original Price", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-400 text-xs", children: [
                    "(",
                    __("Optional", "yatra"),
                    ")"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    min: 0,
                    step: "0.01",
                    value: formData.original_price || "",
                    onChange: (e) => setFormData((prev) => ({
                      ...prev,
                      original_price: parseFloat(e.target.value) || void 0
                    })),
                    placeholder: "0.00"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Sale Price", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    min: 0,
                    step: "0.01",
                    value: formData.sale_price || "",
                    onChange: (e) => setFormData((prev) => ({
                      ...prev,
                      sale_price: parseFloat(e.target.value) || void 0
                    })),
                    placeholder: "0.00"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-gray-500", children: __("Leave empty if no discount", "yatra") })
              ] })
            ] }) }),
            isTravelerBasedPricing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
                  __("Traveler Category Pricing", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4", children: __(
                  "Add pricing for traveler categories. Categories are managed in Traveler Categories page.",
                  "yatra"
                ) })
              ] }),
              (() => {
                const activeCategories = travelerCategories.filter(
                  (cat) => cat.status === "active" || cat.status === "publish"
                );
                if (activeCategories.length === 0) {
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border border-gray-200 dark:border-gray-700 rounded-lg text-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: __(
                      "No active traveler categories found.",
                      "yatra"
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        onClick: () => window.location.href = "?page=yatra&subpage=traveler-categories&action=create",
                        className: "flex items-center gap-2 mx-auto",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                          __("Create Category", "yatra")
                        ]
                      }
                    )
                  ] });
                }
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        onClick: () => setShowCategorySelector(!showCategorySelector),
                        className: "flex items-center gap-2",
                        disabled: activeCategories.filter(
                          (cat) => {
                            var _a2;
                            return !((_a2 = formData.traveler_pricing) == null ? void 0 : _a2.some(
                              (tp) => tp.category_id === cat.id
                            ));
                          }
                        ).length === 0,
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                          __("Add Pricing", "yatra")
                        ]
                      }
                    ),
                    showCategorySelector && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: "fixed inset-0 z-10",
                          onClick: () => setShowCategorySelector(false)
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-full left-0 mt-2 w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-gray-700 dark:text-gray-300 px-3 py-2 mb-1", children: __(
                          "Select a category to add pricing",
                          "yatra"
                        ) }),
                        activeCategories.filter(
                          (cat) => {
                            var _a2;
                            return !((_a2 = formData.traveler_pricing) == null ? void 0 : _a2.some(
                              (tp) => tp.category_id === cat.id
                            ));
                          }
                        ).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center", children: __(
                          "All categories have pricing added",
                          "yatra"
                        ) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: activeCategories.filter(
                          (cat) => {
                            var _a2;
                            return !((_a2 = formData.traveler_pricing) == null ? void 0 : _a2.some(
                              (tp) => tp.category_id === cat.id
                            ));
                          }
                        ).map((category) => {
                          const minAge = category.age_min ?? category.min_age;
                          const maxAge = category.age_max ?? category.max_age;
                          const ageRange = minAge !== void 0 || maxAge !== void 0 ? minAge !== void 0 && maxAge !== void 0 ? `${minAge}-${maxAge} ${__("years", "yatra")}` : minAge !== void 0 ? `${minAge}+ ${__("years", "yatra")}` : maxAge !== void 0 ? `${__("Under", "yatra")} ${maxAge} ${__("years", "yatra")}` : "" : null;
                          const categoryName = category.label || category.name || `Category ${category.id}`;
                          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => {
                                setFormData((prev) => ({
                                  ...prev,
                                  traveler_pricing: [
                                    ...prev.traveler_pricing || [],
                                    {
                                      category_id: category.id,
                                      original_price: 0,
                                      sale_price: void 0
                                    }
                                  ]
                                }));
                                setShowCategorySelector(
                                  false
                                );
                              },
                              className: "w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium text-sm text-gray-900 dark:text-white", children: [
                                  categoryName,
                                  ageRange && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-xs font-normal text-gray-500 dark:text-gray-400", children: [
                                    "(",
                                    ageRange,
                                    ")"
                                  ] })
                                ] }),
                                category.description && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: category.description })
                              ]
                            },
                            category.id
                          );
                        }) })
                      ] }) })
                    ] })
                  ] }),
                  formData.traveler_pricing && formData.traveler_pricing.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: formData.traveler_pricing.map(
                    (pricing, index) => {
                      const category = activeCategories.find(
                        (cat) => cat.id === pricing.category_id
                      );
                      if (!category) return null;
                      const minAge = category.age_min ?? category.min_age;
                      const maxAge = category.age_max ?? category.max_age;
                      const categoryName = category.label || category.name || `Category ${pricing.category_id}`;
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: "p-4 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-3", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 mb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: [
                                  categoryName,
                                  (minAge !== void 0 || maxAge !== void 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-xs font-normal text-gray-500 dark:text-gray-400", children: [
                                    "(",
                                    minAge !== void 0 && maxAge !== void 0 ? `${minAge}-${maxAge} ${__("years", "yatra")}` : minAge !== void 0 ? `${minAge}+ ${__("years", "yatra")}` : maxAge !== void 0 ? `${__("Under", "yatra")} ${maxAge} ${__("years", "yatra")}` : "",
                                    ")"
                                  ] })
                                ] }) }),
                                category.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: category.description })
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "button",
                                {
                                  type: "button",
                                  onClick: () => {
                                    const categoryIdToRemove = pricing.category_id;
                                    setFormData((prev) => ({
                                      ...prev,
                                      traveler_pricing: (prev.traveler_pricing || []).filter(
                                        (tp) => tp.category_id !== categoryIdToRemove
                                      )
                                    }));
                                  },
                                  className: "p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors",
                                  title: __(
                                    "Remove Pricing",
                                    "yatra"
                                  ),
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                                }
                              )
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                                  __("Original Price", "yatra"),
                                  " ",
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                                ] }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Input,
                                  {
                                    type: "number",
                                    min: 0,
                                    step: "0.01",
                                    value: pricing.original_price || "",
                                    onChange: (e) => {
                                      const newPricing = [
                                        ...formData.traveler_pricing || []
                                      ];
                                      newPricing[index].original_price = parseFloat(e.target.value) || 0;
                                      setFormData((prev) => ({
                                        ...prev,
                                        traveler_pricing: newPricing
                                      }));
                                    },
                                    placeholder: "0.00"
                                  }
                                )
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                                  __("Sale Price", "yatra"),
                                  " (",
                                  __("Optional", "Optional"),
                                  ")"
                                ] }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Input,
                                  {
                                    type: "number",
                                    min: 0,
                                    step: "0.01",
                                    value: pricing.sale_price || "",
                                    onChange: (e) => {
                                      const newPricing = [
                                        ...formData.traveler_pricing || []
                                      ];
                                      newPricing[index].sale_price = parseFloat(e.target.value) || void 0;
                                      setFormData((prev) => ({
                                        ...prev,
                                        traveler_pricing: newPricing
                                      }));
                                    },
                                    className: "text-sm",
                                    placeholder: "0.00"
                                  }
                                )
                              ] })
                            ] })
                          ]
                        },
                        pricing.category_id
                      );
                    }
                  ) })
                ] });
              })()
            ] }),
            selectedTrip && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 border-t border-gray-200 dark:border-gray-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4", children: __("Inventory Management", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
                    __("Total Capacity", "yatra"),
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "number",
                      min: 1,
                      value: formData.seats_total,
                      onChange: (e) => setFormData((prev) => ({
                        ...prev,
                        seats_total: parseInt(e.target.value) || 1
                      }))
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-gray-500", children: __(
                    "Maximum number of seats available for this rule",
                    "yatra"
                  ) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Alert Threshold", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "number",
                      min: 0,
                      value: formData.alert_threshold,
                      onChange: (e) => setFormData((prev) => ({
                        ...prev,
                        alert_threshold: parseInt(e.target.value) || 0
                      }))
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-gray-500", children: __(
                    "Alert when available seats drop below this number",
                    "yatra"
                  ) })
                ] })
              ] })
            ] }),
            !selectedTrip && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-8 h-8 text-gray-400 mx-auto mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Select a trip above to configure pricing", "yatra") })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5" }),
              __("Time & Location", "yatra")
            ] }),
            selectedTrip && /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  variant: isSingleDayTrip ? "default" : "outline",
                  className: "mr-2",
                  children: isSingleDayTrip ? __("Single-Day Trip", "yatra") : __("Multi-Day Trip", "yatra")
                }
              ),
              !isSingleDayTrip && selectedTrip.duration_days && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-500", children: [
                "(",
                selectedTrip.duration_days,
                " ",
                __("days", "yatra"),
                ")"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            isSingleDayTrip && formData.trip_id > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: [
                  __("Time Slots", "yatra"),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-400 ml-1", children: [
                    "(",
                    __("for each recurring day", "yatra"),
                    ")"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: () => setFormData((prev) => ({
                      ...prev,
                      time_slots: [
                        ...prev.time_slots,
                        {
                          departure_time: "09:00",
                          arrival_time: "17:00",
                          seats: 20,
                          price: 0,
                          traveler_pricing: isTravelerBasedPricing ? [] : void 0
                        }
                      ]
                    })),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-1" }),
                      __("Add Slot", "yatra")
                    ]
                  }
                )
              ] }),
              formData.time_slots.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-8 h-8 text-gray-400 mx-auto mb-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-2", children: __("No time slots added yet", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: __(
                  "Add multiple time slots for tours throughout the day (e.g., morning, afternoon, evening)",
                  "yatra"
                ) })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: formData.time_slots.map((slot, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: [
                        __("Slot", "yatra"),
                        " ",
                        index + 1
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          size: "sm",
                          onClick: () => setFormData((prev) => ({
                            ...prev,
                            time_slots: prev.time_slots.filter(
                              (_, i) => i !== index
                            )
                          })),
                          className: "text-red-500 hover:text-red-600 h-8 w-8 p-0",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Departure Time", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            TimePicker,
                            {
                              value: slot.departure_time || "",
                              onChange: (value) => {
                                const newSlots = [...formData.time_slots];
                                newSlots[index].departure_time = value;
                                setFormData((prev) => ({
                                  ...prev,
                                  time_slots: newSlots
                                }));
                              },
                              placeholder: "09:00"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Arrival Time", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            TimePicker,
                            {
                              value: slot.arrival_time || "",
                              onChange: (value) => {
                                const newSlots = [...formData.time_slots];
                                newSlots[index].arrival_time = value;
                                setFormData((prev) => ({
                                  ...prev,
                                  time_slots: newSlots
                                }));
                              },
                              placeholder: "17:00"
                            }
                          )
                        ] })
                      ] }),
                      !isTravelerBasedPricing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Seats", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              type: "number",
                              min: 1,
                              value: slot.seats,
                              onChange: (e) => {
                                const newSlots = [
                                  ...formData.time_slots
                                ];
                                newSlots[index].seats = parseInt(e.target.value) || 1;
                                setFormData((prev) => ({
                                  ...prev,
                                  time_slots: newSlots
                                }));
                              },
                              className: "text-sm"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Price", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              type: "number",
                              min: 0,
                              step: "0.01",
                              value: slot.price || "",
                              onChange: (e) => {
                                const newSlots = [
                                  ...formData.time_slots
                                ];
                                newSlots[index].price = parseFloat(e.target.value) || 0;
                                setFormData((prev) => ({
                                  ...prev,
                                  time_slots: newSlots
                                }));
                              },
                              className: "text-sm",
                              placeholder: "0.00"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Sale Price", "yatra") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input,
                            {
                              type: "number",
                              min: 0,
                              step: "0.01",
                              value: slot.sale_price || "",
                              onChange: (e) => {
                                const newSlots = [
                                  ...formData.time_slots
                                ];
                                newSlots[index].sale_price = parseFloat(e.target.value) || void 0;
                                setFormData((prev) => ({
                                  ...prev,
                                  time_slots: newSlots
                                }));
                              },
                              className: "text-sm",
                              placeholder: "0.00"
                            }
                          )
                        ] })
                      ] }),
                      isTravelerBasedPricing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs text-gray-500 dark:text-gray-400 mb-1", children: __("Seats", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            type: "number",
                            min: 1,
                            value: slot.seats,
                            onChange: (e) => {
                              const newSlots = [...formData.time_slots];
                              newSlots[index].seats = parseInt(e.target.value) || 1;
                              setFormData((prev) => ({
                                ...prev,
                                time_slots: newSlots
                              }));
                            },
                            className: "text-sm"
                          }
                        )
                      ] })
                    ] }),
                    isTravelerBasedPricing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 pt-3 border-t border-gray-200 dark:border-gray-700", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-gray-700 dark:text-gray-300", children: __("Traveler Category Pricing", "yatra") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: __(
                          "Set pricing for each traveler category for this time slot",
                          "yatra"
                        ) })
                      ] }) }),
                      (() => {
                        const activeCategories = travelerCategories.filter(
                          (cat) => cat.status === "active" || cat.status === "publish"
                        );
                        const slotTravelerPricing = slot.traveler_pricing || [];
                        const availableCategories = activeCategories.filter(
                          (cat) => !slotTravelerPricing.some(
                            (tp) => tp.category_id === cat.id
                          )
                        );
                        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Button,
                              {
                                type: "button",
                                variant: "outline",
                                size: "sm",
                                onClick: () => {
                                  const dropdownId = `slot-${index}-category-dropdown`;
                                  const dropdown = document.getElementById(
                                    dropdownId
                                  );
                                  if (dropdown) {
                                    dropdown.classList.toggle(
                                      "hidden"
                                    );
                                  }
                                },
                                disabled: availableCategories.length === 0,
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                                  __("Add Pricing", "yatra")
                                ]
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "div",
                              {
                                id: `slot-${index}-category-dropdown`,
                                className: "hidden absolute top-full left-0 mt-2 w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto",
                                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-gray-700 dark:text-gray-300 px-3 py-2 mb-1", children: __(
                                    "Select a category to add pricing",
                                    "yatra"
                                  ) }),
                                  availableCategories.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-3 text-xs text-gray-500 dark:text-gray-400 text-center", children: __(
                                    "All categories have pricing added",
                                    "yatra"
                                  ) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: availableCategories.map(
                                    (category) => {
                                      const minAge = category.age_min ?? category.min_age;
                                      const maxAge = category.age_max ?? category.max_age;
                                      const ageRange = minAge !== void 0 || maxAge !== void 0 ? minAge !== void 0 && maxAge !== void 0 ? `${minAge}-${maxAge} ${__("years", "yatra")}` : minAge !== void 0 ? `${minAge}+ ${__("years", "yatra")}` : `${__("Under", "yatra")} ${maxAge} ${__("years", "yatra")}` : null;
                                      const categoryName = category.label || category.name || `Category ${category.id}`;
                                      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                        "button",
                                        {
                                          type: "button",
                                          onClick: () => {
                                            const newSlots = [
                                              ...formData.time_slots
                                            ];
                                            if (!newSlots[index].traveler_pricing) {
                                              newSlots[index].traveler_pricing = [];
                                            }
                                            newSlots[index].traveler_pricing = [
                                              ...newSlots[index].traveler_pricing,
                                              {
                                                category_id: category.id,
                                                original_price: 0,
                                                sale_price: void 0
                                              }
                                            ];
                                            setFormData(
                                              (prev) => ({
                                                ...prev,
                                                time_slots: newSlots
                                              })
                                            );
                                            const dropdown = document.getElementById(
                                              `slot-${index}-category-dropdown`
                                            );
                                            if (dropdown)
                                              dropdown.classList.add(
                                                "hidden"
                                              );
                                          },
                                          className: "w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                          children: [
                                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium text-xs text-gray-900 dark:text-white", children: [
                                              categoryName,
                                              ageRange && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-xs font-normal text-gray-500 dark:text-gray-400", children: [
                                                "(",
                                                ageRange,
                                                ")"
                                              ] })
                                            ] }),
                                            category.description && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate", children: category.description })
                                          ]
                                        },
                                        category.id
                                      );
                                    }
                                  ) })
                                ] })
                              }
                            )
                          ] }),
                          slotTravelerPricing.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: slotTravelerPricing.map(
                            (tp, tpIndex) => {
                              const category = activeCategories.find(
                                (cat) => cat.id === tp.category_id
                              );
                              if (!category) return null;
                              const minAge = category.age_min ?? category.min_age;
                              const maxAge = category.age_max ?? category.max_age;
                              const categoryName = category.label || category.name || `Category ${tp.category_id}`;
                              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                "div",
                                {
                                  className: "p-3 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg",
                                  children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-2", children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-semibold text-gray-900 dark:text-white", children: [
                                        categoryName,
                                        (minAge !== void 0 || maxAge !== void 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-1 text-xs font-normal text-gray-500 dark:text-gray-400", children: [
                                          "(",
                                          minAge !== void 0 && maxAge !== void 0 ? `${minAge}-${maxAge}` : minAge !== void 0 ? `${minAge}+` : `<${maxAge}`,
                                          " ",
                                          __(
                                            "years",
                                            "yatra"
                                          ),
                                          ")"
                                        ] })
                                      ] }) }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                                        "button",
                                        {
                                          type: "button",
                                          onClick: () => {
                                            const categoryIdToRemove = tp.category_id;
                                            setFormData((prev) => {
                                              const newSlots = [
                                                ...prev.time_slots
                                              ];
                                              if (!newSlots[index]) {
                                                return prev;
                                              }
                                              newSlots[index] = {
                                                ...newSlots[index],
                                                traveler_pricing: (newSlots[index].traveler_pricing || []).filter(
                                                  (p) => p.category_id !== categoryIdToRemove
                                                )
                                              };
                                              return {
                                                ...prev,
                                                time_slots: newSlots
                                              };
                                            });
                                          },
                                          className: "p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors",
                                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" })
                                        }
                                      )
                                    ] }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs text-gray-600 dark:text-gray-400 mb-1", children: [
                                          __("Price", "yatra"),
                                          " ",
                                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                                        ] }),
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                                          Input,
                                          {
                                            type: "number",
                                            min: 0,
                                            step: "0.01",
                                            value: tp.original_price || "",
                                            onChange: (e) => {
                                              const newSlots = [
                                                ...formData.time_slots
                                              ];
                                              if (newSlots[index] && newSlots[index].traveler_pricing) {
                                                newSlots[index].traveler_pricing[tpIndex].original_price = parseFloat(
                                                  e.target.value
                                                ) || 0;
                                                setFormData(
                                                  (prev) => ({
                                                    ...prev,
                                                    time_slots: newSlots
                                                  })
                                                );
                                              }
                                            },
                                            className: "text-xs",
                                            placeholder: "0.00"
                                          }
                                        )
                                      ] }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs text-gray-600 dark:text-gray-400 mb-1", children: __("Sale", "yatra") }),
                                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                                          Input,
                                          {
                                            type: "number",
                                            min: 0,
                                            step: "0.01",
                                            value: tp.sale_price || "",
                                            onChange: (e) => {
                                              const newSlots = [
                                                ...formData.time_slots
                                              ];
                                              if (newSlots[index] && newSlots[index].traveler_pricing) {
                                                newSlots[index].traveler_pricing[tpIndex].sale_price = parseFloat(
                                                  e.target.value
                                                ) || void 0;
                                                setFormData(
                                                  (prev) => ({
                                                    ...prev,
                                                    time_slots: newSlots
                                                  })
                                                );
                                              }
                                            },
                                            className: "text-xs",
                                            placeholder: "0.00"
                                          }
                                        )
                                      ] })
                                    ] })
                                  ]
                                },
                                tp.category_id
                              );
                            }
                          ) }),
                          slotTravelerPricing.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-3 bg-gray-100 dark:bg-gray-800 rounded border border-dashed border-gray-300 dark:border-gray-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500", children: __(
                            'Click "Add Pricing" to set prices for traveler categories',
                            "yatra"
                          ) }) })
                        ] });
                      })()
                    ] })
                  ]
                },
                index
              )) }),
              formData.time_slots.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 border-t border-gray-200 dark:border-gray-700", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-3", children: __(
                  "Or use default time (applies to all generated dates):",
                  "yatra"
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Default Start Time", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TimePicker,
                      {
                        value: formData.departure_time || "",
                        onChange: (value) => setFormData((prev) => ({
                          ...prev,
                          departure_time: value
                        })),
                        placeholder: "09:00"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Default End Time", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TimePicker,
                      {
                        value: formData.arrival_time || "",
                        onChange: (value) => setFormData((prev) => ({
                          ...prev,
                          arrival_time: value
                        })),
                        placeholder: "17:00"
                      }
                    )
                  ] })
                ] })
              ] })
            ] }),
            !isSingleDayTrip && formData.trip_id > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Departure Time", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TimePicker,
                  {
                    value: formData.departure_time || "",
                    onChange: (value) => setFormData((prev) => ({
                      ...prev,
                      departure_time: value
                    })),
                    placeholder: "08:00"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
                  __("Return Time", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-400", children: [
                    "(",
                    __("on final day", "yatra"),
                    ")"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TimePicker,
                  {
                    value: formData.arrival_time || "",
                    onChange: (value) => setFormData((prev) => ({
                      ...prev,
                      arrival_time: value
                    })),
                    placeholder: "18:00"
                  }
                )
              ] })
            ] }),
            !formData.trip_id && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-8 h-8 text-gray-400 mx-auto mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __(
                "Select a trip above to configure time settings",
                "yatra"
              ) })
            ] }),
            formData.trip_id > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-gray-200 dark:border-gray-700", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-5 h-5 text-white" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-base font-semibold text-blue-900 dark:text-blue-100", children: __("Starting Point", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-700 dark:text-blue-300", children: __("Where the journey begins", "yatra") })
                    ] }),
                    formData.from_latitude && formData.from_longitude && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "w-2 h-2 bg-blue-500 rounded-full",
                        title: __("Coordinates set", "yatra")
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: __("From location (departure)", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      LocationPicker,
                      {
                        value: {
                          name: formData.from_location || "",
                          latitude: formData.from_latitude || "",
                          longitude: formData.from_longitude || ""
                        },
                        onChange: (loc) => setFormData((prev) => ({
                          ...prev,
                          from_location: loc.name,
                          from_latitude: loc.latitude,
                          from_longitude: loc.longitude
                        })),
                        label: "",
                        placeholder: __(
                          "Search for starting location...",
                          "yatra"
                        ),
                        helpText: "",
                        required: false,
                        defaultMapCenter: formData.from_latitude && formData.from_longitude ? [
                          parseFloat(formData.from_latitude),
                          parseFloat(formData.from_longitude)
                        ] : (tripForLocations == null ? void 0 : tripForLocations.starting_latitude) && (tripForLocations == null ? void 0 : tripForLocations.starting_longitude) ? [
                          parseFloat(
                            String(
                              tripForLocations.starting_latitude
                            )
                          ),
                          parseFloat(
                            String(
                              tripForLocations.starting_longitude
                            )
                          )
                        ] : [20, 0],
                        defaultZoom: formData.from_latitude && formData.from_longitude ? 13 : (tripForLocations == null ? void 0 : tripForLocations.starting_latitude) && (tripForLocations == null ? void 0 : tripForLocations.starting_longitude) ? 13 : 2,
                        mapHeight: "300px",
                        showMapButton: false,
                        searchLimit: 8,
                        __,
                        className: "",
                        mapClassName: "rounded-lg",
                        showManualCoordinateFields: true
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
                      "Default: trip starting location. Set per rule to override.",
                      "yatra"
                    ) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "w-5 h-5 text-white" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-base font-semibold text-green-900 dark:text-green-100", children: __("Ending Point", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-green-700 dark:text-green-300", children: __("Where the journey concludes", "yatra") })
                    ] }),
                    formData.to_latitude && formData.to_longitude && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "w-2 h-2 bg-green-500 rounded-full",
                        title: __("Coordinates set", "yatra")
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: __("To location (destination)", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      LocationPicker,
                      {
                        value: {
                          name: formData.to_location || "",
                          latitude: formData.to_latitude || "",
                          longitude: formData.to_longitude || ""
                        },
                        onChange: (loc) => setFormData((prev) => ({
                          ...prev,
                          to_location: loc.name,
                          to_latitude: loc.latitude,
                          to_longitude: loc.longitude
                        })),
                        label: "",
                        placeholder: __(
                          "Search for ending location...",
                          "yatra"
                        ),
                        helpText: "",
                        required: false,
                        defaultMapCenter: formData.to_latitude && formData.to_longitude ? [
                          parseFloat(formData.to_latitude),
                          parseFloat(formData.to_longitude)
                        ] : (tripForLocations == null ? void 0 : tripForLocations.ending_latitude) && (tripForLocations == null ? void 0 : tripForLocations.ending_longitude) ? [
                          parseFloat(
                            String(
                              tripForLocations.ending_latitude
                            )
                          ),
                          parseFloat(
                            String(
                              tripForLocations.ending_longitude
                            )
                          )
                        ] : formData.from_latitude && formData.from_longitude ? [
                          parseFloat(formData.from_latitude),
                          parseFloat(formData.from_longitude)
                        ] : (tripForLocations == null ? void 0 : tripForLocations.starting_latitude) && (tripForLocations == null ? void 0 : tripForLocations.starting_longitude) ? [
                          parseFloat(
                            String(
                              tripForLocations.starting_latitude
                            )
                          ),
                          parseFloat(
                            String(
                              tripForLocations.starting_longitude
                            )
                          )
                        ] : [20, 0],
                        defaultZoom: formData.to_latitude && formData.to_longitude ? 13 : (tripForLocations == null ? void 0 : tripForLocations.ending_latitude) && (tripForLocations == null ? void 0 : tripForLocations.ending_longitude) ? 13 : formData.from_latitude && formData.from_longitude ? 13 : (tripForLocations == null ? void 0 : tripForLocations.starting_latitude) && (tripForLocations == null ? void 0 : tripForLocations.starting_longitude) ? 13 : 2,
                        mapHeight: "300px",
                        showMapButton: false,
                        searchLimit: 8,
                        __,
                        className: "",
                        mapClassName: "rounded-lg",
                        showManualCoordinateFields: true
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __(
                      "Default: trip ending location. Set per rule to override.",
                      "yatra"
                    ) })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Booking Cutoff (hours before)", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    min: 0,
                    value: formData.cutoff_hours,
                    onChange: (e) => setFormData((prev) => ({
                      ...prev,
                      cutoff_hours: parseInt(e.target.value) || 0
                    }))
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Status", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: formData.status,
              onChange: (e) => setFormData((prev) => ({
                ...prev,
                status: e.target.value
              })),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: __("Active", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inactive", children: __("Inactive", "yatra") })
              ]
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-5 h-5" }),
              __("Preview", "yatra")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("See which dates will be generated", "yatra") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                className: "w-full mb-4",
                onClick: () => previewMutation.mutate(formData),
                disabled: previewMutation.isPending || !formData.trip_id,
                children: [
                  previewMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4 mr-2" }),
                  __("Generate Preview", "yatra")
                ]
              }
            ),
            previewData && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: __("Total dates:", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "success", children: previewData.total })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-48 overflow-y-auto space-y-1", children: [
                previewData.dates && Array.isArray(previewData.dates) && previewData.dates.map((date, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded flex justify-between",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(date.departure_date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        }
                      ) }),
                      date.departure_time && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500", children: date.departure_time })
                    ]
                  },
                  index
                )),
                previewData.total > 20 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 text-center py-1", children: [
                  "+",
                  previewData.total - 20,
                  " ",
                  __("more dates", "yatra")
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", className: "w-full", disabled: isLoading, children: [
            isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4 mr-2" }),
            isEditing ? __("Update Rule", "yatra") : __("Create Rule", "yatra")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              className: "w-full",
              onClick: () => {
                var _a2;
                return navigate({
                  subpage: "trips",
                  tab: "availability",
                  trip_id: ((_a2 = formData.trip_id) == null ? void 0 : _a2.toString()) || tripIdFromUrl || ""
                });
              },
              children: __("Cancel", "yatra")
            }
          )
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium", children: __("How it works", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 mt-1", children: __(
            "Dates are generated automatically based on your pattern. Manually added specific dates will take priority over generated dates.",
            "yatra"
          ) })
        ] }) })
      ] })
    ] }) })
  ] });
};
export {
  RecurringRuleForm as default
};
//# sourceMappingURL=RecurringRuleForm-B8XJzaAL.js.map
