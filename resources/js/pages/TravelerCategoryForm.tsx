import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { HelpText } from '../components/ui/help-text';
import { useNavigate } from '../hooks/useNavigate';

interface TravelerCategoryFormData {
  label: string;
  description: string;
  age_min: string;
  age_max: string;
  status: 'active' | 'inactive';
}

const TravelerCategoryForm: React.FC = () => {
  const { can } = usePermissions();
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action') || 'create';
  const categoryId = urlParams.get('id') ? parseInt(urlParams.get('id')!) : null;
  const isEditMode = action === 'edit' && categoryId !== null;

  const [formData, setFormData] = useState<TravelerCategoryFormData>({
    label: '',
    description: '',
    age_min: '',
    age_max: '',
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch category data if editing
  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['traveler-category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: categoryId,
        label: 'Adult',
        description: 'Standard adult pricing for travelers aged 18 and above',
        age_min: '18',
        age_max: '',
        status: 'active' as const,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };
    },
    enabled: isEditMode && !!categoryId,
  });

  // Load category data into form
  useEffect(() => {
    if (categoryData && isEditMode) {
      setFormData({
        label: categoryData.label || '',
        description: categoryData.description || '',
        age_min: categoryData.age_min?.toString() || '',
        age_max: categoryData.age_max?.toString() || '',
        status: categoryData.status || 'active',
      });
    }
  }, [categoryData, isEditMode]);

  const saveMutation = useMutation({
    mutationFn: async (data: TravelerCategoryFormData) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saving category:', isEditMode ? { id: categoryId, ...data } : data);
      return { success: true, id: categoryId || Math.floor(Math.random() * 1000) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traveler-categories'] });
      navigate({ subpage: 'traveler-categories' });
    },
  });

  const handleFieldChange = (field: keyof TravelerCategoryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = __('Label is required', 'Label is required');
    }

    if (!formData.description.trim()) {
      newErrors.description = __('Description is required', 'Description is required');
    }

    // Validate age range
    if (formData.age_min && isNaN(parseInt(formData.age_min))) {
      newErrors.age_min = __('Minimum age must be a valid number', 'Minimum age must be a valid number');
    }
    if (formData.age_max && isNaN(parseInt(formData.age_max))) {
      newErrors.age_max = __('Maximum age must be a valid number', 'Maximum age must be a valid number');
    }
    if (formData.age_min && formData.age_max && parseInt(formData.age_min) >= parseInt(formData.age_max)) {
      newErrors.age_max = __('Maximum age must be greater than minimum age', 'Maximum age must be greater than minimum age');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      saveMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    navigate({ subpage: 'traveler-categories' });
  };

  const canSave = isEditMode ? can('yatra_edit_traveler_categories') : can('yatra_create_traveler_categories');

  if (isLoadingCategory) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={isEditMode ? __('Edit Category', 'Edit Category') : __('Add Category', 'Add Category')}
        description={
          isEditMode
            ? __('Update traveler category information', 'Update traveler category information')
            : __('Create a new traveler category for pricing', 'Create a new traveler category for pricing')
        }
        actions={
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {__('Back', 'Back')}
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{__('Category Information', 'Category Information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Label */}
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {__('Category Label', 'Category Label')} <span className="text-red-500">*</span>
              </label>
              <HelpText
                text={__('The name of this traveler category (e.g., Adult, Child, Senior, Student)', 'The name of this traveler category (e.g., Adult, Child, Senior, Student)')}
                className="mb-2"
              />
              <Input
                id="label"
                type="text"
                value={formData.label}
                onChange={(e) => handleFieldChange('label', e.target.value)}
                placeholder={__('e.g., Adult', 'e.g., Adult')}
                className={errors.label ? 'border-red-500' : ''}
                required
              />
              {errors.label && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.label}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {__('Description', 'Description')} <span className="text-red-500">*</span>
              </label>
              <HelpText
                text={__('A brief description of this category and who it applies to', 'A brief description of this category and who it applies to')}
                className="mb-2"
              />
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder={__('e.g., Standard adult pricing for travelers aged 18 and above', 'e.g., Standard adult pricing for travelers aged 18 and above')}
                rows={3}
                className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none ${errors.description ? 'border-red-500' : ''}`}
                required
              />
              {errors.description && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {__('Age Range', 'Age Range')}
              </label>
              <HelpText
                text={__('Specify the age range for this category (e.g., 0-4 for Infant, 5-17 for Child, 18+ for Adult). Leave empty if no age restriction.', 'Specify the age range for this category (e.g., 0-4 for Infant, 5-17 for Child, 18+ for Adult). Leave empty if no age restriction.')}
                className="mb-2"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="age_min" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {__('Minimum Age', 'Minimum Age')}
                  </label>
                  <Input
                    id="age_min"
                    type="number"
                    min="0"
                    value={formData.age_min}
                    onChange={(e) => handleFieldChange('age_min', e.target.value)}
                    placeholder={__('e.g., 0, 5, 18', 'e.g., 0, 5, 18')}
                    className={errors.age_min ? 'border-red-500' : ''}
                  />
                  {errors.age_min && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.age_min}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="age_max" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {__('Maximum Age', 'Maximum Age')}
                  </label>
                  <Input
                    id="age_max"
                    type="number"
                    min="0"
                    value={formData.age_max}
                    onChange={(e) => handleFieldChange('age_max', e.target.value)}
                    placeholder={__('e.g., 4, 17, leave empty for 18+', 'e.g., 4, 17, leave empty for 18+')}
                    className={errors.age_max ? 'border-red-500' : ''}
                  />
                  {errors.age_max && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.age_max}
                    </p>
                  )}
                </div>
              </div>
              {formData.age_min && formData.age_max && parseInt(formData.age_min) >= parseInt(formData.age_max) && (
                <p className="mt-1.5 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {__('Minimum age should be less than maximum age', 'Minimum age should be less than maximum age')}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {__('Status', 'Status')}
              </label>
              <HelpText
                text={__('Inactive categories will not be available when creating trips', 'Inactive categories will not be available when creating trips')}
                className="mb-2"
              />
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value as 'active' | 'inactive')}
              >
                <option value="active">{__('Active', 'Active')}</option>
                <option value="inactive">{__('Inactive', 'Inactive')}</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saveMutation.isPending}
          >
            {__('Cancel', 'Cancel')}
          </Button>
          {canSave && (
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {__('Saving...', 'Saving...')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? __('Update Category', 'Update Category') : __('Create Category', 'Create Category')}
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TravelerCategoryForm;

