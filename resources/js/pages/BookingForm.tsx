/**
 * Booking Form Page
 * Add/Edit Booking form with clean, minimal SaaS-style design
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Users, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Skeleton } from '../components/ui/skeleton';

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

const BookingForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [formData, setFormData] = useState<BookingFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    trip_id: '',
    booking_date: new Date().toISOString().split('T')[0],
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

  // Fetch booking form configuration
  const { data: formConfig } = useQuery<BookingFormConfig>({
    queryKey: ['booking-form-config'],
    queryFn: async () => {
      const response = await fetch(`${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/settings`, {
        headers: {
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const result = await response.json();
      return result.data?.booking_form_config || result.booking_form_config || null;
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
      const response = await fetch(`${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/payment/gateways`, {
        headers: {
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
      });
      if (!response.ok) {
        return { data: [] };
      }
      const result = await response.json();
      if (result.success) {
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

  // Fetch trips for dropdown
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ['trips-list'],
    queryFn: async () => {
      const response = await fetch(`${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/trips?per_page=100`, {
        headers: {
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const result = await response.json();
      console.log('Trips API Response:', result);
      
      // The trips API returns { data: [...], total, page, per_page } directly (no success flag)
      const tripsArray = result.data || result || [];
      
      if (Array.isArray(tripsArray) && tripsArray.length > 0) {
        const trips = tripsArray.map((trip: any) => ({
          id: String(trip.id),
          title: trip.title,
          price: parseFloat(trip.sale_price || trip.original_price || 0),
          currency: trip.currency || 'USD',
        }));
        console.log('Mapped trips:', trips);
        return { data: trips };
      }
      
      console.log('No trips found in response');
      return { data: [] };
    },
    // Always fetch trips when user can manage bookings
    enabled: can('yatra_view_bookings') || can('yatra_view_trips'),
  });

  // Fetch booking data if editing
  const { data: bookingData, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const response = await fetch(`${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/bookings/${bookingId}`, {
        headers: {
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch booking');
      }
      const result = await response.json();
      console.log('Booking API Response:', result);
      if (result.success) {
        const booking = result.data;
        // Use customer_name if available, otherwise construct from first/last name
        const customerName = booking.customer_name || 
          `${booking.contact_first_name || ''} ${booking.contact_last_name || ''}`.trim();
        
        // Parse travelers data - dynamic fields based on stored data
        let travelers: TravelerData[] = [];
        if (booking.travelers && Array.isArray(booking.travelers)) {
          // Map all stored fields dynamically (keys are field IDs from form builder)
          travelers = booking.travelers.map((t: any) => {
            const traveler: TravelerData = {};
            Object.entries(t).forEach(([key, value]) => {
              traveler[key] = String(value || '');
            });
            return traveler;
          });
        }
        
        // Ensure at least one traveler exists
        if (travelers.length === 0) {
          travelers = [{}]; // Empty object - fields will be populated from form config
        }
        
        // Parse emergency contact data
        let emergencyContact: Record<string, string> = {};
        if (booking.emergency_contact && typeof booking.emergency_contact === 'object') {
          Object.entries(booking.emergency_contact).forEach(([key, value]) => {
            emergencyContact[key] = String(value || '');
          });
        }

        const mappedData = {
          id: booking.id,
          customer_name: customerName,
          customer_email: booking.customer_email || '',
          customer_phone: booking.customer_phone || '',
          trip_id: String(booking.trip_id || ''),
          booking_date: booking.created_at ? booking.created_at.split(' ')[0] : new Date().toISOString().split('T')[0],
          travel_date: booking.travel_date || '',
          travelers: booking.travelers_count || 1,
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
        // Include travelers data
        travelers_data: travelersData,
        // Include emergency contact data
        emergency_contact: emergencyContactData,
      };

      const url = isEditMode && bookingId
        ? `${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/bookings/${bookingId}`
        : `${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/bookings`;

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save booking');
      }

      return await response.json();
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
                  {/* Trip Selection */}
                  <div>
                    <label htmlFor="trip_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Trip', 'Trip')} <span className="text-red-500">*</span>
                    </label>
                    <Select
                      id="trip_id"
                      value={formData.trip_id}
                      onChange={(e) => handleFieldChange('trip_id', e.target.value)}
                      className={errors.trip_id ? 'border-red-500' : ''}
                      required
                    >
                      <option value="">{isLoadingTrips ? __('Loading trips...', 'Loading trips...') : __('Select a trip', 'Select a trip')}</option>
                      {tripsData?.data?.map((trip: any) => (
                        <option key={trip.id} value={String(trip.id)}>
                          {trip.title} - ${trip.price}
                        </option>
                      ))}
                    </Select>
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
                      <Input
                        id="booking_date"
                        type="date"
                        value={formData.booking_date}
                        onChange={(e) => handleFieldChange('booking_date', e.target.value)}
                        className={errors.booking_date ? 'border-red-500' : ''}
                        required
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
                      <Input
                        id="travel_date"
                        type="date"
                        value={formData.travel_date}
                        onChange={(e) => handleFieldChange('travel_date', e.target.value)}
                        className={errors.travel_date ? 'border-red-500' : ''}
                        required
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
                        {__('Total Amount', 'Total Amount')} (USD) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
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
                                    <Input
                                      id={`traveler-${travelerIndex}-${field.id}`}
                                      type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                                      value={traveler[field.id] || ''}
                                      onChange={(e) => handleTravelerChange(travelerIndex, field.id, e.target.value)}
                                      placeholder={field.placeholder}
                                    />
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

