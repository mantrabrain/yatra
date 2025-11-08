/**
 * Item Form Page (Item Subtype)
 * Add/Edit Item form
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { HelpText } from '../components/ui/help-text';
import { Alert } from '../components/ui/alert';

interface ItemFormData {
  name: string;
  slug: string;
  description: string;
  type_id: string;
  status: string;
}

const ItemForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    slug: '',
    description: '',
    type_id: '',
    status: 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action') || 'create';
  }, []);

  const itemId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  const isEditMode = action === 'edit' && itemId !== null;

  // Fetch item types
  const { data: typesData } = useQuery({
    queryKey: ['item-types-simple'],
    queryFn: async () => {
      return [
        { id: 1, name: 'Activity', icon: 'activity' },
        { id: 2, name: 'Meal', icon: 'utensils' },
        { id: 3, name: 'Accommodation', icon: 'hotel' },
        { id: 4, name: 'Transportation', icon: 'bus' },
        { id: 5, name: 'Rest', icon: 'moon' },
      ];
    },
  });

  const { data: itemData, isLoading: isLoadingItem } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      if (!itemId) return null;
      return {
        id: itemId,
        name: 'Hiking',
        slug: 'hiking',
        description: 'Mountain hiking',
        type_id: 1,
        status: 'active',
      };
    },
    enabled: isEditMode && can('yatra_view_trips'),
  });

  useEffect(() => {
    if (itemData && isEditMode) {
      setFormData({
        name: itemData.name || '',
        slug: itemData.slug || '',
        description: itemData.description || '',
        type_id: itemData.type_id?.toString() || '',
        status: itemData.status || 'active',
      });
    }
  }, [itemData, isEditMode]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value),
    }));
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleFieldChange = (field: keyof ItemFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = __('Name is required', 'Name is required');
    }

    if (!formData.slug.trim()) {
      newErrors.slug = __('Slug is required', 'Slug is required');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = __('Slug can only contain lowercase letters, numbers, and hyphens', 'Slug can only contain lowercase letters, numbers, and hyphens');
    }

    if (!formData.type_id) {
      newErrors.type_id = __('Item type is required', 'Item type is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      const payload = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        type_id: parseInt(data.type_id),
        status: data.status,
      };

      if (isEditMode && itemId) {
        console.log('Updating item:', itemId, payload);
        return { success: true, id: itemId };
      } else {
        console.log('Creating item:', payload);
        return { success: true, id: Math.floor(Math.random() * 1000) };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=items`;
    },
    onError: (error: any) => {
      const errorMessage = error?.message || __('An error occurred while saving', 'An error occurred while saving');
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
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=itinerary&tab=items`;
  };

  if (isEditMode && isLoadingItem) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{__('Loading...', 'Loading...')}</span>
      </div>
    );
  }

  const types = typesData || [];

  return (
    <div className="space-y-3">
      <PageHeader
        title={isEditMode ? __('Edit Item', 'Edit Item') : __('Add New Item', 'Add New Item')}
        description={isEditMode ? __('Update item information', 'Update item information') : __('Create a specific item under an item type. Examples: Hiking (under Activity), Lunch (under Meal).', 'Create a specific item under an item type. Examples: Hiking (under Activity), Lunch (under Meal).')}
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
            <div className="lg:col-span-2 space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Basic Information', 'Basic Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="type_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Item Type', 'Item Type')} <span className="text-red-500">*</span>
                    </label>
                    <HelpText 
                      text={__('Select the item type this item belongs to. Examples: Activity, Meal, Accommodation.', 'Select the item type this item belongs to. Examples: Activity, Meal, Accommodation.')}
                      className="mb-2"
                    />
                    <Select
                      id="type_id"
                      value={formData.type_id}
                      onChange={(e) => handleFieldChange('type_id', e.target.value)}
                      className={errors.type_id ? 'border-red-500' : ''}
                      required
                    >
                      <option value="">{__('Select a type...', 'Select a type...')}</option>
                      {types.map((type: any) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </Select>
                    {errors.type_id && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.type_id}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Item Name', 'Item Name')} <span className="text-red-500">*</span>
                    </label>
                    <HelpText 
                      text={__('Enter the specific item name. Examples: Hiking, Lunch, Bus, Hotel.', 'Enter the specific item name. Examples: Hiking, Lunch, Bus, Hotel.')}
                      className="mb-2"
                    />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={__('e.g., Hiking', 'e.g., Hiking')}
                      className={errors.name ? 'border-red-500' : ''}
                      required
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('URL Slug', 'URL Slug')} <span className="text-red-500">*</span>
                    </label>
                    <HelpText 
                      text={__('URL-friendly version. Automatically generated but can be edited.', 'URL-friendly version. Automatically generated but can be edited.')}
                      className="mb-2"
                    />
                    <Input
                      id="slug"
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleFieldChange('slug', e.target.value)}
                      placeholder={__('hiking', 'hiking')}
                      className={errors.slug ? 'border-red-500' : ''}
                      required
                    />
                    {errors.slug && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.slug}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Description', 'Description')}
                    </label>
                    <HelpText 
                      text={__('Brief description of what this item represents.', 'Brief description of what this item represents.')}
                      className="mb-2"
                    />
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder={__('Describe this item...', 'Describe this item...')}
                      rows={4}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{__('Status', 'Status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__('Item Status', 'Item Status')}
                    </label>
                    <HelpText 
                      text={__('Active items can be used in itineraries. Inactive items are hidden.', 'Active items can be used in itineraries. Inactive items are hidden.')}
                      className="mb-2"
                    />
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                    >
                      <option value="active">{__('Active', 'Active')}</option>
                      <option value="inactive">{__('Inactive', 'Inactive')}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {errors.submit && (
                      <Alert variant="error" title={__('Error', 'Error')}>
                        {errors.submit}
                      </Alert>
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
                            {isEditMode ? __('Update Item', 'Update Item') : __('Create Item', 'Create Item')}
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

export default ItemForm;

