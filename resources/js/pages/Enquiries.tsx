/**
 * Enquiries Page
 * Clean, minimal SaaS-style enquiries management page
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2, Mail, Phone, MessageSquare, MapPin } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Badge } from '../components/ui/badge';
import { useNavigate } from '../hooks/useNavigate';

interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  trip_title?: string;
  trip_id?: number;
  message: string;
  number_of_travelers?: number;
  preferred_travel_date?: string;
  status: 'new' | 'responded' | 'closed' | 'converted';
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

  // Fetch enquiries with dummy data
  const { data, isLoading, error } = useQuery({
    queryKey: ['enquiries', queryParams],
    queryFn: async () => {
      // return await apiClient.get('/yatra/v1/enquiries', { params: queryParams });
      // Dummy data
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
      };

      const allEnquiries: Enquiry[] = [
        {
          id: 1,
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '+1 234-567-8900',
          trip_title: 'Everest Base Camp Trek',
          trip_id: 1,
          message: 'I am interested in booking the Everest Base Camp Trek for 2 people. Can you provide more details about the itinerary and pricing?',
          number_of_travelers: 2,
          preferred_travel_date: '2026-04-15',
          status: 'new',
          created_at: getDate(2),
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          email: 'sarah.j@example.com',
          phone: '+1 345-678-9012',
          trip_title: 'Annapurna Circuit Trek',
          trip_id: 2,
          message: 'Looking for information about the Annapurna Circuit Trek. What is the best time to visit?',
          number_of_travelers: 1,
          preferred_travel_date: '2026-05-20',
          status: 'responded',
          created_at: getDate(5),
          responded_at: getDate(4),
          response_notes: 'Sent detailed information about the trek and best seasons.',
        },
        {
          id: 3,
          name: 'Michael Chen',
          email: 'm.chen@example.com',
          phone: '+86 138-0013-8000',
          trip_title: 'Kathmandu City Tour',
          trip_id: 9,
          message: 'I would like to book a single day city tour. What are the available dates?',
          number_of_travelers: 4,
          preferred_travel_date: '2026-03-10',
          status: 'converted',
          created_at: getDate(10),
          responded_at: getDate(9),
          response_notes: 'Customer booked the tour.',
        },
        {
          id: 4,
          name: 'Emma Williams',
          email: 'emma.w@example.com',
          phone: '+44 20-7946-0958',
          trip_title: 'Langtang Valley Trek',
          trip_id: 3,
          message: 'Interested in Langtang Valley Trek for a group of 6 people. Need custom itinerary.',
          number_of_travelers: 6,
          preferred_travel_date: '2026-06-01',
          status: 'new',
          created_at: getDate(1),
        },
        {
          id: 5,
          name: 'David Brown',
          email: 'd.brown@example.com',
          phone: '+61 2-9374-4000',
          message: 'General inquiry about Nepal travel packages. Looking for recommendations.',
          number_of_travelers: 2,
          preferred_travel_date: '2026-07-15',
          status: 'responded',
          created_at: getDate(8),
          responded_at: getDate(7),
          response_notes: 'Recommended several packages based on preferences.',
        },
        {
          id: 6,
          name: 'Lisa Anderson',
          email: 'lisa.a@example.com',
          phone: '+1 456-789-0123',
          trip_title: 'Chitwan National Park Safari',
          trip_id: 4,
          message: 'Want to know about the Chitwan Safari package. What animals can we see?',
          number_of_travelers: 3,
          preferred_travel_date: '2026-04-20',
          status: 'closed',
          created_at: getDate(15),
          responded_at: getDate(14),
          response_notes: 'Customer decided to book with another company.',
        },
        {
          id: 7,
          name: 'Robert Taylor',
          email: 'r.taylor@example.com',
          phone: '+1 567-890-1234',
          trip_title: 'Manaslu Circuit Trek',
          trip_id: 5,
          message: 'Interested in Manaslu Circuit Trek. Need permit information and pricing.',
          number_of_travelers: 2,
          preferred_travel_date: '2026-05-10',
          status: 'new',
          created_at: getDate(0),
        },
        {
          id: 8,
          name: 'Maria Garcia',
          email: 'maria.g@example.com',
          phone: '+34 91-123-4567',
          trip_title: 'Upper Mustang Trek',
          trip_id: 6,
          message: 'Looking for Upper Mustang Trek details. What is included in the package?',
          number_of_travelers: 1,
          preferred_travel_date: '2026-08-01',
          status: 'responded',
          created_at: getDate(3),
          responded_at: getDate(2),
          response_notes: 'Sent complete package details and inclusions.',
        },
      ];

      // Apply filters
      let filtered = allEnquiries;
      if (searchTerm) {
        filtered = filtered.filter(enquiry =>
          enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.trip_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.message.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter(enquiry => enquiry.status === statusFilter);
      }

      // Apply sorting
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'email':
            aValue = a.email.toLowerCase();
            bValue = b.email.toLowerCase();
            break;
          case 'trip_title':
            aValue = a.trip_title?.toLowerCase() || '';
            bValue = b.trip_title?.toLowerCase() || '';
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'created_at':
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          default:
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      // Apply pagination
      const start = (page - 1) * 10;
      const end = start + 10;
      const paginated = filtered.slice(start, end);

      return {
        data: paginated,
        total: filtered.length,
        page,
        per_page: 10,
      };
    },
    enabled: can('yatra_view_bookings'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (_id: number) => {
      // return await apiClient.delete(`/yatra/v1/enquiries/${_id}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
    },
  });

  const enquiries = data?.data || [];
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
    if (confirm(__('Are you sure you want to delete this enquiry?', 'Are you sure you want to delete this enquiry?'))) {
      deleteMutation.mutate(enquiry.id);
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
                className="pl-9 h-9"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 h-9"
            >
              <option value="all">{__('All Status', 'All Status')}</option>
              <option value="new">{__('New', 'New')}</option>
              <option value="responded">{__('Responded', 'Responded')}</option>
              <option value="converted">{__('Converted', 'Converted')}</option>
              <option value="closed">{__('Closed', 'Closed')}</option>
            </Select>

            {/* Sort By */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-40 h-9"
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
              className="h-9 px-3 flex items-center gap-1.5"
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
                className="flex items-center gap-2 h-9"
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
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {__('Loading enquiries...', 'Loading enquiries...')}
                  </div>
                ) : enquiries.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {__('No enquiries found', 'No enquiries found')}
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
                            {enquiry.number_of_travelers || '-'}
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {enquiry.preferred_travel_date ? formatDate(enquiry.preferred_travel_date) : '-'}
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
    </div>
  );
};

export default Enquiries;

