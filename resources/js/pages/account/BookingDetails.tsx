import React from "react";
import {
  Calendar as CalendarIcon,
  Users,
  DollarSign as DollarSignIcon,
  CreditCard,
  Mail,
  Phone as PhoneIcon,
  FileText as FileTextIcon,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Download,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { formatDate, getBadge, formatPriceForBooking } from "./utils";

// Country code to name mapping
const COUNTRY_NAMES: Record<string, string> = {
  AF: "Afghanistan",
  AL: "Albania",
  DZ: "Algeria",
  AD: "Andorra",
  AO: "Angola",
  AG: "Antigua and Barbuda",
  AR: "Argentina",
  AM: "Armenia",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BS: "Bahamas",
  BH: "Bahrain",
  BD: "Bangladesh",
  BB: "Barbados",
  BY: "Belarus",
  BE: "Belgium",
  BZ: "Belize",
  BJ: "Benin",
  BT: "Bhutan",
  BO: "Bolivia",
  BA: "Bosnia and Herzegovina",
  BW: "Botswana",
  BR: "Brazil",
  BN: "Brunei",
  BG: "Bulgaria",
  BF: "Burkina Faso",
  BI: "Burundi",
  KH: "Cambodia",
  CM: "Cameroon",
  CA: "Canada",
  CV: "Cape Verde",
  CF: "Central African Republic",
  TD: "Chad",
  CL: "Chile",
  CN: "China",
  CO: "Colombia",
  KM: "Comoros",
  CG: "Congo",
  CD: "DR Congo",
  CR: "Costa Rica",
  CI: "Ivory Coast",
  HR: "Croatia",
  CU: "Cuba",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DK: "Denmark",
  DJ: "Djibouti",
  DM: "Dominica",
  DO: "Dominican Republic",
  EC: "Ecuador",
  EG: "Egypt",
  SV: "El Salvador",
  GQ: "Equatorial Guinea",
  ER: "Eritrea",
  EE: "Estonia",
  SZ: "Eswatini",
  ET: "Ethiopia",
  FJ: "Fiji",
  FI: "Finland",
  FR: "France",
  GA: "Gabon",
  GM: "Gambia",
  GE: "Georgia",
  DE: "Germany",
  GH: "Ghana",
  GR: "Greece",
  GD: "Grenada",
  GT: "Guatemala",
  GN: "Guinea",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HT: "Haiti",
  HN: "Honduras",
  HU: "Hungary",
  IS: "Iceland",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran",
  IQ: "Iraq",
  IE: "Ireland",
  IL: "Israel",
  IT: "Italy",
  JM: "Jamaica",
  JP: "Japan",
  JO: "Jordan",
  KZ: "Kazakhstan",
  KE: "Kenya",
  KI: "Kiribati",
  KP: "North Korea",
  KR: "South Korea",
  KW: "Kuwait",
  KG: "Kyrgyzstan",
  LA: "Laos",
  LV: "Latvia",
  LB: "Lebanon",
  LS: "Lesotho",
  LR: "Liberia",
  LY: "Libya",
  LI: "Liechtenstein",
  LT: "Lithuania",
  LU: "Luxembourg",
  MG: "Madagascar",
  MW: "Malawi",
  MY: "Malaysia",
  MV: "Maldives",
  ML: "Mali",
  MT: "Malta",
  MH: "Marshall Islands",
  MR: "Mauritania",
  MU: "Mauritius",
  MX: "Mexico",
  FM: "Micronesia",
  MD: "Moldova",
  MC: "Monaco",
  MN: "Mongolia",
  ME: "Montenegro",
  MA: "Morocco",
  MZ: "Mozambique",
  MM: "Myanmar",
  NA: "Namibia",
  NR: "Nauru",
  NP: "Nepal",
  NL: "Netherlands",
  NZ: "New Zealand",
  NI: "Nicaragua",
  NE: "Niger",
  NG: "Nigeria",
  MK: "North Macedonia",
  NO: "Norway",
  OM: "Oman",
  PK: "Pakistan",
  PW: "Palau",
  PS: "Palestine",
  PA: "Panama",
  PG: "Papua New Guinea",
  PY: "Paraguay",
  PE: "Peru",
  PH: "Philippines",
  PL: "Poland",
  PT: "Portugal",
  QA: "Qatar",
  RO: "Romania",
  RU: "Russia",
  RW: "Rwanda",
  KN: "Saint Kitts and Nevis",
  LC: "Saint Lucia",
  VC: "Saint Vincent and the Grenadines",
  WS: "Samoa",
  SM: "San Marino",
  ST: "Sao Tome and Principe",
  SA: "Saudi Arabia",
  SN: "Senegal",
  RS: "Serbia",
  SC: "Seychelles",
  SL: "Sierra Leone",
  SG: "Singapore",
  SK: "Slovakia",
  SI: "Slovenia",
  SB: "Solomon Islands",
  SO: "Somalia",
  ZA: "South Africa",
  SS: "South Sudan",
  ES: "Spain",
  LK: "Sri Lanka",
  SD: "Sudan",
  SR: "Suriname",
  SE: "Sweden",
  CH: "Switzerland",
  SY: "Syria",
  TW: "Taiwan",
  TJ: "Tajikistan",
  TZ: "Tanzania",
  TH: "Thailand",
  TL: "Timor-Leste",
  TG: "Togo",
  TO: "Tonga",
  TT: "Trinidad and Tobago",
  TN: "Tunisia",
  TR: "Turkey",
  TM: "Turkmenistan",
  TV: "Tuvalu",
  UG: "Uganda",
  UA: "Ukraine",
  AE: "United Arab Emirates",
  GB: "United Kingdom",
  US: "United States",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VU: "Vanuatu",
  VA: "Vatican City",
  VE: "Venezuela",
  VN: "Vietnam",
  YE: "Yemen",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};

const getCountryName = (code: string): string => {
  if (!code) return "";
  const upperCode = code.toUpperCase();
  return COUNTRY_NAMES[upperCode] || code;
};

interface BookingDetailsData {
  id: number;
  booking_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_country?: string;
  trip_id: number;
  trip_title: string;
  trip_url?: string;
  trip_image?: string;
  trip_price: number;
  booking_date: string;
  travel_date: string;
  travelers: number;
  travelers_data?: any[];
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  payment_status: string;
  booking_status: string;
  payment_method?: string;
  payment_date?: string;
  notes?: string;
  emergency_contact?: any;
  contact_data?: any;
  payments?: any[];
  downloads?: Array<{
    id: string;
    title: string;
    url: string;
    visibility?: string;
    access_label?: string;
    locked?: boolean;
    locked_reason?: string;
  }>;
  created_at: string;
  updated_at?: string;
}

interface BookingDetailsProps {
  booking: BookingDetailsData | null;
  isLoading: boolean;
  onBack: () => void;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({
  booking,
  isLoading,
  onBack,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {__("Booking Details", "yatra")}
            </h2>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {__("Booking Details", "yatra")}
            </h2>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            {__("Back to Bookings", "yatra")}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6 text-center text-red-500">
          {__("Booking not found or error loading booking", "yatra")}
        </div>
      </div>
    );
  }

  const normalizeRecord = (value: any): Record<string, any> | null => {
    if (!value) return null;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
          return parsed as Record<string, any>;
      } catch {
        return null;
      }
      return null;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, any>;
    }
    return null;
  };

  const emergencyContact = normalizeRecord((booking as any).emergency_contact);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {__("Booking Details", "yatra")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__("Complete booking information", "yatra")}
          </p>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          {__("Back to Bookings", "yatra")}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Overview */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Booking Overview", "yatra")}
              </h3>
              <div className="flex items-center gap-2">
                <span className={getBadge(booking.booking_status)}>
                  {__(
                    booking.booking_status || "pending",
                    booking.booking_status || "pending",
                  )}
                </span>
                <span className={getBadge(booking.payment_status)}>
                  {__(
                    booking.payment_status || "pending",
                    booking.payment_status || "pending",
                  )}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__("Booking Number", "yatra")}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {booking.booking_number || `#${booking.id}`}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__("Trip", "yatra")}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {booking.trip_title}
                </div>
                {booking.trip_url ? (
                  <a
                    href={booking.trip_url}
                    className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {__("View Trip", "yatra")}
                  </a>
                ) : null}
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {__("Booking Date", "yatra")}
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(booking.booking_date || booking.created_at)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {__("Travel Date", "yatra")}
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(booking.travel_date)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {__("Number of Travelers", "yatra")}
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {booking.travelers}{" "}
                  {booking.travelers === 1
                    ? __("Traveler", "yatra")
                    : __("Travelers", "yatra")}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <DollarSignIcon className="w-3 h-3" />
                  {__("Total Amount", "yatra")}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatPriceForBooking(
                    booking.total_amount,
                    booking.currency,
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {__("Customer Information", "yatra")}
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {booking.customer_name}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {booking.customer_email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      {booking.customer_email}
                    </div>
                  )}
                  {booking.customer_phone && (
                    <div className="flex items-center gap-1.5">
                      <PhoneIcon className="w-4 h-4" />
                      {booking.customer_phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Travelers Information */}
          {booking.travelers_data && booking.travelers_data.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {__("Travelers Information", "yatra")}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({booking.travelers_data.length}{" "}
                  {booking.travelers_data.length === 1
                    ? __("traveler", "yatra")
                    : __("travelers", "yatra")}
                  )
                </span>
              </h3>
              <div className="space-y-4">
                {booking.travelers_data.map((traveler: any, index: number) => {
                  // Extract fields from traveler - handle both flat structure and nested fields property
                  const travelerFieldsData = traveler.fields || traveler;
                  const systemFields = [
                    "id",
                    "booking_id",
                    "traveller_index",
                    "is_lead",
                    "created_at",
                    "updated_at",
                    "fields",
                  ];

                  // Get all non-empty fields from the traveler data, excluding system fields
                  const travelerEntries = Object.entries(
                    travelerFieldsData,
                  ).filter(([key, value]) => {
                    // Exclude system fields
                    if (systemFields.includes(key)) return false;
                    // Exclude empty values
                    if (
                      !value ||
                      (typeof value === "string" && value.trim() === "")
                    )
                      return false;
                    // Exclude objects (they should be in fields)
                    if (typeof value === "object" && !Array.isArray(value))
                      return false;
                    return true;
                  });

                  // Get name from fields or direct properties
                  const firstName =
                    travelerFieldsData.first_name || traveler.first_name || "";
                  const lastName =
                    travelerFieldsData.last_name || traveler.last_name || "";

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${index === 0 ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {index === 0
                            ? __("Lead Traveler", "yatra")
                            : `${__("Traveler", "yatra")} ${index + 1}`}
                          {(firstName || lastName) && (
                            <span className="font-normal text-gray-500 dark:text-gray-400 ml-2">
                              -{" "}
                              {[firstName, lastName].filter(Boolean).join(" ")}
                            </span>
                          )}
                        </h4>
                        {index === 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">
                            {__("Primary Contact", "yatra")}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {travelerEntries.map(([fieldId, fieldValue]) => {
                          if (
                            fieldId === "first_name" ||
                            fieldId === "last_name"
                          )
                            return null;
                          const label = fieldId
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase());
                          let displayValue = String(fieldValue);
                          if (
                            fieldId.includes("date") ||
                            fieldId.includes("expiry")
                          ) {
                            try {
                              displayValue = formatDate(fieldValue as string);
                            } catch {
                              displayValue = String(fieldValue);
                            }
                          }

                          // Format country/nationality fields - convert code to full name
                          if (
                            (fieldId === "nationality" ||
                              fieldId === "country") &&
                            fieldValue &&
                            typeof fieldValue === "string" &&
                            fieldValue.length === 2
                          ) {
                            displayValue = getCountryName(fieldValue);
                          }
                          return (
                            <div key={fieldId}>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                {label}
                              </div>
                              <div
                                className={`text-sm text-gray-900 dark:text-white ${fieldId === "passport" ? "font-mono" : ""}`}
                              >
                                {displayValue}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {emergencyContact &&
            Object.values(emergencyContact).some(
              (v: any) => v && String(v).trim() !== "",
            ) && (
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {__("Emergency Contact", "yatra")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(emergencyContact)
                    .filter(
                      ([_, value]) => value && String(value).trim() !== "",
                    )
                    .map(([fieldId, fieldValue]) => {
                      const label = fieldId
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase());
                      return (
                        <div key={fieldId}>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            {label}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {String(fieldValue)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          {/* Special Requests */}
          {booking.notes && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileTextIcon className="w-5 h-5" />
                {__("Special Requests", "yatra")}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Downloads */}
          {Array.isArray((booking as any).downloads) &&
            (booking as any).downloads.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  {__("Downloads", "yatra")}
                </h3>
                <div className="space-y-3">
                  {(booking as any).downloads.map((d: any) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {d.title}
                        </div>
                        {d.access_label ? (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {d.access_label}
                          </div>
                        ) : null}
                        {d.locked && d.locked_reason ? (
                          <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            {d.locked_reason}
                          </div>
                        ) : null}
                      </div>
                      {d.locked || !d.url ? (
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium cursor-not-allowed">
                          <Download className="w-4 h-4" />
                          {__("Not Available", "yatra")}
                        </div>
                      ) : (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          {__("Download", "yatra")}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Information */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {__("Payment Information", "yatra")}
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__("Payment Status", "yatra")}
                </div>
                <div className="mt-1">
                  <span className={getBadge(booking.payment_status)}>
                    {__(
                      booking.payment_status || "pending",
                      booking.payment_status || "pending",
                    )}
                  </span>
                </div>
              </div>
              {booking.payment_method && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    {__("Payment Method", "yatra")}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {booking.payment_method}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__("Total Amount", "yatra")}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatPriceForBooking(
                    booking.total_amount,
                    booking.currency,
                  )}
                </div>
              </div>
              {booking.amount_paid > 0 && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__("Amount Paid", "yatra")}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatPriceForBooking(
                      booking.amount_paid,
                      booking.currency,
                    )}
                  </div>
                </div>
              )}
              {booking.amount_due > 0 && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__("Amount Due", "yatra")}
                  </div>
                  <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {formatPriceForBooking(
                      booking.amount_due,
                      booking.currency,
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {__("Timeline", "yatra")}
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__("Created", "yatra")}
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(booking.created_at || booking.booking_date)}
                </div>
              </div>
              {booking.updated_at &&
                booking.updated_at !== booking.created_at && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__("Last Updated", "yatra")}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(booking.updated_at)}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
