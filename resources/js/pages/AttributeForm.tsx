/**
 * Attribute Form Page
 * Add/Edit Attribute form with clean, minimal SaaS-style design matching ActivityForm
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Edit2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { useToast } from '../components/ui/toast';
import { generateSlug } from '../lib/slug';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Switch } from '../components/ui/switch';
import { IconPicker } from '../components/ui/icon-picker';

interface AttributeFormData {
  name: string;
  slug: string;
  description: string;
  icon: {
    type: 'icon' | 'image';
    value: string;
  } | null;
  field_type: string;
  field_options: string;
  default_value: string;
  placeholder: string;
  required: boolean;
  validation_rules: string;
  display_order: number;
  show_on_frontend: boolean;
  show_in_filters: boolean;
  filter_type: string;
  searchable: boolean;
  status: string;
}

const AttributeForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<AttributeFormData>({
    name: '',
    slug: '',
    description: '',
    icon: null,
    field_type: 'text_field',
    field_options: '',
    default_value: '',
    placeholder: '',
    required: false,
    validation_rules: '',
    display_order: 0,
    show_on_frontend: true,
    show_in_filters: false,
    filter_type: 'dropdown',
    searchable: false,
    status: 'publish'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugEditable, setIsSlugEditable] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const attributeId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }, []);

  const isEditMode = action === 'edit' && attributeId;

  const fieldTypeOptions = [
    { value: 'text_field', label: 'Text Field' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'file', label: 'File Upload' }
  ];


  // Handle field changes
  const handleFieldChange = (field: keyof AttributeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name only in ADD mode (not in EDIT mode)
    // In EDIT mode, slug only changes if user explicitly edits it
    if (field === 'name' && !isEditMode && !isSlugEditable) {
      setFormData(prev => ({ 
        ...prev, 
        name: value,
        slug: generateSlug(value)
      }));
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Generate unique slug with numeric suffix if needed
  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    try {
      // Check if base slug exists
      const response = await apiClient.get(`/attributes/check-slug?slug=${encodeURIComponent(baseSlug)}${isEditMode && attributeId ? `&exclude_id=${attributeId}` : ''}`);
      
      if (response.data.exists && response.data.suggested_slug) {
        return response.data.suggested_slug;
      }
      
      return baseSlug;
    } catch (error) {
      // If API fails, fallback to client-side generation
      let slug = baseSlug;
      let counter = 1;
      
      while (counter <= 100) { // Prevent infinite loop
        const testSlug = counter === 1 ? baseSlug : `${baseSlug}-${counter}`;
        
        // For now, just return the testSlug (in a real implementation, you'd check against existing slugs)
        // This is a fallback when the API is unavailable
        if (counter === 1) {
          return testSlug; // Return base slug on first attempt
        }
        
        slug = testSlug;
        counter++;
      }
      
      return slug;
    }
  };

  // Toggle slug editability
  const toggleSlugEdit = () => {
    if (isSlugEditable) {
      // If disabling edit, regenerate slug from name
      const newSlug = generateSlug(formData.name);
      setFormData(prev => ({ ...prev, slug: newSlug }));
    }
    setIsSlugEditable(!isSlugEditable);
  };

  // Validate field options JSON format
  const validateFieldOptions = (options: string): boolean => {
    if (!options.trim()) return true; // Empty is allowed for non-select fields
    
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) && parsed.every(item => 
        typeof item === 'object' && 
        typeof item.label === 'string' && 
        typeof item.value === 'string'
      );
    } catch {
      return false;
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = __('Name is required', 'Name is required');
    }

    if (!formData.field_type) {
      newErrors.field_type = __('Field type is required', 'Field type is required');
    }

    // Validate field options for select/radio/checkbox
    if ((formData.field_type === 'select' || formData.field_type === 'radio' || formData.field_type === 'checkbox')) {
      if (!formData.field_options.trim()) {
        newErrors.field_options = __('Field options are required for this field type', 'Field options are required for this field type');
      } else if (!validateFieldOptions(formData.field_options)) {
        newErrors.field_options = __('Invalid JSON format. Use: [{"label": "Name", "value": "value"}]', 'Invalid JSON format. Use: [{"label": "Name", "value": "value"}]');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Load attribute data for editing
  const { data: attribute, isLoading: isLoadingAttribute, error: attributeError } = useQuery({
    queryKey: ['attribute', attributeId],
    queryFn: async () => {
      if (!attributeId) return null;
      const response = await apiClient.get(`/attributes/${attributeId}`);
      return response;
    },
    enabled: Boolean(isEditMode),
    retry: 2,
    retryDelay: 1000,
  });

  // Direct database query to bypass caching issues (fallback only)
  const fetchDirectDatabaseValues = async (attributeId: number) => {
    try {
      const response = await fetch(`${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin-ajax.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'yatra_get_attribute_direct',
          attribute_id: attributeId.toString(),
          nonce: window.yatraAdmin?.nonce || ''
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
    } catch (error) {
      console.warn('Direct database query failed', { error, attributeId });
    }
    return null;
  };

  useEffect(() => {
    if (attribute) {
      // Debug: Log the raw attribute data from API
      console.log('AttributeForm - Raw attribute data from API:', attribute);
      
      // Try direct database query as fallback for caching issues
      fetchDirectDatabaseValues(Number(attributeId) || 0).then(directData => {
        const finalAttribute = directData || attribute;
        
        // Debug: Log the final attribute data being used
        console.log('AttributeForm - Final attribute data:', finalAttribute);
        
        const convertedData = {
          name: finalAttribute.name || '',
          slug: finalAttribute.slug || '',
          description: finalAttribute.description || '',
          icon: finalAttribute.icon ? {
            type: finalAttribute.icon.type || 'icon',
            value: finalAttribute.icon.value || ''
          } : null,
          field_type: finalAttribute.field_type || 'text_field',
          field_options: finalAttribute.field_options || '',
          default_value: finalAttribute.default_value || '',
          placeholder: finalAttribute.placeholder || '',
          required: finalAttribute.required === '1' || finalAttribute.required === 1 || finalAttribute.required === true,
          validation_rules: finalAttribute.validation_rules || '',
          display_order: Number(finalAttribute.display_order) || 0,
          show_on_frontend: finalAttribute.show_on_frontend === '1' || finalAttribute.show_on_frontend === 1 || finalAttribute.show_on_frontend === true,
          show_in_filters: finalAttribute.show_in_filters === '1' || finalAttribute.show_in_filters === 1 || finalAttribute.show_in_filters === true,
          filter_type: finalAttribute.filter_type || 'text',
          searchable: finalAttribute.searchable === '1' || finalAttribute.searchable === 1 || finalAttribute.searchable === true,
          status: finalAttribute.status || 'draft'
        };
        
        // Debug: Log the converted data being set to form
        console.log('AttributeForm - Converted data for form:', convertedData);
        
        setFormData(convertedData);
      });
    }
  }, [attribute, isEditMode, attributeId]);

  // Handle attribute loading error
  useEffect(() => {
    if (attributeError) {
      showToast(__('Failed to load attribute data', 'Failed to load attribute data'), 'error');
    }
  }, [attributeError, showToast]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: AttributeFormData) => {
      let slug = data.slug.trim();
      
      // For new attributes, ensure slug is unique
      if (!isEditMode) {
        slug = await generateUniqueSlug(slug);
      }
      
      const payload: any = {
        name: data.name.trim(),
        slug: slug,
        description: data.description.trim(),
        icon: data.icon,
        field_type: data.field_type,
        field_options: data.field_options.trim(),
        default_value: data.default_value.trim(),
        placeholder: data.placeholder.trim(),
        required: Boolean(data.required),
        validation_rules: data.validation_rules.trim(),
        display_order: Number(data.display_order),
        show_on_frontend: Boolean(data.show_on_frontend),
        show_in_filters: Boolean(data.show_in_filters),
        filter_type: data.filter_type,
        searchable: Boolean(data.searchable),
        status: data.status,
      };

      // Debug: Log the payload being sent
      console.log('AttributeForm - Payload being sent:', payload);

      // If slug was manually edited, add flag to preserve it
      if (isEditMode && isSlugEditable) {
        payload.preserve_slug = true;
      }

      try {
        if (isEditMode && attributeId) {
          const response = await apiClient.put(`/attributes/${attributeId}`, payload);
          console.log('AttributeForm - Update response:', response);
          return response;
        } else {
          const response = await apiClient.post('/attributes', payload);
          console.log('AttributeForm - Create response:', response);
          return response;
        }
      } catch (error: any) {
        // Handle specific API errors
        if (error?.response?.status === 409) {
          throw new Error(__('Attribute slug already exists', 'Attribute slug already exists'));
        } else if (error?.response?.status === 422) {
          const validationErrors = error?.response?.data?.errors;
          if (validationErrors) {
            throw new Error(__('Validation failed: ') + Object.values(validationErrors).join(', '));
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
      queryClient.invalidateQueries({ queryKey: ['attribute', attributeId] });
      showToast(
        isEditMode 
          ? __('Attribute updated successfully', 'Attribute updated successfully')
          : __('Attribute created successfully', 'Attribute created successfully'),
        'success'
      );
      // Redirect to attributes list after a short delay
      setTimeout(() => {
        window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes`;
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving the attribute', 'An error occurred while saving the attribute');
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
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=trips&tab=attributes`;
  };

  // Show loading skeleton
  if (isLoadingAttribute) {
    return (
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-3">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if attribute loading failed
  if (attributeError && isEditMode) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__('Error Loading Attribute', 'Error Loading Attribute')}
          description={__('Unable to load attribute data. Please try again.', 'Unable to load attribute data. Please try again.')}
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
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              {__('Failed to load attribute data. The attribute may not exist or there might be a server error.', 'Failed to load attribute data. The attribute may not exist or there might be a server error.')}
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              {__('Try Again', 'Try Again')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Attribute', 'Edit Attribute') : __('Add New Attribute', 'Add New Attribute')}
        description={isEditMode ? __('Update attribute information', 'Update attribute information') : __('Create a new trip attribute', 'Create a new trip attribute')}
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

      <ConditionalRender capability="yatra_edit_trips">
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
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Name', 'Name')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder={__('Enter attribute name', 'Enter attribute name')}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  {/* Slug */}
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Slug', 'Slug')}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => handleFieldChange('slug', e.target.value)}
                        placeholder={__('attribute-slug', 'attribute-slug')}
                        disabled={!isSlugEditable}
                        className={`flex-1 ${errors.slug ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleSlugEdit}
                        className="px-3 py-2"
                      >
                        {isSlugEditable ? (
                          <Save className="w-4 h-4" />
                        ) : (
                          <Edit2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {isSlugEditable ? (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {__('Click the save icon to preserve your custom slug.', 'Click the save icon to preserve your custom slug.')}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {__('Auto-generated from name. Click edit icon to customize.', 'Auto-generated from name. Click edit icon to customize.')}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Description', 'Description')}
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder={__('Enter attribute description', 'Enter attribute description')}
                      rows={6}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Field Configuration */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Field Configuration', 'Field Configuration')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Field Type */}
                    <div>
                      <label htmlFor="field_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Field Type', 'Field Type')} <span className="text-red-500">*</span>
                      </label>
                      <Select
                        id="field_type"
                        value={formData.field_type}
                        onChange={(e) => handleFieldChange('field_type', e.target.value)}
                        className={errors.field_type ? 'border-red-500' : ''}
                      >
                        {fieldTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      {errors.field_type && (
                        <p className="mt-1 text-sm text-red-500">{errors.field_type}</p>
                      )}
                    </div>

                    {/* Display Order */}
                    <div>
                      <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Display Order', 'Display Order')}
                      </label>
                      <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => handleFieldChange('display_order', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Field Options for select/radio/checkbox */}
                  {(formData.field_type === 'select' || formData.field_type === 'radio' || formData.field_type === 'checkbox') && (
                    <div>
                      <label htmlFor="field_options" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__('Field Options', 'Field Options')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="field_options"
                        value={formData.field_options}
                        onChange={(e) => handleFieldChange('field_options', e.target.value)}
                        placeholder='[{"label": "Option 1", "value": "option1"}]'
                        className={errors.field_options ? 'border-red-500' : ''}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {__('Format: [{"label": "Display Name", "value": "value"}]', 'Format: [{"label": "Display Name", "value": "value"}]')}
                      </p>
                      {errors.field_options && (
                        <p className="mt-1 text-sm text-red-500">{errors.field_options}</p>
                      )}
                    </div>
                  )}

                  {/* Default Value */}
                  <div>
                    <label htmlFor="default_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Default Value', 'Default Value')}
                    </label>
                    <Input
                      id="default_value"
                      value={formData.default_value}
                      onChange={(e) => handleFieldChange('default_value', e.target.value)}
                      placeholder={__('Default value for the field', 'Default value for the field')}
                    />
                  </div>

                  {/* Placeholder */}
                  <div>
                    <label htmlFor="placeholder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Placeholder', 'Placeholder')}
                    </label>
                    <Input
                      id="placeholder"
                      value={formData.placeholder}
                      onChange={(e) => handleFieldChange('placeholder', e.target.value)}
                      placeholder={__('Placeholder text for input field', 'Placeholder text for input field')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Icon/Image Picker */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Attribute Icon', 'Attribute Icon')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <IconPicker
                    value={formData.icon}
                    onChange={(value) => handleFieldChange('icon', value)}
                    label={__('Icon or Image', 'Icon or Image')}
                    helpText={__('Select an icon from the library or upload a custom image for this attribute.', 'Select an icon from the library or upload a custom image for this attribute.')}
                    allowImageUpload={true}
                    allowIconSelection={true}
                    size="md"
                  />
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Status', 'Status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Status', 'Status')}
                    </label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                    >
                      <option value="draft">{__('Draft', 'Draft')}</option>
                      <option value="publish">{__('Publish', 'Publish')}</option>
                      <option value="trash">{__('Trash', 'Trash')}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Field Options */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Field Options', 'Field Options')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="show_on_frontend" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      {__('Show on Frontend', 'Show on Frontend')}
                    </label>
                    <Switch
                      checked={formData.show_on_frontend}
                      onCheckedChange={(checked) => handleFieldChange('show_on_frontend', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="show_in_filters" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      {__('Show in Filters', 'Show in Filters')}
                    </label>
                    <Switch
                      checked={formData.show_in_filters}
                      onCheckedChange={(checked) => handleFieldChange('show_in_filters', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="searchable" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      {__('Searchable', 'Searchable')}
                    </label>
                    <Switch
                      checked={formData.searchable}
                      onCheckedChange={(checked) => handleFieldChange('searchable', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="required" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      {__('Required Field', 'Required Field')}
                    </label>
                    <Switch
                      checked={formData.required}
                      onCheckedChange={(checked) => handleFieldChange('required', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Actions */}
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
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
                            {isEditMode ? __('Update Attribute', 'Update Attribute') : __('Create Attribute', 'Create Attribute')}
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

export default AttributeForm;
