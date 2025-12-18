/**
 * Dynamic Pricing Page
 * 
 * Premium module for intelligent price adjustments.
 * This page displays the UI shell in the free plugin with a premium gate.
 * The actual functionality is provided by the Yatra Pro plugin.
 * 
 * @package Yatra
 * @since 3.0.0
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { PageHeader } from '../components/common/PageHeader';
import { RuleTypeSelectionModal } from '../components/modals/RuleTypeSelectionModal';
import { Toggle } from '../components/ui/toggle';
import { useToast } from '../components/ui/toast';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { Table as SharedTable } from '../components/shared/Table';
import { SearchFilterToolbar, BulkActionToolbar } from '../components/shared';
import { apiClient } from '../lib/api';
import { __ } from '../lib/i18n';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Users,
  Package,
  Clock,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Zap,
  BarChart,
  Settings,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Sun,
  Target,
  Save,
  Check,
} from 'lucide-react';

// Check if module is available
const isModuleAvailable = (): boolean => {
  const yatraAdmin = (window as any)?.yatraAdmin;
  return Boolean(yatraAdmin?.isPro);
};

// Premium Upgrade Card
const PremiumUpgradeCard: React.FC = () => {
  const features = [
    {
      icon: TrendingUp,
      title: __('Early Bird Discounts'),
      description: __('Reward customers who book in advance with automatic discounts.')
    },
    {
      icon: Clock,
      title: __('Last-Minute Deals'),
      description: __('Fill remaining spots with dynamic last-minute pricing.')
    },
    {
      icon: Users,
      title: __('Demand-Based Pricing'),
      description: __('Adjust prices automatically based on booking velocity and demand.')
    },
    {
      icon: Package,
      title: __('Inventory Pricing'),
      description: __('Scarcity pricing when spots are running low.')
    },
    {
      icon: Sun,
      title: __('Seasonal Adjustments'),
      description: __('Peak and off-peak pricing by season or month.')
    },
    {
      icon: Calendar,
      title: __('Time-Based Rules'),
      description: __('Weekend vs weekday pricing variations.')
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 mb-6">
          <TrendingUp className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          {__('Dynamic Pricing')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {__('Maximize revenue with intelligent price adjustments based on demand, seasonality, and booking patterns.')}
        </p>
      </div>

      {/* Stats Preview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{__('Active Rules')}</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">12</p>
              </div>
              <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{__('Revenue Impact')}</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">+18%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{__('Avg Adjustment')}</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">-12%</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{__('Trips Affected')}</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">45</p>
              </div>
              <Package className="w-8 h-8 text-orange-600 dark:text-orange-400" />
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
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
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
      <Card className="mb-12 border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-2xl">{__('How It Works')}</CardTitle>
          <CardDescription>
            {__('Intelligent pricing in 4 simple steps')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold mb-2">{__('1. Create Rules')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__('Set up pricing rules based on your business strategy')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-4">
                <BarChart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold mb-2">{__('2. Track Demand')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__('System monitors booking velocity and calculates demand scores')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold mb-2">{__('3. Auto-Adjust')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__('Prices adjust automatically based on active rules')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="font-semibold mb-2">{__('4. Maximize Revenue')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {__('Optimize pricing to increase bookings and revenue')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rule Types */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">{__('Pricing Rule Types')}</CardTitle>
          <CardDescription>
            {__('6 powerful rule types to optimize your pricing strategy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">{__('Early Bird Discounts')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {__('Offer discounts for bookings made 30+ days in advance. Encourages early bookings and improves cash flow.')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">{__('Last-Minute Deals')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {__('Reduce prices for bookings close to departure date. Fill remaining spots and maximize occupancy.')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">{__('Demand-Based Pricing')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {__('Increase prices when demand is high, decrease when low. Based on real-time booking velocity.')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Package className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">{__('Inventory-Based Pricing')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {__('Scarcity pricing when spots are running low. Increase prices as capacity fills up.')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Sun className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">{__('Seasonal Adjustments')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {__('Peak season pricing for high-demand months. Off-peak discounts to boost bookings in slow periods.')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">{__('Time-Based Rules')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {__('Weekend vs weekday pricing. Charge premium for weekend departures, offer discounts for weekdays.')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">
                {__('Ready to Optimize Your Pricing?')}
              </h3>
              <p className="text-blue-100">
                {__('Upgrade to Yatra Pro to unlock Dynamic Pricing and maximize your revenue.')}
              </p>
            </div>
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => window.open('https://wpyatra.com/pricing?module=dynamic-pricing', '_blank')}
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

// Main Component
const DynamicPricingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rules');
  const [showRuleTypeModal, setShowRuleTypeModal] = useState(false);
  const [settings, setSettings] = useState({
    rule_priority_mode: 'highest',
    max_price_increase: 50,
    max_price_decrease: 30,
    calculation_period: 7,
    update_frequency: 'hourly',
    show_original_price: true,
    show_savings_badge: true,
    show_urgency_messages: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    adjustment: true,
    applicable_trips: true,
    priority: true,
    status: true,
    created_at: true,
  });
  
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev]
    }));
  };

  const handleSelectRuleType = (ruleType: string) => {
    const baseUrl = window.location.href.split('&action=')[0];
    window.location.href = `${baseUrl}&action=create-pricing-rule&rule_type=${ruleType}`;
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await apiClient.post('/dynamic-pricing/settings', settings);
      showToast(__('Settings saved successfully'), 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast(__('Failed to save settings. Please try again.'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if module is available
  if (!isModuleAvailable()) {
    return <PremiumUpgradeCard />;
  }

  // Fetch settings from backend
  const { data: settingsData } = useQuery({
    queryKey: ['dynamic-pricing-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/dynamic-pricing/settings');
      return response.data;
    },
  });

  // Update settings state when data is loaded
  React.useEffect(() => {
    if (settingsData?.data) {
      setSettings(settingsData.data);
    }
  }, [settingsData]);

  // Fetch pricing rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['dynamic-pricing-rules'],
    queryFn: async () => {
      const response = await apiClient.get('/dynamic-pricing/rules');
      console.log('Rules API Response:', response);
      return response;
    },
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['dynamic-pricing-statistics'],
    queryFn: async () => {
      const response = await apiClient.get('/dynamic-pricing/statistics');
      console.log('Statistics API Response:', response);
      return response;
    },
  });

  const rules = rulesData?.data || [];
  const stats = statsData?.data || {};
  
  // Filter and sort rules
  const filteredRules = useMemo(() => {
    let filtered = [...rules];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((rule: any) =>
        rule.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.rule_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((rule: any) => rule.status === statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [rules, searchTerm, statusFilter, sortBy, sortOrder]);
  
  // Bulk action mutation
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: number[] }) => {
      const promises = ids.map(id => {
        if (action === 'delete') {
          return apiClient.delete(`/dynamic-pricing/rules/${id}`);
        } else if (action === 'restore') {
          return apiClient.put(`/dynamic-pricing/rules/${id}`, { status: 'active' });
        } else if (action === 'trash') {
          return apiClient.put(`/dynamic-pricing/rules/${id}`, { status: 'trash' });
        } else if (action === 'active' || action === 'inactive') {
          return apiClient.put(`/dynamic-pricing/rules/${id}`, { status: action });
        }
        return Promise.resolve();
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['dynamic-pricing-statistics'] });
      setSelectedIds([]);
      setBulkAction('');
      showToast(__('Bulk action completed successfully'), 'success');
    },
    onError: () => {
      showToast(__('Failed to complete bulk action'), 'error');
    },
  });
  
  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__('Select a bulk action first'), 'warning');
      return;
    }
    if (selectedIds.length === 0) {
      showToast(__('Select at least one rule'), 'warning');
      return;
    }
    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={__('Dynamic Pricing')}
        description={__('Intelligent price adjustments based on demand, seasonality, and booking patterns')}
      />

      {/* Tabs with Create Button */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rules'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Target className="w-5 h-5 inline-block mr-2" />
              {__('Pricing Rules')}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <BarChart className="w-5 h-5 inline-block mr-2" />
              {__('Analytics')}
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
          
          {activeTab === 'rules' && (
            <Button 
              onClick={() => setShowRuleTypeModal(true)}
              className="mb-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              {__('Create Rule')}
            </Button>
          )}
        </div>
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{__('Total Rules')}</p>
                    <p className="text-3xl font-bold">{stats.total_rules || 0}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{__('Active Rules')}</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active_rules || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{__('Inactive Rules')}</p>
                    <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.inactive_rules || 0}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{__('Rule Types')}</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.rule_types_used || 0}</p>
                  </div>
                  <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Search and Filter Toolbar */}
          <Card>
            <CardContent className="pt-6">
              <SearchFilterToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                statusOptions={[
                  { value: 'all', label: __('All Status') },
                  { value: 'active', label: __('Active') },
                  { value: 'inactive', label: __('Inactive') },
                  { value: 'trash', label: __('Trash') }
                ]}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                sortOptions={[
                  { value: 'name', label: __('Name') },
                  { value: 'priority', label: __('Priority') },
                  { value: 'created_at', label: __('Created Date') },
                  { value: 'updated_at', label: __('Updated Date') }
                ]}
                onResetFilters={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSortBy('created_at');
                  setSortOrder('desc');
                }}
                hasFilters={!!searchTerm || statusFilter !== 'all' || sortBy !== 'created_at' || sortOrder !== 'desc'}
                placeholder={__('Search rules...')}
              />
            </CardContent>
          </Card>
          
          {/* Bulk Action Toolbar */}
          <BulkActionToolbar
            selectedIds={selectedIds}
            bulkAction={bulkAction}
            setBulkAction={setBulkAction}
            onApply={handleBulkApply}
            onClearSelection={() => setSelectedIds([])}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            statusOptions={[
              { key: 'all', label: __('All'), count: rules.length },
              { key: 'active', label: __('Active'), count: stats.active_rules || 0 },
              { key: 'inactive', label: __('Inactive'), count: stats.inactive_rules || 0 },
              { key: 'trash', label: __('Trash'), count: stats.trash_rules || 0 }
            ]}
            showColumnsDropdown={showColumnsDropdown}
            setShowColumnsDropdown={setShowColumnsDropdown}
            columnOptions={[
              { key: 'name', label: __('Rule Name'), visible: visibleColumns.name },
              { key: 'adjustment', label: __('Adjustment'), visible: visibleColumns.adjustment },
              { key: 'applicable_trips', label: __('Applicable To'), visible: visibleColumns.applicable_trips },
              { key: 'priority', label: __('Priority'), visible: visibleColumns.priority },
              { key: 'status', label: __('Status'), visible: visibleColumns.status },
              { key: 'created_at', label: __('Created'), visible: visibleColumns.created_at }
            ]}
            onToggleColumn={toggleColumn}
            bulkMutationPending={bulkMutation.isPending}
            totalItems={filteredRules.length}
            bulkActionOptions={
              statusFilter === 'trash'
                ? [
                    { value: 'restore', label: __('Restore') },
                    { value: 'delete', label: __('Delete Permanently') }
                  ]
                : [
                    { value: 'active', label: __('Mark as Active') },
                    { value: 'inactive', label: __('Mark as Inactive') },
                    { value: 'trash', label: __('Move to Trash') }
                  ]
            }
          />

          {/* Rules List */}
          <Card>
            <CardHeader>
              <CardTitle>{__('Pricing Rules')}</CardTitle>
              <CardDescription>{__('Manage your dynamic pricing rules')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <SharedTable
                data={filteredRules}
                columns={[
                  {
                    key: 'name',
                    label: __('Rule Name'),
                    sortable: true,
                    visible: visibleColumns.name,
                    render: (rule: any) => (
                      <div>
                        <a 
                          href={`${window.location.href.split('&action=')[0]}&action=edit-pricing-rule&id=${rule.id}`}
                          className={`font-medium hover:underline transition-colors cursor-pointer ${
                            rule.status === 'trash' || statusFilter === 'trash'
                              ? 'text-gray-400 dark:text-gray-600'
                              : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
                          }`}
                        >
                          {rule.name}
                        </a>
                        <div className={`text-sm ${
                          rule.status === 'trash' || statusFilter === 'trash'
                            ? 'text-gray-400 dark:text-gray-600'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {rule.rule_type?.replace('_', ' ')}
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'adjustment',
                    label: __('Adjustment'),
                    visible: visibleColumns.adjustment,
                    render: (rule: any) => (
                      <span className="font-medium text-gray-900 dark:text-white">
                        {rule.adjustment_type === 'percentage' 
                          ? `${rule.adjustment_value > 0 ? '+' : ''}${rule.adjustment_value}%` 
                          : `$${rule.adjustment_value}`}
                      </span>
                    )
                  },
                  {
                    key: 'applicable_trips',
                    label: __('Applicable To'),
                    visible: visibleColumns.applicable_trips,
                    render: (rule: any) => (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {rule.applicable_trips === 'all' ? __('All Trips') : __('Specific Trips')}
                      </span>
                    )
                  },
                  {
                    key: 'priority',
                    label: __('Priority'),
                    sortable: true,
                    visible: visibleColumns.priority,
                    render: (rule: any) => (
                      <Badge variant="outline">{rule.priority}</Badge>
                    )
                  },
                  {
                    key: 'status',
                    label: __('Status'),
                    sortable: true,
                    visible: visibleColumns.status,
                    render: (rule: any) => (
                      <Badge variant={rule.status === 'active' ? 'success' : 'outline'}>
                        {rule.status}
                      </Badge>
                    )
                  },
                  {
                    key: 'created_at',
                    label: __('Created'),
                    sortable: true,
                    visible: visibleColumns.created_at,
                    render: (rule: any) => (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(rule.created_at).toLocaleDateString()}
                      </span>
                    )
                  }
                ]}
                actions={[
                  {
                    key: 'edit',
                    label: __('Edit'),
                    icon: <Edit className="w-4 h-4" />,
                    onClick: (rule: any) => {
                      const baseUrl = window.location.href.split('&action=')[0];
                      window.location.href = `${baseUrl}&action=edit-pricing-rule&id=${rule.id}`;
                    }
                  },
                  {
                    key: 'active',
                    label: __('Mark as Active'),
                    icon: <Check className="w-4 h-4" />,
                    onClick: (rule: any) => {
                      setConfirmDialog({
                        isOpen: true,
                        title: __('Mark as Active'),
                        message: __('Are you sure you want to mark "{name}" as active?').replace('{name}', rule.name),
                        onConfirm: () => {
                          bulkMutation.mutate({ action: 'active', ids: [rule.id] });
                          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                        }
                      });
                    },
                    condition: (rule: any) => rule.status !== 'active' && rule.status !== 'trash'
                  },
                  {
                    key: 'inactive',
                    label: __('Mark as Inactive'),
                    icon: <AlertCircle className="w-4 h-4" />,
                    onClick: (rule: any) => {
                      setConfirmDialog({
                        isOpen: true,
                        title: __('Mark as Inactive'),
                        message: __('Are you sure you want to mark "{name}" as inactive?').replace('{name}', rule.name),
                        onConfirm: () => {
                          bulkMutation.mutate({ action: 'inactive', ids: [rule.id] });
                          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                        }
                      });
                    },
                    condition: (rule: any) => rule.status === 'active'
                  },
                  {
                    key: 'restore',
                    label: __('Restore'),
                    icon: <Check className="w-4 h-4" />,
                    onClick: (rule: any) => {
                      setConfirmDialog({
                        isOpen: true,
                        title: __('Restore Rule'),
                        message: __('Are you sure you want to restore "{name}"?').replace('{name}', rule.name),
                        onConfirm: () => {
                          bulkMutation.mutate({ action: 'restore', ids: [rule.id] });
                          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                        }
                      });
                    },
                    condition: (rule: any) => rule.status === 'trash' || statusFilter === 'trash'
                  },
                  {
                    key: 'trash',
                    label: __('Move to Trash'),
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: (rule: any) => {
                      setConfirmDialog({
                        isOpen: true,
                        title: __('Move to Trash'),
                        message: __('Are you sure you want to move "{name}" to trash?').replace('{name}', rule.name),
                        onConfirm: () => {
                          bulkMutation.mutate({ action: 'trash', ids: [rule.id] });
                          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                        }
                      });
                    },
                    condition: (rule: any) => rule.status !== 'trash' && statusFilter !== 'trash'
                  },
                  {
                    key: 'delete',
                    label: __('Delete Permanently'),
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: (rule: any) => {
                      setConfirmDialog({
                        isOpen: true,
                        title: __('Delete Permanently'),
                        message: __('Are you sure you want to permanently delete "{name}"? This action cannot be undone.').replace('{name}', rule.name),
                        onConfirm: () => {
                          bulkMutation.mutate({ action: 'delete', ids: [rule.id] });
                          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                        }
                      });
                    },
                    condition: (rule: any) => rule.status === 'trash' || statusFilter === 'trash',
                    variant: 'destructive'
                  }
                ]}
                selectedItemIds={selectedIds}
                onSelectItem={(id, checked) => {
                  if (checked) {
                    setSelectedIds([...selectedIds, id as number]);
                  } else {
                    setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
                  }
                }}
                onSelectAll={(checked) => {
                  if (checked) {
                    setSelectedIds(filteredRules.map((rule: any) => rule.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                isAllSelected={selectedIds.length === filteredRules.length && filteredRules.length > 0}
                getItemId={(rule: any) => rule.id}
                isLoading={isLoading}
                emptyText={__('No pricing rules found')}
                emptyDescription={__('Click "Create Rule" button above to get started')}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{__('Total Rules')}</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total_rules || 0}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{__('All pricing rules')}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{__('Active Rules')}</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active_rules || 0}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">{__('Currently active')}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{__('Inactive Rules')}</p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.inactive_rules || 0}</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{__('Paused rules')}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{__('Rule Types Used')}</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.rule_types_used || 0}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{__('Different types')}</p>
                    </div>
                    <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rule Performance */}
          <Card>
            <CardHeader>
              <CardTitle>{__('Rule Performance')}</CardTitle>
              <CardDescription>{__('How each pricing rule is performing')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.length > 0 ? (
                    rules.slice(0, 5).map((rule: any) => (
                      <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h4>
                            <Badge variant="default" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                              {rule.rule_type?.replace('_', ' ')}
                            </Badge>
                            <Badge variant={rule.status === 'active' ? 'success' : 'outline'}>
                              {rule.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>{__('Priority')}: {rule.priority}</span>
                            <span>•</span>
                            <span>{rule.adjustment_type === 'percentage' ? `${rule.adjustment_value}%` : `$${rule.adjustment_value}`}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">{__('Created')}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(rule.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>{__('No pricing rules created yet')}</p>
                      <p className="text-sm mt-2">{__('Create your first rule to see performance metrics')}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{__('Revenue Impact Trend')}</CardTitle>
              <CardDescription>{__('30-day revenue comparison with and without dynamic pricing')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="text-center">
                    <BarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{__('Chart visualization will be displayed here')}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{__('Showing revenue with vs without dynamic pricing')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{__('General Settings')}</CardTitle>
              <CardDescription>{__('Configure global dynamic pricing behavior')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Rule Priority Mode')}
                    </label>
                    <select 
                      value={settings.rule_priority_mode}
                      onChange={(e) => handleSettingChange('rule_priority_mode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="highest">{__('Apply Highest Priority Rule Only')}</option>
                      <option value="cumulative">{__('Apply All Matching Rules (Cumulative)')}</option>
                      <option value="best">{__('Apply Best Price for Customer')}</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__('How to handle multiple rules matching the same booking')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Maximum Price Increase (%)')}
                    </label>
                    <input
                      type="number"
                      value={settings.max_price_increase}
                      onChange={(e) => handleSettingChange('max_price_increase', parseInt(e.target.value))}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__('Cap maximum price increase to protect customers')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Maximum Price Decrease (%)')}
                    </label>
                    <input
                      type="number"
                      value={settings.max_price_decrease}
                      onChange={(e) => handleSettingChange('max_price_decrease', parseInt(e.target.value))}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__('Cap maximum discount to maintain profitability')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Demand Calculation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{__('Demand Calculation')}</CardTitle>
              <CardDescription>{__('Configure how booking demand is calculated')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Calculation Period (Days)')}
                    </label>
                    <input
                      type="number"
                      value={settings.calculation_period}
                      onChange={(e) => handleSettingChange('calculation_period', parseInt(e.target.value))}
                      min="1"
                      max="30"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__('Number of days to analyze for demand trends')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Update Frequency')}
                    </label>
                    <select 
                      value={settings.update_frequency}
                      onChange={(e) => handleSettingChange('update_frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="hourly">{__('Every Hour')}</option>
                      <option value="daily">{__('Once Daily')}</option>
                      <option value="realtime">{__('Real-time (On Each Booking)')}</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {__('How often to recalculate demand scores')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{__('Display Settings')}</CardTitle>
              <CardDescription>{__('How dynamic pricing is shown to customers')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{__('Show Original Price')}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {__('Display crossed-out original price when discount applied')}
                      </p>
                    </div>
                    <Toggle
                      checked={settings.show_original_price}
                      onChange={(checked) => handleSettingChange('show_original_price', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{__('Show Savings Badge')}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {__('Display "Save X%" badge on discounted trips')}
                      </p>
                    </div>
                    <Toggle
                      checked={settings.show_savings_badge}
                      onChange={(checked) => handleSettingChange('show_savings_badge', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{__('Show Urgency Messages')}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {__('Display messages like "Price increases soon" for demand-based rules')}
                      </p>
                    </div>
                    <Toggle
                      checked={settings.show_urgency_messages}
                      onChange={(checked) => handleSettingChange('show_urgency_messages', checked)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          {!isLoading && (
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6"
              >
                {isSaving ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" />
                    {__('Saving...')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {__('Save Settings')}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Rule Type Selection Modal */}
      <RuleTypeSelectionModal
        isOpen={showRuleTypeModal}
        onClose={() => setShowRuleTypeModal(false)}
        onSelectType={handleSelectRuleType}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </div>
  );
};

export default DynamicPricingPage;
