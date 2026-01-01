/**
 * View Enquiry Page
 * Display enquiry details in a clean, minimal SaaS-style design
 */

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Calendar, MessageSquare, Edit, ExternalLink, MapPin, Users, Send, Loader2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { apiService } from '../lib/api-client';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Badge } from '../components/ui/badge';
import { useNavigate } from '../hooks/useNavigate';
import { Skeleton } from '../components/ui/skeleton';
import { Modal } from '../components/ui/modal';
import { useToast } from '../components/ui/toast';

interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  trip_id?: number;
  trip_title?: string;
  trip_slug?: string;
  message: string;
  travelers_count?: number;
  travel_date?: string;
  status: 'new' | 'pending' | 'responded' | 'closed' | 'converted' | '' | string;
  created_at: string;
  responded_at?: string;
  response?: string;
}

const ViewEnquiry: React.FC = () => {
  const { can } = usePermissions();
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  // Get enquiry id from URL
  const enquiryId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') ? parseInt(params.get('id') || '0') : null;
  }, []);

  // Fetch enquiry data from API
  const { data: enquiry, isLoading, error } = useQuery<Enquiry | null>({
    queryKey: ['enquiry', enquiryId],
    queryFn: async () => {
      if (!enquiryId) return null;
      const response = await apiService.getEnquiry(enquiryId!);
      // Some endpoints return { success, data }, others return the object directly
      return (response as any)?.data ?? response;
    },
    enabled: !!enquiryId && can('yatra_view_bookings'),
  });

  // Respond mutation
  const respondMutation = useMutation({
    mutationFn: async ({ id, message }: { id: number; message: string }) => {
      return await apiService.respondToEnquiry(id, { response: message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiry', enquiryId] });
      setRespondDialogOpen(false);
      setResponseMessage('');
      showToast(__('Response sent successfully.', 'Response sent successfully.'), 'success');
    },
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

  const handleRespond = () => {
    setResponseMessage('');
    setRespondDialogOpen(true);
  };

  const sendResponse = () => {
    if (enquiryId && responseMessage.trim()) {
      respondMutation.mutate({
        id: enquiryId,
        message: responseMessage,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__('Enquiry Details', 'Enquiry Details')}
          actions={
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          }
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <Skeleton className="h-3 w-32 mb-2" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-36 mb-2" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-5 w-40" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
              <div className="flex items-center gap-2">
                {enquiry.status !== 'responded' && enquiry.status !== 'closed' && (
                  <Button 
                    variant="outline" 
                    onClick={handleRespond} 
                    className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
                  >
                    <Send className="w-4 h-4" />
                    {__('Send Response', 'Send Response')}
                  </Button>
                )}
                <Button onClick={handleEdit} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  {__('Edit Enquiry', 'Edit Enquiry')}
                </Button>
              </div>
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
                  {enquiry.travelers_count && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {__('Number of Travelers', 'Number of Travelers')}
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {enquiry.travelers_count}
                        </p>
                      </div>
                    </div>
                  )}
                  {enquiry.travel_date && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {__('Preferred Travel Date', 'Preferred Travel Date')}
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(enquiry.travel_date)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {enquiry.response && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                      {__('Response', 'Response')}
                    </label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {enquiry.response}
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

      {/* Respond Dialog via shared Modal */}
      <Modal
        isOpen={respondDialogOpen && !!enquiry}
        onClose={() => {
          if (!respondMutation.isPending) setRespondDialogOpen(false);
        }}
        title={__('Respond to Enquiry', 'Respond to Enquiry')}
        description={
          enquiry ? (
            <span>
              {__('Send a response to', 'Send a response to')} <strong>{enquiry.name}</strong>
            </span>
          ) : null
        }
        size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setRespondDialogOpen(false)}
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
        }
      >
        {enquiry && (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{enquiry.email}</span>
              </div>
              {enquiry.trip_title && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{enquiry.trip_title}</span>
                </div>
              )}
              <div className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <strong>{__('Original Message:', 'Original Message:')}</strong>
                <p className="mt-1 text-gray-600 dark:text-gray-400">{enquiry.message}</p>
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewEnquiry;

