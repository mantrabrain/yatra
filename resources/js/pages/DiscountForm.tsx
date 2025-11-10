/**
 * Discount Form Page
 * Add/Edit Discount Coupon form
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { HelpText } from '../components/ui/help-text';

interface DiscountFormData {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  amount: string;
  max_discount_amount: string; // Maximum discount cap for percentage discounts
  usage_limit: string; // Total usage limit
  usage_limit_per_customer: string; // Usage limit per customer
  valid_from: string; // Start date
  expiry_date: string; // End date
  status: 'draft' | 'publish' | 'trash';
  applicable_to: 'all' | 'specific_trips';
  trip_ids: number[];
  min_amount: string; // Minimum booking amount
  first_time_customer_only: boolean; // Only for first-time customers
  is_group_discount: boolean;
  min_group_size: string;
  group_discount_type: 'percentage' | 'fixed';
  group_discount_amount: string;
}

const DiscountForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<DiscountFormData>({
    code: '',
    description: '',
    type: 'percentage',
    amount: '',
    max_discount_amount: '',
    usage_limit: '0',
    usage_limit_per_customer: '0',
    valid_from: '',
    expiry_date: '',
    status: 'draft',
    applicable_to: 'all',
    trip_ids: [],
    min_amount: '',
    first_time_customer_only: false,
    is_group_discount: false,
    min_group_size: '',
    group_discount_type: 'percentage',
    group_discount_amount: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const discountId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const duplicateId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('duplicate') ? parseInt(params.get('duplicate') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && discountId !== null;
  const isDuplicateMode = action === 'create' && duplicateId !== null;

  // Fetch discount data if editing or duplicating
  const { data: discountData, isLoading: isLoadingDiscount } = useQuery({
    queryKey: ['discount', discountId || duplicateId],
    queryFn: async () => {
      const id = discountId || duplicateId;
      if (!id) return null;
      try {
        const response = await apiClient.get(`/discounts/${id}`);
        return response;
      } catch (error: any) {
        showToast(error?.message || __('Failed to load discount', 'Failed to load discount'), 'error');
        throw error;
      }
    },
    enabled: (isEditMode || isDuplicateMode) && can('yatra_view_bookings'),
  });

  // Load discount data into form when editing or duplicating
  useEffect(() => {
    if (discountData && (isEditMode || isDuplicateMode)) {
      setFormData({
        code: isDuplicateMode ? `${discountData.code}_COPY` : discountData.code || '',
        description: discountData.description || '',
        type: (discountData.type || 'percentage') as 'percentage' | 'fixed',
        amount: discountData.amount?.toString() || '',
        max_discount_amount: discountData.max_discount_amount?.toString() || '',
        usage_limit: discountData.usage_limit?.toString() || '0',
        usage_limit_per_customer: discountData.usage_limit_per_customer?.toString() || '0',
        valid_from: discountData.valid_from || '',
        expiry_date: discountData.expiry_date || '',
        status: (isDuplicateMode ? 'draft' : (discountData.status || 'draft')) as 'draft' | 'publish' | 'trash',
        applicable_to: (discountData.applicable_to || 'all') as 'all' | 'specific_trips',
        trip_ids: discountData.trip_ids || [],
        min_amount: discountData.min_amount?.toString() || '',
        first_time_customer_only: discountData.first_time_customer_only || false,
        is_group_discount: discountData.is_group_discount || false,
        min_group_size: discountData.min_group_size?.toString() || '',
        group_discount_type: (discountData.group_discount_type || 'percentage') as 'percentage' | 'fixed',
        group_discount_amount: discountData.group_discount_amount?.toString() || '',
      });
    }
  }, [discountData, isEditMode, isDuplicateMode]);

  const handleFieldChange = (field: keyof DiscountFormData, value: string | number[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = __('Coupon code is required', 'Coupon code is required');
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = __('Coupon code can only contain uppercase letters, numbers, hyphens, and underscores', 'Coupon code can only contain uppercase letters, numbers, hyphens, and underscores');
    }

    if (!formData.amount.trim()) {
      newErrors.amount = __('Discount amount is required', 'Discount amount is required');
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = __('Discount amount must be a positive number', 'Discount amount must be a positive number');
      } else if (formData.type === 'percentage' && amount > 100) {
        newErrors.amount = __('Percentage discount cannot exceed 100%', 'Percentage discount cannot exceed 100%');
      }
    }

    // Maximum discount amount validation (for percentage discounts)
    if (formData.type === 'percentage' && formData.max_discount_amount && formData.max_discount_amount.trim()) {
      const maxAmount = parseFloat(formData.max_discount_amount);
      if (isNaN(maxAmount) || maxAmount <= 0) {
        newErrors.max_discount_amount = __('Maximum discount amount must be a positive number', 'Maximum discount amount must be a positive number');
      }
    }

    if (formData.usage_limit && formData.usage_limit !== '0') {
      const limit = parseInt(formData.usage_limit);
      if (isNaN(limit) || limit < 0) {
        newErrors.usage_limit = __('Usage limit must be a positive number or 0 for unlimited', 'Usage limit must be a positive number or 0 for unlimited');
      }
    }

    if (formData.usage_limit_per_customer && formData.usage_limit_per_customer !== '0') {
      const limit = parseInt(formData.usage_limit_per_customer);
      if (isNaN(limit) || limit < 0) {
        newErrors.usage_limit_per_customer = __('Per-customer usage limit must be a positive number or 0 for unlimited', 'Per-customer usage limit must be a positive number or 0 for unlimited');
      }
    }

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (formData.valid_from) {
      const validFrom = new Date(formData.valid_from);
      if (validFrom < today) {
        newErrors.valid_from = __('Valid from date cannot be in the past', 'Valid from date cannot be in the past');
      }
    }

    if (formData.expiry_date) {
      const expiryDate = new Date(formData.expiry_date);
      if (expiryDate < today) {
        newErrors.expiry_date = __('Expiry date cannot be in the past', 'Expiry date cannot be in the past');
      }
    }

    // Check if expiry date is after valid from date
    if (formData.valid_from && formData.expiry_date) {
      const validFrom = new Date(formData.valid_from);
      const expiryDate = new Date(formData.expiry_date);
      if (expiryDate < validFrom) {
        newErrors.expiry_date = __('Expiry date must be after the valid from date', 'Expiry date must be after the valid from date');
      }
    }

    if (formData.min_amount && formData.min_amount.trim()) {
      const minAmount = parseFloat(formData.min_amount);
      if (isNaN(minAmount) || minAmount < 0) {
        newErrors.min_amount = __('Minimum amount must be a positive number', 'Minimum amount must be a positive number');
      }
    }

    // Group discount validation
    if (formData.is_group_discount) {
      if (!formData.min_group_size.trim()) {
        newErrors.min_group_size = __('Minimum group size is required for group discounts', 'Minimum group size is required for group discounts');
      } else {
        const groupSize = parseInt(formData.min_group_size);
        if (isNaN(groupSize) || groupSize < 2) {
          newErrors.min_group_size = __('Minimum group size must be at least 2', 'Minimum group size must be at least 2');
        }
      }

      if (!formData.group_discount_amount.trim()) {
        newErrors.group_discount_amount = __('Group discount amount is required', 'Group discount amount is required');
      } else {
        const groupAmount = parseFloat(formData.group_discount_amount);
        if (isNaN(groupAmount) || groupAmount <= 0) {
          newErrors.group_discount_amount = __('Group discount amount must be a positive number', 'Group discount amount must be a positive number');
        } else if (formData.group_discount_type === 'percentage' && groupAmount > 100) {
          newErrors.group_discount_amount = __('Group discount percentage cannot exceed 100%', 'Group discount percentage cannot exceed 100%');
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: DiscountFormData) => {
      const payload: any = {
        code: data.code.trim().toUpperCase(),
        description: data.description.trim(),
        type: data.type,
        amount: parseFloat(data.amount),
        max_discount_amount: data.max_discount_amount ? parseFloat(data.max_discount_amount) : null,
        usage_limit: parseInt(data.usage_limit) || 0,
        usage_limit_per_customer: parseInt(data.usage_limit_per_customer) || 0,
        valid_from: data.valid_from || null,
        expiry_date: data.expiry_date || null,
        status: data.status,
        applicable_to: data.applicable_to,
        trip_ids: data.applicable_to === 'specific_trips' ? data.trip_ids : [],
        min_amount: data.min_amount ? parseFloat(data.min_amount) : null,
        first_time_customer_only: data.first_time_customer_only,
        is_group_discount: data.is_group_discount,
        min_group_size: data.is_group_discount && data.min_group_size ? parseInt(data.min_group_size) : null,
        group_discount_type: data.is_group_discount ? data.group_discount_type : null,
        group_discount_amount: data.is_group_discount && data.group_discount_amount ? parseFloat(data.group_discount_amount) : null,
      };

      if (isEditMode && discountId) {
        return await apiClient.put(`/discounts/${discountId}`, payload);
      } else {
        return await apiClient.post('/discounts', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      queryClient.invalidateQueries({ queryKey: ['discount', discountId || duplicateId] });
      showToast(
        isEditMode 
          ? __('Discount updated successfully', 'Discount updated successfully')
          : __('Discount created successfully', 'Discount created successfully'),
        'success'
      );
      setTimeout(() => {
        window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=discounts`;
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the discount', 'An error occurred while saving the discount');
      showToast(errorMessage, 'error');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await saveMutation.mutateAsync(formData);
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=discounts`;
  };

  if (isLoadingDiscount) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Discount Coupon', 'Edit Discount Coupon') : __('Add New Discount Coupon', 'Add New Discount Coupon')}
        description={isEditMode ? __('Update discount coupon details', 'Update discount coupon details') : __('Create a new discount coupon for your trips', 'Create a new discount coupon for your trips')}
        actions={
          <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {__('Back', 'Back')}
          </Button>
        }
      />

      <ConditionalRender capability="yatra_edit_bookings">
        {/* Discount Information Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {__('How Discounts Work', 'How Discounts Work')}
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
                  <li>• <strong>{__('Regular Discount', 'Regular Discount')}:</strong> {__('Applied first to the booking total (trip price × travelers)', 'Applied first to the booking total (trip price × travelers)')}</li>
                  <li>• <strong>{__('Group Discount', 'Group Discount')}:</strong> {__('Additional discount applied AFTER regular discount when group size requirement is met', 'Additional discount applied AFTER regular discount when group size requirement is met')}</li>
                  <li>• <strong>{__('Maximum Cap', 'Maximum Cap')}:</strong> {__('For percentage discounts, you can set a maximum dollar amount to cap the discount', 'For percentage discounts, you can set a maximum dollar amount to cap the discount')}</li>
                  <li>• <strong>{__('Example', 'Example')}:</strong> {__('$1000 booking, 15% regular discount ($150 off), then 10% group discount on $850 = $85 more off. Final: $765', '$1000 booking, 15% regular discount ($150 off), then 10% group discount on $850 = $85 more off. Final: $765')}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Form Fields */}
            <div className="lg:col-span-2 space-y-3">
              {/* Basic Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Basic Information', 'Basic Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Coupon Code */}
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Coupon Code', 'Coupon Code')} <span className="text-red-500">*</span>
                    </label>
                    <HelpText 
                      text={__('Enter a unique coupon code. Only uppercase letters, numbers, hyphens, and underscores are allowed.', 'Enter a unique coupon code. Only uppercase letters, numbers, hyphens, and underscores are allowed.')}
                      className="mb-2"
                    />
                    <Input
                      id="code"
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                      placeholder={__('e.g., SUMMER2024', 'e.g., SUMMER2024')}
                      className={errors.code ? 'border-red-500' : ''}
                      required
                    />
                    {errors.code && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.code}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Description', 'Description')}
                    </label>
                    <HelpText 
                      text={__('Optional description for this discount coupon. This helps you identify the purpose of the coupon.', 'Optional description for this discount coupon. This helps you identify the purpose of the coupon.')}
                      className="mb-2"
                    />
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder={__('e.g., Summer discount for all trips', 'e.g., Summer discount for all trips')}
                      rows={3}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>

                  {/* Discount Type and Amount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Discount Type */}
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Discount Type', 'Discount Type')} <span className="text-red-500">*</span>
                      </label>
                      <Select
                        id="type"
                        value={formData.type}
                        onChange={(e) => handleFieldChange('type', e.target.value as 'percentage' | 'fixed')}
                        className={errors.type ? 'border-red-500' : ''}
                        required
                      >
                        <option value="percentage">{__('Percentage', 'Percentage')}</option>
                        <option value="fixed">{__('Fixed Amount', 'Fixed Amount')}</option>
                      </Select>
                      {errors.type && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.type}
                        </p>
                      )}
                    </div>

                    {/* Discount Amount */}
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Discount Amount', 'Discount Amount')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        {formData.type === 'percentage' ? (
                          <Input
                            id="amount"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => handleFieldChange('amount', e.target.value)}
                            placeholder={__('e.g., 15', 'e.g., 15')}
                            className={errors.amount ? 'border-red-500' : ''}
                            required
                          />
                        ) : (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <Input
                              id="amount"
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.amount}
                              onChange={(e) => handleFieldChange('amount', e.target.value)}
                              placeholder={__('e.g., 50', 'e.g., 50')}
                              className={`pl-7 ${errors.amount ? 'border-red-500' : ''}`}
                              required
                            />
                          </div>
                        )}
                        {formData.type === 'percentage' && (
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                        )}
                      </div>
                      {errors.amount && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.amount}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Maximum Discount Amount (for percentage discounts) */}
                  {formData.type === 'percentage' && (
                    <div>
                      <label htmlFor="max_discount_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Maximum Discount Amount', 'Maximum Discount Amount')}
                      </label>
                      <HelpText 
                        text={__('Optional maximum discount cap. For example, if discount is 20% with max $500, a $5000 booking gets $500 off (not $1000).', 'Optional maximum discount cap. For example, if discount is 20% with max $500, a $5000 booking gets $500 off (not $1000).')}
                        className="mb-2"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <Input
                          id="max_discount_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.max_discount_amount}
                          onChange={(e) => handleFieldChange('max_discount_amount', e.target.value)}
                          placeholder={__('e.g., 500 (optional)', 'e.g., 500 (optional)')}
                          className={`pl-7 ${errors.max_discount_amount ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.max_discount_amount && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.max_discount_amount}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Usage & Restrictions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Usage & Restrictions', 'Usage & Restrictions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Usage Limit (Total) */}
                  <div>
                    <label htmlFor="usage_limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Total Usage Limit', 'Total Usage Limit')}
                    </label>
                    <HelpText 
                      text={__('Maximum number of times this coupon can be used across all customers. Enter 0 for unlimited usage.', 'Maximum number of times this coupon can be used across all customers. Enter 0 for unlimited usage.')}
                      className="mb-2"
                    />
                    <Input
                      id="usage_limit"
                      type="number"
                      min="0"
                      value={formData.usage_limit}
                      onChange={(e) => handleFieldChange('usage_limit', e.target.value)}
                      placeholder={__('0 for unlimited', '0 for unlimited')}
                      className={errors.usage_limit ? 'border-red-500' : ''}
                    />
                    {errors.usage_limit && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.usage_limit}
                      </p>
                    )}
                  </div>

                  {/* Usage Limit Per Customer */}
                  <div>
                    <label htmlFor="usage_limit_per_customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Usage Limit Per Customer', 'Usage Limit Per Customer')}
                    </label>
                    <HelpText 
                      text={__('Maximum number of times a single customer can use this coupon. Enter 0 for unlimited usage per customer.', 'Maximum number of times a single customer can use this coupon. Enter 0 for unlimited usage per customer.')}
                      className="mb-2"
                    />
                    <Input
                      id="usage_limit_per_customer"
                      type="number"
                      min="0"
                      value={formData.usage_limit_per_customer}
                      onChange={(e) => handleFieldChange('usage_limit_per_customer', e.target.value)}
                      placeholder={__('0 for unlimited', '0 for unlimited')}
                      className={errors.usage_limit_per_customer ? 'border-red-500' : ''}
                    />
                    {errors.usage_limit_per_customer && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.usage_limit_per_customer}
                      </p>
                    )}
                  </div>

                  {/* First-Time Customer Only */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.first_time_customer_only}
                        onChange={(e) => handleFieldChange('first_time_customer_only', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {__('First-Time Customers Only', 'First-Time Customers Only')}
                      </span>
                    </label>
                    <HelpText 
                      text={__('If enabled, only customers who have never made a booking before can use this coupon.', 'If enabled, only customers who have never made a booking before can use this coupon.')}
                      className="mb-2 mt-1"
                    />
                  </div>

                  {/* Minimum Amount */}
                  <div>
                    <label htmlFor="min_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Minimum Booking Amount', 'Minimum Booking Amount')}
                    </label>
                    <HelpText 
                      text={__('Minimum total booking amount required to use this coupon. This applies to the total booking value (trip price × number of travelers).', 'Minimum total booking amount required to use this coupon. This applies to the total booking value (trip price × number of travelers).')}
                      className="mb-2"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <Input
                        id="min_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.min_amount}
                        onChange={(e) => handleFieldChange('min_amount', e.target.value)}
                        placeholder={__('e.g., 100', 'e.g., 100')}
                        className={`pl-7 ${errors.min_amount ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.min_amount && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.min_amount}
                      </p>
                    )}
                  </div>

                  {/* Valid From Date */}
                  <div>
                    <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Valid From Date', 'Valid From Date')}
                    </label>
                    <HelpText 
                      text={__('Date when this coupon becomes active. Leave empty to activate immediately.', 'Date when this coupon becomes active. Leave empty to activate immediately.')}
                      className="mb-2"
                    />
                    <Input
                      id="valid_from"
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => handleFieldChange('valid_from', e.target.value)}
                      className={errors.valid_from ? 'border-red-500' : ''}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.valid_from && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.valid_from}
                      </p>
                    )}
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Expiry Date', 'Expiry Date')}
                    </label>
                    <HelpText 
                      text={__('Date when this coupon expires. Leave empty for no expiry. Must be after the valid from date.', 'Date when this coupon expires. Leave empty for no expiry. Must be after the valid from date.')}
                      className="mb-2"
                    />
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => handleFieldChange('expiry_date', e.target.value)}
                      className={errors.expiry_date ? 'border-red-500' : ''}
                      min={formData.valid_from || new Date().toISOString().split('T')[0]}
                    />
                    {errors.expiry_date && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.expiry_date}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Group Discount */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Group Discount', 'Group Discount')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Enable Group Discount */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_group_discount}
                        onChange={(e) => handleFieldChange('is_group_discount', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {__('Enable Group Discount', 'Enable Group Discount')}
                      </span>
                    </label>
                    <HelpText 
                      text={__('Enable additional discount for group bookings. The group discount is applied AFTER the regular discount. For example: Regular 15% off, then additional 10% group discount on the discounted price.', 'Enable additional discount for group bookings. The group discount is applied AFTER the regular discount. For example: Regular 15% off, then additional 10% group discount on the discounted price.')}
                      className="mb-2 mt-1"
                    />
                  </div>

                  {formData.is_group_discount && (
                    <>
                      {/* Minimum Group Size */}
                      <div>
                        <label htmlFor="min_group_size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {__('Minimum Group Size', 'Minimum Group Size')} <span className="text-red-500">*</span>
                        </label>
                        <HelpText 
                          text={__('Minimum number of participants required to qualify for the group discount.', 'Minimum number of participants required to qualify for the group discount.')}
                          className="mb-2"
                        />
                        <Input
                          id="min_group_size"
                          type="number"
                          min="2"
                          value={formData.min_group_size}
                          onChange={(e) => handleFieldChange('min_group_size', e.target.value)}
                          placeholder={__('e.g., 5', 'e.g., 5')}
                          className={errors.min_group_size ? 'border-red-500' : ''}
                          required={formData.is_group_discount}
                        />
                        {errors.min_group_size && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <Info className="w-4 h-4" />
                            {errors.min_group_size}
                          </p>
                        )}
                      </div>

                      {/* Group Discount Type and Amount */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Group Discount Type */}
                        <div>
                          <label htmlFor="group_discount_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {__('Group Discount Type', 'Group Discount Type')} <span className="text-red-500">*</span>
                          </label>
                          <Select
                            id="group_discount_type"
                            value={formData.group_discount_type}
                            onChange={(e) => handleFieldChange('group_discount_type', e.target.value as 'percentage' | 'fixed')}
                            className={errors.group_discount_type ? 'border-red-500' : ''}
                            required={formData.is_group_discount}
                          >
                            <option value="percentage">{__('Percentage', 'Percentage')}</option>
                            <option value="fixed">{__('Fixed Amount', 'Fixed Amount')}</option>
                          </Select>
                          {errors.group_discount_type && (
                            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                              <Info className="w-4 h-4" />
                              {errors.group_discount_type}
                            </p>
                          )}
                        </div>

                        {/* Group Discount Amount */}
                        <div>
                          <label htmlFor="group_discount_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {__('Group Discount Amount', 'Group Discount Amount')} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            {formData.group_discount_type === 'percentage' ? (
                              <Input
                                id="group_discount_amount"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.group_discount_amount}
                                onChange={(e) => handleFieldChange('group_discount_amount', e.target.value)}
                                placeholder={__('e.g., 10', 'e.g., 10')}
                                className={errors.group_discount_amount ? 'border-red-500' : ''}
                                required={formData.is_group_discount}
                              />
                            ) : (
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                <Input
                                  id="group_discount_amount"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formData.group_discount_amount}
                                  onChange={(e) => handleFieldChange('group_discount_amount', e.target.value)}
                                  placeholder={__('e.g., 50', 'e.g., 50')}
                                  className={`pl-7 ${errors.group_discount_amount ? 'border-red-500' : ''}`}
                                  required={formData.is_group_discount}
                                />
                              </div>
                            )}
                            {formData.group_discount_type === 'percentage' && (
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                            )}
                          </div>
                          {errors.group_discount_amount && (
                            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                              <Info className="w-4 h-4" />
                              {errors.group_discount_amount}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
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
                  <Select
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value as 'draft' | 'publish' | 'trash')}
                  >
                    <option value="draft">{__('Draft', 'Draft')}</option>
                    <option value="publish">{__('Publish', 'Publish')}</option>
                    <option value="trash">{__('Trash', 'Trash')}</option>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {__('Only published coupons can be used by customers.', 'Only published coupons can be used by customers.')}
                  </p>
                </CardContent>
              </Card>

              {/* Applicable To */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Applicable To', 'Applicable To')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={formData.applicable_to}
                    onChange={(e) => handleFieldChange('applicable_to', e.target.value as 'all' | 'specific_trips')}
                  >
                    <option value="all">{__('All Trips', 'All Trips')}</option>
                    <option value="specific_trips">{__('Specific Trips', 'Specific Trips')}</option>
                  </Select>
                  {formData.applicable_to === 'specific_trips' && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {__('Trip selection will be available in a future update.', 'Trip selection will be available in a future update.')}
                      </p>
                    </div>
                  )}
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
                            {isEditMode ? __('Update Coupon', 'Update Coupon') : __('Create Coupon', 'Create Coupon')}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
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

export default DiscountForm;

