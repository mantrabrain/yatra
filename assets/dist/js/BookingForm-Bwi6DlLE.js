import { t as useQueryClient, r as reactExports, u as useQuery, v as useMutation, j as jsxRuntimeExports, z as ArrowLeft, ax as X, x as ChevronDown, aO as Search, az as AlertCircle, U as Users, aw as Plus, aN as Trash2, ba as ChevronUp, D as Loader2, aV as Save } from "./react-vendor-zODANjVp.js";
import { f as formatYatraMoney, g as getCurrencySymbol, _ as __, j as getCountryOptions, b as apiService } from "./index-CG-QHfTA.js";
import { u as usePermissions, Q as Skeleton, C as Card, f as CardHeader, d as CardContent, P as PageHeader, B as Button, s as ConditionalRender, g as CardTitle, I as Input, D as DatePicker, S as Select, ab as formatDateForInput } from "../../admin/dist/js/app.js";
class TaxService {
  constructor() {
    this.taxSettings = null;
  }
  static getInstance() {
    if (!TaxService.instance) {
      TaxService.instance = new TaxService();
    }
    return TaxService.instance;
  }
  /**
   * Load tax settings from API
   */
  async loadTaxSettings() {
    try {
      const response = await fetch("/wp-json/yatra/v1/settings");
      const settings = await response.json();
      this.taxSettings = settings;
    } catch (error) {
      console.error("Failed to load tax settings:", error);
    }
  }
  /**
   * Get tax settings
   */
  getTaxSettings() {
    return this.taxSettings;
  }
  /**
   * Check if tax is enabled
   */
  isTaxEnabled() {
    var _a;
    return ((_a = this.taxSettings) == null ? void 0 : _a.enable_tax) === true;
  }
  /**
   * Calculate tax for booking
   */
  calculateTax(amount, country) {
    var _a, _b;
    if (!this.isTaxEnabled()) {
      return {
        tax_amount: 0,
        tax_rate: 0,
        tax_inclusive: false,
        taxes: []
      };
    }
    const taxInclusive = ((_a = this.taxSettings) == null ? void 0 : _a.tax_inclusive) === true;
    const multipleTaxesEnabled = ((_b = this.taxSettings) == null ? void 0 : _b.multiple_taxes_enabled) === true;
    if (multipleTaxesEnabled) {
      return this.calculateMultipleTaxes(amount, country, taxInclusive);
    } else {
      return this.calculateSingleTax(amount, country, taxInclusive);
    }
  }
  /**
   * Calculate single tax (backward compatibility)
   */
  calculateSingleTax(amount, country, taxInclusive = false) {
    var _a, _b, _c, _d, _e, _f;
    let taxRate = ((_a = this.taxSettings) == null ? void 0 : _a.tax_rate) || 0;
    const taxName = ((_b = this.taxSettings) == null ? void 0 : _b.tax_name) || ((_c = this.taxSettings) == null ? void 0 : _c.tax_label) || "Tax";
    if (((_d = this.taxSettings) == null ? void 0 : _d.tax_by_country) === true && country && ((_f = (_e = this.taxSettings) == null ? void 0 : _e.tax_rates) == null ? void 0 : _f[country])) {
      taxRate = this.taxSettings.tax_rates[country];
    }
    let taxAmount;
    if (taxInclusive) {
      taxAmount = amount - amount / (1 + taxRate / 100);
    } else {
      taxAmount = amount * (taxRate / 100);
    }
    return {
      tax_amount: Math.round(taxAmount * 100) / 100,
      tax_rate: taxRate,
      tax_inclusive: taxInclusive,
      taxes: [
        {
          name: taxName,
          rate: taxRate,
          amount: Math.round(taxAmount * 100) / 100
        }
      ]
    };
  }
  /**
   * Calculate multiple taxes
   */
  calculateMultipleTaxes(amount, country, taxInclusive = false) {
    var _a, _b, _c;
    let taxes = ((_a = this.taxSettings) == null ? void 0 : _a.multiple_taxes) || [];
    if (country && ((_c = (_b = this.taxSettings) == null ? void 0 : _b.multiple_taxes_by_country) == null ? void 0 : _c[country])) {
      taxes = this.taxSettings.multiple_taxes_by_country[country];
    }
    const calculatedTaxes = [];
    let totalTaxAmount = 0;
    for (const tax of taxes) {
      const taxRate = tax.rate || 0;
      const taxName = tax.name || "Tax";
      let taxAmount;
      if (taxInclusive) {
        const baseAmount = amount - totalTaxAmount;
        taxAmount = baseAmount * (taxRate / 100);
      } else {
        taxAmount = amount * (taxRate / 100);
      }
      taxAmount = Math.round(taxAmount * 100) / 100;
      totalTaxAmount += taxAmount;
      calculatedTaxes.push({
        name: taxName,
        rate: taxRate,
        amount: taxAmount
      });
    }
    return {
      tax_amount: Math.round(totalTaxAmount * 100) / 100,
      tax_rate: taxes.reduce(
        (sum, tax) => sum + (tax.rate || 0),
        0
      ),
      tax_inclusive: taxInclusive,
      taxes: calculatedTaxes
    };
  }
  /**
   * Calculate complete booking tax breakdown
   */
  calculateBookingTax(subtotal, country) {
    const taxDetails = this.calculateTax(subtotal, country);
    let finalSubtotal;
    let finalTotal;
    if (taxDetails.tax_inclusive) {
      finalSubtotal = subtotal - taxDetails.tax_amount;
      finalTotal = subtotal;
    } else {
      finalSubtotal = subtotal;
      finalTotal = subtotal + taxDetails.tax_amount;
    }
    const formattedTaxes = taxDetails.taxes.map((tax) => ({
      ...tax,
      formatted_amount: this.formatPrice(tax.amount),
      formatted_rate: `${tax.rate.toFixed(2)}%`
    }));
    const taxBreakdown = formattedTaxes.map(
      (tax) => `${tax.name} (${tax.formatted_rate}): ${tax.formatted_amount}`
    ).join("\n");
    return {
      subtotal: Math.round(finalSubtotal * 100) / 100,
      tax_amount: taxDetails.tax_amount,
      total_amount: Math.round(finalTotal * 100) / 100,
      tax_rate: taxDetails.tax_rate,
      tax_inclusive: taxDetails.tax_inclusive,
      taxes: formattedTaxes,
      tax_breakdown: taxBreakdown
    };
  }
  /**
   * Format price display
   */
  formatPrice(amount) {
    var _a;
    const currency = ((_a = this.taxSettings) == null ? void 0 : _a.currency) || "USD";
    return formatYatraMoney(Number(amount) || 0, currency, {
      zeroAsUnknown: false
    });
  }
  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency) {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      AUD: "A$",
      CAD: "C$",
      CHF: "CHF",
      CNY: "¥",
      INR: "₹"
    };
    return symbols[currency] || currency;
  }
  /**
   * Get tax breakdown for display
   */
  getTaxBreakdown(taxDetails) {
    return taxDetails.taxes.map((tax) => ({
      name: tax.name,
      rate: tax.rate,
      amount: tax.amount,
      formatted_amount: this.formatPrice(tax.amount),
      formatted_rate: `${tax.rate.toFixed(2)}%`,
      formatted_line: `${tax.name} (${tax.rate.toFixed(2)}%): ${this.formatPrice(tax.amount)}`
    }));
  }
  /**
   * Format tax display for booking summary
   */
  formatTaxDisplay(taxDetails) {
    const breakdown = this.getTaxBreakdown(taxDetails);
    return breakdown.map((tax) => tax.formatted_line).join("\n");
  }
  /**
   * Validate tax configuration
   */
  validateTaxConfiguration() {
    var _a, _b, _c, _d;
    const errors = [];
    if (!this.isTaxEnabled()) {
      return { valid: true, errors: [] };
    }
    const multipleTaxesEnabled = ((_a = this.taxSettings) == null ? void 0 : _a.multiple_taxes_enabled) === true;
    if (multipleTaxesEnabled) {
      const multipleTaxes = ((_b = this.taxSettings) == null ? void 0 : _b.multiple_taxes) || [];
      if (multipleTaxes.length === 0) {
        errors.push("At least one tax must be configured");
      }
      let totalRate = 0;
      for (let i = 0; i < multipleTaxes.length; i++) {
        const tax = multipleTaxes[i];
        if (!tax.name || tax.name.trim() === "") {
          errors.push(`Tax ${i + 1}: Name is required`);
        }
        if (typeof tax.rate !== "number" || tax.rate < 0 || tax.rate > 100) {
          errors.push(`Tax ${i + 1}: Rate must be between 0 and 100`);
        } else {
          totalRate += tax.rate;
        }
      }
      if (totalRate > 100) {
        errors.push("Total tax rate cannot exceed 100%");
      }
    } else {
      const taxRate = ((_c = this.taxSettings) == null ? void 0 : _c.tax_rate) || 0;
      const taxName = ((_d = this.taxSettings) == null ? void 0 : _d.tax_name) || "";
      if (typeof taxRate !== "number" || taxRate < 0 || taxRate > 100) {
        errors.push("Tax rate must be between 0 and 100");
      }
      if (!taxName || taxName.trim() === "") {
        errors.push("Tax name is required");
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  /**
   * Get tax summary for reporting
   */
  getTaxSummary(bookings) {
    const summary = {
      total_tax_collected: 0,
      total_bookings_with_tax: 0,
      tax_breakdown: {},
      average_tax_rate: 0
    };
    let totalTaxRate = 0;
    let taxRateCount = 0;
    for (const booking of bookings) {
      const taxAmount = booking.tax_amount || 0;
      if (taxAmount > 0) {
        summary.total_tax_collected += taxAmount;
        summary.total_bookings_with_tax++;
        const taxRate = booking.tax_rate || 0;
        if (taxRate > 0) {
          totalTaxRate += taxRate;
          taxRateCount++;
        }
        const taxBreakdown = booking.tax_breakdown || [];
        for (const tax of taxBreakdown) {
          const taxName = tax.name;
          if (!summary.tax_breakdown[taxName]) {
            summary.tax_breakdown[taxName] = {
              name: taxName,
              total_amount: 0,
              count: 0,
              average_rate: 0
            };
          }
          summary.tax_breakdown[taxName].total_amount += tax.amount;
          summary.tax_breakdown[taxName].count++;
          summary.tax_breakdown[taxName].average_rate += tax.rate;
        }
      }
    }
    if (taxRateCount > 0) {
      summary.average_tax_rate = totalTaxRate / taxRateCount;
    }
    for (const taxName in summary.tax_breakdown) {
      const taxData = summary.tax_breakdown[taxName];
      if (taxData.count > 0) {
        taxData.average_rate = taxData.average_rate / taxData.count;
      }
    }
    return summary;
  }
}
const taxService = TaxService.getInstance();
const countryList = getCountryOptions();
const CORE_CONTACT_IDS = ["first_name", "last_name", "email", "phone", "country"];
const normalizeDateInput = (value) => {
  if (!value) return "";
  return formatDateForInput(value) || value;
};
const BookingForm = () => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const globalCurrency = ((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.currency) || "USD";
  const currencySymbol = getCurrencySymbol(globalCurrency);
  const [formData, setFormData] = reactExports.useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_country: "",
    trip_id: "",
    booking_date: normalizeDateInput((/* @__PURE__ */ new Date()).toISOString()),
    travel_date: "",
    travelers: "1",
    subtotal: "",
    tax_amount: "",
    total_amount: "",
    currency: globalCurrency,
    payment_status: "pending",
    booking_status: "pending",
    payment_method: "",
    notes: ""
  });
  const [travelersData, setTravelersData] = reactExports.useState([{}]);
  const [expandedTravelers, setExpandedTravelers] = reactExports.useState([0]);
  const [emergencyContactData, setEmergencyContactData] = reactExports.useState({});
  const [contactExtraData, setContactExtraData] = reactExports.useState({});
  const [errors, setErrors] = reactExports.useState({});
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [tripSearchQuery, setTripSearchQuery] = reactExports.useState("");
  const [isTripDropdownOpen, setIsTripDropdownOpen] = reactExports.useState(false);
  const tripDropdownRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const handleClickOutside = (event) => {
      if (tripDropdownRef.current && !tripDropdownRef.current.contains(event.target)) {
        setIsTripDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const { data: formConfig } = useQuery({
    queryKey: ["booking-form-config"],
    queryFn: async () => {
      var _a2;
      const response = await apiService.getSettings();
      return ((_a2 = response == null ? void 0 : response.data) == null ? void 0 : _a2.booking_form_config) || (response == null ? void 0 : response.booking_form_config) || null;
    }
  });
  const travelerFields = reactExports.useMemo(() => {
    var _a2;
    if (!((_a2 = formConfig == null ? void 0 : formConfig.traveler_form) == null ? void 0 : _a2.fields)) return [];
    return formConfig.traveler_form.fields.filter((field) => field.enabled).sort((a, b) => a.order - b.order);
  }, [formConfig]);
  const emergencyContactFields = reactExports.useMemo(() => {
    var _a2;
    if (!((_a2 = formConfig == null ? void 0 : formConfig.emergency_contact_form) == null ? void 0 : _a2.fields)) return [];
    return formConfig.emergency_contact_form.fields.filter((field) => field.enabled).sort((a, b) => a.order - b.order);
  }, [formConfig]);
  const contactExtraFields = reactExports.useMemo(() => {
    var _a2;
    if (!((_a2 = formConfig == null ? void 0 : formConfig.contact_form) == null ? void 0 : _a2.fields)) return [];
    if (formConfig.contact_form.enabled === false) return [];
    return formConfig.contact_form.fields.filter((field) => field.enabled && !CORE_CONTACT_IDS.includes(field.id)).sort((a, b) => a.order - b.order);
  }, [formConfig]);
  const createEmptyTraveler = () => {
    const empty = {};
    travelerFields.forEach((field) => {
      empty[field.id] = "";
    });
    return empty;
  };
  const action = reactExports.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") || "create";
  }, []);
  const bookingId = reactExports.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);
  const isEditMode = action === "edit" && bookingId !== null;
  const { data: gatewaysData } = useQuery({
    queryKey: ["payment-gateways"],
    queryFn: async () => {
      const result = await apiService.getPaymentGateways();
      if (result == null ? void 0 : result.success) {
        return {
          data: result.data.filter((gw) => gw.enabled).map((gw) => ({
            id: gw.id,
            title: gw.title || gw.name
          }))
        };
      }
      return { data: [] };
    }
  });
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["trips-list-all"],
    queryFn: async () => {
      return await apiService.getTrips({ per_page: 500 });
    },
    // Always fetch trips when user can manage bookings
    enabled: can("yatra_view_bookings") || can("yatra_view_trips"),
    retry: 1
  });
  const { data: bookingData, isLoading: isLoadingBooking } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const result = await apiService.getBooking(bookingId);
      if (!result) {
        throw new Error("Failed to fetch booking");
      }
      const booking = (result == null ? void 0 : result.data) ?? result;
      if (booking && booking.id) {
        const contact = booking.contact || {};
        const firstName = booking.contact_first_name || contact.first_name || "";
        const lastName = booking.contact_last_name || contact.last_name || "";
        const customerName = booking.customer_name || `${firstName} ${lastName}`.trim();
        let travelers = [];
        if (booking.travelers && Array.isArray(booking.travelers)) {
          travelers = booking.travelers.map((t) => {
            const traveler = {};
            const fieldsData = t.fields || t;
            if (fieldsData && typeof fieldsData === "object") {
              Object.entries(fieldsData).forEach(([key, value]) => {
                if (![
                  "id",
                  "booking_id",
                  "traveller_index",
                  "is_lead",
                  "created_at",
                  "updated_at"
                ].includes(key)) {
                  traveler[key] = String(value || "");
                }
              });
            }
            if (t.is_lead !== void 0) {
              traveler["is_lead"] = String(t.is_lead);
            }
            return traveler;
          });
        }
        if (travelers.length === 0) {
          travelers = [{}];
        }
        let emergencyContact = {};
        if (booking.emergency_contact && typeof booking.emergency_contact === "object") {
          Object.entries(booking.emergency_contact).forEach(([key, value]) => {
            emergencyContact[key] = String(value || "");
          });
        } else if (contact.emergency_name || contact.emergency_phone || contact.emergency_relationship) {
          emergencyContact = {
            name: String(contact.emergency_name || ""),
            phone: String(contact.emergency_phone || ""),
            relationship: String(contact.emergency_relationship || "")
          };
        }
        const mappedData = {
          id: booking.id,
          customer_name: customerName,
          customer_email: booking.customer_email || contact.email || booking.contact_email || "",
          customer_phone: booking.customer_phone || contact.phone || booking.contact_phone || "",
          customer_country: booking.contact_country || "",
          trip_id: String(booking.trip_id || ""),
          trip_title: booking.trip_title || "",
          booking_date: normalizeDateInput(
            booking.booking_date ?? booking.created_at ?? (/* @__PURE__ */ new Date()).toISOString()
          ),
          travel_date: normalizeDateInput(booking.travel_date ?? ""),
          travelers: String(booking.travelers || "1"),
          travelers_data: travelers,
          // Add the correctly parsed travelers data
          subtotal: String(
            booking.subtotal || booking.total_amount || ""
          ),
          tax_amount: String(booking.tax_amount || "0"),
          total_amount: String(booking.total_amount || ""),
          currency: booking.currency || "USD",
          payment_status: booking.payment_status || "pending",
          booking_status: booking.booking_status || "pending",
          payment_method: booking.payment_method || "",
          notes: booking.notes || "",
          emergency_contact: emergencyContact,
          contact_data: booking.contact_data || null
        };
        return mappedData;
      }
      return null;
    },
    enabled: isEditMode && can("yatra_view_bookings")
  });
  const [isDataLoaded, setIsDataLoaded] = reactExports.useState(false);
  reactExports.useEffect(() => {
    var _a2;
    if (bookingData && isEditMode) {
      setFormData({
        customer_name: bookingData.customer_name || "",
        customer_email: bookingData.customer_email || "",
        customer_phone: bookingData.customer_phone || "",
        customer_country: bookingData.contact_country || bookingData.customer_country || "",
        trip_id: String(bookingData.trip_id || ""),
        booking_date: bookingData.booking_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        travel_date: bookingData.travel_date || "",
        travelers: String(
          bookingData.travelers_count || ((_a2 = bookingData.travelers_data) == null ? void 0 : _a2.length) || "1"
        ),
        subtotal: String(
          bookingData.subtotal || bookingData.total_amount || ""
        ),
        tax_amount: String(bookingData.tax_amount || "0"),
        total_amount: String(bookingData.total_amount || ""),
        currency: bookingData.currency || "USD",
        payment_status: bookingData.payment_status || "pending",
        booking_status: bookingData.booking_status || "pending",
        payment_method: bookingData.payment_method || "",
        notes: bookingData.special_requests || bookingData.notes || ""
      });
      if (bookingData.travelers_data && Array.isArray(bookingData.travelers_data) && bookingData.travelers_data.length > 0) {
        setTravelersData(bookingData.travelers_data);
        setExpandedTravelers([0]);
      } else {
        setTravelersData([{}]);
        setExpandedTravelers([0]);
      }
      if (bookingData.emergency_contact) {
        setEmergencyContactData(bookingData.emergency_contact);
      }
      const cd = bookingData.contact_data;
      if (cd && typeof cd === "object") {
        const extras = {};
        Object.entries(cd).forEach(([k, v]) => {
          if (!CORE_CONTACT_IDS.includes(k)) {
            extras[k] = v == null ? "" : String(v);
          }
        });
        setContactExtraData(extras);
      }
      setIsDataLoaded(true);
    }
  }, [bookingData, isEditMode]);
  reactExports.useEffect(() => {
    var _a2;
    if (isEditMode) return;
    if (formData.trip_id && formData.travelers) {
      const selectedTrip = (_a2 = tripsData == null ? void 0 : tripsData.data) == null ? void 0 : _a2.find(
        (trip) => String(trip.id) === formData.trip_id
      );
      if (selectedTrip) {
        const subtotal = selectedTrip.price * parseInt(formData.travelers);
        const taxCalculation = taxService.calculateBookingTax(
          subtotal,
          formData.customer_country
        );
        setFormData((prev) => ({
          ...prev,
          subtotal: taxCalculation.subtotal.toString(),
          tax_amount: taxCalculation.tax_amount.toString(),
          total_amount: taxCalculation.total_amount.toString()
        }));
      }
    }
  }, [
    formData.trip_id,
    formData.travelers,
    formData.customer_country,
    tripsData == null ? void 0 : tripsData.data,
    isEditMode
  ]);
  reactExports.useEffect(() => {
    taxService.loadTaxSettings();
  }, []);
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };
  const handleEmergencyContactChange = (field, value) => {
    setEmergencyContactData((prev) => ({ ...prev, [field]: value }));
  };
  const handleContactExtraChange = (field, value) => {
    setContactExtraData((prev) => ({ ...prev, [field]: value }));
  };
  const renderDynamicInput = (field, value, onChange, idPrefix) => {
    var _a2;
    const id = `${idPrefix}-${field.id}`;
    if (field.type === "select") {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { id, value, onChange: (e) => onChange(e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: field.placeholder || `Select ${field.label}` }),
        (_a2 = field.options) == null ? void 0 : _a2.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: opt.value, children: opt.label }, opt.value))
      ] });
    }
    if (field.type === "country") {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { id, value, onChange: (e) => onChange(e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: field.placeholder || "Select Country" }),
        countryList.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c.code, children: c.name }, c.code))
      ] });
    }
    if (field.type === "textarea") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          id,
          value,
          onChange: (e) => onChange(e.target.value),
          placeholder: field.placeholder,
          rows: 2,
          className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400 resize-none"
        }
      );
    }
    if (field.type === "checkbox") {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            className: "rounded border-gray-300",
            checked: value === "1" || value === "true",
            onChange: (e) => onChange(e.target.checked ? "1" : "")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: field.placeholder || field.label })
      ] });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        id,
        type: field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "date" ? "date" : field.type === "number" ? "number" : "text",
        value,
        onChange: (e) => onChange(e.target.value),
        placeholder: field.placeholder
      }
    );
  };
  const handleTravelerChange = (index, field, value) => {
    setTravelersData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  const addTraveler = () => {
    const newTraveler = createEmptyTraveler();
    setTravelersData((prev) => [...prev, newTraveler]);
    setFormData((prev) => ({
      ...prev,
      travelers: String(travelersData.length + 1)
    }));
    setExpandedTravelers((prev) => [...prev, travelersData.length]);
  };
  const removeTraveler = (index) => {
    if (travelersData.length <= 1) return;
    setTravelersData((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      travelers: String(travelersData.length - 1)
    }));
    setExpandedTravelers(
      (prev) => prev.filter((i) => i !== index).map((i) => i > index ? i - 1 : i)
    );
  };
  const toggleTravelerExpanded = (index) => {
    setExpandedTravelers(
      (prev) => prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = __("Customer name is required", "yatra");
    }
    if (!formData.customer_email.trim()) {
      newErrors.customer_email = __("Customer email is required", "yatra");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = __("Invalid email address", "yatra");
    }
    if (!formData.trip_id) {
      newErrors.trip_id = __("Trip is required", "yatra");
    }
    if (!formData.booking_date) {
      newErrors.booking_date = __("Booking date is required", "yatra");
    }
    if (!formData.travel_date) {
      newErrors.travel_date = __("Travel date is required", "yatra");
    }
    if (!formData.travelers || parseInt(formData.travelers) < 1) {
      newErrors.travelers = __(
        "Number of travelers must be at least 1",
        "yatra"
      );
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      newErrors.total_amount = __(
        "Total amount must be greater than 0",
        "yatra"
      );
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const nameParts = data.customer_name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const payload = {
        contact_first_name: firstName,
        contact_last_name: lastName,
        contact_email: data.customer_email.trim(),
        contact_phone: data.customer_phone.trim(),
        // contact_country column (previously not submitted, so edits were lost).
        contact_country: data.customer_country || "",
        trip_id: parseInt(data.trip_id),
        travel_date: data.travel_date,
        travelers_count: travelersData.length,
        total_amount: parseFloat(data.total_amount),
        payment_status: data.payment_status,
        status: data.booking_status,
        payment_gateway: data.payment_method.trim(),
        special_requests: data.notes.trim(),
        // Include travelers data - use 'travelers' key as expected by BookingService.updateBooking
        travelers: travelersData,
        // Include emergency contact data
        emergency_contact: emergencyContactData,
        // Full contact_data JSON: core fields + every extra/custom contact field,
        // so admin edits round-trip and feed the {{contact_*}} email variables.
        contact_data: {
          first_name: firstName,
          last_name: lastName,
          email: data.customer_email.trim(),
          phone: data.customer_phone.trim(),
          country: data.customer_country || "",
          ...contactExtraData
        }
      };
      return isEditMode ? await apiService.updateBooking(bookingId, payload) : await apiService.createBooking(payload);
    },
    onSuccess: () => {
      var _a2;
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=bookings`;
    },
    onError: (error) => {
      const errorMessage = (error == null ? void 0 : error.message) || __("An error occurred while saving the booking", "yatra");
      setErrors({ submit: errorMessage });
      setIsSubmitting(false);
    }
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    setErrors({});
    saveMutation.mutate(formData);
  };
  const handleCancel = () => {
    var _a2;
    window.location.href = `${((_a2 = window.yatraAdmin) == null ? void 0 : _a2.siteUrl) || ""}/wp-admin/admin.php?page=yatra&subpage=bookings`;
  };
  if (isEditMode && isLoadingBooking) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-48" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-64" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-24" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-40" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-28" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-32" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-16" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-20" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-16" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 w-full" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-32" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-28" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-28" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 flex-1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-20" })
          ] }) }) })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: isEditMode ? __("Edit Booking", "yatra") : __("Create Booking", "yatra"),
        description: isEditMode ? __("Update booking information", "yatra") : __("Create a new customer booking", "yatra"),
        actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            onClick: handleCancel,
            className: "flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" }),
              __("Back", "yatra")
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionalRender, { capability: "yatra_edit_bookings", children: /* @__PURE__ */ jsxRuntimeExports.jsx("form", { onSubmit: handleSubmit, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Customer Information", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    htmlFor: "customer_name",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: [
                      __("Customer Name", "yatra"),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "customer_name",
                    type: "text",
                    value: formData.customer_name,
                    onChange: (e) => handleFieldChange("customer_name", e.target.value),
                    placeholder: __("Enter customer name", "yatra"),
                    className: errors.customer_name ? "border-red-500" : "",
                    required: true
                  }
                ),
                errors.customer_name && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.customer_name })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    htmlFor: "customer_email",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: [
                      __("Customer Email", "yatra"),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "customer_email",
                    type: "email",
                    value: formData.customer_email,
                    onChange: (e) => handleFieldChange("customer_email", e.target.value),
                    placeholder: __("customer@example.com", "yatra"),
                    className: errors.customer_email ? "border-red-500" : "",
                    required: true
                  }
                ),
                errors.customer_email && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.customer_email })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "customer_phone",
                  className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                  children: __("Customer Phone", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "customer_phone",
                  type: "tel",
                  value: formData.customer_phone,
                  onChange: (e) => handleFieldChange("customer_phone", e.target.value),
                  placeholder: __("+1234567890", "yatra")
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "customer_country",
                  className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                  children: __("Country", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  id: "customer_country",
                  value: formData.customer_country,
                  onChange: (e) => handleFieldChange("customer_country", e.target.value),
                  className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("Select country", "yatra") }),
                    countryList.map((country) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: country.code, children: country.name }, country.code))
                  ]
                }
              )
            ] }),
            contactExtraFields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: field.width === "full" ? "md:col-span-2" : "",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "label",
                    {
                      htmlFor: `contact-${field.id}`,
                      className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                      children: [
                        field.label,
                        field.required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500 ml-1", children: "*" })
                      ]
                    }
                  ),
                  renderDynamicInput(
                    field,
                    contactExtraData[field.id] || "",
                    (v) => handleContactExtraChange(field.id, v),
                    "contact"
                  )
                ]
              },
              field.id
            ))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Booking Details", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: tripDropdownRef, className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  htmlFor: "trip_search",
                  className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                  children: [
                    __("Trip", "yatra"),
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `flex items-center border rounded-md bg-white dark:bg-gray-800 cursor-pointer ${errors.trip_id ? "border-red-500" : "border-gray-300 dark:border-gray-600"} ${isTripDropdownOpen ? "ring-2 ring-blue-500" : ""}`,
                    onClick: () => setIsTripDropdownOpen(!isTripDropdownOpen),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 px-3 py-2 text-sm", children: formData.trip_id ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: ((_c = (_b = tripsData == null ? void 0 : tripsData.data) == null ? void 0 : _b.find(
                        (t) => String(t.id) === formData.trip_id
                      )) == null ? void 0 : _c.title) || (bookingData == null ? void 0 : bookingData.trip_title) || `Trip ID: ${formData.trip_id}` }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500", children: isLoadingTrips ? __("Loading trips...", "yatra") : __("Select a trip", "yatra") }) }),
                      formData.trip_id && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          className: "p-2 text-gray-400 hover:text-gray-600",
                          onClick: (e) => {
                            e.stopPropagation();
                            handleFieldChange("trip_id", "");
                            setTripSearchQuery("");
                          },
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 text-gray-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        ChevronDown,
                        {
                          className: `w-4 h-4 transition-transform ${isTripDropdownOpen ? "rotate-180" : ""}`
                        }
                      ) })
                    ]
                  }
                ),
                isTripDropdownOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "text",
                        className: "w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                        placeholder: __("Search trips...", "yatra"),
                        value: tripSearchQuery,
                        onChange: (e) => setTripSearchQuery(e.target.value),
                        onClick: (e) => e.stopPropagation(),
                        autoFocus: true
                      }
                    )
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-48 overflow-y-auto", children: (() => {
                    let allTrips = [...(tripsData == null ? void 0 : tripsData.data) || []];
                    if (isEditMode && (bookingData == null ? void 0 : bookingData.trip_id) && (bookingData == null ? void 0 : bookingData.trip_title)) {
                      const bookedTripExists = allTrips.some(
                        (t) => String(t.id) === String(bookingData.trip_id)
                      );
                      if (!bookedTripExists) {
                        allTrips.unshift({
                          id: bookingData.trip_id,
                          title: bookingData.trip_title,
                          price: bookingData.total_amount || 0,
                          currency: globalCurrency,
                          status: "publish"
                        });
                      }
                    }
                    const filteredTrips = allTrips.filter(
                      (trip) => trip.title.toLowerCase().includes(tripSearchQuery.toLowerCase()) || String(trip.id).includes(tripSearchQuery)
                    );
                    if (filteredTrips.length === 0) {
                      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-4 text-sm text-gray-500 text-center", children: __("No trips found", "yatra") });
                    }
                    return filteredTrips.map((trip) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: `px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${formData.trip_id === String(trip.id) ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white"}`,
                        onClick: () => {
                          handleFieldChange(
                            "trip_id",
                            String(trip.id)
                          );
                          setIsTripDropdownOpen(false);
                          setTripSearchQuery("");
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: trip.title }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
                            "ID: ",
                            trip.id
                          ] })
                        ]
                      },
                      trip.id
                    ));
                  })() })
                ] })
              ] }),
              errors.trip_id && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.trip_id })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    htmlFor: "booking_date",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: [
                      __("Booking Date", "yatra"),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DatePicker,
                  {
                    value: formData.booking_date,
                    onChange: (value) => handleFieldChange("booking_date", value),
                    placeholder: __("Select booking date", "yatra"),
                    error: !!errors.booking_date
                  }
                ),
                errors.booking_date && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.booking_date })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    htmlFor: "travel_date",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: [
                      __("Travel Date", "yatra"),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DatePicker,
                  {
                    value: formData.travel_date,
                    onChange: (value) => handleFieldChange("travel_date", value),
                    placeholder: __("Select travel date", "yatra"),
                    error: !!errors.travel_date
                  }
                ),
                errors.travel_date && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.travel_date })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    htmlFor: "travelers",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: [
                      __("Number of Travelers", "yatra"),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "travelers",
                    type: "number",
                    min: "1",
                    value: formData.travelers,
                    onChange: (e) => handleFieldChange("travelers", e.target.value),
                    className: errors.travelers ? "border-red-500" : "",
                    required: true
                  }
                ),
                errors.travelers && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.travelers })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-2 text-sm", children: __("Pricing Breakdown", "yatra") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 text-sm", children: formData.subtotal ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: __("Subtotal", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-gray-900 dark:text-white", children: [
                      currencySymbol,
                      parseFloat(formData.subtotal).toFixed(2)
                    ] })
                  ] }),
                  (bookingData == null ? void 0 : bookingData.itinerary_costs_total) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: __("Itinerary Costs", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-gray-900 dark:text-white", children: [
                      getCurrencySymbol(
                        formData.currency || globalCurrency
                      ),
                      bookingData.itinerary_costs_total.toFixed(2)
                    ] })
                  ] }),
                  parseFloat(formData.tax_amount) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: __("Tax", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-gray-900 dark:text-white", children: [
                      currencySymbol,
                      parseFloat(formData.tax_amount).toFixed(2)
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-2 flex justify-between font-semibold", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 dark:text-white", children: __("Total", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-900 dark:text-white", children: [
                      getCurrencySymbol(
                        formData.currency || globalCurrency
                      ),
                      formData.total_amount
                    ] })
                  ] })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-gray-500 dark:text-gray-400 py-2", children: __(
                  "Select a trip and number of travelers to see pricing",
                  "yatra"
                ) }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    htmlFor: "total_amount",
                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                    children: [
                      __("Total Amount", "yatra"),
                      " (",
                      formData.currency || globalCurrency,
                      ")",
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500", children: getCurrencySymbol(
                    formData.currency || globalCurrency
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "total_amount",
                      type: "number",
                      step: "0.01",
                      min: "0",
                      value: formData.total_amount,
                      onChange: (e) => handleFieldChange("total_amount", e.target.value),
                      placeholder: "0.00",
                      className: `pl-7 ${errors.total_amount ? "border-red-500" : ""}`,
                      required: true
                    }
                  )
                ] }),
                errors.total_amount && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.total_amount })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "notes",
                  className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                  children: __("Notes", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  id: "notes",
                  value: formData.notes,
                  onChange: (e) => handleFieldChange("notes", e.target.value),
                  placeholder: __(
                    "Additional notes or special requests",
                    "yatra"
                  ),
                  rows: 3,
                  className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                }
              )
            ] })
          ] })
        ] }),
        ((_d = formConfig == null ? void 0 : formConfig.emergency_contact_form) == null ? void 0 : _d.enabled) !== false && emergencyContactFields.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
              ((_e = formConfig == null ? void 0 : formConfig.emergency_contact_form) == null ? void 0 : _e.title) || __("Emergency Contact", "yatra")
            ] }),
            ((_f = formConfig == null ? void 0 : formConfig.emergency_contact_form) == null ? void 0 : _f.description) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: formConfig.emergency_contact_form.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: emergencyContactFields.map((field) => {
            var _a2;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: field.width === "full" ? "md:col-span-2" : "",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "label",
                    {
                      htmlFor: `emergency-${field.id}`,
                      className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: [
                        field.label,
                        field.required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500 ml-1", children: "*" })
                      ]
                    }
                  ),
                  field.type === "select" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      id: `emergency-${field.id}`,
                      value: emergencyContactData[field.id] || "",
                      onChange: (e) => handleEmergencyContactChange(
                        field.id,
                        e.target.value
                      ),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: field.placeholder || `Select ${field.label}` }),
                        (_a2 = field.options) == null ? void 0 : _a2.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: opt.value, children: opt.label }, opt.value))
                      ]
                    }
                  ) : field.type === "country" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      id: `emergency-${field.id}`,
                      value: emergencyContactData[field.id] || "",
                      onChange: (e) => handleEmergencyContactChange(
                        field.id,
                        e.target.value
                      ),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: field.placeholder || "Select Country" }),
                        countryList.map((country) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "option",
                          {
                            value: country.code,
                            children: country.name
                          },
                          country.code
                        ))
                      ]
                    }
                  ) : field.type === "textarea" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "textarea",
                    {
                      id: `emergency-${field.id}`,
                      value: emergencyContactData[field.id] || "",
                      onChange: (e) => handleEmergencyContactChange(
                        field.id,
                        e.target.value
                      ),
                      placeholder: field.placeholder,
                      rows: 2,
                      className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400 resize-none"
                    }
                  ) : field.type === "checkbox" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "checkbox",
                        className: "rounded border-gray-300",
                        checked: emergencyContactData[field.id] === "1" || emergencyContactData[field.id] === "true",
                        onChange: (e) => handleEmergencyContactChange(
                          field.id,
                          e.target.checked ? "1" : ""
                        )
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: field.placeholder || field.label })
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: `emergency-${field.id}`,
                      type: field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "date" ? "date" : field.type === "number" ? "number" : "text",
                      value: emergencyContactData[field.id] || "",
                      onChange: (e) => handleEmergencyContactChange(
                        field.id,
                        e.target.value
                      ),
                      placeholder: field.placeholder
                    }
                  )
                ]
              },
              field.id
            );
          }) }) })
        ] }),
        ((_g = formConfig == null ? void 0 : formConfig.traveler_form) == null ? void 0 : _g.enabled) !== false && travelerFields.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4" }),
                ((_h = formConfig == null ? void 0 : formConfig.traveler_form) == null ? void 0 : _h.title) || __("Travelers Information", "yatra"),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-normal text-gray-500 dark:text-gray-400", children: [
                  "(",
                  travelersData.length,
                  " ",
                  travelersData.length === 1 ? __("traveler", "yatra") : __("travelers", "yatra"),
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                travelersData.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "sm",
                    onClick: () => setExpandedTravelers(
                      expandedTravelers.length === travelersData.length ? [] : travelersData.map((_, i) => i)
                    ),
                    className: "text-gray-500 text-xs",
                    children: expandedTravelers.length === travelersData.length ? __("Collapse All", "yatra") : __("Expand All", "yatra")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: addTraveler,
                    className: "flex items-center gap-1",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3" }),
                      __("Add Traveler", "yatra")
                    ]
                  }
                )
              ] })
            ] }),
            ((_i = formConfig == null ? void 0 : formConfig.traveler_form) == null ? void 0 : _i.description) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: formConfig.traveler_form.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: travelersData.map((traveler, travelerIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `border rounded-lg ${travelerIndex === 0 ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10" : "border-gray-200 dark:border-gray-700"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-t-lg",
                    onClick: () => toggleTravelerExpanded(travelerIndex),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm text-gray-900 dark:text-white whitespace-nowrap", children: travelerIndex === 0 ? __("Lead Traveler", "yatra") : `${__("Traveler", "yatra")} ${travelerIndex + 1}` }),
                        traveler.first_name || traveler.last_name ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-gray-500 dark:text-gray-400 truncate", children: [
                          "-",
                          " ",
                          [traveler.first_name, traveler.last_name].filter(Boolean).join(" ")
                        ] }) : null,
                        travelerIndex === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded whitespace-nowrap", children: __("Primary", "yatra") })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 ml-2", children: [
                        travelersData.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Button,
                          {
                            type: "button",
                            variant: "ghost",
                            size: "sm",
                            onClick: (e) => {
                              e.stopPropagation();
                              removeTraveler(travelerIndex);
                            },
                            className: "text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2 flex items-center gap-1",
                            title: __("Remove Traveler", "yatra"),
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs hidden sm:inline", children: __("Remove", "yatra") })
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 flex items-center justify-center", children: expandedTravelers.includes(travelerIndex) ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-4 h-4 text-gray-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4 text-gray-500" }) })
                      ] })
                    ]
                  }
                ),
                expandedTravelers.includes(travelerIndex) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 pt-0 border-t border-gray-100 dark:border-gray-700/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 mt-3", children: travelerFields.map((field) => {
                  var _a2;
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: field.width === "full" ? "md:col-span-2" : "",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "label",
                          {
                            htmlFor: `traveler-${travelerIndex}-${field.id}`,
                            className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                            children: [
                              field.label,
                              field.required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500 ml-1", children: "*" })
                            ]
                          }
                        ),
                        field.type === "select" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Select,
                          {
                            id: `traveler-${travelerIndex}-${field.id}`,
                            value: traveler[field.id] || "",
                            onChange: (e) => handleTravelerChange(
                              travelerIndex,
                              field.id,
                              e.target.value
                            ),
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: field.placeholder || `Select ${field.label}` }),
                              (_a2 = field.options) == null ? void 0 : _a2.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "option",
                                {
                                  value: opt.value,
                                  children: opt.label
                                },
                                opt.value
                              ))
                            ]
                          }
                        ) : field.type === "country" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Select,
                          {
                            id: `traveler-${travelerIndex}-${field.id}`,
                            value: traveler[field.id] || "",
                            onChange: (e) => handleTravelerChange(
                              travelerIndex,
                              field.id,
                              e.target.value
                            ),
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: field.placeholder || "Select Country" }),
                              countryList.map((country) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "option",
                                {
                                  value: country.code,
                                  children: country.name
                                },
                                country.code
                              ))
                            ]
                          }
                        ) : field.type === "textarea" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "textarea",
                          {
                            id: `traveler-${travelerIndex}-${field.id}`,
                            value: traveler[field.id] || "",
                            onChange: (e) => handleTravelerChange(
                              travelerIndex,
                              field.id,
                              e.target.value
                            ),
                            placeholder: field.placeholder,
                            rows: 2,
                            className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400 resize-none"
                          }
                        ) : field.type === "checkbox" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "checkbox",
                              className: "rounded border-gray-300",
                              checked: traveler[field.id] === "1" || traveler[field.id] === "true",
                              onChange: (e) => handleTravelerChange(
                                travelerIndex,
                                field.id,
                                e.target.checked ? "1" : ""
                              )
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: field.placeholder || field.label })
                        ] }) : field.type === "date" || field.id.toLowerCase().includes("date") || field.id.toLowerCase().includes("expiry") ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                          DatePicker,
                          {
                            value: traveler[field.id] || "",
                            onChange: (value) => handleTravelerChange(
                              travelerIndex,
                              field.id,
                              value
                            ),
                            placeholder: field.placeholder || __("Select date", "yatra")
                          }
                        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            id: `traveler-${travelerIndex}-${field.id}`,
                            type: field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "number" ? "number" : "text",
                            value: traveler[field.id] || "",
                            onChange: (e) => handleTravelerChange(
                              travelerIndex,
                              field.id,
                              e.target.value
                            ),
                            placeholder: field.placeholder
                          }
                        )
                      ]
                    },
                    field.id
                  );
                }) }) })
              ]
            },
            travelerIndex
          )) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: __("Status & Payment", "yatra") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "booking_status",
                  className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                  children: __("Booking Status", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  id: "booking_status",
                  value: formData.booking_status,
                  onChange: (e) => handleFieldChange("booking_status", e.target.value),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pending", children: __("Pending", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "confirmed", children: __("Confirmed", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "cancelled", children: __("Cancelled", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "completed", children: __("Completed", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "refunded", children: __("Refunded", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "failed", children: __("Failed", "yatra") })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "payment_status",
                  className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                  children: __("Payment Status", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  id: "payment_status",
                  value: formData.payment_status,
                  onChange: (e) => handleFieldChange("payment_status", e.target.value),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pending", children: __("Pending", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "partial", children: __("Partial", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "paid", children: __("Paid", "yatra") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "refunded", children: __("Refunded", "yatra") })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "payment_method",
                  className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                  children: __("Payment Method", "yatra")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  id: "payment_method",
                  value: formData.payment_method,
                  onChange: (e) => handleFieldChange("payment_method", e.target.value),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: __("Select payment method", "yatra") }),
                    (_j = gatewaysData == null ? void 0 : gatewaysData.data) == null ? void 0 : _j.map((gw) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: gw.id, children: gw.title }, gw.id)),
                    (!(gatewaysData == null ? void 0 : gatewaysData.data) || gatewaysData.data.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pay_later", children: __("Pay Later", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "bank_transfer", children: __("Bank Transfer", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "stripe", children: __("Stripe", "yatra") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "paypal", children: __("PayPal", "yatra") })
                    ] })
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          errors.submit && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md", children: errors.submit }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: isSubmitting,
                className: "flex-1 flex items-center justify-center gap-2",
                children: isSubmitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
                  __("Saving...", "yatra")
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4" }),
                  isEditMode ? __("Update Booking", "yatra") : __("Create Booking", "yatra")
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: handleCancel,
                disabled: isSubmitting,
                children: __("Cancel", "yatra")
              }
            )
          ] })
        ] }) }) })
      ] })
    ] }) }) })
  ] });
};
export {
  BookingForm as default
};
//# sourceMappingURL=BookingForm-Bwi6DlLE.js.map
