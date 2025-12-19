/**
 * View Booking Page
 * Display booking details in a clean, minimal SaaS-style design
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Calendar, Users, DollarSign, CreditCard, FileText, AlertCircle, FileSignature, CheckCircle, Clock, Send } from 'lucide-react';
import { apiClient } from '../lib/api';
import { __ } from '../lib/i18n';
import { formatDate as formatDateUtil } from '../lib/dateFormat';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Skeleton } from '../components/ui/skeleton';
import { getCurrencySymbol, getCurrency } from '../data/currencies';

interface GoogleCalendarSyncInfo {
  synced: boolean;
  calendar_id: string | null;
  event_id: string | null;
  event_type: string | null;
  sync_status: string | null;
  error_message: string | null;
  last_synced_at: string | null;
}

interface FormFieldConfig {
  id: string;
  type: string;
  label: string;
  enabled: boolean;
  order: number;
  section?: string;
}

interface FormSectionConfig {
  title: string;
  enabled: boolean;
  fields: FormFieldConfig[];
}

interface BookingFormConfig {
  contact_form: FormSectionConfig;
  emergency_contact_form: FormSectionConfig;
  traveler_form: FormSectionConfig;
}

const ViewBooking: React.FC = () => {
  const { can } = usePermissions();

  // Get booking id from URL
  const bookingId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  // Fetch booking form configuration for dynamic field labels
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

  // Get enabled emergency contact fields
  const emergencyFields = useMemo(() => {
    if (!formConfig?.emergency_contact_form?.fields) return [];
    return formConfig.emergency_contact_form.fields
      .filter(field => field.enabled)
      .sort((a, b) => a.order - b.order);
  }, [formConfig]);

  // Helper to get field label by ID
  const getFieldLabel = (fieldId: string, fields: FormFieldConfig[]): string => {
    const field = fields.find(f => f.id === fieldId);
    return field?.label || fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Fetch booking data from API
  const { data: booking, isLoading, error } = useQuery({
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
      
      // Handle both wrapped { success, data } and direct data response formats
      const data = (result.success && result.data) ? result.data : result;
      
      if (data && data.id) {
        return {
          id: data.id,
          booking_number: data.reference,
          customer_name: data.customer_name || (data.contact?.first_name && data.contact?.last_name 
            ? `${data.contact.first_name} ${data.contact.last_name}`.trim()
            : `${data.contact_first_name || ''} ${data.contact_last_name || ''}`.trim()) || 'N/A',
          customer_email: data.customer_email,
          customer_phone: data.customer_phone,
          customer_country: data.contact_country,
          trip_id: data.trip_id,
          trip_title: data.trip_title || `Trip #${data.trip_id}`,
          trip_image: data.trip_image,
          trip_price: data.total_amount / (data.travelers_count || 1),
          booking_date: data.created_at,
          travel_date: data.travel_date,
          travelers: data.travelers_count,
          travelers_data: data.travelers || [],
          total_amount: data.total_amount,
          amount_paid: data.amount_paid || 0,
          amount_due: data.amount_due || 0,
          discount_amount: data.discount_amount || 0,
          discount_code: data.discount_code || null,
          currency: data.currency || 'USD',
          payment_status: data.payment_status,
          booking_status: data.status,
          payment_method: data.payment_gateway,
          payment_date: data.payment_date,
          notes: data.special_requests,
          internal_notes: data.internal_notes,
          emergency_contact: data.emergency_contact,
          contact_data: data.contact_data,
          payments: data.payments || [],
          created_at: data.created_at,
          updated_at: data.updated_at,
          confirmed_at: data.confirmed_at,
          completed_at: data.completed_at,
          cancelled_at: data.cancelled_at,
          cancellation_reason: data.cancellation_reason,
          trip_details: data.trip_details,
          google_calendar: data.google_calendar as GoogleCalendarSyncInfo | undefined,
        };
      }

      return null;
    },
    enabled: !!bookingId && can('yatra_view_bookings'),
  });

  // Fetch consent status for this booking (only if Pro is active)
  const isPro = !!(window as any).yatraAdmin?.isPro;
  const { data: consentStatus } = useQuery({
    queryKey: ['booking-consent-status', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const response = await apiClient.get(`/bookings/${bookingId}/consent-status`);
      return response?.data || null;
    },
    enabled: !!bookingId && isPro,
  });

  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString);
  };

  const formatPrice = (price: number, currencyCode: string = 'USD') => {
    // Always format the price, even if 0 - don't show "Contact for pricing" for bookings
    const numPrice = Number(price) || 0;
    const symbol = getCurrencySymbol(currencyCode);
    const currencyData = getCurrency(currencyCode);
    const decimals = currencyData?.decimalDigits ?? 2;
    
    const formatted = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numPrice);
    
    return `${symbol}${formatted}`;
  };
  
  // Country code to name mapping
  const COUNTRY_NAMES: Record<string, string> = {
    'AF': 'Afghanistan', 'AL': 'Albania', 'DZ': 'Algeria', 'AD': 'Andorra', 'AO': 'Angola',
    'AG': 'Antigua and Barbuda', 'AR': 'Argentina', 'AM': 'Armenia', 'AU': 'Australia', 'AT': 'Austria',
    'AZ': 'Azerbaijan', 'BS': 'Bahamas', 'BH': 'Bahrain', 'BD': 'Bangladesh', 'BB': 'Barbados',
    'BY': 'Belarus', 'BE': 'Belgium', 'BZ': 'Belize', 'BJ': 'Benin', 'BT': 'Bhutan',
    'BO': 'Bolivia', 'BA': 'Bosnia and Herzegovina', 'BW': 'Botswana', 'BR': 'Brazil', 'BN': 'Brunei',
    'BG': 'Bulgaria', 'BF': 'Burkina Faso', 'BI': 'Burundi', 'KH': 'Cambodia', 'CM': 'Cameroon',
    'CA': 'Canada', 'CV': 'Cape Verde', 'CF': 'Central African Republic', 'TD': 'Chad', 'CL': 'Chile',
    'CN': 'China', 'CO': 'Colombia', 'KM': 'Comoros', 'CG': 'Congo', 'CD': 'DR Congo',
    'CR': 'Costa Rica', 'CI': 'Ivory Coast', 'HR': 'Croatia', 'CU': 'Cuba', 'CY': 'Cyprus',
    'CZ': 'Czech Republic', 'DK': 'Denmark', 'DJ': 'Djibouti', 'DM': 'Dominica', 'DO': 'Dominican Republic',
    'EC': 'Ecuador', 'EG': 'Egypt', 'SV': 'El Salvador', 'GQ': 'Equatorial Guinea', 'ER': 'Eritrea',
    'EE': 'Estonia', 'SZ': 'Eswatini', 'ET': 'Ethiopia', 'FJ': 'Fiji', 'FI': 'Finland',
    'FR': 'France', 'GA': 'Gabon', 'GM': 'Gambia', 'GE': 'Georgia', 'DE': 'Germany',
    'GH': 'Ghana', 'GR': 'Greece', 'GD': 'Grenada', 'GT': 'Guatemala', 'GN': 'Guinea',
    'GW': 'Guinea-Bissau', 'GY': 'Guyana', 'HT': 'Haiti', 'HN': 'Honduras', 'HU': 'Hungary',
    'IS': 'Iceland', 'IN': 'India', 'ID': 'Indonesia', 'IR': 'Iran', 'IQ': 'Iraq',
    'IE': 'Ireland', 'IL': 'Israel', 'IT': 'Italy', 'JM': 'Jamaica', 'JP': 'Japan',
    'JO': 'Jordan', 'KZ': 'Kazakhstan', 'KE': 'Kenya', 'KI': 'Kiribati', 'KP': 'North Korea',
    'KR': 'South Korea', 'KW': 'Kuwait', 'KG': 'Kyrgyzstan', 'LA': 'Laos', 'LV': 'Latvia',
    'LB': 'Lebanon', 'LS': 'Lesotho', 'LR': 'Liberia', 'LY': 'Libya', 'LI': 'Liechtenstein',
    'LT': 'Lithuania', 'LU': 'Luxembourg', 'MG': 'Madagascar', 'MW': 'Malawi', 'MY': 'Malaysia',
    'MV': 'Maldives', 'ML': 'Mali', 'MT': 'Malta', 'MH': 'Marshall Islands', 'MR': 'Mauritania',
    'MU': 'Mauritius', 'MX': 'Mexico', 'FM': 'Micronesia', 'MD': 'Moldova', 'MC': 'Monaco',
    'MN': 'Mongolia', 'ME': 'Montenegro', 'MA': 'Morocco', 'MZ': 'Mozambique', 'MM': 'Myanmar',
    'NA': 'Namibia', 'NR': 'Nauru', 'NP': 'Nepal', 'NL': 'Netherlands', 'NZ': 'New Zealand',
    'NI': 'Nicaragua', 'NE': 'Niger', 'NG': 'Nigeria', 'MK': 'North Macedonia', 'NO': 'Norway',
    'OM': 'Oman', 'PK': 'Pakistan', 'PW': 'Palau', 'PS': 'Palestine', 'PA': 'Panama',
    'PG': 'Papua New Guinea', 'PY': 'Paraguay', 'PE': 'Peru', 'PH': 'Philippines', 'PL': 'Poland',
    'PT': 'Portugal', 'QA': 'Qatar', 'RO': 'Romania', 'RU': 'Russia', 'RW': 'Rwanda',
    'KN': 'Saint Kitts and Nevis', 'LC': 'Saint Lucia', 'VC': 'Saint Vincent and the Grenadines',
    'WS': 'Samoa', 'SM': 'San Marino', 'ST': 'Sao Tome and Principe', 'SA': 'Saudi Arabia',
    'SN': 'Senegal', 'RS': 'Serbia', 'SC': 'Seychelles', 'SL': 'Sierra Leone', 'SG': 'Singapore',
    'SK': 'Slovakia', 'SI': 'Slovenia', 'SB': 'Solomon Islands', 'SO': 'Somalia', 'ZA': 'South Africa',
    'SS': 'South Sudan', 'ES': 'Spain', 'LK': 'Sri Lanka', 'SD': 'Sudan', 'SR': 'Suriname',
    'SE': 'Sweden', 'CH': 'Switzerland', 'SY': 'Syria', 'TW': 'Taiwan', 'TJ': 'Tajikistan',
    'TZ': 'Tanzania', 'TH': 'Thailand', 'TL': 'Timor-Leste', 'TG': 'Togo', 'TO': 'Tonga',
    'TT': 'Trinidad and Tobago', 'TN': 'Tunisia', 'TR': 'Turkey', 'TM': 'Turkmenistan',
    'TV': 'Tuvalu', 'UG': 'Uganda', 'UA': 'Ukraine', 'AE': 'United Arab Emirates',
    'GB': 'United Kingdom', 'US': 'United States', 'UY': 'Uruguay', 'UZ': 'Uzbekistan',
    'VU': 'Vanuatu', 'VA': 'Vatican City', 'VE': 'Venezuela', 'VN': 'Vietnam', 'YE': 'Yemen',
    'ZM': 'Zambia', 'ZW': 'Zimbabwe'
  };
  
  const getCountryName = (code: string): string => {
    if (!code) return '';
    const upperCode = code.toUpperCase();
    return COUNTRY_NAMES[upperCode] || code;
  };

  const getBookingStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'confirmed': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Confirmed', 'Confirmed'),
      },
      'pending': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Pending', 'Pending'),
      },
      'cancelled': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Cancelled', 'Cancelled'),
      },
      'completed': {
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        label: __('Completed', 'Completed'),
      },
    };

    const statusInfo = statusMap[status] || {
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
      label: status,
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'paid': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Paid', 'Paid'),
      },
      'pending': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Pending', 'Pending'),
      },
      'partial': {
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
        label: __('Partial', 'Partial'),
      },
      'refunded': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Refunded', 'Refunded'),
      },
    };

    const statusInfo = statusMap[status] || {
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
      label: status,
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleBack = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings`;
  };

  const handleEdit = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings&action=edit&id=${bookingId}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-3">
            {/* Booking Overview Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-36" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Information Card */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-36" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-3">
            {/* Payment Information Card */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__('Booking Not Found', 'Booking Not Found')}
          description={__('The booking you are looking for does not exist', 'The booking you are looking for does not exist')}
          actions={
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__('Back to Bookings', 'Back to Bookings')}
            </Button>
          }
        />
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            {__('Error loading booking or booking not found', 'Error loading booking or booking not found')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Booking Details', 'Booking Details')}
        description={__('View complete booking information', 'View complete booking information')}
        actions={
          <div className="flex gap-2">
            <ConditionalRender capability="yatra_edit_bookings">
              <Button
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                {__('Edit Booking', 'Edit Booking')}
              </Button>
            </ConditionalRender>
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__('Back', 'Back')}
            </Button>
          </div>
        }
      />

      <ConditionalRender capability="yatra_view_bookings">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-3">
            {/* Booking Overview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{__('Booking Overview', 'Booking Overview')}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getBookingStatusBadge(booking.booking_status)}
                    {getPaymentStatusBadge(booking.payment_status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('Booking Number', 'Booking Number')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {booking.booking_number}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('Trip', 'Trip')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {booking.trip_title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__('Trip ID', 'Trip ID')}: #{booking.trip_id}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {__('Booking Date', 'Booking Date')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(booking.booking_date)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {__('Travel Date', 'Travel Date')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(booking.travel_date)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {__('Number of Travelers', 'Number of Travelers')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {booking.travelers} {booking.travelers === 1 ? __('Traveler', 'Traveler') : __('Travelers', 'Travelers')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {__('Total Amount', 'Total Amount')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(booking.total_amount || 0, booking.currency)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Customer Information', 'Customer Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {booking.customer_name}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      {booking.customer_email}
                    </div>
                    {booking.customer_phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4" />
                        {booking.customer_phone}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Travelers Information - Dynamic Fields */}
            {booking.travelers_data && booking.travelers_data.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {formConfig?.traveler_form?.title || __('Travelers Information', 'Travelers Information')}
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                      ({booking.travelers_data.length} {booking.travelers_data.length === 1 ? __('traveler', 'traveler') : __('travelers', 'travelers')})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {booking.travelers_data.map((traveler: any, index: number) => {
                    // Extract fields from traveler - handle both flat structure and nested fields property
                    const travelerFieldsData = traveler.fields || traveler;
                    const systemFields = ['id', 'booking_id', 'traveller_index', 'is_lead', 'created_at', 'updated_at', 'fields'];
                    
                    // Get all non-empty fields from the traveler data, excluding system fields
                    const travelerEntries = Object.entries(travelerFieldsData)
                      .filter(([key, value]) => {
                        // Exclude system fields
                        if (systemFields.includes(key)) return false;
                        // Exclude empty values
                        if (!value || (typeof value === 'string' && value.trim() === '')) return false;
                        // Exclude objects (they should be in fields)
                        if (typeof value === 'object' && !Array.isArray(value)) return false;
                        return true;
                      });
                    
                    // Get name from fields or direct properties
                    const firstName = travelerFieldsData.first_name || traveler.first_name || '';
                    const lastName = travelerFieldsData.last_name || traveler.last_name || '';
                    
                    return (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg ${index === 0 ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {index === 0 ? __('Lead Traveler', 'Lead Traveler') : `${__('Traveler', 'Traveler')} ${index + 1}`}
                            {/* Show name if available */}
                            {(firstName || lastName) && (
                              <span className="font-normal text-gray-500 dark:text-gray-400 ml-2">
                                - {[firstName, lastName].filter(Boolean).join(' ')}
                              </span>
                            )}
                          </h4>
                          {index === 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">
                              {__('Primary Contact', 'Primary Contact')}
                            </span>
                          )}
                        </div>
                        
                        {/* Dynamic Fields Display */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {travelerEntries.map(([fieldId, fieldValue]) => {
                            // Skip first_name and last_name as they're shown in header
                            if (fieldId === 'first_name' || fieldId === 'last_name') return null;
                            
                            const fieldConfig = travelerFields.find(f => f.id === fieldId);
                            const label = fieldConfig?.label || getFieldLabel(fieldId, travelerFields);
                            const isLongField = fieldConfig?.type === 'textarea' || String(fieldValue).length > 50;
                            
                            // Format date fields
                            let displayValue = String(fieldValue);
                            if (fieldConfig?.type === 'date' || fieldId.includes('date') || fieldId.includes('expiry')) {
                              try {
                                displayValue = new Date(fieldValue as string).toLocaleDateString();
                              } catch {
                                displayValue = String(fieldValue);
                              }
                            }
                            
                            // Format country/nationality fields - convert code to full name
                            if ((fieldId === 'nationality' || fieldId === 'country') && fieldValue && typeof fieldValue === 'string' && fieldValue.length === 2) {
                              displayValue = getCountryName(fieldValue);
                            }
                            
                            return (
                              <div 
                                key={fieldId}
                                className={isLongField ? 'col-span-2 md:col-span-3' : ''}
                              >
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
                                <div className={`text-sm text-gray-900 dark:text-white ${fieldId === 'passport' ? 'font-mono' : ''} capitalize`}>
                                  {displayValue}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {travelerEntries.length <= 2 && (
                          <div className="text-sm text-gray-400 dark:text-gray-500 italic mt-2">
                            {__('Limited traveler information provided', 'Limited traveler information provided')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Emergency Contact - Dynamic Fields */}
            {booking.emergency_contact && Object.values(booking.emergency_contact).some(v => v && String(v).trim() !== '') && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {formConfig?.emergency_contact_form?.title || __('Emergency Contact', 'Emergency Contact')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(booking.emergency_contact)
                      .filter(([_, value]) => value && String(value).trim() !== '')
                      .map(([fieldId, fieldValue]) => {
                        const label = getFieldLabel(fieldId, emergencyFields);
                        return (
                          <div key={fieldId}>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {String(fieldValue)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {booking.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {__('Special Requests', 'Special Requests')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {booking.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Google Calendar Sync */}
            {(window as any).yatraAdmin?.isPro &&
              !!(window as any).yatraAdmin?.googleCalendar?.enabled &&
              (booking as any).google_calendar && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Google Calendar Sync', 'Google Calendar Sync')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const gc = (booking as any).google_calendar as GoogleCalendarSyncInfo;
                    const status = gc.sync_status || (gc.synced ? 'synced' : 'not_synced');
                    const statusClass =
                      status === 'synced'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : status === 'failed'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';

                    return (
                      <>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{__('Status', 'Status')}</div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${statusClass}`}>
                            {status}
                          </span>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{__('Last Synced', 'Last Synced')}</div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {gc.last_synced_at ? formatDate(gc.last_synced_at) : __('—', '—')}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{__('Calendar', 'Calendar')}</div>
                          <div className="text-sm text-gray-900 dark:text-white break-all">
                            {gc.calendar_id || __('—', '—')}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{__('Event ID', 'Event ID')}</div>
                          <div className="text-sm text-gray-900 dark:text-white font-mono break-all">
                            {gc.event_id || __('—', '—')}
                          </div>
                        </div>

                        {gc.error_message && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{__('Error', 'Error')}</div>
                            <div className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{gc.error_message}</div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Payment Information', 'Payment Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Payment Status', 'Payment Status')}
                  </div>
                  <div className="mt-1">
                    {getPaymentStatusBadge(booking.payment_status)}
                  </div>
                </div>
                {booking.payment_method && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      {__('Payment Method', 'Payment Method')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {booking.payment_method}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Trip Price per Person', 'Trip Price per Person')}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatPrice(booking.trip_price)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Total Amount', 'Total Amount')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatPrice(booking.total_amount || 0, booking.currency)}
                  </div>
                </div>
                </CardContent>
            </Card>

            {/* Discount Applied Card */}
            {booking.discount_amount > 0 && (
              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                      <path d="M2 17l10 5 10-5"></path>
                      <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    {__('Discount Applied', 'Discount Applied')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                      {__('Discount Type', 'Discount Type')}
                    </div>
                    <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {booking.discount_code?.toLowerCase().includes('group') || booking.discount_code?.includes('GROUP') 
                        ? __('Group Discount', 'Group Discount')
                        : __('Coupon Discount', 'Coupon Discount')}
                    </div>
                  </div>
                  {booking.discount_code && (
                    <div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                        {__('Code', 'Code')}
                      </div>
                      <div className="text-sm font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded inline-block">
                        {booking.discount_code}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                      {__('Savings', 'Savings')}
                    </div>
                    <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      -{formatPrice(booking.discount_amount, booking.currency)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Consent Status Card - Only show if Pro is active and there are consent forms */}
            {isPro && consentStatus && consentStatus.total_required > 0 && (
              <Card className={consentStatus.all_signed 
                ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
              }>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-base flex items-center gap-2 ${
                    consentStatus.all_signed 
                      ? "text-green-700 dark:text-green-400"
                      : "text-amber-700 dark:text-amber-400"
                  }`}>
                    <FileSignature className="w-4 h-4" />
                    {__('Consent Status', 'Consent Status')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${consentStatus.all_signed ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {consentStatus.all_signed ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {__('All Consents Signed', 'All Consents Signed')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {__('Pending Signatures', 'Pending Signatures')}
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{__('Signed', 'Signed')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {consentStatus.total_signed} / {consentStatus.total_required}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${consentStatus.all_signed ? "bg-green-500" : "bg-amber-500"}`}
                      style={{ width: `${(consentStatus.total_signed / consentStatus.total_required) * 100}%` }}
                    />
                  </div>
                  
                  {/* Pending requests */}
                  {consentStatus.pending_requests && consentStatus.pending_requests.length > 0 && (
                    <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
                      <div className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">
                        {__('Pending', 'Pending')}
                      </div>
                      <div className="space-y-1">
                        {consentStatus.pending_requests.slice(0, 3).map((req: any, idx: number) => (
                          <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            {req.recipient_name || req.recipient_email}
                          </div>
                        ))}
                        {consentStatus.pending_requests.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{consentStatus.pending_requests.length - 3} {__('more', 'more')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Link to consent management */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=trip-consent`;
                    }}
                  >
                    {__('Manage Consents', 'Manage Consents')}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Booking Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Timeline', 'Timeline')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Created', 'Created')}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDate(booking.created_at)}
                  </div>
                </div>
                {booking.updated_at && booking.updated_at !== booking.created_at && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('Last Updated', 'Last Updated')}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(booking.updated_at)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ConditionalRender>
    </div>
  );
};

export default ViewBooking;

