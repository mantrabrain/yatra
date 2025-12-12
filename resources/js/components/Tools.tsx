import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/ui/toast';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Download, 
  Upload, 
  Server, 
  FileText, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle, 
  XCircle, 
  Trash2,
  RefreshCw,
  MapPin,
  Globe,
  Activity,
  Folder,
  Mountain,
  Calendar,
  Users,
  UserCheck,
  CreditCard,
  Star,
  MessageSquare,
  Tag,
  BarChart3,
  List,
  Settings
} from 'lucide-react';

interface SystemStatus {
  php: {
    version: string;
    memory_limit: string;
    max_execution_time: string;
    upload_max_filesize: string;
    post_max_size: string;
  };
  wordpress: {
    version: string;
    multisite: boolean;
    debug_mode: boolean;
  };
  yatra: {
    version: string;
    plugin_path: string;
    plugin_url: string;
  };
  database: {
    version: string;
    charset: string;
    collate: string;
  };
  server: {
    software: string;
    php_sapi: string;
    https: boolean;
  };
  extensions: Record<string, boolean>;
  requirements: Record<string, {
    required: string;
    current: string;
    status: 'pass' | 'fail' | 'warning';
  }>;
}

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

interface JobStatus {
  id: string;
  type: 'export' | 'import';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  total_records: number;
  processed_records: number;
  file_path?: string;
  file_url?: string;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  import_stats?: Record<string, { total: number; imported: number; failed: number }>;
  seen_notification?: boolean;
}

const Tools: React.FC = () => {
  const [activeTab, setActiveTab] = useState('export-import');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedExportData, setSelectedExportData] = useState<string[]>([
    'trips', 'destinations', 'activities', 'bookings', 'customers'
  ]);
  const [selectedImportData, setSelectedImportData] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [logs, setLogs] = useState<Record<string, LogsResponse>>({});
  const [selectedLogType, setSelectedLogType] = useState('error');
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [allJobs, setAllJobs] = useState<JobStatus[]>([]);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const { showToast } = useToast();
  
  // Background job states
  const [exportJob, setExportJob] = useState<JobStatus | null>(null);
  const [importJob, setImportJob] = useState<JobStatus | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logTypes = [
    { key: 'error', label: 'Error Logs', icon: XCircle },
    { key: 'payment', label: 'Payment Logs', icon: CheckCircle },
    { key: 'booking', label: 'Booking Logs', icon: FileText },
    { key: 'system', label: 'System Logs', icon: Server },
  ];

  // Available data types for export/import based on Yatra database structure
  const dataTypes = [
    { key: 'trips', label: 'Trips', description: 'All trip packages, itineraries, and details', icon: MapPin },
    { key: 'destinations', label: 'Destinations', description: 'Travel destinations and locations', icon: Globe },
    { key: 'activities', label: 'Activities', description: 'Trip activities and experiences', icon: Activity },
    { key: 'categories', label: 'Trip Categories', description: 'Trip categorization and taxonomy', icon: Folder },
    { key: 'difficulty_levels', label: 'Difficulty Levels', description: 'Trip difficulty classifications', icon: Mountain },
    { key: 'bookings', label: 'Bookings', description: 'Customer bookings and reservations', icon: Calendar },
    { key: 'customers', label: 'Customers', description: 'Customer profiles and CRM data', icon: Users },
    { key: 'travelers', label: 'Travelers', description: 'Individual traveler information', icon: UserCheck },
    { key: 'payments', label: 'Payments', description: 'Payment transactions and history', icon: CreditCard },
    { key: 'reviews', label: 'Reviews', description: 'Trip reviews and ratings', icon: Star },
    { key: 'enquiries', label: 'Enquiries', description: 'Customer enquiries and leads', icon: MessageSquare },
    { key: 'discounts', label: 'Discounts', description: 'Discount codes and promotions', icon: Tag },
    { key: 'availability', label: 'Availability', description: 'Trip availability and schedules', icon: BarChart3 },
    { key: 'itinerary', label: 'Itinerary Items', description: 'Itinerary items and types', icon: List },
    { key: 'settings', label: 'Settings', description: 'Plugin configuration and settings', icon: Settings },
  ];

  // Load system status
  const loadSystemStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const response = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/system-status`, {
        headers: {
          'X-WP-Nonce': (window as any).yatraAdmin.nonce,
        },
      });
      const data = await response.json();
      // API returns data directly, not wrapped in success/data
      setSystemStatus(data);
    } catch (error) {
      console.error('Failed to load system status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Load active jobs on mount (to show status when returning to page)
  const loadActiveJobs = async () => {
    try {
      const response = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/active-jobs`, {
        headers: {
          'X-WP-Nonce': (window as any).yatraAdmin.nonce,
        },
      });
      
      if (response.ok) {
        const jobs = await response.json();
        
        if (Array.isArray(jobs) && jobs.length > 0) {
          // Find most recent export and import jobs
          const exportJobData = jobs.find((j: JobStatus) => j.type === 'export');
          const importJobData = jobs.find((j: JobStatus) => j.type === 'import');
          
          if (exportJobData) {
            setExportJob(exportJobData);
            // Resume polling if job is still running
            if (exportJobData.status === 'pending' || exportJobData.status === 'running') {
              setIsExporting(true);
              pollJobStatus(exportJobData.id, 'export');
            }
          }
          
          if (importJobData) {
            setImportJob(importJobData);
            // Resume polling if job is still running
            if (importJobData.status === 'pending' || importJobData.status === 'running') {
              setIsImporting(true);
              pollJobStatus(importJobData.id, 'import');
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load active jobs:', error);
    }
  };

  // Load active jobs on component mount
  useEffect(() => {
    loadActiveJobs();
    
    // We don't need to check localStorage for completed import jobs anymore
    // The message will only appear once after import completes and then
    // will be removed from localStorage when dismissed
    
    // Load system status when tab is system-status
    if (activeTab === 'system-status') {
      loadSystemStatus();
    }
  }, [activeTab]);

  // Load logs
  const loadLogs = async (type: string, page = 1) => {
    setIsLoadingLogs(true);
    try {
      const response = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/logs/${type}?page=${page}`, {
        headers: {
          'X-WP-Nonce': (window as any).yatraAdmin.nonce,
        },
      });
      const data = await response.json();
      if (data.success) {
        setLogs(prev => ({ ...prev, [type]: data.data }));
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Handle data type selection for export
  const handleExportDataToggle = (dataType: string) => {
    setSelectedExportData(prev => 
      prev.includes(dataType) 
        ? prev.filter(type => type !== dataType)
        : [...prev, dataType]
    );
  };

  // Handle select all for export
  const handleExportSelectAll = () => {
    if (selectedExportData.length === dataTypes.length) {
      // If all are selected, deselect all
      setSelectedExportData([]);
    } else {
      // Select all data types
      setSelectedExportData(dataTypes.map(dt => dt.key));
    }
  };

  // Handle data type selection for import
  const handleImportDataToggle = (dataType: string) => {
    setSelectedImportData(prev => 
      prev.includes(dataType) 
        ? prev.filter(type => type !== dataType)
        : [...prev, dataType]
    );
  };

  // Handle export button click - show modal
  const handleExportClick = () => {
    setShowExportModal(true);
  };

  // Handle actual export after data type selection - uses background job
  const handleExport = async () => {
    if (selectedExportData.length === 0) {
      alert('Please select at least one data type to export.');
      return;
    }

    setIsExporting(true);
    setShowExportModal(false);
    try {
      // Create background export job
      const response = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/export-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': (window as any).yatraAdmin.nonce,
        },
        body: JSON.stringify({
          data_types: selectedExportData
        })
      });
      
      const data = await response.json();
      
      // API returns data directly, not wrapped in {success, data}
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create export job');
      }
      
      // Start polling for job status
      const jobId = data.job_id;
      pollJobStatus(jobId, 'export');
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
      setIsExporting(false);
    }
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Poll job status
  const pollJobStatus = (jobId: string, type: 'export' | 'import') => {
    const endpoint = type === 'export' ? 'export-job' : 'import-job';
    
    const poll = async () => {
      try {
        const response = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/${endpoint}/${jobId}`, {
          headers: {
            'X-WP-Nonce': (window as any).yatraAdmin.nonce,
          },
        });
        
        const data = await response.json();
        
        // API returns data directly, not wrapped in {success, data}
        if (response.ok && data) {
          const jobData = data as JobStatus;
          
          if (type === 'export') {
            setExportJob(jobData);
          } else {
            setImportJob(jobData);
          }
          
          // Check if job is complete or failed - stop polling
          if (jobData.status === 'completed' || jobData.status === 'failed') {
            stopPolling();
            
            if (type === 'export') {
              setIsExporting(false);
            } else {
              setIsImporting(false);
            }
            
            if (jobData.status === 'failed') {
              alert(`${type === 'export' ? 'Export' : 'Import'} failed: ${jobData.error || 'Unknown error'}`);
            }
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    };
    
    // Clear any existing polling first
    stopPolling();
    
    // Poll immediately, then every 2 seconds
    poll();
    pollingIntervalRef.current = setInterval(poll, 2000);
  };

  // Download completed export and delete file after download
  const handleDownloadExport = async () => {
    if (!exportJob || exportJob.status !== 'completed') return;
    
    try {
      // First download the file
      const response = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/export-job/${exportJob.id}/download`, {
        headers: {
          'X-WP-Nonce': (window as any).yatraAdmin.nonce,
        },
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `yatra-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Then delete the file from server after download
      const deleteResponse = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/export-job/${exportJob.id}`, {
        method: 'DELETE',
        headers: {
          'X-WP-Nonce': (window as any).yatraAdmin.nonce,
        },
      });
      
      if (deleteResponse.ok) {
        // Clear the job after download and deletion
        setExportJob(null);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
  };

  // Show delete confirmation modal
  const handleDeleteClick = () => {
    if (!exportJob) return;
    setShowDeleteModal(true);
  };
  
  // Close delete confirmation modal
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };
  
  // Delete export job and file after confirmation
  const handleConfirmDelete = async () => {
    if (!exportJob) return;
    setShowDeleteModal(false);
    
    try {
      const response = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/export-job/${exportJob.id}`, {
        method: 'DELETE',
        headers: {
          'X-WP-Nonce': (window as any).yatraAdmin.nonce,
        },
      });
      
      if (response.ok) {
        // Immediately clear the export job from state to remove it from UI
        setExportJob(null);
      } else {
        alert('Failed to delete export file.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete export file.');
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Handle file processing (for both input and drop) - uses background job
  const processFile = async (file: File) => {
    if (selectedImportData.length === 0) {
      alert('Please select at least one data type to import.');
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('data_types', JSON.stringify(selectedImportData));
      
      // Create background import job
      const response = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/import-job`, {
        method: 'POST',
        headers: {
          'X-WP-Nonce': (window as any).yatraAdmin.nonce,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      // API returns data directly, not wrapped in {success, data}
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create import job');
      }
      
      // Start polling for job status
      const jobId = data.job_id;
      pollJobStatus(jobId, 'import');
      setSelectedImportData([]);
      
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed. Please check the file format and try again.');
      setIsImporting(false);
    }
  };

  // Import data from file input - show modal for data type selection
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setPendingImportFile(file);
    setShowImportModal(true);
    event.target.value = '';
  };

  // Handle drag and drop events - show modal for data type selection
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.type === 'application/json' || file.name.endsWith('.json'));
    
    if (!jsonFile) {
      alert('Please drop a valid JSON file.');
      return;
    }
    
    setPendingImportFile(jsonFile);
    setShowImportModal(true);
  };

  // Handle actual import after data type selection
  const handleImportConfirm = async () => {
    if (!pendingImportFile) return;
    
    setShowImportModal(false);
    await processFile(pendingImportFile);
    setPendingImportFile(null);
    setSelectedImportData([]);
  };

  // Clear logs
  const handleClearLogs = async (type: string) => {
    if (!confirm(`Are you sure you want to clear all ${type} logs?`)) return;

    try {
      const response = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/logs/${type}/clear`, {
        method: 'DELETE',
        headers: {
          'X-WP-Nonce': (window as any).yatraAdmin.nonce,
        },
      });
      const data = await response.json();
      if (data.success) {
        loadLogs(type); // Reload logs
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Pass</Badge>;
      case 'warning':
        return <Badge variant="warning"><AlertCircle className="w-3 h-3 mr-1" />Warning</Badge>;
      case 'fail':
        return <Badge variant="error"><XCircle className="w-3 h-3 mr-1" />Fail</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get log level badge
  const getLogLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <Badge variant="error">Error</Badge>;
      case 'warning':
        return <Badge variant="warning">Warning</Badge>;
      case 'info':
        return <Badge variant="info">Info</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  // Load all jobs
  const loadAllJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/all-jobs`, {
        headers: {
          'X-WP-Nonce': (window as any).yatraAdmin.nonce,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAllJobs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Clear all caches
  const clearAllCache = async () => {
    setIsClearingCache(true);
    try {
      // Log the request
      console.log('Clearing cache - sending request');
      
      const response = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/clear-cache`, {
        method: 'DELETE',
        headers: {
          'X-WP-Nonce': (window as any).yatraAdmin.nonce,
        },
      });
      
      // Log the raw response
      console.log('Cache clearing response status:', response.status);
      
      const data = await response.json();
      console.log('Cache clearing response data:', data);
      
      // Clear React Query cache if available
      if ((window as any).yatraQueryClient && typeof (window as any).yatraQueryClient.invalidateQueries === 'function') {
        (window as any).yatraQueryClient.invalidateQueries();
      }
      
      // Fixed handling of response
      if (response.ok && data.success) {
        // Only show success message if both response.ok and data.success are true
        showToast('All caches cleared successfully! Please refresh the page to see the changes.', 'success');
      } else {
        // Create a clean error message without concatenation issues
        let errorMessage = 'Failed to clear caches';
        
        // Only append additional details if they don't create a contradictory message
        if (data.message && !data.message.includes('success')) {
          errorMessage += ': ' + data.message;
        }
        
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Failed to clear caches:', error);
      showToast('Failed to clear caches. Please try again.', 'error');
    } finally {
      setIsClearingCache(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'system-status') {
      loadSystemStatus();
    } else if (activeTab === 'logs') {
      loadLogs(selectedLogType);
    } else if (activeTab === 'jobs') {
      loadAllJobs();
    }
  }, [activeTab, selectedLogType]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tools</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Export/Import data, check system status, and view logs
          </p>
        </div>
        <div>
          <Button 
            onClick={clearAllCache} 
            variant="outline"
            className="flex items-center gap-2"
            disabled={isClearingCache}
          >
            <RefreshCw className={`w-4 h-4 ${isClearingCache ? 'animate-spin' : ''}`} />
            {isClearingCache ? 'Clearing...' : 'Clear Cache'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tab Navigation - Clean and Spacious Design */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 mb-8">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('export-import')}
              className={`flex-1 py-3 px-6 rounded-md font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 ${
                activeTab === 'export-import'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Download className="w-5 h-5" />
              <span>Export/Import</span>
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex-1 py-3 px-6 rounded-md font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 ${
                activeTab === 'jobs'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <List className="w-5 h-5" />
              <span>Jobs</span>
            </button>
            <button
              onClick={() => setActiveTab('system-status')}
              className={`flex-1 py-3 px-6 rounded-md font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 ${
                activeTab === 'system-status'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Server className="w-5 h-5" />
              <span>System Status</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-3 px-6 rounded-md font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 ${
                activeTab === 'logs'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Logs</span>
            </button>
          </nav>
        </div>

        {/* Export/Import Tab */}
        {activeTab === 'export-import' && (
          <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Export Section */}
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Export Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Download your data</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Export your Yatra data for backup or migration purposes. Click the button below to select which data types to export.
              </p>

              {/* Export Job Progress */}
              {exportJob && (exportJob.status === 'pending' || exportJob.status === 'running') && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      {exportJob.status === 'pending' ? 'Queued...' : 'Exporting...'}
                    </span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      {exportJob.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportJob.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    {exportJob.processed_records} / {exportJob.total_records} records processed
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Processing in background. You can close this page and come back later.
                  </p>
                </div>
              )}

              {/* Export Complete - Download Button */}
              {exportJob && exportJob.status === 'completed' && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Export completed successfully!
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleDownloadExport}
                      className="flex-1"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      onClick={handleDeleteClick}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleExportClick} 
                disabled={isExporting || !!(exportJob && (exportJob.status === 'pending' || exportJob.status === 'running'))}
                className="w-full py-3"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                    Starting export...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-3" />
                    Select Data Types to Export
                  </>
                )}
              </Button>
            </Card>

            {/* Import Section */}
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Import Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Restore from backup</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Import Yatra data from a previously exported JSON file. Drop your file below or click to browse.
              </p>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  isDragOver
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                } ${isImporting ? 'pointer-events-none opacity-50' : ''}`}
              >
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className={`p-4 rounded-full ${
                    isDragOver 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Upload className={`w-8 h-8 ${
                      isDragOver 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {isDragOver ? 'Drop your JSON file here' : 'Drop JSON file or click to browse'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Supports JSON files exported from Yatra
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Import Job Progress */}
              {importJob && (importJob.status === 'pending' || importJob.status === 'running') && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {importJob.status === 'pending' ? 'Queued...' : 'Importing...'}
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400">
                      {importJob.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                    <div 
                      className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importJob.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    {importJob.processed_records} / {importJob.total_records} records processed
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Processing in background. You can close this page and come back later.
                  </p>
                </div>
              )}

              {/* Import Complete - with detailed statistics and shown only once */}
              {importJob && importJob.status === 'completed' && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Import completed successfully!
                    </span>
                    <button 
                      onClick={async () => {
                        if (!importJob) return;
                        
                        // Call API to delete the import job and file
                        try {
                          const response = await fetch(`${(window as any).yatraAdmin.apiUrl}/tools/import-job/${importJob.id}`, {
                            method: 'DELETE',
                            headers: {
                              'X-WP-Nonce': (window as any).yatraAdmin.nonce,
                            },
                          });
                          
                          if (response.ok) {
                            console.log('Import job deleted successfully');
                          } else {
                            console.error('Failed to delete import job');
                          }
                        } catch (e) {
                          console.error('Error deleting import job:', e);
                        }
                        
                        // Clear from state
                        setImportJob(null);
                      }}
                      className="ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-sm text-green-700 dark:text-green-400 mb-2">
                    Total: <strong>{importJob.processed_records}</strong> records imported
                  </div>
                  
                  {/* Detailed statistics by data type */}
                  {importJob.import_stats && Object.keys(importJob.import_stats).length > 0 && (
                    <div className="mt-2 border-t border-green-200 dark:border-green-800 pt-2">
                      <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">Import Details:</div>
                      <div className="grid grid-cols-1 gap-1">
                        {Object.entries(importJob.import_stats).map(([dataType, stats]: [string, any]) => {
                          // Find the matching data type object for the icon
                          const dataTypeObj = dataTypes.find(dt => dt.key === dataType);
                          const Icon = dataTypeObj?.icon || FileText;
                          
                          return (
                            <div key={dataType} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                <Icon className="w-3 h-3 text-green-600 dark:text-green-400" />
                                <span className="capitalize">{dataType.replace('_', ' ')}:</span>
                              </div>
                              <div>
                                <span className="text-green-700 dark:text-green-400">{stats.imported}</span>
                                {stats.failed > 0 && (
                                  <span className="text-red-600 dark:text-red-400 ml-1">
                                    ({stats.failed} failed)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* We don't need to mark as seen anymore since we'll remove from localStorage on dismiss */}
                </div>
              )}

              {/* Import Failed */}
              {importJob && importJob.status === 'failed' && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">
                      Import failed: {importJob.error || 'Unknown error'}
                    </span>
                  </div>
                </div>
              )}

              {isImporting && !importJob && (
                <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Starting import...</span>
                </div>
              )}
            </Card>
          </div>

          {/* Import Warning */}
          <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Important Notice</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                  Importing data will create new records. Existing data will not be overwritten. 
                  Always backup your database before importing data to prevent any potential data loss.
                </p>
              </div>
            </div>
          </Card>
        </div>
        )}

        {/* System Status Tab */}
        {activeTab === 'system-status' && (
          <div className="space-y-6">
          {isLoadingStatus ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Status Skeleton */}
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                    </div>
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : systemStatus ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PHP Information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  PHP Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Version:</span>
                    <span className="font-medium">{systemStatus.php.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Memory Limit:</span>
                    <span className="font-medium">{systemStatus.php.memory_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Max Execution Time:</span>
                    <span className="font-medium">{systemStatus.php.max_execution_time}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Upload Max Size:</span>
                    <span className="font-medium">{systemStatus.php.upload_max_filesize}</span>
                  </div>
                </div>
              </Card>

              {/* WordPress Information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">WordPress Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Version:</span>
                    <span className="font-medium">{systemStatus.wordpress.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Multisite:</span>
                    <span className="font-medium">{systemStatus.wordpress.multisite ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Debug Mode:</span>
                    <span className="font-medium">{systemStatus.wordpress.debug_mode ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </Card>

              {/* Requirements Check */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Requirements Check</h3>
                <div className="space-y-3">
                  {Object.entries(systemStatus.requirements).map(([key, req]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium capitalize">{key.replace('_', ' ')}</span>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Required: {req.required} | Current: {req.current}
                        </div>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Extensions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">PHP Extensions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(systemStatus.extensions).map(([ext, loaded]) => (
                    <div key={ext} className="flex items-center justify-between">
                      <span className="font-medium">{ext}</span>
                      {loaded ? (
                        <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Loaded</Badge>
                      ) : (
                        <Badge variant="error"><XCircle className="w-3 h-3 mr-1" />Missing</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-6">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p>Failed to load system status</p>
                <Button onClick={loadSystemStatus} className="mt-4">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </Card>
          )}
        </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Jobs</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAllJobs}
                  disabled={isLoadingJobs}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingJobs ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {isLoadingJobs ? (
                <div className="space-y-4">
                  {/* Jobs Skeleton */}
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 animate-pulse">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="w-24 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : allJobs.length > 0 ? (
                <div className="space-y-4">
                  {allJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant={job.type === 'export' ? 'default' : 'info'}>
                            {job.type === 'export' ? <Download className="w-3 h-3 mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                            {job.type.toUpperCase()}
                          </Badge>
                          <span className="font-medium text-gray-900 dark:text-white">Job ID: {job.id}</span>
                        </div>
                        <div>
                          {job.status === 'completed' && (
                            <Badge variant="success">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          {job.status === 'running' && (
                            <Badge variant="info">
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Running
                            </Badge>
                          )}
                          {job.status === 'pending' && (
                            <Badge variant="warning">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {job.status === 'failed' && (
                            <Badge variant="error">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {(job.status === 'running' || job.status === 'completed') && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="font-medium text-gray-900 dark:text-white">{job.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                job.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Job Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Created:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(job.created_at).toLocaleString()}
                          </p>
                        </div>
                        {job.started_at && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Started:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(job.started_at).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {job.completed_at && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(job.completed_at).toLocaleString()}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Records:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {job.processed_records || 0} / {job.total_records || 0}
                          </p>
                        </div>
                      </div>

                      {/* Import Stats */}
                      {job.type === 'import' && job.import_stats && Object.keys(job.import_stats).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-gray-600 dark:text-gray-400 font-medium mb-2">
                              Import Details
                            </summary>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                              {Object.entries(job.import_stats).map(([dataType, stats]: [string, any]) => (
                                <div key={dataType} className="bg-white dark:bg-gray-900 rounded p-2">
                                  <div className="text-xs text-gray-600 dark:text-gray-400 capitalize mb-1">
                                    {dataType.replace('_', ' ')}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                      {stats.imported}
                                    </span>
                                    {stats.failed > 0 && (
                                      <span className="text-xs text-red-600 dark:text-red-400">
                                        ({stats.failed} failed)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}

                      {/* Error Message */}
                      {job.error && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                          <p className="text-sm text-red-800 dark:text-red-400">
                            <strong>Error:</strong> {job.error}
                          </p>
                        </div>
                      )}

                      {/* Download Button for Completed Exports */}
                      {job.type === 'export' && job.status === 'completed' && job.file_url && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <a
                            href={job.file_url}
                            download
                            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <Download className="w-4 h-4" />
                            Download Export File
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <List className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">No jobs found</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm">
                    Export or import data to see job history here
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Log Type Selector */}
            <div className="flex flex-wrap gap-2">
              {logTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.key}
                    variant={selectedLogType === type.key ? "default" : "outline"}
                    onClick={() => setSelectedLogType(type.key)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </Button>
                );
              })}
            </div>

            {/* Logs Display */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold capitalize">{selectedLogType} Logs</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadLogs(selectedLogType)}
                    disabled={isLoadingLogs}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleClearLogs(selectedLogType)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Logs
                  </Button>
                </div>
              </div>

              {isLoadingLogs ? (
                <div className="space-y-4">
                  {/* Logs Skeleton */}
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 animate-pulse">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                      <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : logs[selectedLogType]?.logs?.length > 0 ? (
                <div className="space-y-3">
                  {logs[selectedLogType].logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getLogLevelBadge(log.level)}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-2">{log.message}</p>
                      {log.context && Object.keys(log.context).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-600 dark:text-gray-400">
                            View Context
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No {selectedLogType} logs found</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed top-0 left-0 right-0 bottom-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-50" style={{ margin: 0, padding: 0 }}>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[85vh] overflow-hidden mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Select Data Types to Export</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Select All Option */}
                <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <label className="flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedExportData.length === dataTypes.length}
                      onChange={handleExportSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                        {selectedExportData.length === dataTypes.length ? 'Deselect All' : 'Select All'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({dataTypes.length} data types)
                      </span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {dataTypes.map((dataType) => (
                    <label key={dataType.key} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedExportData.includes(dataType.key)}
                        onChange={() => handleExportDataToggle(dataType.key)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <dataType.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{dataType.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dataType.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedExportData.length} data types selected
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowExportModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={selectedExportData.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Selected Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed top-0 left-0 right-0 bottom-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-50" style={{ margin: 0, padding: 0 }}>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Confirm Deletion</h3>
                <button
                  onClick={handleCancelDelete}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Delete Export File?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This action cannot be undone. The export file will be permanently deleted from the server.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCancelDelete}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete File
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Import Modal */}
        {showImportModal && pendingImportFile && (
          <div className="fixed top-0 left-0 right-0 bottom-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-50" style={{ margin: 0, padding: 0 }}>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[85vh] overflow-hidden mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Select Data Types to Import</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    File: {pendingImportFile.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setPendingImportFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 gap-1">
                  {dataTypes.map((dataType) => (
                    <label key={dataType.key} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedImportData.includes(dataType.key)}
                        onChange={() => handleImportDataToggle(dataType.key)}
                        className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <dataType.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{dataType.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dataType.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedImportData.length} data types selected
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowImportModal(false);
                      setPendingImportFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportConfirm}
                    disabled={selectedImportData.length === 0}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Selected Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tools;
