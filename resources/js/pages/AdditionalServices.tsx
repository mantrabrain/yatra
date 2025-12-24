/**
 * Additional Services Page
 * 
 * Premium module for managing trip add-ons and extras.
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
import { usePermissions } from '../hooks/usePermissions';
import { IconSelector } from '../components/ui/icon-selector';
import type { IconPickerValue } from '../components/ui/icon-picker';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { ConditionalRender } from '../components/ui/conditional-render';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api';
import { __ } from '../lib/i18n';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign, 
  Users, 
  ExternalLink,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  RotateCcw,
  FileText
} from 'lucide-react';

// Types
interface TripInfo {
  id: number;
  title: string;
}

interface AdditionalService {
  id: number;
  name: string;
  description: string;
  price: number;
  price_type: 'fixed' | 'percentage';
  price_per: 'person' | 'booking' | 'day';
  icon?: IconPickerValue | null;
  status: 'publish' | 'draft' | 'trash';
  sort_order: number;
  applicable_to?: 'all' | 'specific_trips';
  trip_ids?: number[];
  trips?: TripInfo[];
  trips_count: number;
  bookings_count: number;
  total_revenue: number;
  is_required?: boolean | number | string;
  created_at: string;
  updated_at: string;
}

interface ServicesResponse {
  data: AdditionalService[];
  total: number;
  page: number;
  per_page: number;
}

// Check if module is available (Pro active)
// The additionalServicesEnabled flag is set by Pro module, but we also check isPro
// as a fallback since the flag might not be set on first load after enabling
const isModuleAvailable = (): boolean => {
  const yatraAdmin = (window as any)?.yatraAdmin;
  // If Pro is active and either the flag is set OR we're on the additional-services tab
  // (which means the module must be enabled in the free plugin's ModuleManager)
  return Boolean(yatraAdmin?.isPro);
};

// Premium Upgrade Card Component
const PremiumUpgradeCard: React.FC = () => {
  const features = [
    {
      icon: Package,
      title: __('Unlimited Add-ons'),
      description: __('Create unlimited services like transfers, insurance, meals, and equipment rental.')
    },
    {
      icon: DollarSign,
      title: __('Flexible Pricing'),
      description: __('Set prices per person, per booking, or per day with fixed or percentage-based pricing.')
    },
    {
      icon: Users,
      title: __('Trip Assignment'),
      description: __('Assign services to specific trips with optional price overrides.')
    },
    {
      icon: TrendingUp,
      title: __('Revenue Tracking'),
      description: __('Track service revenue and popularity with detailed analytics.')
    }
  ];

  return (
    <div className="min-h-[600px] flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-6">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {__('Additional Services')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {__('Boost your revenue by offering optional add-ons like airport transfers, travel insurance, equipment rental, and meals during trip booking.')}
          </p>
          <Badge className="mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            {__('Premium Feature')}
          </Badge>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {__('Included in Yatra Pro')}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {__('Unlock Additional Services')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
              {__('Get access to Additional Services and 20+ other premium features with Yatra Pro.')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8"
                onClick={() => window.open('https://wpyatra.com/pricing?module=additional-services', '_blank')}
              >
                <Zap className="w-4 h-4 mr-2" />
                {__('Upgrade to Pro')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open('https://docs.yatra.com/modules/additional-services', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {__('Learn More')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{__('30-day money-back guarantee')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{__('Priority support')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{__('Lifetime updates')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Services List Component (shown when Pro is active)
const ServicesList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState<{ isOpen: boolean; service: AdditionalService | null }>({
    isOpen: false,
    service: null,
  });

  // Column visibility state with localStorage
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('yatra-additional-services-columns');
    return saved ? JSON.parse(saved) : {
      name: true,
      price: true,
      trips: true,
      status: true,
      created_at: false,
      updated_at: false,
    };
  });

  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem('yatra-additional-services-columns', JSON.stringify(newVisibleColumns));
  };

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: 10,
      orderby: sortBy,
      order: sortOrder,
    };
    if (searchTerm) params.search = searchTerm;
    if (statusFilter !== 'all') params.status = statusFilter;
    return params;
  }, [searchTerm, statusFilter, sortBy, sortOrder, page]);

  // Fetch status counts
  const { data: statsData } = useQuery({
    queryKey: ['additional-services-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/additional-services/stats');
        return response;
      } catch {
        return { all: 0, publish: 0, draft: 0, trash: 0 };
      }
    },
    enabled: isModuleAvailable(),
  });

  // Fetch services
  const { data, isLoading, error } = useQuery<ServicesResponse>({
    queryKey: ['additional-services', queryParams],
    queryFn: async () => {
      const response = await apiClient.get('/additional-services', { params: queryParams });
      return response;
    },
    enabled: isModuleAvailable(),
  });

  const services = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  // Status counts
  const statusCounts = useMemo(() => {
    if (statsData) {
      return {
        all: statsData.all ?? 0,
        publish: statsData.publish ?? 0,
        draft: statsData.draft ?? 0,
        trash: statsData.trash ?? 0,
      };
    }
    return { all: 0, publish: 0, draft: 0, trash: 0 };
  }, [statsData]);

  // Bulk actions mutation
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: (string | number)[] }) => {
      return await apiClient.post('/additional-services/bulk', { action, ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additional-services'] });
      queryClient.invalidateQueries({ queryKey: ['additional-services-stats'] });
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
    params.set('tab', 'additional-services');
    params.set('action', action);
    if (id) params.set('id', id.toString());
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const formatPrice = (price: number | string, priceType: string, pricePer: string) => {
    const currency = (window as any)?.yatraAdmin?.currency || 'USD';
    const symbol = currency === 'USD' ? '$' : currency;
    const numPrice = Number(price) || 0;
    if (priceType === 'percentage') return `${numPrice}%`;
    const perLabel = { person: __('/person'), booking: __('/booking'), day: __('/day') }[pricePer] || '';
    return `${symbol}${numPrice.toFixed(2)}${perLabel}`;
  };

  const handleEdit = (service: AdditionalService) => {
    navigateToForm('edit', service.id);
  };

  const handlePermanentDelete = (service: AdditionalService) => {
    setPermanentDeleteConfirm({ isOpen: true, service });
  };

  const confirmPermanentDelete = () => {
    if (permanentDeleteConfirm.service) {
      bulkMutation.mutate({ action: 'delete', ids: [permanentDeleteConfirm.service.id] });
      setPermanentDeleteConfirm({ isOpen: false, service: null });
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return null;
    }
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__('Select a bulk action first.'), 'warning');
      return;
    }
    if (selectedIds.length === 0) {
      showToast(__('Select at least one service.'), 'warning');
      return;
    }
    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
    setSelectedIds([]);
    setBulkAction('');
  };

  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';

  // Keep selection in sync with current page data
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => services.some((s: AdditionalService) => s.id === id))
    );
  }, [services]);

  const viewFilters = [
    { key: 'all', label: __('All'), count: statusCounts.all ?? 0 },
    { key: 'publish', label: __('Published'), count: statusCounts.publish ?? 0 },
    { key: 'draft', label: __('Draft'), count: statusCounts.draft ?? 0 },
    { key: 'trash', label: __('Trash'), count: statusCounts.trash ?? 0 },
  ];

  return (
    <div className="space-y-3">
      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={permanentDeleteConfirm.isOpen}
        onClose={() => setPermanentDeleteConfirm({ isOpen: false, service: null })}
        onConfirm={confirmPermanentDelete}
        title={__('Delete Service Permanently')}
        message={permanentDeleteConfirm.service 
          ? __('Are you sure you want to permanently delete "{name}"? This action cannot be undone.').replace('{name}', permanentDeleteConfirm.service.name)
          : __('Are you sure you want to permanently delete this service?')
        }
        confirmText={__('Delete Permanently')}
        cancelText={__('Cancel')}
        variant="danger"
        isLoading={bulkMutation.isPending}
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
              { value: "all", label: __('All Status') },
              { value: "publish", label: __('Published') },
              { value: "draft", label: __('Draft') },
              { value: "trash", label: __('Trash') }
            ]}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            sortOptions={[
              { value: "name", label: __('Name') },
              { value: "price", label: __('Price') },
              { value: "status", label: __('Status') },
              { value: "created_at", label: __('Created At') },
              { value: "updated_at", label: __('Updated At') }
            ]}
            onResetFilters={handleResetFilters}
            hasFilters={!!hasFilters}
            placeholder={__('Search services...')}
          />
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_trips">
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading services')}
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
                { key: 'name', label: __('Service'), visible: visibleColumns.name },
                { key: 'price', label: __('Price'), visible: visibleColumns.price },
                { key: 'trips', label: __('Trips'), visible: visibleColumns.trips },
                { key: 'status', label: __('Status'), visible: visibleColumns.status },
                { key: 'created_at', label: __('Created Date'), visible: visibleColumns.created_at },
                { key: 'updated_at', label: __('Updated Date'), visible: visibleColumns.updated_at }
              ]}
              onToggleColumn={toggleColumn}
              bulkMutationPending={bulkMutation.isPending}
              totalItems={services.length}
              bulkActionOptions={getDefaultBulkStatusOptions(statusFilter)}
            />

            <Card className="overflow-visible">
              <CardContent className="p-0 overflow-visible">
                <SharedTable
                  data={services}
                  columns={[
                    {
                      key: 'name',
                      label: __('Service'),
                      sortable: true,
                      visible: visibleColumns.name,
                      render: (service: AdditionalService) => (
                        <div className="flex items-center gap-3">
                          {/* Icon/Image */}
                          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                            {service.icon ? (
                              service.icon.type === 'image' ? (
                                <img 
                                  src={service.icon.value} 
                                  alt={service.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <IconSelector 
                                  iconName={service.icon.value} 
                                  className="w-5 h-5 text-purple-600 dark:text-purple-400" 
                                />
                              )
                            ) : (
                              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          {/* Text */}
                          <div>
                            <div className="flex items-center gap-2">
                              <a 
                                href="#"
                                onClick={(e) => { e.preventDefault(); handleEdit(service); }}
                                className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors cursor-pointer"
                              >
                                {service.name}
                              </a>
                              {(service.is_required === true || service.is_required === 1 || service.is_required === '1') && (
                                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
                                  {__('Required')}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                ({__('ID:', 'ID:')} {service.id})
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    },
                    {
                      key: 'price',
                      label: __('Price'),
                      sortable: true,
                      visible: visibleColumns.price,
                      render: (service: AdditionalService) => (
                        <span className={service.status === 'trash' ? 'text-gray-400 dark:text-gray-600' : 'font-medium text-gray-900 dark:text-white'}>
                          {formatPrice(service.price, service.price_type, service.price_per)}
                        </span>
                      )
                    },
                    {
                      key: 'trips',
                      label: __('Trips'),
                      sortable: false,
                      visible: visibleColumns.trips,
                      render: (service: AdditionalService) => (
                        <div className="flex flex-col gap-1">
                          {service.applicable_to === 'all' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {__('All Trips')}
                            </span>
                          ) : service.trips && service.trips.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {service.trips.slice(0, 2).map((trip) => (
                                <span 
                                  key={trip.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 max-w-[120px] truncate"
                                  title={trip.title}
                                >
                                  {trip.title}
                                </span>
                              ))}
                              {service.trips.length > 2 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                  +{service.trips.length - 2} {__('more')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-xs">
                              {__('No trips assigned')}
                            </span>
                          )}
                        </div>
                      )
                    },
                    {
                      key: 'status',
                      label: __('Status'),
                      sortable: true,
                      visible: visibleColumns.status,
                      render: (service: AdditionalService) => (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.status === 'trash'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : service.status === 'publish'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {service.status === 'trash'
                            ? __('Trash')
                            : service.status === 'publish'
                              ? __('Published')
                              : __('Draft')
                          }
                        </span>
                      )
                    },
                    {
                      key: 'created_at',
                      label: __('Created Date'),
                      sortable: true,
                      visible: visibleColumns.created_at,
                      render: (service: AdditionalService) => (
                        <span className={service.status === 'trash' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}>
                          {new Date(service.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )
                    },
                    {
                      key: 'updated_at',
                      label: __('Updated Date'),
                      sortable: true,
                      visible: visibleColumns.updated_at,
                      render: (service: AdditionalService) => (
                        <span className={service.status === 'trash' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}>
                          {new Date(service.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )
                    }
                  ]}
                  actions={[
                    {
                      key: 'edit',
                      label: __('Edit'),
                      icon: <Edit className="w-4 h-4" />,
                      onClick: handleEdit,
                      condition: () => can('yatra_edit_trips'),
                    },
                    {
                      key: 'publish',
                      label: __('Publish'),
                      icon: <CheckCircle className="w-4 h-4" />,
                      onClick: (service: AdditionalService) => {
                        bulkMutation.mutate({ action: 'publish', ids: [service.id] });
                      },
                      condition: (service: AdditionalService) => service.status !== 'publish' && service.status !== 'trash' && can('yatra_edit_trips'),
                    },
                    {
                      key: 'draft',
                      label: __('Set as Draft'),
                      icon: <FileText className="w-4 h-4" />,
                      onClick: (service: AdditionalService) => {
                        bulkMutation.mutate({ action: 'draft', ids: [service.id] });
                      },
                      condition: (service: AdditionalService) => service.status !== 'draft' && service.status !== 'trash' && can('yatra_edit_trips'),
                    },
                    {
                      key: 'restore',
                      label: __('Restore'),
                      icon: <RotateCcw className="w-4 h-4" />,
                      onClick: (service: AdditionalService) => {
                        bulkMutation.mutate({ action: 'restore', ids: [service.id] });
                      },
                      condition: (service: AdditionalService) => (service.status === 'trash' || statusFilter === 'trash') && can('yatra_edit_trips'),
                    },
                    {
                      key: 'trash',
                      label: __('Move to Trash'),
                      icon: <Trash2 className="w-4 h-4" />,
                      onClick: (service: AdditionalService) => {
                        bulkMutation.mutate({ action: 'trash', ids: [service.id] });
                      },
                      condition: (service: AdditionalService) => service.status !== 'trash' && statusFilter !== 'trash' && can('yatra_edit_trips'),
                    },
                    {
                      key: 'delete',
                      label: __('Delete Permanently'),
                      icon: <Trash2 className="w-4 h-4" />,
                      onClick: handlePermanentDelete,
                      condition: (service: AdditionalService) => (service.status === 'trash' || statusFilter === 'trash') && can('yatra_delete_trips'),
                      variant: 'destructive',
                    }
                  ]}
                  isLoading={isLoading}
                  isError={!!error}
                  errorText={__('Error loading services')}
                  emptyText={__('No services found')}
                  emptyDescription={hasFilters 
                    ? __('Try adjusting your filters to see more results.')
                    : __('Get started by creating your first service.')
                  }
                  onCreateClick={can('yatra_edit_trips') ? () => navigateToForm('create') : undefined}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                  selectedItemIds={selectedIds}
                  onSelectItem={(id: string | number, checked: boolean) => {
                    if (checked) {
                      setSelectedIds([...selectedIds, id]);
                    } else {
                      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
                    }
                  }}
                  onSelectAll={(checked: boolean) => {
                    if (checked) {
                      setSelectedIds(services.map((s: AdditionalService) => s.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  isAllSelected={services.length > 0 && selectedIds.length === services.length}
                  getItemId={(service: AdditionalService) => service.id}
                  getItemStatus={(service: AdditionalService) => service.status}
                  statusFilter={statusFilter}
                  skeletonRows={5}
                />
              </CardContent>
            </Card>

            {total > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={10}
                  onPageChange={(newPage) => setPage(newPage)}
                  itemName={__('services')}
                />
              </div>
            )}
          </>
        )}
      </ConditionalRender>
    </div>
  );
};

// Main Component
const AdditionalServices: React.FC = () => {
  const moduleAvailable = isModuleAvailable();

  const handleCreateService = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('subpage', 'trips');
    params.set('tab', 'additional-services');
    params.set('action', 'create');
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // If module is not available, show premium upgrade card
  if (!moduleAvailable) {
    return <PremiumUpgradeCard />;
  }

  // This component handles the list view
  // Form view will be rendered by App.tsx routing when action=create or action=edit
  return (
    <div className="space-y-6">
      <PageHeader
        title={__('Additional Services')}
        description={__('Manage optional add-ons that customers can purchase during booking.')}
        actions={
          <Button onClick={handleCreateService} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {__('Add New Service')}
          </Button>
        }
      />
      <ServicesList />
    </div>
  );
};

export default AdditionalServices;
