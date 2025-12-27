/**
 * Customer Form Page
 * Add/Edit Customer form with dynamic data from API
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { apiService } from '../lib/api-client';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Skeleton } from '../components/ui/skeleton';

interface CustomerFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  secondary_phone: string;
  country: string;
  city: string;
  state: string;
  address: string;
  postal_code: string;
  nationality: string;
  date_of_birth: string;
  gender: string;
  passport_number: string;
  passport_expiry: string;
  emergency_name: string;
  emergency_phone: string;
  emergency_relationship: string;
  dietary_requirements: string;
  medical_conditions: string;
  special_needs: string;
  newsletter_optin: boolean;
  marketing_optin: boolean;
  status: string;
  notes: string;
  loyalty_tier: string;
  loyalty_points: number;
}

const CustomerForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();

  const baseAdminUrl = (window as any).yatraAdmin?.adminUrl || '';
  const [formData, setFormData] = useState<CustomerFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    secondary_phone: '',
    country: '',
    city: '',
    state: '',
    address: '',
    postal_code: '',
    nationality: '',
    date_of_birth: '',
    gender: '',
    passport_number: '',
    passport_expiry: '',
    emergency_name: '',
    emergency_phone: '',
    emergency_relationship: '',
    dietary_requirements: '',
    medical_conditions: '',
    special_needs: '',
    newsletter_optin: false,
    marketing_optin: false,
    status: 'active',
    notes: '',
    loyalty_tier: 'bronze',
    loyalty_points: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const customerId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && customerId !== null;

  // Fetch customer data if editing
  const { data: customerData, isLoading: isLoadingCustomer } = useQuery<{ data?: any } | CustomerFormData | null>({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const response = await apiService.getCustomer(customerId);

      const emergency = (response as any).emergency_contact || {};

      return {
        first_name: response.first_name || '',
        last_name: response.last_name || '',
        email: response.email || '',
        phone: response.phone || '',
        secondary_phone: response.secondary_phone || '',
        country: response.country || '',
        city: response.city || '',
        state: response.state || '',
        address: response.address || '',
        postal_code: response.postal_code || '',
        nationality: response.nationality || '',
        date_of_birth: response.date_of_birth || '',
        gender: response.gender || '',
        passport_number: response.passport_number || '',
        passport_expiry: response.passport_expiry || '',
        emergency_name: (response as any).emergency_name || emergency.name || '',
        emergency_phone: (response as any).emergency_phone || emergency.phone || '',
        emergency_relationship: (response as any).emergency_relationship || emergency.relationship || '',
        dietary_requirements: response.dietary_requirements || '',
        medical_conditions: response.medical_conditions || '',
        special_needs: response.special_needs || '',
        newsletter_optin: Boolean(response.newsletter_optin),
        marketing_optin: Boolean(response.marketing_optin),
        status: response.status || 'active',
        notes: response.notes || '',
        loyalty_tier: response.loyalty_tier || 'bronze',
        loyalty_points: typeof response.loyalty_points === 'number' ? response.loyalty_points : parseInt(response.loyalty_points || '0', 10) || 0,
      } as CustomerFormData;
    },
    enabled: isEditMode && can('yatra_view_bookings'),
  });

  // Load customer data into form when editing
  useEffect(() => {
    if (customerData && isEditMode) {
      setFormData(customerData as CustomerFormData);
    }
  }, [customerData, isEditMode]);

  const handleFieldChange = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = __('First name is required', 'First name is required');
    }

    if (!formData.email.trim()) {
      newErrors.email = __('Email is required', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = __('Invalid email address', 'Invalid email address');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const payload = { ...data };

      if (isEditMode && customerId) {
        return await apiService.updateCustomer(customerId, payload);
      } else {
        // For creation, we need a different approach since CustomerController
        // doesn't have a create endpoint yet - customers are created during booking
        // For now, return error for create
        throw new Error('Creating customers directly is not supported. Customers are created when bookings are made.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      setIsSubmitting(false);
      showToast(__('Customer updated successfully', 'Customer updated successfully'), 'success');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the customer', 'An error occurred while saving the customer');
      setErrors({ submit: errorMessage });
      setIsSubmitting(false);
      showToast(errorMessage, 'error');
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
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=customers`;
  };

  // Skeleton loader
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2 space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (isEditMode && isLoadingCustomer) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__('Edit Customer', 'Edit Customer')}
          description={__('Loading...', 'Loading...')}
          actions={
            <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {__('Back', 'Back')}
            </Button>
          }
        />
        {renderSkeleton()}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Customer', 'Edit Customer') : __('Add New Customer', 'Add New Customer')}
        description={isEditMode ? __('Update customer information', 'Update customer information') : __('Create a new customer profile', 'Create a new customer profile')}
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
              {/* Personal Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Personal Information', 'Personal Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* First Name */}
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('First Name', 'First Name')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => handleFieldChange('first_name', e.target.value)}
                        placeholder={__('Enter first name', 'Enter first name')}
                        className={errors.first_name ? 'border-red-500' : ''}
                        required
                      />
                      {errors.first_name && (
                        <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Last Name', 'Last Name')}
                      </label>
                      <Input
                        id="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => handleFieldChange('last_name', e.target.value)}
                        placeholder={__('Enter last name', 'Enter last name')}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Email Address', 'Email Address')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder={__('customer@example.com', 'customer@example.com')}
                      className={errors.email ? 'border-red-500' : ''}
                      required
                      disabled={isEditMode} // Can't change email
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone Numbers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Phone Number', 'Phone Number')}
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder={__('+1234567890', '+1234567890')}
                      />
                    </div>
                    <div>
                      <label htmlFor="secondary_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Secondary Phone', 'Secondary Phone')}
                      </label>
                      <Input
                        id="secondary_phone"
                        type="tel"
                        value={formData.secondary_phone}
                        onChange={(e) => handleFieldChange('secondary_phone', e.target.value)}
                        placeholder={__('+1234567890', '+1234567890')}
                      />
                    </div>
                  </div>

                  {/* Date of Birth & Gender */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Date of Birth', 'Date of Birth')}
                      </label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Gender', 'Gender')}
                      </label>
                      <Select
                        id="gender"
                        value={formData.gender}
                        onChange={(e) => handleFieldChange('gender', e.target.value)}
                      >
                        <option value="">{__('Select gender', 'Select gender')}</option>
                        <option value="male">{__('Male', 'Male')}</option>
                        <option value="female">{__('Female', 'Female')}</option>
                        <option value="other">{__('Other', 'Other')}</option>
                        <option value="prefer_not_to_say">{__('Prefer not to say', 'Prefer not to say')}</option>
                      </Select>
                    </div>
                  </div>

                  {/* Nationality */}
                  <div>
                    <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Nationality', 'Nationality')}
                    </label>
                    <Input
                      id="nationality"
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => handleFieldChange('nationality', e.target.value)}
                      placeholder={__('Enter nationality', 'Enter nationality')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Address Information', 'Address Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Address */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Street Address', 'Street Address')}
                    </label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      placeholder={__('Enter street address', 'Enter street address')}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* City */}
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('City', 'City')}
                      </label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        placeholder={__('Enter city', 'Enter city')}
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('State/Province', 'State/Province')}
                      </label>
                      <Input
                        id="state"
                        type="text"
                        value={formData.state}
                        onChange={(e) => handleFieldChange('state', e.target.value)}
                        placeholder={__('Enter state', 'Enter state')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Country */}
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Country', 'Country')}
                      </label>
                      <Input
                        id="country"
                        type="text"
                        value={formData.country}
                        onChange={(e) => handleFieldChange('country', e.target.value)}
                        placeholder={__('Enter country', 'Enter country')}
                      />
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Postal Code', 'Postal Code')}
                      </label>
                      <Input
                        id="postal_code"
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => handleFieldChange('postal_code', e.target.value)}
                        placeholder={__('Enter postal code', 'Enter postal code')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Passport Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Passport Information', 'Passport Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="passport_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Passport Number', 'Passport Number')}
                      </label>
                      <Input
                        id="passport_number"
                        type="text"
                        value={formData.passport_number}
                        onChange={(e) => handleFieldChange('passport_number', e.target.value)}
                        placeholder={__('Enter passport number', 'Enter passport number')}
                      />
                    </div>
                    <div>
                      <label htmlFor="passport_expiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Passport Expiry', 'Passport Expiry')}
                      </label>
                      <Input
                        id="passport_expiry"
                        type="date"
                        value={formData.passport_expiry}
                        onChange={(e) => handleFieldChange('passport_expiry', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Emergency Contact', 'Emergency Contact')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="emergency_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Contact Name', 'Contact Name')}
                      </label>
                      <Input
                        id="emergency_name"
                        type="text"
                        value={formData.emergency_name}
                        onChange={(e) => handleFieldChange('emergency_name', e.target.value)}
                        placeholder={__('Full name', 'Full name')}
                      />
                    </div>
                    <div>
                      <label htmlFor="emergency_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Contact Phone', 'Contact Phone')}
                      </label>
                      <Input
                        id="emergency_phone"
                        type="tel"
                        value={formData.emergency_phone}
                        onChange={(e) => handleFieldChange('emergency_phone', e.target.value)}
                        placeholder={__('+1234567890', '+1234567890')}
                      />
                    </div>
                    <div>
                      <label htmlFor="emergency_relationship" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Relationship', 'Relationship')}
                      </label>
                      <Input
                        id="emergency_relationship"
                        type="text"
                        value={formData.emergency_relationship}
                        onChange={(e) => handleFieldChange('emergency_relationship', e.target.value)}
                        placeholder={__('e.g., Spouse, Parent', 'e.g., Spouse, Parent')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Special Requirements */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Special Requirements', 'Special Requirements')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="dietary_requirements" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Dietary Requirements', 'Dietary Requirements')}
                    </label>
                    <Input
                      id="dietary_requirements"
                      type="text"
                      value={formData.dietary_requirements}
                      onChange={(e) => handleFieldChange('dietary_requirements', e.target.value)}
                      placeholder={__('e.g., Vegetarian, Gluten-free', 'e.g., Vegetarian, Gluten-free')}
                    />
                  </div>
                  <div>
                    <label htmlFor="medical_conditions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Medical Conditions', 'Medical Conditions')}
                    </label>
                    <textarea
                      id="medical_conditions"
                      value={formData.medical_conditions}
                      onChange={(e) => handleFieldChange('medical_conditions', e.target.value)}
                      placeholder={__('Any relevant medical conditions', 'Any relevant medical conditions')}
                      rows={2}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="special_needs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Special Needs', 'Special Needs')}
                    </label>
                    <textarea
                      id="special_needs"
                      value={formData.special_needs}
                      onChange={(e) => handleFieldChange('special_needs', e.target.value)}
                      placeholder={__('Any special accommodations needed', 'Any special accommodations needed')}
                      rows={2}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Internal Notes', 'Internal Notes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder={__('Enter any internal notes about this customer (not visible to customer)', 'Enter any internal notes about this customer (not visible to customer)')}
                    rows={4}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Status', 'Status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Customer Status', 'Customer Status')}
                    </label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                    >
                      <option value="active">{__('Active', 'Active')}</option>
                      <option value="inactive">{__('Inactive', 'Inactive')}</option>
                      <option value="blocked">{__('Blocked', 'Blocked')}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Loyalty */}
              {isEditMode && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{__('Loyalty', 'Loyalty')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label htmlFor="loyalty_tier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Loyalty Tier', 'Loyalty Tier')}
                      </label>
                      <Select
                        id="loyalty_tier"
                        value={formData.loyalty_tier}
                        onChange={(e) => handleFieldChange('loyalty_tier', e.target.value)}
                      >
                        <option value="bronze">{__('🥉 Bronze', '🥉 Bronze')}</option>
                        <option value="silver">{__('🥈 Silver', '🥈 Silver')}</option>
                        <option value="gold">{__('🥇 Gold', '🥇 Gold')}</option>
                        <option value="platinum">{__('💎 Platinum', '💎 Platinum')}</option>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="loyalty_points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Loyalty Points', 'Loyalty Points')}
                      </label>
                      <Input
                        id="loyalty_points"
                        type="number"
                        min={0}
                        value={formData.loyalty_points}
                        onChange={(e) => handleFieldChange('loyalty_points', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Preferences */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Preferences', 'Preferences')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.newsletter_optin}
                      onChange={(e) => handleFieldChange('newsletter_optin', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {__('Subscribe to newsletter', 'Subscribe to newsletter')}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.marketing_optin}
                      onChange={(e) => handleFieldChange('marketing_optin', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {__('Receive marketing emails', 'Receive marketing emails')}
                    </span>
                  </label>
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
                            {isEditMode ? __('Update Customer', 'Update Customer') : __('Create Customer', 'Create Customer')}
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

export default CustomerForm;
