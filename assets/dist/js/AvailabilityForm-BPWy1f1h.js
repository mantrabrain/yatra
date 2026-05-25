import { j as jsxRuntimeExports, t as useQueryClient, r as reactExports, u as useQuery, v as useMutation, az as AlertCircle, z as ArrowLeft, q as MapPin, aD as CheckCircle2, D as Loader2, aw as Plus, ax as X, aV as Save } from "./react-vendor-CqkbFEvK.js";
import { C as Card, f as CardHeader, d as CardContent, A as Alert, P as PageHeader, B as Button, g as CardTitle, h as CardDescription, D as DatePicker, T as TimePicker, H as HelpText, L as LocationPicker, I as Input, S as Select, a4 as useNavigate } from "../../admin/dist/js/app.js";
import { u as useToast, _ as __, a as apiClient } from "./index-DRAt5dnR.js";
const AvailabilityFormSkeleton = () => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 bg-gray-200 dark:bg-gray-700 rounded w-56 mb-2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-80" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 animate-pulse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-72" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 dark:bg-gray-700 rounded w-52" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 dark:bg-gray-700 rounded w-52" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 dark:bg-gray-700 rounded w-44 mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-96" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-full" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 dark:bg-gray-700 rounded w-80" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 pt-6 border-t border-gray-200 dark:border-gray-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 bg-gray-200 dark:bg-gray-700 rounded w-44 mb-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 dark:bg-gray-700 rounded w-56" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 dark:bg-gray-700 rounded w-44" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 dark:bg-gray-700 rounded w-64" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 pt-6 border-t border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-44" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-14 mb-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded w-36" })
      ] })
    ] })
  ] });
};
function coordFromApi(v) {
  if (v == null || v === "") return "";
  return String(v);
}
const AvailabilityForm = () => {
  var _a;
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const tripIdFromUrl = urlParams.get("trip_id") ? parseInt(urlParams.get("trip_id")) : null;
  const availabilityId = urlParams.get("id") || null;
  const isEditMode = !!availabilityId;
  const [tripId, setTripId] = reactExports.useState(tripIdFromUrl);
  const [formData, setFormData] = reactExports.useState({
    departure_date: "",
    departure_time: "",
    arrival_date: "",
    arrival_time: "",
    total_seats: "",
    booked_seats: "0",
    seats_remaining: "",
    pricing_type: "regular",
    original_price: "",
    discounted_price: "",
    price_types: [],
    status: "available",
    is_blocked: false,
    block_reason: "",
    alert_threshold: "5",
    from_location: "",
    to_location: "",
    from_latitude: "",
    from_longitude: "",
    to_latitude: "",
    to_longitude: ""
  });
  const [errors, setErrors] = reactExports.useState({});
  const [showCategorySelector, setShowCategorySelector] = reactExports.useState(false);
  const { data: tripData } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      if (!tripId) return null;
      const response = await apiClient.get(`/trips/${tripId}`);
      const data = (response == null ? void 0 : response.data) || response;
      return data;
    },
    enabled: !!tripId
  });
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["traveler-categories"],
    queryFn: async () => {
      const response = await apiClient.get("/traveler-categories");
      const categories = (response == null ? void 0 : response.data) || response || [];
      return {
        categories: Array.isArray(categories) ? categories : []
      };
    }
  });
  const activeCategories = ((_a = categoriesData == null ? void 0 : categoriesData.categories) == null ? void 0 : _a.filter(
    (cat) => cat.status === "active" || cat.status === "publish"
  )) || [];
  const { data: availabilityData, isLoading: isLoadingAvailability } = useQuery(
    {
      queryKey: ["availability", availabilityId],
      queryFn: async () => {
        if (!availabilityId) return null;
        const response = await apiClient.get(`/availability/${availabilityId}`);
        return (response == null ? void 0 : response.data) || response;
      },
      enabled: isEditMode && !!availabilityId
    }
  );
  reactExports.useEffect(() => {
    if (availabilityData && availabilityData.trip_id && !tripId) {
      setTripId(availabilityData.trip_id);
    }
  }, [availabilityData, tripId]);
  reactExports.useEffect(() => {
    if (tripData && !isEditMode) {
      const rawPriceTypes = tripData.price_types;
      const hasTravelerPricing = Array.isArray(rawPriceTypes) ? rawPriceTypes.length > 0 : false;
      const effectivePricingType = hasTravelerPricing ? "traveler_based" : tripData.pricing_type || "regular";
      setFormData((prev) => ({
        ...prev,
        from_location: tripData.starting_location || "",
        to_location: tripData.ending_location || "",
        from_latitude: coordFromApi(tripData.starting_latitude),
        from_longitude: coordFromApi(tripData.starting_longitude),
        to_latitude: coordFromApi(tripData.ending_latitude),
        to_longitude: coordFromApi(tripData.ending_longitude),
        // Default pricing type based on trip's pricing type
        pricing_type: effectivePricingType
      }));
    }
  }, [tripData, isEditMode]);
  reactExports.useEffect(() => {
    var _a2, _b, _c;
    if (availabilityData) {
      const totalSeats = availabilityData.total_seats || availabilityData.seats_total || 0;
      const availableSeats = availabilityData.available_seats || availabilityData.seats_available || 0;
      const bookedSeats = totalSeats - availableSeats;
      const rawTripPriceTypes = tripData == null ? void 0 : tripData.price_types;
      const tripHasTravelerPricing = Array.isArray(rawTripPriceTypes) ? rawTripPriceTypes.length > 0 : false;
      const pricingType = tripHasTravelerPricing ? "traveler_based" : (tripData == null ? void 0 : tripData.pricing_type) || availabilityData.pricing_type || "regular";
      setFormData({
        departure_date: availabilityData.departure_date || "",
        departure_time: availabilityData.departure_time || "",
        arrival_date: availabilityData.arrival_date || availabilityData.departure_date || "",
        arrival_time: availabilityData.arrival_time || "",
        total_seats: totalSeats.toString(),
        booked_seats: bookedSeats.toString(),
        seats_remaining: availableSeats > 10 ? "10+" : availableSeats.toString(),
        pricing_type: pricingType,
        original_price: ((_a2 = availabilityData.original_price) == null ? void 0 : _a2.toString()) || "",
        discounted_price: ((_b = availabilityData.discounted_price) == null ? void 0 : _b.toString()) || "",
        price_types: availabilityData.price_types || [],
        status: availabilityData.status || (availabilityData.is_blocked ? "blocked" : "available"),
        is_blocked: availabilityData.is_blocked || availabilityData.status === "blocked" || false,
        block_reason: availabilityData.block_reason || "",
        alert_threshold: ((_c = availabilityData.alert_threshold) == null ? void 0 : _c.toString()) || "5",
        from_location: availabilityData.from_location || (tripData == null ? void 0 : tripData.starting_location) || "",
        to_location: availabilityData.to_location || (tripData == null ? void 0 : tripData.ending_location) || "",
        from_latitude: coordFromApi(availabilityData.from_latitude) || coordFromApi(tripData == null ? void 0 : tripData.starting_latitude),
        from_longitude: coordFromApi(availabilityData.from_longitude) || coordFromApi(tripData == null ? void 0 : tripData.starting_longitude),
        to_latitude: coordFromApi(availabilityData.to_latitude) || coordFromApi(tripData == null ? void 0 : tripData.ending_latitude),
        to_longitude: coordFromApi(availabilityData.to_longitude) || coordFromApi(tripData == null ? void 0 : tripData.ending_longitude)
      });
    }
  }, [availabilityData, tripData]);
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  const handlePriceTypeAdd = (categoryId) => {
    if (formData.price_types.some((pt) => pt.category_id === categoryId)) {
      return;
    }
    const category = activeCategories.find((cat) => cat.id === categoryId);
    setFormData((prev) => ({
      ...prev,
      price_types: [
        ...prev.price_types,
        {
          category_id: categoryId,
          category_label: (category == null ? void 0 : category.label) || "",
          original_price: "",
          discounted_price: ""
        }
      ]
    }));
  };
  const handlePriceTypeRemove = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      price_types: prev.price_types.filter(
        (pt) => pt.category_id !== categoryId
      )
    }));
  };
  const handlePriceTypeChange = (categoryId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      price_types: prev.price_types.map(
        (pt) => pt.category_id === categoryId ? { ...pt, [field]: value } : pt
      )
    }));
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.departure_date) {
      newErrors.departure_date = __("Departure date is required", "yatra");
    }
    if (!formData.arrival_date) {
      newErrors.arrival_date = __("Arrival date is required", "yatra");
    }
    const isSingleDay = (tripData == null ? void 0 : tripData.trip_type) === "single_day";
    if (isSingleDay) {
      if (formData.departure_date && formData.arrival_date && formData.departure_date !== formData.arrival_date) {
        newErrors.arrival_date = __(
          "For single day trips, departure and arrival must be on the same date",
          "yatra"
        );
      }
      if (!formData.departure_time) {
        newErrors.departure_time = __(
          "Departure time is required for single day trips",
          "yatra"
        );
      }
      if (!formData.arrival_time) {
        newErrors.arrival_time = __(
          "Arrival time is required for single day trips",
          "yatra"
        );
      }
      if (formData.departure_time && formData.arrival_time && formData.departure_date === formData.arrival_date) {
        const [depHour, depMin] = formData.departure_time.split(":").map(Number);
        const [arrHour, arrMin] = formData.arrival_time.split(":").map(Number);
        const depMinutes = depHour * 60 + depMin;
        const arrMinutes = arrHour * 60 + arrMin;
        if (arrMinutes <= depMinutes) {
          newErrors.arrival_time = __(
            "Arrival time must be after departure time",
            "yatra"
          );
        }
      }
    } else {
      if (formData.departure_date && formData.arrival_date) {
        const departure = new Date(formData.departure_date);
        const arrival = new Date(formData.arrival_date);
        if (arrival <= departure) {
          newErrors.arrival_date = __(
            "Arrival date must be after departure date",
            "yatra"
          );
        }
      }
    }
    if (!formData.total_seats || parseInt(formData.total_seats) <= 0) {
      newErrors.total_seats = __(
        "Total capacity is required and must be greater than 0",
        "yatra"
      );
    }
    if (isEditMode && formData.booked_seats) {
      const total = parseInt(formData.total_seats) || 0;
      const booked = parseInt(formData.booked_seats) || 0;
      if (booked > total) {
        newErrors.booked_seats = __(
          "Booked seats cannot exceed total capacity",
          "yatra"
        );
      }
    }
    if (formData.pricing_type === "regular") {
      if (formData.original_price && parseFloat(formData.original_price) <= 0) {
        newErrors.original_price = __(
          "Original price must be greater than 0",
          "yatra"
        );
      }
      if (formData.discounted_price && formData.original_price && parseFloat(formData.discounted_price) >= parseFloat(formData.original_price)) {
        newErrors.discounted_price = __(
          "Discounted price must be less than original price",
          "yatra"
        );
      }
    } else {
      if (formData.price_types.length > 0) {
        formData.price_types.forEach((priceType, index) => {
          if (priceType.original_price && (isNaN(parseFloat(priceType.original_price)) || parseFloat(priceType.original_price) < 0)) {
            newErrors[`price_type_${index}_original`] = __(
              "Original price must be a valid number",
              "yatra"
            );
          }
          if (priceType.discounted_price && (isNaN(parseFloat(priceType.discounted_price)) || parseFloat(priceType.discounted_price) < 0)) {
            newErrors[`price_type_${index}_discounted`] = __(
              "Discounted price must be a valid number",
              "yatra"
            );
          }
          if (priceType.discounted_price && priceType.original_price && parseFloat(priceType.discounted_price) >= parseFloat(priceType.original_price)) {
            newErrors[`price_type_${index}_discounted`] = __(
              "Discounted price must be less than original price",
              "yatra"
            );
          }
        });
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      var _a2, _b, _c, _d;
      const totalSeats = data.total_seats ? parseInt(data.total_seats) : 0;
      const bookedSeats = isEditMode && data.booked_seats ? parseInt(data.booked_seats) : 0;
      const availableSeats = totalSeats - bookedSeats;
      const payload = {
        trip_id: tripId,
        departure_date: data.departure_date,
        departure_time: (tripData == null ? void 0 : tripData.trip_type) === "single_day" ? data.departure_time || null : null,
        arrival_date: data.arrival_date || null,
        arrival_time: (tripData == null ? void 0 : tripData.trip_type) === "single_day" ? data.arrival_time || null : null,
        seats_total: totalSeats,
        seats_available: availableSeats,
        seats_reserved: 0,
        seats_waitlist: 0,
        pricing_type: data.pricing_type,
        original_price: data.pricing_type === "regular" && data.original_price ? parseFloat(data.original_price) : null,
        discounted_price: data.pricing_type === "regular" && data.discounted_price ? parseFloat(data.discounted_price) : null,
        price_types: data.pricing_type === "traveler_based" ? data.price_types : null,
        status: data.is_blocked ? "blocked" : data.status,
        from_location: data.from_location || null,
        to_location: data.to_location || null,
        from_latitude: ((_a2 = data.from_latitude) == null ? void 0 : _a2.trim()) || null,
        from_longitude: ((_b = data.from_longitude) == null ? void 0 : _b.trim()) || null,
        to_latitude: ((_c = data.to_latitude) == null ? void 0 : _c.trim()) || null,
        to_longitude: ((_d = data.to_longitude) == null ? void 0 : _d.trim()) || null,
        special_notes: null,
        cutoff_hours: 24
      };
      if (isEditMode && availabilityId) {
        const response = await apiClient.put(
          `/availability/${availabilityId}`,
          payload
        );
        return (response == null ? void 0 : response.data) || response;
      } else {
        const response = await apiClient.post("/availability", payload);
        return (response == null ? void 0 : response.data) || response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      navigate({
        subpage: "trips",
        tab: "availability",
        trip_id: tripId == null ? void 0 : tripId.toString()
      });
      setTimeout(() => {
        showToast(
          isEditMode ? __("Availability date updated successfully", "yatra") : __("Availability date created successfully", "yatra"),
          "success",
          3e3
          // Shorter duration
        );
      }, 100);
    },
    onError: (error) => {
      var _a2;
      const errorMessage = (error == null ? void 0 : error.message) || ((_a2 = error == null ? void 0 : error.data) == null ? void 0 : _a2.message) || __("An error occurred while saving", "yatra");
      showToast(errorMessage, "error");
      setErrors({
        submit: errorMessage
      });
    }
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    saveMutation.mutate(formData);
  };
  const getCurrencySymbol = (currency) => {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      INR: "₹"
    };
    return symbols[currency] || currency;
  };
  if (isEditMode && !tripId && isLoadingAvailability) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AvailabilityFormSkeleton, {});
  }
  if (!tripId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "error", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: __("Trip ID Required", "yatra") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: __("Please select a trip first.", "yatra") })
      ] })
    ] });
  }
  if (isLoadingAvailability || isEditMode && !availabilityData) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AvailabilityFormSkeleton, {});
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: isEditMode ? __("Edit Availability Date", "yatra") : __("Add Availability Date", "yatra"),
        description: tripData ? `${isEditMode ? __("Edit", "yatra") : __("Add")} availability date for ${tripData.title} (Trip ID: ${tripId})` : __("Add a new availability date for this trip", "yatra"),
        actions: tripId ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => navigate({
              subpage: "trips",
              tab: "availability",
              trip_id: tripId.toString()
            }),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
              __("Back", "yatra")
            ]
          }
        ) : null
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Date Information", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
            "Set the departure and arrival dates for this availability",
            "yatra"
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          (tripData == null ? void 0 : tripData.trip_type) === "single_day" ? (
            // Single Day Trip - Show date and time pickers
            /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                  __("Date", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DatePicker,
                  {
                    value: formData.departure_date,
                    onChange: (value) => {
                      handleFieldChange("departure_date", value);
                      handleFieldChange("arrival_date", value);
                    },
                    placeholder: __("Select date", "yatra"),
                    error: !!errors.departure_date
                  }
                ),
                errors.departure_date && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.departure_date })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                    __("Departure Time", "yatra"),
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TimePicker,
                    {
                      value: formData.departure_time,
                      onChange: (value) => handleFieldChange("departure_time", value),
                      placeholder: __("Select departure time", "yatra"),
                      error: !!errors.departure_time
                    }
                  ),
                  errors.departure_time && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.departure_time })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                    __("Arrival Time", "yatra"),
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TimePicker,
                    {
                      value: formData.arrival_time,
                      onChange: (value) => handleFieldChange("arrival_time", value),
                      placeholder: __("Select arrival time", "yatra"),
                      error: !!errors.arrival_time
                    }
                  ),
                  errors.arrival_time && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.arrival_time })
                ] })
              ] })
            ] })
          ) : (
            // Multi-Day Trip - Show date pickers only
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                  __("Departure Date", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DatePicker,
                  {
                    value: formData.departure_date,
                    onChange: (value) => handleFieldChange("departure_date", value),
                    placeholder: __("Select departure date", "yatra"),
                    error: !!errors.departure_date
                  }
                ),
                errors.departure_date && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.departure_date })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                  __("Arrival Date", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DatePicker,
                  {
                    value: formData.arrival_date,
                    onChange: (value) => handleFieldChange("arrival_date", value),
                    minDate: formData.departure_date ? new Date(formData.departure_date) : void 0,
                    placeholder: __("Select arrival date", "yatra"),
                    error: !!errors.arrival_date
                  }
                ),
                errors.arrival_date && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.arrival_date }),
                (tripData == null ? void 0 : tripData.duration_days) && formData.departure_date && formData.arrival_date && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5", children: (() => {
                  const departure = new Date(formData.departure_date);
                  const arrival = new Date(formData.arrival_date);
                  const selectedDays = Math.ceil(
                    (arrival.getTime() - departure.getTime()) / (1e3 * 60 * 60 * 24)
                  );
                  const expectedDays = tripData.duration_days;
                  const diff = selectedDays - expectedDays;
                  if (diff === 0) {
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-green-600 dark:text-green-400", children: [
                      __("Duration matches trip duration", "yatra"),
                      " ",
                      "(",
                      selectedDays,
                      " ",
                      __("days", "yatra"),
                      ")"
                    ] });
                  } else if (diff < 0) {
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-amber-600 dark:text-amber-400", children: [
                      __("Shorter than trip duration", "yatra"),
                      ":",
                      " ",
                      selectedDays,
                      " ",
                      __("days", "yatra"),
                      " (",
                      Math.abs(diff),
                      " ",
                      __("days shorter", "yatra"),
                      " ",
                      "than expected ",
                      expectedDays,
                      " ",
                      __("days", "yatra"),
                      ")"
                    ] });
                  } else {
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-amber-600 dark:text-amber-400", children: [
                      __("Longer than trip duration", "yatra"),
                      ":",
                      " ",
                      selectedDays,
                      " ",
                      __("days", "yatra"),
                      " (",
                      diff,
                      " ",
                      __("days longer", "yatra"),
                      " than expected",
                      " ",
                      expectedDays,
                      " ",
                      __("days", "yatra"),
                      ")"
                    ] });
                  }
                })() }),
                (tripData == null ? void 0 : tripData.duration_days) && !formData.arrival_date && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: `${__("Trip duration", "yatra")}: ${tripData.duration_days} ${tripData.duration_days === 1 ? __("day", "yatra") : __("days", "yatra")}${tripData.duration_nights ? ` (${tripData.duration_nights} ${tripData.duration_nights === 1 ? __("night", "yatra") : __("nights", "yatra")})` : ""}`,
                    className: "mt-1"
                  }
                )
              ] })
            ] })
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2", children: [
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
                      name: formData.from_location,
                      latitude: formData.from_latitude,
                      longitude: formData.from_longitude
                    },
                    onChange: (loc) => {
                      setFormData((prev) => ({
                        ...prev,
                        from_location: loc.name,
                        from_latitude: loc.latitude,
                        from_longitude: loc.longitude
                      }));
                    },
                    label: "",
                    placeholder: __("Search for starting location...", "yatra"),
                    helpText: "",
                    required: false,
                    defaultMapCenter: formData.from_latitude && formData.from_longitude ? [
                      parseFloat(formData.from_latitude),
                      parseFloat(formData.from_longitude)
                    ] : (tripData == null ? void 0 : tripData.starting_latitude) && (tripData == null ? void 0 : tripData.starting_longitude) ? [
                      parseFloat(String(tripData.starting_latitude)),
                      parseFloat(String(tripData.starting_longitude))
                    ] : [20, 0],
                    defaultZoom: formData.from_latitude && formData.from_longitude ? 13 : (tripData == null ? void 0 : tripData.starting_latitude) && (tripData == null ? void 0 : tripData.starting_longitude) ? 13 : 2,
                    mapHeight: "300px",
                    showMapButton: false,
                    searchLimit: 8,
                    __,
                    className: "",
                    mapClassName: "rounded-lg",
                    showManualCoordinateFields: true
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "Overrides trip starting location for this date only. Coordinates power maps and distance features.",
                      "yatra"
                    )
                  }
                )
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
                      name: formData.to_location,
                      latitude: formData.to_latitude,
                      longitude: formData.to_longitude
                    },
                    onChange: (loc) => {
                      setFormData((prev) => ({
                        ...prev,
                        to_location: loc.name,
                        to_latitude: loc.latitude,
                        to_longitude: loc.longitude
                      }));
                    },
                    label: "",
                    placeholder: __("Search for ending location...", "yatra"),
                    helpText: "",
                    required: false,
                    defaultMapCenter: formData.to_latitude && formData.to_longitude ? [
                      parseFloat(formData.to_latitude),
                      parseFloat(formData.to_longitude)
                    ] : (tripData == null ? void 0 : tripData.ending_latitude) && (tripData == null ? void 0 : tripData.ending_longitude) ? [
                      parseFloat(String(tripData.ending_latitude)),
                      parseFloat(String(tripData.ending_longitude))
                    ] : formData.from_latitude && formData.from_longitude ? [
                      parseFloat(formData.from_latitude),
                      parseFloat(formData.from_longitude)
                    ] : (tripData == null ? void 0 : tripData.starting_latitude) && (tripData == null ? void 0 : tripData.starting_longitude) ? [
                      parseFloat(
                        String(tripData.starting_latitude)
                      ),
                      parseFloat(
                        String(tripData.starting_longitude)
                      )
                    ] : [20, 0],
                    defaultZoom: formData.to_latitude && formData.to_longitude ? 13 : (tripData == null ? void 0 : tripData.ending_latitude) && (tripData == null ? void 0 : tripData.ending_longitude) ? 13 : formData.from_latitude && formData.from_longitude ? 13 : (tripData == null ? void 0 : tripData.starting_latitude) && (tripData == null ? void 0 : tripData.starting_longitude) ? 13 : 2,
                    mapHeight: "300px",
                    showMapButton: false,
                    searchLimit: 8,
                    __,
                    className: "",
                    mapClassName: "rounded-lg",
                    showManualCoordinateFields: true
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "Overrides trip ending location for this date only.",
                      "yatra"
                    )
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Pricing & Availability", "yatra") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
            "Set pricing for traveler categories and seat availability for this date",
            "yatra"
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
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
                "Leave pricing fields empty to use the trip's default pricing. Fill them in only if you want to override the default pricing for this specific date.",
                "yatra"
              ) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `p-2 rounded-full ${formData.pricing_type === "traveler_based" ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`,
                children: formData.pricing_type === "traveler_based" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
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
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: formData.pricing_type === "traveler_based" ? __("Traveler-Based Pricing", "yatra") : __("Regular Pricing", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: formData.pricing_type === "traveler_based" ? __(
                "This trip uses traveler category pricing. Set prices for each category below.",
                "yatra"
              ) : __(
                "This trip uses regular pricing. Set a single price for all travelers below.",
                "yatra"
              ) })
            ] })
          ] }) }),
          formData.pricing_type === "regular" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                __("Original Price", "yatra"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-400 text-xs", children: [
                  "(",
                  __("Optional", "yatra"),
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: getCurrencySymbol((tripData == null ? void 0 : tripData.currency) || "USD") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    step: "0.01",
                    min: "0",
                    value: formData.original_price,
                    onChange: (e) => handleFieldChange("original_price", e.target.value),
                    placeholder: "0.00",
                    className: `pl-7 ${errors.original_price ? "border-red-500" : ""}`
                  }
                )
              ] }),
              errors.original_price && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.original_price }),
              !formData.original_price && tripData && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-blue-600 dark:text-blue-400", children: [
                __("Using trip default", "yatra"),
                ":",
                " ",
                getCurrencySymbol((tripData == null ? void 0 : tripData.currency) || "USD"),
                tripData.original_price || "0.00"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                __("Discounted Price", "yatra"),
                " (",
                __("Optional", "yatra"),
                ")"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: getCurrencySymbol((tripData == null ? void 0 : tripData.currency) || "USD") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    step: "0.01",
                    min: "0",
                    value: formData.discounted_price,
                    onChange: (e) => handleFieldChange("discounted_price", e.target.value),
                    placeholder: "0.00",
                    className: `pl-7 ${errors.discounted_price ? "border-red-500" : ""}`
                  }
                )
              ] }),
              errors.discounted_price && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.discounted_price })
            ] })
          ] }) }),
          formData.pricing_type === "traveler_based" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [
                __("Traveler Category Pricing", "yatra"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-400 text-xs", children: [
                  "(",
                  __("Optional", "yatra"),
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4", children: __(
                "Add pricing to override trip default pricing for specific traveler categories. Leave empty to use trip default pricing.",
                "yatra"
              ) })
            ] }),
            isLoadingCategories ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-6 h-6 animate-spin text-gray-400" }) }) : activeCategories.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border border-gray-200 dark:border-gray-700 rounded-lg text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: __("No active traveler categories found.", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => window.location.href = "?subpage=traveler-categories&action=create",
                  className: "flex items-center gap-2 mx-auto",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                    __("Create Category", "yatra")
                  ]
                }
              )
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: () => setShowCategorySelector(!showCategorySelector),
                    className: "flex items-center gap-2",
                    disabled: activeCategories.filter(
                      (cat) => !formData.price_types.some(
                        (pt) => pt.category_id === cat.id
                      )
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
                      (cat) => !formData.price_types.some(
                        (pt) => pt.category_id === cat.id
                      )
                    ).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center", children: __(
                      "All categories have pricing added",
                      "yatra"
                    ) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: activeCategories.filter(
                      (cat) => !formData.price_types.some(
                        (pt) => pt.category_id === cat.id
                      )
                    ).map((category) => {
                      const ageRange = category.age_min !== void 0 || category.age_max !== void 0 ? category.age_min !== void 0 && category.age_max !== void 0 ? `${category.age_min}-${category.age_max} ${__("years", "yatra")}` : category.age_min !== void 0 ? `${category.age_min}+ ${__("years", "yatra")}` : category.age_max !== void 0 ? `${__("Under", "yatra")} ${category.age_max} ${__("years", "yatra")}` : "" : null;
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            handlePriceTypeAdd(category.id);
                            setShowCategorySelector(false);
                          },
                          className: "w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium text-sm text-gray-900 dark:text-white", children: [
                              category.label,
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
              formData.price_types.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: formData.price_types.map((priceType, index) => {
                const category = activeCategories.find(
                  (cat) => cat.id === priceType.category_id
                );
                if (!category) return null;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "p-4 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 mb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: [
                            category.label,
                            (category.age_min !== void 0 || category.age_max !== void 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-xs font-normal text-gray-500 dark:text-gray-400", children: [
                              "(",
                              category.age_min !== void 0 && category.age_max !== void 0 ? `${category.age_min}-${category.age_max} ${__("years", "yatra")}` : category.age_min !== void 0 ? `${category.age_min}+ ${__("years", "yatra")}` : category.age_max !== void 0 ? `${__("Under", "yatra")} ${category.age_max} ${__("years", "yatra")}` : "",
                              ")"
                            ] })
                          ] }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: category.description })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => handlePriceTypeRemove(category.id),
                            className: "p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors",
                            title: __("Remove Pricing", "yatra"),
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                            __("Original Price", "yatra"),
                            " ",
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-400 text-xs", children: [
                              "(",
                              __("Optional", "yatra"),
                              ")"
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: getCurrencySymbol(
                              (tripData == null ? void 0 : tripData.currency) || "USD"
                            ) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                type: "number",
                                step: "0.01",
                                min: "0",
                                value: priceType.original_price,
                                onChange: (e) => handlePriceTypeChange(
                                  category.id,
                                  "original_price",
                                  e.target.value
                                ),
                                placeholder: "0.00",
                                className: `pl-7 ${errors[`price_type_${index}_original`] ? "border-red-500" : ""}`
                              }
                            )
                          ] }),
                          errors[`price_type_${index}_original`] && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600 dark:text-red-400", children: errors[`price_type_${index}_original`] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                            __("Discounted Price", "yatra"),
                            " (",
                            __("Optional", "yatra"),
                            ")"
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm", children: getCurrencySymbol(
                              (tripData == null ? void 0 : tripData.currency) || "USD"
                            ) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Input,
                              {
                                type: "number",
                                step: "0.01",
                                min: "0",
                                value: priceType.discounted_price,
                                onChange: (e) => handlePriceTypeChange(
                                  category.id,
                                  "discounted_price",
                                  e.target.value
                                ),
                                placeholder: "0.00",
                                className: `pl-7 ${errors[`price_type_${index}_discounted`] ? "border-red-500" : ""}`
                              }
                            )
                          ] }),
                          errors[`price_type_${index}_discounted`] && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600 dark:text-red-400", children: errors[`price_type_${index}_discounted`] })
                        ] })
                      ] })
                    ]
                  },
                  priceType.category_id
                );
              }) }),
              errors.price_types && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-red-600 dark:text-red-400", children: errors.price_types })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 pt-6 border-t border-gray-200 dark:border-gray-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4", children: __("Inventory Management", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: [
                  __("Total Capacity", "yatra"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    min: "1",
                    value: formData.total_seats,
                    onChange: (e) => handleFieldChange("total_seats", e.target.value),
                    placeholder: "20",
                    className: errors.total_seats ? "border-red-500" : ""
                  }
                ),
                errors.total_seats && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.total_seats }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "Maximum number of seats available for this date",
                      "yatra"
                    ),
                    className: "mt-1"
                  }
                )
              ] }),
              isEditMode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: __("Booked Seats", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    min: "0",
                    value: formData.booked_seats,
                    readOnly: true,
                    className: "bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __("Currently booked seats (read-only)", "yatra"),
                    className: "mt-1"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: __("Alert Threshold", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    min: "1",
                    value: formData.alert_threshold,
                    onChange: (e) => handleFieldChange("alert_threshold", e.target.value),
                    placeholder: "5"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HelpText,
                  {
                    text: __(
                      "Alert when available seats drop below this number",
                      "yatra"
                    ),
                    className: "mt-1"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 pt-6 border-t border-gray-200 dark:border-gray-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: __("Block Date", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: formData.is_blocked,
                    onChange: (e) => {
                      handleFieldChange("is_blocked", e.target.checked);
                      if (e.target.checked) {
                        handleFieldChange("status", "blocked");
                      } else {
                        handleFieldChange("status", "available");
                      }
                    },
                    className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: __("Block this date from bookings", "yatra") })
              ] })
            ] }),
            formData.is_blocked && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: __("Block Reason", "yatra") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "text",
                  value: formData.block_reason,
                  onChange: (e) => handleFieldChange("block_reason", e.target.value),
                  placeholder: __(
                    "e.g., Maintenance, Holiday, Special Event",
                    "yatra"
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                HelpText,
                {
                  text: __(
                    "Reason for blocking this date (optional but recommended)",
                    "yatra"
                  ),
                  className: "mt-1"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5", children: __("Status", "yatra") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.status,
                onChange: (e) => {
                  handleFieldChange("status", e.target.value);
                  if (e.target.value === "blocked") {
                    handleFieldChange("is_blocked", true);
                  } else if (formData.is_blocked && e.target.value !== "blocked") {
                    handleFieldChange("is_blocked", false);
                  }
                },
                disabled: formData.is_blocked,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "available", children: __("Available", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "limited", children: __("Limited", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "sold_out", children: __("Sold Out", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "closed", children: __("Closed", "yatra") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "blocked", children: __("Blocked", "yatra") })
                ]
              }
            ),
            formData.is_blocked && /* @__PURE__ */ jsxRuntimeExports.jsx(
              HelpText,
              {
                text: __(
                  'Status is automatically set to "Blocked" when date is blocked',
                  "yatra"
                ),
                className: "mt-1"
              }
            )
          ] })
        ] })
      ] }),
      errors.submit && /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "error", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: errors.submit })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => {
              if (tripId) {
                navigate({
                  subpage: "trips",
                  tab: "availability",
                  trip_id: tripId.toString()
                });
              } else {
                navigate({ subpage: "trips", tab: "availability" });
              }
            },
            children: __("Cancel", "yatra")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: saveMutation.isPending, children: saveMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }),
          __("Saving...", "yatra")
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4 mr-2" }),
          __("Save Availability", "yatra")
        ] }) })
      ] })
    ] })
  ] });
};
export {
  AvailabilityForm as default
};
//# sourceMappingURL=AvailabilityForm-BPWy1f1h.js.map
