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
  ChevronRight,
  ChevronDown,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ClipboardList,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Edit2,
  Lock
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
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';

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
  | 'booking_form'
  | 'payment'
  | 'email'
  | 'trip'
  | 'customer'
  | 'review'
  | 'tax'
  | 'currency'
  | 'notification'
  | 'integration'
  | 'permalink'
  | 'advanced';

// Form Builder Types
interface FormFieldConfig {
  id: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'country' | 'textarea' | 'checkbox' | 'number';
  label: string;
  placeholder: string;
  required: boolean;
  enabled: boolean;
  order: number;
  width: 'full' | 'half' | 'third';
  section?: string;
  options?: { value: string; label: string }[];
  locked?: boolean; // If true, field cannot be deleted and required cannot be changed
}

interface FormSectionConfig {
  title: string;
  description: string;
  enabled?: boolean;
  fields: FormFieldConfig[];
}

interface BookingFormConfig {
  contact_form: FormSectionConfig;
  emergency_contact_form: FormSectionConfig;
  traveler_form: FormSectionConfig;
}

interface PaymentGatewayConfig {
  enabled: boolean;
  icon?: string;
  title?: string;
  description?: string;
  [key: string]: any;
}

interface GatewayField {
  id: string;
  type: 'text' | 'password' | 'number' | 'checkbox' | 'textarea' | 'select';
  label: string;
  description?: string;
  placeholder?: string;
  default?: any;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  condition?: string;
}

interface GatewayDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  is_offline: boolean;
  supports: string[];
  fields: GatewayField[];
  config: PaymentGatewayConfig;
  enabled: boolean;
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
  gateway_order?: string[];
  
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
  
  // Permalink Settings
  trip_base: string;
  destination_base: string;
  activity_base: string;
  trip_category_base: string;
  booking_base: string;
  
  // Booking Page Settings
  use_booking_page: boolean;
  booking_page_id: number;
  
  // Advanced Settings
  debug_mode: boolean;
  enable_logging: boolean;
  cache_enabled: boolean;
  api_key: string;
  api_rate_limit: number;
  session_timeout: number;
  
  // Booking Form Builder
  booking_form_config: BookingFormConfig;
}

// Form Builder Component
type BookingFormSubTab = 'contact_form' | 'emergency_contact_form' | 'traveler_form';

interface BookingFormBuilderProps {
  formData: SettingsData;
  setFormData: React.Dispatch<React.SetStateAction<SettingsData | null>>;
}

// Get initial sub-tab from localStorage
const getInitialFormSubTab = (): BookingFormSubTab => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('yatra_settings_booking_form_subtab');
    if (saved && ['contact_form', 'emergency_contact_form', 'traveler_form'].includes(saved)) {
      return saved as BookingFormSubTab;
    }
  }
  return 'contact_form';
};

const BookingFormBuilder: React.FC<BookingFormBuilderProps> = ({ formData, setFormData }) => {
  const [activeFormTab, setActiveFormTab] = useState<BookingFormSubTab>(getInitialFormSubTab);
  
  // Save sub-tab to localStorage when it changes
  const handleSubTabChange = (tab: BookingFormSubTab) => {
    setActiveFormTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yatra_settings_booking_form_subtab', tab);
    }
  };
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState<Partial<FormFieldConfig>>({
    id: '',
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    enabled: true,
    width: 'full',
    options: [],
  });
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; fieldId: string | null; fieldLabel: string }>({
    isOpen: false,
    fieldId: null,
    fieldLabel: '',
  });
  
  // Drag and drop state
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null);

  // Helper to generate ID from label
  const generateIdFromLabel = (label: string): string => {
    return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  // Helper to sanitize ID input
  const sanitizeId = (id: string): string => {
    return id.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };
  
  // Handle label change with auto ID generation
  const handleNewFieldLabelChange = (label: string) => {
    const autoId = generateIdFromLabel(label);
    setNewField(prev => ({
      ...prev,
      label,
      // Only auto-generate ID if it hasn't been manually edited
      id: prev.id === '' || prev.id === generateIdFromLabel(prev.label || '') ? autoId : prev.id,
    }));
  };

  const formTabs = [
    { id: 'contact_form' as const, label: __('Contact Form', 'Contact Form'), description: 'Lead traveler contact details' },
    { id: 'emergency_contact_form' as const, label: __('Emergency Contact', 'Emergency Contact'), description: 'Emergency contact information' },
    { id: 'traveler_form' as const, label: __('Traveler Form', 'Traveler Form'), description: 'Individual traveler details' },
  ];

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'country', label: 'Country Selector' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
  ];

  const widthOptions = [
    { value: 'full', label: 'Full Width' },
    { value: 'half', label: 'Half Width' },
    { value: 'third', label: 'One Third' },
  ];

  const getCurrentFormConfig = () => {
    return formData?.booking_form_config?.[activeFormTab] || { title: '', description: '', enabled: true, fields: [] };
  };

  const updateFormConfig = (updates: Partial<FormSectionConfig>) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        booking_form_config: {
          ...prev.booking_form_config,
          [activeFormTab]: {
            ...prev.booking_form_config[activeFormTab],
            ...updates,
          },
        },
      };
    });
  };

  const updateField = (fieldId: string, updates: Partial<FormFieldConfig>) => {
    const currentConfig = getCurrentFormConfig();
    const updatedFields = currentConfig.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    updateFormConfig({ fields: updatedFields });
  };

  const toggleFieldEnabled = (fieldId: string) => {
    const currentConfig = getCurrentFormConfig();
    const field = currentConfig.fields.find(f => f.id === fieldId);
    // Locked fields cannot be disabled
    if (field && !field.locked) {
      updateField(fieldId, { enabled: !field.enabled });
    }
  };

  const toggleFieldRequired = (fieldId: string) => {
    const currentConfig = getCurrentFormConfig();
    const field = currentConfig.fields.find(f => f.id === fieldId);
    if (field) {
      updateField(fieldId, { required: !field.required });
    }
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentConfig = getCurrentFormConfig();
    const fields = [...currentConfig.fields];
    const index = fields.findIndex(f => f.id === fieldId);
    
    if (direction === 'up' && index > 0) {
      [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
    } else if (direction === 'down' && index < fields.length - 1) {
      [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
    }
    
    // Update order values
    fields.forEach((field, i) => {
      field.order = i + 1;
    });
    
    updateFormConfig({ fields });
  };
  
  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedFieldId(fieldId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (fieldId !== draggedFieldId) {
      setDragOverFieldId(fieldId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFieldId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    if (!draggedFieldId || draggedFieldId === targetFieldId) {
      setDraggedFieldId(null);
      setDragOverFieldId(null);
      return;
    }

    const currentConfig = getCurrentFormConfig();
    const fields = [...currentConfig.fields];
    const draggedIndex = fields.findIndex(f => f.id === draggedFieldId);
    const targetIndex = fields.findIndex(f => f.id === targetFieldId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedField] = fields.splice(draggedIndex, 1);
      fields.splice(targetIndex, 0, draggedField);
      
      // Update order values
      fields.forEach((field, i) => {
        field.order = i + 1;
      });
      
      updateFormConfig({ fields });
    }

    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };

  const handleDragEnd = () => {
    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };

  const deleteField = (fieldId: string) => {
    const currentConfig = getCurrentFormConfig();
    const updatedFields = currentConfig.fields.filter(f => f.id !== fieldId);
    updatedFields.forEach((field, i) => {
      field.order = i + 1;
    });
    updateFormConfig({ fields: updatedFields });
    setDeleteConfirm({ isOpen: false, fieldId: null, fieldLabel: '' });
  };

  const addNewField = () => {
    if (!newField.label || !newField.id) return;
    
    const currentConfig = getCurrentFormConfig();
    const fieldId = sanitizeId(newField.id);
    
    // Check if ID already exists
    if (currentConfig.fields.some(f => f.id === fieldId)) {
      alert('A field with this ID already exists. Please use a different ID.');
      return;
    }
    
    const newFieldConfig: FormFieldConfig = {
      id: fieldId,
      type: (newField.type as FormFieldConfig['type']) || 'text',
      label: newField.label || '',
      placeholder: newField.placeholder || '',
      required: newField.required || false,
      enabled: true,
      order: currentConfig.fields.length + 1,
      width: (newField.width as FormFieldConfig['width']) || 'full',
    };
    
    // Add options if field type is select
    if (newField.type === 'select' && newField.options && newField.options.length > 0) {
      newFieldConfig.options = newField.options.filter(opt => opt.value && opt.label);
    }
    
    updateFormConfig({ fields: [...currentConfig.fields, newFieldConfig] });
    setNewField({ id: '', type: 'text', label: '', placeholder: '', required: false, enabled: true, width: 'full', options: [] });
    setShowAddField(false);
  };

  const currentConfig = getCurrentFormConfig();

  return (
    <div className="space-y-6">
      {/* Form Type Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4" aria-label="Form Types">
          {formTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeFormTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Form Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{__('Form Section Settings', 'Form Section Settings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <input
              type="checkbox"
              id="form_section_enabled"
              checked={currentConfig.enabled !== false}
              onChange={(e) => updateFormConfig({ enabled: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="form_section_enabled" className="font-medium cursor-pointer">
              {__('Enable this form section', 'Enable this form section')}
            </Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="form_title">{__('Section Title', 'Section Title')}</Label>
              <Input
                id="form_title"
                value={currentConfig.title || ''}
                onChange={(e) => updateFormConfig({ title: e.target.value })}
                placeholder="Enter section title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="form_description">{__('Section Description', 'Section Description')}</Label>
              <Input
                id="form_description"
                value={currentConfig.description || ''}
                onChange={(e) => updateFormConfig({ description: e.target.value })}
                placeholder="Enter description"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{__('Form Fields', 'Form Fields')}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddField(!showAddField)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {__('Add Field', 'Add Field')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add New Field Form */}
          {showAddField && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
              <h4 className="font-medium text-sm mb-3">{__('Add New Field', 'Add New Field')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs">{__('Field Type', 'Field Type')}</Label>
                  <Select
                    value={newField.type || 'text'}
                    onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value as FormFieldConfig['type'] }))}
                    className="mt-1"
                  >
                    {fieldTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{__('Label', 'Label')} *</Label>
                  <Input
                    value={newField.label || ''}
                    onChange={(e) => handleNewFieldLabelChange(e.target.value)}
                    placeholder="Field label"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">{__('Field ID', 'Field ID')} *</Label>
                  <Input
                    value={newField.id || ''}
                    onChange={(e) => setNewField(prev => ({ ...prev, id: sanitizeId(e.target.value) }))}
                    placeholder="field_id"
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">{__('Lowercase, no spaces', 'Lowercase, no spaces')}</p>
                </div>
                <div>
                  <Label className="text-xs">{__('Placeholder', 'Placeholder')}</Label>
                  <Input
                    value={newField.placeholder || ''}
                    onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                    placeholder="Placeholder text"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">{__('Width', 'Width')}</Label>
                  <Select
                    value={newField.width || 'full'}
                    onChange={(e) => setNewField(prev => ({ ...prev, width: e.target.value as FormFieldConfig['width'] }))}
                    className="mt-1"
                  >
                    {widthOptions.map(w => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </Select>
                </div>
              </div>
              {/* Options editor for select fields */}
              {newField.type === 'select' && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-900">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium">{__('Dropdown Options', 'Dropdown Options')}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentOptions = newField.options || [];
                        setNewField(prev => ({ ...prev, options: [...currentOptions, { value: '', label: '' }] }));
                      }}
                      className="h-6 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {__('Add Option', 'Add Option')}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(newField.options || []).map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <Input
                          value={option.value}
                          onChange={(e) => {
                            const newOptions = [...(newField.options || [])];
                            newOptions[optIndex] = { ...newOptions[optIndex], value: e.target.value };
                            setNewField(prev => ({ ...prev, options: newOptions }));
                          }}
                          placeholder="Value (e.g., option1)"
                          className="text-xs flex-1"
                        />
                        <Input
                          value={option.label}
                          onChange={(e) => {
                            const newOptions = [...(newField.options || [])];
                            newOptions[optIndex] = { ...newOptions[optIndex], label: e.target.value };
                            setNewField(prev => ({ ...prev, options: newOptions }));
                          }}
                          placeholder="Label (e.g., Option 1)"
                          className="text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = (newField.options || []).filter((_, i) => i !== optIndex);
                            setNewField(prev => ({ ...prev, options: newOptions }));
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {(!newField.options || newField.options.length === 0) && (
                      <p className="text-xs text-gray-400 italic">{__('Click "Add Option" to add dropdown choices.', 'No options')}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newField.required || false}
                    onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  {__('Required', 'Required')}
                </label>
                <div className="flex-1"></div>
                <Button variant="ghost" size="sm" onClick={() => setShowAddField(false)}>
                  {__('Cancel', 'Cancel')}
                </Button>
                <Button size="sm" onClick={addNewField} disabled={!newField.label || !newField.id}>
                  {__('Add Field', 'Add Field')}
                </Button>
              </div>
            </div>
          )}

          {/* Field List */}
          {currentConfig.fields?.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>{__('No fields configured. Click "Add Field" to get started.', 'No fields configured.')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentConfig.fields?.map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, field.id)}
                  onDragOver={(e) => handleDragOver(e, field.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, field.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                    draggedFieldId === field.id ? 'opacity-50 border-dashed' : ''
                  } ${
                    dragOverFieldId === field.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                  } ${
                    field.enabled
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60'
                  }`}
                >
                  {/* Drag Handle & Order */}
                  <div className="flex items-center gap-1">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveField(field.id, 'up')}
                        disabled={index === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(field.id, 'down')}
                        disabled={index === currentConfig.fields.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Field Info */}
                  <div className="flex-1 min-w-0">
                    {editingField === field.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2">
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="Label"
                            className="text-sm"
                          />
                          <Input
                            value={field.placeholder}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            placeholder="Placeholder"
                            className="text-sm"
                          />
                          <Select
                            value={field.type}
                            onChange={(e) => updateField(field.id, { type: e.target.value as FormFieldConfig['type'] })}
                            className="text-sm"
                          >
                            {fieldTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </Select>
                          <Select
                            value={field.width}
                            onChange={(e) => updateField(field.id, { width: e.target.value as FormFieldConfig['width'] })}
                            className="text-sm"
                          >
                            {widthOptions.map(w => (
                              <option key={w.value} value={w.value}>{w.label}</option>
                            ))}
                          </Select>
                        </div>
                        
                        {/* Field ID - Below other fields */}
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                          <Label className="text-xs text-gray-500 whitespace-nowrap">{__('Field ID:', 'Field ID:')}</Label>
                          <Input
                            value={field.id}
                            onChange={(e) => {
                              if (!field.locked) {
                                updateField(field.id, { id: sanitizeId(e.target.value) });
                              }
                            }}
                            placeholder="field_id"
                            className="text-sm font-mono flex-1 max-w-xs"
                            disabled={field.locked}
                            title={field.locked ? 'Locked fields cannot change ID' : 'Field ID (lowercase, no spaces)'}
                          />
                          {field.locked && (
                            <span className="text-xs text-amber-600">{__('(locked)', '(locked)')}</span>
                          )}
                        </div>
                        
                        {/* Dropdown Options Editor */}
                        {field.type === 'select' && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs font-medium">{__('Dropdown Options', 'Dropdown Options')}</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newOptions = [...(field.options || []), { value: '', label: '' }];
                                  updateField(field.id, { options: newOptions });
                                }}
                                className="h-6 text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {__('Add Option', 'Add Option')}
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {(field.options || []).map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <Input
                                    value={option.value}
                                    onChange={(e) => {
                                      const newOptions = [...(field.options || [])];
                                      newOptions[optIndex] = { ...newOptions[optIndex], value: e.target.value };
                                      updateField(field.id, { options: newOptions });
                                    }}
                                    placeholder="Value (e.g., spouse)"
                                    className="text-xs flex-1"
                                  />
                                  <Input
                                    value={option.label}
                                    onChange={(e) => {
                                      const newOptions = [...(field.options || [])];
                                      newOptions[optIndex] = { ...newOptions[optIndex], label: e.target.value };
                                      updateField(field.id, { options: newOptions });
                                    }}
                                    placeholder="Label (e.g., Spouse/Partner)"
                                    className="text-xs flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = (field.options || []).filter((_, i) => i !== optIndex);
                                      updateField(field.id, { options: newOptions });
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {(!field.options || field.options.length === 0) && (
                                <p className="text-xs text-gray-400 italic">{__('No options. Click "Add Option" to add dropdown choices.', 'No options')}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-sm">{field.label}</span>
                        <code className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                          {field.id}
                        </code>
                        <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                          {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {widthOptions.find(w => w.value === field.width)?.label || 'Full'}
                        </span>
                        {field.type === 'select' && field.options && field.options.length > 0 && (
                          <span className="text-xs text-blue-500 dark:text-blue-400">
                            ({field.options.length} {field.options.length === 1 ? 'option' : 'options'})
                          </span>
                        )}
                        {field.required && (
                          <span className="text-xs text-red-500 font-medium">Required</span>
                        )}
                        {field.locked && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded" title="This field is protected and cannot be deleted">
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => !field.locked && toggleFieldRequired(field.id)}
                      disabled={field.locked}
                      className={`p-1.5 rounded ${field.locked ? 'cursor-not-allowed opacity-50' : ''} ${field.required ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 hover:text-gray-600'}`}
                      title={field.locked ? 'This field is required and cannot be changed' : (field.required ? 'Make optional' : 'Make required')}
                    >
                      <Star className="w-4 h-4" fill={field.required ? 'currentColor' : 'none'} />
                    </button>
                    {/* Show enable/disable toggle only for non-locked fields */}
                    {!field.locked && (
                      <button
                        type="button"
                        onClick={() => toggleFieldEnabled(field.id)}
                        className={`p-1.5 rounded ${field.enabled ? 'text-green-500' : 'text-gray-400'}`}
                        title={field.enabled ? 'Disable field' : 'Enable field'}
                      >
                        {field.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                      className="p-1.5 rounded text-gray-400 hover:text-blue-500"
                      title="Edit field"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Show delete button only for non-locked fields */}
                    {!field.locked && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ isOpen: true, fieldId: field.id, fieldLabel: field.label })}
                        className="p-1.5 rounded text-gray-400 hover:text-red-500"
                        title="Delete field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, fieldId: null, fieldLabel: '' })}
        onConfirm={() => {
          if (deleteConfirm.fieldId) {
            deleteField(deleteConfirm.fieldId);
          }
        }}
        title={__('Delete Field', 'Delete Field')}
        message={`Are you sure you want to delete the field "${deleteConfirm.fieldLabel}"? This action cannot be undone.`}
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
      />

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{__('Preview', 'Preview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-lg mb-1">{currentConfig.title || 'Form Section'}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{currentConfig.description}</p>
            <div className="grid grid-cols-2 gap-4">
              {currentConfig.fields?.filter(f => f.enabled).map(field => (
                <div
                  key={field.id}
                  className={field.width === 'full' ? 'col-span-2' : field.width === 'third' ? 'col-span-1' : 'col-span-1'}
                >
                  <Label className="text-sm">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === 'select' || field.type === 'country' ? (
                    <Select disabled className="mt-1 w-full">
                      <option>{field.placeholder || 'Select...'}</option>
                    </Select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      disabled
                      placeholder={field.placeholder}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-sm"
                      rows={2}
                    />
                  ) : (
                    <Input
                      disabled
                      type={field.type}
                      placeholder={field.placeholder}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  
  // Get active section from localStorage or default to 'general'
  const getInitialActiveSection = (): SettingsSection => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yatra_settings_active_section');
      if (saved && ['general', 'booking', 'booking_form', 'payment', 'email', 'trip', 'customer', 'review', 'tax', 'currency', 'notification', 'integration', 'permalink', 'advanced'].includes(saved)) {
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
  const [gatewayOrder, setGatewayOrder] = useState<string[]>([]);
  const [draggedGateway, setDraggedGateway] = useState<string | null>(null);

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

  // Fetch payment gateway definitions from server
  const { data: gatewayDefinitions } = useQuery<Record<string, GatewayDefinition>>({
    queryKey: ['payment-gateways-definitions'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/payment/gateways/definitions');
        return response.gateways || {};
      } catch (error: any) {
        console.error('Failed to load gateway definitions:', error);
        return {};
      }
    },
    enabled: can('manage_yatra'),
    staleTime: Infinity,
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
          bank_transfer: {
            enabled: false,
            title: 'Bank Transfer',
            description: 'Accept manual bank transfer payments',
            api_key: '', // Used for bank account name
            api_secret: '', // Used for bank account number
            public_key: '', // Used for bank name
            private_key: '', // Used for routing/SWIFT code
          },
          esewa: {
            enabled: false,
            title: 'eSewa',
            description: 'Accept payments via eSewa (Nepal)',
            api_key: '',
            api_secret: '',
            test_mode: true,
          },
          khalti: {
            enabled: false,
            title: 'Khalti',
            description: 'Accept payments via Khalti (Nepal)',
            api_key: '',
            api_secret: '',
            test_mode: true,
          },
          pay_later: {
            enabled: false,
            title: 'Book Now, Pay Later',
            description: 'Allow customers to reserve now and pay before the trip',
            api_key: '', // Used for payment deadline days
            api_secret: '', // Used for auto-cancel days
          },
        },
        gateway_order: ['pay_later', 'stripe', 'paypal', 'razorpay', 'square', 'authorize_net', 'bank_transfer', 'esewa', 'khalti'],
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
        trip_base: 'trip',
        destination_base: 'destination',
        activity_base: 'activity',
        trip_category_base: 'trip-category',
        booking_base: 'book',
        use_booking_page: false,
        booking_page_id: 0,
        debug_mode: false,
        enable_logging: false,
        cache_enabled: true,
        api_key: '',
        api_rate_limit: 100,
        session_timeout: 3600,
        
        // Booking Form Builder
        booking_form_config: {
          contact_form: {
            title: 'Lead Traveler / Contact Information',
            description: 'Primary contact person for this booking',
            enabled: true,
            fields: [
              { id: 'first_name', type: 'text', label: 'First Name', placeholder: 'Enter first name', required: true, enabled: true, order: 1, width: 'half', locked: true },
              { id: 'last_name', type: 'text', label: 'Last Name', placeholder: 'Enter last name', required: true, enabled: true, order: 2, width: 'half', locked: true },
              { id: 'email', type: 'email', label: 'Email Address', placeholder: 'your@email.com', required: true, enabled: true, order: 3, width: 'half', locked: true },
              { id: 'phone', type: 'tel', label: 'Phone Number', placeholder: '+1 234 567 8900', required: true, enabled: true, order: 4, width: 'half', locked: true },
              { id: 'country', type: 'country', label: 'Country', placeholder: 'Select Country', required: true, enabled: true, order: 5, width: 'half', locked: true },
              { id: 'nationality', type: 'country', label: 'Nationality', placeholder: 'Select Nationality', required: false, enabled: true, order: 6, width: 'half' },
              { id: 'address', type: 'text', label: 'Address', placeholder: 'Street address (optional)', required: false, enabled: true, order: 7, width: 'full' },
            ],
          },
          emergency_contact_form: {
            title: 'Emergency Contact',
            description: 'Person to contact in case of emergency',
            enabled: true,
            fields: [
              { id: 'name', type: 'text', label: 'Contact Name', placeholder: 'Full name', required: true, enabled: true, order: 1, width: 'half' },
              { id: 'phone', type: 'tel', label: 'Contact Phone', placeholder: '+1 234 567 8900', required: true, enabled: true, order: 2, width: 'half' },
              { id: 'relationship', type: 'select', label: 'Relationship', placeholder: 'Select Relationship', required: false, enabled: true, order: 3, width: 'full', options: [
                { value: 'spouse', label: 'Spouse/Partner' },
                { value: 'parent', label: 'Parent' },
                { value: 'sibling', label: 'Sibling' },
                { value: 'child', label: 'Child' },
                { value: 'friend', label: 'Friend' },
                { value: 'other', label: 'Other' },
              ]},
            ],
          },
          traveler_form: {
            title: 'Traveler Information',
            description: 'Please provide details for each traveler',
            enabled: true,
            fields: [
              { id: 'first_name', type: 'text', label: 'First Name', placeholder: 'As in passport', required: true, enabled: true, order: 1, width: 'half' },
              { id: 'last_name', type: 'text', label: 'Last Name', placeholder: 'As in passport', required: true, enabled: true, order: 2, width: 'half' },
              { id: 'date_of_birth', type: 'date', label: 'Date of Birth', placeholder: '', required: true, enabled: true, order: 3, width: 'half' },
              { id: 'gender', type: 'select', label: 'Gender', placeholder: 'Select Gender', required: true, enabled: true, order: 4, width: 'half', options: [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]},
              { id: 'nationality', type: 'country', label: 'Nationality', placeholder: 'Select Nationality', required: true, enabled: true, order: 5, width: 'full' },
              { id: 'passport', type: 'text', label: 'Passport Number', placeholder: 'Enter passport number', required: true, enabled: true, order: 6, width: 'half', section: 'passport' },
              { id: 'passport_expiry', type: 'date', label: 'Passport Expiry', placeholder: '', required: true, enabled: true, order: 7, width: 'half', section: 'passport' },
              { id: 'dietary', type: 'select', label: 'Dietary Requirements', placeholder: 'Select', required: false, enabled: true, order: 8, width: 'half', section: 'dietary_medical', options: [
                { value: 'none', label: 'No special requirements' },
                { value: 'vegetarian', label: 'Vegetarian' },
                { value: 'vegan', label: 'Vegan' },
                { value: 'halal', label: 'Halal' },
                { value: 'kosher', label: 'Kosher' },
                { value: 'gluten_free', label: 'Gluten Free' },
                { value: 'lactose_free', label: 'Lactose Free' },
                { value: 'other', label: 'Other (specify in notes)' },
              ]},
              { id: 'medical', type: 'text', label: 'Medical Conditions / Allergies', placeholder: 'Any allergies or conditions', required: false, enabled: true, order: 9, width: 'half', section: 'dietary_medical' },
            ],
          },
        },
      }), []);

  const [formData, setFormData] = useState<SettingsData | null>(null);
  const isInitializedRef = React.useRef(false);

  // Initialize form data only once - merge API settings with defaults
  React.useEffect(() => {
    if (isInitializedRef.current) return;
    
    if (settings) {
      // Merge settings with defaults, especially for gateway_configs
      const mergedSettings = {
        ...defaultSettings,
        ...settings,
        // Ensure gateway_configs from defaults are merged with any saved configs
        gateway_configs: {
          ...defaultSettings.gateway_configs,
          ...(settings.gateway_configs || {}),
        },
      };
      setFormData(mergedSettings);
      isInitializedRef.current = true;
    } else if (!isLoading && !settings) {
      // Use default settings if API fails or returns empty
      setFormData(defaultSettings);
      isInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, isLoading]);

  // Initialize gateway order when gateway definitions are loaded
  React.useEffect(() => {
    if (gatewayDefinitions && Object.keys(gatewayDefinitions).length > 0 && gatewayOrder.length === 0) {
      // Use saved order if available, otherwise use default order from definitions
      const savedOrder = settings?.gateway_order as string[] | undefined;
      if (savedOrder && Array.isArray(savedOrder) && savedOrder.length > 0) {
        // Merge saved order with any new gateways
        const allGateways = Object.keys(gatewayDefinitions);
        const validSavedOrder = savedOrder.filter(id => allGateways.includes(id));
        const newGateways = allGateways.filter(id => !validSavedOrder.includes(id));
        setGatewayOrder([...validSavedOrder, ...newGateways]);
      } else {
        setGatewayOrder(Object.keys(gatewayDefinitions));
      }
    }
  }, [gatewayDefinitions, settings?.gateway_order, gatewayOrder.length]);

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
    
    // Auto-expand when enabling a gateway
    if (field === 'enabled' && value === true) {
      setExpandedGateways(prev => ({ ...prev, [gateway]: true }));
    }
    // Auto-collapse when disabling a gateway
    if (field === 'enabled' && value === false) {
      setExpandedGateways(prev => ({ ...prev, [gateway]: false }));
    }
  }, []);

  const toggleGatewayExpanded = (gateway: string) => {
    setExpandedGateways(prev => ({ ...prev, [gateway]: !prev[gateway] }));
  };

  // Gateway sorting functions
  const moveGatewayUp = (gatewayId: string) => {
    setGatewayOrder(prev => {
      const index = prev.indexOf(gatewayId);
      if (index <= 0) return prev;
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      // Save order to formData
      setFormData(current => current ? { ...current, gateway_order: newOrder } : current);
      return newOrder;
    });
  };

  const moveGatewayDown = (gatewayId: string) => {
    setGatewayOrder(prev => {
      const index = prev.indexOf(gatewayId);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      // Save order to formData
      setFormData(current => current ? { ...current, gateway_order: newOrder } : current);
      return newOrder;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, gatewayId: string) => {
    setDraggedGateway(gatewayId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetGatewayId: string) => {
    e.preventDefault();
    if (!draggedGateway || draggedGateway === targetGatewayId) {
      setDraggedGateway(null);
      return;
    }

    setGatewayOrder(prev => {
      const dragIndex = prev.indexOf(draggedGateway);
      const dropIndex = prev.indexOf(targetGatewayId);
      if (dragIndex < 0 || dropIndex < 0) return prev;

      const newOrder = [...prev];
      newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, draggedGateway);
      
      // Save order to formData
      setFormData(current => current ? { ...current, gateway_order: newOrder } : current);
      return newOrder;
    });
    setDraggedGateway(null);
  };

  const handleDragEnd = () => {
    setDraggedGateway(null);
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

  // Flush rewrite rules mutation - must be at top level
  const flushRewriteRulesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/settings/flush-rewrite-rules');
      return response;
    },
    onSuccess: () => {
      showToast(__('Rewrite rules flushed successfully', 'Rewrite rules flushed successfully'), 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to flush rewrite rules', 'Failed to flush rewrite rules'), 'error');
    },
  });

  // Fetch WordPress pages for booking page selection (without shortcode check for performance)
  const { data: pagesData } = useQuery({
    queryKey: ['wordpress-pages'],
    queryFn: async () => {
      const response = await apiClient.get('/settings/pages');
      return response as Array<{ id: number; title: string; slug: string; url: string }>;
    },
    enabled: can('manage_yatra') && viewingSection === 'permalink',
  });

  // Check shortcode on-demand when user selects a page
  const checkShortcodeMutation = useMutation({
    mutationFn: async (pageId: number) => {
      const response = await apiClient.get(`/settings/check-shortcode/${pageId}`);
      return response as { has_shortcode: boolean; page_title: string; page_url: string; edit_url: string };
    },
  });

  // Insert shortcode mutation
  const insertShortcodeMutation = useMutation({
    mutationFn: async (pageId: number) => {
      const response = await apiClient.post(`/settings/insert-shortcode/${pageId}`);
      return response;
    },
    onSuccess: () => {
      showToast(__('Shortcode added successfully', 'Shortcode added successfully'), 'success');
      queryClient.invalidateQueries({ queryKey: ['wordpress-pages'] });
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to add shortcode', 'Failed to add shortcode'), 'error');
    },
  });

  // State for shortcode dialog
  const [showShortcodeDialog, setShowShortcodeDialog] = useState(false);
  const [selectedPageForShortcode, setSelectedPageForShortcode] = useState<{ id: number; title: string } | null>(null);
  const [isCheckingShortcode, setIsCheckingShortcode] = useState(false);

  // Handle booking page selection - checks shortcode in real-time
  const handleBookingPageChange = async (pageId: number) => {
    if (pageId === 0) {
      handleFieldChange({ target: { name: 'booking_page_id', value: 0 } } as any);
      handleFieldChange({ target: { name: 'use_booking_page', value: false } } as any);
      return;
    }

    const page = pagesData?.find(p => p.id === pageId);
    if (!page) return;

    // Check shortcode in real-time
    setIsCheckingShortcode(true);
    try {
      const result = await checkShortcodeMutation.mutateAsync(pageId);
      
      if (result.has_shortcode) {
        // Page has shortcode - save directly
        handleFieldChange({ target: { name: 'booking_page_id', value: pageId } } as any);
        handleFieldChange({ target: { name: 'use_booking_page', value: true } } as any);
        showToast(__('Booking page selected successfully', 'Booking page selected successfully'), 'success');
      } else {
        // Page doesn't have shortcode - show dialog
        setSelectedPageForShortcode({ id: pageId, title: page.title });
        setShowShortcodeDialog(true);
      }
    } catch (error: any) {
      showToast(error?.message || __('Failed to check page', 'Failed to check page'), 'error');
    } finally {
      setIsCheckingShortcode(false);
    }
  };

  const handleConfirmInsertShortcode = async () => {
    if (!selectedPageForShortcode) return;
    
    try {
      await insertShortcodeMutation.mutateAsync(selectedPageForShortcode.id);
      handleFieldChange({ target: { name: 'booking_page_id', value: selectedPageForShortcode.id } } as any);
      handleFieldChange({ target: { name: 'use_booking_page', value: true } } as any);
      setShowShortcodeDialog(false);
      setSelectedPageForShortcode(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

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
    { id: 'booking_form' as SettingsSection, label: __('Booking Form', 'Booking Form'), icon: ClipboardList },
    { id: 'payment' as SettingsSection, label: __('Payment', 'Payment'), icon: DollarSign },
    { id: 'email' as SettingsSection, label: __('Email', 'Email'), icon: Mail },
    { id: 'trip' as SettingsSection, label: __('Trip', 'Trip'), icon: MapPin },
    { id: 'customer' as SettingsSection, label: __('Customer', 'Customer'), icon: Users },
    { id: 'review' as SettingsSection, label: __('Review', 'Review'), icon: Star },
    { id: 'tax' as SettingsSection, label: __('Tax', 'Tax'), icon: Receipt },
    { id: 'currency' as SettingsSection, label: __('Currency', 'Currency'), icon: Globe },
    { id: 'notification' as SettingsSection, label: __('Notification', 'Notification'), icon: Bell },
    { id: 'integration' as SettingsSection, label: __('Integration', 'Integration'), icon: Plug },
    { id: 'permalink' as SettingsSection, label: __('Permalink', 'Permalink'), icon: Globe },
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

      case 'booking_form':
        return (
          <BookingFormBuilder
            formData={formData}
            setFormData={setFormData}
          />
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

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              {__('Drag and drop to reorder gateways. Use arrows for precise positioning.', 'Drag and drop to reorder gateways. Use arrows for precise positioning.')}
            </p>

            <div className="space-y-3">
              {/* Dynamic Payment Gateway Rendering from Server - Sorted */}
              {gatewayDefinitions && gatewayOrder
                .filter(id => gatewayDefinitions[id])
                .map((gatewayId, index) => {
                const gateway = gatewayDefinitions[gatewayId];
                const config = formData.gateway_configs?.[gatewayId] || gateway.config || { enabled: false };
                const isExpanded = expandedGateways[gatewayId];
                const isDragging = draggedGateway === gatewayId;
                
                return (
                  <Card 
                    key={gatewayId} 
                    className={`border transition-all ${
                      isDragging 
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 opacity-75' 
                        : config.enabled 
                          ? 'border-green-200 dark:border-green-800' 
                          : 'border-gray-200 dark:border-gray-700'
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, gatewayId)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, gatewayId)}
                    onDragEnd={handleDragEnd}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Drag handle */}
                          <div className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          
                          {/* Sort arrows */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveGatewayUp(gatewayId)}
                              disabled={index === 0}
                              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              title={__('Move up', 'Move up')}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveGatewayDown(gatewayId)}
                              disabled={index === gatewayOrder.length - 1}
                              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              title={__('Move down', 'Move down')}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <input
                            type="checkbox"
                            id={`gateway_enable_${gatewayId}`}
                            checked={config.enabled || false}
                            onChange={(e) => handleGatewayConfigChange(gatewayId, 'enabled', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-2">
                            {gateway.icon && (
                              <img src={gateway.icon} alt={gateway.title} className="w-6 h-6 object-contain" />
                            )}
                            <div>
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                {gateway.title}
                                {config.enabled && (
                                  <span className="text-xs font-normal px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                                    {__('Active', 'Active')}
                                  </span>
                                )}
                              </CardTitle>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{gateway.description}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGatewayExpanded(gatewayId)}
                          className="h-8"
                          disabled={!gateway.fields?.length}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="pt-4 space-y-4 border-t border-gray-100 dark:border-gray-700">
                        {/* Info banner for offline gateways */}
                        {gateway.is_offline && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-4">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {gateway.id === 'pay_later' 
                                ? __('Allow customers to book now and pay later. Payment must be completed before the trip date.', 'Allow customers to book now and pay later. Payment must be completed before the trip date.')
                                : __('This is an offline payment method. Customers will be shown these details after booking.', 'This is an offline payment method. Customers will be shown these details after booking.')
                              }
                            </p>
                          </div>
                        )}
                        
                        {/* Frontend Display Settings */}
                        <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {__('Frontend Display Settings', 'Frontend Display Settings')}
                          </h4>
                          
                          <FormField
                            id={`${gatewayId}_icon`}
                            label={__('Gateway Icon', 'Gateway Icon')}
                            description={__('Icon URL or path displayed on the booking page', 'Icon URL or path displayed on the booking page')}
                          >
                            <div className="flex items-center gap-3">
                              <Input
                                type="text"
                                value={config.icon || gateway.icon || ''}
                                onChange={(e) => handleGatewayConfigChange(gatewayId, 'icon', e.target.value)}
                                placeholder={__('Enter icon URL or leave empty to use default', 'Enter icon URL or leave empty to use default')}
                                className="flex-1"
                              />
                              {config.icon || gateway.icon ? (
                                <img 
                                  src={config.icon || gateway.icon} 
                                  alt={gateway.title} 
                                  className="w-10 h-10 object-contain border border-gray-300 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-800"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : null}
                            </div>
                          </FormField>
                          
                          <FormField
                            id={`${gatewayId}_title`}
                            label={__('Gateway Title', 'Gateway Title')}
                            description={__('Title displayed on the booking page', 'Title displayed on the booking page')}
                          >
                            <Input
                              type="text"
                              value={config.title || gateway.title || ''}
                              onChange={(e) => handleGatewayConfigChange(gatewayId, 'title', e.target.value)}
                              placeholder={gateway.title || __('Enter gateway title', 'Enter gateway title')}
                            />
                          </FormField>
                          
                          <FormField
                            id={`${gatewayId}_description`}
                            label={__('Gateway Description', 'Gateway Description')}
                            description={__('Description displayed below the title on the booking page', 'Description displayed below the title on the booking page')}
                          >
                            <textarea
                              value={config.description || gateway.description || ''}
                              onChange={(e) => handleGatewayConfigChange(gatewayId, 'description', e.target.value)}
                              placeholder={gateway.description || __('Enter gateway description', 'Enter gateway description')}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              rows={2}
                            />
                          </FormField>
                        </div>
                        
                        {/* Dynamic field rendering */}
                        {gateway.fields && gateway.fields.length > 0 && (
                          <div className="space-y-4">
                            {gateway.fields.map((field: GatewayField) => {
                          // Check conditional visibility
                          if (field.condition && !config[field.condition]) {
                            return null;
                          }

                          // Render checkbox fields differently
                          if (field.type === 'checkbox') {
                            return (
                              <div key={field.id} className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                                <input
                                  type="checkbox"
                                  id={`${gatewayId}_${field.id}`}
                                  checked={config[field.id] || false}
                                  onChange={(e) => handleGatewayConfigChange(gatewayId, field.id, e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label htmlFor={`${gatewayId}_${field.id}`} className="font-normal cursor-pointer">
                                  {field.label} {field.description && `- ${field.description}`}
                                </Label>
                              </div>
                            );
                          }

                          // Render textarea
                          if (field.type === 'textarea') {
                            return (
                              <FormField
                                key={field.id}
                                id={`${gatewayId}_${field.id}`}
                                label={field.label}
                                description={field.description}
                              >
                                <textarea
                                  value={config[field.id] || field.default || ''}
                                  onChange={(e) => handleGatewayConfigChange(gatewayId, field.id, e.target.value)}
                                  placeholder={field.placeholder}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  rows={3}
                                />
                              </FormField>
                            );
                          }

                          // Render text, password, number inputs
                          return (
                            <FormField
                              key={field.id}
                              id={`${gatewayId}_${field.id}`}
                              label={field.label}
                              description={field.description}
                            >
                              <Input
                                type={field.type}
                                value={config[field.id] ?? field.default ?? ''}
                                onChange={(e) => handleGatewayConfigChange(gatewayId, field.id, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                                placeholder={field.placeholder}
                                min={field.min}
                                max={field.max}
                              />
                            </FormField>
                          );
                        })}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
              
              {/* Show message if no gateways loaded */}
              {(!gatewayDefinitions || Object.keys(gatewayDefinitions).length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>{__('Loading payment gateways...', 'Loading payment gateways...')}</p>
                </div>
              )}
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
                <div className="flex items-center gap-2">
                  <Input
                    id="customer_account_page"
                    value={formData.customer_account_page}
                    name='customer_account_page'
                    onChange={handleFieldChange}
                    placeholder="/my-account"
                    className="flex-1"
                  />
                  {formData.customer_account_page && (() => {
                    const siteUrl = (window as any).yatraAdmin?.siteUrl || '';
                    const slug = formData.customer_account_page.trim();
                    // Ensure slug starts with / for proper URL construction
                    const accountSlug = slug.startsWith('/') ? slug : '/' + slug;
                    // Construct URL: siteUrl + slug (WordPress will handle permalink structure)
                    const accountUrl = siteUrl.replace(/\/$/, '') + accountSlug;
                    return (
                      <a
                        href={accountUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        {__('View Page', 'View Page')} →
                      </a>
                    );
                  })()}
                </div>
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

      case 'permalink':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {__('Permalink Settings', 'Permalink Settings')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {__('Configure URL slugs for your Yatra content types. These settings control how your trips, destinations, and activities appear in URLs.', 'Configure URL slugs for your Yatra content types. These settings control how your trips, destinations, and activities appear in URLs.')}
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                id="trip_base"
                label={__('Trip Base', 'Trip Base')}
                description={__('URL slug for trip single pages (e.g., "trip" will create URLs like /trip/everest-base-camp)', 'URL slug for trip single pages (e.g., "trip" will create URLs like /trip/everest-base-camp)')}
              >
                <Input
                  id="trip_base"
                  name="trip_base"
                  value={formData.trip_base || 'trip'}
                  onChange={handleFieldChange}
                  placeholder="trip"
                  className="font-mono"
                />
                {formData.trip_base && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {__('Example URL:', 'Example URL:')} <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/{formData.trip_base || 'trip'}/trip-name</code>
                  </p>
                )}
              </FormField>

              <FormField
                id="destination_base"
                label={__('Destination Base', 'Destination Base')}
                description={__('URL slug for destination archive pages (e.g., "destination" will create URLs like /destination/nepal)', 'URL slug for destination archive pages (e.g., "destination" will create URLs like /destination/nepal)')}
              >
                <Input
                  id="destination_base"
                  name="destination_base"
                  value={formData.destination_base || 'destination'}
                  onChange={handleFieldChange}
                  placeholder="destination"
                  className="font-mono"
                />
                {formData.destination_base && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {__('Example URL:', 'Example URL:')} <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/{formData.destination_base || 'destination'}/nepal</code>
                  </p>
                )}
              </FormField>

              <FormField
                id="activity_base"
                label={__('Activity Base', 'Activity Base')}
                description={__('URL slug for activity archive pages (e.g., "activity" will create URLs like /activity/trekking)', 'URL slug for activity archive pages (e.g., "activity" will create URLs like /activity/trekking)')}
              >
                <Input
                  id="activity_base"
                  name="activity_base"
                  value={formData.activity_base || 'activity'}
                  onChange={handleFieldChange}
                  placeholder="activity"
                  className="font-mono"
                />
                {formData.activity_base && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {__('Example URL:', 'Example URL:')} <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/{formData.activity_base || 'activity'}/trekking</code>
                  </p>
                )}
              </FormField>

              <FormField
                id="trip_category_base"
                label={__('Trip Category Base', 'Trip Category Base')}
                description={__('URL slug for trip category archive pages (e.g., "trip-category" will create URLs like /trip-category/adventure)', 'URL slug for trip category archive pages (e.g., "trip-category" will create URLs like /trip-category/adventure)')}
              >
                <Input
                  id="trip_category_base"
                  name="trip_category_base"
                  value={formData.trip_category_base || 'trip-category'}
                  onChange={handleFieldChange}
                  placeholder="trip-category"
                  className="font-mono"
                />
                {formData.trip_category_base && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {__('Example URL:', 'Example URL:')} <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/{formData.trip_category_base || 'trip-category'}/adventure</code>
                  </p>
                )}
              </FormField>

            </div>

            {/* Booking Page Settings */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {__('Booking Page Settings', 'Booking Page Settings')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {__('Configure the booking page URL. By default, bookings use /book/{trip-slug}. You can customize the URL base or use a custom WordPress page.', 'Configure the booking page URL. By default, bookings use /book/{trip-slug}. You can customize the URL base or use a custom WordPress page.')}
              </p>

              <div className="space-y-4">
                <FormField
                  id="booking_base"
                  label={__('Default Booking URL Base', 'Default Booking URL Base')}
                  description={__('URL slug for the booking page (e.g., "book" will create URLs like /book/trip-name)', 'URL slug for the booking page (e.g., "book" will create URLs like /book/trip-name)')}
                >
                  <Input
                    id="booking_base"
                    name="booking_base"
                    value={formData.booking_base || 'book'}
                    onChange={handleFieldChange}
                    placeholder="book"
                    className="font-mono"
                    disabled={formData.use_booking_page}
                  />
                  {formData.booking_base && !formData.use_booking_page && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__('Example URL:', 'Example URL:')} <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/{formData.booking_base || 'book'}/nepal-adventure</code>
                    </p>
                  )}
                </FormField>

                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <input
                    type="checkbox"
                    id="use_booking_page"
                    checked={formData.use_booking_page}
                    onChange={(e) => {
                      handleFieldChange({ target: { name: 'use_booking_page', value: e.target.checked } } as any);
                      if (!e.target.checked) {
                        handleFieldChange({ target: { name: 'booking_page_id', value: 0 } } as any);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <Label htmlFor="use_booking_page" className="font-medium cursor-pointer">
                      {__('Use Custom Page for Booking', 'Use Custom Page for Booking')}
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {__('Select a WordPress page to use for bookings instead of the default URL. The page must contain the [yatra_booking] shortcode.', 'Select a WordPress page to use for bookings instead of the default URL. The page must contain the [yatra_booking] shortcode.')}
                    </p>
                  </div>
                </div>

                {formData.use_booking_page && (
                  <FormField
                    id="booking_page_id"
                    label={__('Select Booking Page', 'Select Booking Page')}
                    description={__('Choose a page that contains the [yatra_booking] shortcode. If the page doesn\'t have the shortcode, you\'ll be prompted to add it.', 'Choose a page that contains the [yatra_booking] shortcode. If the page doesn\'t have the shortcode, you\'ll be prompted to add it.')}
                  >
                    <div className="relative">
                      <select
                        id="booking_page_id"
                        name="booking_page_id"
                        value={formData.booking_page_id || 0}
                        onChange={(e) => handleBookingPageChange(parseInt(e.target.value))}
                        disabled={isCheckingShortcode}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-wait"
                      >
                        <option value={0}>{__('-- Select a page --', '-- Select a page --')}</option>
                        {pagesData?.map((page) => (
                          <option key={page.id} value={page.id}>
                            {page.title}
                          </option>
                        ))}
                      </select>
                      {isCheckingShortcode && (
                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                    {formData.booking_page_id > 0 && pagesData && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {__('Booking URL:', 'Booking URL:')} <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{pagesData.find(p => p.id === formData.booking_page_id)?.url || ''}</code>
                      </p>
                    )}
                  </FormField>
                )}
              </div>
            </div>

            {/* Shortcode Dialog */}
            {showShortcodeDialog && selectedPageForShortcode && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {__('Shortcode Required', 'Shortcode Required')}
                  </h3>
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {__('The page', 'The page')} <strong>"{selectedPageForShortcode.title}"</strong> {__('doesn\'t have the', 'doesn\'t have the')} <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">[yatra_booking]</code> {__('shortcode.', 'shortcode.')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {__('Would you like to add it automatically, or edit the page manually to place it where you want?', 'Would you like to add it automatically, or edit the page manually to place it where you want?')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleConfirmInsertShortcode}
                      disabled={insertShortcodeMutation.isPending}
                      className="w-full justify-center"
                    >
                      {insertShortcodeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          {__('Adding...', 'Adding...')}
                        </>
                      ) : (
                        __('Add Shortcode Automatically', 'Add Shortcode Automatically')
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const editUrl = pagesData?.find(p => p.id === selectedPageForShortcode.id)?.url;
                        if (editUrl) {
                          window.open(`/wp-admin/post.php?post=${selectedPageForShortcode.id}&action=edit`, '_blank');
                        }
                        setShowShortcodeDialog(false);
                        setSelectedPageForShortcode(null);
                      }}
                      className="w-full justify-center"
                    >
                      {__('Edit Page Manually', 'Edit Page Manually')}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowShortcodeDialog(false);
                        setSelectedPageForShortcode(null);
                        handleFieldChange({ target: { name: 'booking_page_id', value: 0 } } as any);
                      }}
                      className="w-full justify-center"
                    >
                      {__('Cancel', 'Cancel')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">{__('Important:', 'Important:')}</p>
                  <p className="mb-3">{__('After changing permalink settings, you must flush rewrite rules for the changes to take effect.', 'After changing permalink settings, you must flush rewrite rules for the changes to take effect.')}</p>
                  <Button
                    type="button"
                    onClick={() => flushRewriteRulesMutation.mutate()}
                    disabled={flushRewriteRulesMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {flushRewriteRulesMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {__('Flushing...', 'Flushing...')}
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        {__('Flush Rewrite Rules', 'Flush Rewrite Rules')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
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
