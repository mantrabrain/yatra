/**
 * Shared types for Trip Form components
 */

export interface MediaItem {
  id: string;
  attachment_id: number;
  type: "image" | "video";
  url?: string;
  thumbnail_url?: string;
  alt_text?: string;
  caption?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface TravelerCategory {
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

export interface PriceType {
  category_id: number;
  original_price: string;
  discounted_price: string;
  is_default?: boolean;
}

export interface FrontendTab {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  content_type:
    | "general"
    | "pricing"
    | "itinerary"
    | "included_excluded"
    | "gallery"
    | "faqs"
    | "reviews"
    | "downloads"
    | "custom";
  custom_content?: string;
}

export interface AvailabilityDate {
  id: string;
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

export interface ItineraryEntry {
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
  gallery: MediaItem[];
  video_url?: string;
  status?: "active" | "inactive";
}

export interface ItineraryDay {
  day: number;
  day_title?: string;
  entries: ItineraryEntry[];
}

export interface TripAmenityItem {
  title: string;
  description: string;
}

export interface TripFormData {
  // Overview
  title: string;
  slug: string;
  description: string;
  highlights: string[];
  trip_details: string;
  short_description: string;
  what_makes_special: string;
  trip_story: string;
  video_url: string;
  virtual_tour_url: string;
  testimonial_review_ids: number[]; // Array of review IDs to display as testimonials

  // Location & Geography
  destinations: number[]; // Array of destination IDs
  starting_location: string;
  ending_location: string;
  countries: string[];
  regions: string[];
  latitude: string;
  longitude: string;
  landmarks: string[];

  // Duration & Schedule
  trip_type: "single_day" | "multi_day" | "flexible";
  duration_days: string;
  duration_nights: string;
  available_from: string;
  available_to: string;
  booking_window_days: string;
  seasonal_availability: string;
  best_season: string;
  peak_season: string;
  off_season: string;

  // Activity & Category
  activity_types: number[]; // Array of activity IDs (changed from string[])
  difficulty_level: string;
  trip_category: number[]; // Array of category IDs
  tags: string[];
  featured_priority: "none" | "featured" | "new" | "limited";

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
  sale_price: string;
  deposit_amount: string;
  deposit_percentage: string;
  payment_terms: string;

  // Booking
  max_travelers: string;
  min_travelers: string;
  booking_deadline: string;
  cancellation_policy: string;
  age_min: string;
  age_max: string;
  physical_requirements: string;
  visa_requirements: string;
  vaccination_requirements: string;

  // Included/Excluded
  included_items: TripAmenityItem[];
  excluded_items: TripAmenityItem[];

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
  featured_image: string;

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
  scheduled_publish_date: string;
  scheduled_unpublish_date: string;
  version: number;
  seasonal_auto_enable: boolean;
  seasonal_enable_date: string;
  seasonal_disable_date: string;

  // SEO
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

export interface TripFormSectionProps {
  formData: TripFormData;
  errors: Record<string, string>;
  handleFieldChange: (field: keyof TripFormData, value: any) => void;
  activeCategories?: TravelerCategory[];
  [key: string]: any; // Allow additional props for specific sections
}
