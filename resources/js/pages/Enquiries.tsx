/**
 * Enquiries Page
 * Clean, minimal SaaS-style enquiries management page using shared components
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2, Mail, Phone, MessageSquare, MapPin, Send, Loader2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { apiService } from '../lib/api-client';
import { formatDate as formatDateUtil } from '../lib/dateFormat';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useNavigate } from '../hooks/useNavigate';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Pagination, Table as SharedTable, BulkActionToolbar } from '../components/shared';
import { getErrorContext } from '../lib/errors';

interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  trip_title?: string;
  trip_id?: number;
  message: string;
  travelers_count?: number;
  travel_date?: string;
  status:
    | 'new'
    | 'pending'
    | 'responded'
    | 'closed'
    | 'converted'
    | 'read'
    | 'archived'
    | 'spam'
    | 'trash';
  created_at: string;
  responded_at?: string;
  response_notes?: string;
}

const Enquiries: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState<Enquiry | null>(null);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        customer: true,
        trip: true,
        message: true,
        travelers: true,
        preferred_date: true,
        status: true,
        date: true,
      };
    }

    const saved = window.localStorage.getItem('yatra-enquiries-visible-columns');
    return saved
      ? JSON.parse(saved)
      : {
          customer: true,
          trip: true,
          message: true,
          travelers: true,
          preferred_date: true,
          status: true,
          date: true,
        };
  });

  const bulkActionOptions = useMemo(() => {
    if (statusFilter === 'trash') {
      return [
        { value: 'delete', label: __('Delete Permanently', 'Delete Permanently') },
      ];
    }

    if (statusFilter === 'spam') {
      return [
        { value: 'mark_trash', label: __('Move to Trash', 'Move to Trash') },
        { value: 'delete', label: __('Delete Permanently', 'Delete Permanently') },
      ];
    }

    return [
      { value: 'mark_spam', label: __('Mark as Spam', 'Mark as Spam') },
      { value: 'mark_trash', label: __('Move to Trash', 'Move to Trash') },
      { value: 'delete', label: __('Delete Permanently', 'Delete Permanently') },
    ];
  }, [statusFilter]);

  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { navigate } = useNavigate();

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: 10,
      orderby: sortBy,
      order: sortOrder,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    return params;
  }, [searchTerm, statusFilter, sortBy, sortOrder, page]);

  // Enquiry stats for status tabs
  const { data: statsData } = useQuery({
    queryKey: ['enquiries-stats'],
    queryFn: async () => {
      return await apiService.getEnquiriesStats();
    },
    enabled: can('yatra_view_bookings'),
  });

  const statusCounts = {
    all: (statsData as any)?.total || 0,
    new: ((statsData as any)?.by_status?.new?.count as number) || 0,
    pending: ((statsData as any)?.by_status?.pending?.count as number) || 0,
    responded: ((statsData as any)?.by_status?.responded?.count as number) || 0,
    converted: ((statsData as any)?.by_status?.converted?.count as number) || 0,
    closed: ((statsData as any)?.by_status?.closed?.count as number) || 0,
    spam: ((statsData as any)?.by_status?.spam?.count as number) || 0,
    trash: ((statsData as any)?.by_status?.trash?.count as number) || 0,
  };

  // Bulk actions
  const handleBulkApply = () => {
    if (!bulkAction || selectedIds.length === 0) {
      return;
    }

    const run = async () => {
      try {
        // Use dedicated bulk endpoint for status changes and delete
        if (['delete', 'mark_spam', 'mark_trash'].includes(bulkAction)) {
          await apiService.bulkEnquiriesAction(bulkAction, selectedIds);
          queryClient.invalidateQueries({ queryKey: ['enquiries'] });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Bulk enquiry action error', error);
      } finally {
        setSelectedIds([]);
        setBulkAction('');
      }
    };

    void run();
  };

  const toggleColumn = (columnKey: string) => {
    const newVisible = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey as keyof typeof visibleColumns],
    };
    setVisibleColumns(newVisible);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('yatra-enquiries-visible-columns', JSON.stringify(newVisible));
    }
  };

  const columnOptions = [
    { key: 'customer', label: __('Customer', 'Customer'), visible: visibleColumns.customer },
    { key: 'trip', label: __('Trip', 'Trip'), visible: visibleColumns.trip },
    { key: 'message', label: __('Message', 'Message'), visible: visibleColumns.message },
    { key: 'travelers', label: __('Travelers', 'Travelers'), visible: visibleColumns.travelers },
    { key: 'preferred_date', label: __('Preferred Date', 'Preferred Date'), visible: visibleColumns.preferred_date },
    { key: 'status', label: __('Status', 'Status'), visible: visibleColumns.status },
    { key: 'date', label: __('Date', 'Date'), visible: visibleColumns.date },
  ];

  const actions = [
    {
      key: 'view',
      label: __('View', 'View'),
      icon: <Eye className="w-4 h-4" />,
      onClick: (enquiry: Enquiry) => handleView(enquiry),
      condition: () => can('yatra_view_bookings'),
    },
    {
      key: 'respond',
      label: __('Respond', 'Respond'),
      icon: <Send className="w-4 h-4" />,
      onClick: (enquiry: Enquiry) => handleRespond(enquiry),
      // Only allow respond on active enquiries (not closed, spam, trash, or archived)
      condition: (enquiry: Enquiry) =>
        can('yatra_edit_bookings') &&
        !['closed', 'spam', 'trash', 'archived'].includes(enquiry.status),
    },
    {
      key: 'edit',
      label: __('Edit', 'Edit'),
      icon: <Edit className="w-4 h-4" />,
      onClick: (enquiry: Enquiry) => handleEdit(enquiry),
      condition: () => can('yatra_edit_bookings'),
    },
    {
      key: 'delete',
      label: __('Delete', 'Delete'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (enquiry: Enquiry) => handleDelete(enquiry),
      variant: 'destructive' as const,
      condition: () => can('yatra_delete_bookings'),
    },
  ];

  // Fetch enquiries from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['enquiries', queryParams],
    queryFn: async () => {
      // Check URL parameter for error simulation (for testing)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('simulate_error') === 'true') {
        throw new Error('Simulated API error for testing error UI functionality');
      }
      
      const paramsObj: Record<string, any> = {};
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          paramsObj[key] = value;
        }
      });
      
      const response = await apiService.getEnquiries(paramsObj);
      
      return {
        data: response.data || [],
        total: response.meta?.total || response.total || 0,
        page: response.meta?.page || response.page || 1,
        per_page: response.meta?.per_page || response.per_page || 10,
      };
    },
    enabled: can('yatra_view_bookings'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiService.deleteEnquiry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setDeleteDialogOpen(false);
      setEnquiryToDelete(null);
    },
  });

  // Respond mutation - sends email to customer
  const respondMutation = useMutation({
    mutationFn: async ({ id, message }: { id: number; message: string }) => {
      return await apiService.respondToEnquiry(id, { response: message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setRespondDialogOpen(false);
      setSelectedEnquiry(null);
      setResponseMessage('');
    },
  });

  const enquiries: Enquiry[] = data?.data || [];
  const total = data?.total || 0;
  const perPage = 10;
  const totalPages = Math.ceil(total / perPage || 1);

  // Enhanced error handling
  const errorContext = getErrorContext(error);
  const apiErrorMessage = (data as any)?.error || (data as any)?.message;
  const derivedErrorDetails =
    errorContext.details ||
    (apiErrorMessage ? String(apiErrorMessage) : undefined) ||
    (error ? String(error?.message || error) : undefined);
  const isEnquiriesError = !!error || !!apiErrorMessage;

  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'new': {
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        label: __('New', 'New'),
      },
      'pending': {
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
        label: __('Pending', 'Pending'),
      },
      'responded': {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: __('Responded', 'Responded'),
      },
      'converted': {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        label: __('Converted', 'Converted'),
      },
      'closed': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
        label: __('Closed', 'Closed'),
      },
      'spam': {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        label: __('Spam', 'Spam'),
      },
      'trash': {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300 line-through',
        label: __('Trash', 'Trash'),
      },
    };

    const statusInfo = statusMap[status] || {
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
      label: status,
    };

    return (
      <Badge className={`text-xs ${statusInfo.className}`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const handleView = (enquiry: Enquiry) => {
    navigate({ subpage: 'enquiries', action: 'view', id: enquiry.id });
  };

  const handleEdit = (enquiry: Enquiry) => {
    navigate({ subpage: 'enquiries', action: 'edit', id: enquiry.id });
  };

  const handleDelete = (enquiry: Enquiry) => {
    setEnquiryToDelete(enquiry);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (enquiryToDelete) {
      deleteMutation.mutate(enquiryToDelete.id);
    }
  };

  const handleRespond = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setResponseMessage('');
    setRespondDialogOpen(true);
  };

  const sendResponse = () => {
    if (selectedEnquiry && responseMessage.trim()) {
      respondMutation.mutate({
        id: selectedEnquiry.id,
        message: responseMessage,
      });
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-gray-600 dark:text-gray-300" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-gray-600 dark:text-gray-300" />;
  };

  const hasFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'created_at' || sortOrder !== 'desc';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Enquiries', 'Enquiries')}
        description={__('Manage customer enquiries and inquiries', 'Manage customer enquiries and inquiries')}
      />

      {/* Filters, Search, and Sorting - Always Visible */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={__('Search enquiries...', 'Search enquiries...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="new">{__('New', 'New')}</option>
              <option value="pending">{__('Pending', 'Pending')}</option>
              <option value="responded">{__('Responded', 'Responded')}</option>
              <option value="converted">{__('Converted', 'Converted')}</option>
              <option value="closed">{__('Closed', 'Closed')}</option>
              <option value="spam">{__('Spam', 'Spam')}</option>
              <option value="trash">{__('Trash', 'Trash')}</option>
            </Select>

            {/* Sort By */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="created_at">{__('Date', 'Date')}</option>
              <option value="name">{__('Name', 'Name')}</option>
              <option value="email">{__('Email', 'Email')}</option>
              <option value="trip_title">{__('Trip', 'Trip')}</option>
              <option value="status">{__('Status', 'Status')}</option>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 flex items-center gap-1.5"
              title={sortOrder === 'asc' ? __('Ascending', 'Ascending') : __('Descending', 'Descending')}
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              <span className="text-xs">{sortOrder === 'asc' ? __('Asc', 'Asc') : __('Desc', 'Desc')}</span>
            </Button>

            {/* Reset Button */}
            {hasFilters && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {__('Reset', 'Reset')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions toolbar - shared component */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        bulkAction={bulkAction}
        setBulkAction={setBulkAction}
        onApply={handleBulkApply}
        onClearSelection={() => setSelectedIds([])}
        statusFilter={statusFilter}
        setStatusFilter={(value: string) => {
          setStatusFilter(value);
          setPage(1);
          setSelectedIds([]);
          setBulkAction('');
        }}
        statusOptions={[
          { key: 'all', label: __('All', 'All'), count: statusCounts.all },
          { key: 'new', label: __('New', 'New'), count: statusCounts.new },
          { key: 'pending', label: __('Pending', 'Pending'), count: statusCounts.pending },
          { key: 'responded', label: __('Responded', 'Responded'), count: statusCounts.responded },
          { key: 'converted', label: __('Converted', 'Converted'), count: statusCounts.converted },
          { key: 'closed', label: __('Closed', 'Closed'), count: statusCounts.closed },
          { key: 'spam', label: __('Spam', 'Spam'), count: statusCounts.spam },
          { key: 'trash', label: __('Trash', 'Trash'), count: statusCounts.trash },
        ]}
        showColumnsDropdown={showColumnsDropdown}
        setShowColumnsDropdown={setShowColumnsDropdown}
        columnOptions={columnOptions}
        onToggleColumn={toggleColumn}
        bulkMutationPending={deleteMutation.isPending}
        totalItems={enquiries.length}
        bulkActionOptions={bulkActionOptions}
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <SharedTable
            data={enquiries}
            columns={[
              visibleColumns.customer && {
                key: 'customer',
                label: __('Customer', 'Customer'),
                render: (enquiry: Enquiry) => (
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {enquiry.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {enquiry.email}
                      </div>
                      {enquiry.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {enquiry.phone}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
              visibleColumns.trip && {
                key: 'trip',
                label: __('Trip', 'Trip'),
                render: (enquiry: Enquiry) => (
                  enquiry.trip_title ? (
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{enquiry.trip_title}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                      {__('General Inquiry', 'General Inquiry')}
                    </span>
                  )
                ),
              },
              visibleColumns.message && {
                key: 'message',
                label: __('Message', 'Message'),
                render: (enquiry: Enquiry) => (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {enquiry.message}
                    </p>
                  </div>
                ),
              },
              visibleColumns.travelers && {
                key: 'travelers',
                label: __('Travelers', 'Travelers'),
                render: (enquiry: Enquiry) => (
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    {enquiry.travelers_count || '-'}
                  </span>
                ),
              },
              visibleColumns.preferred_date && {
                key: 'preferred_date',
                label: __('Preferred Date', 'Preferred Date'),
                render: (enquiry: Enquiry) => (
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {enquiry.travel_date ? formatDate(enquiry.travel_date) : '-'}
                  </span>
                ),
              },
              visibleColumns.status && {
                key: 'status',
                label: __('Status', 'Status'),
                render: (enquiry: Enquiry) => getStatusBadge(enquiry.status),
              },
              visibleColumns.date && {
                key: 'date',
                label: __('Date', 'Date'),
                render: (enquiry: Enquiry) => (
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {formatDate(enquiry.created_at)}
                  </span>
                ),
              },
            ].filter(Boolean)}
            actions={actions}
            isLoading={isLoading}
            isError={isEnquiriesError}
            errorText={__('Error loading enquiries')}
            errorDescription={__('We couldn\'t connect to the enquiries service. Please refresh or try again shortly.')}
            errorDetails={derivedErrorDetails}
            errorRequestInfo={errorContext.requestInfo}
            onRetry={() => refetch()}
            emptyText={__('No enquiries found')}
            emptyDescription={hasFilters
              ? __('Try adjusting your search or filter criteria to find what you\'re looking for.', 'Try adjusting your search or filter criteria to find what you\'re looking for.')
              : __('When customers submit enquiries, they will appear here.', 'When customers submit enquiries, they will appear here.')
            }
            onSort={handleSort}
            getSortIcon={getSortIcon}
            selectedItemIds={selectedIds}
            onSelectItem={(id: string | number, checked: boolean) => {
              if (checked) {
                setSelectedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
              } else {
                setSelectedIds(prev => prev.filter(existingId => existingId !== id));
              }
            }}
            onSelectAll={(checked: boolean) => {
              if (checked) {
                setSelectedIds(enquiries.map((e) => e.id));
              } else {
                setSelectedIds([]);
              }
            }}
            isAllSelected={enquiries.length > 0 && selectedIds.length === enquiries.length}
            getItemId={(enquiry: Enquiry) => enquiry.id}
            capability="yatra_view_bookings"
            skeletonRows={5}
          />
        </CardContent>
      </Card>

      {/* Pagination - shared component, no extra card background */}
      {total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={perPage}
          onPageChange={setPage}
          itemName={__('enquiries', 'enquiries')}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setEnquiryToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={__('Delete Enquiry', 'Delete Enquiry')}
        message={enquiryToDelete 
          ? __(`Are you sure you want to delete the enquiry from "${enquiryToDelete.name}"? This action cannot be undone.`, `Are you sure you want to delete the enquiry from "${enquiryToDelete.name}"? This action cannot be undone.`)
          : __('Are you sure you want to delete this enquiry?', 'Are you sure you want to delete this enquiry?')
        }
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Respond Dialog */}
      {respondDialogOpen && selectedEnquiry && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !respondMutation.isPending) {
              setRespondDialogOpen(false);
              setSelectedEnquiry(null);
            }
          }}
        >
          <Card className="w-full max-w-lg mx-4 shadow-xl bg-white dark:bg-gray-800">
            <CardHeader className="pb-3 bg-white dark:bg-gray-800 rounded-t-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1 text-blue-600 dark:text-blue-400">
                    <Send className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {__('Respond to Enquiry', 'Respond to Enquiry')}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {__('Send a response to', 'Send a response to')} <strong>{selectedEnquiry.name}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRespondDialogOpen(false);
                    setSelectedEnquiry(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  disabled={respondMutation.isPending}
                  aria-label={__('Close', 'Close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{selectedEnquiry.email}</span>
                </div>
                {selectedEnquiry.trip_title && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{selectedEnquiry.trip_title}</span>
                  </div>
                )}
                <div className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <strong>{__('Original Message:', 'Original Message:')}</strong>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">{selectedEnquiry.message}</p>
                </div>
              </div>

              {/* Response Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {__('Your Response', 'Your Response')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder={__('Type your response here...', 'Type your response here...')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={5}
                  disabled={respondMutation.isPending}
                />
              </div>

              {respondMutation.isError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {respondMutation.error?.message || __('Failed to send response. Please try again.', 'Failed to send response. Please try again.')}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRespondDialogOpen(false);
                    setSelectedEnquiry(null);
                  }}
                  disabled={respondMutation.isPending}
                >
                  {__('Cancel', 'Cancel')}
                </Button>
                <Button
                  onClick={sendResponse}
                  disabled={respondMutation.isPending || !responseMessage.trim()}
                >
                  {respondMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {__('Sending...', 'Sending...')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {__('Send Response', 'Send Response')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Enquiries;

