import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Trash2, Eye, Clock, DollarSign, Settings, Globe, Lock } from 'lucide-react';

interface CancellationRule {
  id: number;
  rule_name: string;
  is_global: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  tiers?: CancellationTier[];
}

interface CancellationTier {
  id: number;
  rule_id: number;
  days_before_departure: number;
  charge_type: 'percentage' | 'fixed';
  charge_amount: number;
  min_charge_amount?: number;
  max_charge_amount?: number;
  refund_percentage?: number;
  description?: string;
  sort_order: number;
}

const AdvancedCancellation: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<CancellationRule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'rules' | 'analytics' | 'settings'>('rules');
  const queryClient = useQueryClient();

  // Check if module is enabled
  const isModuleEnabled = (window as any).yatraAdmin?.advancedCancellationEnabled || false;

  // Fetch cancellation rules (only if module is enabled)
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['cancellation-rules'],
    queryFn: async () => {
      const response = await fetch('/wp-json/yatra/v1/cancellation/rules');
      if (!response.ok) throw new Error('Failed to fetch rules');
      return response.json() as Promise<CancellationRule[]>;
    },
    enabled: isModuleEnabled
  });

  // Show module not enabled message
  if (!isModuleEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Module Not Active
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please enable the Advanced Cancellation module to access this feature.
          </p>
          <div className="space-y-3">
            <a
              href="/wp-admin/admin.php?page=yatra&subpage=modules"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Enable Module
            </a>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Go to <strong>Yatra → Modules</strong> and enable the Advanced Cancellation module.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: number) => {
      const response = await fetch(`/wp-json/yatra/v1/cancellation/rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
        }
      });
      if (!response.ok) throw new Error('Failed to delete rule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancellation-rules'] });
    }
  });

  // Filter rules based on search term
  const filteredRules = rules.filter(rule =>
    rule.rule_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteRule = (ruleId: number) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const handleViewRule = (rule: CancellationRule) => {
    setSelectedRule(rule);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advanced Cancellation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage cancellation rules and policies
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'rules', label: 'Rules', icon: Settings },
            { id: 'analytics', label: 'Analytics', icon: DollarSign },
            { id: 'settings', label: 'Settings', icon: Globe }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Rules Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No cancellation rules found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get started by creating your first cancellation rule.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      {rule.is_global ? (
                        <Globe className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {rule.rule_name}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rule.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}
                    >
                      {rule.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Tiers:</span> {rule.tiers?.length || 0}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(rule.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleViewRule(rule)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Cancellations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Revenue Impact</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">$1,250</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Settings className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cancellation Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">8.5%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cancellation Trends
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Chart placeholder - Analytics data will be displayed here
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              General Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900 dark:text-white">
                    Enable Customer Cancellations
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Allow customers to cancel their own bookings
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  defaultChecked
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900 dark:text-white">
                    Auto-process Refunds
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically process refunds when cancellations occur
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  defaultChecked
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900 dark:text-white">
                    Send Email Notifications
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notify customers and admins about cancellations
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  defaultChecked
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Email Templates
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Cancellation Confirmation
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  defaultValue="Your booking has been cancelled. A refund of {refund_amount} will be processed."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Refund Processed
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  defaultValue="Your refund of {refund_amount} has been processed. It may take 3-5 business days to appear in your account."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Rule Modal */}
      {showViewModal && selectedRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedRule.rule_name}
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedRule.is_global ? 'Global Rule' : 'Trip Specific'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedRule.status}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Cancellation Tiers</h3>
                {selectedRule.tiers && selectedRule.tiers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRule.tiers.map((tier) => (
                      <div
                        key={tier.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {tier.days_before_departure}+ days before departure
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {tier.charge_type === 'percentage' ? `${tier.charge_amount}%` : `$${tier.charge_amount}`}
                          </span>
                        </div>
                        {tier.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {tier.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No tiers defined</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Cancellation Rule
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Rule creation form will be implemented here
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedCancellation;
