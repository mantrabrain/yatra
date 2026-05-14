/**
 * Trip Form Page - Wizard Style
 * Multi-step form for creating/editing trips with sidebar navigation
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Utility function to strip HTML and sanitize text for SEO preview
const sanitizeTextForSEO = (text: string, maxLength: number = 160): string => {
  if (!text) return "";

  // Remove HTML tags
  const plainText = text.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  const decodedText = plainText
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Remove extra whitespace and trim
  const cleanText = decodedText.replace(/\s+/g, " ").trim();

  // Truncate if needed
  if (cleanText.length > maxLength) {
    return cleanText.substring(0, maxLength) + "...";
  }

  return cleanText;
};
import {
  Save,
  Send,
  Loader2,
  Sparkles,
  Calendar,
  Clock,
  Image,
  HelpCircle,
  Search,
  Settings,
  CheckCircle2,
  CheckSquare,
  FileText,
  DollarSign,
  AlertCircle,
  Plus,
  Upload,
  MapPin,
  Tag,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  BookOpen,
  Download,
  Eye,
  X,
  Trash2,
  Users,
  Box,
  BarChart3,
  Database,
  History,
  Home,
  Car,
  Lightbulb,
} from "lucide-react";
import { RichTextEditor } from "../components/ui/rich-text-editor";
import { IconPicker, IconPickerValue } from "../components/ui/icon-picker";
import { AiFieldAffordance } from "../components/ai/AiFieldAffordance";
import { AutoFillTripModal } from "../components/ai/AutoFillTripModal";
import { BuildItineraryModal } from "../components/ai/BuildItineraryModal";
import { isAiEligible, isAiModuleEnabled } from "../lib/ai-availability";
import { __, sprintf } from "../lib/i18n";
import { MEAL_PLAN_SELECT_OPTIONS } from "../lib/meal-plan-labels";
import { usePermissions } from "../hooks/usePermissions";
import { fetchSettings } from "../api/settings-api";
import { apiClient } from "../lib/api-client";
import { wpService } from "../lib/api-client";
import { Button } from "../components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { prepareWordPressMediaFrameOpen } from "../lib/wp-media-open";
import { Modal } from "../components/ui/modal";
import { Select } from "../components/ui/select";
import { Alert } from "../components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import TripAttributesSection from "../components/trip-form/TripAttributesSection";
import { HelpText } from "../components/ui/help-text";
import { getCurrencySymbol } from "../data/currencies";
import { ItinerarySection } from "../components/trip-form/sections/ItinerarySection";
import { IncludedSection } from "../components/trip-form/sections/IncludedSection";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";
import { useToast } from "../components/ui/toast";
import { MultiSelect } from "../components/ui/multi-select";
import { TestimonialsSelector } from "../components/trip-form/TestimonialsSelector";
import { LocationPicker } from "../components/trip-form/LocationPicker";
import { ProFeature, ProBadge } from "../components/ProFeature";
import { getErrorContext } from "../lib/errors";
import {
  buildYatraSinglePublicUrls,
  isWordPressPlainPermalink,
} from "../lib/frontend-permalink-urls";

type SectionId =
  | "basic" // 1. Basic Information (title, description, highlights, featured image, trip type, duration)
  | "location" // 2. Location & Geography
  | "duration" // 3. Schedule & Availability (renamed)
  | "pricing" // 4. Pricing & Payment
  | "booking" // 5. Booking Requirements
  | "attributes" // 6. Trip Attributes
  | "itinerary" // 7. Itinerary Builder (includes Included/Excluded)
  | "included" // 8. What's Included/Excluded (deprecated - merged into itinerary)
  | "media" // 9. Media & Content (gallery, video, story, testimonials)
  | "downloads" // 9b. Downloads (Pro module)
  | "categorization" // 10. Categorization & Tags (category, activities, difficulty, tags)
  | "faqs" // 11. FAQs
  | "seo" // 12. SEO Settings
  | "advanced"; // 13. Advanced Settings (status, scheduling, frontend tabs)

interface Section {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
  completed: boolean;
  hasErrors?: boolean;
}

interface FAQ {
  question: string;
  answer: string;
}

interface TravelerCategory {
  id: number;
  label: string;
  description: string;
  age_min?: number;
  age_max?: number;
  status: "active" | "inactive" | "publish" | "draft";
  pricing_mode?: "per_person" | "per_group";
  min_pax?: number | null;
  max_pax?: number | null;
}

interface PriceType {
  category_id: number;
  original_price: string;
  discounted_price: string;
  is_default?: boolean;
}

interface TripCategoryOption {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  parent_id: number | null;
  status?: string;
  subcategories?: TripCategoryOption[];
}

interface DifficultyLevelOption {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  level_order?: number;
  status?: string;
}

interface TripAmenityItem {
  title: string;
  description: string;
}

interface DownloadableItem {
  id?: number | null;
  title: string;
  description: string;
  attachment_id: number | null;
  attachment_url?: string;
  attachment_title?: string;
  visibility: "public" | "logged_in" | "booked_only";
  enabled: boolean;
  sort_order?: number;
}

const buildCategoryOptionNodes = (
  categories: TripCategoryOption[],
  depth = 0,
): React.ReactNode[] => {
  return categories.flatMap((category) => {
    const optionValue =
      category.slug || category.name || category.id?.toString() || "";
    const labelPrefix =
      depth > 0 ? `${"-- ".repeat(depth)}${category.name}` : category.name;
    const nodes: React.ReactNode[] = [
      <option key={`category-option-${category.id}`} value={optionValue}>
        {labelPrefix}
      </option>,
    ];

    if (
      Array.isArray(category.subcategories) &&
      category.subcategories.length > 0
    ) {
      nodes.push(
        ...buildCategoryOptionNodes(category.subcategories, depth + 1),
      );
    }

    return nodes;
  });
};

const extractArrayPayload = (payload: any): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const normalizeAmenityItems = (items: unknown): TripAmenityItem[] => {
  if (!items) return [];
  if (Array.isArray(items)) {
    return items
      .map((item) => {
        if (typeof item === "string") {
          return { title: item, description: "" };
        }
        if (item && typeof item === "object") {
          const obj = item as Partial<TripAmenityItem>;
          return {
            title: (obj.title ?? "").toString(),
            description: (obj.description ?? "").toString(),
          };
        }
        return { title: String(item), description: "" };
      })
      .filter((item) => item.title.trim().length > 0);
  }
  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      if (Array.isArray(parsed)) {
        return normalizeAmenityItems(parsed);
      }
    } catch {
      return [{ title: items, description: "" }];
    }
  }
  return [];
};

interface TimeSlot {
  id: string;
  time: string; // HH:MM format
  label: string;
}

/**
 * Pull a context payload out of the live formData for AI generation
 * calls. Kept narrow on purpose — fewer tokens, no PII, and only the
 * fields the prompt templates actually reference. Helpers stay free of
 * React state so AiFieldAffordance's `buildContext` callback can be
 * invoked from anywhere without re-deriving form deps.
 */
function buildTripAiContext(formData: any): Record<string, unknown> {
  const amenityTitles = (items: any[] | undefined): string[] =>
    Array.isArray(items)
      ? items
          .map((it) => (typeof it === "string" ? it : it?.title || it?.label))
          .filter((s): s is string => typeof s === "string" && s.trim() !== "")
      : [];

  return {
    name: formData?.title ?? "",
    short_description: formData?.short_description ?? "",
    description: stripHtml(formData?.description ?? ""),
    destinations: namesFromIds(formData?.destinations),
    categories: namesFromIds(formData?.categories),
    activities: namesFromIds(formData?.activities),
    difficulty_level: formData?.difficulty_level ?? "",
    duration_days: formData?.duration_days ?? "",
    duration_nights: formData?.duration_nights ?? "",
    best_season: formData?.best_season ?? "",
    price: formData?.price ?? "",
    deposit_percentage: formData?.deposit_percentage ?? "",
    booking_deadline_hours: formData?.booking_deadline_hours ?? "",
    age_min: formData?.age_min ?? "",
    age_max: formData?.age_max ?? "",
    accommodation_type: formData?.accommodation_type ?? "",
    transportation_included: formData?.transportation_included ?? "",
    included_items: amenityTitles(formData?.included_items),
    excluded_items: amenityTitles(formData?.excluded_items),
  };
}

function stripHtml(value: string): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Best-effort name resolution for taxonomy fields. The form stores IDs
 *  in some places and objects in others; we accept either. */
function namesFromIds(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return item.name || item.label || item.title || "";
      }
      return "";
    })
    .filter((s): s is string => typeof s === "string" && s.trim() !== "");
}

interface TripFormData {
  // Overview
  title: string;
  slug: string;
  description: string;
  highlights: string[];
  trip_details: string;
  short_description: string;
  what_makes_special: string; // What Makes This Trip Special
  trip_story: string; // Trip Story/Narrative
  video_url: string; // Video Embed URL
  virtual_tour_url: string; // 360° Virtual Tour URL
  testimonial_review_ids: number[]; // Array of review IDs to display as testimonials

  // Location & Geography
  destinations: number[]; // Array of destination IDs
  starting_location: string;
  ending_location: string;
  countries: string[];
  regions: string[];
  starting_latitude: string;
  starting_longitude: string;
  ending_latitude: string;
  ending_longitude: string;
  landmarks: string[]; // Geographic Tags - Landmarks

  // Duration & Schedule
  trip_type: "single_day" | "multi_day" | "flexible";
  duration_days: string;
  duration_nights: string;
  available_from: string;
  available_to: string;
  booking_window_days: string;
  seasonal_availability: string;
  best_season: string; // Best season indicator
  peak_season: string; // Peak season indicator
  off_season: string; // Off-season indicator

  // Activity & Category
  activity_types: number[]; // Array of activity IDs (changed from string[])
  difficulty_level: string;
  trip_category: number[]; // Array of category IDs
  tags: string[];
  featured_priority: "none" | "featured" | "new" | "limited"; // Featured Priority

  // Accommodation
  accommodation_type: string;
  meal_plan: string;
  accommodation_details: string;

  // Transportation
  transportation_included: boolean;
  pickup_location: string;
  dropoff_location: string;
  transportation_details: string;

  // Pricing
  pricing_type: "regular" | "traveler_based";
  original_price: string;
  discounted_price: string;
  price_types: PriceType[];
  deposit_amount: string;
  deposit_percentage: string;
  payment_terms: string;
  max_travelers: string;
  min_travelers: string;
  booking_deadline_hours: string;
  cancellation_policy: string;
  age_min: string;
  age_max: string;
  physical_requirements: string;
  visa_requirements: string;
  vaccination_requirements: string;
  disable_booking: boolean; // Pro: enquiry-only mode (stored in custom_fields)

  // Fallback Settings (for trips without availability dates/rules)
  has_default_time_slots: boolean; // For day tours: enable multiple time slots
  default_time_slots: TimeSlot[]; // Array of time slot objects for day tours
  departure_time: string; // Default departure time

  // Included/Excluded
  included_items: TripAmenityItem[];
  excluded_items: TripAmenityItem[];

  // Attributes & Properties
  attributes: Record<number, any>; // attribute_id -> value mapping

  // Itinerary
  itinerary_days: ItineraryDay[];

  // Gallery
  gallery_images: Array<{
    id: number;
    url: string;
    thumbnail_url?: string;
    alt_text?: string;
    caption?: string;
  }>;
  featured_image: number | null;

  // Downloads
  downloadable_items: DownloadableItem[];

  // FAQs
  faqs: FAQ[];

  // Frontend Tabs
  frontend_tabs: FrontendTab[];

  // Availability
  availability_dates: AvailabilityDate[];

  // Status & Lifecycle
  status:
    | "draft"
    | "review"
    | "approved"
    | "publish"
    | "archived"
    | "suspended";
  scheduled_publish_date: string; // Scheduled Publishing
  scheduled_unpublish_date: string; // Scheduled Unpublishing
  version: number; // Version Control
  seasonal_auto_enable: boolean; // Auto-enable/disable based on dates
  seasonal_enable_date: string; // Date to auto-enable
  seasonal_disable_date: string; // Date to auto-disable

  // SEO
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

interface FrontendTab {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  content_type:
    | "overview"
    | "itinerary"
    | "included_excluded"
    | "location"
    | "important_info"
    | "downloads"
    | "faq"
    | "trip_story"
    | "what_makes_special"
    | "testimonials"
    | "reviews"
    | "downloads"
    | "custom"
    | "general"
    | "gallery"
    | "faqs";
  custom_content?: string;
  icon?: IconPickerValue | null;
}

interface AvailabilityDate {
  id: string;
  /** Present when availability row is tied to a specific trip */
  trip_id?: number;
  departure_date: string;
  arrival_date: string;
  seats_remaining: string;
  original_price: string;
  discounted_price: string;
  discount_percentage: string;
  status: "available" | "sold_out" | "limited" | "closed";
  from_location?: string;
  to_location?: string;
  from_latitude?: string;
  from_longitude?: string;
  to_latitude?: string;
  to_longitude?: string;
}

interface ItineraryEntry {
  id: string;
  day: number;
  day_title?: string;
  // Use IDs to match ItineraryForm structure
  item_type_id: string; // ID of the item type (Activity, Meal, Accommodation, Transportation, Rest)
  item_id: string; // ID of the specific item (Hiking, Breakfast, Hotel, etc.)
  // Keep legacy fields for backward compatibility
  item_type?: "Meal" | "Activity" | "Accommodation" | "Transportation";
  item_name?: string;
  item_icon?: string;
  // Entry details
  title: string;
  description: string;
  location?: string;
  location_latitude?: string;
  location_longitude?: string;
  duration?: string;
  start_time: string;
  end_time: string;
  time_type: "exact" | "duration" | "flexible";
  cost?: string;
  cost_per_person: boolean;
  notes?: string;
  included_items: string[];
  excluded_items: string[];
  images: string[];
  status?: "active" | "inactive";
}

interface ItineraryDay {
  day: number;
  day_title?: string;
  entries: ItineraryEntry[];
}

// getCurrencySymbol is now imported from '../data/currencies'

const TripForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can, isPro } = usePermissions();
  const { showToast } = useToast();
  // Downloads is now a FREE feature - always show the UI
  const showDownloadsUI = true;

  // AI Assistant — modal state for the "Auto-fill" / "Generate itinerary"
  // workflows. `aiModalMode` controls which preset the modal opens with.
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalMode, setAiModalMode] = useState<"all" | "itinerary">("all");
  // Itinerary-builder modal is the SAME component the standalone
  // Itinerary page uses. Going through it (instead of
  // AutoFillTripModal's itineraryOnly mode) means all three entry
  // points for "build itinerary with AI" — wizard, this trip-form
  // tab, and the Itinerary page — converge on the same agent +
  // applyItinerary persistence path.
  const [itineraryBuildOpen, setItineraryBuildOpen] = useState(false);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string>("");
  const [isResolvingFeaturedImage, setIsResolvingFeaturedImage] =
    useState<boolean>(false);
  const featuredImageCache = useRef<Record<number, string>>({});
  const mediaBaseUrl = useMemo(() => {
    const apiUrl = (window as any)?.yatraAdmin?.apiUrl;
    return apiUrl ? apiUrl.replace(/\/yatra\/v1\/?$/, "") : "";
  }, []);

  // Get section from URL on initial load
  const getInitialSection = (): SectionId => {
    const urlParams = new URLSearchParams(window.location.search);
    const sectionFromUrl = urlParams.get("section") as SectionId | null;
    const validSections: SectionId[] = [
      "basic",
      "location",
      "duration",
      "pricing",
      "booking",
      "attributes",
      "itinerary",
      "included",
      "media",
      "downloads",
      "categorization",
      "faqs",
      "seo",
      "advanced",
    ];
    if (sectionFromUrl && validSections.includes(sectionFromUrl)) {
      return sectionFromUrl;
    }
    return "basic";
  };

  const [currentSection, setCurrentSection] =
    useState<SectionId>(getInitialSection);
  const [visitedSections, setVisitedSections] = useState<Set<SectionId>>(
    () => new Set([getInitialSection()]),
  );
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showLandmarkDialog, setShowLandmarkDialog] = useState(false);
  const [landmarkInput, setLandmarkInput] = useState("");

  // Sub-tab state for Trip Details section (itinerary)
  const [tripDetailsTab, setTripDetailsTab] = useState<
    "itinerary" | "included"
  >("itinerary");

  // Track visited sections for lazy loading and update URL
  useEffect(() => {
    setVisitedSections((prev) => new Set([...prev, currentSection]));

    // Update URL with current section (without page reload)
    const url = new URL(window.location.href);
    url.searchParams.set("section", currentSection);
    window.history.replaceState({}, "", url.toString());
  }, [currentSection]);

  // Modal states for adding items
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [modalInput, setModalInput] = useState({
    text: "",
    question: "",
    answer: "",
  });

  // Revision states
  const [showRevisionsDialog, setShowRevisionsDialog] = useState(false);
  const [selectedRevisionId, setSelectedRevisionId] = useState<number | null>(
    null,
  );
  const [showRevisionConfirm, setShowRevisionConfirm] = useState(false);

  // UI Enhancement states
  const [simpleMode, setSimpleMode] = useState(false); // Quick Start mode
  const [showSlugPreview, setShowSlugPreview] = useState(true);
  const [dummyDataIndex, setDummyDataIndex] = useState(0); // Track which dummy data set to use

  // Static/dummy revisions data for UI only
  const dummyRevisions = [
    {
      id: 1,
      version: 3,
      created_by_name: "Admin User",
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      version: 2,
      created_by_name: "Admin User",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      version: 1,
      created_by_name: "Admin User",
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  // Comprehensive dummy trip data sets (3 different trips)
  const dummyTripsData: TripFormData[] = [
    {
      // Trip 1: Beach Adventure
      title: "7-Day Bali Beach Adventure",
      slug: "7-day-bali-beach-adventure",
      description:
        "Escape to paradise with our 7-day Bali beach adventure. Experience pristine beaches, explore ancient temples, enjoy world-class spa treatments, and immerse yourself in the rich Balinese culture. This carefully curated journey combines relaxation with adventure, offering the perfect balance for travelers seeking both tranquility and excitement.",
      short_description:
        "Escape to paradise with our 7-day Bali beach adventure featuring pristine beaches, ancient temples, and cultural immersion.",
      highlights: [
        "Pristine white sand beaches",
        "Ancient temple visits",
        "Traditional spa treatments",
        "Cultural dance performances",
        "Sunset dinners by the ocean",
      ],
      trip_details:
        "This comprehensive 7-day journey takes you through the best of Bali. Start your adventure in Seminyak with its trendy beach clubs and world-class restaurants. Visit the iconic Tanah Lot Temple perched on a rock formation in the sea. Explore the cultural heart of Ubud, known for its rice terraces, monkey forest, and art galleries. Enjoy traditional Balinese spa treatments and witness captivating cultural performances. End your trip with a relaxing stay at a beachfront resort where you can unwind and reflect on your incredible journey.",
      what_makes_special:
        "This trip offers exclusive access to private beach areas, personalized cultural experiences, and a perfect blend of relaxation and adventure. Our local guides share insider knowledge and hidden gems that most tourists never discover.",
      trip_story:
        "Imagine waking up to the gentle sound of waves lapping against the shore. As the sun rises over the horizon, you step onto your private balcony to witness a breathtaking sunrise. Your day begins with a traditional Balinese breakfast before heading out to explore ancient temples that have stood for centuries. In the afternoon, you find yourself surrounded by emerald-green rice terraces, learning about traditional farming methods from local farmers. As evening approaches, you're treated to a mesmerizing cultural dance performance followed by a candlelit dinner on the beach. This is more than a vacation—it's a journey into the heart and soul of Bali.",
      video_url: "https://www.youtube.com/watch?v=example1",
      virtual_tour_url: "",
      testimonial_review_ids: [], // Will be populated from actual reviews
      destinations: [], // Will be populated based on available destinations
      starting_location: "Ngurah Rai International Airport (DPS)",
      ending_location: "Seminyak Beach Resort",
      countries: ["Indonesia"],
      regions: ["Bali"],
      starting_latitude: "-8.3405",
      starting_longitude: "115.0920",
      ending_latitude: "-8.5069",
      ending_longitude: "115.2625",
      landmarks: [
        "Tanah Lot Temple",
        "Ubud Monkey Forest",
        "Tegallalang Rice Terrace",
        "Seminyak Beach",
      ],
      trip_type: "multi_day",
      duration_days: "7",
      duration_nights: "6",
      available_from: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 30 days from now
      available_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 1 year from now
      booking_window_days: "30",
      seasonal_availability: "Year-round",
      best_season: "April to October",
      peak_season: "July to August",
      off_season: "November to March",
      activity_types: [], // Will be populated based on available activities
      difficulty_level: "",
      trip_category: [],
      tags: ["family-friendly", "beach", "relaxation", "cultural", "spa"],
      featured_priority: "featured",
      accommodation_type: "Resort",
      meal_plan: "breakfast",
      accommodation_details:
        "4-star beachfront resort with private balconies, infinity pool, and spa facilities",
      transportation_included: true,
      pickup_location: "Ngurah Rai International Airport",
      dropoff_location: "Seminyak Beach Resort",
      transportation_details:
        "Private air-conditioned vehicle with professional driver",
      pricing_type: "traveler_based",
      original_price: "",
      discounted_price: "",
      price_types: [
        { category_id: 1, original_price: "1250", discounted_price: "" },
        { category_id: 2, original_price: "625", discounted_price: "" },
        { category_id: 3, original_price: "0", discounted_price: "" },
      ],
      deposit_amount: "300",
      deposit_percentage: "",
      payment_terms:
        "50% deposit required at booking, remaining 50% due 30 days before departure",
      max_travelers: "12",
      min_travelers: "2",
      booking_deadline_hours: "24",
      cancellation_policy:
        "Free cancellation up to 30 days before departure. 50% refund for cancellations 15-30 days before. No refund for cancellations less than 15 days before.",
      age_min: "8",
      age_max: "",
      physical_requirements:
        "Moderate fitness level required. Some walking involved but no strenuous activities.",
      visa_requirements:
        "Visa on arrival available for most nationalities. Valid passport required with at least 6 months validity.",
      vaccination_requirements:
        "No mandatory vaccinations. Recommended: Hepatitis A, Typhoid, and routine vaccinations.",
      disable_booking: false,
      has_default_time_slots: false,
      default_time_slots: [],
      departure_time: "",
      included_items: [
        {
          title: "Accommodation",
          description: "6 nights at 4-star beachfront resort",
        },
        { title: "Breakfast", description: "Daily breakfast included" },
        {
          title: "Airport transfers",
          description: "Private transfers to and from airport",
        },
        {
          title: "Temple visits",
          description: "Entrance fees to all temples included",
        },
        {
          title: "Cultural performances",
          description: "Traditional dance show tickets",
        },
        {
          title: "Professional guide",
          description: "English-speaking local guide",
        },
      ],
      excluded_items: [
        {
          title: "International flights",
          description: "Flights to and from Bali not included",
        },
        {
          title: "Lunch and dinner",
          description: "Meals other than breakfast",
        },
        {
          title: "Travel insurance",
          description: "Travel insurance recommended but not included",
        },
        {
          title: "Personal expenses",
          description: "Souvenirs, tips, and personal items",
        },
      ],
      itinerary_days: [],
      gallery_images: [],
      featured_image: null,
      downloadable_items: [],
      faqs: [
        {
          question: "What is the best time to visit Bali?",
          answer:
            "The best time to visit Bali is during the dry season from April to October, when you can expect sunny days and minimal rainfall.",
        },
        {
          question: "Do I need a visa?",
          answer:
            "Most nationalities can get a visa on arrival at the airport. A valid passport with at least 6 months validity is required.",
        },
        {
          question: "What should I pack?",
          answer:
            "Pack light, breathable clothing, swimwear, sunscreen, insect repellent, and comfortable walking shoes. Modest clothing is required for temple visits.",
        },
      ],
      frontend_tabs: [
        {
          id: "overview",
          label: "Overview",
          enabled: true,
          order: 1,
          content_type: "general",
          icon: { type: "icon", value: "book-open" },
        },
        {
          id: "itinerary",
          label: "Itinerary",
          enabled: true,
          order: 2,
          content_type: "itinerary",
          icon: { type: "icon", value: "calendar" },
        },
        {
          id: "included",
          label: "Included",
          enabled: true,
          order: 3,
          content_type: "included_excluded",
          icon: { type: "icon", value: "check" },
        },
        {
          id: "location",
          label: "Location",
          enabled: true,
          order: 4,
          content_type: "gallery",
          icon: { type: "icon", value: "map-pin" },
        },
        {
          id: "important_info",
          label: "Important Info",
          enabled: true,
          order: 5,
          content_type: "general",
          icon: { type: "icon", value: "file-text" },
        },
        {
          id: "downloads",
          label: "Downloads",
          enabled: true,
          order: 6,
          content_type: "downloads",
          icon: { type: "icon", value: "download" },
        },
        {
          id: "faq",
          label: "FAQ",
          enabled: true,
          order: 7,
          content_type: "faqs",
          icon: { type: "icon", value: "help-circle" },
        },
        {
          id: "trip_story",
          label: "Story",
          enabled: true,
          order: 8,
          content_type: "custom",
          custom_content: "",
          icon: { type: "icon", value: "book" },
        },
        {
          id: "what_makes_special",
          label: "Special",
          enabled: true,
          order: 9,
          content_type: "custom",
          custom_content: "",
          icon: { type: "icon", value: "star" },
        },
        {
          id: "testimonials",
          label: "Testimonials",
          enabled: true,
          order: 10,
          content_type: "reviews",
          icon: { type: "icon", value: "message-circle" },
        },
      ],
      availability_dates: [],
      status: "draft",
      scheduled_publish_date: "",
      scheduled_unpublish_date: "",
      version: 1,
      seasonal_auto_enable: false,
      seasonal_enable_date: "",
      seasonal_disable_date: "",
      meta_title: "7-Day Bali Beach Adventure | Luxury Beach Resort Experience",
      meta_description:
        "Experience the best of Bali with our 7-day beach adventure. Pristine beaches, ancient temples, cultural immersion, and world-class spa treatments await.",
      meta_keywords:
        "Bali, beach vacation, cultural tour, spa retreat, Indonesia travel",
      attributes: {},
    },
    {
      // Trip 2: Mountain Trekking Adventure
      title: "Everest Base Camp Trek - 14 Days",
      slug: "everest-base-camp-trek-14-days",
      description:
        "Embark on the adventure of a lifetime with our 14-day Everest Base Camp trek. This challenging yet rewarding journey takes you through the heart of the Himalayas, passing through traditional Sherpa villages, ancient monasteries, and breathtaking mountain landscapes. Experience the rich culture of the Khumbu region while pushing your limits to reach the base of the world's highest mountain.",
      short_description:
        "Embark on the adventure of a lifetime with our 14-day Everest Base Camp trek through the heart of the Himalayas.",
      highlights: [
        "Trek to Everest Base Camp (5,364m)",
        "Visit ancient Buddhist monasteries",
        "Experience Sherpa culture",
        "Breathtaking mountain views",
        "Professional mountain guides",
      ],
      trip_details:
        "This 14-day trekking adventure begins in Kathmandu, where you'll prepare for your journey and meet your experienced guides. Fly to Lukla, the gateway to the Khumbu region, and begin your trek through the stunning Himalayan landscape. Pass through traditional Sherpa villages like Namche Bazaar, Tengboche, and Dingboche, each offering unique cultural experiences and acclimatization opportunities. Visit ancient monasteries, learn about Sherpa traditions, and witness the daily life of mountain communities. The journey culminates at Everest Base Camp, where you'll stand in the shadow of the world's highest peak. Along the way, you'll be treated to spectacular views of peaks like Ama Dablam, Lhotse, and of course, Mount Everest itself.",
      what_makes_special:
        "Our trek includes experienced mountain guides, proper acclimatization schedules, high-altitude porters, and comprehensive safety equipment. We prioritize responsible tourism, supporting local communities and ensuring minimal environmental impact.",
      trip_story:
        "The crisp mountain air fills your lungs as you take your first steps on the trail. With each passing day, the mountains grow larger, the air thinner, and the sense of accomplishment greater. You wake before dawn to witness the sun painting the peaks in shades of gold and pink. You share meals with Sherpa families, learning about their way of life and the challenges they face in this harsh yet beautiful environment. As you approach Base Camp, the anticipation builds. When you finally arrive, standing at 5,364 meters with Everest towering above, you realize this is more than a trek—it's a transformation. The journey changes you, teaching resilience, appreciation for nature, and respect for the mountains and the people who call them home.",
      video_url: "https://www.youtube.com/watch?v=example2",
      virtual_tour_url: "",
      testimonial_review_ids: [], // Will be populated from actual reviews
      destinations: [], // Will be populated
      starting_location: "Kathmandu International Airport",
      ending_location: "Lukla Airport",
      countries: ["Nepal"],
      regions: ["Khumbu Region"],
      starting_latitude: "27.9881",
      starting_longitude: "86.9250",
      ending_latitude: "27.6837",
      ending_longitude: "86.7330",
      landmarks: [
        "Mount Everest",
        "Namche Bazaar",
        "Tengboche Monastery",
        "Kala Patthar",
      ],
      trip_type: "multi_day",
      duration_days: "14",
      duration_nights: "13",
      available_from: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      available_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      booking_window_days: "60",
      seasonal_availability: "March to May, September to November",
      best_season: "October to November",
      peak_season: "October to November",
      off_season: "December to February, June to August",
      activity_types: [],
      difficulty_level: "",
      trip_category: [],
      tags: ["trekking", "mountains", "adventure", "challenging", "everest"],
      featured_priority: "featured",
      accommodation_type: "Teahouse",
      meal_plan: "full_board",
      accommodation_details:
        "Traditional teahouses along the route with basic amenities. Rooms are shared, and facilities become more basic as altitude increases.",
      transportation_included: true,
      pickup_location: "Kathmandu International Airport",
      dropoff_location: "Lukla Airport",
      transportation_details:
        "Domestic flights Kathmandu-Lukla-Kathmandu included. Airport transfers included.",
      pricing_type: "regular",
      original_price: "1899",
      discounted_price: "1699",
      deposit_amount: "500",
      deposit_percentage: "",
      payment_terms:
        "50% deposit required at booking, remaining 50% due 60 days before departure",
      max_travelers: "12",
      min_travelers: "2",
      booking_deadline_hours: "24",
      cancellation_policy:
        "Free cancellation up to 60 days before departure. 50% refund for cancellations 30-60 days before. No refund for cancellations less than 30 days before.",
      age_min: "18",
      age_max: "65",
      physical_requirements:
        "Excellent physical fitness required. Previous trekking experience recommended. Must be able to walk 6-8 hours daily at high altitude.",
      visa_requirements:
        "Tourist visa required for Nepal. Can be obtained on arrival at airport or in advance. Valid passport required.",
      vaccination_requirements:
        "Recommended: Hepatitis A, Typhoid, Japanese Encephalitis, and routine vaccinations. Consult with travel health clinic.",
      disable_booking: false,
      has_default_time_slots: false,
      default_time_slots: [],
      departure_time: "",
      included_items: [
        {
          title: "Accommodation",
          description: "13 nights in teahouses along the route",
        },
        {
          title: "All meals",
          description: "Breakfast, lunch, and dinner included",
        },
        {
          title: "Professional guides",
          description: "Experienced mountain guides and porters",
        },
        {
          title: "Permits",
          description: "TIMS and Sagarmatha National Park permits",
        },
        {
          title: "Domestic flights",
          description: "Kathmandu-Lukla-Kathmandu flights",
        },
        {
          title: "Equipment",
          description: "Sleeping bag and down jacket rental",
        },
      ],
      excluded_items: [
        {
          title: "International flights",
          description: "Flights to and from Kathmandu",
        },
        {
          title: "Travel insurance",
          description: "Comprehensive travel and medical insurance required",
        },
        {
          title: "Personal equipment",
          description: "Trekking boots, clothing, and personal items",
        },
        {
          title: "Tips",
          description: "Tips for guides and porters (recommended)",
        },
        {
          title: "Personal expenses",
          description: "Drinks, snacks, and souvenirs",
        },
      ],
      itinerary_days: [],
      gallery_images: [],
      featured_image: null,
      downloadable_items: [],
      faqs: [
        {
          question: "How difficult is the trek?",
          answer:
            "This is a challenging trek requiring excellent physical fitness. You'll be walking 6-8 hours daily at high altitude. Previous trekking experience is recommended.",
        },
        {
          question: "What is the altitude at Base Camp?",
          answer:
            "Everest Base Camp is located at 5,364 meters (17,598 feet) above sea level.",
        },
        {
          question: "What happens if I get altitude sickness?",
          answer:
            "Our guides are trained to recognize and treat altitude sickness. We have proper acclimatization schedules and emergency descent plans in place.",
        },
      ],
      frontend_tabs: [
        {
          id: "overview",
          label: "Overview",
          enabled: true,
          order: 1,
          content_type: "general",
          icon: { type: "icon", value: "book-open" },
        },
        {
          id: "itinerary",
          label: "Itinerary",
          enabled: true,
          order: 2,
          content_type: "itinerary",
          icon: { type: "icon", value: "calendar" },
        },
        {
          id: "included",
          label: "Included",
          enabled: true,
          order: 3,
          content_type: "included_excluded",
          icon: { type: "icon", value: "check" },
        },
        {
          id: "location",
          label: "Location",
          enabled: true,
          order: 4,
          content_type: "gallery",
          icon: { type: "icon", value: "map-pin" },
        },
        {
          id: "important_info",
          label: "Important Info",
          enabled: true,
          order: 5,
          content_type: "general",
          icon: { type: "icon", value: "info" },
        },
        {
          id: "downloads",
          label: "Downloads",
          enabled: true,
          order: 6,
          content_type: "downloads",
          icon: { type: "icon", value: "download" },
        },
        {
          id: "faq",
          label: "FAQ",
          enabled: true,
          order: 7,
          content_type: "faqs",
          icon: { type: "icon", value: "help-circle" },
        },
        {
          id: "trip_story",
          label: "Story",
          enabled: true,
          order: 8,
          content_type: "custom",
          custom_content: "",
          icon: { type: "icon", value: "book" },
        },
        {
          id: "what_makes_special",
          label: "Special",
          enabled: true,
          order: 9,
          content_type: "custom",
          custom_content: "",
          icon: { type: "icon", value: "star" },
        },
        {
          id: "testimonials",
          label: "Testimonials",
          enabled: true,
          order: 10,
          content_type: "reviews",
          icon: { type: "icon", value: "message-circle" },
        },
      ],
      availability_dates: [],
      status: "draft",
      scheduled_publish_date: "",
      scheduled_unpublish_date: "",
      version: 1,
      seasonal_auto_enable: false,
      seasonal_enable_date: "",
      seasonal_disable_date: "",
      meta_title:
        "Everest Base Camp Trek - 14 Days | Ultimate Himalayan Adventure",
      meta_description:
        "Embark on the adventure of a lifetime with our 14-day Everest Base Camp trek. Experience Sherpa culture, ancient monasteries, and breathtaking mountain views.",
      meta_keywords:
        "Everest Base Camp, trekking, Nepal, Himalayas, adventure travel, mountain trek",
      attributes: {},
      price_types: [],
    },
    {
      // Trip 3: European City Tour
      title: "European Grand Tour - 10 Days",
      slug: "european-grand-tour-10-days",
      description:
        "Discover the best of Europe with our 10-day grand tour covering Paris, Rome, and Barcelona. Experience world-famous landmarks, indulge in exquisite cuisine, explore rich history and art, and immerse yourself in diverse European cultures. This carefully crafted journey takes you through three of Europe's most iconic cities, each offering unique experiences and unforgettable memories.",
      short_description:
        "Discover the best of Europe with our 10-day grand tour covering Paris, Rome, and Barcelona.",
      highlights: [
        "Eiffel Tower and Louvre Museum",
        "Colosseum and Vatican City",
        "Sagrada Familia and Park Güell",
        "World-class cuisine",
        "Professional local guides",
      ],
      trip_details:
        "Begin your European adventure in the City of Light—Paris. Explore iconic landmarks like the Eiffel Tower, Louvre Museum, and Notre-Dame Cathedral. Stroll along the Champs-Élysées, enjoy a Seine River cruise, and indulge in French pastries at charming cafés. Next, travel to Rome, the Eternal City, where ancient history comes alive. Visit the Colosseum, Roman Forum, and Vatican City with its stunning Sistine Chapel. Enjoy authentic Italian cuisine and gelato while exploring cobblestone streets. Conclude your journey in Barcelona, Spain's vibrant cultural capital. Admire Gaudí's architectural masterpieces including the Sagrada Familia and Park Güell. Experience the lively atmosphere of Las Ramblas, enjoy tapas and sangria, and relax on beautiful Mediterranean beaches.",
      what_makes_special:
        "This tour includes skip-the-line tickets to major attractions, private guided tours in each city, and carefully selected accommodations in prime locations. Our small group size ensures personalized attention and authentic local experiences.",
      trip_story:
        "Your European adventure begins as you step off the plane in Paris, greeted by the elegant architecture and romantic atmosphere that has inspired artists for centuries. Each day brings new discoveries—from the artistic treasures of the Louvre to the bohemian charm of Montmartre. In Rome, you walk in the footsteps of emperors and gladiators, feeling the weight of history in every ancient stone. The Vatican's art and architecture leave you in awe, while a simple plate of pasta in a local trattoria reminds you that the best experiences are often the simplest. Barcelona welcomes you with its unique blend of Gothic and Modernist architecture, vibrant street life, and Mediterranean warmth. As you watch the sunset from Park Güell, you realize that this journey has not just shown you three cities—it has shown you three different ways of living, three different approaches to art and culture, and three different reasons to fall in love with Europe.",
      video_url: "https://www.youtube.com/watch?v=example3",
      virtual_tour_url: "",
      testimonial_review_ids: [], // Will be populated from actual reviews
      destinations: [],
      starting_location: "Charles de Gaulle Airport (CDG)",
      ending_location: "El Prat Airport (BCN)",
      countries: ["France", "Italy", "Spain"],
      regions: ["Île-de-France", "Lazio", "Catalonia"],
      starting_latitude: "48.8566",
      starting_longitude: "2.3522",
      ending_latitude: "41.3792",
      ending_longitude: "2.1281",
      landmarks: [
        "Eiffel Tower",
        "Colosseum",
        "Sagrada Familia",
        "Louvre Museum",
        "Vatican City",
      ],
      trip_type: "multi_day",
      duration_days: "10",
      duration_nights: "9",
      available_from: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      available_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      booking_window_days: "45",
      seasonal_availability: "Year-round",
      best_season: "April to June, September to October",
      peak_season: "June to August",
      off_season: "November to March",
      activity_types: [],
      difficulty_level: "",
      trip_category: [],
      tags: ["cultural", "city-tour", "history", "art", "food"],
      featured_priority: "featured",
      accommodation_type: "Hotel",
      meal_plan: "breakfast",
      accommodation_details:
        "4-star hotels in city centers with easy access to major attractions",
      transportation_included: true,
      pickup_location: "Charles de Gaulle Airport",
      dropoff_location: "El Prat Airport",
      transportation_details:
        "High-speed train between cities, private transfers, and metro passes included",
      pricing_type: "regular",
      original_price: "2499",
      discounted_price: "",
      price_types: [],
      deposit_amount: "600",
      deposit_percentage: "",
      payment_terms:
        "40% deposit required at booking, remaining 60% due 45 days before departure",
      max_travelers: "20",
      min_travelers: "4",
      booking_deadline_hours: "24",
      cancellation_policy:
        "Free cancellation up to 45 days before departure. 75% refund for cancellations 30-45 days before. 50% refund for cancellations 15-30 days before. No refund for cancellations less than 15 days before.",
      age_min: "",
      age_max: "",
      physical_requirements:
        "Moderate walking required. Some sites involve stairs and uneven surfaces. Suitable for most fitness levels.",
      visa_requirements:
        "Schengen visa required for most non-EU nationals. Apply well in advance as processing can take several weeks.",
      vaccination_requirements:
        "No mandatory vaccinations. Routine vaccinations recommended.",
      disable_booking: false,
      has_default_time_slots: false,
      default_time_slots: [],
      departure_time: "",
      included_items: [
        {
          title: "Accommodation",
          description: "9 nights in 4-star city center hotels",
        },
        { title: "Breakfast", description: "Daily breakfast included" },
        {
          title: "Transportation",
          description:
            "High-speed trains, airport transfers, and city metro passes",
        },
        {
          title: "Guided tours",
          description: "Professional local guides in each city",
        },
        {
          title: "Skip-the-line tickets",
          description: "Priority access to major attractions",
        },
        {
          title: "Welcome dinner",
          description: "Traditional welcome dinner in Paris",
        },
      ],
      excluded_items: [
        {
          title: "International flights",
          description: "Flights to Paris and from Barcelona",
        },
        {
          title: "Lunch and dinner",
          description: "Meals other than breakfast and welcome dinner",
        },
        {
          title: "Travel insurance",
          description: "Travel insurance recommended",
        },
        {
          title: "Personal expenses",
          description: "Souvenirs, tips, and personal items",
        },
      ],
      itinerary_days: [],
      gallery_images: [],
      featured_image: null,
      downloadable_items: [],
      faqs: [
        {
          question: "Do I need a visa?",
          answer:
            "Most non-EU nationals need a Schengen visa. Apply at the embassy of your first entry country (France) well in advance.",
        },
        {
          question: "What languages are spoken?",
          answer:
            "English-speaking guides provided. Local languages are French, Italian, and Spanish, but English is widely spoken in tourist areas.",
        },
        {
          question: "Is this suitable for families?",
          answer:
            "Yes, this tour is family-friendly. However, some museums and sites may have age restrictions for children.",
        },
      ],
      frontend_tabs: [
        {
          id: "overview",
          label: "Overview",
          enabled: true,
          order: 1,
          content_type: "general",
          icon: { type: "icon", value: "book-open" },
        },
        {
          id: "itinerary",
          label: "Itinerary",
          enabled: true,
          order: 2,
          content_type: "itinerary",
          icon: { type: "icon", value: "calendar" },
        },
        {
          id: "included",
          label: "Included",
          enabled: true,
          order: 3,
          content_type: "included_excluded",
          icon: { type: "icon", value: "check" },
        },
        {
          id: "location",
          label: "Location",
          enabled: true,
          order: 4,
          content_type: "gallery",
          icon: { type: "icon", value: "map-pin" },
        },
        {
          id: "important_info",
          label: "Important Info",
          enabled: true,
          order: 5,
          content_type: "general",
          icon: { type: "icon", value: "info" },
        },
        {
          id: "downloads",
          label: "Downloads",
          enabled: true,
          order: 6,
          content_type: "downloads",
          icon: { type: "icon", value: "download" },
        },
        {
          id: "faq",
          label: "FAQ",
          enabled: true,
          order: 7,
          content_type: "faqs",
          icon: { type: "icon", value: "help-circle" },
        },
        {
          id: "trip_story",
          label: "Story",
          enabled: true,
          order: 8,
          content_type: "custom",
          custom_content: "",
          icon: { type: "icon", value: "book" },
        },
        {
          id: "what_makes_special",
          label: "Special",
          enabled: true,
          order: 9,
          content_type: "custom",
          custom_content: "",
          icon: { type: "icon", value: "star" },
        },
        {
          id: "testimonials",
          label: "Testimonials",
          enabled: true,
          order: 10,
          content_type: "reviews",
          icon: { type: "icon", value: "message-circle" },
        },
      ],
      availability_dates: [],
      status: "draft",
      scheduled_publish_date: "",
      scheduled_unpublish_date: "",
      version: 1,
      seasonal_auto_enable: false,
      seasonal_enable_date: "",
      seasonal_disable_date: "",
      meta_title: "European Grand Tour - 10 Days | Paris, Rome & Barcelona",
      meta_description:
        "Discover the best of Europe with our 10-day grand tour covering Paris, Rome, and Barcelona. Experience iconic landmarks, world-class cuisine, and rich history.",
      meta_keywords:
        "Europe tour, Paris, Rome, Barcelona, European travel, cultural tour",
      attributes: {},
    },
  ];

  const [formData, setFormData] = useState<TripFormData>({
    title: "",
    slug: "",
    description: "",
    highlights: [],
    trip_details: "",
    short_description: "",
    what_makes_special: "",
    trip_story: "",
    video_url: "",
    virtual_tour_url: "",
    testimonial_review_ids: [],
    destinations: [], // Array of destination IDs
    starting_location: "",
    ending_location: "",
    countries: [],
    regions: [],
    starting_latitude: "",
    starting_longitude: "",
    ending_latitude: "",
    ending_longitude: "",
    landmarks: [],
    trip_type: "multi_day",
    duration_days: "",
    duration_nights: "",
    available_from: "",
    available_to: "",
    booking_window_days: "",
    seasonal_availability: "",
    best_season: "",
    peak_season: "",
    off_season: "",
    activity_types: [], // Array of activity IDs
    difficulty_level: "",
    trip_category: [],
    tags: [],
    featured_priority: "none",
    accommodation_type: "",
    meal_plan: "",
    accommodation_details: "",
    transportation_included: false,
    pickup_location: "",
    dropoff_location: "",
    transportation_details: "",
    pricing_type: "regular",
    original_price: "",
    discounted_price: "",
    price_types: [],
    deposit_amount: "",
    deposit_percentage: "",
    payment_terms: "",
    max_travelers: "10",
    min_travelers: "2",
    booking_deadline_hours: "24",
    cancellation_policy: "Flexible",
    age_min: "18",
    age_max: "65",
    physical_requirements: "Moderate",
    visa_requirements: "Schengen visa",
    vaccination_requirements: "COVID-19 vaccination",
    disable_booking: false,
    has_default_time_slots: false,
    default_time_slots: [],
    departure_time: "09:00",
    included_items: [],
    excluded_items: [],
    attributes: {}, // attribute_id -> value mapping
    itinerary_days: [],
    gallery_images: [],
    featured_image: null,
    downloadable_items: [],
    faqs: [],
    frontend_tabs: [
      {
        id: "overview",
        label: "Overview",
        enabled: true,
        order: 1,
        content_type: "general",
        icon: { type: "icon", value: "book-open" },
      },
      {
        id: "itinerary",
        label: "Itinerary",
        enabled: true,
        order: 2,
        content_type: "itinerary",
        icon: { type: "icon", value: "calendar" },
      },
      {
        id: "included",
        label: "Included",
        enabled: true,
        order: 3,
        content_type: "included_excluded",
        icon: { type: "icon", value: "check" },
      },
      {
        id: "location",
        label: "Location",
        enabled: true,
        order: 4,
        content_type: "gallery",
        icon: { type: "icon", value: "map-pin" },
      },
      {
        id: "important_info",
        label: "Important Info",
        enabled: true,
        order: 5,
        content_type: "general",
        icon: { type: "icon", value: "info" },
      },
      {
        id: "downloads",
        label: "Downloads",
        enabled: true,
        order: 6,
        content_type: "downloads",
        icon: { type: "icon", value: "download" },
      },
      {
        id: "faq",
        label: "FAQ",
        enabled: true,
        order: 7,
        content_type: "faqs",
        icon: { type: "icon", value: "help-circle" },
      },
      {
        id: "trip_story",
        label: "Story",
        enabled: true,
        order: 8,
        content_type: "custom",
        custom_content: "",
        icon: { type: "icon", value: "book" },
      },
      {
        id: "what_makes_special",
        label: "Special",
        enabled: true,
        order: 9,
        content_type: "custom",
        custom_content: "",
        icon: { type: "icon", value: "star" },
      },
      {
        id: "testimonials",
        label: "Testimonials",
        enabled: true,
        order: 10,
        content_type: "reviews",
        icon: { type: "icon", value: "message-circle" },
      },
    ],
    availability_dates: [],
    status: "draft",
    scheduled_publish_date: "",
    scheduled_unpublish_date: "",
    version: 1,
    seasonal_auto_enable: false,
    seasonal_enable_date: "",
    seasonal_disable_date: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedErrorDetails, setCopiedErrorDetails] = useState(false);

  const copyErrorDetailsToClipboard = (text: string) => {
    if (!text) return;
    const fallbackCopy = () => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (e) {
        // ignore
      }
      document.body.removeChild(textarea);
      setCopiedErrorDetails(true);
      setTimeout(() => setCopiedErrorDetails(false), 1500);
    };

    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setCopiedErrorDetails(true);
            setTimeout(() => setCopiedErrorDetails(false), 1500);
          })
          .catch(() => fallbackCopy());
      } else {
        fallbackCopy();
      }
    } catch {
      fallbackCopy();
    }
  };

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") || "create";
  }, []);

  const tripId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);

  const isEditMode = action === "edit" && tripId !== null;

  // Fetch traveler categories - LAZY LOAD: only when pricing section is visited
  const { data: travelerCategoriesData, isLoading: isLoadingCategories } =
    useQuery({
      queryKey: ["traveler-categories"],
      queryFn: async () => {
        try {
          const response = await apiClient.get("/traveler-categories", {
            params: {
              per_page: 100,
              status: "publish", // Only get published categories
            },
          });
          const categories =
            response?.data?.data || response?.data || response || [];
          return Array.isArray(categories) ? categories : [];
        } catch (error: any) {
          showToast(
            error?.message || __("Failed to load traveler categories", "yatra"),
            "error",
          );
          return [];
        }
      },
      enabled:
        can("yatra_view_trips") &&
        (currentSection === "pricing" || visitedSections.has("pricing")),
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

  // Get only active/published categories
  const activeCategories = useMemo(() => {
    const categories = travelerCategoriesData || [];
    return categories.filter(
      (cat: TravelerCategory) =>
        cat.status === "active" || cat.status === "publish",
    );
  }, [travelerCategoriesData]);

  // Fetch settings to get global currency
  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const response = await fetchSettings();
        return response;
      } catch (error: any) {
        // Return default currency if settings fetch fails
        return { currency: "USD" };
      }
    },
    enabled: can("yatra_view_trips"),
  });

  // Get global currency from settings, default to USD
  const cur = settingsData?.currency;
  const defCur = settingsData?.default_currency;
  const globalCurrency =
    typeof cur === "string" && cur.length > 0
      ? cur
      : typeof defCur === "string" && defCur.length > 0
        ? defCur
        : "USD";

  // Fetch activities from API - LAZY LOAD: only when categorization section is visited
  const { data: activitiesData } = useQuery({
    queryKey: ["activities-published"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/activities", {
          params: {
            per_page: 100,
            status: "publish", // Only get published activities
          },
        });
        return response.data || [];
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load activities", "yatra"),
          "error",
        );
        return [];
      }
    },
    enabled:
      can("yatra_view_trips") &&
      (currentSection === "categorization" ||
        visitedSections.has("categorization")),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // LAZY LOAD: only when categorization section is visited
  const { data: tripCategoriesResponse } = useQuery({
    queryKey: ["trip-categories", "published"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/trip-categories", {
          params: {
            per_page: 100,
            status: "publish",
            hierarchical: true,
            orderby: "name",
            order: "ASC",
          },
        });
        return response;
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load trip categories", "yatra"),
          "error",
        );
        return [];
      }
    },
    enabled: can("yatra_view_trips"),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // LAZY LOAD: only when categorization section is visited
  const {
    data: difficultyLevelsResponse,
    isLoading: isLoadingDifficultyLevels,
  } = useQuery({
    queryKey: ["difficulty-levels", "published"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/difficulty-levels", {
          params: {
            per_page: 100,
            status: "publish",
            orderby: "sorting",
            order: "ASC",
          },
        });
        return response.data || [];
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load difficulty levels", "yatra"),
          "error",
        );
        return [];
      }
    },
    enabled:
      can("yatra_view_trips") &&
      (currentSection === "categorization" ||
        visitedSections.has("categorization")),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const tripCategories: TripCategoryOption[] = useMemo(() => {
    const payload = extractArrayPayload(tripCategoriesResponse);
    return (payload as TripCategoryOption[]).filter((category) => {
      if (!category) return false;
      if (typeof category !== "object") return false;
      if (
        "status" in category &&
        category.status &&
        category.status !== "publish"
      ) {
        return false;
      }
      return true;
    });
  }, [tripCategoriesResponse]);

  const difficultyLevels: DifficultyLevelOption[] = useMemo(() => {
    const payload = extractArrayPayload(difficultyLevelsResponse);
    return (payload as DifficultyLevelOption[]).filter((level) => {
      if (!level) return false;
      if (typeof level !== "object") return false;
      if ("status" in level && level.status && level.status !== "publish") {
        return false;
      }
      return true;
    });
  }, [difficultyLevelsResponse]);

  // Fetch destinations from API - LAZY LOAD: only when location section is visited
  const { data: destinationsData } = useQuery({
    queryKey: ["destinations-published"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/destinations", {
          params: {
            per_page: 100,
            status: "publish", // Only get published destinations
          },
        });
        return response.data || [];
      } catch (error: any) {
        showToast(
          error?.message || __("Failed to load destinations", "yatra"),
          "error",
        );
        return [];
      }
    },
    enabled:
      can("yatra_view_trips") &&
      (isEditMode ||
        currentSection === "location" ||
        visitedSections.has("location")),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch trip data if editing
  const {
    data: tripData,
    isLoading: isLoadingTrip,
    error: tripError,
  } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      if (!tripId) return null;
      try {
        const response = await apiClient.get(`/trips/${tripId}`);
        // WordPress REST API returns data directly, but check if it's wrapped
        // Some endpoints return { data: {...} }, others return {...} directly
        const tripData = response?.data || response;
        return tripData;
      } catch (error: any) {
        console.error("Error loading trip:", error);
        showToast(
          error?.message || __("Failed to load trip data", "yatra"),
          "error",
        );
        throw error;
      }
    },
    enabled: !!tripId && isEditMode,
    staleTime: 0, // Always fetch fresh data to ensure downloadable items persist after save
  });

  // Build error context for edit error state
  const tripErrorContext = useMemo(
    () => getErrorContext(tripError),
    [tripError],
  );

  // Fetch trip attributes if editing (TripAttributesSection waits until resolved to avoid empty-first-render bug)
  const tripAttributesQueryEnabled = Boolean(tripId && isEditMode);
  const { data: tripAttributesData, isPending: isTripAttributesPending } =
    useQuery({
      queryKey: ["trip-attributes", tripId],
      queryFn: async () => {
        if (!tripId) return {};
        try {
          const response = await apiClient.get(`/trips/${tripId}/attributes`);

          // Try different ways to extract the data
          let payload = response?.data;
          if (!payload || !Array.isArray(payload)) {
            payload = response;
          }
          if (!payload || !Array.isArray(payload)) {
            payload = response?.data?.data;
          }

          const attributes = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

          // Convert to attributeId => value mapping for form
          const attributesMap: Record<number, any> = {};
          attributes.forEach((attr: any) => {
            const attributeId = Number(attr.attribute_id || attr.id);
            if (attributeId) {
              let value = "";

              // Read from relationship_metadata (contains complete attribute data)
              if (attr.relationship_metadata) {
                try {
                  const metadata =
                    typeof attr.relationship_metadata === "string"
                      ? JSON.parse(attr.relationship_metadata)
                      : attr.relationship_metadata;

                  value = metadata.value || "";
                } catch (e) {
                  console.warn(
                    "Failed to parse relationship_metadata:",
                    attr.relationship_metadata,
                    e,
                  );
                  value = "";
                }
              } else {
                // Fallback to old format if metadata is not available
                value = attr.value || "";
              }

              attributesMap[attributeId] = value;
            }
          });

          return attributesMap;
        } catch (error) {
          console.error("Failed to fetch trip attributes:", error);
          return {};
        }
      },
      enabled: tripAttributesQueryEnabled,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
  const tripAttributesReady =
    !tripAttributesQueryEnabled || !isTripAttributesPending;

  // Helper function to normalize array of items to IDs
  // Helper to normalize highlights (can be array of strings or objects)
  const normalizeHighlights = (highlights: any): string[] => {
    if (!highlights) return [];
    if (Array.isArray(highlights)) {
      return highlights
        .map((h: any) => {
          if (typeof h === "string") return h;
          if (h && typeof h === "object") {
            return h.highlight_text || h.text || h.title || String(h);
          }
          return String(h);
        })
        .filter((h: string) => h.trim().length > 0);
    }
    if (typeof highlights === "string") {
      try {
        const parsed = JSON.parse(highlights);
        return normalizeHighlights(parsed);
      } catch {
        return [highlights];
      }
    }
    return [];
  };

  const normalizeDownloadableItems = (items: any): DownloadableItem[] => {
    if (!items || !Array.isArray(items)) return [];

    return items
      .filter((row: any) => row && typeof row === "object")
      .map((row: any, idx: number) => {
        const rawVisibility = (row.visibility ?? "booked_only") as any;
        const mappedVisibility =
          rawVisibility === "paid_only" ? "booked_only" : rawVisibility;
        const safeVisibility: DownloadableItem["visibility"] = [
          "public",
          "logged_in",
          "booked_only",
        ].includes(mappedVisibility)
          ? mappedVisibility
          : "booked_only";

        const title = (
          row.title ??
          row.download_title ??
          row.downlaod_title ??
          ""
        ).toString();
        const description = (
          row.description ??
          row.download_description ??
          row.downlaod_description ??
          ""
        ).toString();
        const attachmentIdRaw =
          row.attachment_id ?? row.download_file ?? row.downlaod_file;
        const attachmentUrl = (
          row.attachment_url ??
          row.content_url ??
          ""
        ).toString();
        const attachmentTitle = (row.attachment_title ?? "").toString();
        const enabledRaw =
          row.enabled ??
          row.is_downloadable ??
          row.download_enabled ??
          row.downlaod_enabled;

        return {
          id: row.id != null ? Number(row.id) : null,
          title,
          description,
          attachment_id:
            attachmentIdRaw != null ? Number(attachmentIdRaw) : null,
          attachment_url: attachmentUrl,
          attachment_title: attachmentTitle,
          visibility: safeVisibility,
          enabled: enabledRaw != null ? Boolean(enabledRaw) : true,
          sort_order: row.sort_order != null ? Number(row.sort_order) : idx + 1,
        };
      });
  };

  // Helper to extract IDs from mixed arrays
  const extractIds = (items: any): number[] => {
    if (!items || !Array.isArray(items)) return [];
    return items
      .map((item: any) => {
        if (typeof item === "number") return item;
        if (typeof item === "string") return parseInt(item) || 0;
        if (item && typeof item === "object") {
          return (
            item.id ||
            item.destination_id ||
            item.activity_id ||
            item.category_id ||
            0
          );
        }
        return 0;
      })
      .filter((id: number) => !isNaN(id) && id > 0);
  };

  // Helper to normalize itinerary days
  const normalizeItineraryDays = (days: any): any[] => {
    if (!days) return [];
    if (Array.isArray(days)) return days;
    if (typeof days === "string") {
      try {
        const parsed = JSON.parse(days);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Helper to normalize availability dates
  const normalizeAvailabilityDates = (dates: any): any[] => {
    if (!dates) return [];
    if (Array.isArray(dates)) return dates;
    if (typeof dates === "string") {
      try {
        const parsed = JSON.parse(dates);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Utility function to normalize gallery images
  const normalizeGalleryImages = (
    images: any,
  ): Array<{
    id: number;
    url: string;
    thumbnail_url?: string;
    alt_text?: string;
    caption?: string;
  }> => {
    if (!images) return [];
    if (Array.isArray(images)) {
      return images
        .map((img: any) => {
          if (typeof img === "string") {
            return { id: 0, url: img };
          }
          if (img && typeof img === "object") {
            return {
              id: img.id || img.image_id || 0,
              url: img.url || img.image_url || img.src || "",
              thumbnail_url: img.thumbnail_url || img.thumb_url || "",
              alt_text: img.alt_text || img.alt || "",
              caption: img.caption || img.title || "",
            };
          }
          return { id: 0, url: "" };
        })
        .filter((item: any) => item.url);
    }
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        return normalizeGalleryImages(parsed);
      } catch {
        return [{ id: 0, url: images }];
      }
    }
    return [];
  };

  // Helper to normalize FAQs
  const normalizeFaqs = (faqs: any): FAQ[] => {
    if (!faqs || !Array.isArray(faqs)) return [];
    return faqs
      .map((faq: any) => {
        if (faq && typeof faq === "object") {
          return {
            question: faq.question || "",
            answer: faq.answer || "",
          };
        }
        return { question: "", answer: "" };
      })
      .filter((faq: any) => faq.question && faq.answer);
  };

  useEffect(() => {
    if (!tripData || !isEditMode) {
      return;
    }

    // Preserve current itinerary_days and gallery_images if they exist and have content
    // This prevents wiping out data when user updates trip in itinerary builder
    const currentItineraryDays = formData.itinerary_days || [];
    const currentGalleryImages = formData.gallery_images || [];

    // Only use database data if current data is empty or if this is initial load
    const shouldPreserveItinerary = currentItineraryDays.length > 0;
    const shouldPreserveGallery = currentGalleryImages.length > 0;

    setFormData({
      title: tripData.title || "",
      slug: tripData.slug || "",
      description: tripData.description || "",
      highlights: normalizeHighlights(tripData.highlights),
      trip_details: tripData.trip_details || "",
      short_description: tripData.short_description || "",
      what_makes_special: tripData.what_makes_special || "",
      trip_story: tripData.trip_story || "",
      video_url: tripData.video_url || "",
      virtual_tour_url: tripData.virtual_tour_url || "",
      testimonial_review_ids: Array.isArray(tripData.testimonial_review_ids)
        ? tripData.testimonial_review_ids
        : [],
      destinations: extractIds(tripData.destinations || []),
      starting_location: tripData.starting_location || "",
      ending_location: tripData.ending_location || "",
      countries: Array.isArray(tripData.countries) ? tripData.countries : [],
      regions: Array.isArray(tripData.regions) ? tripData.regions : [],
      starting_latitude: tripData.starting_latitude?.toString() || "",
      starting_longitude: tripData.starting_longitude?.toString() || "",
      ending_latitude: tripData.ending_latitude?.toString() || "",
      ending_longitude: tripData.ending_longitude?.toString() || "",
      landmarks: Array.isArray(tripData.landmarks) ? tripData.landmarks : [],
      trip_type: (tripData.trip_type ||
        (tripData.duration_days &&
        parseInt(tripData.duration_days?.toString() || "0") === 1
          ? "single_day"
          : "multi_day")) as "single_day" | "multi_day" | "flexible",
      duration_days: tripData.duration_days?.toString() || "",
      duration_nights: tripData.duration_nights?.toString() || "",
      available_from: tripData.available_from || "",
      available_to: tripData.available_to || "",
      booking_window_days: tripData.booking_window_days?.toString() || "",
      seasonal_availability: tripData.seasonal_availability || "",
      best_season: tripData.best_season || "",
      peak_season: tripData.peak_season || "",
      off_season: tripData.off_season || "",
      activity_types: extractIds(tripData.activity_types || []),
      difficulty_level: tripData.difficulty_level?.toString() || "",
      trip_category: extractIds(tripData.trip_category || []),
      tags: Array.isArray(tripData.tags) ? tripData.tags : [],
      featured_priority: tripData.featured_priority || "none",
      accommodation_type: tripData.accommodation_type || "",
      meal_plan: tripData.meal_plan || "",
      accommodation_details: tripData.accommodation_details || "",
      transportation_included: tripData.transportation_included || false,
      pickup_location: tripData.pickup_location || "",
      dropoff_location: tripData.dropoff_location || "",
      transportation_details: tripData.transportation_details || "",
      pricing_type: (tripData.pricing_type ||
        (tripData.price_types &&
        Array.isArray(tripData.price_types) &&
        tripData.price_types.length > 0
          ? "traveler_based"
          : "regular")) as "regular" | "traveler_based",
      original_price: tripData.original_price?.toString() || "",
      discounted_price: tripData.discounted_price?.toString() || "",
      price_types: Array.isArray(tripData.price_types)
        ? tripData.price_types.map((pt: any) => ({
            category_id: Number(pt.category_id) || 0,
            original_price: pt.original_price?.toString() || "",
            discounted_price: pt.discounted_price?.toString() || "",
            is_default: Boolean(pt.is_default),
          }))
        : [],
      deposit_amount: tripData.deposit_amount?.toString() || "",
      deposit_percentage: tripData.deposit_percentage?.toString() || "",
      payment_terms: tripData.payment_terms || "",
      max_travelers: tripData.max_travelers?.toString() || "",
      min_travelers: tripData.min_travelers?.toString() || "",
      booking_deadline_hours: tripData.booking_deadline_hours || "",
      cancellation_policy: tripData.cancellation_policy || "",
      age_min: tripData.age_min?.toString() || "",
      age_max: tripData.age_max?.toString() || "",
      physical_requirements: tripData.physical_requirements || "",
      visa_requirements: tripData.visa_requirements || "",
      vaccination_requirements: tripData.vaccination_requirements || "",
      disable_booking: Boolean(tripData.custom_fields?.disable_booking),
      // tinyint(1) columns can serialize from PHP/wpdb as the string "0"/"1".
      // JS treats "0" as truthy, so a plain `value || false` would leave the
      // checkbox stuck on after the user un-checked + saved. Coerce explicitly.
      has_default_time_slots:
        tripData.has_default_time_slots === true
        || tripData.has_default_time_slots === 1
        || tripData.has_default_time_slots === "1",
      default_time_slots: Array.isArray(tripData.default_time_slots)
        ? tripData.default_time_slots
        : tripData.default_time_slots
          ? JSON.parse(tripData.default_time_slots)
          : [],
      departure_time: tripData.departure_time || "09:00",
      included_items: normalizeAmenityItems(tripData.included_items),
      excluded_items: normalizeAmenityItems(tripData.excluded_items),
      // Preserve current itinerary data if it exists, otherwise use database data
      itinerary_days: shouldPreserveItinerary
        ? currentItineraryDays
        : normalizeItineraryDays(tripData.itinerary_days),
      // Preserve current gallery data if it exists, otherwise use database data
      gallery_images: shouldPreserveGallery
        ? currentGalleryImages
        : normalizeGalleryImages(tripData.gallery_images),
      featured_image: tripData.featured_image
        ? Number(tripData.featured_image)
        : null,
      downloadable_items: normalizeDownloadableItems(
        tripData.downloadable_items,
      ),
      faqs: normalizeFaqs(tripData.faqs),
      frontend_tabs: Array.isArray(tripData.frontend_tabs)
        ? tripData.frontend_tabs
        : [
            // Core sections (always present) - in logical order
            {
              id: "overview",
              label: "Overview",
              enabled: true,
              order: 1,
              content_type: "overview",
              icon: { type: "icon", value: "book" },
            },
            {
              id: "itinerary",
              label: "Itinerary",
              enabled: true,
              order: 2,
              content_type: "itinerary",
              icon: { type: "icon", value: "calendar" },
            },
            {
              id: "included",
              label: "Included",
              enabled: true,
              order: 3,
              content_type: "included_excluded",
              icon: { type: "icon", value: "check" },
            },
            {
              id: "location",
              label: "Location",
              enabled: true,
              order: 4,
              content_type: "location",
              icon: { type: "icon", value: "map-pin" },
            },
            {
              id: "important_info",
              label: "Important Info",
              enabled: true,
              order: 5,
              content_type: "important_info",
              icon: { type: "icon", value: "info" },
            },

            // Conditional sections (enabled by default, shown conditionally on frontend)
            {
              id: "downloads",
              label: "Downloads",
              enabled: true,
              order: 6,
              content_type: "downloads",
              icon: { type: "icon", value: "download" },
            },
            {
              id: "faq",
              label: "FAQ",
              enabled: true,
              order: 7,
              content_type: "faq",
              icon: { type: "icon", value: "help-circle" },
            },
            {
              id: "trip_story",
              label: "Story",
              enabled: true,
              order: 8,
              content_type: "trip_story",
              custom_content: "",
              icon: { type: "icon", value: "book" },
            },
            {
              id: "what_makes_special",
              label: "Special",
              enabled: true,
              order: 9,
              content_type: "what_makes_special",
              custom_content: "",
              icon: { type: "icon", value: "star" },
            },
            {
              id: "testimonials",
              label: "Testimonials",
              enabled: true,
              order: 10,
              content_type: "testimonials",
              icon: { type: "icon", value: "message-circle" },
            },
          ],
      availability_dates: normalizeAvailabilityDates(
        tripData.availability_dates,
      ),
      status: (tripData.status || "draft") as
        | "draft"
        | "review"
        | "approved"
        | "publish"
        | "archived"
        | "suspended",
      scheduled_publish_date: tripData.scheduled_publish_date || "",
      scheduled_unpublish_date: tripData.scheduled_unpublish_date || "",
      version: tripData.version || 1,
      seasonal_auto_enable: tripData.seasonal_auto_enable || false,
      seasonal_enable_date: tripData.seasonal_enable_date || "",
      seasonal_disable_date: tripData.seasonal_disable_date || "",
      meta_title: tripData.meta_title || "",
      meta_description: tripData.meta_description || "",
      meta_keywords: tripData.meta_keywords || "",
      attributes: tripAttributesData || {},
    });

    if (tripData.featured_image_url && tripData.featured_image) {
      const numericId = Number(tripData.featured_image) || 0;
      setFeaturedImagePreview(tripData.featured_image_url);
      if (numericId > 0) {
        featuredImageCache.current[numericId] = tripData.featured_image_url;
      }
    } else if (!tripData.featured_image) {
      setFeaturedImagePreview("");
    }
  }, [tripData, tripAttributesData, destinationsData, isEditMode, tripId]);

  useEffect(() => {
    let isMounted = true;

    const resolveFeaturedImage = async () => {
      const attachmentId = formData.featured_image;

      if (!attachmentId) {
        setFeaturedImagePreview("");
        return;
      }

      const cachedUrl = featuredImageCache.current[attachmentId];
      if (cachedUrl) {
        setFeaturedImagePreview(cachedUrl);
        return;
      }

      if (!mediaBaseUrl) {
        setFeaturedImagePreview("");
        return;
      }

      setIsResolvingFeaturedImage(true);
      try {
        const data = await wpService.getMedia(attachmentId);
        const url = data?.source_url || "";
        if (url && isMounted) {
          featuredImageCache.current[attachmentId] = url;
          setFeaturedImagePreview(url);
        } else if (isMounted) {
          setFeaturedImagePreview("");
        }
      } catch (error) {
        console.error("Failed to resolve featured image URL:", error);
        if (isMounted) {
          setFeaturedImagePreview("");
        }
      } finally {
        if (isMounted) {
          setIsResolvingFeaturedImage(false);
        }
      }
    };

    resolveFeaturedImage();

    return () => {
      isMounted = false;
    };
  }, [formData.featured_image, mediaBaseUrl]);

  // Map errors to sections - also check for price_type errors
  const getSectionErrors = (sectionId: SectionId): string[] => {
    const errorMap: Record<SectionId, string[]> = {
      basic: [
        "title",
        "slug",
        "description",
        "featured_image",
        "trip_type",
        "duration_days",
        "duration_nights",
      ],
      location: ["destinations", "starting_location", "ending_location"],
      duration: ["available_from", "available_to", "booking_window_days"],
      pricing: ["original_price", "discounted_price", "price_types"],
      booking: ["min_travelers", "max_travelers", "age_min", "age_max"],
      attributes: ["attributes"],
      itinerary: ["itinerary_days"],
      included: ["included_items", "excluded_items"],
      media: ["gallery_images", "video_url", "virtual_tour_url"], // Removed featured_image - it's in basic section
      downloads: ["downloadable_items"],
      categorization: ["trip_category", "activity_types"],
      faqs: ["faqs"],
      seo: ["meta_title", "meta_description"],
      advanced: [],
    };

    const sectionFields = errorMap[sectionId] || [];
    const fieldErrors = sectionFields.filter((field) => errors[field]);

    // Also check for price_type errors (they have dynamic keys like price_type_0_original)
    if (sectionId === "pricing") {
      const priceTypeErrors = Object.keys(errors).filter((key) =>
        key.startsWith("price_type_"),
      );
      return [...fieldErrors, ...priceTypeErrors];
    }

    return fieldErrors;
  };

  // Define sections - Reorganized for beginner-friendly UX
  // PHASE 1: ESSENTIALS (Must complete for publishable trip)
  const essentialsSections: Section[] = [
    // 1. Trip Basics - What you're offering
    {
      id: "basic",
      label: __("Trip Basics", "yatra"),
      icon: FileText,
      required: true,
      completed: !!(formData.title?.trim() && formData.slug?.trim()),
      hasErrors: getSectionErrors("basic").length > 0,
    },

    // 2. Location & Route - Where it happens
    {
      id: "location",
      label: __("Location & Route", "yatra"),
      icon: MapPin,
      required: false,
      completed: !!(formData.destinations.length > 0),
      hasErrors: getSectionErrors("location").length > 0,
    },

    // 3. Pricing - How much it costs
    {
      id: "pricing",
      label: __("Pricing", "yatra"),
      icon: DollarSign,
      required: true,
      completed:
        formData.pricing_type === "regular"
          ? !!(
              formData.original_price && parseFloat(formData.original_price) > 0
            )
          : formData.price_types.some(
              (pt) => pt.original_price && parseFloat(pt.original_price) > 0,
            ),
      hasErrors: getSectionErrors("pricing").length > 0,
    },

    // 4. Availability & Booking - When available + booking rules (merged duration + booking)
    {
      id: "duration",
      label: __("Availability & Booking", "yatra"),
      icon: Calendar,
      required: false,
      completed: !!(
        formData.available_from ||
        formData.available_to ||
        (formData.min_travelers && formData.max_travelers)
      ),
      hasErrors:
        getSectionErrors("duration").length > 0 ||
        getSectionErrors("booking").length > 0,
    },
  ];

  // PHASE 2: DETAILS (Enhance trip quality)
  const detailsSections: Section[] = [
    // 5. Trip Details - Description + Itinerary + Included/Excluded (merged 3 sections)
    {
      id: "itinerary",
      label: __("Trip Details", "yatra"),
      icon: BookOpen,
      required: false,
      completed:
        formData.itinerary_days.length > 0 ||
        formData.included_items.length > 0 ||
        formData.excluded_items.length > 0,
      hasErrors:
        getSectionErrors("itinerary").length > 0 ||
        getSectionErrors("included").length > 0,
    },
  ];

  // PHASE 3: OPTIMIZATION (Improve discoverability)
  const optimizationSections: Section[] = [
    // 6. Media & Gallery - Photos, videos, testimonials
    {
      id: "media",
      label: __("Media & Gallery", "yatra"),
      icon: Image,
      required: false,
      completed: formData.gallery_images.length > 0 || !!formData.video_url,
      hasErrors: getSectionErrors("media").length > 0,
    },
    ...(showDownloadsUI
      ? ([
          {
            id: "downloads",
            label: __("Downloads", "yatra"),
            icon: Download,
            required: false,
            completed: (formData.downloadable_items || []).length > 0,
            hasErrors: getSectionErrors("downloads").length > 0,
          },
        ] as Section[])
      : []),

    // 7. Categories & Attributes - Classification + Custom Attributes (merged 2 sections)
    {
      id: "categorization",
      label: __("Categories & Attributes", "yatra"),
      icon: Tag,
      required: false,
      completed: !!(
        formData.trip_category ||
        formData.activity_types.length > 0 ||
        formData.tags.length > 0 ||
        (formData.attributes && Object.keys(formData.attributes).length > 0)
      ),
      hasErrors:
        getSectionErrors("categorization").length > 0 ||
        getSectionErrors("attributes").length > 0,
    },

    // 8. SEO & Marketing - SEO + FAQs (merged, fixed duplicate)
    {
      id: "seo",
      label: __("SEO & Marketing", "yatra"),
      icon: Search,
      required: false,
      completed: !!(
        formData.meta_title ||
        formData.meta_description ||
        formData.faqs.length > 0
      ),
      hasErrors:
        getSectionErrors("seo").length > 0 ||
        getSectionErrors("faqs").length > 0,
    },
  ];

  // PHASE 4: ADVANCED (Power users only)
  const advancedSections: Section[] = [
    // 9. Advanced Settings - Publishing, scheduling, technical
    {
      id: "advanced",
      label: __("Advanced Settings", "yatra"),
      icon: Settings,
      required: false,
      completed: false,
      hasErrors: false,
    },
  ];

  const allSections = [
    ...essentialsSections,
    ...detailsSections,
    ...optimizationSections,
    ...advancedSections,
  ];
  const currentStepIndex = allSections.findIndex(
    (s) => s.id === currentSection,
  );

  // Navigation helpers
  const goToNextSection = () => {
    if (currentStepIndex < allSections.length - 1) {
      setCurrentSection(allSections[currentStepIndex + 1].id);
    }
  };

  const goToPreviousSection = () => {
    if (currentStepIndex > 0) {
      setCurrentSection(allSections[currentStepIndex - 1].id);
    }
  };

  // Smart defaults - Auto-calculate nights from days (only if nights is empty)
  useEffect(() => {
    if (
      formData.duration_days &&
      formData.trip_type === "multi_day" &&
      (!formData.duration_nights || formData.duration_nights === "")
    ) {
      const days = parseInt(formData.duration_days);
      if (days > 0 && !isNaN(days)) {
        setFormData((prev) => ({
          ...prev,
          duration_nights: String(Math.max(0, days - 1)),
        }));
      }
    }
  }, [formData.duration_days, formData.trip_type]);

  // Auto-calculate days from nights (only if days is empty)
  useEffect(() => {
    if (
      formData.duration_nights &&
      formData.trip_type === "multi_day" &&
      (!formData.duration_days || formData.duration_days === "")
    ) {
      const nights = parseInt(formData.duration_nights);
      if (nights > 0 && !isNaN(nights)) {
        setFormData((prev) => ({ ...prev, duration_days: String(nights + 1) }));
      }
    }
  }, [formData.duration_nights, formData.trip_type]);

  // Auto-generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value),
    }));
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: "" }));
    }
  };

  const handleFieldChange = (field: keyof TripFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "featured_image") {
      // Handle explicit null (when removing image)
      if (value === null || value === "" || value === undefined) {
        setFeaturedImagePreview("");
      } else {
        const numericValue = typeof value === "number" ? value : Number(value);
        if (!numericValue) {
          setFeaturedImagePreview("");
        } else if (featuredImageCache.current[numericValue]) {
          setFeaturedImagePreview(featuredImageCache.current[numericValue]);
        }
      }
    }
  };

  const handleHighlightAdd = () => {
    setShowHighlightModal(true);
    setModalInput({ text: "", question: "", answer: "" });
  };

  const handleHighlightSave = () => {
    if (modalInput.text && modalInput.text.trim()) {
      setFormData((prev) => ({
        ...prev,
        highlights: [...prev.highlights, modalInput.text.trim()],
      }));
      setShowHighlightModal(false);
      setModalInput({ text: "", question: "", answer: "" });
    }
  };

  const handleHighlightRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  // Included/Excluded handlers - will be integrated into ItinerarySection component
  // Keeping for future integration when included/excluded are merged into itinerary section
  // const handleIncludedAdd = () => { ... };
  // const handleIncludedRemove = (index: number) => { ... };
  // const handleExcludedAdd = () => { ... };
  // const handleExcludedRemove = (index: number) => { ... };

  const handleFAQAdd = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const handleFAQRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const handleFAQChange = (
    index: number,
    field: "question" | "answer",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) =>
        i === index ? { ...faq, [field]: value } : faq,
      ),
    }));
  };

  const handleGalleryAdd = () => {
    // Use WordPress media library with multiple selection
    if (window.wp && window.wp.media) {
      const mediaUploader = window.wp.media({
        title: __("Select Gallery Images", "yatra"),
        button: { text: __("Add to Gallery", "yatra") },
        multiple: true, // Allow multiple image selection
        library: { type: "image" },
      });

      mediaUploader.on("select", () => {
        const selection = mediaUploader.state().get("selection");
        const newImages: Array<{
          id: number;
          url: string;
          thumbnail_url?: string;
          alt_text?: string;
          caption?: string;
        }> = [];

        selection.each((attachment: any) => {
          const image = attachment.toJSON();
          if (image.url) {
            newImages.push({
              id: image.id || 0,
              url: image.url,
              thumbnail_url:
                image.sizes?.thumbnail?.url ||
                image.sizes?.medium?.url ||
                image.url,
              alt_text: image.alt || "",
              caption: image.caption || "",
            });
          }
        });

        if (newImages.length > 0) {
          setFormData((prev) => ({
            ...prev,
            gallery_images: [...prev.gallery_images, ...newImages],
          }));
        }
      });

      prepareWordPressMediaFrameOpen();
      mediaUploader.open();
    } else {
      // Fallback for when wp.media is not available
      showToast(
        __(
          "Media library not available. Please ensure you are logged in as admin.",
          "yatra",
        ),
        "error",
      );
    }
  };

  const handleGalleryRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  const handleGalleryReorder = (fromIndex: number, toIndex: number) => {
    setFormData((prev) => {
      const newImages = [...prev.gallery_images];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return { ...prev, gallery_images: newImages };
    });
  };

  const handleDownloadableItemAdd = () => {
    setFormData((prev) => {
      const nextOrder = (prev.downloadable_items?.length || 0) + 1;
      return {
        ...prev,
        downloadable_items: [
          ...(prev.downloadable_items || []),
          {
            id: null,
            title: "",
            description: "",
            attachment_id: null,
            attachment_url: "",
            attachment_title: "",
            visibility: "booked_only",
            enabled: true,
            sort_order: nextOrder,
          },
        ],
      };
    });
  };

  const handleDownloadableItemRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      downloadable_items: (prev.downloadable_items || []).filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const handleDownloadableItemMove = (fromIndex: number, toIndex: number) => {
    setFormData((prev) => {
      const items = [...(prev.downloadable_items || [])];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);

      const normalized = items.map((item, idx) => ({
        ...item,
        sort_order: idx + 1,
      }));

      return { ...prev, downloadable_items: normalized };
    });
  };

  const handleDownloadableItemChange = (
    index: number,
    field: keyof DownloadableItem,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      downloadable_items: (prev.downloadable_items || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleDownloadableItemSelectFile = (index: number) => {
    if (window.wp && window.wp.media) {
      const mediaUploader = window.wp.media({
        title: __("Select File", "yatra"),
        button: { text: __("Use this file", "yatra") },
        multiple: false,
      });

      mediaUploader.on("select", () => {
        const selection = mediaUploader.state().get("selection");
        const attachment = selection.first();
        if (!attachment) return;
        const file = attachment.toJSON();

        handleDownloadableItemChange(index, "attachment_id", file.id || null);
        handleDownloadableItemChange(index, "attachment_url", file.url || "");
        handleDownloadableItemChange(
          index,
          "attachment_title",
          file.title || file.filename || "",
        );
      });

      prepareWordPressMediaFrameOpen();
      mediaUploader.open();
    } else {
      // Fallback for when wp.media is not available
      showToast(
        __(
          "Media library not available. Please ensure you are logged in as admin.",
          "yatra",
        ),
        "error",
      );
    }
  };

  const handlePriceTypeAdd = (categoryId: number) => {
    // Check if category already exists (compare as numbers to handle string/number mismatch)
    if (
      formData.price_types.some(
        (pt) => Number(pt.category_id) === Number(categoryId),
      )
    ) {
      showToast(
        __("This category already has pricing set", "yatra"),
        "warning",
      );
      return;
    }
    setFormData((prev) => ({
      ...prev,
      price_types: [
        ...prev.price_types,
        {
          category_id: categoryId,
          original_price: "",
          discounted_price: "",
          is_default: false,
        },
      ],
    }));
  };

  const handlePriceTypeRemove = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      price_types: prev.price_types.filter(
        (pt) => Number(pt.category_id) !== Number(categoryId),
      ),
    }));
  };

  const handlePriceTypeChange = (
    categoryId: number,
    field: "original_price" | "discounted_price",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      price_types: prev.price_types.map((pt) =>
        Number(pt.category_id) === Number(categoryId)
          ? { ...pt, [field]: value }
          : pt,
      ),
    }));
  };

  const handlePriceTypeDefaultChange = (
    categoryId: number,
    isDefault: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      price_types: prev.price_types.map((pt) => {
        if (Number(pt.category_id) === Number(categoryId)) {
          return { ...pt, is_default: isDefault };
        }
        // Only allow one default at a time.
        return isDefault ? { ...pt, is_default: false } : pt;
      }),
    }));
  };

  // Frontend Tabs Handlers
  const handleTabToggle = (tabId: string) => {
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map((tab) =>
        tab.id === tabId ? { ...tab, enabled: !tab.enabled } : tab,
      ),
    }));
  };

  // Handle dummy data fill
  const handleFillDummyData = () => {
    // Cycle through dummy data sets
    const nextIndex = (dummyDataIndex + 1) % dummyTripsData.length;
    setDummyDataIndex(nextIndex);

    const dummyData = dummyTripsData[nextIndex];

    // Populate form with dummy data
    setFormData({
      ...dummyData,
      // Ensure arrays are properly set
      destinations: dummyData.destinations || [],
      activity_types: dummyData.activity_types || [],
      price_types: dummyData.price_types || [],
      included_items: dummyData.included_items || [],
      excluded_items: dummyData.excluded_items || [],
      highlights: dummyData.highlights || [],
      faqs: dummyData.faqs || [],
      gallery_images: dummyData.gallery_images || [],
      itinerary_days: dummyData.itinerary_days || [],
      tags: dummyData.tags || [],
      testimonial_review_ids: dummyData.testimonial_review_ids || [],
      countries: dummyData.countries || [],
      regions: dummyData.regions || [],
      landmarks: dummyData.landmarks || [],
      availability_dates: dummyData.availability_dates || [],
      frontend_tabs: dummyData.frontend_tabs || [],
      has_default_time_slots: dummyData.has_default_time_slots || false,
      default_time_slots: dummyData.default_time_slots || [],
      departure_time: dummyData.departure_time || "09:00",
      downloadable_items: dummyData.downloadable_items || [],
    });

    // Show toast notification
    showToast(
      __("Dummy data filled", "yatra") +
        ` (${nextIndex + 1}/${dummyTripsData.length})`,
      "success",
    );
  };

  const handleTabLabelChange = (tabId: string, label: string) => {
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map((tab) =>
        tab.id === tabId ? { ...tab, label } : tab,
      ),
    }));
  };

  const handleTabMove = (tabId: string, direction: "up" | "down") => {
    setFormData((prev) => {
      const tabs = [...prev.frontend_tabs];
      const index = tabs.findIndex((t) => t.id === tabId);
      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= tabs.length) return prev;

      [tabs[index], tabs[newIndex]] = [tabs[newIndex], tabs[index]];
      // Update order
      tabs.forEach((tab, i) => {
        tab.order = i + 1;
      });

      return { ...prev, frontend_tabs: tabs };
    });
  };

  const handleTabRemove = (tabId: string) => {
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs
        .filter((tab) => tab.id !== tabId)
        .map((tab, i) => ({ ...tab, order: i + 1 })),
    }));
  };

  const handleTabAdd = () => {
    const newTabId = `custom_${Date.now()}`;
    const maxOrder = Math.max(...formData.frontend_tabs.map((t) => t.order), 0);
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: [
        ...prev.frontend_tabs,
        {
          id: newTabId,
          label: __("New Tab", "yatra"),
          enabled: true,
          order: maxOrder + 1,
          content_type: "custom",
          custom_content: "",
        },
      ],
    }));
  };

  const handleTabContentTypeChange = (
    tabId: string,
    contentType: FrontendTab["content_type"],
  ) => {
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map((tab) =>
        tab.id === tabId ? { ...tab, content_type: contentType } : tab,
      ),
    }));
  };

  const handleTabCustomContentChange = (tabId: string, content: string) => {
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map((tab) =>
        tab.id === tabId ? { ...tab, custom_content: content } : tab,
      ),
    }));
  };

  const handleTabIconChange = (tabId: string, icon: IconPickerValue | null) => {
    setFormData((prev) => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map((tab) =>
        tab.id === tabId ? { ...tab, icon } : tab,
      ),
    }));
  };

  // Drag and drop handlers
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (tabId: string) => {
    setDragOverTab(tabId);
  };

  const handleDragLeave = () => {
    setDragOverTab(null);
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    setDragOverTab(null);

    if (!draggedTab || draggedTab === targetTabId) {
      setDraggedTab(null);
      return;
    }

    setFormData((prev) => {
      const tabs = [...prev.frontend_tabs];
      const draggedIndex = tabs.findIndex((t) => t.id === draggedTab);
      const targetIndex = tabs.findIndex((t) => t.id === targetTabId);

      if (draggedIndex === -1 || targetIndex === -1) {
        return prev;
      }

      // Remove dragged tab and insert at new position
      const [draggedTabObj] = tabs.splice(draggedIndex, 1);
      tabs.splice(targetIndex, 0, draggedTabObj);

      // Update order values
      tabs.forEach((tab, i) => {
        tab.order = i + 1;
      });

      return { ...prev, frontend_tabs: tabs };
    });

    setDraggedTab(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
  };

  const buildEssentialFieldErrors = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = __("Title is required", "yatra");
    }

    if (!formData.slug.trim()) {
      newErrors.slug = __("Slug is required", "yatra");
    } else if (!/^[\p{L}\p{N}-]+$/u.test(formData.slug)) {
      newErrors.slug = __(
        "Slug can only contain letters, numbers, and hyphens",
        "yatra",
      );
    }

    return newErrors;
  };

  const validateForm = (): boolean => {
    const newErrors = buildEssentialFieldErrors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (
      data: TripFormData & { status?: "draft" | "publish" },
    ) => {
      const payload = {
        title: data.title.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        short_description: data.short_description.trim(),
        highlights: data.highlights,
        trip_details: data.trip_details.trim(),
        what_makes_special: data.what_makes_special.trim(),
        trip_story: data.trip_story.trim(),
        video_url: data.video_url.trim(),
        virtual_tour_url: data.virtual_tour_url.trim(),
        testimonial_review_ids: Array.isArray(data.testimonial_review_ids)
          ? data.testimonial_review_ids.filter(
              (id): id is number => id !== null && id !== undefined && id > 0,
            )
          : [],
        destinations: data.destinations || [], // Array of destination IDs
        starting_location: data.starting_location.trim(),
        ending_location: data.ending_location.trim(),
        countries: data.countries || [],
        regions: data.regions || [],
        starting_latitude: data.starting_latitude
          ? parseFloat(data.starting_latitude)
          : null,
        starting_longitude: data.starting_longitude
          ? parseFloat(data.starting_longitude)
          : null,
        ending_latitude: data.ending_latitude
          ? parseFloat(data.ending_latitude)
          : null,
        ending_longitude: data.ending_longitude
          ? parseFloat(data.ending_longitude)
          : null,
        landmarks: data.landmarks || [],
        trip_type: data.trip_type,
        duration_days: data.duration_days ? parseInt(data.duration_days) : null,
        duration_nights: data.duration_nights
          ? parseInt(data.duration_nights)
          : null,
        available_from: data.available_from || null,
        available_to: data.available_to || null,
        booking_window_days: data.booking_window_days
          ? parseInt(data.booking_window_days)
          : null,
        seasonal_availability: data.seasonal_availability || "",
        best_season: data.best_season.trim(),
        peak_season: data.peak_season.trim(),
        off_season: data.off_season.trim(),
        activity_types: data.activity_types || [], // Array of activity IDs
        difficulty_level: parseInt(data.difficulty_level) || null,
        trip_category: (() => {
          const rawCategories = data.trip_category || [];

          // If no trip categories available yet, don't filter - send raw data
          if (tripCategories.length === 0) {
            return rawCategories;
          }

          // Filter valid categories - save exactly what user selects
          const validCategories = rawCategories.filter((_catId) => {
            // Always return true - save all selected categories regardless of availability
            return true;
          });

          return validCategories;
        })(),
        tags: data.tags || [],
        accommodation_type: data.accommodation_type || "",
        meal_plan: data.meal_plan || "",
        accommodation_details: data.accommodation_details.trim(),
        transportation_included: data.transportation_included || false,
        pickup_location: data.pickup_location.trim(),
        dropoff_location: data.dropoff_location.trim(),
        transportation_details: data.transportation_details.trim(),
        pricing_type: data.pricing_type,
        original_price:
          data.pricing_type === "regular"
            ? data.original_price
              ? parseFloat(data.original_price)
              : null
            : null,
        discounted_price:
          data.pricing_type === "regular"
            ? data.discounted_price
              ? parseFloat(data.discounted_price)
              : null
            : null,
        price_types:
          data.pricing_type === "traveler_based"
            ? data.price_types.map((pt) => ({
                category_id: pt.category_id,
                is_default: Boolean((pt as any).is_default),
                original_price: pt.original_price
                  ? parseFloat(pt.original_price)
                  : 0,
                discounted_price: pt.discounted_price
                  ? parseFloat(pt.discounted_price)
                  : null,
              }))
            : [],
        deposit_amount: data.deposit_amount
          ? parseFloat(data.deposit_amount)
          : null,
        deposit_percentage: data.deposit_percentage
          ? parseFloat(data.deposit_percentage)
          : null,
        payment_terms: data.payment_terms.trim(),
        max_travelers: data.max_travelers ? parseInt(data.max_travelers) : null,
        min_travelers: data.min_travelers ? parseInt(data.min_travelers) : null,
        booking_deadline_hours: data.booking_deadline_hours || null,
        cancellation_policy: data.cancellation_policy || "",
        custom_fields: { disable_booking: data.disable_booking },
        age_min: data.age_min ? parseInt(data.age_min) : null,
        age_max: data.age_max ? parseInt(data.age_max) : null,
        physical_requirements: data.physical_requirements.trim(),
        visa_requirements: data.visa_requirements.trim(),
        vaccination_requirements: data.vaccination_requirements.trim(),
        has_default_time_slots: data.has_default_time_slots || false,
        default_time_slots: JSON.stringify(data.default_time_slots || []),
        departure_time: data.departure_time || "09:00",
        included_items: (data.included_items || [])
          .map((item) => ({
            title: item.title?.trim() || "",
            description: item.description?.trim() || "",
          }))
          .filter((item) => item.title),
        excluded_items: (data.excluded_items || [])
          .map((item) => ({
            title: item.title?.trim() || "",
            description: item.description?.trim() || "",
          }))
          .filter((item) => item.title),
        itinerary_days: data.itinerary_days || [],
        gallery_images: data.gallery_images || [],
        featured_image: data.featured_image ?? null,
        faqs: data.faqs || [],
        frontend_tabs: data.frontend_tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          enabled: tab.enabled,
          order: tab.order,
          content_type: tab.content_type,
          custom_content: tab.custom_content || null,
          icon: tab.icon || null,
        })),
        availability_dates: data.availability_dates.map((avail) => ({
          id: avail.id,
          departure_date: avail.departure_date || null,
          arrival_date: avail.arrival_date || null,
          seats_remaining: avail.seats_remaining || null,
          original_price: avail.original_price
            ? parseFloat(avail.original_price)
            : null,
          discounted_price: avail.discounted_price
            ? parseFloat(avail.discounted_price)
            : null,
          discount_percentage: avail.discount_percentage
            ? parseFloat(avail.discount_percentage)
            : null,
          status: avail.status || "available",
          from_location: avail.from_location || null,
          to_location: avail.to_location || null,
          from_latitude: avail.from_latitude || null,
          from_longitude: avail.from_longitude || null,
          to_latitude: avail.to_latitude || null,
          to_longitude: avail.to_longitude || null,
        })),
        status: data.status === "publish" ? "publish" : "draft",
        scheduled_publish_date: data.scheduled_publish_date || null,
        scheduled_unpublish_date: data.scheduled_unpublish_date || null,
        version: data.version || 1,
        seasonal_auto_enable: data.seasonal_auto_enable || false,
        seasonal_enable_date: data.seasonal_enable_date || null,
        seasonal_disable_date: data.seasonal_disable_date || null,
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
        meta_keywords: data.meta_keywords || "",
        attributes: data.attributes || {},
        featured_priority: data.featured_priority,
      };

      if (showDownloadsUI) {
        (payload as any).downloadable_items = (data.downloadable_items || [])
          .map((item, idx) => ({
            id: item.id ?? null,
            title: (item.title || "").trim(),
            description: item.description || "",
            attachment_id: item.attachment_id ?? null,
            visibility: item.visibility || "booked_only",
            enabled: item.enabled !== false,
            sort_order: item.sort_order != null ? item.sort_order : idx + 1,
            attachment_url: item.attachment_url || "",
            attachment_title: item.attachment_title || "",

            // Prefixed keys (requested)
            download_title: (item.title || "").trim(),
            download_description: item.description || "",
            download_visibility: item.visibility || "booked_only",
            download_enabled: item.enabled !== false,
            download_file: item.attachment_id ?? null,
          }))
          .filter((item) => item.title);
      }

      if (isEditMode && tripId) {
        const response = await apiClient.put(`/trips/${tripId}`, payload);
        return response.data || response;
      } else {
        const response = await apiClient.post("/trips", payload);
        return response.data || response;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      // Force refetch the trip data immediately
      queryClient.refetchQueries({ queryKey: ["trip", tripId] });
      setIsSubmitting(false);

      // Show success message - different for edit vs create mode
      let successMessage: string;
      if (isEditMode) {
        // Edit mode: updating existing trip
        successMessage =
          variables.status === "publish"
            ? __("Trip updated and published successfully", "yatra")
            : __("Trip updated successfully", "yatra");
      } else {
        // Create mode: creating new trip
        successMessage =
          variables.status === "publish"
            ? __("Trip created and published successfully", "yatra")
            : __("Trip saved as draft successfully", "yatra");
      }
      showToast(successMessage, "success");

      // Only redirect when creating a NEW trip - stay on page when editing
      if (!isEditMode && data?.id) {
        // If creating new trip, redirect to edit mode so user can continue editing
        setTimeout(() => {
          window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=trips&action=edit&id=${data.id}`;
        }, 1000);
      }
      // When editing (isEditMode), always stay on the same page - no redirect
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        __("An error occurred while saving", "yatra");
      showToast(errorMessage, "error");
      setErrors({ submit: errorMessage });
      setIsSubmitting(false);
    },
  });

  // Light validation for draft saves (only essential fields)
  const validateDraft = (): boolean => {
    const newErrors = buildEssentialFieldErrors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validateDraft()) {
      showToast(
        __("Please add a trip title and URL before saving.", "yatra"),
        "error",
      );
      return;
    }
    setIsSubmitting(true);
    saveMutation.mutate({ ...formData, status: "draft" });
  };

  const handlePublish = async () => {
    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        showToast(
          __("Trip title and slug are required before publishing.", "yatra"),
          "error",
        );
        const errorElement = document.querySelector(
          `[name="${firstError}"], #${firstError}`,
        );
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }
    setIsSubmitting(true);
    saveMutation.mutate({ ...formData, status: "publish" });
  };

  // Enter should trigger publish/update (skip multiline and interactive controls)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey)
        return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tag = target.tagName.toLowerCase();
      const isTextarea = tag === "textarea";
      const isButton = tag === "button";
      const isLink = tag === "a";
      const isContentEditable =
        target.getAttribute("contenteditable") === "true";

      // Ignore Enter in multiline or interactive elements
      if (isTextarea || isButton || isLink || isContentEditable) return;

      const inputType = (target as HTMLInputElement).type;
      if (["submit", "button", "file"].includes(inputType)) return;

      e.preventDefault();
      if (!isSubmitting) {
        handlePublish();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, handlePublish]);

  // Using static revisions data for UI only
  const revisions = dummyRevisions;
  const isLoadingRevisions = false;

  const handlePreview = async () => {
    const slug = (formData.slug || "").trim();
    if (!slug) {
      showToast(
        __(
          "Trip slug is missing. Please add a slug before previewing.",
          "yatra",
        ),
        "error",
      );
      return;
    }

    const siteUrl = (window as any)?.yatraAdmin?.siteUrl || "";
    const { plainUrl, prettyUrl } = buildYatraSinglePublicUrls({
      entity: "trip",
      slug,
      siteUrl,
      bases: settingsData as Record<string, unknown> | null,
    });

    if (isWordPressPlainPermalink()) {
      window.open(plainUrl, "_blank", "noopener,noreferrer");
      return;
    }

    let apiPermalink = (tripData as any)?.permalink || (tripData as any)?.url;

    if (!apiPermalink && tripId) {
      try {
        const detail = await apiClient.get(`/trips/${tripId}`);
        apiPermalink =
          (detail as any)?.permalink || (detail as any)?.url || apiPermalink;
      } catch (error) {
        // fall through to prettyUrl
      }
    }

    if (apiPermalink) {
      window.open(apiPermalink, "_blank", "noopener,noreferrer");
      return;
    }

    window.open(prettyUrl, "_blank", "noopener,noreferrer");
  };

  const handleRevisionClick = (revisionId: number) => {
    setSelectedRevisionId(revisionId);
    setShowRevisionConfirm(true);
  };

  const handleRevisionConfirm = () => {
    // UI only - no actual functionality
    if (selectedRevisionId) {
      showToast(__("Revision feature is coming soon", "yatra"), "info");
    }
    setShowRevisionConfirm(false);
    setShowRevisionsDialog(false);
    setSelectedRevisionId(null);
  };

  // Skeleton loader for edit mode
  if (isEditMode && isLoadingTrip) {
    return (
      <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="min-w-0">
              <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="flex items-center gap-3">
                <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-9 w-36 bg-blue-200 dark:bg-blue-800 rounded animate-pulse" />
          </div>
        </div>

        {/* Navigation Bar Skeleton */}
        <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex-1 flex flex-col items-center gap-1 max-w-md mx-4">
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="h-2.5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Skeleton */}
          <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
            <div className="p-5 pb-8 space-y-6">
              {/* Essentials Section Skeleton */}
              <div>
                <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3 px-1" />
                <div className="space-y-0.5">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`essentials-${i}`}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-md"
                    >
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" />
                      <div className="h-4 flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Marketing Section Skeleton */}
              <div>
                <div className="h-3.5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3 px-1" />
                <div className="space-y-0.5">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={`marketing-${i}`}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-md"
                    >
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" />
                      <div className="h-4 flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Lifecycle Section Skeleton */}
              <div>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-md">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" />
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Form Area Skeleton */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Section Header Skeleton */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-6 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />

              {/* Form Fields Skeleton */}
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Title Field */}
                  <div className="space-y-2">
                    <div className="h-3.5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>

                  {/* Slug Field */}
                  <div className="space-y-2">
                    <div className="h-3.5 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>

                  {/* Description Field */}
                  <div className="space-y-2">
                    <div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>

                  {/* Featured Image Skeleton */}
                  <div className="space-y-2">
                    <div className="h-3.5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  </div>

                  {/* Grid Fields Skeleton */}
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={`grid-${i}`} className="space-y-3">
                        <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEditMode && tripError) {
    const requestInfo =
      tripErrorContext.requestInfo || (tripError as any)?.config || {};
    const method = (requestInfo.method || "GET").toUpperCase?.() || "GET";
    const url = requestInfo.url || (tripError as any)?.config?.url || "";
    const payload =
      requestInfo.payload || (tripError as any)?.config?.data || "";
    const composedErrorText = `Method: ${method}\nURL: ${url}\nPayload: ${payload || "N/A"}\n\n${tripErrorContext.details || ""}`;

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-5xl px-6 py-12">
          <div className="relative flex flex-col items-center text-center gap-4 rounded-2xl border border-dashed border-[#fddfe1] bg-gradient-to-br from-[#fff7f8] via-white to-[#fff9f5] p-10 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#ffdede] flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L2.82 17a2 2 0 001.71 3h14.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-gray-900">
                {__("Error Loading Trips", "yatra")}
              </h2>
              <p className="text-sm text-gray-600">
                {__(
                  "We couldn’t connect to the trips service. Please refresh or try again shortly.",
                  "yatra",
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["trip", tripId] })
                }
              >
                {__("Try again", "yatra")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open(
                      "https://wordpress.org/support/plugin/yatra",
                      "_blank",
                    );
                  }
                }}
              >
                {__("Visit support center", "yatra")}
              </Button>
            </div>

            <div className="w-full mt-10">
              <div className="relative w-full text-left rounded-2xl border border-gray-200 bg-white shadow-sm space-y-0">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-800">
                    {__("Technical details", "yatra")}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    onClick={() =>
                      copyErrorDetailsToClipboard(composedErrorText)
                    }
                  >
                    {copiedErrorDetails ? (
                      <>
                        <Check className="w-4 h-4" />
                        {__("Copied", "yatra")}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        {__("Copy details", "yatra")}
                      </>
                    )}
                  </Button>
                </div>
                <div className="px-5 py-3 border-b border-gray-200 space-y-2 text-sm text-left text-gray-800">
                  <div>
                    <span className="font-medium">
                      {__("Method:", "yatra")}
                    </span>{" "}
                    <span className="font-mono">{method}</span>
                  </div>
                  <div className="break-all">
                    <span className="font-medium">{__("URL:", "yatra")}</span>{" "}
                    <span className="font-mono">
                      {url || __("N/A", "yatra")}
                    </span>
                  </div>
                  {payload && (
                    <div>
                      <span className="font-medium block mb-1">
                        {__("Payload:", "yatra")}
                      </span>
                      <pre className="max-h-40 overflow-auto px-3 py-2 rounded bg-gray-50 text-xs font-mono text-gray-900 whitespace-pre-wrap border border-gray-200">
                        {payload}
                      </pre>
                    </div>
                  )}
                </div>
                <pre className="max-h-56 overflow-auto px-5 py-3 text-xs leading-relaxed font-mono text-gray-900 whitespace-pre-wrap bg-white">
                  {tripErrorContext.details ||
                    JSON.stringify(
                      {
                        message:
                          tripError instanceof Error
                            ? tripError.message
                            : __("Failed to load trip data", "yatra"),
                        method,
                        url,
                        payload,
                      },
                      null,
                      2,
                    )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (currentSection) {
      case "basic":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Basic Information", "yatra")}
              </h2>
              <Badge
                variant="outline"
                className="ml-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                {__("Start Here", "yatra")}
              </Badge>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-3 rounded-r-md mb-6">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                {__("💡 Getting Started", "yatra")}
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {__(
                  "Only the Trip Title and Trip URL are required to create a draft. Everything else is optional for now, but filling it in is highly recommended for better discovery and conversions.",
                  "yatra",
                )}
              </p>
            </div>

            {/* Essential Fields - Single View (No Tabs) */}
            <div className="space-y-6">
              {/* Tour Title */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="title"
                    className="block text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5"
                  >
                    {__("Trip Title", "yatra")}
                    <Badge
                      variant="outline"
                      className="ml-1 text-[10px] px-1.5 py-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                    >
                      {__("Required", "yatra")}
                    </Badge>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
                      title={__(
                        "A catchy title that describes your trip. Recommended: 50-60 characters for best SEO results.",
                        "yatra",
                      )}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </label>
                  <span
                    className={`text-xs font-medium ${
                      formData.title.length > 60
                        ? "text-red-600 dark:text-red-400"
                        : formData.title.length >= 50
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {formData.title.length}/60
                  </span>
                </div>
                <HelpText
                  text={__(
                    '💡 Tip: Include your destination and trip length. Example: "Bali Beach Retreat - 7 Days" or "Paris City Tour - Half Day"',
                    "yatra",
                  )}
                  className="mb-2"
                />
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={__("e.g., Bali Beach Retreat - 7 Days", "yatra")}
                  maxLength={100}
                  className={`${errors.title ? "border-red-500" : formData.title && formData.title.length <= 60 ? "border-green-500" : ""} transition-colors`}
                  required
                />
                {errors.title ? (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                ) : (
                  formData.title &&
                  formData.title.length > 60 && (
                    <p className="mt-1.5 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {__(
                        "Title is longer than recommended for SEO (60 characters)",
                        "yatra",
                      )}
                    </p>
                  )
                )}
              </div>

              {/* URL Slug */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="slug"
                    className="block text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5"
                  >
                    {__("Trip URL", "yatra")}
                    <Badge
                      variant="outline"
                      className="ml-1 text-[10px] px-1.5 py-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                    >
                      {__("Required", "yatra")}
                    </Badge>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
                      title={__(
                        "The web address for your trip page. Auto-generated from your title, but you can customize it.",
                        "yatra",
                      )}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </label>
                  {showSlugPreview && formData.slug && (
                    <button
                      type="button"
                      onClick={() => setShowSlugPreview(false)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {__("Hide", "yatra")}
                    </button>
                  )}
                </div>
                <HelpText
                  text={__(
                    "💡 This is automatically created from your title. You usually don't need to change it unless you want a custom web address.",
                    "yatra",
                  )}
                  className="mb-2"
                />
                <Input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleFieldChange("slug", e.target.value)}
                  placeholder={__("bali-beach-retreat-7-days", "yatra")}
                  className={`font-mono text-sm ${errors.slug ? "border-red-500" : ""}`}
                  required
                />
                {errors.slug && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.slug}
                  </p>
                )}
                {showSlugPreview && formData.slug && !errors.slug && (
                  <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-gray-600 dark:text-gray-400 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {__("Preview URL:", "yatra")}{" "}
                      </span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">
                        {(window as any).yatraAdmin?.siteUrl || "yoursite.com"}/
                        {settingsData?.trip_base || "trip"}/{formData.slug}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const tripBase = settingsData?.trip_base || "trip";
                        const url = `${(window as any).yatraAdmin?.siteUrl || "yoursite.com"}/${tripBase}/${formData.slug}`;
                        navigator.clipboard.writeText(url);
                        showToast(
                          __("URL copied to clipboard", "yatra"),
                          "success",
                        );
                      }}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                      title={__("Copy URL", "yatra")}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {!showSlugPreview && formData.slug && (
                  <button
                    type="button"
                    onClick={() => setShowSlugPreview(true)}
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {__("Show URL Preview", "yatra")}
                  </button>
                )}
              </div>

              {/* Short Description */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    {__("Short Description", "yatra")}
                    <Badge
                      variant="outline"
                      className="ml-1 text-[10px] px-1.5 py-0 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    >
                      {__("Recommended", "yatra")}
                    </Badge>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title={__(
                        "A brief summary that appears in listings. Recommended: 100-150 characters for best results.",
                        "yatra",
                      )}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        formData.short_description.length > 200
                          ? "text-red-600 dark:text-red-400"
                          : formData.short_description.length >= 100 &&
                              formData.short_description.length <= 150
                            ? "text-green-600 dark:text-green-400"
                            : formData.short_description.length > 0
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formData.short_description.length}/200
                    </span>
                    <AiFieldAffordance
                      task="trip-short-description"
                      label={__("Short Description", "yatra")}
                      value={formData.short_description}
                      onAccept={(v) =>
                        handleFieldChange("short_description", v)
                      }
                      buildContext={() => buildTripAiContext(formData)}
                    />
                  </div>
                </div>
                <HelpText
                  text={__(
                    '💡 Write 2-3 sentences that grab attention! This appears in trip listings. Example: "Escape to paradise with our 7-day Bali beach retreat. Experience stunning sunsets, world-class diving, and authentic local culture."',
                    "yatra",
                  )}
                  className="mb-2"
                />
                <RichTextEditor
                  value={formData.short_description}
                  onChange={(value) =>
                    handleFieldChange("short_description", value)
                  }
                  placeholder={__(
                    "Escape to paradise with our 7-day Bali beach retreat...",
                    "yatra",
                  )}
                  minHeight={120}
                />
                {formData.short_description.length > 0 &&
                  formData.short_description.length < 100 && (
                    <p className="mt-1.5 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {__(
                        "Consider adding more details (recommended: 100-150 characters)",
                        "yatra",
                      )}
                    </p>
                  )}
              </div>

              {/* Tour Description */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    {__("Trip Description", "yatra")}
                    <Badge
                      variant="outline"
                      className="ml-1 text-[10px] px-1.5 py-0 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    >
                      {__("Recommended", "yatra")}
                    </Badge>
                  </label>
                  <AiFieldAffordance
                    task="trip-description"
                    label={__("Description", "yatra")}
                    value={formData.description}
                    onAccept={(v) => handleFieldChange("description", v)}
                    buildContext={() => buildTripAiContext(formData)}
                  />
                </div>
                <HelpText
                  text={__(
                    "💡 Tell travelers what makes your trip special! Describe the experience, highlights, and what they'll see. Write 2-4 paragraphs. Be enthusiastic and detailed!",
                    "💡 Tell travelers what makes your trip special! Describe the experience, highlights, and what they'll see. Write 2-4 paragraphs. Be enthusiastic and detailed!",
                  )}
                  className="mb-2"
                />
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => handleFieldChange("description", value)}
                  placeholder={__(
                    "Escape to paradise with our 7-day Bali beach retreat... Or describe your single day trip experience...",
                    "yatra",
                  )}
                  minHeight={260}
                />
                {errors.description && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Featured Image */}
              <div className="mb-6">
                <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                  {__("Featured Image", "yatra")}
                  <Badge
                    variant="outline"
                    className="ml-1 text-[10px] px-1.5 py-0 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                  >
                    {__("Recommended", "yatra")}
                  </Badge>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
                    title={__(
                      "The main image that represents your trip. This appears in listings and as the hero image on the trip page.",
                      "yatra",
                    )}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </label>
                <HelpText
                  text={__(
                    "💡 Choose your best photo! This is the first thing travelers see. Use a high-quality image (1200x800px recommended) that shows what makes your trip special.",
                    "yatra",
                  )}
                  className="mb-2"
                />
                {formData.featured_image ? (
                  <div className="relative group">
                    <div
                      className={`aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 ${
                        errors.featured_image
                          ? "border-red-500 dark:border-red-600"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {featuredImagePreview ? (
                        <img
                          src={featuredImagePreview}
                          alt={__("Featured Image", "yatra")}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-sm text-gray-500 dark:text-gray-400">
                          {isResolvingFeaturedImage
                            ? __("Loading image...", "yatra")
                            : __("Preview unavailable", "yatra")}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFieldChange("featured_image", null)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={__("Remove image", "yatra")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      // Use WordPress media library
                      if (window.wp && window.wp.media) {
                        const mediaUploader = window.wp.media({
                          title: __("Select Featured Image", "yatra"),
                          button: { text: __("Use this image", "yatra") },
                          multiple: false,
                        });
                        mediaUploader.on("select", () => {
                          const attachment = mediaUploader
                            .state()
                            .get("selection")
                            .first()
                            .toJSON();
                          handleFieldChange("featured_image", attachment.id);
                        });
                        prepareWordPressMediaFrameOpen();
                        mediaUploader.open();
                      }
                    }}
                    className={`w-full aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                      errors.featured_image
                        ? "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                        : "border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"
                    }`}
                  >
                    <Upload
                      className={`w-10 h-10 mb-2 ${errors.featured_image ? "text-red-400" : "text-gray-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${errors.featured_image ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`}
                    >
                      {__("Upload Featured Image", "yatra")}
                    </span>
                    <span
                      className={`text-xs mt-1 ${errors.featured_image ? "text-red-500 dark:text-red-500" : "text-gray-500 dark:text-gray-500"}`}
                    >
                      {__("Recommended: 1200x800px", "yatra")}
                    </span>
                  </button>
                )}
                {errors.featured_image && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.featured_image}
                  </p>
                )}
              </div>

              {/* Trip Highlights */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle>{__("Trip Highlights", "yatra")}</CardTitle>
                      <CardDescription>
                        {__(
                          "Add key highlights that make your trip special. These will be displayed prominently on your trip page.",
                          "yatra",
                        )}
                      </CardDescription>
                    </div>
                    {/* AI: generates 5-7 highlight strings. The
                        affordance hands back a multi-line string;
                        we split into the highlights array shape
                        TripForm stores. */}
                    <AiFieldAffordance
                      task="trip-highlights"
                      label={__("Highlights", "yatra")}
                      value={(formData.highlights ?? []).join("\n")}
                      onAccept={(raw) => {
                        const list = raw
                          .split(/\r?\n/)
                          .map((l) =>
                            l.replace(/^[\s\-\*•·●]+/, "").trim(),
                          )
                          .filter((l) => l !== "");
                        handleFieldChange("highlights", list as any);
                      }}
                      buildContext={() => buildTripAiContext(formData)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.highlights.length > 0 ? (
                    <div className="space-y-2">
                      {formData.highlights.map((highlight, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="flex-1 text-sm text-gray-900 dark:text-white">
                            {highlight}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleHighlightRemove(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                      <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {__("No highlights added yet", "yatra")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                        {__(
                          'Add key selling points like "Private guide", "All meals included", or "Skip-the-line tickets"',
                          "yatra",
                        )}
                      </p>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleHighlightAdd}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {__("Add Highlight", "yatra")}
                  </Button>
                </CardContent>
              </Card>

              {/* Trip Type & Duration - Moved from Duration section */}
              <div className="mt-6 space-y-4">
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    {__("Trip Type & Duration", "yatra")}
                  </h3>

                  {/* Trip Type */}
                  <div className="mb-4">
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-3">
                      {__("Trip Type", "yatra")}
                    </label>
                    <div
                      className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                        errors.trip_type ? "mb-2" : ""
                      }`}
                    >
                      <label
                        className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                          formData.trip_type === "single_day"
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600"
                            : errors.trip_type
                              ? "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name="trip_type"
                          value="single_day"
                          checked={formData.trip_type === "single_day"}
                          onChange={(e) => {
                            handleFieldChange("trip_type", e.target.value);
                            if (e.target.value === "single_day") {
                              setFormData((prev) => ({
                                ...prev,
                                duration_days: "1",
                                duration_nights: "0",
                              }));
                            }
                          }}
                          className="sr-only"
                        />
                        <div className="flex flex-1">
                          <div className="flex flex-col">
                            <span
                              className={`block text-sm font-semibold ${
                                formData.trip_type === "single_day"
                                  ? "text-blue-900 dark:text-blue-300"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {__("Single Day Trip", "yatra")}
                            </span>
                            <span
                              className={`mt-1 flex items-center text-sm ${
                                formData.trip_type === "single_day"
                                  ? "text-blue-700 dark:text-blue-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {__(
                                "Trip completed within one day (no overnight stay)",
                                "yatra",
                              )}
                            </span>
                          </div>
                        </div>
                        {formData.trip_type === "single_day" && (
                          <div className="absolute top-4 right-4">
                            <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                          </div>
                        )}
                      </label>

                      <label
                        className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                          formData.trip_type === "multi_day"
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600"
                            : errors.trip_type
                              ? "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name="trip_type"
                          value="multi_day"
                          checked={formData.trip_type === "multi_day"}
                          onChange={(e) =>
                            handleFieldChange("trip_type", e.target.value)
                          }
                          className="sr-only"
                        />
                        <div className="flex flex-1">
                          <div className="flex flex-col">
                            <span
                              className={`block text-sm font-semibold ${
                                formData.trip_type === "multi_day"
                                  ? "text-blue-900 dark:text-blue-300"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {__("Multi-Day Trip", "yatra")}
                            </span>
                            <span
                              className={`mt-1 flex items-center text-sm ${
                                formData.trip_type === "multi_day"
                                  ? "text-blue-700 dark:text-blue-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {__(
                                "Trip spans multiple days with overnight stays",
                                "yatra",
                              )}
                            </span>
                          </div>
                        </div>
                        {formData.trip_type === "multi_day" && (
                          <div className="absolute top-4 right-4">
                            <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                          </div>
                        )}
                      </label>
                    </div>
                    {errors.trip_type && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.trip_type}
                      </p>
                    )}
                  </div>

                  {/* Duration Days & Nights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="duration_days"
                        className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                      >
                        {__("Duration (Days)", "yatra")}
                      </label>
                      <Input
                        id="duration_days"
                        type="number"
                        min="1"
                        value={formData.duration_days}
                        onChange={(e) => {
                          const days = e.target.value;
                          handleFieldChange("duration_days", days);
                          // Auto-set nights based on trip type
                          if (formData.trip_type === "single_day") {
                            setFormData((prev) => ({
                              ...prev,
                              duration_nights: "0",
                            }));
                          } else if (days && parseInt(days) > 1) {
                            // For multi-day, typically nights = days - 1
                            const nights = Math.max(
                              0,
                              parseInt(days) - 1,
                            ).toString();
                            setFormData((prev) => ({
                              ...prev,
                              duration_nights: nights,
                            }));
                          }
                        }}
                        placeholder={
                          formData.trip_type === "single_day"
                            ? "1"
                            : __("e.g., 7", "yatra")
                        }
                        className={errors.duration_days ? "border-red-500" : ""}
                        disabled={formData.trip_type === "single_day"}
                      />
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {formData.trip_type === "single_day"
                          ? __("Single day trips are always 1 day", "yatra")
                          : __(
                              "Enter the number of days for your trip",
                              "yatra",
                            )}
                      </p>
                      {errors.duration_days && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.duration_days}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="duration_nights"
                        className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                      >
                        {__("Duration (Nights)", "yatra")}
                      </label>
                      <Input
                        id="duration_nights"
                        type="number"
                        min="0"
                        value={formData.duration_nights}
                        onChange={(e) =>
                          handleFieldChange("duration_nights", e.target.value)
                        }
                        placeholder={
                          formData.trip_type === "single_day"
                            ? "0"
                            : __("e.g., 6", "yatra")
                        }
                        className={
                          errors.duration_nights ? "border-red-500" : ""
                        }
                        disabled={formData.trip_type === "single_day"}
                      />
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {formData.trip_type === "single_day"
                          ? __(
                              "Single day trips have 0 nights (no overnight stay)",
                              "yatra",
                            )
                          : __(
                              "Enter the number of nights (typically days - 1)",
                              "yatra",
                            )}
                      </p>
                      {errors.duration_nights && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.duration_nights}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Location & Geography", "yatra")}
              </h2>
              <Badge
                variant="outline"
                className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              >
                {__("Recommended", "yatra")}
              </Badge>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-400 p-3 rounded-r-md">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                {__(
                  "Specify where your trip takes place, including destinations, coordinates, and key landmarks.",
                  "yatra",
                )}
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {__(
                  "Optional but highly recommended to help travelers understand the experience.",
                  "yatra",
                )}
              </p>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__(
                "Optimize how your trip appears in search engines and social shares",
                "yatra",
              )}
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "Optional, but completing these fields improves SEO and click-through rates.",
                  "yatra",
                )}
              </span>
            </p>
            <div className="space-y-4">
              {/* Destinations - Multiple Selection */}
              <div>
                <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__("Destinations", "yatra")}
                </label>
                {destinationsData && destinationsData.length > 0 ? (
                  <MultiSelect
                    value={formData.destinations.map((id) => id.toString())}
                    onChange={(values) =>
                      handleFieldChange(
                        "destinations",
                        values.map((v) => Number(v)),
                      )
                    }
                    options={destinationsData.map((destination: any) => ({
                      value: destination.id.toString(),
                      label:
                        destination.name ||
                        sprintf(
                          __("Destination #%s", "yatra"),
                          String(destination.id),
                        ),
                    }))}
                    placeholder={__("Select destinations...", "yatra")}
                    searchPlaceholder={__("Search destinations...", "yatra")}
                    error={!!errors.destinations}
                  />
                ) : (
                  <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {__(
                        "No destinations available. Please create destinations first.",
                        "yatra",
                      )}
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {__("To create destinations:", "yatra")}
                      </p>
                      <ol className="text-xs text-gray-400 dark:text-gray-500 text-left list-decimal list-inside space-y-1 max-w-md mx-auto">
                        <li>
                          {__(
                            "Go to Yatra → Destinations in your WordPress admin",
                            "yatra",
                          )}
                        </li>
                        <li>{__('Click "Add New Destination"', "yatra")}</li>
                        <li>
                          {__("Enter destination name and details", "yatra")}
                        </li>
                        <li>{__('Set status to "Published"', "yatra")}</li>
                      </ol>
                      <a
                        href="/wp-admin/admin.php?page=yatra&subpage=trips&tab=destinations&action=create"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        {__("Create Destinations", "yatra")}
                      </a>
                    </div>
                  </div>
                )}
                <HelpText
                  text={__(
                    "Select all destinations included in this trip",
                    "yatra",
                  )}
                  className="mt-2"
                />
                {errors.destinations && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.destinations}
                  </p>
                )}
              </div>

              {/* Locations Section - Senior UI/UX Design */}
              <div className="space-y-8">
                {/* Section Header */}
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    {__("Trip Locations", "yatra")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    {__(
                      "Set precise starting and ending points with location names and GPS coordinates. Use manual entry or visual map selection for maximum accuracy.",
                      "yatra",
                    )}
                  </p>
                </div>

                {/* Locations Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* STARTING LOCATION */}
                  <div className="space-y-6">
                    {/* Location Header */}
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
                      <div className="flex items-center gap-2">
                        {formData.starting_location && (
                          <div
                            className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                            title={__("Location set", "yatra")}
                          ></div>
                        )}
                        {formData.starting_latitude &&
                          formData.starting_longitude && (
                            <div
                              className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                              title={__("Coordinates set", "yatra")}
                            ></div>
                          )}
                      </div>
                    </div>

                    {/* Integrated Location Input with Map */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              1
                            </span>
                          </div>
                          {__("Starting Location", "yatra")}
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formData.starting_location
                              ? "✓"
                              : __("Required", "yatra")}
                          </span>
                          {formData.starting_latitude &&
                            formData.starting_longitude && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                {__("Coords Set", "yatra")}
                              </div>
                            )}
                        </div>
                      </div>

                      {/* LocationPicker - Primary Interface */}
                      <div className="space-y-3">
                        <LocationPicker
                          value={{
                            name: formData.starting_location,
                            latitude: formData.starting_latitude,
                            longitude: formData.starting_longitude,
                          }}
                          onChange={(locationData) => {
                            handleFieldChange(
                              "starting_location",
                              locationData.name,
                            );
                            handleFieldChange(
                              "starting_latitude",
                              locationData.latitude,
                            );
                            handleFieldChange(
                              "starting_longitude",
                              locationData.longitude,
                            );
                          }}
                          label=""
                          placeholder={__(
                            "Search for starting location...",
                            "yatra",
                          )}
                          helpText=""
                          required={false}
                          defaultMapCenter={
                            formData.starting_latitude &&
                            formData.starting_longitude
                              ? [
                                  parseFloat(formData.starting_latitude),
                                  parseFloat(formData.starting_longitude),
                                ]
                              : [20, 0]
                          }
                          defaultZoom={
                            formData.starting_latitude &&
                            formData.starting_longitude
                              ? 13
                              : 2
                          }
                          mapHeight="300px"
                          showMapButton={false}
                          searchLimit={8}
                          __={__}
                          className=""
                          mapClassName="rounded-lg"
                        />
                      </div>
                    </div>

                    {/* GPS Coordinates - Manual Override */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              2
                            </span>
                          </div>
                          {__("GPS Coordinates", "yatra")}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({__("Manual override", "yatra")})
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                  (position) => {
                                    handleFieldChange(
                                      "starting_latitude",
                                      position.coords.latitude.toString(),
                                    );
                                    handleFieldChange(
                                      "starting_longitude",
                                      position.coords.longitude.toString(),
                                    );
                                  },
                                  (error) => {
                                    let message = __(
                                      "Unable to get your location",
                                      "yatra",
                                    );
                                    let showHttpsNotice = false;

                                    switch (error.code) {
                                      case 1: // PERMISSION_DENIED
                                        if (
                                          error.message.includes(
                                            "secure origins",
                                          )
                                        ) {
                                          message = __(
                                            "Location access requires HTTPS. This feature will work on your live HTTPS site.",
                                            "yatra",
                                          );
                                          showHttpsNotice = true;
                                        } else {
                                          message = __(
                                            "Location access denied. Please allow location access in your browser.",
                                            "yatra",
                                          );
                                        }
                                        break;
                                      case 2: // POSITION_UNAVAILABLE
                                        message = __(
                                          "Location information is unavailable. Please try again.",
                                          "yatra",
                                        );
                                        break;
                                      case 3: // TIMEOUT
                                        message = __(
                                          "Location request timed out. Please try again.",
                                          "yatra",
                                        );
                                        break;
                                    }

                                    if (showHttpsNotice) {
                                      alert(
                                        message +
                                          "\n\n" +
                                          __(
                                            "For local development, you can:\n1. Use a browser extension that allows geolocation on HTTP\n2. Set up a local HTTPS certificate\n3. Test on your live HTTPS site",
                                            "yatra",
                                          ),
                                      );
                                    } else {
                                      alert(message);
                                    }
                                  },
                                );
                              } else {
                                alert(
                                  __(
                                    "Geolocation is not supported by your browser",
                                    "yatra",
                                  ),
                                );
                              }
                            }}
                            className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                          >
                            <div className="w-3 h-3">
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            {__("Use Current Location", "yatra")}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            {__("Latitude", "yatra")}
                          </label>
                          <Input
                            type="text"
                            value={formData.starting_latitude}
                            onChange={(e) =>
                              handleFieldChange(
                                "starting_latitude",
                                e.target.value,
                              )
                            }
                            className="w-full text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            {__("Longitude", "yatra")}
                          </label>
                          <Input
                            type="text"
                            value={formData.starting_longitude}
                            onChange={(e) =>
                              handleFieldChange(
                                "starting_longitude",
                                e.target.value,
                              )
                            }
                            placeholder={__("e.g., 115.0920", "yatra")}
                            className="w-full text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {__(
                          "Manual coordinate entry. These will be auto-filled when you select a location from the map above.",
                          "yatra",
                        )}
                      </p>
                    </div>
                  </div>

                  {/* ENDING LOCATION */}
                  <div className="space-y-6">
                    {/* Location Header */}
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
                      <div className="flex items-center gap-2">
                        {formData.ending_location && (
                          <div
                            className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                            title={__("Location set", "yatra")}
                          ></div>
                        )}
                      </div>
                    </div>

                    {/* Integrated Location Input with Map */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-green-600 dark:text-green-400">
                              1
                            </span>
                          </div>
                          {__("Ending Location", "yatra")}
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formData.ending_location
                              ? "✓"
                              : __("Required", "yatra")}
                          </span>
                          {formData.ending_latitude &&
                            formData.ending_longitude && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                {__("Coords Set", "yatra")}
                              </div>
                            )}
                        </div>
                      </div>

                      {/* LocationPicker - Primary Interface */}
                      <div className="space-y-3">
                        <LocationPicker
                          value={{
                            name: formData.ending_location,
                            latitude: formData.ending_latitude,
                            longitude: formData.ending_longitude,
                          }}
                          onChange={(locationData) => {
                            handleFieldChange(
                              "ending_location",
                              locationData.name,
                            );
                            handleFieldChange(
                              "ending_latitude",
                              locationData.latitude,
                            );
                            handleFieldChange(
                              "ending_longitude",
                              locationData.longitude,
                            );
                          }}
                          label=""
                          placeholder={__(
                            "Search for ending location...",
                            "yatra",
                          )}
                          helpText=""
                          required={false}
                          defaultMapCenter={
                            formData.ending_latitude &&
                            formData.ending_longitude
                              ? [
                                  parseFloat(formData.ending_latitude),
                                  parseFloat(formData.ending_longitude),
                                ]
                              : formData.starting_latitude &&
                                  formData.starting_longitude
                                ? [
                                    parseFloat(formData.starting_latitude),
                                    parseFloat(formData.starting_longitude),
                                  ]
                                : [20, 0]
                          }
                          defaultZoom={
                            formData.ending_latitude &&
                            formData.ending_longitude
                              ? 13
                              : formData.starting_latitude &&
                                  formData.starting_longitude
                                ? 13
                                : 2
                          }
                          mapHeight="300px"
                          showMapButton={false}
                          searchLimit={8}
                          __={__}
                          className=""
                          mapClassName="rounded-lg"
                        />
                      </div>
                    </div>

                    {/* GPS Coordinates - Manual Override */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-green-600 dark:text-green-400">
                              2
                            </span>
                          </div>
                          {__("GPS Coordinates", "yatra")}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({__("Optional", "yatra")})
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            {__("Latitude", "yatra")}
                          </label>
                          <Input
                            type="text"
                            value={formData.ending_latitude || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                "ending_latitude",
                                e.target.value,
                              )
                            }
                            placeholder={__("e.g., -8.5069", "yatra")}
                            className="w-full text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            {__("Longitude", "yatra")}
                          </label>
                          <Input
                            type="text"
                            value={formData.ending_longitude || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                "ending_longitude",
                                e.target.value,
                              )
                            }
                            placeholder={__("e.g., 115.2625", "yatra")}
                            className="w-full text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {__(
                          "Optional: Manual coordinate entry. Auto-filled when you select a location from the map above.",
                          "yatra",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Landmarks */}
              <div>
                <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__("Key Landmarks / Points of Interest", "yatra")}
                </label>
                <HelpText
                  text={__(
                    "Add notable landmarks or points of interest visited during this trip",
                    "yatra",
                  )}
                  className="mb-2"
                />
                {formData.landmarks.length > 0 ? (
                  <div className="space-y-2 mb-2">
                    {formData.landmarks.map((landmark, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="flex-1 text-sm text-gray-900 dark:text-white">
                          {landmark}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newLandmarks = [...formData.landmarks];
                            newLandmarks.splice(index, 1);
                            handleFieldChange("landmarks", newLandmarks);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center mb-2">
                    <MapPin className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {__("No landmarks added yet", "yatra")}
                    </p>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowLandmarkDialog(true);
                    setLandmarkInput("");
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {__("Add Landmark", "yatra")}
                </Button>
              </div>
            </div>
          </div>
        );

      case "duration":
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Availability & Booking", "yatra")}
              </h2>
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                {__("Recommended", "yatra")}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__("When is it available & who can book it?", "yatra")}
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "Set your trip's availability period, capacity limits, and booking requirements. This helps automate bookings and prevent overbooking.",
                  "yatra",
                )}
              </span>
            </p>

            <div className="space-y-6">
              {/* SECTION 1: Availability Period */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  {__("Availability Period", "yatra")}
                </h3>
                <div className="space-y-4">
                  {/* Availability Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="available_from"
                        className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                      >
                        {__("Available From", "yatra")}
                      </label>
                      <DatePicker
                        value={formData.available_from}
                        onChange={(val) =>
                          handleFieldChange("available_from", val)
                        }
                        placeholder={__("Select date", "yatra")}
                      />
                      <HelpText
                        text={__(
                          "Earliest date this trip becomes available for booking",
                          "yatra",
                        )}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="available_to"
                        className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                      >
                        {__("Available To", "yatra")}
                      </label>
                      <DatePicker
                        value={formData.available_to}
                        onChange={(val) =>
                          handleFieldChange("available_to", val)
                        }
                        placeholder={__("Select date", "yatra")}
                      />
                      <HelpText
                        text={__(
                          "Latest date this trip is available for booking",
                          "yatra",
                        )}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Booking Window */}
                  <div>
                    <label
                      htmlFor="booking_window_days"
                      className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                    >
                      {__("Booking Window (Days in Advance)", "yatra")}
                    </label>
                    <Input
                      id="booking_window_days"
                      type="number"
                      min="0"
                      value={formData.booking_window_days}
                      onChange={(e) =>
                        handleFieldChange("booking_window_days", e.target.value)
                      }
                      placeholder={__("e.g., 30", "yatra")}
                    />
                    <HelpText
                      text={__(
                        "Minimum days in advance customers can book this trip",
                        "yatra",
                      )}
                      className="mt-2"
                    />
                  </div>

                  {/* Seasonal Availability */}
                  <div>
                    <label
                      htmlFor="seasonal_availability"
                      className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                    >
                      {__("Seasonal Availability Notes", "yatra")}
                    </label>
                    <Input
                      id="seasonal_availability"
                      type="text"
                      value={formData.seasonal_availability}
                      onChange={(e) =>
                        handleFieldChange(
                          "seasonal_availability",
                          e.target.value,
                        )
                      }
                      placeholder={__(
                        "e.g., Available year-round except monsoon season",
                        "yatra",
                      )}
                    />
                    <HelpText
                      text={__(
                        "General notes about when this trip is typically available",
                        "yatra",
                      )}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Capacity & Travelers */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  {__("Capacity & Travelers", "yatra")}
                </h3>
                <div className="space-y-4">
                  {/* Group Size */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="min_travelers"
                        className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                      >
                        {__("Minimum Travelers", "yatra")}
                      </label>
                      <Input
                        id="min_travelers"
                        type="number"
                        min="1"
                        value={formData.min_travelers}
                        onChange={(e) =>
                          handleFieldChange("min_travelers", e.target.value)
                        }
                        className={errors.min_travelers ? "border-red-500" : ""}
                      />
                      {errors.min_travelers && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.min_travelers}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="max_travelers"
                        className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                      >
                        {__("Maximum Travelers", "yatra")}
                      </label>
                      <Input
                        id="max_travelers"
                        type="number"
                        min="1"
                        value={formData.max_travelers}
                        onChange={(e) =>
                          handleFieldChange("max_travelers", e.target.value)
                        }
                        className={errors.max_travelers ? "border-red-500" : ""}
                      />
                      {errors.max_travelers && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.max_travelers}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Fallback Settings */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex items-start gap-2 mb-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {__("Fallback Settings", "yatra")}
                      </h4>
                      <span
                        title={__(
                          "These settings are used when the trip has no availability dates or recurring rules set. They provide default values for flexible booking.",
                          "yatra",
                        )}
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </span>
                    </div>

                    {/* Info Banner */}
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-amber-800 dark:text-amber-200">
                          <p className="font-medium mb-1">
                            {__("When are these settings used?", "yatra")}
                          </p>
                          <p className="text-amber-700 dark:text-amber-300">
                            {__(
                              "These settings apply ONLY when your trip has ZERO availability dates AND ZERO recurring rules. They provide defaults for flexible booking scenarios.",
                              "yatra",
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Settings Content - Grouped by Trip Type */}
                    <div className="space-y-4">
                      {/* Day Tour Settings */}
                      {formData.trip_type === "single_day" && (
                        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {__("Day Tour Time Settings", "yatra")}
                          </h5>

                          {/* Enable Multiple Time Slots Toggle */}
                          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                id="has_default_time_slots"
                                checked={formData.has_default_time_slots}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "has_default_time_slots",
                                    e.target.checked,
                                  )
                                }
                                className="mt-0.5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor="has_default_time_slots"
                                  className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                                >
                                  {__("Enable Multiple Time Slots", "yatra")}
                                </label>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {__(
                                    "Allow customers to select from multiple departure times (e.g., Morning, Afternoon, Evening tours)",
                                    "yatra",
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Time Slots Configuration (if enabled) */}
                          {formData.has_default_time_slots && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                                    {__("Time Slots Configuration", "yatra")}
                                  </label>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {__(
                                      "Add multiple departure times for customers to choose from.",
                                      "yatra",
                                    )}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newSlot: TimeSlot = {
                                      id: `slot-${Date.now()}`,
                                      time: "09:00",
                                      label: "",
                                    };
                                    handleFieldChange("default_time_slots", [
                                      ...formData.default_time_slots,
                                      newSlot,
                                    ]);
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Plus className="w-4 h-4" />
                                  {__("Add Time Slot", "yatra")}
                                </Button>
                              </div>

                              {formData.default_time_slots.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                                  <Clock className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    {__("No time slots added yet", "yatra")}
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newSlot: TimeSlot = {
                                        id: `slot-${Date.now()}`,
                                        time: "09:00",
                                        label: __("Morning Tour", "yatra"),
                                      };
                                      handleFieldChange("default_time_slots", [
                                        newSlot,
                                      ]);
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    {__("Add First Time Slot", "yatra")}
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {formData.default_time_slots.map(
                                    (slot, index) => (
                                      <div
                                        key={slot.id}
                                        className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                      >
                                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0 mt-1">
                                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                            {index + 1}
                                          </span>
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                              {__("Time", "yatra")}
                                            </label>
                                            <Input
                                              type="time"
                                              value={slot.time}
                                              onChange={(e) => {
                                                const updated = [
                                                  ...formData.default_time_slots,
                                                ];
                                                updated[index] = {
                                                  ...slot,
                                                  time: e.target.value,
                                                };
                                                handleFieldChange(
                                                  "default_time_slots",
                                                  updated,
                                                );
                                              }}
                                              className="w-full"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                              {__("Label", "yatra")}
                                            </label>
                                            <Input
                                              type="text"
                                              value={slot.label}
                                              onChange={(e) => {
                                                const updated = [
                                                  ...formData.default_time_slots,
                                                ];
                                                updated[index] = {
                                                  ...slot,
                                                  label: e.target.value,
                                                };
                                                handleFieldChange(
                                                  "default_time_slots",
                                                  updated,
                                                );
                                              }}
                                              placeholder={__(
                                                "e.g., Morning Tour, Afternoon Tour",
                                                "yatra",
                                              )}
                                              className="w-full"
                                            />
                                          </div>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const updated =
                                              formData.default_time_slots.filter(
                                                (_, i) => i !== index,
                                              );
                                            handleFieldChange(
                                              "default_time_slots",
                                              updated,
                                            );
                                          }}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 mt-1"
                                          title={__(
                                            "Remove time slot",
                                            "yatra",
                                          )}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Single Departure Time (if multiple slots disabled) */}
                          {!formData.has_default_time_slots && (
                            <div>
                              <label
                                htmlFor="departure_time_single"
                                className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                              >
                                {__("Default Departure Time", "yatra")}
                              </label>
                              <Input
                                id="departure_time_single"
                                type="time"
                                value={formData.departure_time}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "departure_time",
                                    e.target.value,
                                  )
                                }
                                className="max-w-xs"
                              />
                              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {__(
                                  "Single departure time for all bookings when multiple time slots are not enabled.",
                                  "yatra",
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Multi-Day Trip Settings */}
                      {formData.trip_type === "multi_day" && (
                        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {__("Multi-Day Trip Departure Settings", "yatra")}
                          </h5>

                          <div>
                            <label
                              htmlFor="departure_time_multiday"
                              className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                            >
                              {__("Default Departure Time", "yatra")}
                            </label>
                            <Input
                              id="departure_time_multiday"
                              type="time"
                              value={formData.departure_time}
                              onChange={(e) =>
                                handleFieldChange(
                                  "departure_time",
                                  e.target.value,
                                )
                              }
                              className="max-w-xs"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {__(
                                "Default departure time for trips without specific availability dates.",
                                "yatra",
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* No Trip Type Selected */}
                      {!formData.trip_type && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {__(
                              "Please select a trip type (Day Tour or Multi-Day) to configure fallback settings.",
                              "yatra",
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Booking Policies */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  {__("Booking Policies", "yatra")}
                </h3>
                <div className="space-y-4">
                  {/* Age Restrictions */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      {__("Age Restrictions", "yatra")}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="age_min"
                          className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                        >
                          {__("Minimum Age", "yatra")}
                        </label>
                        <Input
                          id="age_min"
                          type="number"
                          min="0"
                          value={formData.age_min}
                          onChange={(e) =>
                            handleFieldChange("age_min", e.target.value)
                          }
                          placeholder={__("e.g., 18", "yatra")}
                          className={errors.age_min ? "border-red-500" : ""}
                        />
                        {errors.age_min && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.age_min}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="age_max"
                          className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                        >
                          {__("Maximum Age", "yatra")}
                        </label>
                        <Input
                          id="age_max"
                          type="number"
                          min="0"
                          value={formData.age_max}
                          onChange={(e) =>
                            handleFieldChange("age_max", e.target.value)
                          }
                          placeholder={__("e.g., 65", "yatra")}
                          className={errors.age_max ? "border-red-500" : ""}
                        />
                        {errors.age_max && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.age_max}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      {__("Trip Requirements", "yatra")}
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="physical_requirements"
                          className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                        >
                          {__("Physical Requirements", "yatra")}
                        </label>
                        <textarea
                          id="physical_requirements"
                          value={formData.physical_requirements}
                          onChange={(e) =>
                            handleFieldChange(
                              "physical_requirements",
                              e.target.value,
                            )
                          }
                          placeholder={__(
                            "e.g., Moderate fitness level required. Some walking involved but no strenuous activities.",
                            "yatra",
                          )}
                          rows={3}
                          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="visa_requirements"
                          className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                        >
                          {__("Visa Requirements", "yatra")}
                        </label>
                        <textarea
                          id="visa_requirements"
                          value={formData.visa_requirements}
                          onChange={(e) =>
                            handleFieldChange(
                              "visa_requirements",
                              e.target.value,
                            )
                          }
                          placeholder={__(
                            "e.g., Tourist visa required. Can be obtained on arrival or in advance.",
                            "yatra",
                          )}
                          rows={3}
                          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="vaccination_requirements"
                          className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                        >
                          {__("Vaccination Requirements", "yatra")}
                        </label>
                        <textarea
                          id="vaccination_requirements"
                          value={formData.vaccination_requirements}
                          onChange={(e) =>
                            handleFieldChange(
                              "vaccination_requirements",
                              e.target.value,
                            )
                          }
                          placeholder={__(
                            "e.g., No mandatory vaccinations. Recommended: Hepatitis A, Typhoid, and routine vaccinations.",
                            "yatra",
                          )}
                          rows={3}
                          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Policy */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {__("Cancellation Policy", "yatra")}
                      </h4>
                      <AiFieldAffordance
                        task="trip-cancellation-policy"
                        label={__("Cancellation Policy", "yatra")}
                        value={formData.cancellation_policy}
                        onAccept={(v) =>
                          handleFieldChange("cancellation_policy", v)
                        }
                        buildContext={() => buildTripAiContext(formData)}
                      />
                    </div>
                    <textarea
                      id="cancellation_policy"
                      value={formData.cancellation_policy}
                      onChange={(e) =>
                        handleFieldChange("cancellation_policy", e.target.value)
                      }
                      placeholder={__(
                        "e.g., Free cancellation up to 30 days before departure. 50% refund for cancellations 15-30 days before. No refund for cancellations less than 15 days before.",
                        "yatra",
                      )}
                      rows={4}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3b: Disable Booking (Pro) */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  {__("Booking Availability", "yatra")}
                  <ProBadge isProActive={isPro} />
                </h3>
                <ProFeature
                  description={__(
                    "disable the booking calendar and make trips enquiry-only",
                    "yatra",
                  )}
                  moduleName={__("Enquiry Only Mode", "yatra")}
                  pricingUrl="https://wpyatra.com/pricing"
                  isProActive={isPro}
                  isModuleEnabled={isPro}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        id="disable_booking"
                        type="checkbox"
                        checked={formData.disable_booking}
                        onChange={(e) =>
                          handleFieldChange("disable_booking", e.target.checked)
                        }
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="disable_booking"
                        className="block text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                      >
                        {__("Disable Booking Calendar", "yatra")}
                      </label>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {__(
                          "When enabled, the booking form and date picker will be hidden. Visitors can only send an enquiry for this trip.",
                          "yatra",
                        )}
                      </p>
                    </div>
                  </div>
                </ProFeature>
              </div>

              {/* SECTION 4: Accommodation */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-500" />
                  {__("Accommodation", "yatra")}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="accommodation_type"
                        className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                      >
                        {__("Accommodation Type", "yatra")}
                      </label>
                      <Input
                        id="accommodation_type"
                        type="text"
                        value={formData.accommodation_type}
                        onChange={(e) =>
                          handleFieldChange(
                            "accommodation_type",
                            e.target.value,
                          )
                        }
                        placeholder={__(
                          "e.g., Hotel, Resort, Teahouse, Camping",
                          "yatra",
                        )}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="meal_plan"
                        className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                      >
                        {__("Meal Plan", "yatra")}
                      </label>
                      <Select
                        id="meal_plan"
                        value={formData.meal_plan}
                        onChange={(e) =>
                          handleFieldChange("meal_plan", e.target.value)
                        }
                      >
                        {MEAL_PLAN_SELECT_OPTIONS.map(({ value, label }) => (
                          <option
                            key={value || "meal-plan-empty"}
                            value={value}
                          >
                            {label}
                          </option>
                        ))}
                      </Select>
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {__(
                          "Tells travelers which meals are included with lodging (e.g. breakfast only vs full board).",
                          "yatra",
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="accommodation_details"
                      className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                    >
                      {__("Accommodation Details", "yatra")}
                    </label>
                    <textarea
                      id="accommodation_details"
                      value={formData.accommodation_details}
                      onChange={(e) =>
                        handleFieldChange(
                          "accommodation_details",
                          e.target.value,
                        )
                      }
                      placeholder={__(
                        "e.g., 4-star beachfront resort with private balconies, infinity pool, and spa facilities",
                        "yatra",
                      )}
                      rows={3}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: Transportation */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-500" />
                  {__("Transportation", "yatra")}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="transportation_included"
                      checked={formData.transportation_included}
                      onChange={(e) =>
                        handleFieldChange(
                          "transportation_included",
                          e.target.checked,
                        )
                      }
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor="transportation_included"
                      className="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {__("Transportation Included", "yatra")}
                    </label>
                  </div>
                  {formData.transportation_included && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="pickup_location"
                            className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                          >
                            {__("Pickup Location", "yatra")}
                          </label>
                          <Input
                            id="pickup_location"
                            type="text"
                            value={formData.pickup_location}
                            onChange={(e) =>
                              handleFieldChange(
                                "pickup_location",
                                e.target.value,
                              )
                            }
                            placeholder={__(
                              "e.g., Airport, Hotel, City Center",
                              "yatra",
                            )}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="dropoff_location"
                            className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                          >
                            {__("Dropoff Location", "yatra")}
                          </label>
                          <Input
                            id="dropoff_location"
                            type="text"
                            value={formData.dropoff_location}
                            onChange={(e) =>
                              handleFieldChange(
                                "dropoff_location",
                                e.target.value,
                              )
                            }
                            placeholder={__(
                              "e.g., Airport, Hotel, City Center",
                              "yatra",
                            )}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="transportation_details"
                          className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                        >
                          {__("Transportation Details", "yatra")}
                        </label>
                        <textarea
                          id="transportation_details"
                          value={formData.transportation_details}
                          onChange={(e) =>
                            handleFieldChange(
                              "transportation_details",
                              e.target.value,
                            )
                          }
                          placeholder={__(
                            "e.g., Private air-conditioned vehicle with professional driver",
                            "yatra",
                          )}
                          rows={3}
                          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "categorization":
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Tag className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Categories & Attributes", "yatra")}
              </h2>
              <Badge
                variant="outline"
                className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              >
                {__("Recommended", "yatra")}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__("How should travelers find this trip?", "yatra")}
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "Organize your trip with categories, activities, and custom attributes to help travelers discover it through search and filters.",
                  "yatra",
                )}
              </span>
            </p>

            <div className="space-y-6">
              {/* SECTION 1: Categories & Classification */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-500" />
                  {__("Categories & Classification", "yatra")}
                </h3>
                <div className="space-y-4">
                  {/* Trip Category */}
                  <div>
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__("Trip Categories", "yatra")}
                    </label>
                    {tripCategories && tripCategories.length > 0 ? (
                      <MultiSelect
                        value={formData.trip_category}
                        onChange={(values) =>
                          handleFieldChange(
                            "trip_category",
                            values.map((v) => Number(v)),
                          )
                        }
                        options={(() => {
                          // Flatten categories with hierarchy indication
                          const flattenCategories = (
                            cats: any[],
                            prefix = "",
                          ): { value: number; label: string }[] => {
                            const result: { value: number; label: string }[] =
                              [];
                            cats.forEach((cat) => {
                              result.push({
                                value: cat.id,
                                label: prefix + cat.name,
                              });
                              if (
                                cat.subcategories &&
                                cat.subcategories.length > 0
                              ) {
                                result.push(
                                  ...flattenCategories(
                                    cat.subcategories,
                                    prefix + "— ",
                                  ),
                                );
                              }
                            });
                            return result;
                          };
                          return flattenCategories(tripCategories);
                        })()}
                        placeholder={__("Select categories...", "yatra")}
                        searchPlaceholder={__("Search categories...", "yatra")}
                      />
                    ) : (
                      <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {__("No categories available. ", "yatra")}
                          <a
                            href="/wp-admin/admin.php?page=yatra&subpage=trips&tab=categories"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            {__("Create categories here", "yatra")}
                          </a>
                        </p>
                      </div>
                    )}
                    <HelpText
                      text={__(
                        "Select one or more categories for this trip",
                        "yatra",
                      )}
                      className="mt-2"
                    />
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <label
                      htmlFor="difficulty_level"
                      className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                    >
                      {__("Difficulty Level", "yatra")}
                    </label>
                    <Select
                      id="difficulty_level"
                      value={formData.difficulty_level}
                      onChange={(e) =>
                        handleFieldChange("difficulty_level", e.target.value)
                      }
                      disabled={isLoadingDifficultyLevels}
                    >
                      <option value="">
                        {__("Select difficulty", "yatra")}
                      </option>
                      {isLoadingDifficultyLevels && (
                        <option value="" disabled>
                          {__("Loading difficulty levels...", "yatra")}
                        </option>
                      )}
                      {!isLoadingDifficultyLevels &&
                        difficultyLevels.length === 0 && (
                          <option value="" disabled>
                            {__(
                              "No difficulty levels available - Click below to create",
                              "yatra",
                            )}
                          </option>
                        )}
                      {!isLoadingDifficultyLevels &&
                        difficultyLevels.map((level) => (
                          <option
                            key={`difficulty-${level.id}`}
                            value={level.id?.toString() || ""}
                          >
                            {level.name}
                          </option>
                        ))}
                    </Select>
                    {!isLoadingDifficultyLevels &&
                      difficultyLevels.length === 0 && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            {__("No difficulty levels available. ", "yatra")}
                            <a
                              href="/wp-admin/admin.php?page=yatra&subpage=trips&tab=difficulty-levels"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-800 hover:text-amber-900 underline font-medium"
                            >
                              {__("Create difficulty levels here", "yatra")}
                            </a>
                          </p>
                        </div>
                      )}
                    <HelpText
                      text={__(
                        "Physical difficulty level required for this trip",
                        "yatra",
                      )}
                      className="mt-2"
                    />
                  </div>

                  {/* Activity Types */}
                  <div>
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__("Activity Types", "yatra")}
                    </label>
                    {activitiesData && activitiesData.length > 0 ? (
                      <MultiSelect
                        value={formData.activity_types}
                        onChange={(values) =>
                          handleFieldChange(
                            "activity_types",
                            values.map((v) => Number(v)),
                          )
                        }
                        options={activitiesData.map((activity: any) => ({
                          value: activity.id,
                          label: activity.name,
                        }))}
                        placeholder={__("Select activities...", "yatra")}
                        searchPlaceholder={__("Search activities...", "yatra")}
                      />
                    ) : (
                      <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {__("No activities available. ", "yatra")}
                          <a
                            href="/wp-admin/admin.php?page=yatra&subpage=trips&tab=activities"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            {__("Create activities here", "yatra")}
                          </a>
                        </p>
                      </div>
                    )}
                    <HelpText
                      text={__(
                        "Select all activities included in this trip",
                        "yatra",
                      )}
                      className="mt-2"
                    />
                  </div>

                  {/* Featured Priority */}
                  <div>
                    <label
                      htmlFor="featured_priority"
                      className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                    >
                      {__("Featured Priority", "yatra")}
                    </label>
                    <Select
                      id="featured_priority"
                      value={formData.featured_priority}
                      onChange={(e) =>
                        handleFieldChange(
                          "featured_priority",
                          e.target.value as TripFormData["featured_priority"],
                        )
                      }
                    >
                      <option value="none">{__("None", "yatra")}</option>
                      <option value="featured">
                        {__("Featured", "yatra")}
                      </option>
                      <option value="new">{__("New", "yatra")}</option>
                      <option value="limited">
                        {__("Limited Time", "yatra")}
                      </option>
                    </Select>
                    <HelpText
                      text={__(
                        "Special designation for frontend display and promotion",
                        "yatra",
                      )}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Custom Attributes */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-500" />
                  {__("Custom Attributes", "yatra")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {__(
                    "Add custom attributes for advanced filtering and search capabilities.",
                    "yatra",
                  )}
                </p>
                <TripAttributesSection
                  formData={formData}
                  handleFieldChange={handleFieldChange}
                  tripId={tripId || undefined}
                  isEditMode={isEditMode}
                  tripAttributesData={tripAttributesData}
                  tripAttributesReady={tripAttributesReady}
                />
              </div>
            </div>
          </div>
        );

      case "media":
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Image className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Media & Content", "yatra")}
              </h2>
              <Badge
                variant="outline"
                className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              >
                {__("Recommended", "yatra")}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {__(
                "Add visual content, videos, stories, and testimonials to showcase your trip",
                "yatra",
              )}
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "Optional, but adding rich media greatly increases engagement and conversions.",
                  "yatra",
                )}
              </span>
            </p>

            <div className="space-y-6">
              {/* Photo Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle>{__("Photo Gallery", "yatra")}</CardTitle>
                  <CardDescription>
                    {__(
                      "Upload images to showcase your trip. These will be displayed on the trip page.",
                      "yatra",
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {formData.gallery_images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                          <img
                            src={image.thumbnail_url || image.url}
                            alt={image.alt_text || `Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Reorder buttons */}
                        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleGalleryReorder(index, index - 1)
                              }
                              className="bg-black/60 text-white rounded p-1 hover:bg-black/80"
                              title={__("Move left", "yatra")}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          )}
                          {index < formData.gallery_images.length - 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleGalleryReorder(index, index + 1)
                              }
                              className="bg-black/60 text-white rounded p-1 hover:bg-black/80"
                              title={__("Move right", "yatra")}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {/* Order badge */}
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          {index + 1}
                        </span>
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleGalleryRemove(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleGalleryAdd}
                      className={`aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                        errors.gallery_images
                          ? "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"
                      }`}
                    >
                      <Upload
                        className={`w-8 h-8 mb-2 ${errors.gallery_images ? "text-red-400" : "text-gray-400"}`}
                      />
                      <span
                        className={`text-sm ${errors.gallery_images ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`}
                      >
                        {__("Add Image", "yatra")}
                      </span>
                    </button>
                  </div>
                  {errors.gallery_images && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.gallery_images}
                    </p>
                  )}
                </CardContent>
              </Card>
              {/* Video & Virtual Tour */}
              <Card>
                <CardHeader>
                  <CardTitle>{__("Video & Virtual Tour", "yatra")}</CardTitle>
                  <CardDescription>
                    {__(
                      "Add video content to showcase your trip visually",
                      "yatra",
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__("Video URL", "yatra")} (YouTube/Vimeo)
                    </label>
                    <HelpText
                      text={__(
                        "Paste the full URL from YouTube or Vimeo. The video will be embedded on your trip page.",
                        "yatra",
                      )}
                      className="mb-2"
                    />
                    <Input
                      type="url"
                      value={formData.video_url}
                      onChange={(e) =>
                        handleFieldChange("video_url", e.target.value)
                      }
                      placeholder="https://www.youtube.com/watch?v=..."
                      className={`font-mono text-xs ${errors.video_url ? "border-red-500" : ""}`}
                    />
                    {errors.video_url && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.video_url}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__("360° Virtual Tour URL", "yatra")}
                    </label>
                    <HelpText
                      text={__(
                        "Add a link to an interactive 360° virtual tour if available",
                        "yatra",
                      )}
                      className="mb-2"
                    />
                    <Input
                      type="url"
                      value={formData.virtual_tour_url}
                      onChange={(e) =>
                        handleFieldChange("virtual_tour_url", e.target.value)
                      }
                      placeholder="https://..."
                      className={`font-mono text-xs ${errors.virtual_tour_url ? "border-red-500" : ""}`}
                    />
                    {errors.virtual_tour_url && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.virtual_tour_url}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trip Story & What Makes Special */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {__("Trip Story & Special Features", "yatra")}
                  </CardTitle>
                  <CardDescription>
                    {__(
                      "Tell an engaging story and highlight what makes this trip unique",
                      "yatra",
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__("What Makes This Trip Special", "yatra")}
                    </label>
                    <HelpText
                      text={__(
                        "Highlight the unique selling points and what sets this trip apart from others",
                        "yatra",
                      )}
                      className="mb-2"
                    />
                    <textarea
                      value={formData.what_makes_special}
                      onChange={(e) =>
                        handleFieldChange("what_makes_special", e.target.value)
                      }
                      placeholder={__(
                        "Describe what makes this trip unique and special...",
                        "yatra",
                      )}
                      rows={5}
                      className="flex w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-normal text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:ring-blue-400 resize-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__("Trip Story / Narrative", "yatra")}
                    </label>
                    <HelpText
                      text={__(
                        "Tell an engaging story about this trip. Use storytelling to connect with potential travelers emotionally",
                        "yatra",
                      )}
                      className="mb-2"
                    />
                    <textarea
                      value={formData.trip_story}
                      onChange={(e) =>
                        handleFieldChange("trip_story", e.target.value)
                      }
                      placeholder={__(
                        "Write an engaging narrative about this trip...",
                        "yatra",
                      )}
                      rows={8}
                      className="flex w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-normal text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:ring-blue-400 resize-none transition-colors"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Testimonials - Select from Reviews */}
              <TestimonialsSelector
                tripId={tripId}
                selectedReviewIds={formData.testimonial_review_ids}
                onChange={(reviewIds) =>
                  handleFieldChange("testimonial_review_ids", reviewIds)
                }
              />
            </div>
          </div>
        );

      case "downloads":
        if (!showDownloadsUI) {
          return (
            <div className="space-y-6">
              <Alert variant="info">
                {__("Downloads module is not enabled.", "yatra")}
              </Alert>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Downloads", "yatra")}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {__(
                "Attach files to this trip and control who can access them.",
                "yatra",
              )}
            </p>

            <Card>
              <CardHeader>
                <CardTitle>{__("Downloads", "yatra")}</CardTitle>
                <CardDescription>
                  {__(
                    "Attach files to this trip and control who can access them.",
                    "yatra",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(formData.downloadable_items || []).length > 0 ? (
                  <div className="space-y-3">
                    {(formData.downloadable_items || []).map((item, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                              {__("Title", "yatra")}
                            </label>
                            <Input
                              value={item.title}
                              onChange={(e) =>
                                handleDownloadableItemChange(
                                  index,
                                  "title",
                                  e.target.value,
                                )
                              }
                              placeholder={__(
                                "E.g. Packing list, itinerary PDF, waiver form...",
                                "yatra",
                              )}
                            />
                          </div>

                          <div className="flex gap-1 pt-7">
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDownloadableItemMove(index, index - 1)
                                }
                                title={__("Move up", "yatra")}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                            )}
                            {index <
                              (formData.downloadable_items || []).length -
                                1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDownloadableItemMove(index, index + 1)
                                }
                                title={__("Move down", "yatra")}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownloadableItemRemove(index)
                              }
                              className="text-red-600 hover:text-red-700"
                              title={__("Remove", "yatra")}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                            {__("Description", "yatra")} (
                            {__("Optional", "yatra")})
                          </label>
                          <textarea
                            value={item.description}
                            onChange={(e) =>
                              handleDownloadableItemChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            rows={3}
                            className="flex w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-normal text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:ring-blue-400 resize-none transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                              {__("Visibility", "yatra")}
                            </label>
                            <Select
                              value={item.visibility}
                              onChange={(e) =>
                                handleDownloadableItemChange(
                                  index,
                                  "visibility",
                                  e.target.value,
                                )
                              }
                            >
                              <option value="public">
                                {__("Public", "yatra")}
                              </option>
                              <option value="logged_in">
                                {__("Private (My Account only)", "yatra")}
                              </option>
                              <option value="booked_only">
                                {__(
                                  "Private (Booking confirmation only)",
                                  "yatra",
                                )}
                              </option>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                              {__("File", "yatra")}
                            </label>
                            <div className="flex items-center gap-2">
                              {item.attachment_url ? (
                                <a
                                  href={item.attachment_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-shrink-0"
                                  title={__("View file", "yatra")}
                                >
                                  {/\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(
                                    item.attachment_url,
                                  ) ? (
                                    <img
                                      src={item.attachment_url}
                                      alt={
                                        item.attachment_title ||
                                        __("Selected file", "yatra")
                                      }
                                      className="w-9 h-9 rounded border border-gray-200 dark:border-gray-700 object-cover bg-white dark:bg-gray-900"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                      <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </div>
                                  )}
                                </a>
                              ) : (
                                <div className="w-9 h-9 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900 flex-shrink-0">
                                  <FileText className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                      handleDownloadableItemSelectFile(index)
                                    }
                                    className="flex items-center gap-2 flex-shrink-0"
                                  >
                                    <Upload className="w-4 h-4" />
                                    {item.attachment_id
                                      ? __("Change File", "yatra")
                                      : __("Select File", "yatra")}
                                  </Button>
                                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate min-w-0">
                                    {item.attachment_title ||
                                      (item.attachment_id
                                        ? `#${item.attachment_id}`
                                        : __("No file selected", "yatra"))}
                                  </span>
                                  {item.attachment_url && (
                                    <a
                                      href={item.attachment_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 flex-shrink-0"
                                    >
                                      <Eye className="w-3 h-3" />
                                      {__("View", "yatra")}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 pt-0.5">
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) =>
                                handleDownloadableItemChange(
                                  index,
                                  "enabled",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {__("Enabled", "yatra")}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                              {__(
                                "Controls whether this file appears and is available for download on the trip page. When disabled, the file is completely hidden from users.",
                                "yatra",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                    <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {__("No downloads added yet", "yatra")}
                    </p>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadableItemAdd}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {__("Add Download", "yatra")}
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case "pricing":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Pricing & Payment", "yatra")}
              </h2>
              <Badge
                variant="outline"
                className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              >
                {__("Recommended", "yatra")}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__("How much does it cost?", "yatra")}
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "Set pricing for different traveler types and payment options. Optional for drafts, but adding pricing now makes publishing easier.",
                  "yatra",
                )}
              </span>
            </p>

            <div className="space-y-4">
              {/* Pricing Type Selection */}
              <div>
                <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-3">
                  {__("Pricing Type", "yatra")}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      formData.pricing_type === "regular"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pricing_type"
                      value="regular"
                      checked={formData.pricing_type === "regular"}
                      onChange={(e) =>
                        handleFieldChange("pricing_type", e.target.value)
                      }
                      className="sr-only"
                    />
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span
                          className={`block text-sm font-semibold ${
                            formData.pricing_type === "regular"
                              ? "text-blue-900 dark:text-blue-300"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {__("Regular Pricing", "yatra")}
                        </span>
                        <span
                          className={`mt-1 flex items-center text-sm ${
                            formData.pricing_type === "regular"
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {__("Set a single price for all travelers", "yatra")}
                        </span>
                      </div>
                    </div>
                    {formData.pricing_type === "regular" && (
                      <div className="absolute top-4 right-4">
                        <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                      </div>
                    )}
                  </label>

                  <label
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      formData.pricing_type === "traveler_based"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pricing_type"
                      value="traveler_based"
                      checked={formData.pricing_type === "traveler_based"}
                      onChange={(e) =>
                        handleFieldChange("pricing_type", e.target.value)
                      }
                      className="sr-only"
                    />
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span
                          className={`block text-sm font-semibold ${
                            formData.pricing_type === "traveler_based"
                              ? "text-blue-900 dark:text-blue-300"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {__("Traveler-Based Pricing", "yatra")}
                        </span>
                        <span
                          className={`mt-1 flex items-center text-sm ${
                            formData.pricing_type === "traveler_based"
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {__(
                            "Set different prices for each traveler category",
                            "yatra",
                          )}
                        </span>
                      </div>
                    </div>
                    {formData.pricing_type === "traveler_based" && (
                      <div className="absolute top-4 right-4">
                        <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Regular Pricing */}
              {formData.pricing_type === "regular" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                        {__("Original Price", "yatra")}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          {getCurrencySymbol(globalCurrency)}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.original_price}
                          onChange={(e) =>
                            handleFieldChange("original_price", e.target.value)
                          }
                          placeholder="0.00"
                          className={`pl-7 ${errors.original_price ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.original_price && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.original_price}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                        {__("Discounted Price", "yatra")} (
                        {__("Optional", "yatra")})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          {getCurrencySymbol(globalCurrency)}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.discounted_price}
                          onChange={(e) =>
                            handleFieldChange(
                              "discounted_price",
                              e.target.value,
                            )
                          }
                          placeholder="0.00"
                          className={`pl-7 ${errors.discounted_price ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.discounted_price && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.discounted_price}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Traveler Category Pricing */}
              {formData.pricing_type === "traveler_based" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                      {__("Traveler Category Pricing", "yatra")}
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {__(
                      "Add pricing for traveler categories. Categories are managed in Traveler Categories page.",
                      "yatra",
                    )}
                  </p>
                  {isLoadingCategories ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : activeCategories.length === 0 ? (
                    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {__("No active traveler categories found.", "yatra")}
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
                  ) : (
                    <div className="space-y-4">
                      {/* Add Pricing Button */}
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
                                !formData.price_types.some(
                                  (pt) =>
                                    Number(pt.category_id) === Number(cat.id),
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
                                    !formData.price_types.some(
                                      (pt) =>
                                        Number(pt.category_id) ===
                                        Number(cat.id),
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
                                          !formData.price_types.some(
                                            (pt) =>
                                              Number(pt.category_id) ===
                                              Number(cat.id),
                                          ),
                                      )
                                      .map((category) => {
                                        const ageRange =
                                          category.age_min !== undefined ||
                                          category.age_max !== undefined
                                            ? category.age_min !== undefined &&
                                              category.age_max !== undefined
                                              ? `${category.age_min}-${category.age_max} ${__("years", "yatra")}`
                                              : category.age_min !== undefined
                                                ? `${category.age_min}+ ${__("years", "yatra")}`
                                                : category.age_max !== undefined
                                                  ? `${__("Under", "yatra")} ${category.age_max} ${__("years", "yatra")}`
                                                  : ""
                                            : null;

                                        const pricingMode =
                                          category.pricing_mode || "per_person";
                                        const hasMin =
                                          category.min_pax !== null &&
                                          category.min_pax !== undefined;
                                        const hasMax =
                                          category.max_pax !== null &&
                                          category.max_pax !== undefined;

                                        let pricingLabel = "";
                                        if (pricingMode === "per_group") {
                                          if (hasMin && hasMax) {
                                            pricingLabel = `${__("Per group", "yatra")} (${category.min_pax}-${category.max_pax})`;
                                          } else if (hasMin) {
                                            pricingLabel = `${__("Per group", "yatra")} (${__("From", "yatra")} ${category.min_pax})`;
                                          } else if (hasMax) {
                                            pricingLabel = `${__("Per group", "yatra")} (${__("Up to", "yatra")} ${category.max_pax})`;
                                          } else {
                                            pricingLabel = __(
                                              "Per group",
                                              "yatra",
                                            );
                                          }
                                        } else {
                                          pricingLabel = __(
                                            "Per person",
                                            "yatra",
                                          );
                                        }

                                        return (
                                          <button
                                            key={category.id}
                                            type="button"
                                            onClick={() => {
                                              handlePriceTypeAdd(category.id);
                                              setShowCategorySelector(false);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                          >
                                            <div className="font-medium text-sm text-gray-900 dark:text-white">
                                              {category.label}
                                              {ageRange && (
                                                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                  ({ageRange})
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                              {category.description}
                                              {pricingLabel && (
                                                <span className="ml-1 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                                  • {pricingLabel}
                                                </span>
                                              )}
                                            </div>
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
                      {formData.price_types.length > 0 && (
                        <div className="space-y-3">
                          {formData.price_types.map((priceType, index) => {
                            // Use Number() to ensure consistent comparison (handles string/number mismatch)
                            const category = activeCategories.find(
                              (cat) =>
                                Number(cat.id) ===
                                Number(priceType.category_id),
                            );
                            if (!category) {
                              return null;
                            }

                            return (
                              <div
                                key={priceType.category_id}
                                className="p-4 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {category.label}
                                        {(category.age_min !== undefined ||
                                          category.age_max !== undefined) && (
                                          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                            (
                                            {category.age_min !== undefined &&
                                            category.age_max !== undefined
                                              ? `${category.age_min}-${category.age_max} ${__("years", "yatra")}`
                                              : category.age_min !== undefined
                                                ? `${category.age_min}+ ${__("years", "yatra")}`
                                                : category.age_max !== undefined
                                                  ? `${__("Under", "yatra")} ${category.age_max} ${__("years", "yatra")}`
                                                  : ""}
                                            )
                                          </span>
                                        )}

                                        {/* Pricing mode & group size */}
                                        <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                          {(() => {
                                            const pricingMode =
                                              category.pricing_mode ||
                                              "per_person";
                                            const hasMin =
                                              category.min_pax !== null &&
                                              category.min_pax !== undefined;
                                            const hasMax =
                                              category.max_pax !== null &&
                                              category.max_pax !== undefined;

                                            if (pricingMode === "per_group") {
                                              if (hasMin && hasMax) {
                                                return `${__("Per group", "yatra")} (${category.min_pax}-${category.max_pax})`;
                                              }
                                              if (hasMin) {
                                                return `${__("Per group", "yatra")} (${__("From", "yatra")} ${category.min_pax})`;
                                              }
                                              if (hasMax) {
                                                return `${__("Per group", "yatra")} (${__("Up to", "yatra")} ${category.max_pax})`;
                                              }
                                              return __("Per group", "yatra");
                                            }

                                            return __("Per person", "yatra");
                                          })()}
                                        </span>
                                      </h4>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {category.description}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePriceTypeRemove(category.id)
                                    }
                                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title={__("Remove Pricing", "yatra")}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                      {__("Original Price", "yatra")}
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                        {getCurrencySymbol(globalCurrency)}
                                      </span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={priceType.original_price}
                                        onChange={(e) =>
                                          handlePriceTypeChange(
                                            category.id,
                                            "original_price",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="0.00"
                                        className={`pl-7 ${errors[`price_type_${index}_original`] ? "border-red-500" : ""}`}
                                      />
                                    </div>
                                    {errors[`price_type_${index}_original`] && (
                                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                        {errors[`price_type_${index}_original`]}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                      {__("Discounted Price", "yatra")} (
                                      {__("Optional", "yatra")})
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                        {getCurrencySymbol(globalCurrency)}
                                      </span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={priceType.discounted_price}
                                        onChange={(e) =>
                                          handlePriceTypeChange(
                                            category.id,
                                            "discounted_price",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="0.00"
                                        className={`pl-7 ${errors[`price_type_${index}_discounted`] ? "border-red-500" : ""}`}
                                      />
                                    </div>
                                    {errors[
                                      `price_type_${index}_discounted`
                                    ] && (
                                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                        {
                                          errors[
                                            `price_type_${index}_discounted`
                                          ]
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                  <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(priceType.is_default)}
                                      onChange={(e) =>
                                        handlePriceTypeDefaultChange(
                                          category.id,
                                          e.target.checked,
                                        )
                                      }
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                                    />
                                    {__(
                                      "Default price (used on page load)",
                                      "yatra",
                                    )}
                                  </label>
                                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {__("Traveler-based pricing only", "yatra")}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Empty State */}
                      {formData.price_types.length === 0 && (
                        <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                          <Tag className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {__(
                              "No pricing added yet. Select a category above to add pricing.",
                              "yatra",
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {errors.price_types && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.price_types}
                    </p>
                  )}
                </div>
              )}

              {/*
                Deposit & Payment Terms — Pro feature (FlexiblePayments module).
                The DB columns live in the free TripsTable schema so existing data
                survives toggling Pro on/off. Editing is gated on
                window.yatraAdmin.flexiblePaymentsEnabled (set true by Pro's
                FlexiblePaymentsModule::addAdminData() on yatra_admin_localized_data).

                We deliberately render the section in all three states (free / Pro
                installed-but-module-off / Pro+module-on) so the feature is
                discoverable in the free plugin. When unlocked → editable. When
                locked → fields shown disabled inside a <fieldset disabled>, with a
                PRO badge on the heading and a context-aware info banner above:
                  - free: "Upgrade to Pro" link
                  - Pro installed but module disabled: "Activate Module" link
              */}
              {(() => {
                const flexiblePaymentsEnabled = Boolean(
                  (window as any)?.yatraAdmin?.flexiblePaymentsEnabled,
                );
                const isLocked = !flexiblePaymentsEnabled;
                const siteUrl =
                  (window as any)?.yatraAdmin?.siteUrl ||
                  "/wp-admin/admin.php?page=yatra";
                const modulesPageUrl = `${siteUrl}/wp-admin/admin.php?page=yatra&subpage=modules`;
                const pricingUrl = "https://mantrabrain.com/yatra-pricing/";

                return (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      {__("Deposit & Payment Terms", "yatra")}
                      {isLocked && <ProBadge isProActive={isPro} />}
                    </h3>

                    {isLocked && (
                      <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-md text-xs text-purple-900 dark:text-purple-100 flex items-start gap-2">
                        <svg
                          className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <div className="flex-1">
                          {isPro ? (
                            <>
                              {__(
                                "Per-trip deposits need the Flexible Payments module.",
                                "yatra",
                              )}{" "}
                              <a
                                href={modulesPageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-medium"
                              >
                                {__("Activate module", "yatra")}
                              </a>
                            </>
                          ) : (
                            <>
                              {__(
                                "Per-trip deposit amount, percentage and custom payment terms are a Yatra Pro feature.",
                                "yatra",
                              )}{" "}
                              <a
                                href={pricingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-medium"
                              >
                                {__("Upgrade to Pro", "yatra")}
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/*
                      <fieldset disabled> is the HTML-standard way to make every
                      form control inside it non-interactive in one go — works
                      for our <Input> and <textarea> without per-field disabled props.
                    */}
                    <fieldset
                      disabled={isLocked}
                      className={
                        isLocked
                          ? "opacity-60 cursor-not-allowed select-none"
                          : ""
                      }
                      aria-label={
                        isLocked
                          ? __(
                              "Deposit & Payment Terms (Pro feature, disabled)",
                              "yatra",
                            )
                          : undefined
                      }
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="deposit_amount"
                            className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                          >
                            {__("Deposit Amount", "yatra")}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              {getCurrencySymbol(globalCurrency)}
                            </span>
                            <Input
                              id="deposit_amount"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.deposit_amount}
                              onChange={(e) =>
                                handleFieldChange(
                                  "deposit_amount",
                                  e.target.value,
                                )
                              }
                              placeholder="0.00"
                              className="pl-7"
                            />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="deposit_percentage"
                            className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                          >
                            {__("Deposit Percentage", "yatra")}
                          </label>
                          <div className="relative">
                            <Input
                              id="deposit_percentage"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.deposit_percentage}
                              onChange={(e) =>
                                handleFieldChange(
                                  "deposit_percentage",
                                  e.target.value,
                                )
                              }
                              placeholder="0"
                              className="pr-7"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label
                          htmlFor="payment_terms"
                          className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                        >
                          {__("Payment Terms", "yatra")}
                        </label>
                        <textarea
                          id="payment_terms"
                          value={formData.payment_terms}
                          onChange={(e) =>
                            handleFieldChange("payment_terms", e.target.value)
                          }
                          placeholder={__(
                            "e.g., 50% deposit required at booking, balance due 30 days before departure",
                            "yatra",
                          )}
                          rows={2}
                          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                        />
                      </div>
                    </fieldset>
                  </div>
                );
              })()}

              {/* Group Pricing */}
              {/* Removed */}
            </div>
          </div>
        );

      case "attributes":
        // Redirect to categorization section (attributes now merged there)
        setCurrentSection("categorization");
        return null;

      case "itinerary":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Trip Details", "yatra")}
              </h2>
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                {__("Recommended", "yatra")}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__("What will travelers experience?", "yatra")}
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "Build your day-by-day itinerary and list what's included/excluded to set clear expectations.",
                  "yatra",
                )}
              </span>
            </p>

            {/* Sub-tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex gap-6" aria-label="Trip Details Tabs">
                <button
                  onClick={() => setTripDetailsTab("itinerary")}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    tripDetailsTab === "itinerary"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {__("Itinerary", "yatra")}
                  </div>
                </button>
                <button
                  onClick={() => setTripDetailsTab("included")}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    tripDetailsTab === "included"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    {__("Included/Excluded", "yatra")}
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {tripDetailsTab === "itinerary" && (
                <>
                  {isAiEligible() && isAiModuleEnabled() && (
                    <div className="mb-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50/40 px-3 py-2 dark:border-blue-500/40 dark:bg-blue-900/20">
                      <div className="text-xs text-blue-900 dark:text-blue-200">
                        <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                        {isEditMode
                          ? __(
                              "Let AI draft a day-by-day plan with real activity blocks — you can edit each day after.",
                              "yatra",
                            )
                          : __(
                              "Save the trip first to enable AI itinerary generation — the agent needs a trip ID to attach days to.",
                              "yatra",
                            )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-500/60 dark:text-blue-200"
                        disabled={!isEditMode || !tripId}
                        onClick={() => {
                          // Same modal the Itinerary page uses, so all
                          // three entry points share one agent + one
                          // persistence path.
                          if (isEditMode && tripId) {
                            setItineraryBuildOpen(true);
                          }
                        }}
                      >
                        <Sparkles className="mr-1 h-3.5 w-3.5" />
                        {__("Build with AI", "yatra")}
                      </Button>
                    </div>
                  )}
                  <ItinerarySection
                    formData={formData as any}
                    isEditMode={isEditMode}
                    tripId={tripId}
                  />
                </>
              )}
              {tripDetailsTab === "included" && (
                <IncludedSection
                  formData={formData}
                  errors={errors}
                  handleFieldChange={handleFieldChange as any}
                />
              )}
            </div>
          </div>
        );

      case "included":
        // Redirect to itinerary with included tab selected
        setCurrentSection("itinerary");
        setTripDetailsTab("included");
        return null;

      case "faqs":
        // Redirect to seo section (FAQs now merged there)
        setCurrentSection("seo");
        return null;

      // Removed: case 'frontend-tabs' - now part of 'advanced' case

      case "seo":
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Search className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("SEO & Marketing", "yatra")}
              </h2>
              <Badge
                variant="outline"
                className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              >
                {__("Recommended", "yatra")}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__("How will people find & trust this trip?", "yatra")}
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "Optimize for search engines and answer common questions to build trust and improve discoverability.",
                  "yatra",
                )}
              </span>
            </p>

            <div className="space-y-6">
              {/* SECTION 1: SEO Settings */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-500" />
                  {__("Search Engine Optimization", "yatra")}
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="meta_title"
                        className="block text-xs font-normal text-gray-500 dark:text-gray-400"
                      >
                        {__("Meta Title", "yatra")}
                      </label>
                      <AiFieldAffordance
                        task="seo-meta-title"
                        label={__("Meta Title", "yatra")}
                        value={formData.meta_title}
                        onAccept={(v) =>
                          handleFieldChange(
                            "meta_title",
                            v.slice(0, 60),
                          )
                        }
                        buildContext={() => buildTripAiContext(formData)}
                      />
                    </div>
                    <Input
                      id="meta_title"
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) =>
                        handleFieldChange("meta_title", e.target.value)
                      }
                      placeholder={formData.title || __("Trip Title", "yatra")}
                      maxLength={60}
                    />
                    <HelpText
                      text={__(
                        "Best for search engines: 50-60 characters. Include main keywords.",
                        "yatra",
                      )}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="meta_description"
                        className="block text-xs font-normal text-gray-500 dark:text-gray-400"
                      >
                        {__("Meta Description", "yatra")}
                      </label>
                      <AiFieldAffordance
                        task="seo-meta-description"
                        label={__("Meta Description", "yatra")}
                        value={formData.meta_description}
                        onAccept={(v) =>
                          handleFieldChange(
                            "meta_description",
                            v.slice(0, 160),
                          )
                        }
                        buildContext={() => buildTripAiContext(formData)}
                      />
                    </div>
                    <textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) =>
                        handleFieldChange("meta_description", e.target.value)
                      }
                      rows={3}
                      maxLength={160}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                      placeholder={__(
                        "Compelling description that includes key travel terms...",
                        "yatra",
                      )}
                    />
                    <HelpText
                      text={__(
                        "160 characters max. Include location, duration, and key features.",
                        "yatra",
                      )}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="meta_keywords"
                      className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5"
                    >
                      {__("Meta Keywords", "yatra")}
                    </label>
                    <Input
                      id="meta_keywords"
                      type="text"
                      value={formData.meta_keywords}
                      onChange={(e) =>
                        handleFieldChange("meta_keywords", e.target.value)
                      }
                      placeholder={__(
                        "adventure, travel, tour, guide, experience",
                        "yatra",
                      )}
                    />
                    <HelpText
                      text={__(
                        "Comma-separated keywords. Include location, activities, and travel terms.",
                        "yatra",
                      )}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* SEO Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>{__("SEO Preview", "yatra")}</CardTitle>
                    <CardDescription>
                      {__(
                        "Preview how your trip appears in search results",
                        "yatra",
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {__("Google Search Result Preview", "yatra")}
                      </div>
                      <div className="space-y-2">
                        <div className="text-blue-800 dark:text-blue-400 text-sm font-medium">
                          {sanitizeTextForSEO(
                            formData.meta_title ||
                              formData.title ||
                              "Trip Title",
                            60,
                          )}
                        </div>
                        <div className="text-green-700 dark:text-green-400 text-sm">
                          {formData.meta_description
                            ? sanitizeTextForSEO(formData.meta_description, 150)
                            : formData.description
                              ? sanitizeTextForSEO(formData.description, 150)
                              : "Trip description..."}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">
                          {window.location.hostname}/trip/
                          {formData.slug || "trip-slug"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 2: FAQs */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/30">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                    {__("Frequently Asked Questions", "yatra")}
                  </h3>
                  {/* AI: generates 5-7 Q&A pairs. Result text is
                      parsed from "Q: …\nA: …" blocks separated by
                      blank lines — same shape as the trip-faq
                      prompt's documented output. Accept replaces
                      the existing FAQ list wholesale. */}
                  <AiFieldAffordance
                    task="trip-faq"
                    label={__("FAQ", "yatra")}
                    value={(formData.faqs ?? [])
                      .map((f: any) => `Q: ${f.question}\nA: ${f.answer}`)
                      .join("\n\n")}
                    onAccept={(raw) => {
                      const parsed: Array<{
                        question: string;
                        answer: string;
                      }> = [];
                      const blocks = raw.replace(/\r\n?/g, "\n").split(/\n{2,}/);
                      for (const block of blocks) {
                        const q = block.match(/^\s*Q[:\.\-]\s*(.+)/im);
                        const a = block.match(/A[:\.\-]\s*([\s\S]+)/im);
                        if (q) {
                          parsed.push({
                            question: q[1].trim(),
                            answer: a ? a[1].trim() : "",
                          });
                        }
                      }
                      if (parsed.length > 0) {
                        handleFieldChange("faqs", parsed as any);
                      }
                    }}
                    buildContext={() => buildTripAiContext(formData)}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {__(
                    "Answer common questions to build trust and reduce support inquiries. FAQs also help with SEO.",
                    "yatra",
                  )}
                </p>
                <div className="space-y-4">
                  {formData.faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {__("FAQ", "yatra")} {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleFAQRemove(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                            {__("Question", "yatra")}
                          </label>
                          <Input
                            type="text"
                            value={faq.question}
                            onChange={(e) =>
                              handleFAQChange(index, "question", e.target.value)
                            }
                            placeholder={__("Enter question...", "yatra")}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                            {__("Answer", "yatra")}
                          </label>
                          <textarea
                            value={faq.answer}
                            onChange={(e) =>
                              handleFAQChange(index, "answer", e.target.value)
                            }
                            placeholder={__("Enter answer...", "yatra")}
                            rows={3}
                            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFAQAdd}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {__("Add FAQ", "yatra")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case "advanced":
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__("Lifecycle Management", "yatra")}
              </h2>
              <Badge
                variant="outline"
                className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800"
              >
                {__("Power Users", "yatra")}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__("When should this trip be published or archived?", "yatra")}
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "Schedule automatic publishing and unpublishing for seasonal trips. Optional but useful for managing trip lifecycles.",
                  "yatra",
                )}
              </span>
            </p>

            <Card>
              <CardHeader>
                <CardTitle>{__("Version Control", "yatra")}</CardTitle>
                <CardDescription>
                  {__("Track changes and version history", "yatra")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__("Version", "yatra")}
                  </label>
                  <Input
                    type="number"
                    value={formData.version}
                    onChange={(e) =>
                      handleFieldChange(
                        "version",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    min="1"
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <HelpText
                    text={__(
                      "Version number is automatically incremented when changes are saved",
                      "yatra",
                    )}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{__("Scheduled Publishing", "yatra")}</CardTitle>
                <CardDescription>
                  {__(
                    "Automatically publish or unpublish your trip on specific dates",
                    "yatra",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__("Schedule Publish Date", "yatra")}
                  </label>
                  <DatePicker
                    value={formData.scheduled_publish_date}
                    onChange={(val) =>
                      handleFieldChange("scheduled_publish_date", val)
                    }
                    placeholder={__("Select date", "yatra")}
                  />
                  <HelpText
                    text={__(
                      "Trip will be automatically published on this date and time",
                      "yatra",
                    )}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__("Schedule Unpublish Date", "yatra")}
                  </label>
                  <DatePicker
                    value={formData.scheduled_unpublish_date}
                    onChange={(val) =>
                      handleFieldChange("scheduled_unpublish_date", val)
                    }
                    placeholder={__("Select date", "yatra")}
                  />
                  <HelpText
                    text={__(
                      "Trip will be automatically unpublished (archived) on this date and time",
                      "yatra",
                    )}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {__("Seasonal Auto-Enable/Disable", "yatra")}
                </CardTitle>
                <CardDescription>
                  {__(
                    "Automatically enable or disable trip availability based on seasonal dates",
                    "yatra",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="seasonal_auto_enable"
                    checked={formData.seasonal_auto_enable}
                    onChange={(e) =>
                      handleFieldChange(
                        "seasonal_auto_enable",
                        e.target.checked,
                      )
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="seasonal_auto_enable"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {__("Enable seasonal auto-management", "yatra")}
                  </label>
                </div>
                {formData.seasonal_auto_enable && (
                  <>
                    <div>
                      <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                        {__("Auto-Enable Date", "yatra")}
                      </label>
                      <DatePicker
                        value={formData.seasonal_enable_date}
                        onChange={(val) =>
                          handleFieldChange("seasonal_enable_date", val)
                        }
                        placeholder={__("Select date", "yatra")}
                      />
                      <HelpText
                        text={__(
                          "Trip will become available for booking on this date",
                          "yatra",
                        )}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                        {__("Auto-Disable Date", "yatra")}
                      </label>
                      <DatePicker
                        value={formData.seasonal_disable_date}
                        onChange={(val) =>
                          handleFieldChange("seasonal_disable_date", val)
                        }
                        placeholder={__("Select date", "yatra")}
                      />
                      <HelpText
                        text={__(
                          "Trip will become unavailable for booking on this date",
                          "yatra",
                        )}
                        className="mt-2"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Frontend Tabs Management */}
            <Card>
              <CardHeader>
                <CardTitle>{__("Frontend Tabs Management", "yatra")}</CardTitle>
                <CardDescription>
                  {__(
                    "Manage which tabs appear on the trip single page and in what order. Enable or disable tabs, customize labels, and reorder them.",
                    "yatra",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...formData.frontend_tabs]
                    .sort((a, b) => a.order - b.order)
                    .map((tab, index) => (
                      <div
                        key={tab.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tab.id)}
                        onDragOver={handleDragOver}
                        onDragEnter={() => handleDragEnter(tab.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, tab.id)}
                        onDragEnd={handleDragEnd}
                        className={`p-4 rounded-lg border cursor-move relative ${
                          tab.enabled
                            ? "bg-gray-50 dark:bg-gray-850 border-gray-200 dark:border-gray-700 shadow-sm"
                            : "bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-60 shadow-sm"
                        } ${
                          draggedTab === tab.id
                            ? "opacity-50 scale-95 shadow-lg"
                            : ""
                        } ${
                          dragOverTab === tab.id && draggedTab !== tab.id
                            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                            : ""
                        }`}
                      >
                        {tab.content_type === "custom" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTabRemove(tab.id)}
                            className="absolute top-2 right-2 h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title={__("Delete tab", "yatra")}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        )}
                        <div className="flex items-center gap-3 mb-3">
                          <GripVertical className="w-6 h-6 text-gray-400 cursor-grab active:cursor-grabbing" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Input
                                type="text"
                                value={tab.label}
                                onChange={(e) =>
                                  handleTabLabelChange(tab.id, e.target.value)
                                }
                                className="text-sm font-medium flex-1"
                                disabled={!tab.enabled}
                                placeholder={__("Tab Label", "yatra")}
                              />
                              <Badge variant="outline" className="text-xs">
                                {tab.content_type}
                              </Badge>
                            </div>
                            <div className="mb-2">
                              {tab.enabled ? (
                                <IconPicker
                                  value={tab.icon || null}
                                  onChange={(value) =>
                                    handleTabIconChange(tab.id, value)
                                  }
                                  label={__("Tab Icon", "yatra")}
                                  helpText={__(
                                    "Select an icon or upload an image for this tab",
                                    "yatra",
                                  )}
                                  size="sm"
                                />
                              ) : (
                                <div className="opacity-50">
                                  <IconPicker
                                    value={tab.icon || null}
                                    onChange={() => {}} // No-op when disabled
                                    label={__("Tab Icon", "yatra")}
                                    helpText={__(
                                      "Enable this tab to select an icon",
                                      "yatra",
                                    )}
                                    size="sm"
                                  />
                                </div>
                              )}
                            </div>
                            {tab.content_type === "custom" && (
                              <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                  {__("Custom Content", "yatra")}
                                </label>
                                <textarea
                                  value={tab.custom_content || ""}
                                  onChange={(e) =>
                                    handleTabCustomContentChange(
                                      tab.id,
                                      e.target.value,
                                    )
                                  }
                                  rows={3}
                                  disabled={!tab.enabled}
                                  placeholder={__(
                                    "Enter custom content for this tab...",
                                    "yatra",
                                  )}
                                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                                />
                              </div>
                            )}
                            {tab.content_type !== "custom" && (
                              <div className="mt-2">
                                <Select
                                  value={tab.content_type}
                                  onChange={(e) =>
                                    handleTabContentTypeChange(
                                      tab.id,
                                      e.target
                                        .value as FrontendTab["content_type"],
                                    )
                                  }
                                  disabled={!tab.enabled}
                                  className="text-xs"
                                >
                                  <option value="overview">
                                    {__("Overview", "yatra")}
                                  </option>
                                  <option value="itinerary">
                                    {__("Itinerary", "yatra")}
                                  </option>
                                  <option value="included_excluded">
                                    {__("Included", "yatra")}
                                  </option>
                                  <option value="location">
                                    {__("Location", "yatra")}
                                  </option>
                                  <option value="important_info">
                                    {__("Important Info", "yatra")}
                                  </option>
                                  <option value="downloads">
                                    {__("Downloads", "yatra")}
                                  </option>
                                  <option value="faq">
                                    {__("FAQ", "yatra")}
                                  </option>
                                  <option value="trip_story">
                                    {__("Story", "yatra")}
                                  </option>
                                  <option value="what_makes_special">
                                    {__("Special", "yatra")}
                                  </option>
                                  <option value="testimonials">
                                    {__("Testimonials", "yatra")}
                                  </option>
                                  <option value="custom">
                                    {__("Custom Content", "yatra")}
                                  </option>
                                </Select>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTabMove(tab.id, "up")}
                              disabled={index === 0}
                              className="h-10 w-10 p-0"
                              title={__("Move up", "yatra")}
                            >
                              <ChevronUp className="w-5 h-5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTabMove(tab.id, "down")}
                              disabled={
                                index === formData.frontend_tabs.length - 1
                              }
                              className="h-10 w-10 p-0"
                              title={__("Move down", "yatra")}
                            >
                              <ChevronDown className="w-5 h-5" />
                            </Button>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tab.enabled}
                                onChange={() => handleTabToggle(tab.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {tab.enabled
                                  ? __("Enabled", "yatra")
                                  : __("Disabled", "yatra")}
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTabAdd}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {__("Add Custom Tab", "yatra")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            {__("Section content coming soon...", "yatra")}
          </div>
        );
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        {/* Left Side - Title, Status, Saved Time */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {formData.title || __("New Trip", "yatra")}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${
                  formData.status === "publish"
                    ? "text-green-700 dark:text-green-400 border-green-300 dark:border-green-800"
                    : formData.status === "review"
                      ? "text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800"
                      : formData.status === "approved"
                        ? "text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                        : formData.status === "suspended"
                          ? "text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800"
                          : formData.status === "archived"
                            ? "text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                            : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {formData.status === "draft"
                  ? __("Draft", "yatra")
                  : formData.status === "review"
                    ? __("Review", "yatra")
                    : formData.status === "approved"
                      ? __("Approved", "yatra")
                      : formData.status === "publish"
                        ? __("Published", "yatra")
                        : formData.status === "suspended"
                          ? __("Suspended", "yatra")
                          : __("Archived", "yatra")}
              </Badge>
            </div>
          </div>

          {/* Quick Start Mode Toggle */}
          {!isEditMode && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
              <button
                onClick={() => setSimpleMode(!simpleMode)}
                className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                title={
                  simpleMode
                    ? __("Switch to Advanced Mode", "yatra")
                    : __("Switch to Simple Mode", "yatra")
                }
              >
                <Lightbulb
                  className={`w-3.5 h-3.5 ${simpleMode ? "text-yellow-500" : ""}`}
                />
                <span>
                  {simpleMode ? __("Simple", "yatra") : __("Advanced", "yatra")}
                </span>
              </button>
            </div>
          )}

          {/* Guided Tour Button (First Time Users) */}
          {!isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                showToast(
                  __("Guided tour feature coming soon!", "yatra"),
                  "info",
                );
              }}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex-shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              {__("Take a Tour", "yatra")}
            </Button>
          )}

          {/* Dummy Data Button */}
          {!isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFillDummyData}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex-shrink-0"
              title={__("Fill form with dummy data", "yatra")}
            >
              <Database className="w-3.5 h-3.5 mr-1" />
              {__("Fill Dummy Data", "yatra")} ({dummyDataIndex + 1}/
              {dummyTripsData.length})
            </Button>
          )}
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditMode && (
            <Button
              variant="outline"
              onClick={() => setShowRevisionsDialog(true)}
              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <History className="w-4 h-4 mr-2" />
              {__("Revisions", "yatra")}
            </Button>
          )}
          {isAiEligible() && isAiModuleEnabled() && (
            <Button
              type="button"
              onClick={() => {
                setAiModalMode("all");
                setAiModalOpen(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 hover:from-purple-700 hover:to-indigo-700"
              title={__(
                "Generate description, itinerary, included items, SEO meta, and more — from this trip's facts.",
                "yatra",
              )}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {__("Auto-fill with AI", "yatra")}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handlePreview}
            className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={!formData.slug}
          >
            <Eye className="w-4 h-4 mr-2" />
            {__("Preview", "yatra")}
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditMode
              ? __("Update Draft", "yatra")
              : __("Save Draft", "yatra")}
          </Button>
          <div className="relative group">
            <Button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 relative"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  {/* Send icon (paper-plane) — used to be Sparkles,
                      which made it look like an AI feature; replaced
                      so the publish button reads as a regular submit
                      action, distinct from the actual AI affordances
                      sprinkled across the form. */}
                  <Send className="w-4 h-4 mr-2" />
                  {isEditMode
                    ? __("Update Trip", "yatra")
                    : __("Publish Trip", "yatra")}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            {!isSubmitting && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange("status", "draft");
                      handleSaveDraft();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span>{__("Save as Draft", "yatra")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange("status", "review");
                      handlePublish();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span>{__("Save for Review", "yatra")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange("status", "approved");
                      handlePublish();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span>{__("Mark as Approved", "yatra")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isEditMode
                        ? __("Update & Publish", "yatra")
                        : __("Publish", "yatra")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange("status", "suspended");
                      handlePublish();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span>{__("Suspend", "yatra")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange("status", "archived");
                      handlePublish();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span>{__("Archive", "yatra")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="default"
            onClick={goToPreviousSection}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2 text-sm font-semibold border-2 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-500 dark:hover:border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 px-4 py-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {__("Previous", "yatra")}
          </Button>

          {/* Next Button */}
          <Button
            variant="outline"
            size="default"
            onClick={goToNextSection}
            disabled={currentStepIndex >= allSections.length - 1}
            className="flex items-center gap-2 text-sm font-semibold border-2 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-500 dark:hover:border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 px-4 py-2"
          >
            {__("Next", "yatra")}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 p-0">
        {/* Sidebar */}
        <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-hidden flex-shrink-0 min-h-0">
          <div className="p-5 pb-8 space-y-6">
            {/* PHASE 1: ESSENTIALS */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="flex items-center gap-2 flex-1">
                  <Box className="w-3.5 h-3.5 text-red-500 dark:text-red-400 flex-shrink-0" />
                  <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {__("PHASE 1: ESSENTIALS", "yatra")}
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                >
                  {__("Must Complete", "yatra")}
                </Badge>
              </div>
              <div className="space-y-0.5">
                {essentialsSections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = currentSection === section.id;
                  const isNext =
                    !section.completed &&
                    essentialsSections
                      .slice(0, index)
                      .every((s) => s.completed);
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setCurrentSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 text-left group border relative ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border-blue-200 dark:border-blue-800"
                          : isNext
                            ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            : "border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                            isActive
                              ? "bg-blue-600 text-white dark:bg-blue-500"
                              : isNext
                                ? "bg-amber-500 text-white"
                                : section.completed
                                  ? "bg-green-500 text-white"
                                  : section.hasErrors
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : isNext
                                ? "text-amber-600 dark:text-amber-400"
                                : section.hasErrors
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                          }`}
                        />
                      </div>
                      <span className="flex-1 min-w-0 break-words leading-snug">
                        {section.label}
                        {section.required && (
                          <span className="ml-1 text-[9px] text-red-500">
                            *
                          </span>
                        )}
                      </span>
                      {section.hasErrors && (
                        <span
                          className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full"
                          title={__("This section has errors", "yatra")}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PHASE 2: DETAILS */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="flex items-center gap-2 flex-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {__("PHASE 2: DETAILS", "yatra")}
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                >
                  {__("Recommended", "yatra")}
                </Badge>
              </div>
              <div className="space-y-0.5">
                {detailsSections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = currentSection === section.id;
                  const sectionNumber = essentialsSections.length + index + 1;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setCurrentSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 text-left group border ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border-blue-200 dark:border-blue-800"
                          : section.hasErrors
                            ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                            : "border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                            isActive
                              ? "bg-blue-600 text-white dark:bg-blue-500"
                              : section.completed
                                ? "bg-green-500 text-white"
                                : section.hasErrors
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {sectionNumber}
                        </span>
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : section.hasErrors
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                          }`}
                        />
                      </div>
                      <span className="flex-1 min-w-0 break-words leading-snug">
                        {section.label}
                      </span>
                      {section.hasErrors && (
                        <span
                          className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full"
                          title={__("This section has errors", "yatra")}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PHASE 3: OPTIMIZATION */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="flex items-center gap-2 flex-1">
                  <BarChart3 className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                  <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {__("PHASE 3: OPTIMIZATION", "yatra")}
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                >
                  {__("Optional", "yatra")}
                </Badge>
              </div>
              <div className="space-y-0.5">
                {optimizationSections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = currentSection === section.id;
                  const sectionNumber =
                    essentialsSections.length +
                    detailsSections.length +
                    index +
                    1;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setCurrentSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 text-left group border ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border-blue-200 dark:border-blue-800"
                          : section.hasErrors
                            ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                            : "border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                            isActive
                              ? "bg-blue-600 text-white dark:bg-blue-500"
                              : section.completed
                                ? "bg-green-500 text-white"
                                : section.hasErrors
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {sectionNumber}
                        </span>
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : section.hasErrors
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                          }`}
                        />
                      </div>
                      <span className="flex-1 min-w-0 break-words leading-snug">
                        {section.label}
                      </span>
                      {section.hasErrors && (
                        <span
                          className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full"
                          title={__("This section has errors", "yatra")}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PHASE 4: ADVANCED */}
            <div className="pb-12">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="flex items-center gap-2 flex-1">
                  <Settings className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {__("PHASE 4: ADVANCED", "yatra")}
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800"
                >
                  {__("Power Users", "yatra")}
                </Badge>
              </div>
              <div className="space-y-0.5">
                {advancedSections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = currentSection === section.id;
                  const sectionNumber =
                    essentialsSections.length +
                    detailsSections.length +
                    optimizationSections.length +
                    index +
                    1;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setCurrentSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 text-left group border ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border-blue-200 dark:border-blue-800"
                          : "border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                            isActive
                              ? "bg-blue-600 text-white dark:bg-blue-500"
                              : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {sectionNumber}
                        </span>
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                          }`}
                        />
                      </div>
                      <span className="flex-1 min-w-0 break-words leading-snug">
                        {section.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          <div className="p-6 pb-24 max-w-4xl">
            {errors.submit && (
              <Alert variant="error" className="mb-4">
                {errors.submit}
              </Alert>
            )}
            {renderSectionContent()}
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Highlight Modal */}
      {showHighlightModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowHighlightModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {__("Add Highlight", "yatra")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__("Highlight Text", "yatra")}
                </label>
                <Input
                  type="text"
                  value={modalInput.text}
                  onChange={(e) =>
                    setModalInput({ ...modalInput, text: e.target.value })
                  }
                  placeholder={__("e.g., Private guide included", "yatra")}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleHighlightSave();
                    }
                  }}
                />
                <HelpText
                  text={__(
                    'Keep it short and impactful. Examples: "All meals included", "Skip-the-line tickets", "Free airport transfer"',
                    "yatra",
                  )}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowHighlightModal(false)}
                >
                  {__("Cancel", "yatra")}
                </Button>
                <Button
                  onClick={handleHighlightSave}
                  disabled={!modalInput.text.trim()}
                >
                  {__("Add", "yatra")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revisions Dialog */}
      {showRevisionsDialog && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowRevisionsDialog(false)}
        >
          <Card
            className="w-full max-w-2xl max-h-[80vh] mx-4 shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5" />
                  {__("Trip Revisions", "yatra")}
                </CardTitle>
                <button
                  onClick={() => setShowRevisionsDialog(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={__("Close", "yatra")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pb-4">
              {isLoadingRevisions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {__("Loading revisions...", "yatra")}
                  </span>
                </div>
              ) : revisions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {__("No revisions found", "yatra")}
                </div>
              ) : (
                <div className="space-y-2">
                  {revisions.map((revision) => (
                    <div
                      key={revision.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => handleRevisionClick(revision.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">v{revision.version}</Badge>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {__("Revision", "yatra")} {revision.version}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {__("Created by", "yatra")}{" "}
                            {revision.created_by_name} •{" "}
                            {new Date(revision.created_at).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevisionClick(revision.id);
                          }}
                        >
                          {__("Use This Revision", "yatra")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revision Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showRevisionConfirm}
        onClose={() => {
          setShowRevisionConfirm(false);
          setSelectedRevisionId(null);
        }}
        onConfirm={handleRevisionConfirm}
        title={__("Use This Revision?", "yatra")}
        message={__(
          "Do you want to use this revision? This will replace all current form data with the revision data.",
          "yatra",
        )}
        confirmText={__("Yes, Use This Revision", "yatra")}
        cancelText={__("Cancel", "yatra")}
        variant="info"
        isLoading={false}
      />

      {/* Landmark Input Modal */}
      <Modal
        isOpen={showLandmarkDialog}
        onClose={() => {
          setShowLandmarkDialog(false);
          setLandmarkInput("");
        }}
        title={__("Add Landmark", "yatra")}
        description={__(
          "Enter the name of the landmark or point of interest",
          "yatra",
        )}
        size="sm"
        hideFooter={false}
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowLandmarkDialog(false);
                setLandmarkInput("");
              }}
            >
              {__("Cancel", "yatra")}
            </Button>
            <Button
              onClick={() => {
                if (landmarkInput.trim()) {
                  handleFieldChange("landmarks", [
                    ...formData.landmarks,
                    landmarkInput.trim(),
                  ]);
                  setLandmarkInput("");
                  setShowLandmarkDialog(false);
                }
              }}
              disabled={!landmarkInput.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              {__("Add Landmark", "yatra")}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {__("Landmark Name", "yatra")}
            </label>
            <Input
              type="text"
              value={landmarkInput}
              onChange={(e) => setLandmarkInput(e.target.value)}
              placeholder={__(
                "e.g., Eiffel Tower, Central Park, Grand Canyon",
                "yatra",
              )}
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && landmarkInput.trim()) {
                  handleFieldChange("landmarks", [
                    ...formData.landmarks,
                    landmarkInput.trim(),
                  ]);
                  setLandmarkInput("");
                  setShowLandmarkDialog(false);
                }
              }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {__(
              "Examples: Famous monuments, natural landmarks, historical sites, viewpoints, or points of interest that travelers will visit during this trip.",
              "yatra",
            )}
          </div>
        </div>
      </Modal>
      {/* AI Assistant — auto-fill / itinerary modal. Mounted at the root
          so it overlays the whole form regardless of which section is
          currently active. */}
      <AutoFillTripModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        buildContext={() => buildTripAiContext(formData)}
        itineraryOnly={aiModalMode === "itinerary"}
        onFieldsAccepted={(updates) => {
          for (const [key, value] of Object.entries(updates)) {
            handleFieldChange(key as any, value as any);
          }
        }}
      />
      {/* Same modal as the standalone Itinerary page. We mount it
          here so the Itinerary tab's "Build with AI" button can drive
          the SAME agent + applyItinerary flow that the other two
          surfaces use, instead of forking through AutoFillTripModal's
          single-shot legacy parser. */}
      {isEditMode && tripId && (
        <BuildItineraryModal
          open={itineraryBuildOpen}
          onClose={() => setItineraryBuildOpen(false)}
          tripId={tripId}
          tripName={(formData as any)?.title || __("Trip", "yatra")}
          tripDurationDays={Number((formData as any)?.duration_days) || 0}
          onApplied={() => {
            // Persistence happened server-side via applyItinerary; the
            // trip form's local itinerary state needs to refresh so the
            // newly-created day rows show up. The TripForm reloads
            // itinerary data on a routing event — we just close the
            // modal and let the user navigate / save normally.
            setItineraryBuildOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default TripForm;
