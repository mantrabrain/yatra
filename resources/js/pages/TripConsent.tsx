/**
 * Trip Consent Page
 * 
 * Premium module for managing consent forms and digital signatures.
 * This page displays the UI shell in the free plugin with a premium gate.
 * The actual functionality is provided by the Yatra Pro plugin.
 * 
 * @package Yatra
 * @since 3.0.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { PageHeader } from '../components/common/PageHeader';
import { Pagination, SearchFilterToolbar, BulkActionToolbar, Table as SharedTable } from '../components/shared';
import { getDefaultBulkStatusOptions } from '../components/shared/bulkStatusOptions';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { ConditionalRender } from '../components/ui/conditional-render';
import { useToast } from '../components/ui/toast';
import { Modal } from '../components/ui/modal';
import { apiClient } from '../lib/api';
import { __ } from '../lib/i18n';
import PremiumUpgradeCard from './premium-pages/TripConsent';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  Copy,
  Clock,
  PenTool,
  Send,
  Eye,
  Download,
  Mail,
  Calendar,
  ClipboardCheck,
  RotateCcw
} from 'lucide-react';


// Types
interface ConsentForm {
  id: number;
  name: string;
  description: string;
  form_config: FormConfig;
  status: 'publish' | 'draft' | 'archived' | 'trash';
  version: number;
  require_signature: boolean;
  require_initials: boolean;
  applicable_to: 'all' | 'specific_trips';
  send_to: 'all_travelers' | 'lead_traveler' | 'primary_contact';
  trip_ids: number[];
  send_before_days: number;
  reminder_days: string;
  expiry_hours: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  signed_count?: number;
  pending_count?: number;
}

interface FormConfig {
  title: string;
  description: string;
  enabled: boolean;
  fields: FormField[];
  content_blocks?: ContentBlock[];
}

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  enabled: boolean;
  order: number;
  width?: string;
  section?: string;
  options?: { value: string; label: string }[];
  locked?: boolean;
}

interface ContentBlock {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface ConsentFormsResponse {
  data: ConsentForm[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

interface SignedConsent {
  id: number;
  form_id: number;
  form_name?: string;
  form_version: number;
  booking_id: number;
  traveler_index: number;
  signer_name: string;
  signer_email: string;
  form_data: Record<string, any>;
  signature_data: string | null;
  initials_data: string | null;
  ip_address: string;
  user_agent: string;
  signed_at: string;
  status: 'signed' | 'expired' | 'revoked';
}

interface SignedConsentsResponse {
  data: SignedConsent[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
  };
}

// Check if module is available (Pro active)
const isModuleAvailable = (): boolean => {
  const yatraAdmin = (window as any)?.yatraAdmin;
  return Boolean(yatraAdmin?.isPro);
};

// Consent Forms List Component (shown when Pro is active)
const ConsentFormsList: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; form: ConsentForm | null }>({
    isOpen: false,
    form: null,
  });
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('yatra-consent-forms-columns');
    return saved ? JSON.parse(saved) : {
      id: true,
      name: true,
      status: true,
      applicable_to: true,
      signatures: true,
      version: true,
    };
  });
  
  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = { ...visibleColumns, [columnKey]: !visibleColumns[columnKey] };
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem('yatra-consent-forms-columns', JSON.stringify(newVisibleColumns));
  };
  
  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, per_page: 10, orderby: sortBy, order: sortOrder };
    if (searchTerm) params.search = searchTerm;
    if (statusFilter !== 'all') params.status = statusFilter;
    return params;
  }, [searchTerm, statusFilter, sortBy, sortOrder, page]);
  
  // Fetch consent forms
  const { data: formsData, isLoading, error } = useQuery<ConsentFormsResponse>({
    queryKey: ['consent-forms', queryParams],
    queryFn: async () => {
      const response = await apiClient.get('/consent-forms', { params: queryParams });
      return response;
    },
    enabled: isModuleAvailable(),
  });
  
  const forms = formsData?.data || [];
  const total = formsData?.meta?.total || 0;
  const totalPages = Math.ceil(total / 10);
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/consent-forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-forms'] });
      showToast(__('Consent form deleted successfully'), 'success');
      setDeleteConfirm({ isOpen: false, form: null });
    },
    onError: () => {
      showToast(__('Failed to delete consent form'), 'error');
    },
  });
  
  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/consent-forms/${id}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-forms'] });
      showToast(__('Consent form duplicated successfully'), 'success');
    },
    onError: () => {
      showToast(__('Failed to duplicate consent form'), 'error');
    },
  });
  
  // Bulk actions mutation
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: (string | number)[] }) => {
      return await apiClient.post('/consent-forms/bulk', { action, ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-forms'] });
      showToast(__('Action completed successfully'), 'success');
      setSelectedIds([]);
      setBulkAction('');
    },
    onError: () => {
      showToast(__('Failed to perform action'), 'error');
    },
  });
  
  const navigateToForm = (action: 'create' | 'edit', id?: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('subpage', 'trips');
    params.set('tab', 'trip-consent');
    params.set('action', action);
    if (id) params.set('id', id.toString());
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  
  const handleEdit = (form: ConsentForm) => navigateToForm('edit', form.id);
  
  const handleBulkApply = () => {
    if (!bulkAction || selectedIds.length === 0) return;
    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
  };
  
  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';
  
  // Keep selection in sync with current page data
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => forms.some((f: ConsentForm) => f.id === id)));
  }, [forms]);
  
  const viewFilters = [
    { key: 'all', label: __('All'), count: total },
    { key: 'publish', label: __('Published'), count: 0 },
    { key: 'draft', label: __('Draft'), count: 0 },
    { key: 'archived', label: __('Archived'), count: 0 },
    { key: 'trash', label: __('Trash'), count: 0 },
  ];
  
  
  return (
    <div className="space-y-3">
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, form: null })}
        onConfirm={() => deleteConfirm.form && deleteMutation.mutate(deleteConfirm.form.id)}
        title={__('Delete Consent Form')}
        message={deleteConfirm.form
          ? __('Are you sure you want to delete "{name}"? Forms with signed consents will be archived instead.').replace('{name}', deleteConfirm.form.name)
          : __('Are you sure you want to delete this consent form?')
        }
        confirmText={__('Delete')}
        cancelText={__('Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
      
      {/* Filters Card */}
      <Card>
        <CardContent className="p-3">
          <SearchFilterToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPage(1);
              setSelectedIds([]);
              setBulkAction('');
            }}
            statusOptions={[
              { value: 'all', label: __('All Status') },
              { value: 'publish', label: __('Published') },
              { value: 'draft', label: __('Draft') },
              { value: 'archived', label: __('Archived') },
              { value: 'trash', label: __('Trash') },
            ]}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            sortOptions={[
              { value: 'name', label: __('Name') },
              { value: 'status', label: __('Status') },
              { value: 'created_at', label: __('Created At') },
              { value: 'updated_at', label: __('Updated At') },
            ]}
            onResetFilters={handleResetFilters}
            hasFilters={!!hasFilters}
            placeholder={__('Search consent forms...')}
          />
        </CardContent>
      </Card>
      
      <ConditionalRender capability="yatra_view_trips">
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading consent forms')}
            </CardContent>
          </Card>
        ) : (
          <>
            <BulkActionToolbar
              selectedIds={selectedIds}
              bulkAction={bulkAction}
              setBulkAction={setBulkAction}
              onApply={handleBulkApply}
              onClearSelection={() => setSelectedIds([])}
              statusFilter={statusFilter}
              setStatusFilter={(value) => {
                setStatusFilter(value);
                setPage(1);
                setSelectedIds([]);
                setBulkAction('');
              }}
              statusOptions={viewFilters}
              showColumnsDropdown={showColumnsDropdown}
              setShowColumnsDropdown={setShowColumnsDropdown}
              columnOptions={[
                { key: 'id', label: __('Form ID'), visible: visibleColumns.id },
                { key: 'name', label: __('Form Name'), visible: visibleColumns.name },
                { key: 'status', label: __('Status'), visible: visibleColumns.status },
                { key: 'applicable_to', label: __('Applies To'), visible: visibleColumns.applicable_to },
                { key: 'signatures', label: __('Signatures'), visible: visibleColumns.signatures },
                { key: 'version', label: __('Version'), visible: visibleColumns.version },
              ]}
              onToggleColumn={toggleColumn}
              bulkMutationPending={bulkMutation.isPending}
              totalItems={forms.length}
              bulkActionOptions={getDefaultBulkStatusOptions(statusFilter)}
            />
            
            <Card className="overflow-visible">
              <CardContent className="p-0 overflow-visible">
                <SharedTable
                  data={forms}
                  columns={[
                    {
                      key: 'id',
                      label: __('Form ID'),
                      sortable: true,
                      visible: visibleColumns.id,
                      render: (form: ConsentForm) => (
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">#{form.id}</span>
                      ),
                    },
                    {
                      key: 'name',
                      label: __('Form Name'),
                      sortable: true,
                      visible: visibleColumns.name,
                      render: (form: ConsentForm) => (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                            <FileSignature className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <a
                              href="#"
                              onClick={(e) => { e.preventDefault(); handleEdit(form); }}
                              className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors cursor-pointer"
                            >
                              {form.name}
                            </a>
                            {form.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{form.description}</div>
                            )}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'status',
                      label: __('Status'),
                      sortable: true,
                      visible: visibleColumns.status,
                      render: (form: ConsentForm) => {
                        const statusColors: Record<string, string> = {
                          publish: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                          draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                          archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
                          trash: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                        };
                        return (
                          <Badge className={statusColors[form.status] || ''}>
                            {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                          </Badge>
                        );
                      },
                    },
                    {
                      key: 'applicable_to',
                      label: __('Applies To'),
                      sortable: false,
                      visible: visibleColumns.applicable_to,
                      render: (form: ConsentForm) => (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {form.applicable_to === 'all' 
                            ? __('All Trips') 
                            : `${form.trip_ids?.length || 0} ${__('Trips')}`}
                        </span>
                      ),
                    },
                    {
                      key: 'signatures',
                      label: __('Signatures'),
                      sortable: false,
                      visible: visibleColumns.signatures,
                      render: (form: ConsentForm) => (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span>{form.signed_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>{form.pending_count || 0}</span>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'version',
                      label: __('Version'),
                      sortable: false,
                      visible: visibleColumns.version,
                      render: (form: ConsentForm) => (
                        <span className="text-sm text-gray-600 dark:text-gray-400">v{form.version}</span>
                      ),
                    },
                  ]}
                  actions={[
                    {
                      key: 'edit',
                      label: __('Edit'),
                      icon: <Edit className="w-4 h-4" />,
                      onClick: handleEdit,
                      condition: (form: ConsentForm) => form.status !== 'trash',
                    },
                    {
                      key: 'duplicate',
                      label: __('Duplicate'),
                      icon: <Copy className="w-4 h-4" />,
                      onClick: (form: ConsentForm) => duplicateMutation.mutate(form.id),
                      condition: (form: ConsentForm) => form.status !== 'trash',
                    },
                    {
                      key: 'restore',
                      label: __('Restore'),
                      icon: <RotateCcw className="w-4 h-4" />,
                      onClick: (form: ConsentForm) => bulkMutation.mutate({ action: 'restore', ids: [form.id] }),
                      condition: (form: ConsentForm) => form.status === 'trash',
                    },
                    {
                      key: 'trash',
                      label: __('Move to Trash'),
                      icon: <Trash2 className="w-4 h-4" />,
                      onClick: (form: ConsentForm) => bulkMutation.mutate({ action: 'trash', ids: [form.id] }),
                      condition: (form: ConsentForm) => form.status !== 'trash',
                    },
                    {
                      key: 'delete',
                      label: __('Delete Permanently'),
                      icon: <Trash2 className="w-4 h-4" />,
                      onClick: (form: ConsentForm) => setDeleteConfirm({ isOpen: true, form }),
                      variant: 'destructive',
                      condition: (form: ConsentForm) => form.status === 'trash',
                    },
                  ]}
                  selectedItemIds={selectedIds}
                  onSelectItem={(id, checked) => {
                    if (checked) {
                      setSelectedIds([...selectedIds, id]);
                    } else {
                      setSelectedIds(selectedIds.filter(i => i !== id));
                    }
                  }}
                  onSelectAll={(checked) => {
                    if (checked) {
                      setSelectedIds(forms.map(f => f.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  isAllSelected={forms.length > 0 && selectedIds.length === forms.length}
                  getItemId={(form) => form.id}
                  isLoading={isLoading}
                />
                
                {total > 10 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      totalItems={total}
                      itemsPerPage={10}
                      itemName={__('forms')}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </ConditionalRender>
    </div>
  );
};

// Signed Consents List Component
const SignedConsentsList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [selectedConsent, setSelectedConsent] = useState<SignedConsent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('signed_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const { showToast } = useToast();

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state changed - isModalOpen:', isModalOpen);
  }, [isModalOpen]);

  useEffect(() => {
    console.log('Selected consent changed:', selectedConsent);
  }, [selectedConsent]);
  
  // Fetch signed consents
  const { data: consentsData, isLoading, error } = useQuery<SignedConsentsResponse>({
    queryKey: ['signed-consents', page, searchTerm, sortBy, sortOrder, statusFilter],
    queryFn: async () => {
      const params: Record<string, any> = { page, per_page: 15, sort_by: sortBy, sort_order: sortOrder };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await apiClient.get('/signed-consents', { params });
      return response;
    },
    enabled: isModuleAvailable(),
  });
  
  const consents = consentsData?.data || [];
  const total = consentsData?.meta?.total || 0;
  const totalPages = Math.ceil(total / 15);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleView = async (consent: SignedConsent) => {
    console.log('handleView called with consent:', consent);
    console.log('Setting isModalOpen to true');
    setIsModalOpen(true);
    setIsDetailLoading(true);
    setDetailError(null);
    setSelectedConsent(null);

    try {
      console.log('Fetching consent details for ID:', consent.id);
      const response = await apiClient.get(`/signed-consents/${consent.id}`);
      console.log('API Response:', response);
      
      // Handle nested data structure from API
      let consentData = response;
      if (response?.data) {
        consentData = response.data;
      }
      if (response?.success && response?.data) {
        consentData = response.data;
      }
      
      console.log('Processed consent data:', consentData);
      console.log('Setting selectedConsent');
      setSelectedConsent(consentData as SignedConsent);
      console.log('Modal should now be visible with data');
    } catch (error: any) {
      console.error('Failed to load consent details:', error);
      const message = error?.message || __('Failed to load consent details');
      setDetailError(message);
      showToast(message, 'error');
    } finally {
      console.log('Setting isDetailLoading to false');
      setIsDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDetailError(null);
    setSelectedConsent(null);
  };

  const handleDownloadPdf = async (consent: SignedConsent) => {
    const apiUrl = (window as any).yatraAdmin?.apiUrl || '/wp-json/yatra/v1';
    const nonce = (window as any).yatraAdmin?.nonce || '';
    
    try {
      const response = await fetch(`${apiUrl}/signed-consents/${consent.id}/pdf`, {
        headers: {
          'X-WP-Nonce': nonce,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || __('Download failed', 'yatra'));
      }
      
      const data = await response.json();
      
      if (data?.success && data?.data?.download_url) {
        window.open(data.data.download_url, '_blank');
      } else {
        showToast(__('Failed to prepare PDF download. Please try again.', 'yatra'), 'error');
      }
    } catch (err: any) {
      console.error('PDF download error:', err);
      showToast(err?.message || __('Failed to download PDF', 'yatra'), 'error');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('signed_at');
    setSortOrder('desc');
    setPage(1);
  };

  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'signed_at' || sortOrder !== 'desc';

  return (
    <div className="space-y-3">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-3">
          <SearchFilterToolbar
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPage(1);
            }}
            statusFilter={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            statusOptions={[
              { value: 'all', label: __('All Status') },
              { value: 'signed', label: __('Signed') },
              { value: 'pending', label: __('Pending') },
            ]}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            sortOptions={[
              { value: 'signed_at', label: __('Signed Date') },
              { value: 'signer_name', label: __('Signer Name') },
              { value: 'form_name', label: __('Form Name') },
            ]}
            onResetFilters={handleResetFilters}
            hasFilters={!!hasFilters}
            placeholder={__('Search by name or email...')}
          />
        </CardContent>
      </Card>

      {/* Consents Table */}
      <Card className="overflow-visible">
        <CardContent className="p-0 overflow-visible">
          <SharedTable
            data={consents}
            columns={[
              {
                key: 'signer',
                label: __('Signer'),
                sortable: true,
                visible: true,
                render: (consent: SignedConsent) => (
                  <button
                    type="button"
                    onClick={() => handleView(consent)}
                    className="flex items-center gap-3 w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-300 font-semibold">
                      {consent.signer_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {consent.signer_name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {consent.signer_email}
                      </div>
                      <span className="text-xs text-purple-600 dark:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        {__('View details')}
                      </span>
                    </div>
                  </button>
                ),
              },
              {
                key: 'form',
                label: __('Form'),
                sortable: true,
                visible: true,
                render: (consent: SignedConsent) => (
                  <div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {consent.form_name || `Form #${consent.form_id}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      v{consent.form_version}
                    </div>
                  </div>
                ),
              },
              {
                key: 'booking',
                label: __('Booking'),
                sortable: false,
                visible: true,
                render: (consent: SignedConsent) => (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {consent.booking_id > 0 ? (
                      <>
                        #{consent.booking_id}
                        {consent.traveler_index > 0 && (
                          <span className="ml-1 text-xs text-gray-400">
                            (Traveler {consent.traveler_index})
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">{__('Preview')}</span>
                    )}
                  </span>
                ),
              },
              {
                key: 'signed_at',
                label: __('Signed At'),
                sortable: true,
                visible: true,
                render: (consent: SignedConsent) => (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(consent.signed_at)}
                  </div>
                ),
              },
              {
                key: 'status',
                label: __('Status'),
                sortable: true,
                visible: true,
                render: (consent: SignedConsent) => (
                  <Badge variant={consent.status === 'signed' ? 'success' : 'default'}>
                    {consent.status === 'signed' ? __('Signed') : consent.status}
                  </Badge>
                ),
              },
            ]}
            actions={[
              {
                key: 'view',
                label: __('View Details'),
                icon: <Eye className="w-4 h-4" />,
                onClick: handleView,
              },
              {
                key: 'download',
                label: __('Download PDF'),
                icon: <Download className="w-4 h-4" />,
                onClick: handleDownloadPdf,
              },
            ]}
            isLoading={isLoading}
            isError={!!error}
            errorText={__('Error loading signed consents')}
            emptyText={__('No signed consents yet')}
            emptyDescription={__('Signed consent forms will appear here once travelers submit them.')}
            getItemId={(consent: SignedConsent) => consent.id}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 15 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={total}
          itemsPerPage={15}
          itemName={__('consents')}
        />
      )}

      {/* View Consent Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={__('Signed Consent Details')}
        size="xl"
        loading={isDetailLoading}
        error={detailError}
        loadingSkeleton={
          <div className="space-y-6 animate-pulse">
            {/* Signer Info Skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-5 w-40 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div>
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-5 w-36 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div>
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-5 w-28 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </div>

            {/* Form Responses Skeleton */}
            <div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-36 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>

            {/* Signature Skeleton */}
            <div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="h-24 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
              </div>
            </div>
          </div>
        }
        footer={
          selectedConsent && !detailError && !isDetailLoading ? (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => handleDownloadPdf(selectedConsent)}>
                <Download className="w-4 h-4 mr-2" />
                {__('Download PDF')}
              </Button>
              <Button onClick={handleCloseModal}>
                {__('Close')}
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedConsent && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs text-gray-500 uppercase">{__('Signer Name')}</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedConsent.signer_name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">{__('Email')}</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedConsent.signer_email}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">{__('Signed At')}</label>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedConsent.signed_at)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">{__('IP Address')}</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedConsent.ip_address}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">
                {__('Form Responses')}
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                {selectedConsent.form_data && Object.entries(selectedConsent.form_data).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{key}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {typeof value === 'boolean' ? (value ? '✓ Yes' : '✗ No') : String(value)}
                    </span>
                  </div>
                ))}
                {(!selectedConsent.form_data || Object.keys(selectedConsent.form_data).length === 0) && (
                  <p className="text-sm text-gray-500">{__('No form data recorded')}</p>
                )}
              </div>
            </div>

            {selectedConsent.signature_data && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">
                  {__('Signature')}
                </h3>
                <div className="bg-white border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <img 
                    src={selectedConsent.signature_data} 
                    alt="Signature" 
                    className="max-h-24 mx-auto"
                  />
                </div>
              </div>
            )}

            {selectedConsent.initials_data && (
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">
                  {__('Initials')}
                </h3>
                <div className="bg-white border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <img 
                    src={selectedConsent.initials_data} 
                    alt="Initials" 
                    className="max-h-16 mx-auto"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

// Main Component
const TripConsent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forms' | 'signed'>('forms');

  if (!isModuleAvailable()) {
    return <PremiumUpgradeCard />;
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={__('Trip Consent Forms')}
        description={__('Manage consent forms, waivers, and digital signatures for your trips.')}
        actions={
          activeTab === 'forms' ? (
            <Button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set('subpage', 'trips');
                params.set('tab', 'trip-consent');
                params.set('action', 'create');
                window.history.pushState({}, '', `${window.location.pathname}?${params}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {__('Create Form')}
            </Button>
          ) : null
        }
      />
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('forms')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'forms'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FileSignature className="w-4 h-4 inline-block mr-2" />
            {__('Consent Forms')}
          </button>
          <button
            onClick={() => setActiveTab('signed')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'signed'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 inline-block mr-2" />
            {__('Signed Consents')}
          </button>
        </nav>
      </div>
      
      {/* Tab Content - with gap */}
      <div className="mt-4">
        {activeTab === 'forms' ? <ConsentFormsList /> : <SignedConsentsList />}
      </div>
    </div>
  );
};

export default TripConsent;
