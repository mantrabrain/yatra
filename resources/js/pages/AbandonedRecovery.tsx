/**
 * Abandoned Booking Recovery Page
 * 
 * Premium module for tracking and recovering abandoned bookings.
 * This page displays the UI shell in the free plugin with a premium gate.
 * The actual functionality is provided by the Yatra Pro plugin.
 * 
 * @package Yatra
 * @since 3.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Toggle } from '../components/ui/toggle';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Modal } from '../components/ui/modal';
import { Skeleton } from '../components/ui/skeleton';
import { PageHeader } from '../components/common/PageHeader';
import { Pagination, SearchFilterToolbar, BulkActionToolbar, Table as SharedTable } from '../components/shared';
import { useToast } from '../components/ui/toast';
import { __ } from '../lib/i18n';
import { getCurrencySymbol, getCurrency } from '../data/currencies';
import { 
  Mail, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  Shield,
  Zap,
  BarChart,
  Settings,
  Send,
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react';

// Skeleton components
const SkeletonStatCard = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </CardContent>
  </Card>
);

const SkeletonBookingCard = () => (
  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
    <div className="flex-1">
      <Skeleton className="h-5 w-40 mb-2" />
      <Skeleton className="h-4 w-48 mb-1" />
      <Skeleton className="h-4 w-32" />
    </div>
    <div className="text-right mr-4">
      <Skeleton className="h-5 w-20 mb-1" />
      <Skeleton className="h-4 w-24" />
    </div>
    <Skeleton className="h-6 w-20 mr-4" />
    <Skeleton className="h-9 w-28" />
  </div>
);

// Check if module is available (Pro active and module enabled)
const isModuleAvailable = (): boolean => {
  const yatraAdmin = (window as any)?.yatraAdmin;
  return Boolean(yatraAdmin?.isPro);
};

// Premium Upgrade Card Component
const PremiumUpgradeCard: React.FC = () => {
  const features = [
    {
      icon: Mail,
      title: __('Automated Email Campaigns'),
      description: __('Send 3-tier recovery emails automatically with customizable templates and timing.')
    },
    {
      icon: TrendingUp,
      title: __('Recovery Analytics'),
      description: __('Track recovery rates, revenue recovered, and email performance metrics.')
    },
    {
      icon: DollarSign,
      title: __('Revenue Recovery'),
      description: __('Win back lost sales with targeted email sequences and secure recovery links.')
    },
    {
      icon: Users,
      title: __('Customer Insights'),
      description: __('Understand why customers abandon bookings and optimize your conversion funnel.')
    },
    {
      icon: Shield,
      title: __('Secure Recovery Links'),
      description: __('Token-based secure links that restore booking sessions safely.')
    },
    {
      icon: Zap,
      title: __('Real-time Tracking'),
      description: __('Automatic tracking of abandoned bookings with session persistence.')
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {__('Abandoned Booking Recovery')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {__('Recover lost sales by automatically tracking abandoned bookings and sending targeted email sequences.')}
        </p>
      </div>

      {/* Stats Preview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{__('Recovery Rate')}</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">23%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{__('Revenue Recovered')}</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">$12.5K</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{__('Emails Sent')}</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">1,234</p>
              </div>
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{__('Abandoned')}</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">156</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How It Works */}
      <Card className="mb-12 border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-2xl">{__('How It Works')}</CardTitle>
          <CardDescription>
            {__('Automated recovery process in 4 simple steps')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold mb-2">{__('1. Track')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__('Automatically track when customers start but don\'t complete bookings')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold mb-2">{__('2. Email')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__('Send personalized recovery emails at optimal times (1hr, 24hr, 48hr)')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold mb-2">{__('3. Recover')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__('Customers click secure links to complete their bookings')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mx-auto mb-4">
                <BarChart className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="font-semibold mb-2">{__('4. Analyze')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__('Track recovery rates and optimize your email campaigns')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">
                {__('Ready to Recover Lost Revenue?')}
              </h3>
              <p className="text-purple-100">
                {__('Upgrade to Yatra Pro to unlock Abandoned Booking Recovery and start winning back customers.')}
              </p>
            </div>
            <Button 
              size="lg"
              className="bg-white text-purple-600 hover:bg-purple-50"
              onClick={() => window.open('https://wpyatra.com/pricing?module=abandoned-booking-recovery', '_blank')}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {__('Upgrade to Pro')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Currency formatting helper
const formatPrice = (price: number, currencyCode?: string): string => {
  const globalCurrency = (window as any)?.yatraAdmin?.currency || 'USD';
  const currency = currencyCode || globalCurrency;
  
  const symbol = getCurrencySymbol(currency);
  const currencyData = getCurrency(currency);
  const decimals = currencyData?.decimalDigits ?? 2;
  
  return `${symbol}${Number(price).toFixed(decimals)}`;
};

// Main Component
const AbandonedRecoveryPage: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  // Check URL parameters for action and id
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  const bookingId = urlParams.get('id');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'settings'>('dashboard');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [settings, setSettings] = useState({
    enabled: true,
    tracking_enabled: true,
    first_email_delay_hours: 1,
    second_email_delay_hours: 24,
    final_email_delay_hours: 72,
    first_email_subject: '',
    second_email_subject: '',
    final_email_subject: '',
    first_email_message: '',
    second_email_message: '',
    final_email_message: '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Email preview state
  const [emailPreview, setEmailPreview] = useState<{
    isOpen: boolean;
    type: 'first' | 'second' | 'final';
    subject: string;
    message: string;
  }>({ isOpen: false, type: 'first', subject: '', message: '' });

  // Function to replace placeholders with sample data
  const replaceEmailPlaceholders = (text: string): string => {
    const placeholders: Record<string, string> = {
      '{customer_name}': 'John Doe',
      '{trip_name}': 'Everest Base Camp Trek',
      '{trip_url}': 'https://example.com/trips/everest-base-camp',
      '{booking_amount}': '$2,500',
      '{departure_date}': 'March 15, 2025',
      '{recovery_link}': 'https://example.com/complete-booking?token=abc123',
      '{site_name}': 'Yatra Travel',
      '{site_url}': 'https://example.com',
    };

    let result = text;
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });
    return result;
  };

  // Function to show email preview
  const showEmailPreview = (type: 'first' | 'second' | 'final') => {
    const subjectKey = `${type}_email_subject` as keyof typeof settings;
    const messageKey = `${type}_email_message` as keyof typeof settings;
    
    setEmailPreview({
      isOpen: true,
      type,
      subject: replaceEmailPlaceholders(String(settings[subjectKey] || '')),
      message: replaceEmailPlaceholders(String(settings[messageKey] || '')),
    });
  };

  // Check if module is available
  if (!isModuleAvailable()) {
    return <PremiumUpgradeCard />;
  }

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    return params;
  }, [searchTerm, statusFilter, page, perPage]);

  // Fetch abandoned bookings
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['abandoned-bookings', queryParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
      
      const response = await fetch(`/wp-json/yatra/v1/abandoned-bookings?${params}`, {
        headers: {
          'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '',
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
  });

  // Fetch single booking details if viewing
  const { data: bookingDetailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['abandoned-booking-details', bookingId],
    queryFn: async () => {
      const response = await fetch(`/wp-json/yatra/v1/abandoned-bookings/${bookingId}`, {
        headers: {
          'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '',
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch booking details');
      return response.json();
    },
    enabled: action === 'view' && !!bookingId,
  });

  // Fetch settings
  const { data: settingsData } = useQuery({  
    queryKey: ['abandoned-recovery-settings'],
    queryFn: async () => {
      const response = await fetch('/wp-json/yatra/v1/abandoned-bookings/settings', {
        headers: {
          'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '',
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  // Populate settings when data loads
  useEffect(() => {
    if (settingsData?.data) {
      setSettings(settingsData.data);
    }
  }, [settingsData]);

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['abandoned-statistics'],
    queryFn: async () => {
      const response = await fetch('/wp-json/yatra/v1/abandoned-bookings/statistics', {
        headers: {
          'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '',
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch statistics');
      return response.json();
    },
  });

  // Send recovery email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/wp-json/yatra/v1/abandoned-bookings/${id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '',
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to send email');
      return response.json();
    },
    onSuccess: () => {
      showToast(__('Recovery email sent successfully'), 'success');
      queryClient.invalidateQueries({ queryKey: ['abandoned-bookings'] });
    },
    onError: () => {
      showToast(__('Failed to send recovery email'), 'error');
    },
  });

  const stats = statsData?.data || {};
  const bookings = bookingsData?.data || [];
  const pagination = bookingsData?.pagination || { total: 0, current_page: 1, total_pages: 1, per_page: perPage };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: (string | number)[]) => {
      const deletePromises = ids.map(id => 
        fetch(`/wp-json/yatra/v1/abandoned-bookings/${id}`, {
          method: 'DELETE',
          headers: {
            'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '',
          },
          credentials: 'include',
        })
      );
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned-bookings'] });
      setSelectedIds([]);
      showToast(__('Bookings deleted successfully'), 'success');
    },
    onError: () => {
      showToast(__('Failed to delete bookings'), 'error');
    }
  });

  // Helper functions
  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__('Select a bulk action first'), 'warning');
      return;
    }

    if (selectedIds.length === 0) {
      showToast(__('Select at least one booking'), 'warning');
      return;
    }

    if (bulkAction === 'delete') {
      setConfirmDialog({
        isOpen: true,
        title: __('Delete Bookings'),
        message: __('Are you sure you want to delete {count} booking(s)?').replace('{count}', selectedIds.length.toString()),
        onConfirm: () => {
          deleteMutation.mutate(selectedIds);
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      });
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPage(1);
    setSelectedIds([]);
    setBulkAction('');
  };

  const hasFilters = Boolean(searchTerm || statusFilter !== 'all');

  const viewFilters = [
    { key: 'all', label: __('All'), count: pagination.total },
    { key: 'abandoned', label: __('Abandoned'), count: 0 },
    { key: 'contacted', label: __('Contacted'), count: 0 },
    { key: 'recovered', label: __('Recovered'), count: 0 },
    { key: 'expired', label: __('Expired'), count: 0 },
  ];

  // Column definitions for SharedTable
  const columns = [
    {
      key: 'customer',
      label: __('Customer'),
      render: (booking: any) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {booking.customer_name || __('Unknown')}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {booking.customer_email}
          </div>
        </div>
      )
    },
    {
      key: 'trip',
      label: __('Trip'),
      render: (booking: any) => {
        const tripBase = (window as any)?.yatraAdmin?.tripBase || 'trip';
        const siteUrl = (window as any)?.yatraAdmin?.siteUrl || '';
        const tripUrl = booking.trip_slug 
          ? `${siteUrl}/${tripBase}/${booking.trip_slug}`
          : `${siteUrl}/?p=${booking.trip_id}`;
        
        return (
          <div className="text-sm">
            <a 
              href={tripUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium"
            >
              {booking.trip_name}
            </a>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              ID: {booking.trip_id}
            </div>
          </div>
        );
      }
    },
    {
      key: 'amount',
      label: __('Amount'),
      render: (booking: any) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {formatPrice(booking.total_amount)}
        </div>
      )
    },
    {
      key: 'emails_sent',
      label: __('Emails Sent'),
      render: (booking: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {booking.recovery_emails_sent || 0}
        </span>
      )
    },
    {
      key: 'status',
      label: __('Status'),
      render: (booking: any) => (
        <Badge variant={booking.status === 'recovered' ? 'success' : 'default'}>
          {booking.status}
        </Badge>
      )
    },
    {
      key: 'date',
      label: __('Date'),
      render: (booking: any) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(booking.created_at).toLocaleDateString()}
        </div>
      )
    }
  ];

  // Static actions array for SharedTable
  const actions = [
    {
      key: 'view',
      label: __('View Details'),
      icon: <Eye className="w-4 h-4" />,
      onClick: (item: any) => {
        // Navigate to details page
        window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=yatra-abandoned-recovery&action=view&id=${item.id}`;
      }
    },
    {
      key: 'send-email',
      label: __('Send Email'),
      icon: <Send className="w-4 h-4" />,
      onClick: (item: any) => {
        setConfirmDialog({
          isOpen: true,
          title: __('Send Recovery Email'),
          message: __('Are you sure you want to send a recovery email to {email}?').replace('{email}', item.customer_email),
          onConfirm: () => {
            sendEmailMutation.mutate(item.id);
            setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          }
        });
      },
      condition: (item: any) => item.status !== 'recovered'
    },
    {
      key: 'delete',
      label: __('Delete'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (item: any) => {
        setConfirmDialog({
          isOpen: true,
          title: __('Delete Booking'),
          message: __('Are you sure you want to delete this abandoned booking?'),
          onConfirm: () => {
            deleteMutation.mutate([item.id]);
            setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          }
        });
      },
      variant: 'destructive' as const
    }
  ];

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const response = await fetch('/wp-json/yatra/v1/abandoned-bookings/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': (window as any)?.yatraAdmin?.nonce || '',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      showToast(__('Settings saved successfully'), 'success');
      queryClient.invalidateQueries({ queryKey: ['abandoned-recovery-settings'] });
      setIsSavingSettings(false);
    },
    onError: () => {
      showToast(__('Failed to save settings'), 'error');
      setIsSavingSettings(false);
    },
  });

  const handleSaveSettings = () => {
    setIsSavingSettings(true);
    saveSettingsMutation.mutate(settings);
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // If viewing a specific booking, show details page
  if (action === 'view' && bookingId) {
    const booking = bookingDetailsData?.data;
    
    if (isLoadingDetails) {
      return (
        <div className="space-y-6">
          <PageHeader
            title={__('Loading Booking Details...')}
            description=""
          />
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!booking) {
      return (
        <div className="space-y-6">
          <PageHeader
            title={__('Booking Not Found')}
            description=""
          />
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">{__('The booking you are looking for does not exist.')}</p>
              <Button 
                className="mt-4"
                onClick={() => window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=yatra-abandoned-recovery`}
              >
                {__('Back to Abandoned Bookings')}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title={__('Abandoned Booking Details')}
          description={`Booking ID: ${booking.id}`}
          actions={
            <Button 
              variant="outline"
              onClick={() => window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=yatra-abandoned-recovery`}
            >
              {__('Back to List')}
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>{__('Customer Information')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">{__('Name')}</Label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {booking.customer_name || __('Unknown')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">{__('Email')}</Label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {booking.customer_email}
                    </p>
                  </div>
                  {booking.customer_phone && (
                    <div>
                      <Label className="text-sm text-gray-500 dark:text-gray-400">{__('Phone')}</Label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {booking.customer_phone}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trip Information */}
            <Card>
              <CardHeader>
                <CardTitle>{__('Trip Information')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">{__('Trip Name')}</Label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {booking.trip_name}
                    </p>
                  </div>
                  {booking.departure_date && (
                    <div>
                      <Label className="text-sm text-gray-500 dark:text-gray-400">{__('Departure Date')}</Label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {new Date(booking.departure_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">{__('Travelers')}</Label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {booking.travelers_count || 1}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">{__('Total Amount')}</Label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {formatPrice(booking.total_amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Data */}
            {booking.booking_data && (
              <Card>
                <CardHeader>
                  <CardTitle>{__('Additional Details')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                      {JSON.stringify(booking.booking_data, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>{__('Booking Status')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-500 dark:text-gray-400">{__('Status')}</Label>
                  <div className="mt-1">
                    <Badge variant={booking.status === 'recovered' ? 'success' : 'default'}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500 dark:text-gray-400">{__('Recovery Emails Sent')}</Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {booking.recovery_emails_sent || 0}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500 dark:text-gray-400">{__('Created At')}</Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {new Date(booking.created_at).toLocaleString()}
                  </p>
                </div>
                {booking.last_email_sent_at && (
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">{__('Last Email Sent')}</Label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {new Date(booking.last_email_sent_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>{__('Actions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: __('Send Recovery Email'),
                      message: __('Are you sure you want to send a recovery email to {email}?').replace('{email}', booking.customer_email),
                      onConfirm: () => {
                        sendEmailMutation.mutate(booking.id);
                        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                      }
                    });
                  }}
                  disabled={booking.status === 'recovered' || sendEmailMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {__('Send Recovery Email')}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: __('Delete Booking'),
                      message: __('Are you sure you want to delete this abandoned booking?'),
                      onConfirm: () => {
                        deleteMutation.mutate([booking.id]);
                        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                        // Redirect after delete
                        setTimeout(() => {
                          window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=yatra-abandoned-recovery`;
                        }, 1000);
                      }
                    });
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {__('Delete Booking')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={__('Abandoned Booking Recovery')}
        description={__('Track and recover abandoned bookings with automated email campaigns')}
      />

      {/* Tabs with Action Button */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <BarChart className="w-5 h-5 inline-block mr-2" />
              {__('Dashboard')}
            </button>
            <button
            onClick={() => setActiveTab('bookings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <AlertCircle className="w-5 h-5 inline-block mr-2" />
            {__('Abandoned Bookings')}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Settings className="w-5 h-5 inline-block mr-2" />
            {__('Settings')}
          </button>
        </nav>
      </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{__('Total Abandoned')}</p>
                    <p className="text-3xl font-bold">{stats.total_abandoned || 0}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{__('Recovered')}</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.total_recovered || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{__('Recovery Rate')}</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.recovery_rate || 0}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{__('Revenue Recovered')}</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      ${(stats.total_recovered_value || 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Recent Abandoned Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>{__('Recent Abandoned Bookings')}</CardTitle>
              <CardDescription>{__('Latest bookings that were started but not completed')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <SkeletonBookingCard />
                  <SkeletonBookingCard />
                  <SkeletonBookingCard />
                  <SkeletonBookingCard />
                  <SkeletonBookingCard />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">{__('No abandoned bookings found')}</div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{booking.customer_name || __('Unknown Customer')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{booking.customer_email}</p>
                        <p className="text-sm text-gray-500">{booking.trip_name}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="font-semibold">{formatPrice(booking.total_amount)}</p>
                        <p className="text-sm text-gray-500">{booking.travelers_count} {__('travelers')}</p>
                      </div>
                      <Badge variant={booking.status === 'recovered' ? 'success' : 'default'}>
                        {booking.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-4"
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: __('Send Recovery Email'),
                            message: __('Are you sure you want to send a recovery email to {email}?').replace('{email}', booking.customer_email),
                            onConfirm: () => {
                              sendEmailMutation.mutate(booking.id);
                              setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                            }
                          });
                        }}
                        disabled={sendEmailMutation.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {__('Send Email')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-3">
          
          {/* Search and Filters */}
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
                  { value: "abandoned", label: __('Abandoned') },
                  { value: "contacted", label: __('Contacted') },
                  { value: "recovered", label: __('Recovered') },
                  { value: "expired", label: __('Expired') }
                ]}
                sortBy="created_at"
                onSortByChange={() => {}}
                sortOrder="desc"
                onSortOrderChange={() => {}}
                sortOptions={[
                  { value: "created_at", label: __('Date') },
                  { value: "customer_email", label: __('Email') }
                ]}
                onResetFilters={handleResetFilters}
                hasFilters={hasFilters}
                placeholder={__('Search by customer email...')}
              />
            </CardContent>
          </Card>

          {/* Bulk Actions Toolbar */}
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
            bulkMutationPending={deleteMutation.isPending}
            totalItems={bookings.length}
            bulkActionOptions={[
              { value: '', label: __('Bulk Actions') },
              { value: 'delete', label: __('Delete') }
            ]}
            showColumnsDropdown={false}
            setShowColumnsDropdown={() => {}}
            columnOptions={[]}
            onToggleColumn={() => {}}
          />

          {/* Table */}
          <Card className="overflow-visible">
            <CardContent className="p-0 overflow-visible">
              <SharedTable
                data={bookings}
                columns={columns}
                actions={actions}
                isLoading={isLoading}
                selectedItemIds={selectedIds}
                onSelectItem={(id, checked) => {
                  if (checked) {
                    setSelectedIds([...selectedIds, id]);
                  } else {
                    setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
                  }
                }}
                onSelectAll={(checked) => {
                  if (checked) {
                    setSelectedIds(bookings.map((b: any) => b.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                isAllSelected={selectedIds.length === bookings.length && bookings.length > 0}
                emptyText={__('No abandoned bookings found')}
                emptyDescription={__('Abandoned bookings will appear here when customers start but don\'t complete the booking process')}
              />
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <Pagination
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              onPageChange={setPage}
              totalItems={pagination.total}
              itemsPerPage={perPage}
            />
          )}

        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{__('General Settings')}</CardTitle>
              <CardDescription>{__('Configure abandoned booking tracking')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="tracking_enabled" className="text-base font-medium">
                    {__('Enable Tracking')}
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {__('Track when customers abandon the booking process')}
                  </p>
                </div>
                <Toggle
                  checked={settings.tracking_enabled}
                  onChange={(checked) => handleSettingChange('tracking_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Timing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{__('Email Timing')}</CardTitle>
              <CardDescription>{__('Configure when recovery emails are sent')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="first_email_delay">{__('First Email Delay (hours)')}</Label>
                <Input
                  id="first_email_delay"
                  type="number"
                  min="0"
                  value={settings.first_email_delay_hours}
                  onChange={(e) => handleSettingChange('first_email_delay_hours', parseInt(e.target.value))}
                  placeholder="1"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {__('Send first recovery email after this many hours')}
                </p>
              </div>

              <div>
                <Label htmlFor="second_email_delay">{__('Second Email Delay (hours)')}</Label>
                <Input
                  id="second_email_delay"
                  type="number"
                  min="0"
                  value={settings.second_email_delay_hours}
                  onChange={(e) => handleSettingChange('second_email_delay_hours', parseInt(e.target.value))}
                  placeholder="24"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {__('Send second recovery email after this many hours')}
                </p>
              </div>

              <div>
                <Label htmlFor="final_email_delay">{__('Final Email Delay (hours)')}</Label>
                <Input
                  id="final_email_delay"
                  type="number"
                  min="0"
                  value={settings.final_email_delay_hours}
                  onChange={(e) => handleSettingChange('final_email_delay_hours', parseInt(e.target.value))}
                  placeholder="72"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {__('Send final recovery email after this many hours')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Templates */}
          <Card>
            <CardHeader>
              <CardTitle>{__('Email Templates')}</CardTitle>
              <CardDescription>{__('Customize recovery email subjects and messages')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* First Email */}
              <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium">{__('First Recovery Email')}</h4>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="first_email_subject">{__('Subject')}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => showEmailPreview('first')}
                      className="h-8 mb-2"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {__('Preview')}
                    </Button>
                  </div>
                  <Input
                    id="first_email_subject"
                    value={settings.first_email_subject}
                    onChange={(e) => handleSettingChange('first_email_subject', e.target.value)}
                    placeholder={__('Complete Your Booking - {trip_name}')}
                  />
                </div>
                <div>
                  <Label htmlFor="first_email_message">{__('Message')}</Label>
                  <textarea
                    id="first_email_message"
                    value={settings.first_email_message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleSettingChange('first_email_message', e.target.value)}
                    rows={4}
                    placeholder={__('Hi {customer_name}, we noticed you started booking {trip_name}...')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {__('Available placeholders: {customer_name}, {trip_name}, {recovery_link}')}
                  </p>
                </div>
              </div>

              {/* Second Email */}
              <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium">{__('Second Recovery Email')}</h4>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="second_email_subject">{__('Subject')}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => showEmailPreview('second')}
                      className="h-8 mb-2"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {__('Preview')}
                    </Button>
                  </div>
                  <Input
                    id="second_email_subject"
                    value={settings.second_email_subject}
                    onChange={(e) => handleSettingChange('second_email_subject', e.target.value)}
                    placeholder={__('Still Interested? Complete Your Booking')}
                  />
                </div>
                <div>
                  <Label htmlFor="second_email_message">{__('Message')}</Label>
                  <textarea
                    id="second_email_message"
                    value={settings.second_email_message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleSettingChange('second_email_message', e.target.value)}
                    rows={4}
                    placeholder={__('Still interested in {trip_name}?')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Final Email */}
              <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium">{__('Final Recovery Email')}</h4>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="final_email_subject">{__('Subject')}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => showEmailPreview('final')}
                      className="h-8 mb-2"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {__('Preview')}
                    </Button>
                  </div>
                  <Input
                    id="final_email_subject"
                    value={settings.final_email_subject}
                    onChange={(e) => handleSettingChange('final_email_subject', e.target.value)}
                    placeholder={__('Last Chance - Your Booking Expires Soon')}
                  />
                </div>
                <div>
                  <Label htmlFor="final_email_message">{__('Message')}</Label>
                  <textarea
                    id="final_email_message"
                    value={settings.final_email_message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleSettingChange('final_email_message', e.target.value)}
                    rows={4}
                    placeholder={__('This is your last chance to complete your booking for {trip_name}')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              size="lg"
            >
              {isSavingSettings ? __('Saving...') : __('Save Settings')}
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />

      {/* Email Preview Modal */}
      <Modal
        isOpen={emailPreview.isOpen}
        onClose={() => setEmailPreview({ ...emailPreview, isOpen: false })}
        title={
          emailPreview.type === 'first' && __('First Recovery Email Preview') ||
          emailPreview.type === 'second' && __('Second Recovery Email Preview') ||
          emailPreview.type === 'final' && __('Final Recovery Email Preview')
        }
        description={__('This is how your email will look to customers. Placeholders are replaced with sample data.')}
        size="xl"
        showCloseButton={true}
        footer={
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setEmailPreview({ ...emailPreview, isOpen: false })}
            >
              {__('Close')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Email Subject */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{__('Subject:')}</Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white">{emailPreview.subject}</p>
            </div>
          </div>

          {/* Email Message */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{__('Message:')}</Label>
            <div className="mt-1 p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: emailPreview.message.replace(/\n/g, '<br>') }} />
              </div>
            </div>
          </div>

          {/* Available Placeholders */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {__('Available Placeholders:')}
            </Label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100">{'{customer_name}'}</code>
              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100">{'{trip_name}'}</code>
              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100">{'{booking_amount}'}</code>
              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100">{'{departure_date}'}</code>
              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100">{'{recovery_link}'}</code>
              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100">{'{site_name}'}</code>
            </div>
          </div>

          {/* Email Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              {__('Note: This preview uses sample data. Actual emails will contain customer-specific information.')}
            </p>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AbandonedRecoveryPage;
