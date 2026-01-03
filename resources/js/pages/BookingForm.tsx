/**
 * Booking Form Page
 * Add/Edit Booking form with clean, minimal SaaS-style design
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Users, ChevronDown, ChevronUp, AlertCircle, Search, X } from 'lucide-react';
import { __ } from '../lib/i18n';
import { formatDate as formatDateUtil } from '../lib/dateFormat';
import { apiService } from '../lib/api-client';
import { usePermissions } from '../hooks/usePermissions';
import { getCurrencySymbol } from '../data/currencies';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Skeleton } from '../components/ui/skeleton';
import { DatePicker } from '../components/ui/date-picker';

// Dynamic traveler data - keys are field IDs from form config
interface TravelerData {
  [key: string]: string;
}

interface FormFieldConfig {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  enabled: boolean;
  order: number;
  width?: string;
  options?: { value: string; label: string }[];
  section?: string;
}

interface FormSectionConfig {
  title: string;
  description?: string;
  enabled: boolean;
  fields: FormFieldConfig[];
}

interface BookingFormConfig {
  contact_form: FormSectionConfig;
  emergency_contact_form: FormSectionConfig;
  traveler_form: FormSectionConfig;
}

interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  trip_id: string;
  booking_date: string;
  travel_date: string;
  travelers: string;
  total_amount: string;
  payment_status: string;
  booking_status: string;
  payment_method: string;
  notes: string;
}

// Country list for country fields
const countryList = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'NP', name: 'Nepal' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'TH', name: 'Thailand' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ZA', name: 'South Africa' },
];

// Normalize ISO/date-like string to formatted date using shared date library
const normalizeDateInput = (value?: string | null) => {
  if (!value) return '';
  const formatted = formatDateUtil(value);
  return formatted || value;
};

const BookingForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  // Get global currency settings
  const globalCurrency = (window as any)?.yatraAdmin?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(globalCurrency);
  
  const [formData, setFormData] = useState<BookingFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    trip_id: '',
    booking_date: normalizeDateInput(new Date().toISOString()),
    travel_date: '',
    travelers: '1',
    total_amount: '',
    payment_status: 'pending',
    booking_status: 'pending',
    payment_method: '',
    notes: '',
  });
  const [travelersData, setTravelersData] = useState<TravelerData[]>([{}]);
  const [expandedTravelers, setExpandedTravelers] = useState<number[]>([0]);
  const [emergencyContactData, setEmergencyContactData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Trip search state
  const [tripSearchQuery, setTripSearchQuery] = useState('');
  const [isTripDropdownOpen, setIsTripDropdownOpen] = useState(false);
  const tripDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tripDropdownRef.current && !tripDropdownRef.current.contains(event.target as Node)) {
        setIsTripDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch booking form configuration
  const { data: formConfig } = useQuery<BookingFormConfig>({
    queryKey: ['booking-form-config'],
    queryFn: async () => {
      const response = await apiService.getSettings();
      return response?.data?.booking_form_config || response?.booking_form_config || null;
    },
  });

  // Get enabled traveler fields from config
  const travelerFields = useMemo(() => {
    if (!formConfig?.traveler_form?.fields) return [];
    return formConfig.traveler_form.fields
      .filter(field => field.enabled)
      .sort((a, b) => a.order - b.order);
  }, [formConfig]);

  // Get enabled emergency contact fields from config
  const emergencyContactFields = useMemo(() => {
    if (!formConfig?.emergency_contact_form?.fields) return [];
    return formConfig.emergency_contact_form.fields
      .filter(field => field.enabled)
      .sort((a, b) => a.order - b.order);
  }, [formConfig]);

  // Create empty traveler based on enabled fields
  const createEmptyTraveler = (): TravelerData => {
    const empty: TravelerData = {};
    travelerFields.forEach(field => {
      empty[field.id] = '';
    });
    return empty;
  };

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const bookingId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && bookingId !== null;

  // Fetch payment gateways for dropdown
  const { data: gatewaysData } = useQuery({
    queryKey: ['payment-gateways'],
    queryFn: async () => {
      const result = await apiService.getPaymentGateways();
      if (result?.success) {
        return {
          data: result.data.filter((gw: any) => gw.enabled).map((gw: any) => ({
            id: gw.id,
            title: gw.title || gw.name,
          })),
        };
      }
      return { data: [] };
    },
  });

  // Fetch trips for dropdown - get all trips regardless of status
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ['trips-list-all'],
    queryFn: async () => {
      // Fetch all trips - try without status filter first, then with status=all
      return await apiService.getTrips({ per_page: 500 });
    },
    // Always fetch trips when user can manage bookings
    enabled: can('yatra_view_bookings') || can('yatra_view_trips'),
    retry: 1,
  });

  // Fetch booking data if editing
  const { data: bookingData, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const result = await apiService.getBooking(bookingId);

      if (!result) {
        throw new Error('Failed to fetch booking');
      }
      console.log('Booking API Response:', result);

      // Handle both wrapped { success, data } and direct data response formats
      const booking = (result as any)?.data ?? result;

      if (booking && booking.id) {
        // Use customer_name if available, otherwise construct from first/last name
        const contact = booking.contact || {};
        const firstName = booking.contact_first_name || contact.first_name || '';
        const lastName = booking.contact_last_name || contact.last_name || '';
        const customerName =
          booking.customer_name ||
          `${firstName} ${lastName}`.trim();

        // Parse travelers data - dynamic fields based on stored data
        let travelers: TravelerData[] = [];
        if (booking.travelers && Array.isArray(booking.travelers)) {
          // Map all stored fields dynamically (keys are field IDs from form builder)
          // The API returns travelers with a nested 'fields' object containing the form data
          travelers = booking.travelers.map((t: any) => {
            const traveler: TravelerData = {};
            
            // Check if fields are nested in a 'fields' property (from TravellerRepository)
            const fieldsData = t.fields || t;
            
            if (fieldsData && typeof fieldsData === 'object') {
              Object.entries(fieldsData).forEach(([key, value]) => {
                // Skip internal fields like id, booking_id, traveller_index, etc.
                if (!['id', 'booking_id', 'traveller_index', 'is_lead', 'created_at', 'updated_at'].includes(key)) {
                  traveler[key] = String(value || '');
                }
              });
            }
            
            // Also copy is_lead if present
            if (t.is_lead !== undefined) {
              traveler['is_lead'] = String(t.is_lead);
            }
            
            return traveler;
          });
        }
        
        // Ensure at least one traveler exists
        if (travelers.length === 0) {
          travelers = [{}]; // Empty object - fields will be populated from form config
        }
        
        console.log('Parsed travelers data:', travelers);
        
        // Parse emergency contact data
        let emergencyContact: Record<string, string> = {};
        if (booking.emergency_contact && typeof booking.emergency_contact === 'object') {
          Object.entries(booking.emergency_contact).forEach(([key, value]) => {
            emergencyContact[key] = String(value || '');
          });
        } else if (contact.emergency_name || contact.emergency_phone || contact.emergency_relationship) {
          emergencyContact = {
            name: String(contact.emergency_name || ''),
            phone: String(contact.emergency_phone || ''),
            relationship: String(contact.emergency_relationship || ''),
          };
        }

        const mappedData = {
          id: booking.id,
          customer_name: customerName,
          customer_email: booking.customer_email || contact.email || booking.contact_email || '',
          customer_phone: booking.customer_phone || contact.phone || booking.contact_phone || '',
          trip_id: String(booking.trip_id || ''),
          trip_title: booking.trip_title || '',
          booking_date: normalizeDateInput(booking.booking_date ?? booking.created_at ?? new Date().toISOString()),
          travel_date: normalizeDateInput(booking.travel_date ?? ''),
          travelers: booking.travelers_count || travelers.length || 1,
          total_amount: parseFloat(booking.total_amount || 0),
          payment_status: booking.payment_status || 'pending',
          booking_status: booking.status || 'pending',
          payment_method: booking.payment_gateway || '',
          notes: booking.special_requests || '',
          travelers_data: travelers,
          emergency_contact: emergencyContact,
        };
        console.log('Mapped booking data:', mappedData);
        return mappedData;
      }
      return null;
    },
    enabled: isEditMode && can('yatra_view_bookings'),
  });

  // Track if we've loaded booking data to prevent auto-calculation from overwriting
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load booking data into form when editing
  useEffect(() => {
    if (bookingData && isEditMode) {
      console.log('Setting form data from booking:', bookingData);
      setFormData({
        customer_name: bookingData.customer_name || '',
        customer_email: bookingData.customer_email || '',
        customer_phone: bookingData.customer_phone || '',
        trip_id: String(bookingData.trip_id || ''),
        booking_date: bookingData.booking_date || new Date().toISOString().split('T')[0],
        travel_date: bookingData.travel_date || '',
        travelers: String(bookingData.travelers || '1'),
        total_amount: String(bookingData.total_amount || ''),
        payment_status: bookingData.payment_status || 'pending',
        booking_status: bookingData.booking_status || 'pending',
        payment_method: bookingData.payment_method || '',
        notes: bookingData.notes || '',
      });
      
      // Set travelers data
      if (bookingData.travelers_data && bookingData.travelers_data.length > 0) {
        setTravelersData(bookingData.travelers_data);
        // Expand first traveler by default
        setExpandedTravelers([0]);
      }
      
      // Set emergency contact data
      if (bookingData.emergency_contact) {
        setEmergencyContactData(bookingData.emergency_contact);
      }
      
      setIsDataLoaded(true);
    }
  }, [bookingData, isEditMode]);

  // Calculate total amount when trip or travelers change (only for new bookings or manual changes)
  useEffect(() => {
    // Skip auto-calculation when first loading edit data
    if (isEditMode && !isDataLoaded) return;
    
    if (formData.trip_id && formData.travelers && !isEditMode) {
      const selectedTrip = tripsData?.data?.find((trip: any) => String(trip.id) === formData.trip_id);
      if (selectedTrip) {
        const total = selectedTrip.price * parseInt(formData.travelers);
        setFormData(prev => ({ ...prev, total_amount: total.toString() }));
      }
    }
  }, [formData.trip_id, formData.travelers, tripsData, isEditMode, isDataLoaded]);

  const handleFieldChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Emergency contact change handler
  const handleEmergencyContactChange = (field: string, value: string) => {
    setEmergencyContactData(prev => ({ ...prev, [field]: value }));
  };

  // Traveler management functions
  const handleTravelerChange = (index: number, field: keyof TravelerData, value: string) => {
    setTravelersData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addTraveler = () => {
    const newTraveler = createEmptyTraveler();
    setTravelersData(prev => [...prev, newTraveler]);
    setFormData(prev => ({ ...prev, travelers: String(travelersData.length + 1) }));
    setExpandedTravelers(prev => [...prev, travelersData.length]);
  };

  const removeTraveler = (index: number) => {
    if (travelersData.length <= 1) return;
    setTravelersData(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({ ...prev, travelers: String(travelersData.length - 1) }));
    setExpandedTravelers(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const toggleTravelerExpanded = (index: number) => {
    setExpandedTravelers(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = __('Customer name is required', 'Customer name is required');
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = __('Customer email is required', 'Customer email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = __('Invalid email address', 'Invalid email address');
    }

    if (!formData.trip_id) {
      newErrors.trip_id = __('Trip is required', 'Trip is required');
    }

    if (!formData.booking_date) {
      newErrors.booking_date = __('Booking date is required', 'Booking date is required');
    }

    if (!formData.travel_date) {
      newErrors.travel_date = __('Travel date is required', 'Travel date is required');
    }

    if (!formData.travelers || parseInt(formData.travelers) < 1) {
      newErrors.travelers = __('Number of travelers must be at least 1', 'Number of travelers must be at least 1');
    }

    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      newErrors.total_amount = __('Total amount must be greater than 0', 'Total amount must be greater than 0');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      // Split customer name into first and last
      const nameParts = data.customer_name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload: any = {
        contact_first_name: firstName,
        contact_last_name: lastName,
        contact_email: data.customer_email.trim(),
        contact_phone: data.customer_phone.trim(),
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
      };

      return isEditMode 
        ? await apiService.updateBooking(bookingId!, payload)
        : await apiService.createBooking(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      // Redirect to bookings list
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings`;
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the booking', 'An error occurred while saving the booking');
      setErrors({ submit: errorMessage });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings`;
  };

  if (isEditMode && isLoadingBooking) {
    return (
      <div className="space-y-3">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Form Skeleton */}
          <div className="lg:col-span-2 space-y-3">
            {/* Customer Information Card */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Booking Details Card */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Booking', 'Edit Booking') : __('Create Booking', 'Create Booking')}
        description={isEditMode ? __('Update booking information', 'Update booking information') : __('Create a new customer booking', 'Create a new customer booking')}
        actions={
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {__('Back', 'Back')}
          </Button>
        }
      />

      <ConditionalRender capability="yatra_edit_bookings">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Form Fields */}
            <div className="lg:col-span-2 space-y-3">
              {/* Customer Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Customer Information', 'Customer Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Customer Name */}
                    <div>
                      <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Customer Name', 'Customer Name')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="customer_name"
                        type="text"
                        value={formData.customer_name}
                        onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                        placeholder={__('Enter customer name', 'Enter customer name')}
                        className={errors.customer_name ? 'border-red-500' : ''}
                        required
                      />
                      {errors.customer_name && (
                        <p className="mt-1 text-sm text-red-500">{errors.customer_name}</p>
                      )}
                    </div>

                    {/* Customer Email */}
                    <div>
                      <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Customer Email', 'Customer Email')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => handleFieldChange('customer_email', e.target.value)}
                        placeholder={__('customer@example.com', 'customer@example.com')}
                        className={errors.customer_email ? 'border-red-500' : ''}
                        required
                      />
                      {errors.customer_email && (
                        <p className="mt-1 text-sm text-red-500">{errors.customer_email}</p>
                      )}
                    </div>
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Customer Phone', 'Customer Phone')}
                    </label>
                    <Input
                      id="customer_phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => handleFieldChange('customer_phone', e.target.value)}
                      placeholder={__('+1234567890', '+1234567890')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Booking Details', 'Booking Details')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Trip Selection - Searchable Dropdown */}
                  <div ref={tripDropdownRef} className="relative">
                    <label htmlFor="trip_search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Trip', 'Trip')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div 
                        className={`flex items-center border rounded-md bg-white dark:bg-gray-800 cursor-pointer ${errors.trip_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${isTripDropdownOpen ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => setIsTripDropdownOpen(!isTripDropdownOpen)}
                      >
                        <div className="flex-1 px-3 py-2 text-sm">
                          {formData.trip_id ? (
                            <span className="text-gray-900 dark:text-white">
                              {tripsData?.data?.find((t: any) => String(t.id) === formData.trip_id)?.title || 
                               bookingData?.trip_title || 
                               `Trip ID: ${formData.trip_id}`}
                            </span>
                          ) : (
                            <span className="text-gray-500">{isLoadingTrips ? __('Loading trips...', 'Loading trips...') : __('Select a trip', 'Select a trip')}</span>
                          )}
                        </div>
                        {formData.trip_id && (
                          <button
                            type="button"
                            className="p-2 text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFieldChange('trip_id', '');
                              setTripSearchQuery('');
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <div className="p-2 text-gray-400">
                          <ChevronDown className={`w-4 h-4 transition-transform ${isTripDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      
                      {/* Dropdown */}
                      {isTripDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
                          {/* Search Input */}
                          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={__('Search trips...', 'Search trips...')}
                                value={tripSearchQuery}
                                onChange={(e) => setTripSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                              />
                            </div>
                          </div>
                          
                          {/* Trip List */}
                          <div className="max-h-48 overflow-y-auto">
                            {(() => {
                              // Combine booked trip with trips list
                              let allTrips = [...(tripsData?.data || [])];
                              
                              // Add booked trip if not in list
                              if (isEditMode && bookingData?.trip_id && bookingData?.trip_title) {
                                const bookedTripExists = allTrips.some((t: any) => String(t.id) === String(bookingData.trip_id));
                                if (!bookedTripExists) {
                                  allTrips.unshift({
                                    id: bookingData.trip_id,
                                    title: bookingData.trip_title,
                                    price: bookingData.total_amount || 0,
                                    currency: globalCurrency,
                                    status: 'publish',
                                  });
                                }
                              }
                              
                              // Filter by search query
                              const filteredTrips = allTrips.filter((trip: any) => 
                                trip.title.toLowerCase().includes(tripSearchQuery.toLowerCase()) ||
                                String(trip.id).includes(tripSearchQuery)
                              );
                              
                              if (filteredTrips.length === 0) {
                                return (
                                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                    {__('No trips found', 'No trips found')}
                                  </div>
                                );
                              }
                              
                              return filteredTrips.map((trip: any) => (
                                <div
                                  key={trip.id}
                                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                    formData.trip_id === String(trip.id) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                                  }`}
                                  onClick={() => {
                                    handleFieldChange('trip_id', String(trip.id));
                                    setIsTripDropdownOpen(false);
                                    setTripSearchQuery('');
                                  }}
                                >
                                  <div className="font-medium">{trip.title}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    ID: {trip.id}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.trip_id && (
                      <p className="mt-1 text-sm text-red-500">{errors.trip_id}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Booking Date */}
                    <div>
                      <label htmlFor="booking_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Booking Date', 'Booking Date')} <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        value={formData.booking_date}
                        onChange={(value: string) => handleFieldChange('booking_date', value)}
                        placeholder={__('Select booking date', 'Select booking date')}
                        error={!!errors.booking_date}
                      />
                      {errors.booking_date && (
                        <p className="mt-1 text-sm text-red-500">{errors.booking_date}</p>
                      )}
                    </div>

                    {/* Travel Date */}
                    <div>
                      <label htmlFor="travel_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Travel Date', 'Travel Date')} <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        value={formData.travel_date}
                        onChange={(value: string) => handleFieldChange('travel_date', value)}
                        placeholder={__('Select travel date', 'Select travel date')}
                        error={!!errors.travel_date}
                      />
                      {errors.travel_date && (
                        <p className="mt-1 text-sm text-red-500">{errors.travel_date}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Number of Travelers */}
                    <div>
                      <label htmlFor="travelers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Number of Travelers', 'Number of Travelers')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="travelers"
                        type="number"
                        min="1"
                        value={formData.travelers}
                        onChange={(e) => handleFieldChange('travelers', e.target.value)}
                        className={errors.travelers ? 'border-red-500' : ''}
                        required
                      />
                      {errors.travelers && (
                        <p className="mt-1 text-sm text-red-500">{errors.travelers}</p>
                      )}
                    </div>

                    {/* Total Amount */}
                    <div>
                      <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Total Amount', 'Total Amount')} ({globalCurrency}) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{currencySymbol}</span>
                        <Input
                          id="total_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.total_amount}
                          onChange={(e) => handleFieldChange('total_amount', e.target.value)}
                          placeholder="0.00"
                          className={`pl-7 ${errors.total_amount ? 'border-red-500' : ''}`}
                          required
                        />
                      </div>
                      {errors.total_amount && (
                        <p className="mt-1 text-sm text-red-500">{errors.total_amount}</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Notes', 'Notes')}
                    </label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      placeholder={__('Additional notes or special requests', 'Additional notes or special requests')}
                      rows={3}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact - Dynamic Fields */}
              {formConfig?.emergency_contact_form?.enabled !== false && emergencyContactFields.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {formConfig?.emergency_contact_form?.title || __('Emergency Contact', 'Emergency Contact')}
                    </CardTitle>
                    {formConfig?.emergency_contact_form?.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formConfig.emergency_contact_form.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {emergencyContactFields.map((field) => (
                        <div 
                          key={field.id} 
                          className={field.width === 'full' ? 'md:col-span-2' : ''}
                        >
                          <label 
                            htmlFor={`emergency-${field.id}`}
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          
                          {/* Render field based on type */}
                          {field.type === 'select' ? (
                            <Select
                              id={`emergency-${field.id}`}
                              value={emergencyContactData[field.id] || ''}
                              onChange={(e) => handleEmergencyContactChange(field.id, e.target.value)}
                            >
                              <option value="">{field.placeholder || `Select ${field.label}`}</option>
                              {field.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </Select>
                          ) : field.type === 'country' ? (
                            <Select
                              id={`emergency-${field.id}`}
                              value={emergencyContactData[field.id] || ''}
                              onChange={(e) => handleEmergencyContactChange(field.id, e.target.value)}
                            >
                              <option value="">{field.placeholder || 'Select Country'}</option>
                              {countryList.map((country) => (
                                <option key={country.code} value={country.code}>{country.name}</option>
                              ))}
                            </Select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              id={`emergency-${field.id}`}
                              value={emergencyContactData[field.id] || ''}
                              onChange={(e) => handleEmergencyContactChange(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              rows={2}
                              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400 resize-none"
                            />
                          ) : (
                            <Input
                              id={`emergency-${field.id}`}
                              type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                              value={emergencyContactData[field.id] || ''}
                              onChange={(e) => handleEmergencyContactChange(field.id, e.target.value)}
                              placeholder={field.placeholder}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Travelers Information - Dynamic Fields */}
              {formConfig?.traveler_form?.enabled !== false && travelerFields.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {formConfig?.traveler_form?.title || __('Travelers Information', 'Travelers Information')}
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                          ({travelersData.length} {travelersData.length === 1 ? __('traveler', 'traveler') : __('travelers', 'travelers')})
                        </span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {travelersData.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedTravelers(
                              expandedTravelers.length === travelersData.length 
                                ? [] 
                                : travelersData.map((_, i) => i)
                            )}
                            className="text-gray-500 text-xs"
                          >
                            {expandedTravelers.length === travelersData.length 
                              ? __('Collapse All', 'Collapse All')
                              : __('Expand All', 'Expand All')
                            }
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addTraveler}
                          className="flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          {__('Add Traveler', 'Add Traveler')}
                        </Button>
                      </div>
                    </div>
                    {formConfig?.traveler_form?.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formConfig.traveler_form.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {travelersData.map((traveler, travelerIndex) => (
                      <div 
                        key={travelerIndex}
                        className={`border rounded-lg ${travelerIndex === 0 ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}
                      >
                        {/* Traveler Header - Collapsible */}
                        <div 
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-t-lg"
                          onClick={() => toggleTravelerExpanded(travelerIndex)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-medium text-sm text-gray-900 dark:text-white whitespace-nowrap">
                              {travelerIndex === 0 
                                ? __('Lead Traveler', 'Lead Traveler')
                                : `${__('Traveler', 'Traveler')} ${travelerIndex + 1}`
                              }
                            </span>
                            {traveler.first_name || traveler.last_name ? (
                              <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                - {[traveler.first_name, traveler.last_name].filter(Boolean).join(' ')}
                              </span>
                            ) : null}
                            {travelerIndex === 0 && (
                              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded whitespace-nowrap">
                                {__('Primary', 'Primary')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {/* Remove button - show for all travelers if more than 1 exists */}
                            {travelersData.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTraveler(travelerIndex);
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2 flex items-center gap-1"
                                title={__('Remove Traveler', 'Remove Traveler')}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-xs hidden sm:inline">{__('Remove', 'Remove')}</span>
                              </Button>
                            )}
                            {/* Expand/Collapse toggle */}
                            <div className="w-6 h-6 flex items-center justify-center">
                              {expandedTravelers.includes(travelerIndex) ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Traveler Fields - Collapsible Content */}
                        {expandedTravelers.includes(travelerIndex) && (
                          <div className="p-3 pt-0 border-t border-gray-100 dark:border-gray-700/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              {travelerFields.map((field) => (
                                <div 
                                  key={field.id} 
                                  className={field.width === 'full' ? 'md:col-span-2' : ''}
                                >
                                  <label 
                                    htmlFor={`traveler-${travelerIndex}-${field.id}`}
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                  >
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </label>
                                  
                                  {/* Render field based on type */}
                                  {field.type === 'select' ? (
                                    <Select
                                      id={`traveler-${travelerIndex}-${field.id}`}
                                      value={traveler[field.id] || ''}
                                      onChange={(e) => handleTravelerChange(travelerIndex, field.id, e.target.value)}
                                    >
                                      <option value="">{field.placeholder || `Select ${field.label}`}</option>
                                      {field.options?.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </Select>
                                  ) : field.type === 'country' ? (
                                    <Select
                                      id={`traveler-${travelerIndex}-${field.id}`}
                                      value={traveler[field.id] || ''}
                                      onChange={(e) => handleTravelerChange(travelerIndex, field.id, e.target.value)}
                                    >
                                      <option value="">{field.placeholder || 'Select Country'}</option>
                                      {countryList.map((country) => (
                                        <option key={country.code} value={country.code}>{country.name}</option>
                                      ))}
                                    </Select>
                                  ) : field.type === 'textarea' ? (
                                    <textarea
                                      id={`traveler-${travelerIndex}-${field.id}`}
                                      value={traveler[field.id] || ''}
                                      onChange={(e) => handleTravelerChange(travelerIndex, field.id, e.target.value)}
                                      placeholder={field.placeholder}
                                      rows={2}
                                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400 resize-none"
                                    />
                                  ) : (
                                    field.type === 'date' || field.id.toLowerCase().includes('date') || field.id.toLowerCase().includes('expiry') ? (
                                      <DatePicker
                                        value={traveler[field.id] || ''}
                                        onChange={(value: string) => handleTravelerChange(travelerIndex, field.id, value)}
                                        placeholder={field.placeholder || __('Select date', 'Select date')}
                                      />
                                    ) : (
                                      <Input
                                        id={`traveler-${travelerIndex}-${field.id}`}
                                        type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'number' ? 'number' : 'text'}
                                        value={traveler[field.id] || ''}
                                        onChange={(e) => handleTravelerChange(travelerIndex, field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                      />
                                    )
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Status & Payment */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Status & Payment', 'Status & Payment')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Booking Status */}
                  <div>
                    <label htmlFor="booking_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Booking Status', 'Booking Status')}
                    </label>
                    <Select
                      id="booking_status"
                      value={formData.booking_status}
                      onChange={(e) => handleFieldChange('booking_status', e.target.value)}
                    >
                      <option value="pending">{__('Pending', 'Pending')}</option>
                      <option value="confirmed">{__('Confirmed', 'Confirmed')}</option>
                      <option value="cancelled">{__('Cancelled', 'Cancelled')}</option>
                      <option value="completed">{__('Completed', 'Completed')}</option>
                      <option value="refunded">{__('Refunded', 'Refunded')}</option>
                      <option value="failed">{__('Failed', 'Failed')}</option>
                    </Select>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Payment Status', 'Payment Status')}
                    </label>
                    <Select
                      id="payment_status"
                      value={formData.payment_status}
                      onChange={(e) => handleFieldChange('payment_status', e.target.value)}
                    >
                      <option value="pending">{__('Pending', 'Pending')}</option>
                      <option value="partial">{__('Partial', 'Partial')}</option>
                      <option value="paid">{__('Paid', 'Paid')}</option>
                      <option value="refunded">{__('Refunded', 'Refunded')}</option>
                    </Select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Payment Method', 'Payment Method')}
                    </label>
                    <Select
                      id="payment_method"
                      value={formData.payment_method}
                      onChange={(e) => handleFieldChange('payment_method', e.target.value)}
                    >
                      <option value="">{__('Select payment method', 'Select payment method')}</option>
                      {gatewaysData?.data?.map((gw: any) => (
                        <option key={gw.id} value={gw.id}>
                          {gw.title}
                        </option>
                      ))}
                      {/* Fallback options if no gateways loaded */}
                      {(!gatewaysData?.data || gatewaysData.data.length === 0) && (
                        <>
                          <option value="pay_later">{__('Pay Later', 'Pay Later')}</option>
                          <option value="bank_transfer">{__('Bank Transfer', 'Bank Transfer')}</option>
                          <option value="stripe">{__('Stripe', 'Stripe')}</option>
                          <option value="paypal">{__('PayPal', 'PayPal')}</option>
                        </>
                      )}
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Actions */}
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {errors.submit && (
                      <div className="p-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                        {errors.submit}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {__('Saving...', 'Saving...')}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {isEditMode ? __('Update Booking', 'Update Booking') : __('Create Booking', 'Create Booking')}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        {__('Cancel', 'Cancel')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </ConditionalRender>
    </div>
  );
};

export default BookingForm;

