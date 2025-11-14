/**
 * Trip Form Page - Wizard Style
 * Multi-step form for creating/editing trips with sidebar navigation
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Save, 
  Loader2, 
  Eye, 
  Sparkles,
  Box,
  Calendar,
  CheckSquare,
  Mail,
  BarChart3,
  Image,
  HelpCircle,
  Search,
  Settings,
  CheckCircle2,
  FileText,
  DollarSign,
  AlertCircle,
  Plus,
  X,
  Upload,
  MapPin,
  Tag,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  Lightbulb,
  Copy,
  BookOpen
} from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Alert } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { HelpText } from '../components/ui/help-text';
import { ItinerarySection } from '../components/trip-form/sections/ItinerarySection';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { useToast } from '../components/ui/toast';

type SectionId = 
  | 'basic'             // 1. Basic Information (title, description, highlights, featured image)
  | 'location'          // 2. Location & Geography
  | 'duration'          // 3. Duration & Schedule
  | 'pricing'           // 4. Pricing & Payment
  | 'itinerary'         // 5. Itinerary Builder (includes accommodation & transportation per day)
  | 'included'          // 6. What's Included/Excluded
  | 'booking'           // 7. Booking Requirements
  | 'media'             // 8. Media & Content (gallery, video, story, testimonials)
  | 'categorization'    // 9. Categorization & Tags (category, activities, difficulty, tags)
  | 'faqs'              // 10. FAQs
  | 'seo'               // 11. SEO Settings
  | 'advanced';         // 12. Advanced Settings (status, scheduling, frontend tabs)

interface Section {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
  completed: boolean;
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
  status: 'active' | 'inactive';
}

interface PriceType {
  category_id: number;
  original_price: string;
  discounted_price: string;
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
  testimonials: string[]; // Testimonials Integration
  
  // Location & Geography
  destination: string;
  starting_location: string;
  ending_location: string;
  countries: string[];
  regions: string[];
  latitude: string;
  longitude: string;
  landmarks: string[]; // Geographic Tags - Landmarks
  
  // Duration & Schedule
  trip_type: 'single_day' | 'multi_day';
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
  activity_types: string[];
  difficulty_level: string;
  trip_category: string;
  trip_category_parent: string; // Parent category for hierarchy
  trip_category_sub: string; // Sub-category
  tags: string[];
  featured_priority: 'none' | 'featured' | 'popular' | 'new' | 'limited'; // Featured Priority
  
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
  pricing_type: 'regular' | 'traveler_based';
  original_price: string;
  discounted_price: string;
  price_types: PriceType[];
  sale_price: string;
  currency: string;
  deposit_amount: string;
  deposit_percentage: string;
  payment_terms: string;
  group_pricing_enabled: boolean;
  group_size_min: string;
  group_discount_percentage: string;
  
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
  included_items: string[];
  excluded_items: string[];
  
  // Itinerary
  itinerary_days: ItineraryDay[];
  
  // Gallery
  gallery_images: string[];
  featured_image: string;
  
  // FAQs
  faqs: FAQ[];
  
  // Frontend Tabs
  frontend_tabs: FrontendTab[];
  
  // Availability
  availability_dates: AvailabilityDate[];
  
  // Status & Lifecycle
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
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
  content_type: 'general' | 'pricing' | 'itinerary' | 'included_excluded' | 'gallery' | 'faqs' | 'reviews' | 'custom';
  custom_content?: string;
}

interface AvailabilityDate {
  id: string;
  departure_date: string;
  arrival_date: string;
  seats_remaining: string;
  original_price: string;
  discounted_price: string;
  discount_percentage: string;
  status: 'available' | 'sold_out' | 'limited' | 'closed';
  from_location?: string;
  to_location?: string;
}

interface ItineraryEntry {
  id: string;
  day: number;
  day_title?: string;
  // Use IDs to match ItineraryForm structure
  item_type_id: string; // ID of the item type (Activity, Meal, Accommodation, Transportation, Rest)
  item_id: string; // ID of the specific item (Hiking, Breakfast, Hotel, etc.)
  // Keep legacy fields for backward compatibility
  item_type?: 'Meal' | 'Activity' | 'Accommodation' | 'Transportation';
  item_name?: string;
  item_icon?: string;
  // Entry details
  title: string;
  description: string;
  location?: string;
  duration?: string;
  start_time: string;
  end_time: string;
  time_type: 'exact' | 'approximate' | 'all_day' | 'flexible';
  cost?: string;
  cost_per_person: boolean;
  notes?: string;
  included_items: string[];
  excluded_items: string[];
  images: string[];
  status?: 'active' | 'inactive';
}

interface ItineraryDay {
  day: number;
  day_title?: string;
  entries: ItineraryEntry[];
}

const TripForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  
  const [currentSection, setCurrentSection] = useState<SectionId>('basic');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  
  // Modal states for adding items
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [showIncludedModal, setShowIncludedModal] = useState(false);
  const [showExcludedModal, setShowExcludedModal] = useState(false);
  const [modalInput, setModalInput] = useState({ text: '', question: '', answer: '' });
  
  // Revision states
  const [showRevisionsDialog, setShowRevisionsDialog] = useState(false);
  const [selectedRevisionId, setSelectedRevisionId] = useState<number | null>(null);
  const [showRevisionConfirm, setShowRevisionConfirm] = useState(false);
  
  // UI Enhancement states
  const [simpleMode, setSimpleMode] = useState(false); // Quick Start mode
  const [showSlugPreview, setShowSlugPreview] = useState(true);
  
  // Static/dummy revisions data for UI only
  const dummyRevisions = [
    { id: 1, version: 3, created_by_name: 'Admin User', created_at: new Date().toISOString() },
    { id: 2, version: 2, created_by_name: 'Admin User', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, version: 1, created_by_name: 'Admin User', created_at: new Date(Date.now() - 172800000).toISOString() },
  ];
  
  const [formData, setFormData] = useState<TripFormData>({
    title: '',
    slug: '',
    description: '',
    highlights: [],
    trip_details: '',
    short_description: '',
    what_makes_special: '',
    trip_story: '',
    video_url: '',
    virtual_tour_url: '',
    testimonials: [],
    destination: '',
    starting_location: '',
    ending_location: '',
    countries: [],
    regions: [],
    latitude: '',
    longitude: '',
    landmarks: [],
    trip_type: 'multi_day',
    duration_days: '',
    duration_nights: '',
    available_from: '',
    available_to: '',
    booking_window_days: '',
    seasonal_availability: '',
    best_season: '',
    peak_season: '',
    off_season: '',
    activity_types: [],
    difficulty_level: '',
    trip_category: '',
    trip_category_parent: '',
    trip_category_sub: '',
    tags: [],
    featured_priority: 'none',
    accommodation_type: '',
    meal_plan: '',
    accommodation_details: '',
    transportation_included: false,
    pickup_location: '',
    dropoff_location: '',
    transportation_details: '',
    pricing_type: 'regular',
    original_price: '',
    discounted_price: '',
    price_types: [],
    sale_price: '',
    currency: 'USD',
    deposit_amount: '',
    deposit_percentage: '',
    payment_terms: '',
    group_pricing_enabled: false,
    group_size_min: '',
    group_discount_percentage: '',
    max_travelers: '',
    min_travelers: '1',
    booking_deadline: '',
    cancellation_policy: '',
    age_min: '',
    age_max: '',
    physical_requirements: '',
    visa_requirements: '',
    vaccination_requirements: '',
    included_items: [],
    excluded_items: [],
    itinerary_days: [],
    gallery_images: [],
    featured_image: '',
    faqs: [],
    frontend_tabs: [
      { id: 'general', label: 'General', enabled: true, order: 1, content_type: 'general' },
      { id: 'pricing', label: 'Pricing', enabled: true, order: 2, content_type: 'pricing' },
      { id: 'itinerary', label: 'Itinerary', enabled: true, order: 3, content_type: 'itinerary' },
      { id: 'included_excluded', label: 'Included/Excluded', enabled: true, order: 4, content_type: 'included_excluded' },
      { id: 'gallery', label: 'Gallery', enabled: true, order: 5, content_type: 'gallery' },
      { id: 'faqs', label: 'FAQs', enabled: true, order: 6, content_type: 'faqs' },
    ],
    availability_dates: [],
    status: 'draft',
    scheduled_publish_date: '',
    scheduled_unpublish_date: '',
    version: 1,
    seasonal_auto_enable: false,
    seasonal_enable_date: '',
    seasonal_disable_date: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const tripId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && tripId !== null;

  // Fetch traveler categories
  const { data: travelerCategories = [], isLoading: isLoadingCategories } = useQuery<TravelerCategory[]>({
    queryKey: ['traveler-categories'],
    queryFn: async () => {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        { id: 1, label: 'Adult', description: 'Standard adult pricing', age_min: 18, age_max: undefined, status: 'active' as const },
        { id: 2, label: 'Child', description: 'Pricing for children', age_min: 5, age_max: 17, status: 'active' as const },
        { id: 3, label: 'Infant', description: 'Pricing for infants', age_min: 0, age_max: 4, status: 'active' as const },
        { id: 4, label: 'Senior', description: 'Senior citizen pricing', age_min: 60, age_max: undefined, status: 'active' as const },
        { id: 5, label: 'Student', description: 'Student pricing', age_min: undefined, age_max: undefined, status: 'active' as const },
      ];
    },
  });

  // Get only active categories
  const activeCategories = useMemo(() => {
    return travelerCategories.filter(cat => cat.status === 'active');
  }, [travelerCategories]);

  // Fetch trip data if editing
  const { data: tripData, isLoading: isLoadingTrip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      if (!tripId) return null;
      // return await apiClient.get(`/trips/${tripId}`);
      // Dummy data
      return {
        id: tripId,
        title: 'Bali Beach Retreat - 7 Days',
        slug: 'bali-beach-retreat-7-days',
        description: 'Escape to paradise with our 7-day Bali beach retreat. Relax on pristine beaches, explore ancient temples, enjoy spa treatments, and experience the island\'s rich culture.',
        short_description: 'Escape to paradise with our 7-day Bali beach retreat.',
        highlights: ['Pristine beaches', 'Ancient temples', 'Spa treatments', 'Rich culture'],
        trip_details: 'Detailed trip information...',
        what_makes_special: 'This trip offers a perfect blend of relaxation and cultural immersion, with private beach access and exclusive temple visits.',
        trip_story: 'Imagine waking up to the sound of waves, spending your days exploring ancient temples, and ending each evening with a traditional Balinese spa treatment. This is more than a vacation—it\'s a journey into the heart of Bali\'s rich culture and stunning natural beauty.',
        video_url: '',
        virtual_tour_url: '',
        testimonials: ['Amazing experience!', 'Best trip ever!'],
        destination: 'Bali, Indonesia',
        starting_location: 'Denpasar Airport',
        ending_location: 'Ubud Hotel',
        countries: ['Indonesia'],
        regions: ['Bali'],
        latitude: '-8.3405',
        longitude: '115.0920',
        landmarks: ['Tanah Lot Temple', 'Ubud Monkey Forest', 'Tegallalang Rice Terrace'],
        trip_type: 'multi_day',
        duration_days: '7',
        duration_nights: '6',
        available_from: '',
        available_to: '',
        booking_window_days: '30',
        seasonal_availability: '',
        best_season: 'April to October',
        peak_season: 'July to August',
        off_season: 'November to March',
        activity_types: [],
        difficulty_level: 'beginner',
        trip_category: 'beach',
        trip_category_parent: 'beach',
        trip_category_sub: 'relaxation',
        tags: ['family-friendly', 'beach', 'relaxation'],
        featured_priority: 'featured',
        accommodation_type: '',
        meal_plan: '',
        accommodation_details: '',
        transportation_included: true,
        pickup_location: '',
        dropoff_location: '',
        transportation_details: '',
        pricing_type: 'traveler_based',
        original_price: '',
        discounted_price: '',
        price_types: [
          { category_id: 1, original_price: '1250', discounted_price: '' },
          { category_id: 2, original_price: '625', discounted_price: '' },
          { category_id: 3, original_price: '0', discounted_price: '' },
        ],
        sale_price: '',
        currency: 'USD',
        deposit_amount: '',
        deposit_percentage: '',
        payment_terms: '',
        group_pricing_enabled: false,
        group_size_min: '',
        group_discount_percentage: '',
        max_travelers: '12',
        min_travelers: '2',
        booking_deadline: '',
        cancellation_policy: 'Full refund 30 days before departure',
        age_min: '',
        age_max: '',
        physical_requirements: '',
        visa_requirements: '',
        vaccination_requirements: '',
        included_items: ['Accommodation', 'Breakfast', 'Airport transfers'],
        excluded_items: ['Flights', 'Travel insurance'],
        gallery_images: [],
        featured_image: '',
        faqs: [],
        status: 'draft',
        scheduled_publish_date: '',
        scheduled_unpublish_date: '',
        version: 1,
        seasonal_auto_enable: false,
        seasonal_enable_date: '',
        seasonal_disable_date: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
      };
    },
    enabled: isEditMode && can('yatra_view_trips'),
  });

  // Load trip data into form when editing
  useEffect(() => {
    if (tripData && isEditMode) {
      setFormData({
        title: tripData.title || '',
        slug: tripData.slug || '',
        description: tripData.description || '',
        highlights: tripData.highlights || [],
        trip_details: tripData.trip_details || '',
        short_description: tripData.short_description || '',
        what_makes_special: (tripData as any).what_makes_special || '',
        trip_story: (tripData as any).trip_story || '',
        video_url: (tripData as any).video_url || '',
        virtual_tour_url: (tripData as any).virtual_tour_url || '',
        testimonials: (tripData as any).testimonials || [],
        destination: tripData.destination || '',
        starting_location: tripData.starting_location || '',
        ending_location: tripData.ending_location || '',
        countries: tripData.countries || [],
        regions: tripData.regions || [],
        latitude: tripData.latitude || '',
        longitude: tripData.longitude || '',
        landmarks: (tripData as any).landmarks || [],
        trip_type: (tripData.trip_type || (tripData.duration_days && parseInt(tripData.duration_days?.toString() || '0') === 1 ? 'single_day' : 'multi_day')) as 'single_day' | 'multi_day',
        duration_days: tripData.duration_days?.toString() || '',
        duration_nights: tripData.duration_nights?.toString() || '',
        available_from: tripData.available_from || '',
        available_to: tripData.available_to || '',
        booking_window_days: tripData.booking_window_days?.toString() || '',
        seasonal_availability: tripData.seasonal_availability || '',
        best_season: (tripData as any).best_season || '',
        peak_season: (tripData as any).peak_season || '',
        off_season: (tripData as any).off_season || '',
        activity_types: tripData.activity_types || [],
        difficulty_level: tripData.difficulty_level || '',
        trip_category: tripData.trip_category || '',
        trip_category_parent: (tripData as any).trip_category_parent || '',
        trip_category_sub: (tripData as any).trip_category_sub || '',
        tags: tripData.tags || [],
        featured_priority: (tripData as any).featured_priority || 'none',
        accommodation_type: tripData.accommodation_type || '',
        meal_plan: tripData.meal_plan || '',
        accommodation_details: tripData.accommodation_details || '',
        transportation_included: tripData.transportation_included || false,
        pickup_location: tripData.pickup_location || '',
        dropoff_location: tripData.dropoff_location || '',
        transportation_details: tripData.transportation_details || '',
        pricing_type: (tripData.pricing_type || (tripData.price_types && tripData.price_types.length > 0 ? 'traveler_based' : 'regular')) as 'regular' | 'traveler_based',
        original_price: tripData.original_price?.toString() || '',
        discounted_price: tripData.discounted_price?.toString() || '',
        price_types: tripData.price_types || [],
        sale_price: tripData.sale_price?.toString() || '',
        currency: tripData.currency || 'USD',
        deposit_amount: tripData.deposit_amount?.toString() || '',
        deposit_percentage: tripData.deposit_percentage?.toString() || '',
        payment_terms: tripData.payment_terms || '',
        group_pricing_enabled: tripData.group_pricing_enabled || false,
        group_size_min: tripData.group_size_min?.toString() || '',
        group_discount_percentage: tripData.group_discount_percentage?.toString() || '',
        max_travelers: tripData.max_travelers?.toString() || '',
        min_travelers: tripData.min_travelers?.toString() || '1',
        booking_deadline: tripData.booking_deadline || '',
        cancellation_policy: tripData.cancellation_policy || '',
        age_min: tripData.age_min?.toString() || '',
        age_max: tripData.age_max?.toString() || '',
        physical_requirements: tripData.physical_requirements || '',
        visa_requirements: tripData.visa_requirements || '',
        vaccination_requirements: tripData.vaccination_requirements || '',
        included_items: tripData.included_items || [],
        excluded_items: tripData.excluded_items || [],
        itinerary_days: (tripData as any).itinerary_days || [],
        gallery_images: tripData.gallery_images || [],
        featured_image: tripData.featured_image || '',
        faqs: tripData.faqs || [],
        frontend_tabs: (tripData as any).frontend_tabs || [
          { id: 'general', label: 'General', enabled: true, order: 1, content_type: 'general' },
          { id: 'pricing', label: 'Pricing', enabled: true, order: 2, content_type: 'pricing' },
          { id: 'itinerary', label: 'Itinerary', enabled: true, order: 3, content_type: 'itinerary' },
          { id: 'included_excluded', label: 'Included/Excluded', enabled: true, order: 4, content_type: 'included_excluded' },
          { id: 'gallery', label: 'Gallery', enabled: true, order: 5, content_type: 'gallery' },
          { id: 'faqs', label: 'FAQs', enabled: true, order: 6, content_type: 'faqs' },
        ],
        availability_dates: (tripData as any).availability_dates || [],
        status: ((tripData as any).status || 'draft') as 'draft' | 'review' | 'approved' | 'published' | 'archived',
        scheduled_publish_date: (tripData as any).scheduled_publish_date || '',
        scheduled_unpublish_date: (tripData as any).scheduled_unpublish_date || '',
        version: (tripData as any).version || 1,
        seasonal_auto_enable: (tripData as any).seasonal_auto_enable || false,
        seasonal_enable_date: (tripData as any).seasonal_enable_date || '',
        seasonal_disable_date: (tripData as any).seasonal_disable_date || '',
        meta_title: tripData.meta_title || '',
        meta_description: tripData.meta_description || '',
        meta_keywords: tripData.meta_keywords || '',
      });
      setLastSaved(new Date());
    }
  }, [tripData, isEditMode]);

  // Define sections - Organized in logical workflow order (First Things First)
  const essentialsSections: Section[] = [
    // Step 1: Basic Information (Simplified - no tabs)
    { id: 'basic', label: __('Basic Information', 'Basic Information'), icon: FileText, required: true, completed: !!(formData.title && formData.description && formData.featured_image) },
    
    // Step 2: Location & Geography
    { id: 'location', label: __('Location & Geography', 'Location & Geography'), icon: MapPin, required: true, completed: !!(formData.destination) },
    
    // Step 3: Duration & Schedule
    { id: 'duration', label: __('Duration & Schedule', 'Duration & Schedule'), icon: Calendar, required: true, completed: !!(formData.duration_days && formData.trip_type) },
    
    // Step 4: Pricing & Payment
    { id: 'pricing', label: __('Pricing & Payment', 'Pricing & Payment'), icon: DollarSign, required: true, completed: formData.pricing_type === 'regular' ? !!(formData.original_price && parseFloat(formData.original_price) > 0) : formData.price_types.some(pt => pt.original_price && parseFloat(pt.original_price) > 0) },
    
    // Step 5: Itinerary Builder (includes accommodation & transportation per day)
    { id: 'itinerary', label: __('Itinerary Builder', 'Itinerary Builder'), icon: Calendar, required: true, completed: formData.itinerary_days.length > 0 },
    
    // Step 6: What's Included/Excluded
    { id: 'included', label: __('What\'s Included', 'What\'s Included'), icon: CheckSquare, required: true, completed: formData.included_items.length > 0 },
    
    // Step 7: Booking Requirements
    { id: 'booking', label: __('Booking Requirements', 'Booking Requirements'), icon: Mail, required: true, completed: !!(formData.min_travelers && formData.max_travelers) },
  ];

  const marketingSections: Section[] = [
    { id: 'media', label: __('Media & Content', 'Media & Content'), icon: Image, required: false, completed: formData.gallery_images.length > 0 || !!formData.video_url },
    { id: 'categorization', label: __('Categorization & Tags', 'Categorization & Tags'), icon: Tag, required: false, completed: !!(formData.trip_category || formData.activity_types.length > 0 || formData.tags.length > 0) },
    { id: 'faqs', label: __('FAQs', 'FAQs'), icon: HelpCircle, required: false, completed: formData.faqs.length > 0 },
    { id: 'seo', label: __('SEO Settings', 'SEO Settings'), icon: Search, required: false, completed: !!(formData.meta_title && formData.meta_description) },
  ];

  // Calculate completion percentage
  const completedSections = [...essentialsSections, ...marketingSections].filter(s => s.completed).length;
  const totalRequiredSections = essentialsSections.filter(s => s.required).length;
  const completionPercentage = totalRequiredSections > 0 
    ? Math.round((completedSections / totalRequiredSections) * 100) 
    : 0;

  // Get current step number and total steps for navigation
  const allSections = [...essentialsSections, ...marketingSections, { id: 'advanced' as SectionId, label: __('Advanced', 'Advanced'), icon: Settings, required: false, completed: false }];
  const currentStepIndex = allSections.findIndex(s => s.id === currentSection);
  const currentStepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const totalSteps = allSections.length;

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


  // Smart defaults - Auto-calculate nights from days
  useEffect(() => {
    if (formData.duration_days && formData.trip_type === 'multi_day' && !formData.duration_nights) {
      const days = parseInt(formData.duration_days);
      if (days > 0 && !isNaN(days)) {
        setFormData(prev => ({ ...prev, duration_nights: String(Math.max(0, days - 1)) }));
      }
    }
  }, [formData.duration_days, formData.trip_type]);

  // Auto-calculate days from nights
  useEffect(() => {
    if (formData.duration_nights && formData.trip_type === 'multi_day' && !formData.duration_days) {
      const nights = parseInt(formData.duration_nights);
      if (nights > 0 && !isNaN(nights)) {
        setFormData(prev => ({ ...prev, duration_days: String(nights + 1) }));
      }
    }
  }, [formData.duration_nights, formData.trip_type]);

  // Auto-generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value),
    }));
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
    autoSave();
  };

  const handleFieldChange = (field: keyof TripFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    autoSave();
  };

  const handleHighlightAdd = () => {
    setShowHighlightModal(true);
    setModalInput({ text: '', question: '', answer: '' });
  };

  const handleHighlightSave = () => {
    if (modalInput.text && modalInput.text.trim()) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, modalInput.text.trim()],
      }));
      setShowHighlightModal(false);
      setModalInput({ text: '', question: '', answer: '' });
      autoSave();
    }
  };

  const handleHighlightRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
    autoSave();
  };

  const handleIncludedAdd = () => {
    setShowIncludedModal(true);
    setModalInput({ text: '', question: '', answer: '' });
  };

  const handleIncludedSave = () => {
    if (modalInput.text && modalInput.text.trim()) {
      setFormData(prev => ({
        ...prev,
        included_items: [...prev.included_items, modalInput.text.trim()],
      }));
      setShowIncludedModal(false);
      setModalInput({ text: '', question: '', answer: '' });
      autoSave();
    }
  };

  const handleIncludedRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      included_items: prev.included_items.filter((_, i) => i !== index),
    }));
    autoSave();
  };

  const handleExcludedAdd = () => {
    setShowExcludedModal(true);
    setModalInput({ text: '', question: '', answer: '' });
  };

  const handleExcludedSave = () => {
    if (modalInput.text && modalInput.text.trim()) {
      setFormData(prev => ({
        ...prev,
        excluded_items: [...prev.excluded_items, modalInput.text.trim()],
      }));
      setShowExcludedModal(false);
      setModalInput({ text: '', question: '', answer: '' });
      autoSave();
    }
  };

  const handleExcludedRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      excluded_items: prev.excluded_items.filter((_, i) => i !== index),
    }));
    autoSave();
  };

  const handleFAQAdd = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }],
    }));
    autoSave();
  };

  const handleFAQRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
    autoSave();
  };

  const handleFAQChange = (index: number, field: 'question' | 'answer', value: string) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => i === index ? { ...faq, [field]: value } : faq),
    }));
    autoSave();
  };

  const handleGalleryAdd = () => {
    // In a real implementation, this would open a media library
    const imageUrl = prompt(__('Enter image URL or upload image', 'Enter image URL or upload image'));
    if (imageUrl && imageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        gallery_images: [...prev.gallery_images, imageUrl.trim()],
      }));
      autoSave();
    }
  };

  const handleGalleryRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
    autoSave();
  };

  const handlePriceTypeAdd = (categoryId: number) => {
    // Check if category already exists
    if (formData.price_types.some(pt => pt.category_id === categoryId)) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      price_types: [...prev.price_types, { category_id: categoryId, original_price: '', discounted_price: '' }],
    }));
    autoSave();
  };

  const handlePriceTypeRemove = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      price_types: prev.price_types.filter(pt => pt.category_id !== categoryId),
    }));
    autoSave();
  };

  const handlePriceTypeChange = (categoryId: number, field: 'original_price' | 'discounted_price', value: string) => {
    setFormData(prev => ({
      ...prev,
      price_types: prev.price_types.map(pt => 
        pt.category_id === categoryId ? { ...pt, [field]: value } : pt
      ),
    }));
    autoSave();
  };

  // Frontend Tabs Handlers
  const handleTabToggle = (tabId: string) => {
    setFormData(prev => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map(tab =>
        tab.id === tabId ? { ...tab, enabled: !tab.enabled } : tab
      ),
    }));
    autoSave();
  };

  const handleTabLabelChange = (tabId: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map(tab =>
        tab.id === tabId ? { ...tab, label } : tab
      ),
    }));
    autoSave();
  };

  const handleTabMove = (tabId: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const tabs = [...prev.frontend_tabs];
      const index = tabs.findIndex(t => t.id === tabId);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= tabs.length) return prev;

      [tabs[index], tabs[newIndex]] = [tabs[newIndex], tabs[index]];
      // Update order
      tabs.forEach((tab, i) => {
        tab.order = i + 1;
      });

      return { ...prev, frontend_tabs: tabs };
    });
    autoSave();
  };

  const handleTabRemove = (tabId: string) => {
    setFormData(prev => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs
        .filter(tab => tab.id !== tabId)
        .map((tab, i) => ({ ...tab, order: i + 1 })),
    }));
    autoSave();
  };

  const handleTabAdd = () => {
    const newTabId = `custom_${Date.now()}`;
    const maxOrder = Math.max(...formData.frontend_tabs.map(t => t.order), 0);
    setFormData(prev => ({
      ...prev,
      frontend_tabs: [
        ...prev.frontend_tabs,
        {
          id: newTabId,
          label: __('New Tab', 'New Tab'),
          enabled: true,
          order: maxOrder + 1,
          content_type: 'custom',
          custom_content: '',
        },
      ],
    }));
    autoSave();
  };

  const handleTabContentTypeChange = (tabId: string, contentType: FrontendTab['content_type']) => {
    setFormData(prev => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map(tab =>
        tab.id === tabId ? { ...tab, content_type: contentType } : tab
      ),
    }));
    autoSave();
  };

  const handleTabCustomContentChange = (tabId: string, content: string) => {
    setFormData(prev => ({
      ...prev,
      frontend_tabs: prev.frontend_tabs.map(tab =>
        tab.id === tabId ? { ...tab, custom_content: content } : tab
      ),
    }));
    autoSave();
  };

  // Itinerary handlers
  const handleItineraryDayAdd = () => {
    const maxDay = formData.itinerary_days.length > 0 
      ? Math.max(...formData.itinerary_days.map(d => d.day))
      : 0;
    const newDay: ItineraryDay = {
      day: maxDay + 1,
      day_title: '',
      entries: [],
    };
    setFormData(prev => ({
      ...prev,
      itinerary_days: [...prev.itinerary_days, newDay],
    }));
    autoSave();
  };

  const handleItineraryDayRemove = (day: number) => {
    setFormData(prev => ({
      ...prev,
      itinerary_days: prev.itinerary_days
        .filter(d => d.day !== day)
        .map((d, idx) => ({ ...d, day: idx + 1 })),
    }));
    autoSave();
  };

  const handleItineraryDayTitleChange = (day: number, title: string) => {
    setFormData(prev => ({
      ...prev,
      itinerary_days: prev.itinerary_days.map(d =>
        d.day === day ? { ...d, day_title: title } : d
      ),
    }));
    autoSave();
  };

  const handleItineraryEntryAdd = (day: number) => {
    const newEntry: ItineraryEntry = {
      id: `entry_${Date.now()}`,
      day,
      item_type_id: '1', // Default to Activity (matching ItineraryForm structure)
      item_id: '', // Will be selected by user
      item_type: 'Activity', // Legacy field for backward compatibility
      item_name: 'Activity',
      item_icon: 'footprints',
      title: '',
      description: '',
      start_time: '08:00',
      end_time: '17:00',
      time_type: 'exact',
      cost: '',
      cost_per_person: true,
      notes: '',
      included_items: [],
      excluded_items: [],
      images: [],
      status: 'active',
    };
    setFormData(prev => ({
      ...prev,
      itinerary_days: prev.itinerary_days.map(d =>
        d.day === day ? { ...d, entries: [...d.entries, newEntry] } : d
      ),
    }));
    autoSave();
  };

  const handleItineraryEntryRemove = (day: number, entryId: string) => {
    setFormData(prev => ({
      ...prev,
      itinerary_days: prev.itinerary_days.map(d =>
        d.day === day ? { ...d, entries: d.entries.filter(e => e.id !== entryId) } : d
      ),
    }));
    autoSave();
  };

  const handleItineraryEntryChange = (day: number, entryId: string, field: keyof ItineraryEntry, value: any) => {
    setFormData(prev => ({
      ...prev,
      itinerary_days: prev.itinerary_days.map(d =>
        d.day === day ? {
          ...d,
          entries: d.entries.map(e =>
            e.id === entryId ? { ...e, [field]: value } : e
          ),
        } : d
      ),
    }));
    autoSave();
  };

  const handleItineraryEntryMove = (day: number, entryId: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const dayData = prev.itinerary_days.find(d => d.day === day);
      if (!dayData) return prev;
      
      const entries = [...dayData.entries];
      const index = entries.findIndex(e => e.id === entryId);
      if (index === -1) return prev;
      
      if (direction === 'up' && index > 0) {
        [entries[index - 1], entries[index]] = [entries[index], entries[index - 1]];
      } else if (direction === 'down' && index < entries.length - 1) {
        [entries[index], entries[index + 1]] = [entries[index + 1], entries[index]];
      }
      
      return {
        ...prev,
        itinerary_days: prev.itinerary_days.map(d =>
          d.day === day ? { ...d, entries } : d
        ),
      };
    });
    autoSave();
  };

  const handleItineraryEntryDuplicate = (day: number, entryId: string) => {
    setFormData(prev => {
      const dayData = prev.itinerary_days.find(d => d.day === day);
      if (!dayData) return prev;
      
      const entry = dayData.entries.find(e => e.id === entryId);
      if (!entry) return prev;
      
      const newEntry: ItineraryEntry = {
        ...entry,
        id: `entry_${Date.now()}`,
      };
      
      return {
        ...prev,
        itinerary_days: prev.itinerary_days.map(d =>
          d.day === day ? { ...d, entries: [...d.entries, newEntry] } : d
        ),
      };
    });
    autoSave();
  };

  // Auto-save functionality
  const autoSave = () => {
    if (isEditMode) {
      setIsAutoSaving(true);
      // Simulate auto-save
      setTimeout(() => {
        setLastSaved(new Date());
        setIsAutoSaving(false);
      }, 1000);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = __('Title is required', 'Title is required');
    }

    if (!formData.slug.trim()) {
      newErrors.slug = __('Slug is required', 'Slug is required');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = __('Slug can only contain lowercase letters, numbers, and hyphens', 'Slug can only contain lowercase letters, numbers, and hyphens');
    }

    if (!formData.description.trim()) {
      newErrors.description = __('Description is required', 'Description is required');
    }

    if (!formData.duration_days || parseInt(formData.duration_days) < 1) {
      newErrors.duration_days = __('Duration must be at least 1 day', 'Duration must be at least 1 day');
    }

    if (formData.duration_nights) {
      const nights = parseInt(formData.duration_nights);
      if (isNaN(nights) || nights < 0) {
        newErrors.duration_nights = __('Nights cannot be negative. Use 0 for day trips.', 'Nights cannot be negative. Use 0 for day trips.');
      } else if (formData.duration_days) {
        const days = parseInt(formData.duration_days);
        if (days === 1 && nights > 0) {
          newErrors.duration_nights = __('Single day trips should have 0 nights', 'Single day trips should have 0 nights');
        } else if (days > 1 && nights >= days) {
          newErrors.duration_nights = __('Nights should be less than days (typically days - 1)', 'Nights should be less than days (typically days - 1)');
        }
      }
    }

    // Validate pricing based on pricing type
    if (formData.pricing_type === 'regular') {
      if (!formData.original_price || parseFloat(formData.original_price) <= 0) {
        newErrors.original_price = __('Original price is required and must be greater than 0', 'Original price is required and must be greater than 0');
      }
      if (formData.discounted_price && parseFloat(formData.discounted_price) >= parseFloat(formData.original_price)) {
        newErrors.discounted_price = __('Discounted price must be less than original price', 'Discounted price must be less than original price');
      }
    } else {
      // Validate price types
      if (formData.price_types.length === 0) {
        newErrors.price_types = __('At least one traveler category pricing is required', 'At least one traveler category pricing is required');
      } else {
        formData.price_types.forEach((priceType, index) => {
          if (!priceType.original_price || isNaN(parseFloat(priceType.original_price)) || parseFloat(priceType.original_price) < 0) {
            newErrors[`price_type_${index}_original`] = __('Original price must be a valid number', 'Original price must be a valid number');
          }
          if (priceType.discounted_price && (isNaN(parseFloat(priceType.discounted_price)) || parseFloat(priceType.discounted_price) < 0)) {
            newErrors[`price_type_${index}_discounted`] = __('Discounted price must be a valid number', 'Discounted price must be a valid number');
          }
          if (priceType.discounted_price && priceType.original_price && parseFloat(priceType.discounted_price) >= parseFloat(priceType.original_price)) {
            newErrors[`price_type_${index}_discounted`] = __('Discounted price must be less than original price', 'Discounted price must be less than original price');
          }
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TripFormData & { status?: 'draft' | 'published' }) => {
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
        testimonials: data.testimonials || [],
        destination: data.destination.trim(),
        starting_location: data.starting_location.trim(),
        ending_location: data.ending_location.trim(),
        countries: data.countries || [],
        regions: data.regions || [],
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        landmarks: data.landmarks || [],
        trip_type: data.trip_type,
        duration_days: data.duration_days ? parseInt(data.duration_days) : null,
        duration_nights: data.duration_nights ? parseInt(data.duration_nights) : null,
        available_from: data.available_from || null,
        available_to: data.available_to || null,
        booking_window_days: data.booking_window_days ? parseInt(data.booking_window_days) : null,
        seasonal_availability: data.seasonal_availability || '',
        best_season: data.best_season.trim(),
        peak_season: data.peak_season.trim(),
        off_season: data.off_season.trim(),
        activity_types: data.activity_types || [],
        difficulty_level: data.difficulty_level || '',
        trip_category: data.trip_category || '',
        trip_category_parent: data.trip_category_parent || '',
        trip_category_sub: data.trip_category_sub || '',
        tags: data.tags || [],
        featured_priority: data.featured_priority,
        accommodation_type: data.accommodation_type || '',
        meal_plan: data.meal_plan || '',
        accommodation_details: data.accommodation_details.trim(),
        transportation_included: data.transportation_included || false,
        pickup_location: data.pickup_location.trim(),
        dropoff_location: data.dropoff_location.trim(),
        transportation_details: data.transportation_details.trim(),
        pricing_type: data.pricing_type,
        original_price: data.pricing_type === 'regular' ? (data.original_price ? parseFloat(data.original_price) : null) : null,
        discounted_price: data.pricing_type === 'regular' ? (data.discounted_price ? parseFloat(data.discounted_price) : null) : null,
        price_types: data.pricing_type === 'traveler_based' ? data.price_types.map(pt => ({
          category_id: pt.category_id,
          original_price: pt.original_price ? parseFloat(pt.original_price) : 0,
          discounted_price: pt.discounted_price ? parseFloat(pt.discounted_price) : null,
        })) : [],
        sale_price: data.sale_price ? parseFloat(data.sale_price) : null,
        currency: data.currency,
        deposit_amount: data.deposit_amount ? parseFloat(data.deposit_amount) : null,
        deposit_percentage: data.deposit_percentage ? parseFloat(data.deposit_percentage) : null,
        payment_terms: data.payment_terms.trim(),
        group_pricing_enabled: data.group_pricing_enabled || false,
        group_size_min: data.group_size_min ? parseInt(data.group_size_min) : null,
        group_discount_percentage: data.group_discount_percentage ? parseFloat(data.group_discount_percentage) : null,
        max_travelers: data.max_travelers ? parseInt(data.max_travelers) : null,
        min_travelers: data.min_travelers ? parseInt(data.min_travelers) : 1,
        booking_deadline: data.booking_deadline || null,
        cancellation_policy: data.cancellation_policy || '',
        age_min: data.age_min ? parseInt(data.age_min) : null,
        age_max: data.age_max ? parseInt(data.age_max) : null,
        physical_requirements: data.physical_requirements.trim(),
        visa_requirements: data.visa_requirements.trim(),
        vaccination_requirements: data.vaccination_requirements.trim(),
        included_items: data.included_items || [],
        excluded_items: data.excluded_items || [],
        itinerary_days: data.itinerary_days || [],
        gallery_images: data.gallery_images || [],
        featured_image: data.featured_image || '',
        faqs: data.faqs || [],
        frontend_tabs: data.frontend_tabs.map(tab => ({
          id: tab.id,
          label: tab.label,
          enabled: tab.enabled,
          order: tab.order,
          content_type: tab.content_type,
          custom_content: tab.custom_content || null,
        })),
        availability_dates: data.availability_dates.map(avail => ({
          id: avail.id,
          departure_date: avail.departure_date || null,
          arrival_date: avail.arrival_date || null,
          seats_remaining: avail.seats_remaining || null,
          original_price: avail.original_price ? parseFloat(avail.original_price) : null,
          discounted_price: avail.discounted_price ? parseFloat(avail.discounted_price) : null,
          discount_percentage: avail.discount_percentage ? parseFloat(avail.discount_percentage) : null,
          status: avail.status || 'available',
          from_location: avail.from_location || null,
          to_location: avail.to_location || null,
        })),
        status: data.status || 'draft',
        scheduled_publish_date: data.scheduled_publish_date || null,
        scheduled_unpublish_date: data.scheduled_unpublish_date || null,
        version: data.version || 1,
        seasonal_auto_enable: data.seasonal_auto_enable || false,
        seasonal_enable_date: data.seasonal_enable_date || null,
        seasonal_disable_date: data.seasonal_disable_date || null,
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        meta_keywords: data.meta_keywords || '',
      };

      if (isEditMode && tripId) {
        // return await apiClient.put(`/trips/${tripId}`, payload);
        console.log('Updating trip:', tripId, payload);
        return { success: true, id: tripId };
      } else {
        // return await apiClient.post('/trips', payload);
        console.log('Creating trip:', payload);
        return { success: true, id: Math.floor(Math.random() * 1000) };
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setLastSaved(new Date());
      setIsSubmitting(false);
      
      if (variables.status === 'published') {
        // Redirect to trips list after publishing
        window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=all`;
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving', 'An error occurred while saving');
      setErrors({ submit: errorMessage });
      setIsSubmitting(false);
    },
  });

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    saveMutation.mutate({ ...formData, status: 'draft' });
  };

  const handlePublish = async () => {
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    saveMutation.mutate({ ...formData, status: 'published' });
  };

  // Using static revisions data for UI only
  const revisions = dummyRevisions;
  const isLoadingRevisions = false;

  const handlePreview = () => {
    // Open preview in new window
    const previewUrl = `${window.yatraAdmin?.siteUrl || ''}/trips/${formData.slug || 'preview'}`;
    window.open(previewUrl, '_blank');
  };

  const handleRevisionClick = (revisionId: number) => {
    setSelectedRevisionId(revisionId);
    setShowRevisionConfirm(true);
  };

  const handleRevisionConfirm = () => {
    // UI only - no actual functionality
    if (selectedRevisionId) {
      showToast(__('Revision feature is coming soon', 'Revision feature is coming soon'), 'info');
    }
    setShowRevisionConfirm(false);
    setShowRevisionsDialog(false);
    setSelectedRevisionId(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isEditMode && isLoadingTrip) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{__('Loading trip...', 'Loading trip...')}</span>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (currentSection) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{__('Basic Information', 'Basic Information')}</h2>
              <Badge variant="outline" className="ml-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                {__('Start Here', 'Start Here')}
              </Badge>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-3 rounded-r-md mb-6">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                {__('💡 Getting Started', '💡 Getting Started')}
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {__('Fill in the essential details below. These fields are required to create your trip. Don\'t worry - you can always come back and edit later!', 'Fill in the essential details below. These fields are required to create your trip. Don\'t worry - you can always come back and edit later!')}
              </p>
            </div>

            {/* Essential Fields - Single View (No Tabs) */}
            <div className="space-y-6">

                  {/* Tour Title */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="title" className="block text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        {__('Trip Title', 'Trip Title')}
                        <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                          {__('Required', 'Required')}
                        </Badge>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
                          title={__('A catchy title that describes your trip. Recommended: 50-60 characters for best SEO results.', 'A catchy title that describes your trip. Recommended: 50-60 characters for best SEO results.')}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </label>
                      <span className={`text-xs font-medium ${
                        formData.title.length > 60 
                          ? 'text-red-600 dark:text-red-400' 
                          : formData.title.length >= 50 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formData.title.length}/60
                      </span>
                    </div>
                    <HelpText
                      text={__('💡 Tip: Include your destination and trip length. Example: "Bali Beach Retreat - 7 Days" or "Paris City Tour - Half Day"', '💡 Tip: Include your destination and trip length. Example: "Bali Beach Retreat - 7 Days" or "Paris City Tour - Half Day"')}
                      className="mb-2"
                    />
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder={__('e.g., Bali Beach Retreat - 7 Days', 'e.g., Bali Beach Retreat - 7 Days')}
                      maxLength={100}
                      className={`${errors.title ? 'border-red-500' : formData.title && formData.title.length <= 60 ? 'border-green-500' : ''} transition-colors`}
                      required
                    />
                    {errors.title ? (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.title}
                      </p>
                    ) : formData.title && formData.title.length > 60 && (
                      <p className="mt-1.5 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {__('Title is longer than recommended for SEO (60 characters)', 'Title is longer than recommended for SEO (60 characters)')}
                      </p>
                    )}
                  </div>

                  {/* URL Slug */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="slug" className="block text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        {__('Trip URL', 'Trip URL')}
                        <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700">
                          {__('Auto', 'Auto')}
                        </Badge>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
                          title={__('The web address for your trip page. Auto-generated from your title, but you can customize it.', 'The web address for your trip page. Auto-generated from your title, but you can customize it.')}
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
                          {__('Hide', 'Hide')}
                        </button>
                      )}
                    </div>
                    <HelpText
                      text={__('💡 This is automatically created from your title. You usually don\'t need to change it unless you want a custom web address.', '💡 This is automatically created from your title. You usually don\'t need to change it unless you want a custom web address.')}
                      className="mb-2"
                    />
                    <Input
                      id="slug"
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleFieldChange('slug', e.target.value)}
                      placeholder={__('bali-beach-retreat-7-days', 'bali-beach-retreat-7-days')}
                      className={`font-mono text-sm ${errors.slug ? 'border-red-500' : ''}`}
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
                          <span className="text-gray-500 dark:text-gray-400">{__('Preview URL:', 'Preview URL:')} </span>
                          <span className="font-mono text-blue-600 dark:text-blue-400">
                            {(window as any).yatraAdmin?.siteUrl || 'yoursite.com'}/trips/{formData.slug}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${(window as any).yatraAdmin?.siteUrl || 'yoursite.com'}/trips/${formData.slug}`;
                            navigator.clipboard.writeText(url);
                            showToast(__('URL copied to clipboard', 'URL copied to clipboard'), 'success');
                          }}
                          className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                          title={__('Copy URL', 'Copy URL')}
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
                        {__('Show URL Preview', 'Show URL Preview')}
                      </button>
                    )}
                  </div>

                  {/* Short Description */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="short_description" className="block text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        {__('Short Description', 'Short Description')}
                        <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                          {__('Recommended', 'Recommended')}
                        </Badge>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
                          title={__('A brief summary that appears in listings. Recommended: 100-150 characters for best results.', 'A brief summary that appears in listings. Recommended: 100-150 characters for best results.')}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </label>
                      <span className={`text-xs font-medium ${
                        formData.short_description.length > 200 
                          ? 'text-red-600 dark:text-red-400' 
                          : formData.short_description.length >= 100 && formData.short_description.length <= 150
                          ? 'text-green-600 dark:text-green-400' 
                          : formData.short_description.length > 0
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formData.short_description.length}/200
                      </span>
                    </div>
                    <HelpText
                      text={__('💡 Write 2-3 sentences that grab attention! This appears in trip listings. Example: "Escape to paradise with our 7-day Bali beach retreat. Experience stunning sunsets, world-class diving, and authentic local culture."', '💡 Write 2-3 sentences that grab attention! This appears in trip listings. Example: "Escape to paradise with our 7-day Bali beach retreat. Experience stunning sunsets, world-class diving, and authentic local culture."')}
                      className="mb-2"
                    />
                    <textarea
                      id="short_description"
                      value={formData.short_description}
                      onChange={(e) => handleFieldChange('short_description', e.target.value)}
                      placeholder={__('Escape to paradise with our 7-day Bali beach retreat...', 'Escape to paradise with our 7-day Bali beach retreat...')}
                      rows={2}
                      maxLength={200}
                      className={`flex w-full rounded-md border-2 px-4 py-2.5 text-base font-normal text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:ring-blue-400 dark:text-gray-100 dark:bg-gray-800 resize-none transition-colors ${
                        formData.short_description.length >= 100 && formData.short_description.length <= 150
                          ? 'border-green-500 dark:border-green-600 bg-white dark:bg-gray-800'
                          : formData.short_description.length > 200
                          ? 'border-red-500 dark:border-red-600 bg-white dark:bg-gray-800'
                          : 'border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600'
                      }`}
                    />
                    {formData.short_description.length > 0 && formData.short_description.length < 100 && (
                      <p className="mt-1.5 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {__('Consider adding more details (recommended: 100-150 characters)', 'Consider adding more details (recommended: 100-150 characters)')}
                      </p>
                    )}
                  </div>

                  {/* Tour Description */}
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                      {__('Trip Description', 'Trip Description')}
                      <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                        {__('Required', 'Required')}
                      </Badge>
                    </label>
                    <HelpText
                      text={__('💡 Tell travelers what makes your trip special! Describe the experience, highlights, and what they\'ll see. Write 2-4 paragraphs. Be enthusiastic and detailed!', '💡 Tell travelers what makes your trip special! Describe the experience, highlights, and what they\'ll see. Write 2-4 paragraphs. Be enthusiastic and detailed!')}
                      className="mb-2"
                    />
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder={__('Escape to paradise with our 7-day Bali beach retreat... Or describe your single day trip experience...', 'Escape to paradise with our 7-day Bali beach retreat... Or describe your single day trip experience...')}
                      rows={6}
                      className="flex w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-normal text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:ring-blue-400 resize-none transition-colors"
                    />
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formData.description.length} {__('characters', 'characters')}
                      </span>
                      {formData.description.length >= 150 && formData.description.length <= 500 && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {__('Great length!', 'Great length!')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Featured Image */}
                  <div className="mb-6">
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                      {__('Featured Image', 'Featured Image')}
                      <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                        {__('Required', 'Required')}
                      </Badge>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
                        title={__('The main image that represents your trip. This appears in listings and as the hero image on the trip page.', 'The main image that represents your trip. This appears in listings and as the hero image on the trip page.')}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </label>
                    <HelpText
                      text={__('💡 Choose your best photo! This is the first thing travelers see. Use a high-quality image (1200x800px recommended) that shows what makes your trip special.', '💡 Choose your best photo! This is the first thing travelers see. Use a high-quality image (1200x800px recommended) that shows what makes your trip special.')}
                      className="mb-2"
                    />
                    {formData.featured_image ? (
                      <div className="relative group">
                        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                          <img src={formData.featured_image} alt={__('Featured Image', 'Featured Image')} className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFieldChange('featured_image', '')}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={__('Remove image', 'Remove image')}
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
                              title: __('Select Featured Image', 'Select Featured Image'),
                              button: { text: __('Use this image', 'Use this image') },
                              multiple: false
                            });
                            mediaUploader.on('select', () => {
                              const attachment = mediaUploader.state().get('selection').first().toJSON();
                              handleFieldChange('featured_image', attachment.url);
                            });
                            mediaUploader.open();
                          }
                        }}
                        className="w-full aspect-video border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                      >
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{__('Upload Featured Image', 'Upload Featured Image')}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">{__('Recommended: 1200x800px', 'Recommended: 1200x800px')}</span>
                      </button>
                    )}
                  </div>

                  {/* Trip Highlights */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>{__('Trip Highlights', 'Trip Highlights')}</CardTitle>
                      <CardDescription>
                        {__('Add key highlights that make your trip special. These will be displayed prominently on your trip page.', 'Add key highlights that make your trip special. These will be displayed prominently on your trip page.')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {formData.highlights.length > 0 ? (
                        <div className="space-y-2">
                          {formData.highlights.map((highlight, index) => (
                            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="flex-1 text-sm text-gray-900 dark:text-white">{highlight}</span>
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
                            {__('No highlights added yet', 'No highlights added yet')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                            {__('Add key selling points like "Private guide", "All meals included", or "Skip-the-line tickets"', 'Add key selling points like "Private guide", "All meals included", or "Skip-the-line tickets"')}
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
                        {__('Add Highlight', 'Add Highlight')}
                      </Button>
                    </CardContent>
                  </Card>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{__('Location & Geography', 'Location & Geography')}</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__('Specify where your trip takes place, including destinations, coordinates, and key landmarks', 'Specify where your trip takes place, including destinations, coordinates, and key landmarks')}
            </p>

            <div className="space-y-4">
              {/* Destination */}
              <div>
                <label htmlFor="destination" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Destination', 'Destination')} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="destination"
                  type="text"
                  value={formData.destination}
                  onChange={(e) => handleFieldChange('destination', e.target.value)}
                  placeholder={__('e.g., Bali, Indonesia', 'e.g., Bali, Indonesia')}
                />
              </div>

              {/* Starting & Ending Locations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="starting_location" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Starting Location', 'Starting Location')}
                  </label>
                  <Input
                    id="starting_location"
                    type="text"
                    value={formData.starting_location}
                    onChange={(e) => handleFieldChange('starting_location', e.target.value)}
                    placeholder={__('e.g., Denpasar Airport', 'e.g., Denpasar Airport')}
                  />
                </div>
                <div>
                  <label htmlFor="ending_location" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Ending Location', 'Ending Location')}
                  </label>
                  <Input
                    id="ending_location"
                    type="text"
                    value={formData.ending_location}
                    onChange={(e) => handleFieldChange('ending_location', e.target.value)}
                    placeholder={__('e.g., Ubud Hotel', 'e.g., Ubud Hotel')}
                  />
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Latitude', 'Latitude')}
                  </label>
                  <Input
                    id="latitude"
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => handleFieldChange('latitude', e.target.value)}
                    placeholder={__('e.g., -8.3405', 'e.g., -8.3405')}
                  />
                  <HelpText
                    text={__('GPS latitude coordinate for map integration', 'GPS latitude coordinate for map integration')}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Longitude', 'Longitude')}
                  </label>
                  <Input
                    id="longitude"
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => handleFieldChange('longitude', e.target.value)}
                    placeholder={__('e.g., 115.0920', 'e.g., 115.0920')}
                  />
                  <HelpText
                    text={__('GPS longitude coordinate for map integration', 'GPS longitude coordinate for map integration')}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Landmarks */}
              <div>
                <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Key Landmarks / Points of Interest', 'Key Landmarks / Points of Interest')}
                </label>
                <HelpText
                  text={__('Add notable landmarks or points of interest visited during this trip', 'Add notable landmarks or points of interest visited during this trip')}
                  className="mb-2"
                />
                {formData.landmarks.length > 0 ? (
                  <div className="space-y-2 mb-2">
                    {formData.landmarks.map((landmark, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="flex-1 text-sm text-gray-900 dark:text-white">{landmark}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newLandmarks = [...formData.landmarks];
                            newLandmarks.splice(index, 1);
                            handleFieldChange('landmarks', newLandmarks);
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
                      {__('No landmarks added yet', 'No landmarks added yet')}
                    </p>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const text = prompt(__('Enter landmark name:', 'Enter landmark name:'));
                    if (text && text.trim()) {
                      handleFieldChange('landmarks', [...formData.landmarks, text.trim()]);
                    }
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {__('Add Landmark', 'Add Landmark')}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'duration':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{__('Duration & Schedule', 'Duration & Schedule')}</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__('Define trip duration, type, and availability schedule', 'Define trip duration, type, and availability schedule')}
            </p>

            <div className="space-y-4">
              {/* Trip Type */}
              <div>
                <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-3">
                  {__('Trip Type', 'Trip Type')} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    formData.trip_type === 'single_day'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}>
                    <input
                      type="radio"
                      name="trip_type"
                      value="single_day"
                      checked={formData.trip_type === 'single_day'}
                      onChange={(e) => {
                        handleFieldChange('trip_type', e.target.value);
                        if (e.target.value === 'single_day') {
                          setFormData(prev => ({
                            ...prev,
                            duration_days: '1',
                            duration_nights: '0',
                          }));
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className={`block text-sm font-semibold ${
                          formData.trip_type === 'single_day'
                            ? 'text-blue-900 dark:text-blue-300'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {__('Single Day Trip', 'Single Day Trip')}
                        </span>
                        <span className={`mt-1 flex items-center text-sm ${
                          formData.trip_type === 'single_day'
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {__('Trip completed within one day (no overnight stay)', 'Trip completed within one day (no overnight stay)')}
                        </span>
                      </div>
                    </div>
                    {formData.trip_type === 'single_day' && (
                      <div className="absolute top-4 right-4">
                        <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                      </div>
                    )}
                  </label>

                  <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    formData.trip_type === 'multi_day'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}>
                    <input
                      type="radio"
                      name="trip_type"
                      value="multi_day"
                      checked={formData.trip_type === 'multi_day'}
                      onChange={(e) => handleFieldChange('trip_type', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className={`block text-sm font-semibold ${
                          formData.trip_type === 'multi_day'
                            ? 'text-blue-900 dark:text-blue-300'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {__('Multi-Day Trip', 'Multi-Day Trip')}
                        </span>
                        <span className={`mt-1 flex items-center text-sm ${
                          formData.trip_type === 'multi_day'
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {__('Trip spans multiple days with overnight stays', 'Trip spans multiple days with overnight stays')}
                        </span>
                      </div>
                    </div>
                    {formData.trip_type === 'multi_day' && (
                      <div className="absolute top-4 right-4">
                        <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Duration Days & Nights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="duration_days" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Duration (Days)', 'Duration (Days)')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="duration_days"
                    type="number"
                    min="1"
                    value={formData.duration_days}
                    onChange={(e) => {
                      const days = e.target.value;
                      handleFieldChange('duration_days', days);
                      // Auto-set nights based on trip type
                      if (formData.trip_type === 'single_day') {
                        setFormData(prev => ({ ...prev, duration_nights: '0' }));
                      } else if (days && parseInt(days) > 1) {
                        // For multi-day, typically nights = days - 1
                        const nights = Math.max(0, parseInt(days) - 1).toString();
                        setFormData(prev => ({ ...prev, duration_nights: nights }));
                      }
                    }}
                    placeholder={formData.trip_type === 'single_day' ? '1' : __('e.g., 7', 'e.g., 7')}
                    className={errors.duration_days ? 'border-red-500' : ''}
                    disabled={formData.trip_type === 'single_day'}
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {formData.trip_type === 'single_day' 
                      ? __('Single day trips are always 1 day', 'Single day trips are always 1 day')
                      : __('Enter the number of days for your trip', 'Enter the number of days for your trip')
                    }
                  </p>
                  {errors.duration_days && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.duration_days}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="duration_nights" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Duration (Nights)', 'Duration (Nights)')}
                  </label>
                  <Input
                    id="duration_nights"
                    type="number"
                    min="0"
                    value={formData.duration_nights}
                    onChange={(e) => handleFieldChange('duration_nights', e.target.value)}
                    placeholder={formData.trip_type === 'single_day' ? '0' : __('e.g., 6', 'e.g., 6')}
                    className={errors.duration_nights ? 'border-red-500' : ''}
                    disabled={formData.trip_type === 'single_day'}
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {formData.trip_type === 'single_day'
                      ? __('Single day trips have 0 nights (no overnight stay)', 'Single day trips have 0 nights (no overnight stay)')
                      : __('Enter the number of nights (typically days - 1)', 'Enter the number of nights (typically days - 1)')
                    }
                  </p>
                  {errors.duration_nights && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.duration_nights}
                    </p>
                  )}
                </div>
              </div>

              {/* Availability Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="available_from" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Available From', 'Available From')}
                  </label>
                  <Input
                    id="available_from"
                    type="date"
                    value={formData.available_from}
                    onChange={(e) => handleFieldChange('available_from', e.target.value)}
                  />
                  <HelpText
                    text={__('Earliest date this trip becomes available for booking', 'Earliest date this trip becomes available for booking')}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label htmlFor="available_to" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Available To', 'Available To')}
                  </label>
                  <Input
                    id="available_to"
                    type="date"
                    value={formData.available_to}
                    onChange={(e) => handleFieldChange('available_to', e.target.value)}
                  />
                  <HelpText
                    text={__('Latest date this trip is available for booking', 'Latest date this trip is available for booking')}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Booking Window */}
              <div>
                <label htmlFor="booking_window_days" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Booking Window (Days in Advance)', 'Booking Window (Days in Advance)')}
                </label>
                <Input
                  id="booking_window_days"
                  type="number"
                  min="0"
                  value={formData.booking_window_days}
                  onChange={(e) => handleFieldChange('booking_window_days', e.target.value)}
                  placeholder={__('e.g., 30', 'e.g., 30')}
                />
                <HelpText
                  text={__('Minimum days in advance customers can book this trip', 'Minimum days in advance customers can book this trip')}
                  className="mt-2"
                />
              </div>

              {/* Seasonal Availability */}
              <div>
                <label htmlFor="seasonal_availability" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Seasonal Availability Notes', 'Seasonal Availability Notes')}
                </label>
                <Input
                  id="seasonal_availability"
                  type="text"
                  value={formData.seasonal_availability}
                  onChange={(e) => handleFieldChange('seasonal_availability', e.target.value)}
                  placeholder={__('e.g., Available year-round except monsoon season', 'e.g., Available year-round except monsoon season')}
                />
                <HelpText
                  text={__('General notes about when this trip is typically available', 'General notes about when this trip is typically available')}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 'categorization':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{__('Categorization & Tags', 'Categorization & Tags')}</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__('Organize and classify your trip for better discoverability and filtering', 'Organize and classify your trip for better discoverability and filtering')}
            </p>

            <div className="space-y-4">
              {/* Trip Category */}
              <div>
                <label htmlFor="trip_category" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Trip Category', 'Trip Category')}
                </label>
                <Select
                  id="trip_category"
                  value={formData.trip_category}
                  onChange={(e) => handleFieldChange('trip_category', e.target.value)}
                >
                  <option value="">{__('Select a category', 'Select a category')}</option>
                  <option value="adventure">Adventure</option>
                  <option value="beach">Beach</option>
                  <option value="cultural">Cultural</option>
                  <option value="nature">Nature</option>
                  <option value="wildlife">Wildlife</option>
                  <option value="wellness">Wellness</option>
                  <option value="family">Family</option>
                  <option value="luxury">Luxury</option>
                </Select>
              </div>

              {/* Category Hierarchy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="trip_category_parent" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Parent Category', 'Parent Category')}
                  </label>
                  <Select
                    id="trip_category_parent"
                    value={formData.trip_category_parent}
                    onChange={(e) => handleFieldChange('trip_category_parent', e.target.value)}
                  >
                    <option value="">{__('None', 'None')}</option>
                    <option value="adventure">Adventure</option>
                    <option value="beach">Beach</option>
                    <option value="cultural">Cultural</option>
                    <option value="nature">Nature</option>
                  </Select>
                  <HelpText
                    text={__('Main category for hierarchical organization', 'Main category for hierarchical organization')}
                    className="mt-2"
                  />
                </div>
                {formData.trip_category_parent && (
                  <div>
                    <label htmlFor="trip_category_sub" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('Sub-Category', 'Sub-Category')}
                    </label>
                    <Select
                      id="trip_category_sub"
                      value={formData.trip_category_sub}
                      onChange={(e) => handleFieldChange('trip_category_sub', e.target.value)}
                    >
                      <option value="">{__('Select sub-category', 'Select sub-category')}</option>
                      {formData.trip_category_parent === 'adventure' && (
                        <>
                          <option value="hiking">Hiking</option>
                          <option value="trekking">Trekking</option>
                          <option value="climbing">Climbing</option>
                          <option value="water-sports">Water Sports</option>
                        </>
                      )}
                      {formData.trip_category_parent === 'beach' && (
                        <>
                          <option value="relaxation">Relaxation</option>
                          <option value="snorkeling">Snorkeling</option>
                          <option value="diving">Diving</option>
                        </>
                      )}
                    </Select>
                  </div>
                )}
              </div>

              {/* Difficulty Level */}
              <div>
                <label htmlFor="difficulty_level" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Difficulty Level', 'Difficulty Level')}
                </label>
                <Select
                  id="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={(e) => handleFieldChange('difficulty_level', e.target.value)}
                >
                  <option value="">{__('Select difficulty', 'Select difficulty')}</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </Select>
                <HelpText
                  text={__('Physical difficulty level required for this trip', 'Physical difficulty level required for this trip')}
                  className="mt-2"
                />
              </div>

              {/* Activity Types */}
              <div>
                <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Activity Types', 'Activity Types')}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Hiking', 'Swimming', 'Sightseeing', 'Photography', 'Wildlife Viewing', 'Cultural Tours', 'Adventure Sports', 'Relaxation'].map((activity) => (
                    <label key={activity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.activity_types.includes(activity.toLowerCase())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              activity_types: [...prev.activity_types, activity.toLowerCase()],
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              activity_types: prev.activity_types.filter(a => a !== activity.toLowerCase()),
                            }));
                          }
                          autoSave();
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{activity}</span>
                    </label>
                  ))}
                </div>
                <HelpText
                  text={__('Select all activities included in this trip', 'Select all activities included in this trip')}
                  className="mt-2"
                />
              </div>

              {/* Featured Priority */}
              <div>
                <label htmlFor="featured_priority" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Featured Priority', 'Featured Priority')}
                </label>
                <Select
                  id="featured_priority"
                  value={formData.featured_priority}
                  onChange={(e) => handleFieldChange('featured_priority', e.target.value as TripFormData['featured_priority'])}
                >
                  <option value="none">{__('None', 'None')}</option>
                  <option value="featured">{__('Featured', 'Featured')}</option>
                  <option value="popular">{__('Popular', 'Popular')}</option>
                  <option value="new">{__('New', 'New')}</option>
                  <option value="limited">{__('Limited Time', 'Limited Time')}</option>
                </Select>
                <HelpText
                  text={__('Special designation for frontend display and promotion', 'Special designation for frontend display and promotion')}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{__('Media & Content', 'Media & Content')}</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {__('Add visual content, videos, stories, and testimonials to showcase your trip', 'Add visual content, videos, stories, and testimonials to showcase your trip')}
            </p>

            <div className="space-y-6">
              {/* Photo Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle>{__('Photo Gallery', 'Photo Gallery')}</CardTitle>
                  <CardDescription>
                    {__('Upload images to showcase your trip. These will be displayed on the trip page.', 'Upload images to showcase your trip. These will be displayed on the trip page.')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {formData.gallery_images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                          <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
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
                      className="aspect-video border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{__('Add Image', 'Add Image')}</span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Video & Virtual Tour */}
              <Card>
                <CardHeader>
                  <CardTitle>{__('Video & Virtual Tour', 'Video & Virtual Tour')}</CardTitle>
                  <CardDescription>
                    {__('Add video content to showcase your trip visually', 'Add video content to showcase your trip visually')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('Video URL', 'Video URL')} (YouTube/Vimeo)
                    </label>
                    <HelpText
                      text={__('Paste the full URL from YouTube or Vimeo. The video will be embedded on your trip page.', 'Paste the full URL from YouTube or Vimeo. The video will be embedded on your trip page.')}
                      className="mb-2"
                    />
                    <Input
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => handleFieldChange('video_url', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('360° Virtual Tour URL', '360° Virtual Tour URL')}
                    </label>
                    <HelpText
                      text={__('Add a link to an interactive 360° virtual tour if available', 'Add a link to an interactive 360° virtual tour if available')}
                      className="mb-2"
                    />
                    <Input
                      type="url"
                      value={formData.virtual_tour_url}
                      onChange={(e) => handleFieldChange('virtual_tour_url', e.target.value)}
                      placeholder="https://..."
                      className="font-mono text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Trip Story & What Makes Special */}
              <Card>
                <CardHeader>
                  <CardTitle>{__('Trip Story & Special Features', 'Trip Story & Special Features')}</CardTitle>
                  <CardDescription>
                    {__('Tell an engaging story and highlight what makes this trip unique', 'Tell an engaging story and highlight what makes this trip unique')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('What Makes This Trip Special', 'What Makes This Trip Special')}
                    </label>
                    <HelpText
                      text={__('Highlight the unique selling points and what sets this trip apart from others', 'Highlight the unique selling points and what sets this trip apart from others')}
                      className="mb-2"
                    />
                    <textarea
                      value={formData.what_makes_special}
                      onChange={(e) => handleFieldChange('what_makes_special', e.target.value)}
                      placeholder={__('Describe what makes this trip unique and special...', 'Describe what makes this trip unique and special...')}
                      rows={5}
                      className="flex w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-normal text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:ring-blue-400 resize-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('Trip Story / Narrative', 'Trip Story / Narrative')}
                    </label>
                    <HelpText
                      text={__('Tell an engaging story about this trip. Use storytelling to connect with potential travelers emotionally', 'Tell an engaging story about this trip. Use storytelling to connect with potential travelers emotionally')}
                      className="mb-2"
                    />
                    <textarea
                      value={formData.trip_story}
                      onChange={(e) => handleFieldChange('trip_story', e.target.value)}
                      placeholder={__('Write an engaging narrative about this trip...', 'Write an engaging narrative about this trip...')}
                      rows={8}
                      className="flex w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-normal text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:ring-blue-400 resize-none transition-colors"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Testimonials */}
              <Card>
                <CardHeader>
                  <CardTitle>{__('Testimonials', 'Testimonials')}</CardTitle>
                  <CardDescription>
                    {__('Add customer testimonials or reviews to build trust', 'Add customer testimonials or reviews to build trust')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.testimonials.length > 0 ? (
                    <div className="space-y-2">
                      {formData.testimonials.map((testimonial, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="flex-1 text-sm text-gray-900 dark:text-white">{testimonial}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newTestimonials = [...formData.testimonials];
                              newTestimonials.splice(index, 1);
                              handleFieldChange('testimonials', newTestimonials);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                      <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {__('No testimonials added yet', 'No testimonials added yet')}
                      </p>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const text = prompt(__('Enter testimonial text:', 'Enter testimonial text:'));
                      if (text && text.trim()) {
                        handleFieldChange('testimonials', [...formData.testimonials, text.trim()]);
                      }
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {__('Add Testimonial', 'Add Testimonial')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{__('Pricing & Payment', 'Pricing & Payment')}</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__('Set pricing for different traveler types and payment options', 'Set pricing for different traveler types and payment options')}
            </p>

            <div className="space-y-4">
              {/* Currency */}
              <div>
                <label htmlFor="currency" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Currency', 'Currency')}
                </label>
                <Select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => handleFieldChange('currency', e.target.value)}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </Select>
              </div>

              {/* Pricing Type Selection */}
              <div>
                <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-3">
                  {__('Pricing Type', 'Pricing Type')} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    formData.pricing_type === 'regular'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}>
                    <input
                      type="radio"
                      name="pricing_type"
                      value="regular"
                      checked={formData.pricing_type === 'regular'}
                      onChange={(e) => handleFieldChange('pricing_type', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className={`block text-sm font-semibold ${
                          formData.pricing_type === 'regular'
                            ? 'text-blue-900 dark:text-blue-300'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {__('Regular Pricing', 'Regular Pricing')}
                        </span>
                        <span className={`mt-1 flex items-center text-sm ${
                          formData.pricing_type === 'regular'
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {__('Set a single price for all travelers', 'Set a single price for all travelers')}
                        </span>
                      </div>
                    </div>
                    {formData.pricing_type === 'regular' && (
                      <div className="absolute top-4 right-4">
                        <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                      </div>
                    )}
                  </label>

                  <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    formData.pricing_type === 'traveler_based'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-600'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}>
                    <input
                      type="radio"
                      name="pricing_type"
                      value="traveler_based"
                      checked={formData.pricing_type === 'traveler_based'}
                      onChange={(e) => handleFieldChange('pricing_type', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className={`block text-sm font-semibold ${
                          formData.pricing_type === 'traveler_based'
                            ? 'text-blue-900 dark:text-blue-300'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {__('Traveler-Based Pricing', 'Traveler-Based Pricing')}
                        </span>
                        <span className={`mt-1 flex items-center text-sm ${
                          formData.pricing_type === 'traveler_based'
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {__('Set different prices for each traveler category', 'Set different prices for each traveler category')}
                        </span>
                      </div>
                    </div>
                    {formData.pricing_type === 'traveler_based' && (
                      <div className="absolute top-4 right-4">
                        <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Regular Pricing */}
              {formData.pricing_type === 'regular' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                        {__('Original Price', 'Original Price')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹'}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.original_price}
                          onChange={(e) => handleFieldChange('original_price', e.target.value)}
                          placeholder="0.00"
                          className={`pl-7 ${errors.original_price ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.original_price && (
                        <p className="mt-1 text-xs text-red-600">{errors.original_price}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                        {__('Discounted Price', 'Discounted Price')} ({__('Optional', 'Optional')})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹'}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.discounted_price}
                          onChange={(e) => handleFieldChange('discounted_price', e.target.value)}
                          placeholder="0.00"
                          className={`pl-7 ${errors.discounted_price ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.discounted_price && (
                        <p className="mt-1 text-xs text-red-600">{errors.discounted_price}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Traveler Category Pricing */}
              {formData.pricing_type === 'traveler_based' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                    {__('Traveler Category Pricing', 'Traveler Category Pricing')} <span className="text-red-500">*</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {__('Add pricing for traveler categories. Categories are managed in Traveler Categories page.', 'Add pricing for traveler categories. Categories are managed in Traveler Categories page.')}
                </p>
                {isLoadingCategories ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : activeCategories.length === 0 ? (
                  <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {__('No active traveler categories found.', 'No active traveler categories found.')}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.location.href = '?subpage=traveler-categories&action=create'}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      {__('Create Category', 'Create Category')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Add Pricing Button */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCategorySelector(!showCategorySelector)}
                        className="flex items-center gap-2"
                        disabled={activeCategories.filter(cat => !formData.price_types.some(pt => pt.category_id === cat.id)).length === 0}
                      >
                        <Plus className="w-4 h-4" />
                        {__('Add Pricing', 'Add Pricing')}
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
                                {__('Select a category to add pricing', 'Select a category to add pricing')}
                              </div>
                              {activeCategories
                                .filter(cat => !formData.price_types.some(pt => pt.category_id === cat.id))
                                .length === 0 ? (
                                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                                  {__('All categories have pricing added', 'All categories have pricing added')}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {activeCategories
                                    .filter(cat => !formData.price_types.some(pt => pt.category_id === cat.id))
                                    .map(category => {
                                      const ageRange = category.age_min !== undefined || category.age_max !== undefined
                                        ? category.age_min !== undefined && category.age_max !== undefined
                                          ? `${category.age_min}-${category.age_max} ${__('years', 'years')}`
                                          : category.age_min !== undefined
                                          ? `${category.age_min}+ ${__('years', 'years')}`
                                          : category.age_max !== undefined
                                          ? `${__('Under', 'Under')} ${category.age_max} ${__('years', 'years')}`
                                          : ''
                                        : null;

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
                          const category = activeCategories.find(cat => cat.id === priceType.category_id);
                          if (!category) return null;

                          return (
                            <div key={priceType.category_id} className="p-4 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {category.label}
                                  {(category.age_min !== undefined || category.age_max !== undefined) && (
                                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                      (
                                      {category.age_min !== undefined && category.age_max !== undefined
                                        ? `${category.age_min}-${category.age_max} ${__('years', 'years')}`
                                        : category.age_min !== undefined
                                        ? `${category.age_min}+ ${__('years', 'years')}`
                                        : category.age_max !== undefined
                                        ? `${__('Under', 'Under')} ${category.age_max} ${__('years', 'years')}`
                                        : ''}
                                      )
                                    </span>
                                  )}
                                </h4>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {category.description}
                              </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handlePriceTypeRemove(category.id)}
                                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title={__('Remove Pricing', 'Remove Pricing')}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {__('Original Price', 'Original Price')} <span className="text-red-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                      {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹'}
                                    </span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={priceType.original_price}
                                      onChange={(e) => handlePriceTypeChange(category.id, 'original_price', e.target.value)}
                                      placeholder="0.00"
                                      className={`pl-7 ${errors[`price_type_${index}_original`] ? 'border-red-500' : ''}`}
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
                                    {__('Discounted Price', 'Discounted Price')} ({__('Optional', 'Optional')})
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                      {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹'}
                                    </span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={priceType.discounted_price}
                                      onChange={(e) => handlePriceTypeChange(category.id, 'discounted_price', e.target.value)}
                                      placeholder="0.00"
                                      className={`pl-7 ${errors[`price_type_${index}_discounted`] ? 'border-red-500' : ''}`}
                                    />
                                  </div>
                                  {errors[`price_type_${index}_discounted`] && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                      {errors[`price_type_${index}_discounted`]}
                                    </p>
                                  )}
                                </div>
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
                          {__('No pricing added yet. Select a category above to add pricing.', 'No pricing added yet. Select a category above to add pricing.')}
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

              {/* Sale Price */}
              <div>
                <label htmlFor="sale_price" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Sale Price', 'Sale Price')} ({__('Optional', 'Optional')})
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {__('Apply a sale price discount to all price types', 'Apply a sale price discount to all price types')}
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹'}</span>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sale_price}
                    onChange={(e) => handleFieldChange('sale_price', e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>

              {/* Deposit */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{__('Deposit & Payment Terms', 'Deposit & Payment Terms')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="deposit_amount" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('Deposit Amount', 'Deposit Amount')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹'}</span>
                      <Input
                        id="deposit_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.deposit_amount}
                        onChange={(e) => handleFieldChange('deposit_amount', e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="deposit_percentage" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('Deposit Percentage', 'Deposit Percentage')}
                    </label>
                    <div className="relative">
                      <Input
                        id="deposit_percentage"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.deposit_percentage}
                        onChange={(e) => handleFieldChange('deposit_percentage', e.target.value)}
                        placeholder="0"
                        className="pr-7"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="payment_terms" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Payment Terms', 'Payment Terms')}
                  </label>
                  <textarea
                    id="payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) => handleFieldChange('payment_terms', e.target.value)}
                    placeholder={__('e.g., 50% deposit required at booking, balance due 30 days before departure', 'e.g., 50% deposit required at booking, balance due 30 days before departure')}
                    rows={2}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                  />
                </div>
              </div>

              {/* Group Pricing */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.group_pricing_enabled}
                      onChange={(e) => handleFieldChange('group_pricing_enabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {__('Enable Group Pricing', 'Enable Group Pricing')}
                    </span>
                  </label>
                </div>
                {formData.group_pricing_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="group_size_min" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                        {__('Minimum Group Size', 'Minimum Group Size')}
                      </label>
                      <Input
                        id="group_size_min"
                        type="number"
                        min="2"
                        value={formData.group_size_min}
                        onChange={(e) => handleFieldChange('group_size_min', e.target.value)}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label htmlFor="group_discount_percentage" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                        {__('Group Discount (%)', 'Group Discount (%)')}
                      </label>
                      <div className="relative">
                        <Input
                          id="group_discount_percentage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.group_discount_percentage}
                          onChange={(e) => handleFieldChange('group_discount_percentage', e.target.value)}
                          placeholder="10"
                          className="pr-7"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'booking':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{__('Booking Settings & Requirements', 'Booking Settings & Requirements')}</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__('Configure booking limits, deadlines, and traveler requirements', 'Configure booking limits, deadlines, and traveler requirements')}
            </p>

            <div className="space-y-6">
              {/* Group Size */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{__('Group Size', 'Group Size')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="min_travelers" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('Minimum Travelers', 'Minimum Travelers')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="min_travelers"
                      type="number"
                      min="1"
                      value={formData.min_travelers}
                      onChange={(e) => handleFieldChange('min_travelers', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="max_travelers" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('Maximum Travelers', 'Maximum Travelers')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="max_travelers"
                      type="number"
                      min="1"
                      value={formData.max_travelers}
                      onChange={(e) => handleFieldChange('max_travelers', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Age Restrictions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{__('Age Restrictions', 'Age Restrictions')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="age_min" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('Minimum Age', 'Minimum Age')}
                    </label>
                    <Input
                      id="age_min"
                      type="number"
                      min="0"
                      value={formData.age_min}
                      onChange={(e) => handleFieldChange('age_min', e.target.value)}
                      placeholder={__('e.g., 18', 'e.g., 18')}
                    />
                  </div>
                  <div>
                    <label htmlFor="age_max" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('Maximum Age', 'Maximum Age')}
                    </label>
                    <Input
                      id="age_max"
                      type="number"
                      min="0"
                      value={formData.age_max}
                      onChange={(e) => handleFieldChange('age_max', e.target.value)}
                      placeholder={__('e.g., 65', 'e.g., 65')}
                    />
                  </div>
                </div>
              </div>

              {/* Booking Deadlines */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{__('Booking Deadlines', 'Booking Deadlines')}</h3>
                <div>
                  <label htmlFor="booking_deadline" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Booking Deadline', 'Booking Deadline')}
                  </label>
                  <Input
                    id="booking_deadline"
                    type="date"
                    value={formData.booking_deadline}
                    onChange={(e) => handleFieldChange('booking_deadline', e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {__('Last date customers can book this trip', 'Last date customers can book this trip')}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{__('Travel Requirements', 'Travel Requirements')}</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="physical_requirements" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('Physical Requirements', 'Physical Requirements')}
                    </label>
                    <textarea
                      id="physical_requirements"
                      value={formData.physical_requirements}
                      onChange={(e) => handleFieldChange('physical_requirements', e.target.value)}
                      placeholder={__('e.g., Moderate fitness level required, ability to walk 5km per day', 'e.g., Moderate fitness level required, ability to walk 5km per day')}
                      rows={2}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="visa_requirements" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('Visa Requirements', 'Visa Requirements')}
                    </label>
                    <textarea
                      id="visa_requirements"
                      value={formData.visa_requirements}
                      onChange={(e) => handleFieldChange('visa_requirements', e.target.value)}
                      placeholder={__('e.g., Valid passport required, visa on arrival available for most nationalities', 'e.g., Valid passport required, visa on arrival available for most nationalities')}
                      rows={2}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="vaccination_requirements" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                      {__('Vaccination Requirements', 'Vaccination Requirements')}
                    </label>
                    <textarea
                      id="vaccination_requirements"
                      value={formData.vaccination_requirements}
                      onChange={(e) => handleFieldChange('vaccination_requirements', e.target.value)}
                      placeholder={__('e.g., Yellow fever vaccination required for entry', 'e.g., Yellow fever vaccination required for entry')}
                      rows={2}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{__('Cancellation Policy', 'Cancellation Policy')}</h3>
                <div>
                  <label htmlFor="cancellation_policy" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Cancellation Policy Details', 'Cancellation Policy Details')}
                  </label>
                  <textarea
                    id="cancellation_policy"
                    value={formData.cancellation_policy}
                    onChange={(e) => handleFieldChange('cancellation_policy', e.target.value)}
                    placeholder={__('e.g., Full refund 30 days before departure, 50% refund 15-29 days before, no refund within 14 days', 'e.g., Full refund 30 days before departure, 50% refund 15-29 days before, no refund within 14 days')}
                    rows={3}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'itinerary':
        return (
          <ItinerarySection
            formData={formData}
            errors={errors}
            handleFieldChange={handleFieldChange}
            handleItineraryDayAdd={handleItineraryDayAdd}
            handleItineraryDayRemove={handleItineraryDayRemove}
            handleItineraryDayTitleChange={handleItineraryDayTitleChange}
            handleItineraryEntryAdd={handleItineraryEntryAdd}
            handleItineraryEntryRemove={handleItineraryEntryRemove}
            handleItineraryEntryChange={handleItineraryEntryChange}
            handleItineraryEntryMove={handleItineraryEntryMove}
            handleItineraryEntryDuplicate={handleItineraryEntryDuplicate}
            autoSave={autoSave}
          />
        );

      case 'included':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{__('What\'s Included & Excluded', 'What\'s Included & Excluded')}</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__('List what is included and excluded in your trip package', 'List what is included and excluded in your trip package')}
            </p>

            <div className="space-y-6">
              {/* Included Items */}
              <Card>
                <CardHeader>
                  <CardTitle>{__('Included Items', 'Included Items')}</CardTitle>
                  <CardDescription>
                    {__('List everything that is included in the trip price. This helps set clear expectations and adds value.', 'List everything that is included in the trip price. This helps set clear expectations and adds value.')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.included_items.length > 0 ? (
                    <div className="space-y-2">
                      {formData.included_items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="flex-1 text-sm text-gray-900 dark:text-white">{item}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleIncludedRemove(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                      <CheckCircle2 className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {__('No included items added yet', 'No included items added yet')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {__('Examples: Accommodation, Meals, Transportation, Guide, Entrance fees', 'Examples: Accommodation, Meals, Transportation, Guide, Entrance fees')}
                      </p>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleIncludedAdd}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {__('Add Included Item', 'Add Included Item')}
                  </Button>
                </CardContent>
              </Card>

              {/* Excluded Items */}
              <Card>
                <CardHeader>
                  <CardTitle>{__('Excluded Items', 'Excluded Items')}</CardTitle>
                  <CardDescription>
                    {__('List what is NOT included. This prevents misunderstandings and helps customers plan their budget.', 'List what is NOT included. This prevents misunderstandings and helps customers plan their budget.')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.excluded_items.length > 0 ? (
                    <div className="space-y-2">
                      {formData.excluded_items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                          <span className="flex-1 text-sm text-gray-900 dark:text-white">{item}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExcludedRemove(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                      <X className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {__('No excluded items added yet', 'No excluded items added yet')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {__('Examples: Flights, Travel insurance, Personal expenses, Tips', 'Examples: Flights, Travel insurance, Personal expenses, Tips')}
                      </p>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExcludedAdd}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {__('Add Excluded Item', 'Add Excluded Item')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'faqs':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{__('Frequently Asked Questions', 'Frequently Asked Questions')}</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__('Add common questions and answers about your trip', 'Add common questions and answers about your trip')}
            </p>
            <div className="space-y-4">
              {formData.faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {__('FAQ', 'FAQ')} {index + 1}
                    </h3>
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
                        {__('Question', 'Question')}
                      </label>
                      <Input
                        type="text"
                        value={faq.question}
                        onChange={(e) => handleFAQChange(index, 'question', e.target.value)}
                        placeholder={__('Enter question...', 'Enter question...')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                        {__('Answer', 'Answer')}
                      </label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => handleFAQChange(index, 'answer', e.target.value)}
                        placeholder={__('Enter answer...', 'Enter answer...')}
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
                {__('Add FAQ', 'Add FAQ')}
              </Button>
            </div>
          </div>
        );

      // Removed: case 'frontend-tabs' - now part of 'advanced' case

      case 'seo':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{__('SEO Settings', 'SEO Settings')}</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="meta_title" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Meta Title', 'Meta Title')}
                </label>
                <Input
                  id="meta_title"
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => handleFieldChange('meta_title', e.target.value)}
                  placeholder={formData.title || __('Trip Title', 'Trip Title')}
                />
              </div>
              <div>
                <label htmlFor="meta_description" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Meta Description', 'Meta Description')}
                </label>
                <textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => handleFieldChange('meta_description', e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                />
              </div>
              <div>
                <label htmlFor="meta_keywords" className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Meta Keywords', 'Meta Keywords')}
                </label>
                <Input
                  id="meta_keywords"
                  type="text"
                  value={formData.meta_keywords}
                  onChange={(e) => handleFieldChange('meta_keywords', e.target.value)}
                  placeholder={__('e.g., bali, beach, retreat, vacation', 'e.g., bali, beach, retreat, vacation')}
                />
              </div>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{__('Status & Lifecycle Management', 'Status & Lifecycle Management')}</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {__('Manage trip status, publishing schedule, and lifecycle', 'Manage trip status, publishing schedule, and lifecycle')}
            </p>

            <Card>
              <CardHeader>
                <CardTitle>{__('Trip Status', 'Trip Status')}</CardTitle>
                <CardDescription>
                  {__('Control the current state and visibility of your trip', 'Control the current state and visibility of your trip')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Status', 'Status')} <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value as TripFormData['status'])}
                  >
                    <option value="draft">{__('Draft', 'Draft')}</option>
                    <option value="review">{__('Review', 'Review')}</option>
                    <option value="approved">{__('Approved', 'Approved')}</option>
                    <option value="published">{__('Published', 'Published')}</option>
                    <option value="archived">{__('Archived', 'Archived')}</option>
                  </Select>
                  <HelpText
                    text={__('Draft: Work in progress | Review: Pending approval | Approved: Ready to publish | Published: Live on site | Archived: Hidden from public', 'Draft: Work in progress | Review: Pending approval | Approved: Ready to publish | Published: Live on site | Archived: Hidden from public')}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Version', 'Version')}
                  </label>
                  <Input
                    type="number"
                    value={formData.version}
                    onChange={(e) => handleFieldChange('version', parseInt(e.target.value) || 1)}
                    min="1"
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <HelpText
                    text={__('Version number is automatically incremented when changes are saved', 'Version number is automatically incremented when changes are saved')}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{__('Scheduled Publishing', 'Scheduled Publishing')}</CardTitle>
                <CardDescription>
                  {__('Automatically publish or unpublish your trip on specific dates', 'Automatically publish or unpublish your trip on specific dates')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Schedule Publish Date', 'Schedule Publish Date')}
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_publish_date}
                    onChange={(e) => handleFieldChange('scheduled_publish_date', e.target.value)}
                  />
                  <HelpText
                    text={__('Trip will be automatically published on this date and time', 'Trip will be automatically published on this date and time')}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                    {__('Schedule Unpublish Date', 'Schedule Unpublish Date')}
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_unpublish_date}
                    onChange={(e) => handleFieldChange('scheduled_unpublish_date', e.target.value)}
                  />
                  <HelpText
                    text={__('Trip will be automatically unpublished (archived) on this date and time', 'Trip will be automatically unpublished (archived) on this date and time')}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{__('Seasonal Auto-Enable/Disable', 'Seasonal Auto-Enable/Disable')}</CardTitle>
                <CardDescription>
                  {__('Automatically enable or disable trip availability based on seasonal dates', 'Automatically enable or disable trip availability based on seasonal dates')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="seasonal_auto_enable"
                    checked={formData.seasonal_auto_enable}
                    onChange={(e) => handleFieldChange('seasonal_auto_enable', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="seasonal_auto_enable" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {__('Enable seasonal auto-management', 'Enable seasonal auto-management')}
                  </label>
                </div>
                {formData.seasonal_auto_enable && (
                  <>
                    <div>
                      <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                        {__('Auto-Enable Date', 'Auto-Enable Date')}
                      </label>
                      <Input
                        type="date"
                        value={formData.seasonal_enable_date}
                        onChange={(e) => handleFieldChange('seasonal_enable_date', e.target.value)}
                      />
                      <HelpText
                        text={__('Trip will become available for booking on this date', 'Trip will become available for booking on this date')}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                        {__('Auto-Disable Date', 'Auto-Disable Date')}
                      </label>
                      <Input
                        type="date"
                        value={formData.seasonal_disable_date}
                        onChange={(e) => handleFieldChange('seasonal_disable_date', e.target.value)}
                      />
                      <HelpText
                        text={__('Trip will become unavailable for booking on this date', 'Trip will become unavailable for booking on this date')}
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
                <CardTitle>{__('Frontend Tabs Management', 'Frontend Tabs Management')}</CardTitle>
                <CardDescription>
                  {__('Manage which tabs appear on the trip single page and in what order. Enable or disable tabs, customize labels, and reorder them.', 'Manage which tabs appear on the trip single page and in what order. Enable or disable tabs, customize labels, and reorder them.')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.frontend_tabs
                    .sort((a, b) => a.order - b.order)
                    .map((tab, index) => (
                      <div
                        key={tab.id}
                        className={`p-4 rounded-lg border ${
                          tab.enabled
                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <GripVertical className="w-5 h-5 text-gray-400" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Input
                                type="text"
                                value={tab.label}
                                onChange={(e) => handleTabLabelChange(tab.id, e.target.value)}
                                className="text-sm font-medium flex-1"
                                disabled={!tab.enabled}
                                placeholder={__('Tab Label', 'Tab Label')}
                              />
                              <Badge variant="outline" className="text-xs">
                                {tab.content_type}
                              </Badge>
                            </div>
                            {tab.content_type === 'custom' && (
                              <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                  {__('Custom Content', 'Custom Content')}
                                </label>
                                <textarea
                                  value={tab.custom_content || ''}
                                  onChange={(e) => handleTabCustomContentChange(tab.id, e.target.value)}
                                  rows={3}
                                  disabled={!tab.enabled}
                                  placeholder={__('Enter custom content for this tab...', 'Enter custom content for this tab...')}
                                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                                />
                              </div>
                            )}
                            {tab.content_type !== 'custom' && (
                              <div className="mt-2">
                                <Select
                                  value={tab.content_type}
                                  onChange={(e) => handleTabContentTypeChange(tab.id, e.target.value as FrontendTab['content_type'])}
                                  disabled={!tab.enabled}
                                  className="text-xs"
                                >
                                  <option value="general">{__('General', 'General')}</option>
                                  <option value="pricing">{__('Pricing', 'Pricing')}</option>
                                  <option value="itinerary">{__('Itinerary', 'Itinerary')}</option>
                                  <option value="included_excluded">{__('Included/Excluded', 'Included/Excluded')}</option>
                                  <option value="gallery">{__('Gallery', 'Gallery')}</option>
                                  <option value="faqs">{__('FAQs', 'FAQs')}</option>
                                  <option value="reviews">{__('Reviews', 'Reviews')}</option>
                                  <option value="custom">{__('Custom Content', 'Custom Content')}</option>
                                </Select>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTabMove(tab.id, 'up')}
                              disabled={index === 0}
                              className="h-8 w-8 p-0"
                              title={__('Move up', 'Move up')}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTabMove(tab.id, 'down')}
                              disabled={index === formData.frontend_tabs.length - 1}
                              className="h-8 w-8 p-0"
                              title={__('Move down', 'Move down')}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                            {tab.content_type === 'custom' && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTabRemove(tab.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title={__('Delete tab', 'Delete tab')}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tab.enabled}
                                onChange={() => handleTabToggle(tab.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {tab.enabled ? __('Enabled', 'Enabled') : __('Disabled', 'Disabled')}
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
                    {__('Add Custom Tab', 'Add Custom Tab')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            {__('Section content coming soon...', 'Section content coming soon...')}
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        {/* Left Side - Title, Status, Saved Time */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">{formData.title || __('New Trip', 'New Trip')}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="outline" 
                className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${
                  formData.status === 'published' 
                    ? 'text-green-700 dark:text-green-400 border-green-300 dark:border-green-800'
                    : formData.status === 'review'
                    ? 'text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800'
                    : formData.status === 'approved'
                    ? 'text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                    : formData.status === 'archived'
                    ? 'text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {formData.status === 'draft' ? __('Draft', 'Draft') 
                  : formData.status === 'review' ? __('Review', 'Review')
                  : formData.status === 'approved' ? __('Approved', 'Approved')
                  : formData.status === 'published' ? __('Published', 'Published')
                  : __('Archived', 'Archived')}
              </Badge>
            {lastSaved && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-green-700 dark:text-green-300 leading-tight">
                    {__('Auto-saved', 'Auto-saved')}
                  </span>
                  <span className="text-[10px] text-green-600 dark:text-green-400 leading-tight">
                    {formatTime(lastSaved)}
                  </span>
                </div>
              </div>
            )}
            </div>
          </div>
          
          {/* Quick Start Mode Toggle */}
          {!isEditMode && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
              <button
                onClick={() => setSimpleMode(!simpleMode)}
                className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                title={simpleMode ? __('Switch to Advanced Mode', 'Switch to Advanced Mode') : __('Switch to Simple Mode', 'Switch to Simple Mode')}
              >
                <Lightbulb className={`w-3.5 h-3.5 ${simpleMode ? 'text-yellow-500' : ''}`} />
                <span>{simpleMode ? __('Simple', 'Simple') : __('Advanced', 'Advanced')}</span>
              </button>
            </div>
          )}
          
          {/* Guided Tour Button (First Time Users) */}
          {!isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                showToast(__('Guided tour feature coming soon!', 'Guided tour feature coming soon!'), 'info');
              }}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex-shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              {__('Take a Tour', 'Take a Tour')}
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
              {__('Revisions', 'Revisions')}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handlePreview}
            className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={!formData.slug}
          >
            <Eye className="w-4 h-4 mr-2" />
            {__('Preview', 'Preview')}
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isAutoSaving}
            className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {isAutoSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {__('Save Draft', 'Save Draft')}
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isSubmitting || isAutoSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {__('Publish Trip', 'Publish Trip')}
          </Button>
        </div>
      </div>

      {/* Navigation Bar with Progress */}
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
            {__('Previous', 'Previous')}
          </Button>

          {/* Progress Indicator - Compact */}
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0 max-w-md mx-4">
            <div className="flex items-center gap-1.5 text-[10px] font-medium w-full">
              <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {__('Step', 'Step')} {currentStepNumber}/{totalSteps}
              </span>
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="text-[9px] font-medium text-gray-600 dark:text-gray-400 truncate w-full text-center">
              {allSections[currentStepIndex]?.label || __('Overview', 'Overview')}
            </div>
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="default"
            onClick={goToNextSection}
            disabled={currentStepIndex >= allSections.length - 1}
            className="flex items-center gap-2 text-sm font-semibold border-2 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-500 dark:hover:border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 px-4 py-2"
          >
            {__('Next', 'Next')}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 p-0">
        {/* Sidebar */}
        <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-hidden flex-shrink-0 min-h-0">
          <div className="p-5 pb-8 space-y-6">
            {/* Essentials */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Box className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  {__('ESSENTIALS', 'ESSENTIALS')}
                </h3>
              </div>
              <div className="space-y-0.5">
                {essentialsSections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = currentSection === section.id;
                  const isNext = !section.completed && essentialsSections.slice(0, index).every(s => s.completed);
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setCurrentSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 text-left group border relative ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border-blue-200 dark:border-blue-800'
                          : isNext
                          ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                          isActive
                            ? 'bg-blue-600 text-white dark:bg-blue-500'
                            : isNext
                            ? 'bg-amber-500 text-white'
                            : section.completed
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                        <Icon className={`w-4 h-4 transition-colors ${
                          isActive 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : isNext
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                        }`} />
                      </div>
                      <span className="flex-1 min-w-0 break-words leading-snug">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Marketing */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <BarChart3 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  {__('MARKETING', 'MARKETING')}
                </h3>
              </div>
              <div className="space-y-0.5">
                {marketingSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = currentSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setCurrentSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 text-left group border ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border-blue-200 dark:border-blue-800'
                          : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                      }`} />
                      <span className="flex-1 min-w-0 break-words leading-snug">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced */}
            <div className="pb-12">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Settings className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  {__('ADVANCED', 'ADVANCED')}
                </h3>
              </div>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setCurrentSection('advanced')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 text-left group border ${
                    currentSection === 'advanced'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border-blue-200 dark:border-blue-800'
                      : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Settings className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    currentSection === 'advanced' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                  }`} />
                  <span className="flex-1 min-w-0 break-words leading-snug">{__('Status & Lifecycle', 'Status & Lifecycle')}</span>
                </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowHighlightModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{__('Add Highlight', 'Add Highlight')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Highlight Text', 'Highlight Text')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={modalInput.text}
                  onChange={(e) => setModalInput({ ...modalInput, text: e.target.value })}
                  placeholder={__('e.g., Private guide included', 'e.g., Private guide included')}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleHighlightSave();
                    }
                  }}
                />
                <HelpText
                  text={__('Keep it short and impactful. Examples: "All meals included", "Skip-the-line tickets", "Free airport transfer"', 'Keep it short and impactful. Examples: "All meals included", "Skip-the-line tickets", "Free airport transfer"')}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setShowHighlightModal(false)}>
                  {__('Cancel', 'Cancel')}
                </Button>
                <Button onClick={handleHighlightSave} disabled={!modalInput.text.trim()}>
                  {__('Add', 'Add')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Included Item Modal */}
      {showIncludedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowIncludedModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{__('Add Included Item', 'Add Included Item')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Item', 'Item')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={modalInput.text}
                  onChange={(e) => setModalInput({ ...modalInput, text: e.target.value })}
                  placeholder={__('e.g., Accommodation, Meals, Transportation', 'e.g., Accommodation, Meals, Transportation')}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleIncludedSave();
                    }
                  }}
                />
                <HelpText
                  text={__('List what is included in the trip price. Be specific: "3-star hotel", "Breakfast and dinner", "Airport pickup"', 'List what is included in the trip price. Be specific: "3-star hotel", "Breakfast and dinner", "Airport pickup"')}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setShowIncludedModal(false)}>
                  {__('Cancel', 'Cancel')}
                </Button>
                <Button onClick={handleIncludedSave} disabled={!modalInput.text.trim()}>
                  {__('Add', 'Add')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excluded Item Modal */}
      {showExcludedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowExcludedModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{__('Add Excluded Item', 'Add Excluded Item')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-gray-500 dark:text-gray-400 mb-1.5">
                  {__('Item', 'Item')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={modalInput.text}
                  onChange={(e) => setModalInput({ ...modalInput, text: e.target.value })}
                  placeholder={__('e.g., Flights, Travel insurance, Personal expenses', 'e.g., Flights, Travel insurance, Personal expenses')}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleExcludedSave();
                    }
                  }}
                />
                <HelpText
                  text={__('List what is NOT included. This helps set clear expectations. Examples: "International flights", "Travel insurance", "Tips and gratuities"', 'List what is NOT included. This helps set clear expectations. Examples: "International flights", "Travel insurance", "Tips and gratuities"')}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setShowExcludedModal(false)}>
                  {__('Cancel', 'Cancel')}
                </Button>
                <Button onClick={handleExcludedSave} disabled={!modalInput.text.trim()}>
                  {__('Add', 'Add')}
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
          <Card className="w-full max-w-2xl max-h-[80vh] mx-4 shadow-xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5" />
                  {__('Trip Revisions', 'Trip Revisions')}
                </CardTitle>
                <button
                  onClick={() => setShowRevisionsDialog(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={__('Close', 'Close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pb-4">
              {isLoadingRevisions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{__('Loading revisions...', 'Loading revisions...')}</span>
                </div>
              ) : revisions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {__('No revisions found', 'No revisions found')}
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
                              {__('Revision', 'Revision')} {revision.version}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {__('Created by', 'Created by')} {revision.created_by_name} • {new Date(revision.created_at).toLocaleString()}
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
                          {__('Use This Revision', 'Use This Revision')}
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
        title={__('Use This Revision?', 'Use This Revision?')}
        message={__('Do you want to use this revision? This will replace all current form data with the revision data.', 'Do you want to use this revision? This will replace all current form data with the revision data.')}
        confirmText={__('Yes, Use This Revision', 'Yes, Use This Revision')}
        cancelText={__('Cancel', 'Cancel')}
        variant="info"
        isLoading={false}
      />
    </div>
  );
};

export default TripForm;
