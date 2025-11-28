/**
 * Enquiries Page
 * Clean, minimal SaaS-style enquiries management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2, Mail, Phone, MessageSquare, MapPin, Send, Loader2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Badge } from '../components/ui/badge';
import { useNavigate } from '../hooks/useNavigate';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Skeleton } from '../components/ui/skeleton';

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
  status: 'new' | 'responded' | 'closed' | 'converted' | 'pending';
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

  // Fetch enquiries from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['enquiries', queryParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      
      const baseUrl = window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1';
      const response = await fetch(`${baseUrl}/enquiries?${params.toString()}`, {
        headers: {
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch enquiries');
      }
      
      const result = await response.json();
      
      return {
        data: result.data || [],
        total: result.meta?.total || result.total || 0,
        page: result.meta?.page || result.page || 1,
        per_page: result.meta?.per_page || result.per_page || 10,
      };
    },
    enabled: can('yatra_view_bookings'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const baseUrl = window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1';
      const response = await fetch(`${baseUrl}/enquiries/${id}`, {
        method: 'DELETE',
        headers: {
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete enquiry');
      }
      
      return response.json();
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
      const baseUrl = window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1';
      const res = await fetch(`${baseUrl}/enquiries/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.yatraAdmin?.nonce || '',
        },
        body: JSON.stringify({ response: message }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to send response');
      }
      
      return res.json();
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
  const totalPages = Math.ceil(total / 10);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

      <ConditionalRender capability="yatra_view_bookings">
        {/* Table */}
        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              {__('Error loading enquiries', 'Error loading enquiries')}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">{__('Customer', 'Customer')}</TableHead>
                        <TableHead>{__('Trip', 'Trip')}</TableHead>
                        <TableHead className="w-[300px]">{__('Message', 'Message')}</TableHead>
                        <TableHead>{__('Travelers', 'Travelers')}</TableHead>
                        <TableHead>{__('Preferred Date', 'Preferred Date')}</TableHead>
                        <TableHead>{__('Status', 'Status')}</TableHead>
                        <TableHead>{__('Date', 'Date')}</TableHead>
                        <TableHead className="text-right w-[150px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-40" />
                              <Skeleton className="h-3 w-28" />
                            </div>
                          </TableCell>
                          <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Skeleton className="h-8 w-8 rounded" />
                              <Skeleton className="h-8 w-8 rounded" />
                              <Skeleton className="h-8 w-8 rounded" />
                              <Skeleton className="h-8 w-8 rounded" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : enquiries.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {__('No enquiries found', 'No enquiries found')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                      {hasFilters 
                        ? __('Try adjusting your search or filter criteria to find what you\'re looking for.', 'Try adjusting your search or filter criteria to find what you\'re looking for.')
                        : __('When customers submit enquiries, they will appear here.', 'When customers submit enquiries, they will appear here.')
                      }
                    </p>
                    {hasFilters && (
                      <Button
                        variant="outline"
                        onClick={handleResetFilters}
                        className="mt-4"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {__('Clear Filters', 'Clear Filters')}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Customer', 'Customer')}
                            {getSortIcon('name')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('trip_title')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Trip', 'Trip')}
                            {getSortIcon('trip_title')}
                          </button>
                        </TableHead>
                        <TableHead className="w-[300px]">
                          {__('Message', 'Message')}
                        </TableHead>
                        <TableHead>
                          {__('Travelers', 'Travelers')}
                        </TableHead>
                        <TableHead>
                          {__('Preferred Date', 'Preferred Date')}
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('status')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Status', 'Status')}
                            {getSortIcon('status')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('created_at')}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {__('Date', 'Date')}
                            {getSortIcon('created_at')}
                          </button>
                        </TableHead>
                        <TableHead className="text-right w-[120px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enquiries.map((enquiry) => (
                        <TableRow key={enquiry.id}>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>
                            {enquiry.trip_title ? (
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{enquiry.trip_title}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                                {__('General Inquiry', 'General Inquiry')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {enquiry.message}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                            {enquiry.travelers_count || '-'}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {enquiry.travel_date ? formatDate(enquiry.travel_date) : '-'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(enquiry.status)}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatDate(enquiry.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ConditionalRender capability="yatra_view_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(enquiry)}
                                  className="h-8 w-8"
                                  aria-label={__('View enquiry', 'View enquiry')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_edit_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRespond(enquiry)}
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  aria-label={__('Respond to enquiry', 'Respond to enquiry')}
                                  title={__('Send response email', 'Send response email')}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_edit_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(enquiry)}
                                  className="h-8 w-8"
                                  aria-label={__('Edit enquiry', 'Edit enquiry')}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>

                              <ConditionalRender capability="yatra_delete_bookings">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(enquiry)}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  aria-label={__('Delete enquiry', 'Delete enquiry')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </ConditionalRender>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Pagination - Always Visible */}
            {total > 0 && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {__('Showing', 'Showing')} <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * 10 + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * 10, total)}</span> {__('of', 'of')} <span className="font-medium text-gray-900 dark:text-white">{total}</span> {__('enquiries', 'enquiries')}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-8"
                      >
                        {__('Previous', 'Previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="h-8"
                      >
                        {__('Next', 'Next')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </ConditionalRender>

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

