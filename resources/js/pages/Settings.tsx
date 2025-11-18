/**
 * Settings Page
 * Comprehensive settings page for trip booking software
 * Left sidebar navigation + Right side form fields with detailed configurations
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon,
  Save,
  Loader2,
  Building2,
  Calendar,
  DollarSign,
  Mail,
  MapPin,
  Users,
  Star,
  Receipt,
  Globe,
  Bell,
  Plug,
  Shield,
  Info,
  ChevronRight
} from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';

// Helper component for form field with description - MUST be outside component to prevent remounts
const FormField = React.memo(({ 
  id, 
  label, 
  description, 
  required = false, 
  children 
}: { 
  id: string; 
  label: string; 
  description?: string; 
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="flex items-center gap-1.5">
      {label}
      {required && <span className="text-red-500">*</span>}
    </Label>
    {description && (
      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        {description}
      </p>
    )}
    {children}
  </div>
));
FormField.displayName = 'FormField';

type SettingsSection = 
  | 'general'
  | 'booking'
  | 'payment'
  | 'email'
  | 'trip'
  | 'customer'
  | 'review'
  | 'tax'
  | 'currency'
  | 'notification'
  | 'integration'
  | 'advanced';

interface PaymentGatewayConfig {
  enabled: boolean;
  title: string;
  description: string;
  api_key?: string;
  api_secret?: string;
  client_id?: string;
  client_secret?: string;
  merchant_id?: string;
  public_key?: string;
  private_key?: string;
  webhook_secret?: string;
  test_mode?: boolean;
  sandbox?: boolean;
}

interface SettingsData {
  // General Settings
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_city: string;
  company_state: string;
  company_country: string;
  company_zip: string;
  company_website: string;
  company_logo: string;
  timezone: string;
  date_format: string;
  time_format: string;
  language: string;
  
  // Booking Settings
  booking_confirmation: boolean;
  auto_confirm_bookings: boolean;
  require_login: boolean;
  allow_guest_checkout: boolean;
  cancellation_policy: string;
  cancellation_days: number;
  refund_policy: string;
  booking_expiry_hours: number;
  booking_reminder_days: number;
  allow_waitlist: boolean;
  waitlist_auto_confirm: boolean;
  
  // Payment Settings
  currency: string;
  payment_gateways: string[];
  payment_methods: string[];
  partial_payment: boolean;
  partial_payment_percentage: number;
  deposit_required: boolean;
  deposit_percentage: number;
  gateway_configs: Record<string, PaymentGatewayConfig>;
  
  // Email Settings
  admin_email: string;
  from_email: string;
  from_name: string;
  email_template_booking: boolean;
  email_template_confirmation: boolean;
  email_template_cancellation: boolean;
  email_template_reminder: boolean;
  smtp_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  
  // Trip Settings
  default_trip_status: string;
  require_availability: boolean;
  max_group_size: number;
  min_group_size: number;
  booking_advance_days: number;
  allow_custom_dates: boolean;
  require_minimum_participants: boolean;
  minimum_participants: number;
  
  // Customer Settings
  customer_registration: boolean;
  customer_fields: string[];
  require_email_verification: boolean;
  customer_account_page: string;
  allow_customer_reviews: boolean;
  customer_dashboard_enabled: boolean;
  
  // Review Settings
  enable_reviews: boolean;
  require_booking: boolean;
  auto_approve_reviews: boolean;
  review_moderation: boolean;
  min_rating: number;
  allow_anonymous_reviews: boolean;
  review_reminder_days: number;
  
  // Tax Settings
  enable_tax: boolean;
  tax_rate: number;
  tax_inclusive: boolean;
  vat_number: string;
  tax_by_country: boolean;
  tax_rates: Record<string, number>;
  
  // Currency Settings
  default_currency: string;
  multi_currency: boolean;
  currency_position: string;
  currency_decimals: number;
  supported_currencies: string[];
  auto_currency_detection: boolean;
  
  // Notification Settings
  notify_new_booking: boolean;
  notify_payment: boolean;
  notify_cancellation: boolean;
  notify_admin: boolean;
  notify_customer_booking: boolean;
  notify_customer_payment: boolean;
  sms_notifications: boolean;
  sms_provider: string;
  sms_api_key: string;
  
  // Integration Settings
  google_analytics: string;
  facebook_pixel: string;
  google_maps_api: string;
  recaptcha_enabled: boolean;
  recaptcha_site_key: string;
  recaptcha_secret_key: string;
  
  // Advanced Settings
  debug_mode: boolean;
  enable_logging: boolean;
  cache_enabled: boolean;
  api_key: string;
  api_rate_limit: number;
  session_timeout: number;
}

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  
  // Get active section from localStorage or default to 'general'
  const getInitialActiveSection = (): SettingsSection => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yatra_settings_active_section');
      if (saved && ['general', 'booking', 'payment', 'email', 'trip', 'customer', 'review', 'tax', 'currency', 'notification', 'integration', 'advanced'].includes(saved)) {
        return saved as SettingsSection;
      }
    }
    return 'general';
  };

  const [activeSection, setActiveSection] = useState<SettingsSection>(getInitialActiveSection());
  // Temporary viewing section that changes on tab click, but only becomes activeSection on save
  const [viewingSection, setViewingSection] = useState<SettingsSection>(getInitialActiveSection());
  const [isSaving, setIsSaving] = useState(false);
  const [expandedGateways, setExpandedGateways] = useState<Record<string, boolean>>({});

  // Initialize viewingSection from activeSection on mount
  useEffect(() => {
    setViewingSection(activeSection);
  }, [activeSection]);

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/settings');
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load settings', 'Failed to load settings'), 'error');
        throw error;
      }
    },
    enabled: can('manage_yatra'),
    // Avoid overwriting in-progress edits due to background refetches
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    retry: 1,
    retryDelay: 1000,
  });

  // Default settings fallback
  const defaultSettings: SettingsData = useMemo<SettingsData>(() => ({
        company_name: 'Yatra Travel Agency',
        company_email: 'info@yatra.com',
        company_phone: '+1-234-567-8900',
        company_address: '123 Travel Street',
        company_city: 'Kathmandu',
        company_state: 'Bagmati',
        company_country: 'Nepal',
        company_zip: '44600',
        company_website: 'https://yatra.com',
        company_logo: '',
        timezone: 'Asia/Kathmandu',
        date_format: 'Y-m-d',
        time_format: 'H:i',
        language: 'en',
        booking_confirmation: true,
        auto_confirm_bookings: false,
        require_login: false,
        allow_guest_checkout: true,
        cancellation_policy: 'full_refund',
        cancellation_days: 7,
        refund_policy: 'Full refund if cancelled 7 days before departure',
        booking_expiry_hours: 24,
        booking_reminder_days: 3,
        allow_waitlist: true,
        waitlist_auto_confirm: false,
        currency: 'USD',
        payment_gateways: ['stripe', 'paypal'],
        payment_methods: ['credit_card', 'paypal', 'bank_transfer'],
        partial_payment: true,
        partial_payment_percentage: 30,
        deposit_required: true,
        deposit_percentage: 20,
        gateway_configs: {
          stripe: {
            enabled: true,
            title: 'Stripe',
            description: 'Accept credit and debit cards',
            api_key: '',
            api_secret: '',
            webhook_secret: '',
            test_mode: true,
          },
          paypal: {
            enabled: true,
            title: 'PayPal',
            description: 'Accept PayPal payments',
            client_id: '',
            client_secret: '',
            sandbox: true,
          },
          razorpay: {
            enabled: false,
            title: 'Razorpay',
            description: 'Accept payments via Razorpay',
            api_key: '',
            api_secret: '',
            test_mode: true,
          },
          square: {
            enabled: false,
            title: 'Square',
            description: 'Accept payments via Square',
            api_key: '',
            api_secret: '',
            sandbox: true,
          },
          authorize_net: {
            enabled: false,
            title: 'Authorize.net',
            description: 'Accept payments via Authorize.net',
            api_key: '',
            api_secret: '',
            test_mode: true,
          },
        },
        admin_email: 'admin@yatra.com',
        from_email: 'noreply@yatra.com',
        from_name: 'Yatra Travel',
        email_template_booking: true,
        email_template_confirmation: true,
        email_template_cancellation: true,
        email_template_reminder: true,
        smtp_enabled: false,
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        smtp_encryption: 'tls',
        default_trip_status: 'active',
        require_availability: true,
        max_group_size: 20,
        min_group_size: 2,
        booking_advance_days: 30,
        allow_custom_dates: false,
        require_minimum_participants: true,
        minimum_participants: 2,
        customer_registration: true,
        customer_fields: ['name', 'email', 'phone', 'address'],
        require_email_verification: false,
        customer_account_page: '/my-account',
        allow_customer_reviews: true,
        customer_dashboard_enabled: true,
        enable_reviews: true,
        require_booking: true,
        auto_approve_reviews: false,
        review_moderation: true,
        min_rating: 1,
        allow_anonymous_reviews: false,
        review_reminder_days: 7,
        enable_tax: true,
        tax_rate: 10,
        tax_inclusive: false,
        vat_number: '',
        tax_by_country: false,
        tax_rates: {},
        default_currency: 'USD',
        multi_currency: false,
        currency_position: 'left',
        currency_decimals: 2,
        supported_currencies: ['USD', 'EUR', 'GBP'],
        auto_currency_detection: false,
        notify_new_booking: true,
        notify_payment: true,
        notify_cancellation: true,
        notify_admin: true,
        notify_customer_booking: true,
        notify_customer_payment: true,
        sms_notifications: false,
        sms_provider: 'twilio',
        sms_api_key: '',
        google_analytics: '',
        facebook_pixel: '',
        google_maps_api: '',
        recaptcha_enabled: false,
        recaptcha_site_key: '',
        recaptcha_secret_key: '',
        debug_mode: false,
        enable_logging: false,
        cache_enabled: true,
        api_key: '',
        api_rate_limit: 100,
        session_timeout: 3600,
      }), []);

  const [formData, setFormData] = useState<SettingsData | null>(null);
  const isInitializedRef = React.useRef(false);

  // Initialize form data only once
  React.useEffect(() => {
    if (isInitializedRef.current) return;
    
    if (settings) {
      setFormData(settings);
      isInitializedRef.current = true;
    } else if (!isLoading && !settings) {
      // Use default settings if API fails or returns empty
      setFormData(defaultSettings);
      isInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, isLoading]);

  // Single stable onChange handler that reads field name from input's name or id attribute
  const handleFieldChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const field = (e.target.name || e.target.id) as keyof SettingsData;
    let value: any;
    
    if (e.target.type === 'checkbox') {
      value = (e.target as HTMLInputElement).checked;
    } else if (e.target.type === 'number') {
      const numValue = parseFloat(e.target.value);
      value = isNaN(numValue) ? 0 : numValue;
    } else {
      value = e.target.value;
    }
    
    setFormData(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleGatewayConfigChange = React.useCallback((gateway: string, field: keyof PaymentGatewayConfig, value: any) => {
    setFormData(prev => {
      if (!prev) return prev;
      const configs = { ...(prev.gateway_configs || {}) };
      const existingConfig = configs[gateway] || {
        enabled: false,
        title: gateway,
        description: '',
      };
      configs[gateway] = { ...existingConfig, [field]: value };
      return { ...prev, gateway_configs: configs };
    });
  }, []);

  const toggleGatewayExpanded = (gateway: string) => {
    setExpandedGateways(prev => ({ ...prev, [gateway]: !prev[gateway] }));
  };

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      try {
        await apiClient.put('/settings', data);
        return data;
      } catch (error: any) {
        showToast(error?.message || __('Failed to save settings', 'Failed to save settings'), 'error');
        throw error;
      }
    },
    onSuccess: (savedData) => {
      queryClient.setQueryData(['settings'], savedData);
      showToast(__('Settings saved successfully', 'Settings saved successfully'), 'success');
      setIsSaving(false);
      setFormData(savedData);
      isInitializedRef.current = true; // Keep initialized after save
    },
    onError: (error: any) => {
      setIsSaving(false);
      const errorMessage = error?.message || __('Error saving settings', 'Error saving settings');
      showToast(errorMessage, 'error');
    },
  });

  const handleSave = () => {
    if (formData) {
      setIsSaving(true);
      saveMutation.mutate(formData, {
        onSuccess: () => {
          // Update activeSection to the current viewingSection when save is successful
          setActiveSection(viewingSection);
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('yatra_settings_active_section', viewingSection);
          }
        },
        onSettled: () => {
          setIsSaving(false);
        },
      });
    }
  };

  const settingsSections = [
    { id: 'general' as SettingsSection, label: __('General', 'General'), icon: Building2 },
    { id: 'booking' as SettingsSection, label: __('Booking', 'Booking'), icon: Calendar },
    { id: 'payment' as SettingsSection, label: __('Payment', 'Payment'), icon: DollarSign },
    { id: 'email' as SettingsSection, label: __('Email', 'Email'), icon: Mail },
    { id: 'trip' as SettingsSection, label: __('Trip', 'Trip'), icon: MapPin },
    { id: 'customer' as SettingsSection, label: __('Customer', 'Customer'), icon: Users },
    { id: 'review' as SettingsSection, label: __('Review', 'Review'), icon: Star },
    { id: 'tax' as SettingsSection, label: __('Tax', 'Tax'), icon: Receipt },
    { id: 'currency' as SettingsSection, label: __('Currency', 'Currency'), icon: Globe },
    { id: 'notification' as SettingsSection, label: __('Notification', 'Notification'), icon: Bell },
    { id: 'integration' as SettingsSection, label: __('Integration', 'Integration'), icon: Plug },
    { id: 'advanced' as SettingsSection, label: __('Advanced', 'Advanced'), icon: Shield },
  ];

  // Helper component for section divider
  const SectionDivider = ({ title }: { title: string }) => (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    </div>
  );

  const renderSettingsContent = () => {
    if (!formData) return null;

    switch (viewingSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {__('Company Information', 'Company Information')}
              </h3>
              <div className="space-y-4">
                <FormField
                  id="company_name"
                  label={__('Company Name', 'Company Name')}
                  description={__('Your travel agency or company name', 'Your travel agency or company name')}
                  required
                >
                    <Input
                      id="company_name"
                      name="company_name"
                      value={formData.company_name || ''}
                      onChange={handleFieldChange}
                      placeholder={__('Enter company name', 'Enter company name')}
                    />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="company_email"
                    label={__('Company Email', 'Company Email')}
                    description={__('Primary contact email address', 'Primary contact email address')}
                    required
                  >
                    <Input
                      id="company_email"
                      name="company_email"
                      type="email"
                      value={formData.company_email || ''}
                      onChange={handleFieldChange}
                      placeholder={__('company@example.com', 'company@example.com')}
                    />
                  </FormField>

                  <FormField
                    id="company_phone"
                    label={__('Company Phone', 'Company Phone')}
                    description={__('Primary contact phone number', 'Primary contact phone number')}
                  >
                    <Input
                      id="company_phone"
                      name="company_phone"
                      value={formData.company_phone || ''}
                      onChange={handleFieldChange}
                      placeholder={__('+1-234-567-8900', '+1-234-567-8900')}
                    />
                  </FormField>
                </div>

                <FormField
                  id="company_address"
                  label={__('Street Address', 'Street Address')}
                  description={__('Street address of your company', 'Street address of your company')}
                >
                    <Input
                      id="company_address"
                      name="company_address"
                      value={formData.company_address || ''}
                      onChange={handleFieldChange}
                      placeholder={__('123 Main Street', '123 Main Street')}
                    />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="company_city"
                    label={__('City', 'City')}
                  >
                    <Input
                      id="company_city"
                      name="company_city"
                      value={formData.company_city || ''}
                      onChange={handleFieldChange}
                      placeholder={__('City', 'City')}
                    />
                  </FormField>

                  <FormField
                    id="company_state"
                    label={__('State/Province', 'State/Province')}
                  >
                    <Input
                      id="company_state"
                      name="company_state"
                      value={formData.company_state || ''}
                      onChange={handleFieldChange}
                      placeholder={__('State or Province', 'State or Province')}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="company_country"
                    label={__('Country', 'Country')}
                  >
                    <Input
                      id="company_country"
                      name="company_country"
                      value={formData.company_country || ''}
                      onChange={handleFieldChange}
                      placeholder={__('Country', 'Country')}
                    />
                  </FormField>

                  <FormField
                    id="company_zip"
                    label={__('ZIP/Postal Code', 'ZIP/Postal Code')}
                  >
                    <Input
                      id="company_zip"
                      value={formData.company_zip}
                      name="company_zip"
onChange={handleFieldChange}
                      placeholder={__('ZIP Code', 'ZIP Code')}
                    />
                  </FormField>
                </div>

                <FormField
                  id="company_website"
                  label={__('Website URL', 'Website URL')}
                  description={__('Your company website address', 'Your company website address')}
                >
                  <Input
                    id="company_website"
                    type="url"
                    value={formData.company_website}
                    name="company_website"
onChange={handleFieldChange}
                    placeholder={__('https://example.com', 'https://example.com')}
                  />
                </FormField>
              </div>
            </div>

            <SectionDivider title={__('Regional Settings', 'Regional Settings')} />

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  id="timezone"
                  label={__('Timezone', 'Timezone')}
                  description={__('Select your local timezone', 'Select your local timezone')}
                >
                  <Select
                    id="timezone"
                    value={formData.timezone}
                    name="timezone"
onChange={handleFieldChange}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Asia/Kathmandu">Asia/Kathmandu</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                  </Select>
                </FormField>

                <FormField
                  id="date_format"
                  label={__('Date Format', 'Date Format')}
                  description={__('How dates are displayed', 'How dates are displayed')}
                >
                  <Select
                    id="date_format"
                    value={formData.date_format}
                    name="date_format"
onChange={handleFieldChange}
                  >
                    <option value="Y-m-d">YYYY-MM-DD</option>
                    <option value="m/d/Y">MM/DD/YYYY</option>
                    <option value="d/m/Y">DD/MM/YYYY</option>
                    <option value="d-m-Y">DD-MM-YYYY</option>
                  </Select>
                </FormField>

                <FormField
                  id="time_format"
                  label={__('Time Format', 'Time Format')}
                  description={__('12-hour or 24-hour format', '12-hour or 24-hour format')}
                >
                  <Select
                    id="time_format"
                    value={formData.time_format}
                    name="time_format"
onChange={handleFieldChange}
                  >
                    <option value="H:i">24 Hour (14:30)</option>
                    <option value="h:i A">12 Hour (2:30 PM)</option>
                  </Select>
                </FormField>
              </div>

              <FormField
                id="language"
                label={__('Default Language', 'Default Language')}
                description={__('Default language for your website', 'Default language for your website')}
              >
                <Select
                  id="language"
                  value={formData.language}
                  name="language"
onChange={handleFieldChange}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ne">Nepali</option>
                </Select>
              </FormField>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {__('Payment Options', 'Payment Options')}
              </h3>
              <div className="space-y-4">
                <FormField
                  id="currency"
                  label={__('Default Currency', 'Default Currency')}
                  description={__('Primary currency for all transactions', 'Primary currency for all transactions')}
                  required
                >
                  <Select
                    id="currency"
                    value={formData.currency}
                    name="currency"
onChange={handleFieldChange}
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="NPR">NPR - Nepalese Rupee</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </Select>
                </FormField>

                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <input
                    type="checkbox"
                    id="partial_payment"
                    checked={formData.partial_payment}
                    name="partial_payment"
onChange={handleFieldChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <Label htmlFor="partial_payment" className="font-medium cursor-pointer">
                      {__('Enable Partial Payment', 'Enable Partial Payment')}
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {__('Allow customers to pay a portion now and the rest later', 'Allow customers to pay a portion now and the rest later')}
                    </p>
                  </div>
                </div>

                {formData.partial_payment && (
                  <FormField
                    id="partial_payment_percentage"
                    label={__('Partial Payment Percentage', 'Partial Payment Percentage')}
                    description={__('Percentage of total amount required for partial payment', 'Percentage of total amount required for partial payment')}
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        id="partial_payment_percentage"
                        type="number"
                        value={formData.partial_payment_percentage}
                        name="partial_payment_percentage"
onChange={handleFieldChange}
                        min="0"
                        max="100"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                    </div>
                  </FormField>
                )}

                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <input
                    type="checkbox"
                    id="deposit_required"
                    checked={formData.deposit_required}
                    name='deposit_required'
                      onChange={handleFieldChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <Label htmlFor="deposit_required" className="font-medium cursor-pointer">
                      {__('Require Deposit', 'Require Deposit')}
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {__('Require a deposit to confirm bookings', 'Require a deposit to confirm bookings')}
                    </p>
                  </div>
                </div>

                {formData.deposit_required && (
                  <FormField
                    id="deposit_percentage"
                    label={__('Deposit Percentage', 'Deposit Percentage')}
                    description={__('Percentage of total amount required as deposit', 'Percentage of total amount required as deposit')}
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        id="deposit_percentage"
                        type="number"
                        value={formData.deposit_percentage}
                        name='deposit_percentage'
                      onChange={handleFieldChange}
                        min="0"
                        max="100"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                    </div>
                  </FormField>
                )}
              </div>
            </div>

            <SectionDivider title={__('Payment Gateways', 'Payment Gateways')} />

            <div className="space-y-4">
              {Object.entries(formData.gateway_configs || {}).map(([gateway, config]) => (
                <Card key={gateway} className="border border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`gateway_enable_${gateway}`}
                          checked={config.enabled}
                          onChange={(e) => handleGatewayConfigChange(gateway, 'enabled', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <CardTitle className="text-sm font-semibold">{config.title}</CardTitle>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{config.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGatewayExpanded(gateway)}
                        className="h-8"
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${expandedGateways[gateway] ? 'rotate-90' : ''}`}
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  {expandedGateways[gateway] && config.enabled && (
                    <CardContent className="pt-0 space-y-4">
                      {gateway === 'stripe' && (
                        <>
                          <FormField
                            id={`stripe_api_key`}
                            label={__('Publishable Key', 'Publishable Key')}
                            description={__('Your Stripe publishable API key', 'Your Stripe publishable API key')}
                          >
                            <Input
                              type="text"
                              value={config.api_key || ''}
                              onChange={(e) => handleGatewayConfigChange('stripe', 'api_key', e.target.value)}
                              placeholder="pk_test_..."
                            />
                          </FormField>
                          <FormField
                            id={`stripe_api_secret`}
                            label={__('Secret Key', 'Secret Key')}
                            description={__('Your Stripe secret API key (keep this secure)', 'Your Stripe secret API key (keep this secure)')}
                          >
                            <Input
                              type="password"
                              value={config.api_secret || ''}
                              onChange={(e) => handleGatewayConfigChange('stripe', 'api_secret', e.target.value)}
                              placeholder="sk_test_..."
                            />
                          </FormField>
                          <FormField
                            id={`stripe_webhook_secret`}
                            label={__('Webhook Secret', 'Webhook Secret')}
                            description={__('Stripe webhook signing secret for payment verification', 'Stripe webhook signing secret for payment verification')}
                          >
                            <Input
                              type="password"
                              value={config.webhook_secret || ''}
                              onChange={(e) => handleGatewayConfigChange('stripe', 'webhook_secret', e.target.value)}
                              placeholder="whsec_..."
                            />
                          </FormField>
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                            <input
                              type="checkbox"
                              id={`stripe_test_mode`}
                              checked={config.test_mode || false}
                              onChange={(e) => handleGatewayConfigChange('stripe', 'test_mode', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor={`stripe_test_mode`} className="font-normal cursor-pointer">
                              {__('Test Mode', 'Test Mode')} - {__('Use test API keys', 'Use test API keys')}
                            </Label>
                          </div>
                        </>
                      )}

                      {gateway === 'paypal' && (
                        <>
                          <FormField
                            id={`paypal_client_id`}
                            label={__('Client ID', 'Client ID')}
                            description={__('Your PayPal application client ID', 'Your PayPal application client ID')}
                          >
                            <Input
                              type="text"
                              value={config.client_id || ''}
                              onChange={(e) => handleGatewayConfigChange('paypal', 'client_id', e.target.value)}
                              placeholder="AeA1QIZXiflr1..."
                            />
                          </FormField>
                          <FormField
                            id={`paypal_client_secret`}
                            label={__('Client Secret', 'Client Secret')}
                            description={__('Your PayPal application client secret (keep this secure)', 'Your PayPal application client secret (keep this secure)')}
                          >
                            <Input
                              type="password"
                              value={config.client_secret || ''}
                              onChange={(e) => handleGatewayConfigChange('paypal', 'client_secret', e.target.value)}
                              placeholder="EC..."
                            />
                          </FormField>
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                            <input
                              type="checkbox"
                              id={`paypal_sandbox`}
                              checked={config.sandbox || false}
                              onChange={(e) => handleGatewayConfigChange('paypal', 'sandbox', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor={`paypal_sandbox`} className="font-normal cursor-pointer">
                              {__('Sandbox Mode', 'Sandbox Mode')} - {__('Use PayPal sandbox for testing', 'Use PayPal sandbox for testing')}
                            </Label>
                          </div>
                        </>
                      )}

                      {gateway === 'razorpay' && (
                        <>
                          <FormField
                            id={`razorpay_api_key`}
                            label={__('Key ID', 'Key ID')}
                            description={__('Your Razorpay key ID', 'Your Razorpay key ID')}
                          >
                            <Input
                              type="text"
                              value={config.api_key || ''}
                              onChange={(e) => handleGatewayConfigChange('razorpay', 'api_key', e.target.value)}
                              placeholder="rzp_test_..."
                            />
                          </FormField>
                          <FormField
                            id={`razorpay_api_secret`}
                            label={__('Key Secret', 'Key Secret')}
                            description={__('Your Razorpay key secret (keep this secure)', 'Your Razorpay key secret (keep this secure)')}
                          >
                            <Input
                              type="password"
                              value={config.api_secret || ''}
                              onChange={(e) => handleGatewayConfigChange('razorpay', 'api_secret', e.target.value)}
                              placeholder="..."
                            />
                          </FormField>
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                            <input
                              type="checkbox"
                              id={`razorpay_test_mode`}
                              checked={config.test_mode || false}
                              onChange={(e) => handleGatewayConfigChange('razorpay', 'test_mode', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor={`razorpay_test_mode`} className="font-normal cursor-pointer">
                              {__('Test Mode', 'Test Mode')}
                            </Label>
                          </div>
                        </>
                      )}

                      {gateway === 'square' && (
                        <>
                          <FormField
                            id={`square_api_key`}
                            label={__('Application ID', 'Application ID')}
                            description={__('Your Square application ID', 'Your Square application ID')}
                          >
                            <Input
                              type="text"
                              value={config.api_key || ''}
                              onChange={(e) => handleGatewayConfigChange('square', 'api_key', e.target.value)}
                              placeholder="sandbox-sq0idb-..."
                            />
                          </FormField>
                          <FormField
                            id={`square_api_secret`}
                            label={__('Access Token', 'Access Token')}
                            description={__('Your Square access token (keep this secure)', 'Your Square access token (keep this secure)')}
                          >
                            <Input
                              type="password"
                              value={config.api_secret || ''}
                              onChange={(e) => handleGatewayConfigChange('square', 'api_secret', e.target.value)}
                              placeholder="EAA..."
                            />
                          </FormField>
                          <FormField
                            id={`square_location_id`}
                            label={__('Location ID', 'Location ID')}
                            description={__('Your Square location ID', 'Your Square location ID')}
                          >
                            <Input
                              type="text"
                              value={config.merchant_id || ''}
                              onChange={(e) => handleGatewayConfigChange('square', 'merchant_id', e.target.value)}
                              placeholder="..."
                            />
                          </FormField>
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                            <input
                              type="checkbox"
                              id={`square_sandbox`}
                              checked={config.sandbox || false}
                              onChange={(e) => handleGatewayConfigChange('square', 'sandbox', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor={`square_sandbox`} className="font-normal cursor-pointer">
                              {__('Sandbox Mode', 'Sandbox Mode')}
                            </Label>
                          </div>
                        </>
                      )}

                      {gateway === 'authorize_net' && (
                        <>
                          <FormField
                            id={`authnet_api_key`}
                            label={__('API Login ID', 'API Login ID')}
                            description={__('Your Authorize.net API login ID', 'Your Authorize.net API login ID')}
                          >
                            <Input
                              type="text"
                              value={config.api_key || ''}
                              onChange={(e) => handleGatewayConfigChange('authorize_net', 'api_key', e.target.value)}
                              placeholder="..."
                            />
                          </FormField>
                          <FormField
                            id={`authnet_api_secret`}
                            label={__('Transaction Key', 'Transaction Key')}
                            description={__('Your Authorize.net transaction key (keep this secure)', 'Your Authorize.net transaction key (keep this secure)')}
                          >
                            <Input
                              type="password"
                              value={config.api_secret || ''}
                              onChange={(e) => handleGatewayConfigChange('authorize_net', 'api_secret', e.target.value)}
                              placeholder="..."
                            />
                          </FormField>
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                            <input
                              type="checkbox"
                              id={`authnet_test_mode`}
                              checked={config.test_mode || false}
                              onChange={(e) => handleGatewayConfigChange('authorize_net', 'test_mode', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor={`authnet_test_mode`} className="font-normal cursor-pointer">
                              {__('Test Mode', 'Test Mode')}
                            </Label>
                          </div>
                        </>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );

      // Continue with other sections... (I'll add the most important ones)
      case 'booking':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="booking_confirmation"
                  checked={formData.booking_confirmation}
                  name='booking_confirmation'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="booking_confirmation" className="font-medium cursor-pointer">
                    {__('Enable Booking Confirmation', 'Enable Booking Confirmation')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Send confirmation emails when bookings are made', 'Send confirmation emails when bookings are made')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="auto_confirm_bookings"
                  checked={formData.auto_confirm_bookings}
                  name='auto_confirm_bookings'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="auto_confirm_bookings" className="font-medium cursor-pointer">
                    {__('Auto-Confirm Bookings', 'Auto-Confirm Bookings')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Automatically confirm bookings without manual approval', 'Automatically confirm bookings without manual approval')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="require_login"
                  checked={formData.require_login}
                  name='require_login'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="require_login" className="font-medium cursor-pointer">
                    {__('Require Login for Booking', 'Require Login for Booking')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Customers must create an account to make bookings', 'Customers must create an account to make bookings')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="allow_guest_checkout"
                  checked={formData.allow_guest_checkout}
                  name='allow_guest_checkout'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="allow_guest_checkout" className="font-medium cursor-pointer">
                    {__('Allow Guest Checkout', 'Allow Guest Checkout')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Allow customers to book without creating an account', 'Allow customers to book without creating an account')}
                  </p>
                </div>
              </div>
            </div>

            <SectionDivider title={__('Cancellation & Refund Policy', 'Cancellation & Refund Policy')} />

            <div className="space-y-4">
              <FormField
                id="cancellation_policy"
                label={__('Cancellation Policy', 'Cancellation Policy')}
                description={__('What happens when a booking is cancelled', 'What happens when a booking is cancelled')}
              >
                <Select
                  id="cancellation_policy"
                  value={formData.cancellation_policy}
                  name='cancellation_policy'
                      onChange={handleFieldChange}
                >
                  <option value="no_refund">{__('No Refund', 'No Refund')}</option>
                  <option value="full_refund">{__('Full Refund', 'Full Refund')}</option>
                  <option value="partial_refund">{__('Partial Refund', 'Partial Refund')}</option>
                </Select>
              </FormField>

              <FormField
                id="cancellation_days"
                label={__('Cancellation Days Before Departure', 'Cancellation Days Before Departure')}
                description={__('Number of days before departure when cancellation is allowed', 'Number of days before departure when cancellation is allowed')}
              >
                <Input
                  id="cancellation_days"
                  type="number"
                  value={formData.cancellation_days}
                  name='cancellation_days'
                      onChange={handleFieldChange}
                  min="0"
                />
              </FormField>

              <FormField
                id="refund_policy"
                label={__('Refund Policy', 'Refund Policy')}
                description={__('Detailed refund policy description shown to customers', 'Detailed refund policy description shown to customers')}
              >
                <textarea
                  id="refund_policy"
                  value={formData.refund_policy}
                  name='refund_policy'
                      onChange={handleFieldChange}
                  rows={4}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                  placeholder={__('Enter your refund policy details...', 'Enter your refund policy details...')}
                />
              </FormField>
            </div>

            <SectionDivider title={__('Booking Expiry & Reminders', 'Booking Expiry & Reminders')} />

            <div className="space-y-4">
              <FormField
                id="booking_expiry_hours"
                label={__('Booking Expiry Hours', 'Booking Expiry Hours')}
                description={__('Hours before unpaid bookings expire and are cancelled', 'Hours before unpaid bookings expire and are cancelled')}
              >
                <Input
                  id="booking_expiry_hours"
                  type="number"
                  value={formData.booking_expiry_hours}
                  name='booking_expiry_hours'
                      onChange={handleFieldChange}
                  min="1"
                />
              </FormField>

              <FormField
                id="booking_reminder_days"
                label={__('Booking Reminder Days', 'Booking Reminder Days')}
                description={__('Send reminder emails this many days before departure', 'Send reminder emails this many days before departure')}
              >
                <Input
                  id="booking_reminder_days"
                  type="number"
                  value={formData.booking_reminder_days}
                  name='booking_reminder_days'
                      onChange={handleFieldChange}
                  min="0"
                />
              </FormField>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {__('Email Configuration', 'Email Configuration')}
              </h3>
              <div className="space-y-4">
                <FormField
                  id="admin_email"
                  label={__('Admin Email', 'Admin Email')}
                  description={__('Email address to receive admin notifications', 'Email address to receive admin notifications')}
                  required
                >
                  <Input
                    id="admin_email"
                    type="email"
                    value={formData.admin_email}
                    name='admin_email'
                      onChange={handleFieldChange}
                    placeholder={__('admin@example.com', 'admin@example.com')}
                  />
                </FormField>

                <FormField
                  id="from_email"
                  label={__('From Email', 'From Email')}
                  description={__('Email address used as sender for customer emails', 'Email address used as sender for customer emails')}
                  required
                >
                  <Input
                    id="from_email"
                    type="email"
                    value={formData.from_email}
                    name='from_email'
                      onChange={handleFieldChange}
                    placeholder={__('noreply@example.com', 'noreply@example.com')}
                  />
                </FormField>

                <FormField
                  id="from_name"
                  label={__('From Name', 'From Name')}
                  description={__('Name displayed as sender in customer emails', 'Name displayed as sender in customer emails')}
                >
                  <Input
                    id="from_name"
                    value={formData.from_name}
                    name='from_name'
                      onChange={handleFieldChange}
                    placeholder={__('Your Company Name', 'Your Company Name')}
                  />
                </FormField>
              </div>
            </div>

            <SectionDivider title={__('Email Templates', 'Email Templates')} />

            <div className="space-y-3">
              {[
                { id: 'email_template_booking', label: __('Booking Confirmation Email', 'Booking Confirmation Email'), desc: __('Send email when booking is confirmed', 'Send email when booking is confirmed') },
                { id: 'email_template_confirmation', label: __('Payment Confirmation Email', 'Payment Confirmation Email'), desc: __('Send email when payment is received', 'Send email when payment is received') },
                { id: 'email_template_cancellation', label: __('Cancellation Email', 'Cancellation Email'), desc: __('Send email when booking is cancelled', 'Send email when booking is cancelled') },
                { id: 'email_template_reminder', label: __('Booking Reminder Email', 'Booking Reminder Email'), desc: __('Send reminder email before departure', 'Send reminder email before departure') },
              ].map((template) => (
                <div key={template.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <input
                    type="checkbox"
                    id={template.id}
                    checked={formData[template.id as keyof SettingsData] as boolean}
                    name={template.id}
                    onChange={handleFieldChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <Label htmlFor={template.id} className="font-medium cursor-pointer">
                      {template.label}
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{template.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <SectionDivider title={__('SMTP Settings (Optional)', 'SMTP Settings (Optional)')} />

            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="smtp_enabled"
                  checked={formData.smtp_enabled}
                  name='smtp_enabled'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="smtp_enabled" className="font-medium cursor-pointer">
                    {__('Enable SMTP', 'Enable SMTP')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Use custom SMTP server instead of default WordPress mail', 'Use custom SMTP server instead of default WordPress mail')}
                  </p>
                </div>
              </div>

              {formData.smtp_enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      id="smtp_host"
                      label={__('SMTP Host', 'SMTP Host')}
                      description={__('SMTP server address', 'SMTP server address')}
                    >
                      <Input
                        id="smtp_host"
                        value={formData.smtp_host}
                        name='smtp_host'
                      onChange={handleFieldChange}
                        placeholder="smtp.gmail.com"
                      />
                    </FormField>

                    <FormField
                      id="smtp_port"
                      label={__('SMTP Port', 'SMTP Port')}
                      description={__('SMTP server port (usually 587 or 465)', 'SMTP server port (usually 587 or 465)')}
                    >
                      <Input
                        id="smtp_port"
                        type="number"
                        value={formData.smtp_port}
                        name='smtp_port'
                      onChange={handleFieldChange}
                        placeholder="587"
                      />
                    </FormField>
                  </div>

                  <FormField
                    id="smtp_encryption"
                    label={__('Encryption', 'Encryption')}
                    description={__('Connection encryption type', 'Connection encryption type')}
                  >
                    <Select
                      id="smtp_encryption"
                      value={formData.smtp_encryption}
                      name='smtp_encryption'
                      onChange={handleFieldChange}
                    >
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="none">None</option>
                    </Select>
                  </FormField>

                  <FormField
                    id="smtp_username"
                    label={__('SMTP Username', 'SMTP Username')}
                    description={__('Your SMTP account username', 'Your SMTP account username')}
                  >
                    <Input
                      id="smtp_username"
                      value={formData.smtp_username}
                      name='smtp_username'
                      onChange={handleFieldChange}
                      placeholder={__('your-email@gmail.com', 'your-email@gmail.com')}
                    />
                  </FormField>

                  <FormField
                    id="smtp_password"
                    label={__('SMTP Password', 'SMTP Password')}
                    description={__('Your SMTP account password or app password', 'Your SMTP account password or app password')}
                  >
                    <Input
                      id="smtp_password"
                      type="password"
                      value={formData.smtp_password}
                      name='smtp_password'
                      onChange={handleFieldChange}
                      placeholder={__('Enter SMTP password', 'Enter SMTP password')}
                    />
                  </FormField>
                </>
              )}
            </div>
          </div>
        );

      case 'trip':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <FormField
                id="default_trip_status"
                label={__('Default Trip Status', 'Default Trip Status')}
                description={__('Status assigned to new trips by default', 'Status assigned to new trips by default')}
              >
                <Select
                  id="default_trip_status"
                  value={formData.default_trip_status}
                  name='default_trip_status'
                      onChange={handleFieldChange}
                >
                  <option value="draft">{__('Draft', 'Draft')}</option>
                  <option value="active">{__('Active', 'Active')}</option>
                  <option value="inactive">{__('Inactive', 'Inactive')}</option>
                </Select>
              </FormField>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="require_availability"
                  checked={formData.require_availability}
                  name='require_availability'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="require_availability" className="font-medium cursor-pointer">
                    {__('Require Availability Check', 'Require Availability Check')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Check trip availability before allowing bookings', 'Check trip availability before allowing bookings')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="max_group_size"
                  label={__('Maximum Group Size', 'Maximum Group Size')}
                  description={__('Maximum number of participants per booking', 'Maximum number of participants per booking')}
                >
                  <Input
                    id="max_group_size"
                    type="number"
                    value={formData.max_group_size}
                    name='max_group_size'
                      onChange={handleFieldChange}
                    min="1"
                  />
                </FormField>

                <FormField
                  id="min_group_size"
                  label={__('Minimum Group Size', 'Minimum Group Size')}
                  description={__('Minimum number of participants required', 'Minimum number of participants required')}
                >
                  <Input
                    id="min_group_size"
                    type="number"
                    value={formData.min_group_size}
                    name='min_group_size'
                      onChange={handleFieldChange}
                    min="1"
                  />
                </FormField>
              </div>

              <FormField
                id="booking_advance_days"
                label={__('Maximum Booking Advance Days', 'Maximum Booking Advance Days')}
                description={__('How many days in advance customers can book', 'How many days in advance customers can book')}
              >
                <Input
                  id="booking_advance_days"
                  type="number"
                  value={formData.booking_advance_days}
                  name='booking_advance_days'
                      onChange={handleFieldChange}
                  min="1"
                />
              </FormField>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="allow_custom_dates"
                  checked={formData.allow_custom_dates}
                  name='allow_custom_dates'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="allow_custom_dates" className="font-medium cursor-pointer">
                    {__('Allow Custom Dates', 'Allow Custom Dates')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Allow customers to request custom departure dates', 'Allow customers to request custom departure dates')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="require_minimum_participants"
                  checked={formData.require_minimum_participants}
                  name='require_minimum_participants'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="require_minimum_participants" className="font-medium cursor-pointer">
                    {__('Require Minimum Participants', 'Require Minimum Participants')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Trip requires minimum participants to proceed', 'Trip requires minimum participants to proceed')}
                  </p>
                </div>
              </div>

              {formData.require_minimum_participants && (
                <FormField
                  id="minimum_participants"
                  label={__('Minimum Participants', 'Minimum Participants')}
                  description={__('Minimum number of participants required for trip to proceed', 'Minimum number of participants required for trip to proceed')}
                >
                  <Input
                    id="minimum_participants"
                    type="number"
                    value={formData.minimum_participants}
                    name='minimum_participants'
                      onChange={handleFieldChange}
                    min="1"
                  />
                </FormField>
              )}
            </div>
          </div>
        );

      case 'customer':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="customer_registration"
                  checked={formData.customer_registration}
                  name='customer_registration'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="customer_registration" className="font-medium cursor-pointer">
                    {__('Enable Customer Registration', 'Enable Customer Registration')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Allow customers to create accounts on your website', 'Allow customers to create accounts on your website')}
                  </p>
                </div>
              </div>

              <FormField
                id="customer_account_page"
                label={__('Customer Account Page', 'Customer Account Page')}
                description={__('URL slug for customer account page (e.g., /my-account)', 'URL slug for customer account page (e.g., /my-account)')}
              >
                <Input
                  id="customer_account_page"
                  value={formData.customer_account_page}
                  name='customer_account_page'
                      onChange={handleFieldChange}
                  placeholder="/my-account"
                />
              </FormField>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="require_email_verification"
                  checked={formData.require_email_verification}
                  name='require_email_verification'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="require_email_verification" className="font-medium cursor-pointer">
                    {__('Require Email Verification', 'Require Email Verification')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Customers must verify their email before account activation', 'Customers must verify their email before account activation')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="customer_dashboard_enabled"
                  checked={formData.customer_dashboard_enabled}
                  name='customer_dashboard_enabled'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="customer_dashboard_enabled" className="font-medium cursor-pointer">
                    {__('Enable Customer Dashboard', 'Enable Customer Dashboard')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Show dashboard with bookings and account information', 'Show dashboard with bookings and account information')}
                  </p>
                </div>
              </div>
            </div>

            <SectionDivider title={__('Customer Fields', 'Customer Fields')} />

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {__('Select which fields to collect from customers during registration', 'Select which fields to collect from customers during registration')}
              </p>
              {['name', 'email', 'phone', 'address', 'city', 'country', 'date_of_birth'].map((field) => (
                <div key={field} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <input
                    type="checkbox"
                    id={`field_${field}`}
                    checked={formData.customer_fields.includes(field)}
                    onChange={(e) => {
                      const fields = e.target.checked
                        ? [...formData.customer_fields, field]
                        : formData.customer_fields.filter(f => f !== field);
                      setFormData(prev => prev ? { ...prev, customer_fields: fields } : prev);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor={`field_${field}`} className="font-normal cursor-pointer">
                    {field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="enable_reviews"
                  checked={formData.enable_reviews}
                  name='enable_reviews'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="enable_reviews" className="font-medium cursor-pointer">
                    {__('Enable Reviews', 'Enable Reviews')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Allow customers to leave reviews and ratings', 'Allow customers to leave reviews and ratings')}
                  </p>
                </div>
              </div>

              {formData.enable_reviews && (
                <>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <input
                      type="checkbox"
                      id="require_booking"
                      checked={formData.require_booking}
                      name='require_booking'
                      onChange={handleFieldChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <Label htmlFor="require_booking" className="font-medium cursor-pointer">
                        {__('Require Booking to Review', 'Require Booking to Review')}
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {__('Only customers who have booked can leave reviews', 'Only customers who have booked can leave reviews')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <input
                      type="checkbox"
                      id="auto_approve_reviews"
                      checked={formData.auto_approve_reviews}
                      name='auto_approve_reviews'
                      onChange={handleFieldChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <Label htmlFor="auto_approve_reviews" className="font-medium cursor-pointer">
                        {__('Auto-Approve Reviews', 'Auto-Approve Reviews')}
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {__('Automatically publish reviews without moderation', 'Automatically publish reviews without moderation')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <input
                      type="checkbox"
                      id="review_moderation"
                      checked={formData.review_moderation}
                      name='review_moderation'
                      onChange={handleFieldChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <Label htmlFor="review_moderation" className="font-medium cursor-pointer">
                        {__('Enable Review Moderation', 'Enable Review Moderation')}
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {__('Manually approve reviews before they are published', 'Manually approve reviews before they are published')}
                      </p>
                    </div>
                  </div>

                  <FormField
                    id="min_rating"
                    label={__('Minimum Rating', 'Minimum Rating')}
                    description={__('Lowest rating value allowed (1-5 stars)', 'Lowest rating value allowed (1-5 stars)')}
                  >
                    <Select
                      id="min_rating"
                      value={formData.min_rating}
                      name='min_rating'
                      onChange={handleFieldChange}
                    >
                      <option value="1">1 {__('Star', 'Star')}</option>
                      <option value="2">2 {__('Stars', 'Stars')}</option>
                      <option value="3">3 {__('Stars', 'Stars')}</option>
                      <option value="4">4 {__('Stars', 'Stars')}</option>
                      <option value="5">5 {__('Stars', 'Stars')}</option>
                    </Select>
                  </FormField>

                  <FormField
                    id="review_reminder_days"
                    label={__('Review Reminder Days', 'Review Reminder Days')}
                    description={__('Send review reminder email this many days after trip completion', 'Send review reminder email this many days after trip completion')}
                  >
                    <Input
                      id="review_reminder_days"
                      type="number"
                      value={formData.review_reminder_days}
                      name='review_reminder_days'
                      onChange={handleFieldChange}
                      min="0"
                    />
                  </FormField>
                </>
              )}
            </div>
          </div>
        );

      case 'tax':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="enable_tax"
                  checked={formData.enable_tax}
                  name='enable_tax'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="enable_tax" className="font-medium cursor-pointer">
                    {__('Enable Tax', 'Enable Tax')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Add tax to booking prices', 'Add tax to booking prices')}
                  </p>
                </div>
              </div>

              {formData.enable_tax && (
                <>
                  <FormField
                    id="tax_rate"
                    label={__('Tax Rate (%)', 'Tax Rate (%)')}
                    description={__('Default tax rate percentage', 'Default tax rate percentage')}
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        id="tax_rate"
                        type="number"
                        value={formData.tax_rate}
                        name='tax_rate'
                      onChange={handleFieldChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                    </div>
                  </FormField>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <input
                      type="checkbox"
                      id="tax_inclusive"
                      checked={formData.tax_inclusive}
                      name='tax_inclusive'
                      onChange={handleFieldChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <Label htmlFor="tax_inclusive" className="font-medium cursor-pointer">
                        {__('Tax Inclusive Pricing', 'Tax Inclusive Pricing')}
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {__('Tax is included in displayed prices', 'Tax is included in displayed prices')}
                      </p>
                    </div>
                  </div>

                  <FormField
                    id="vat_number"
                    label={__('VAT Number', 'VAT Number')}
                    description={__('Your company VAT or tax identification number', 'Your company VAT or tax identification number')}
                  >
                    <Input
                      id="vat_number"
                      value={formData.vat_number}
                      name='vat_number'
                      onChange={handleFieldChange}
                      placeholder={__('Enter VAT number', 'Enter VAT number')}
                    />
                  </FormField>
                </>
              )}
            </div>
          </div>
        );

      case 'currency':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <FormField
                id="default_currency"
                label={__('Default Currency', 'Default Currency')}
                description={__('Primary currency for all transactions', 'Primary currency for all transactions')}
                required
              >
                <Select
                  id="default_currency"
                  value={formData.default_currency}
                  name='default_currency'
                      onChange={handleFieldChange}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="NPR">NPR - Nepalese Rupee</option>
                  <option value="INR">INR - Indian Rupee</option>
                </Select>
              </FormField>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="multi_currency"
                  checked={formData.multi_currency}
                  name='multi_currency'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="multi_currency" className="font-medium cursor-pointer">
                    {__('Enable Multi-Currency', 'Enable Multi-Currency')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Allow customers to view prices in different currencies', 'Allow customers to view prices in different currencies')}
                  </p>
                </div>
              </div>

              <FormField
                id="currency_position"
                label={__('Currency Position', 'Currency Position')}
                description={__('Where to display currency symbol relative to amount', 'Where to display currency symbol relative to amount')}
              >
                <Select
                  id="currency_position"
                  value={formData.currency_position}
                  name='currency_position'
                      onChange={handleFieldChange}
                >
                  <option value="left">$100 (Left)</option>
                  <option value="right">100$ (Right)</option>
                  <option value="left_space">$ 100 (Left with Space)</option>
                  <option value="right_space">100 $ (Right with Space)</option>
                </Select>
              </FormField>

              <FormField
                id="currency_decimals"
                label={__('Decimal Places', 'Decimal Places')}
                description={__('Number of decimal places to show in prices', 'Number of decimal places to show in prices')}
              >
                <Input
                  id="currency_decimals"
                  type="number"
                  value={formData.currency_decimals}
                  name='currency_decimals'
                      onChange={handleFieldChange}
                  min="0"
                  max="4"
                />
              </FormField>
            </div>
          </div>
        );

      case 'notification':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {__('Email Notifications', 'Email Notifications')}
              </h3>
              <div className="space-y-3">
                {[
                  { id: 'notify_new_booking', label: __('Notify on New Booking', 'Notify on New Booking'), desc: __('Send email when new booking is created', 'Send email when new booking is created') },
                  { id: 'notify_payment', label: __('Notify on Payment', 'Notify on Payment'), desc: __('Send email when payment is received', 'Send email when payment is received') },
                  { id: 'notify_cancellation', label: __('Notify on Cancellation', 'Notify on Cancellation'), desc: __('Send email when booking is cancelled', 'Send email when booking is cancelled') },
                  { id: 'notify_admin', label: __('Notify Admin on All Events', 'Notify Admin on All Events'), desc: __('Admin receives notifications for all booking events', 'Admin receives notifications for all booking events') },
                  { id: 'notify_customer_booking', label: __('Notify Customer on Booking', 'Notify Customer on Booking'), desc: __('Send confirmation email to customer', 'Send confirmation email to customer') },
                  { id: 'notify_customer_payment', label: __('Notify Customer on Payment', 'Notify Customer on Payment'), desc: __('Send payment confirmation to customer', 'Send payment confirmation to customer') },
                ].map((notif) => (
                  <div key={notif.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <input
                      type="checkbox"
                      id={notif.id}
                      checked={formData[notif.id as keyof SettingsData] as boolean}
                      name={notif.id}
                      onChange={handleFieldChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <Label htmlFor={notif.id} className="font-medium cursor-pointer">
                        {notif.label}
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notif.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <SectionDivider title={__('SMS Notifications (Optional)', 'SMS Notifications (Optional)')} />

            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="sms_notifications"
                  checked={formData.sms_notifications}
                  name='sms_notifications'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="sms_notifications" className="font-medium cursor-pointer">
                    {__('Enable SMS Notifications', 'Enable SMS Notifications')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Send SMS notifications for bookings and payments', 'Send SMS notifications for bookings and payments')}
                  </p>
                </div>
              </div>

              {formData.sms_notifications && (
                <>
                  <FormField
                    id="sms_provider"
                    label={__('SMS Provider', 'SMS Provider')}
                    description={__('Select your SMS service provider', 'Select your SMS service provider')}
                  >
                    <Select
                      id="sms_provider"
                      value={formData.sms_provider}
                      name='sms_provider'
                      onChange={handleFieldChange}
                    >
                      <option value="twilio">Twilio</option>
                      <option value="nexmo">Nexmo (Vonage)</option>
                      <option value="aws_sns">AWS SNS</option>
                    </Select>
                  </FormField>

                  <FormField
                    id="sms_api_key"
                    label={__('SMS API Key', 'SMS API Key')}
                    description={__('API key from your SMS provider', 'API key from your SMS provider')}
                  >
                    <Input
                      id="sms_api_key"
                      type="password"
                      value={formData.sms_api_key}
                      name='sms_api_key'
                      onChange={handleFieldChange}
                      placeholder={__('Enter SMS API key', 'Enter SMS API key')}
                    />
                  </FormField>
                </>
              )}
            </div>
          </div>
        );

      case 'integration':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <FormField
                id="google_analytics"
                label={__('Google Analytics ID', 'Google Analytics ID')}
                description={__('Your Google Analytics tracking ID (e.g., UA-XXXXXXXXX-X or G-XXXXXXXXXX)', 'Your Google Analytics tracking ID (e.g., UA-XXXXXXXXX-X or G-XXXXXXXXXX)')}
              >
                <Input
                  id="google_analytics"
                  value={formData.google_analytics}
                  name='google_analytics'
                      onChange={handleFieldChange}
                  placeholder="UA-XXXXXXXXX-X"
                />
              </FormField>

              <FormField
                id="facebook_pixel"
                label={__('Facebook Pixel ID', 'Facebook Pixel ID')}
                description={__('Your Facebook Pixel ID for tracking conversions', 'Your Facebook Pixel ID for tracking conversions')}
              >
                <Input
                  id="facebook_pixel"
                  value={formData.facebook_pixel}
                  name='facebook_pixel'
                      onChange={handleFieldChange}
                  placeholder={__('Enter Facebook Pixel ID', 'Enter Facebook Pixel ID')}
                />
              </FormField>

              <FormField
                id="google_maps_api"
                label={__('Google Maps API Key', 'Google Maps API Key')}
                description={__('API key for displaying maps and location features', 'API key for displaying maps and location features')}
              >
                <Input
                  id="google_maps_api"
                  type="password"
                  value={formData.google_maps_api}
                  name='google_maps_api'
                      onChange={handleFieldChange}
                  placeholder={__('Enter Google Maps API Key', 'Enter Google Maps API Key')}
                />
              </FormField>
            </div>

            <SectionDivider title={__('reCAPTCHA Settings', 'reCAPTCHA Settings')} />

            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="recaptcha_enabled"
                  checked={formData.recaptcha_enabled}
                  name='recaptcha_enabled'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="recaptcha_enabled" className="font-medium cursor-pointer">
                    {__('Enable reCAPTCHA', 'Enable reCAPTCHA')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Protect forms from spam and bots', 'Protect forms from spam and bots')}
                  </p>
                </div>
              </div>

              {formData.recaptcha_enabled && (
                <>
                  <FormField
                    id="recaptcha_site_key"
                    label={__('Site Key', 'Site Key')}
                    description={__('Your reCAPTCHA site key', 'Your reCAPTCHA site key')}
                  >
                    <Input
                      id="recaptcha_site_key"
                      value={formData.recaptcha_site_key}
                      name='recaptcha_site_key'
                      onChange={handleFieldChange}
                      placeholder={__('Enter site key', 'Enter site key')}
                    />
                  </FormField>

                  <FormField
                    id="recaptcha_secret_key"
                    label={__('Secret Key', 'Secret Key')}
                    description={__('Your reCAPTCHA secret key (keep this secure)', 'Your reCAPTCHA secret key (keep this secure)')}
                  >
                    <Input
                      id="recaptcha_secret_key"
                      type="password"
                      value={formData.recaptcha_secret_key}
                      name='recaptcha_secret_key'
                      onChange={handleFieldChange}
                      placeholder={__('Enter secret key', 'Enter secret key')}
                    />
                  </FormField>
                </>
              )}
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="debug_mode"
                  checked={formData.debug_mode}
                  name='debug_mode'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="debug_mode" className="font-medium cursor-pointer">
                    {__('Enable Debug Mode', 'Enable Debug Mode')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Show detailed error messages (disable in production)', 'Show detailed error messages (disable in production)')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="enable_logging"
                  checked={formData.enable_logging}
                  name='enable_logging'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="enable_logging" className="font-medium cursor-pointer">
                    {__('Enable Logging', 'Enable Logging')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Log system events and errors for troubleshooting', 'Log system events and errors for troubleshooting')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="cache_enabled"
                  checked={formData.cache_enabled}
                  name='cache_enabled'
                      onChange={handleFieldChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="cache_enabled" className="font-medium cursor-pointer">
                    {__('Enable Cache', 'Enable Cache')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {__('Cache data to improve performance', 'Cache data to improve performance')}
                  </p>
                </div>
              </div>

              <FormField
                id="api_key"
                label={__('API Key', 'API Key')}
                description={__('API key for external integrations and webhooks', 'API key for external integrations and webhooks')}
              >
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  name='api_key'
                      onChange={handleFieldChange}
                  placeholder={__('Enter API Key', 'Enter API Key')}
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="api_rate_limit"
                  label={__('API Rate Limit', 'API Rate Limit')}
                  description={__('Maximum API requests per hour', 'Maximum API requests per hour')}
                >
                  <Input
                    id="api_rate_limit"
                    type="number"
                    value={formData.api_rate_limit}
                    name='api_rate_limit'
                      onChange={handleFieldChange}
                    min="1"
                  />
                </FormField>

                <FormField
                  id="session_timeout"
                  label={__('Session Timeout (seconds)', 'Session Timeout (seconds)')}
                  description={__('User session timeout in seconds', 'User session timeout in seconds')}
                >
                  <Input
                    id="session_timeout"
                    type="number"
                    value={formData.session_timeout}
                    name='session_timeout'
                      onChange={handleFieldChange}
                    min="60"
                  />
                </FormField>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {__('Settings section coming soon', 'Settings section coming soon')}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Left Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1 p-2">
                  {[...Array(12)].map((_, index) => (
                    <div
                      key={`skeleton-nav-${index}`}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md"
                    >
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Skeleton */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-4">
                {/* Form Fields Skeleton */}
                {[...Array(6)].map((_, index) => (
                  <div key={`skeleton-field-${index}`} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                ))}
                {/* Grid fields skeleton */}
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={`skeleton-grid-${index}`} className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  ))}
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
        title={__('Settings', 'Settings')}
        description={__('Configure your travel booking plugin settings', 'Configure your travel booking plugin settings')}
        actions={
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {__('Saving...', 'Saving...')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {__('Save Settings', 'Save Settings')}
              </>
            )}
          </Button>
        }
      />

      <ConditionalRender capability="manage_yatra">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1 p-2">
                  {settingsSections.map((section) => {
                    const Icon = section.icon;
                    const isViewing = viewingSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setViewingSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                          isViewing
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {section.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {(() => {
                    const section = settingsSections.find(s => s.id === viewingSection);
                    const Icon = section?.icon || SettingsIcon;
                    return (
                      <>
                        <Icon className="w-4 h-4" />
                        {section?.label || __('Settings', 'Settings')}
                      </>
                    );
                  })()}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {renderSettingsContent()}
              </CardContent>
              <CardFooter className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700/50">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !formData}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {__('Saving...', 'Saving...')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {__('Save Settings', 'Save Settings')}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </ConditionalRender>
    </div>
  );
};

export default Settings;
