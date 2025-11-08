/**
 * View Enquiry Page
 * Display enquiry details in a clean, minimal SaaS-style design
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Mail, Phone, Calendar, MessageSquare, Edit, ExternalLink, MapPin, Users } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Badge } from '../components/ui/badge';
import { useNavigate } from '../hooks/useNavigate';

const ViewEnquiry: React.FC = () => {
  const { can } = usePermissions();
  const { navigate } = useNavigate();

  // Get enquiry id from URL
  const enquiryId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  // Fetch enquiry data
  const { data: enquiry, isLoading, error } = useQuery({
    queryKey: ['enquiry', enquiryId],
    queryFn: async () => {
      if (!enquiryId) return null;
      // return await apiClient.get(`/yatra/v1/enquiries/${enquiryId}`);
      // Dummy data
      const today = new Date();
      const getDate = (days: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
      };

      return {
        id: enquiryId,
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1 234-567-8900',
        trip_id: 1,
        trip_title: 'Everest Base Camp Trek',
        message: 'I am interested in booking the Everest Base Camp Trek for 2 people. Can you provide more details about the itinerary and pricing? I would like to know about the accommodation, meals, and what is included in the package.',
        number_of_travelers: 2,
        preferred_travel_date: '2026-04-15',
        status: 'new',
        created_at: getDate(2),
        responded_at: null,
        response_notes: null,
      };
    },
    enabled: !!enquiryId && can('yatra_view_bookings'),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
      <Badge className={`text-sm ${statusInfo.className}`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const handleBack = () => {
    navigate({ subpage: 'enquiries' });
  };

  const handleEdit = () => {
    if (enquiryId) {
      navigate({ subpage: 'enquiries', action: 'edit', id: enquiryId });
    }
  };

  const handleViewTrip = () => {
    if (enquiry?.trip_id) {
      navigate({ subpage: 'trips', tab: 'all', action: 'edit', id: enquiry.trip_id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !enquiry) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__('Enquiry Not Found', 'Enquiry Not Found')}
          actions={
            <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {__('Back to Enquiries', 'Back to Enquiries')}
            </Button>
          }
        />
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            {__('Enquiry not found or you do not have permission to view it.', 'Enquiry not found or you do not have permission to view it.')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Enquiry Details', 'Enquiry Details')}
        description={__('View complete enquiry information', 'View complete enquiry information')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {__('Back', 'Back')}
            </Button>
            <ConditionalRender capability="yatra_edit_bookings">
              <Button onClick={handleEdit} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                {__('Edit Enquiry', 'Edit Enquiry')}
              </Button>
            </ConditionalRender>
          </div>
        }
      />

      <ConditionalRender capability="yatra_view_bookings">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-3">
            {/* Enquiry Information */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{__('Enquiry Information', 'Enquiry Information')}</CardTitle>
                  {getStatusBadge(enquiry.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                    {__('Message', 'Message')}
                  </label>
                  <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap flex-1">
                      {enquiry.message}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {enquiry.number_of_travelers && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {__('Number of Travelers', 'Number of Travelers')}
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {enquiry.number_of_travelers}
                        </p>
                      </div>
                    </div>
                  )}
                  {enquiry.preferred_travel_date && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {__('Preferred Travel Date', 'Preferred Travel Date')}
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(enquiry.preferred_travel_date)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {enquiry.response_notes && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                      {__('Response Notes', 'Response Notes')}
                    </label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {enquiry.response_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trip Information */}
            {enquiry.trip_title && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{__('Related Trip', 'Related Trip')}</CardTitle>
                    {enquiry.trip_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleViewTrip}
                        className="flex items-center gap-1.5 text-sm"
                      >
                        {__('View Trip', 'View Trip')}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__('Trip', 'Trip')}
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {enquiry.trip_title}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Customer Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Customer', 'Customer')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {enquiry.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{enquiry.email}</span>
                </div>
                {enquiry.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{enquiry.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enquiry Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{__('Timeline', 'Timeline')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {__('Submitted', 'Submitted')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(enquiry.created_at)}
                  </p>
                </div>
                {enquiry.responded_at && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {__('Responded', 'Responded')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatDate(enquiry.responded_at)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ConditionalRender>
    </div>
  );
};

export default ViewEnquiry;

