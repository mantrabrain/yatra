import React, { useState, useEffect, useRef } from "react";
import { useToast } from "../components/ui/toast";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Modal } from "./ui/modal";
import { __ } from "../lib/i18n";
import { apiService } from "../lib/api-client";
import {
  Download,
  Upload,
  Server,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
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
  Settings,
  Database,
  Play,
  Copy,
  Eye,
} from "lucide-react";

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
  requirements: Record<
    string,
    {
      required: string;
      current: string;
      status: "pass" | "fail" | "warning";
    }
  >;
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
  type: "export" | "import";
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  total_records: number;
  processed_records: number;
  file_path?: string;
  file_url?: string;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  import_stats?: Record<
    string,
    { total: number; imported: number; failed: number }
  >;
  seen_notification?: boolean;
}

interface CronJob {
  hook: string;
  next_run: number;
  next_run_formatted: string;
  next_run_relative: string;
  schedule: string;
  schedule_label: string;
  interval: number;
  args: any[];
  is_overdue: boolean;
}

const MIGRATION_NOTICE_KEY = "yatra_migration_notice_dismissed_at";

const Tools: React.FC = () => {
  const [activeTab, setActiveTab] = useState("export-import");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedExportData, setSelectedExportData] = useState<string[]>([
    "trips",
    "destinations",
    "activities",
    "bookings",
    "customers",
  ]);
  const [selectedImportData, setSelectedImportData] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearLogsModal, setShowClearLogsModal] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [logs, setLogs] = useState<Record<string, LogsResponse>>({});
  const [selectedLogType, setSelectedLogType] = useState("error");
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [allJobs, setAllJobs] = useState<JobStatus[]>([]);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [showCacheModal, setShowCacheModal] = useState(false);
  const [cacheData, setCacheData] = useState<any[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [cronInfo, setCronInfo] = useState<{
    wp_cron_disabled: boolean;
    alternate_cron: boolean;
  } | null>(null);
  const [isLoadingCronJobs, setIsLoadingCronJobs] = useState(false);
  const [runningCronJob, setRunningCronJob] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [isLoadingMigration, setIsLoadingMigration] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isStartingMigration, setIsStartingMigration] = useState(false);
  const migrationPollingRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const [showMigrationConfirm, setShowMigrationConfirm] = useState(false);
  const [showMigrationCompleteNotice, setShowMigrationCompleteNotice] =
    useState(true);

  // Sample Data states
  const [isImportingSampleData, setIsImportingSampleData] = useState(false);
  const [sampleDataStatus, setSampleDataStatus] = useState<any>(null);
  const [sampleDataJob, setSampleDataJob] = useState<any>(null);

  const { showToast } = useToast();

  // Deep-link from WP admin notice: admin.php?page=yatra&subpage=tools&tools_tab=migration
  useEffect(() => {
    const allowed = new Set([
      "export-import",
      "jobs",
      "system-status",
      "logs",
      "migration",
    ]);
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tools_tab");
      if (t && allowed.has(t)) {
        setActiveTab(t);
      }
    } catch {
      // ignore invalid URL
    }
  }, []);

  // Helper function to format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    if (!migrationProgress?.started_at || !migrationProgress?.all_complete) {
      setShowMigrationCompleteNotice(false);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(MIGRATION_NOTICE_KEY);
      }
      return;
    }

    if (typeof window === "undefined") {
      setShowMigrationCompleteNotice(true);
      return;
    }

    const dismissedAt = window.localStorage.getItem(MIGRATION_NOTICE_KEY);
    if (dismissedAt && dismissedAt === migrationProgress.started_at) {
      setShowMigrationCompleteNotice(false);
    } else {
      setShowMigrationCompleteNotice(true);
    }
  }, [migrationProgress?.started_at, migrationProgress?.all_complete]);

  // Load sample data status on mount
  useEffect(() => {
    const loadSampleDataStatus = async () => {
      try {
        const status = await apiService.getSampleDataStatus();
        setSampleDataStatus(status);
      } catch (error) {
        console.error("Failed to load sample data status:", error);
      }
    };

    loadSampleDataStatus();
  }, []);

  // Background job states
  const [exportJob, setExportJob] = useState<JobStatus | null>(null);
  const [importJob, setImportJob] = useState<JobStatus | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const logTypes = [
    { key: "error", label: "Error Logs", icon: XCircle },
    { key: "payment", label: "Payment Logs", icon: CheckCircle },
    { key: "booking", label: "Booking Logs", icon: FileText },
    { key: "system", label: "System Logs", icon: Server },
  ];

  // Available data types for export/import based on Yatra database structure
  const dataTypes = [
    {
      key: "all",
      label: "All Yatra data",
      description:
        "Complete backup: all tables, settings, itinerary, payments, and Pro data (if present)",
      icon: Database,
    },
    {
      key: "trips",
      label: "Trips",
      description: "All trip packages, itineraries, and details",
      icon: MapPin,
    },
    {
      key: "destinations",
      label: "Destinations",
      description: "Travel destinations and locations",
      icon: Globe,
    },
    {
      key: "activities",
      label: "Activities",
      description: "Trip activities and experiences",
      icon: Activity,
    },
    {
      key: "categories",
      label: "Trip Categories",
      description: "Trip categorization and taxonomy",
      icon: Folder,
    },
    {
      key: "difficulty_levels",
      label: "Difficulty Levels",
      description: "Trip difficulty classifications",
      icon: Mountain,
    },
    {
      key: "bookings",
      label: "Bookings",
      description: "Customer bookings and reservations",
      icon: Calendar,
    },
    {
      key: "customers",
      label: "Customers",
      description: "Customer profiles and CRM data",
      icon: Users,
    },
    {
      key: "travelers",
      label: "Travelers",
      description: "Individual traveler information",
      icon: UserCheck,
    },
    {
      key: "payments",
      label: "Payments",
      description: "Payment transactions and history",
      icon: CreditCard,
    },
    {
      key: "reviews",
      label: "Reviews",
      description: "Trip reviews and ratings",
      icon: Star,
    },
    {
      key: "enquiries",
      label: "Enquiries",
      description: "Customer enquiries and leads",
      icon: MessageSquare,
    },
    {
      key: "discounts",
      label: "Discounts",
      description: "Discount codes and promotions",
      icon: Tag,
    },
    {
      key: "availability",
      label: "Availability",
      description: "Trip availability and schedules",
      icon: BarChart3,
    },
    {
      key: "itinerary",
      label: "Itinerary Items",
      description: "Itinerary items and types",
      icon: List,
    },
    {
      key: "settings",
      label: "Settings",
      description: "Plugin configuration and settings",
      icon: Settings,
    },
  ];

  // Load system status
  const loadSystemStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const data = await apiService.getSystemStatus();
      // API returns data directly, not wrapped in success/data
      setSystemStatus(data);
    } catch (error) {
      console.error("Failed to load system status:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Load active jobs on mount (to show status when returning to page)
  const loadActiveJobs = async () => {
    try {
      const jobs = await apiService.getActiveJobs();

      if (Array.isArray(jobs) && jobs.length > 0) {
        // Find most recent export and import jobs
        const exportJobData = jobs.find((j: JobStatus) => j.type === "export");
        const importJobData = jobs.find((j: JobStatus) => j.type === "import");

        if (exportJobData) {
          setExportJob(exportJobData);
          // Resume polling if job is still running
          if (
            exportJobData.status === "pending" ||
            exportJobData.status === "running"
          ) {
            setIsExporting(true);
            pollJobStatus(exportJobData.id, "export");
          }
        }

        if (importJobData) {
          setImportJob(importJobData);
          // Resume polling if job is still running
          if (
            importJobData.status === "pending" ||
            importJobData.status === "running"
          ) {
            setIsImporting(true);
            pollJobStatus(importJobData.id, "import");
          }
        }
      }
    } catch (error) {
      console.error("Failed to load active jobs:", error);
    }
  };

  // Load active jobs on component mount
  useEffect(() => {
    loadActiveJobs();

    // We don't need to check localStorage for completed import jobs anymore
    // The message will only appear once after import completes and then
    // will be removed from localStorage when dismissed

    // Load system status when tab is system-status
    if (activeTab === "system-status") {
      loadSystemStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load logs
  const loadLogs = async (type: string, page = 1) => {
    setIsLoadingLogs(true);
    try {
      const data = await apiService.getLogs(type, page);
      if (data.logs && Array.isArray(data.logs)) {
        // The API returns: { logs: [...], total: number, page: number, per_page: number, pages: number }
        const logsData = data; // Use the full response, not data.data

        setLogs((prev) => ({ ...prev, [type]: logsData }));
      }
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const selectableDataTypes = dataTypes.filter((dt) => dt.key !== "all");

  // Handle data type selection for export
  const handleExportDataToggle = (dataType: string) => {
    if (dataType === "all") {
      setSelectedExportData((prev) => (prev.includes("all") ? [] : ["all"]));
      return;
    }
    setSelectedExportData((prev) => {
      const withoutAll = prev.filter((t) => t !== "all");
      return withoutAll.includes(dataType)
        ? withoutAll.filter((t) => t !== dataType)
        : [...withoutAll, dataType];
    });
  };

  // Handle select all for export (individual types only, not the "all" preset)
  const handleExportSelectAll = () => {
    const keys = selectableDataTypes.map((dt) => dt.key);
    const allRegularSelected =
      keys.length > 0 &&
      keys.every((k) => selectedExportData.includes(k)) &&
      !selectedExportData.includes("all");
    const onlyAll =
      selectedExportData.length === 1 && selectedExportData.includes("all");

    if (allRegularSelected || onlyAll) {
      setSelectedExportData([]);
    } else {
      setSelectedExportData(keys);
    }
  };

  // Handle data type selection for import
  const handleImportDataToggle = (dataType: string) => {
    if (dataType === "all") {
      setSelectedImportData((prev) => (prev.includes("all") ? [] : ["all"]));
      return;
    }
    setSelectedImportData((prev) => {
      const withoutAll = prev.filter((t) => t !== "all");
      return withoutAll.includes(dataType)
        ? withoutAll.filter((t) => t !== dataType)
        : [...withoutAll, dataType];
    });
  };

  const handleImportSelectAll = () => {
    const keys = selectableDataTypes.map((dt) => dt.key);
    const allRegularSelected =
      keys.length > 0 &&
      keys.every((k) => selectedImportData.includes(k)) &&
      !selectedImportData.includes("all");
    const onlyAll =
      selectedImportData.length === 1 && selectedImportData.includes("all");

    if (allRegularSelected || onlyAll) {
      setSelectedImportData([]);
    } else {
      setSelectedImportData(keys);
    }
  };

  // Handle export button click - show modal
  const handleExportClick = () => {
    setShowExportModal(true);
  };

  // Handle actual export after data type selection - uses background job
  const handleExport = async () => {
    if (selectedExportData.length === 0) {
      alert("Please select at least one data type to export.");
      return;
    }

    setIsExporting(true);
    setShowExportModal(false);
    try {
      // Create background export job
      const data = await apiService.createExportJob({
        data_types: selectedExportData,
      });

      // Start polling for job status
      const jobId = data.job_id;
      pollJobStatus(jobId, "export");
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. Please try again.");
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
  const pollJobStatus = (jobId: string, type: "export" | "import") => {
    const endpoint = type === "export" ? "export-job" : "import-job";

    const poll = async () => {
      try {
        const jobData = (await apiService.performJobAction(
          endpoint,
          jobId,
        )) as JobStatus;
        if (jobData) {
          if (type === "export") {
            setExportJob(jobData);
          } else {
            setImportJob(jobData);
          }

          // Check if job is complete or failed - stop polling
          if (jobData.status === "completed" || jobData.status === "failed") {
            stopPolling();

            if (type === "export") {
              setIsExporting(false);
            } else {
              setIsImporting(false);
            }

            if (jobData.status === "failed") {
              alert(
                `${type === "export" ? "Export" : "Import"} failed: ${jobData.error || "Unknown error"}`,
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
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
    if (!exportJob || exportJob.status !== "completed") return;

    try {
      // First download the file
      const blob = await apiService.downloadExportJobBlob(exportJob.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `yatra-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Then delete the file from server after download
      await apiService.deleteExportJob(exportJob.id);
      // Clear the job after download and deletion
      setExportJob(null);
    } catch (error) {
      console.error("Download error:", error);
      alert("Download failed. Please try again.");
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
      await apiService.deleteExportJob(exportJob.id);
      // Immediately clear the export job from state to remove it from UI
      setExportJob(null);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete export file.");
    }
  };

  // Load logs when logs tab becomes active
  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs(selectedLogType);
    }
  }, [activeTab, selectedLogType]);

  // Handle file processing (for both input and drop) - uses background job
  const processFile = async (file: File) => {
    if (selectedImportData.length === 0) {
      alert("Please select at least one data type to import.");
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("data_types", JSON.stringify(selectedImportData));

      // Create background import job
      const data = await apiService.createImportJob(formData);

      // Start polling for job status
      const jobId = data.job_id;
      pollJobStatus(jobId, "import");
      setSelectedImportData([]);
    } catch (error) {
      console.error("Import error:", error);
      alert("Import failed. Please check the file format and try again.");
      setIsImporting(false);
    }
  };

  // Import data from file input - show modal for data type selection
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingImportFile(file);
    setShowImportModal(true);
    event.target.value = "";
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
    const jsonFile = files.find(
      (file) => file.type === "application/json" || file.name.endsWith(".json"),
    );

    if (!jsonFile) {
      alert("Please drop a valid JSON file.");
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
  const handleClearLogs = () => {
    setShowClearLogsModal(true);
  };

  // Confirm clear logs
  const confirmClearLogs = async () => {
    try {
      const data = await apiService.clearLogs(selectedLogType);
      if (data.success) {
        showToast(data.message || "Logs cleared successfully", "success");
        setLogs((prev) => ({
          ...prev,
          [selectedLogType]: {
            logs: [],
            total: 0,
            page: 1,
            per_page: 50,
            pages: 0,
          },
        }));
      } else {
        showToast(data.message || "Failed to clear logs", "error");
      }
    } catch (error) {
      console.error("Failed to clear logs:", error);
      showToast("Failed to clear logs. Please try again.", "error");
    }
  };

  // Copy individual log to clipboard
  const copyLogToClipboard = async (log: any) => {
    const logText = `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${log.context ? "\nContext: " + JSON.stringify(log.context, null, 2) : ""}`;

    try {
      await navigator.clipboard.writeText(logText);
      // You could add a toast notification here if you have one
    } catch (error) {
      console.error("Failed to copy log:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = logText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  // Copy all logs to clipboard
  const copyAllLogsToClipboard = async () => {
    const currentLogs = logs[selectedLogType];
    if (!currentLogs?.logs || currentLogs.logs.length === 0) return;

    const allLogsText = currentLogs.logs
      .map(
        (log: any) =>
          `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${log.context ? "\nContext: " + JSON.stringify(log.context, null, 2) : ""}`,
      )
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(allLogsText);
      // You could add a toast notification here if you have one
    } catch (error) {
      console.error("Failed to copy all logs:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = allLogsText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  // Handle sample data import - imports all data automatically
  const handleImportSampleData = async () => {
    setIsImportingSampleData(true);
    setSampleDataJob({ progress: 0 });

    try {
      // Import all sample data from JSON files automatically
      const response = await apiService.importSampleData({
        data_types: [], // Not used anymore - imports all data types
        overwrite: false,
      });

      if (response.success) {
        setSampleDataJob({ ...response.data, progress: 100 });

        // Show detailed success message with counts
        const data = response.data || {};
        const message = `Successfully imported: ${data.trips || 0} trips, ${data.classifications || 0} classifications, ${data.items || 0} items, ${data.trip_classifications || 0} trip assignments, ${data.discounts || 0} discounts, ${data.availability_dates || 0} availability dates, ${data.availability_rules || 0} rules, ${data.itinerary_days || 0} itinerary days, ${data.itinerary_entries || 0} itinerary entries`;

        showToast(message, "success");

        // Refresh sample data status
        const statusResponse = await apiService.getSampleDataStatus();
        setSampleDataStatus(statusResponse);
      } else {
        throw new Error(response.message || __("Import failed"));
      }
    } catch (error: any) {
      console.error("Sample data import error:", error);
      showToast(
        error.message || __("Failed to import sample data. Please try again."),
        "error",
      );
    } finally {
      setIsImportingSampleData(false);
      setTimeout(() => setSampleDataJob(null), 3000);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pass
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="warning">
            <AlertCircle className="w-3 h-3 mr-1" />
            Warning
          </Badge>
        );
      case "fail":
        return (
          <Badge variant="error">
            <XCircle className="w-3 h-3 mr-1" />
            Fail
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get log level badge
  const getLogLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return <Badge variant="error">Error</Badge>;
      case "warning":
        return <Badge variant="warning">Warning</Badge>;
      case "info":
        return <Badge variant="info">Info</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  // Load all jobs
  const loadAllJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const data = await apiService.getAllJobs();
      // API returns data directly, not wrapped in {success, data}
      setAllJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Load cron jobs
  const loadCronJobs = async () => {
    setIsLoadingCronJobs(true);
    try {
      const data = await apiService.getCronJobs();
      // API returns data directly: {cron_jobs: [], wp_cron_disabled: bool, ...}
      setCronJobs(data?.cron_jobs || []);
      setCronInfo({
        wp_cron_disabled: data?.wp_cron_disabled || false,
        alternate_cron: data?.alternate_cron || false,
      });
    } catch (error) {
      console.error("Failed to load cron jobs:", error);
    } finally {
      setIsLoadingCronJobs(false);
    }
  };

  // Run a cron job manually
  const handleRunCronJob = async (hook: string) => {
    setRunningCronJob(hook);
    try {
      const data = await apiService.runCronJob(hook);
      // API returns data directly: {success: true, message: ...}
      if (data.success) {
        showToast(
          data.message || `Cron job "${hook}" executed successfully`,
          "success",
        );
        // Reload cron jobs to update next run times
        loadCronJobs();
      } else {
        showToast(data.message || "Failed to run cron job", "error");
      }
    } catch (error) {
      console.error("Failed to run cron job:", error);
      showToast("Failed to run cron job", "error");
    } finally {
      setRunningCronJob(null);
    }
  };

  // Load cache data for viewing
  const loadCacheData = async () => {
    setIsLoadingCache(true);
    try {
      const data = await apiService.getCacheView();

      // API returns consistent structure: {success, message, data}
      if (data.success && data.data) {
        setCacheData(data.data.cache_data || []);
        showToast(data.message || "Cache data loaded successfully", "success");
      } else {
        showToast(data.message || "Failed to load cache data", "error");
      }
    } catch (error) {
      console.error("Failed to load cache data:", error);
      showToast("Failed to load cache data", "error");
    } finally {
      setIsLoadingCache(false);
    }
  };

  // Clear individual cache item
  const clearCacheItem = async (key: string, type: string) => {
    try {
      const data = await apiService.clearCacheItem(key, type);

      // API returns consistent structure: {success, message, data}
      if (data.success) {
        // Remove the item from the cache data
        setCacheData((prev) => prev.filter((item) => item.key !== key));
        showToast(
          data.message || `Cache item "${key}" cleared successfully`,
          "success",
        );
      } else {
        showToast(data.message || "Failed to clear cache item", "error");
      }
    } catch (error) {
      console.error("Failed to clear cache item:", error);
      showToast("Failed to clear cache item", "error");
    }
  };

  // Clear all caches
  const clearAllCache = async () => {
    setIsClearingCache(true);
    try {
      const data = await apiService.clearCache();

      // Clear React Query cache if available
      if (
        (window as any).yatraQueryClient &&
        typeof (window as any).yatraQueryClient.invalidateQueries === "function"
      ) {
        (window as any).yatraQueryClient.invalidateQueries();
      }

      // Fixed handling of response
      if (data.success) {
        // Only show success message if both response.ok and data.success are true
        showToast(
          "All caches cleared successfully! Please refresh the page to see the changes.",
          "success",
        );
      } else {
        // Create a clean error message without concatenation issues
        let errorMessage = "Failed to clear caches";

        // Only append additional details if they don't create a contradictory message
        if (data.message && !data.message.includes("success")) {
          errorMessage += ": " + data.message;
        }

        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Failed to clear caches:", error);
      showToast("Failed to clear caches. Please try again.", "error");
    } finally {
      setIsClearingCache(false);
    }
  };

  // Load migration status
  const loadMigrationStatus = async () => {
    setIsLoadingMigration(true);
    try {
      const data = await apiService.getMigrationStatus();
      setMigrationStatus(data);
    } catch (error) {
      console.error("Failed to load migration status:", error);
      showToast("Failed to load migration status", "error");
    } finally {
      setIsLoadingMigration(false);
    }
  };

  const handleDismissMigrationNotice = async () => {
    try {
      await apiService.clearMigration();
      setShowMigrationCompleteNotice(false);
      await loadMigrationProgress();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(MIGRATION_NOTICE_KEY);
      }
    } catch (error) {
      showToast("Failed to clear migration data.", "error");
    }
  };

  // Load migration progress
  const loadMigrationProgress = async () => {
    try {
      const data = await apiService.getMigrationProgress();

      setMigrationProgress(data);

      // If migration is still running, keep polling
      if (data.any_running && !data.all_complete) {
        setIsMigrating(true);
        // Start polling if not already polling
        if (!migrationPollingRef.current) {
          migrationPollingRef.current = setInterval(
            loadMigrationProgress,
            3000,
          );
        }
      } else if (data.all_complete && data.started_at) {
        setIsMigrating(false);
        stopMigrationPolling();
      }
    } catch (error) {
      console.error("Failed to load migration progress:", error);
    }
  };

  // Start polling migration progress
  const startMigrationPolling = () => {
    if (migrationPollingRef.current) {
      clearInterval(migrationPollingRef.current);
    }

    loadMigrationProgress();
    // Poll every 1 second for more frequent progress updates
    migrationPollingRef.current = setInterval(loadMigrationProgress, 1000);
  };

  // Stop polling migration progress
  const stopMigrationPolling = () => {
    if (migrationPollingRef.current) {
      clearInterval(migrationPollingRef.current);
      migrationPollingRef.current = null;
    }
  };

  // Migrate all data types
  const handleMigrateAll = async (force = false) => {
    setIsMigrating(true);
    setIsStartingMigration(true);
    try {
      const data = await apiService.runMigrationAll({ force });

      if (data.success) {
        showToast(
          "Migration started for all data types. Processing in background...",
          "success",
        );
        if (Array.isArray(data.warnings) && data.warnings.length > 0) {
          showToast(String(data.warnings[0]), "warning");
        }
        // Immediately load progress to initialize the display
        await loadMigrationProgress();
        startMigrationPolling();
        setIsStartingMigration(false);
      } else {
        showToast(data.error || data.message || "Migration failed", "error");
        setIsMigrating(false);
        setIsStartingMigration(false);
      }
    } catch (error) {
      console.error("Migration error:", error);
      showToast("Migration failed. Please try again.", "error");
      setIsMigrating(false);
      setIsStartingMigration(false);
    }
  };

  // Cancel migration
  const handleCancelMigration = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel the migration? This will stop all ongoing migrations.",
      )
    ) {
      return;
    }

    try {
      const data = await apiService.cancelMigration();

      if (data.success) {
        showToast("Migration cancelled successfully", "success");
        setIsMigrating(false);
        stopMigrationPolling();
        loadMigrationStatus();
      } else {
        showToast(data.error || "Failed to cancel migration", "error");
      }
    } catch (error) {
      console.error("Cancel migration error:", error);
      showToast("Failed to cancel migration", "error");
    }
  };

  useEffect(() => {
    if (activeTab === "system-status") {
      loadSystemStatus();
    } else if (activeTab === "logs") {
      loadLogs(selectedLogType);
    } else if (activeTab === "jobs") {
      loadAllJobs();
      loadCronJobs();
    } else if (activeTab === "migration") {
      loadMigrationStatus();
      loadMigrationProgress();
    }

    // Cleanup migration polling when leaving tab
    return () => {
      if (activeTab === "migration") {
        stopMigrationPolling();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedLogType]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tools
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Export/Import data, check system status, and view logs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() =>
              window.open("/wp-admin/admin.php?page=yatra-setup", "_blank")
            }
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Setup Wizard
          </Button>
          <Button
            onClick={clearAllCache}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isClearingCache}
          >
            <RefreshCw
              className={`w-4 h-4 ${isClearingCache ? "animate-spin" : ""}`}
            />
            {isClearingCache ? "Clearing..." : "Clear Cache"}
          </Button>
          <Button
            onClick={() => {
              setShowCacheModal(true);
              loadCacheData();
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Cache
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tab Navigation - Clean and Spacious Design */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 mb-8">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab("export-import")}
              className={`flex-1 py-3 px-6 rounded-md font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 ${
                activeTab === "export-import"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <Download className="w-5 h-5" />
              <span>Export/Import</span>
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`flex-1 py-3 px-6 rounded-md font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 ${
                activeTab === "jobs"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <List className="w-5 h-5" />
              <span>Jobs</span>
            </button>
            <button
              onClick={() => setActiveTab("system-status")}
              className={`flex-1 py-3 px-6 rounded-md font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 ${
                activeTab === "system-status"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <Server className="w-5 h-5" />
              <span>System Status</span>
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex-1 py-3 px-6 rounded-md font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 ${
                activeTab === "logs"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Logs</span>
            </button>
            <button
              onClick={() => setActiveTab("migration")}
              className={`flex-1 py-3 px-6 rounded-md font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 ${
                activeTab === "migration"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Migration</span>
            </button>
          </nav>
        </div>

        {/* Export/Import Tab */}
        {activeTab === "export-import" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Export Section */}
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Export Data
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Download your data
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Export your Yatra data for backup or migration purposes. Click
                  the button below to select which data types to export.
                </p>

                {/* Export Job Progress */}
                {exportJob &&
                  (exportJob.status === "pending" ||
                    exportJob.status === "running") && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                          {exportJob.status === "pending"
                            ? "Queued..."
                            : "Exporting..."}
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
                        {exportJob.processed_records} /{" "}
                        {exportJob.total_records} records processed
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Processing in background. You can close this page and
                        come back later.
                      </p>
                    </div>
                  )}

                {/* Export Complete - Download Button */}
                {exportJob && exportJob.status === "completed" && (
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
                  disabled={
                    isExporting ||
                    !!(
                      exportJob &&
                      (exportJob.status === "pending" ||
                        exportJob.status === "running")
                    )
                  }
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
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Import Data
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Restore from backup
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Import Yatra data from a previously exported JSON file. Drop
                  your file below or click to browse.
                </p>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    isDragOver
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                  } ${isImporting ? "pointer-events-none opacity-50" : ""}`}
                >
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    disabled={isImporting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className={`p-4 rounded-full ${
                        isDragOver
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <Upload
                        className={`w-8 h-8 ${
                          isDragOver
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {isDragOver
                          ? "Drop your JSON file here"
                          : "Drop JSON file or click to browse"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Supports JSON files exported from Yatra
                      </p>
                    </div>
                  </div>
                </div>

                {/* Import Job Progress */}
                {importJob &&
                  (importJob.status === "pending" ||
                    importJob.status === "running") && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          {importJob.status === "pending"
                            ? "Queued..."
                            : "Importing..."}
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
                        {importJob.processed_records} /{" "}
                        {importJob.total_records} records processed
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Processing in background. You can close this page and
                        come back later.
                      </p>
                    </div>
                  )}

                {/* Import Complete - with detailed statistics and shown only once */}
                {importJob && importJob.status === "completed" && (
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
                            await apiService.deleteImportJob(importJob.id);
                          } catch (e) {
                            console.error("Error deleting import job:", e);
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
                      Total: <strong>{importJob.processed_records}</strong>{" "}
                      records imported
                    </div>

                    {/* Detailed statistics by data type */}
                    {importJob.import_stats &&
                      Object.keys(importJob.import_stats).length > 0 && (
                        <div className="mt-2 border-t border-green-200 dark:border-green-800 pt-2">
                          <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">
                            Import Details:
                          </div>
                          <div className="grid grid-cols-1 gap-1">
                            {Object.entries(importJob.import_stats).map(
                              ([dataType, stats]: [string, any]) => {
                                // Find the matching data type object for the icon
                                const dataTypeObj = dataTypes.find(
                                  (dt) => dt.key === dataType,
                                );
                                const Icon = dataTypeObj?.icon || FileText;

                                return (
                                  <div
                                    key={dataType}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-1">
                                      <Icon className="w-3 h-3 text-green-600 dark:text-green-400" />
                                      <span className="capitalize">
                                        {dataType.replace("_", " ")}:
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-green-700 dark:text-green-400">
                                        {stats.imported}
                                      </span>
                                      {stats.failed > 0 && (
                                        <span className="text-red-600 dark:text-red-400 ml-1">
                                          ({stats.failed} failed)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                    {/* We don't need to mark as seen anymore since we'll remove from localStorage on dismiss */}
                  </div>
                )}

                {/* Import Failed */}
                {importJob && importJob.status === "failed" && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">
                        Import failed: {importJob.error || "Unknown error"}
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
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Important Notice
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                    Importing data will create new records. Existing data will
                    not be overwritten. Always backup your database before
                    importing data to prevent any potential data loss.
                  </p>
                </div>
              </div>
            </Card>

            {/* Sample Data Section */}
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Import Sample Data
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Quick setup with demo content
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Quickly populate your Yatra site with sample trips, categories,
                destinations, and more. Perfect for testing and demonstration
                purposes.
              </p>

              {/* What Will Be Imported */}
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    The following data will be imported automatically:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>11 Sample Trips (multi-day & single-day)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span>8 Categories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span>10 Activities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>10 Destinations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mountain className="w-4 h-4" />
                      <span>6 Difficulty Levels</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span>8 Attributes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      <span>6 Itinerary Item Types</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>8 Traveler Categories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span>8 Discount Codes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>21 Availability Dates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <span>9 Availability Rules</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>31 Itinerary Days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      <span>25 Itinerary Entries</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleImportSampleData}
                  disabled={isImportingSampleData}
                  className="flex-1"
                  size="lg"
                >
                  {isImportingSampleData ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Import Sample Data
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* System Status Tab */}
        {activeTab === "system-status" && (
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
                          <div
                            key={i}
                            className="flex justify-between items-center"
                          >
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
                      <span className="text-gray-600 dark:text-gray-400">
                        Version:
                      </span>
                      <span className="font-medium">
                        {systemStatus.php.version}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Memory Limit:
                      </span>
                      <span className="font-medium">
                        {systemStatus.php.memory_limit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Max Execution Time:
                      </span>
                      <span className="font-medium">
                        {systemStatus.php.max_execution_time}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Upload Max Size:
                      </span>
                      <span className="font-medium">
                        {systemStatus.php.upload_max_filesize}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* WordPress Information */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    WordPress Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Version:
                      </span>
                      <span className="font-medium">
                        {systemStatus.wordpress.version}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Multisite:
                      </span>
                      <span className="font-medium">
                        {systemStatus.wordpress.multisite ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Debug Mode:
                      </span>
                      <span className="font-medium">
                        {systemStatus.wordpress.debug_mode
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Requirements Check */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Requirements Check
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(systemStatus.requirements).map(
                      ([key, req]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <span className="font-medium capitalize">
                              {key.replace("_", " ")}
                            </span>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Required: {req.required} | Current: {req.current}
                            </div>
                          </div>
                          {getStatusBadge(req.status)}
                        </div>
                      ),
                    )}
                  </div>
                </Card>

                {/* Extensions */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">PHP Extensions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(systemStatus.extensions).map(
                      ([ext, loaded]) => (
                        <div
                          key={ext}
                          className="flex items-center justify-between"
                        >
                          <span className="font-medium">{ext}</span>
                          {loaded ? (
                            <Badge variant="success">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Loaded
                            </Badge>
                          ) : (
                            <Badge variant="error">
                              <XCircle className="w-3 h-3 mr-1" />
                              Missing
                            </Badge>
                          )}
                        </div>
                      ),
                    )}
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
        {activeTab === "jobs" && (
          <div className="space-y-6">
            {/* Export/Import Jobs Section */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <List className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Export & Import Jobs
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {allJobs.length} job{allJobs.length !== 1 ? "s" : ""} in
                      history
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAllJobs}
                  disabled={isLoadingJobs}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoadingJobs ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              {isLoadingJobs ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 animate-pulse"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="flex-1">
                          <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="w-48 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                      <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : allJobs.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {allJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Icon + Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`p-2 rounded-lg flex-shrink-0 ${
                              job.type === "export"
                                ? "bg-blue-100 dark:bg-blue-900/30"
                                : "bg-green-100 dark:bg-green-900/30"
                            }`}
                          >
                            {job.type === "export" ? (
                              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Upload className="w-4 h-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {job.type === "export" ? "Export" : "Import"} #
                                {job.id.slice(-6)}
                              </span>
                              {/* Status Badge */}
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                  job.status === "completed"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : job.status === "running"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      : job.status === "pending"
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                }`}
                              >
                                {job.status === "running" && (
                                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                )}
                                {job.status.charAt(0).toUpperCase() +
                                  job.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                {new Date(job.created_at).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span>
                                {job.processed_records || 0}/
                                {job.total_records || 0} records
                              </span>
                              {job.status === "running" && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {job.progress}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Progress or Action */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {job.status === "running" && (
                            <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${job.progress}%` }}
                              ></div>
                            </div>
                          )}
                          {job.type === "export" &&
                            job.status === "completed" &&
                            job.file_url && (
                              <a
                                href={job.file_url}
                                download
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </a>
                            )}
                        </div>
                      </div>

                      {/* Error Message */}
                      {job.error && (
                        <div className="mt-2 ml-11 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
                          {job.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <List className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No export/import jobs yet
                  </p>
                </div>
              )}
            </Card>

            {/* Cron Jobs Section */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Scheduled Tasks
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {cronJobs.length} active cron job
                      {cronJobs.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCronJobs}
                  disabled={isLoadingCronJobs}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoadingCronJobs ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              {/* WP Cron Status Warning */}
              {cronInfo?.wp_cron_disabled && (
                <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span className="text-sm text-amber-800 dark:text-amber-400">
                      WP-Cron is disabled. A server-side cron is required.
                    </span>
                  </div>
                </div>
              )}

              {isLoadingCronJobs ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 animate-pulse"
                    >
                      <div className="flex-1">
                        <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                      <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : cronJobs.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {cronJobs.map((cron, index) => (
                    <div
                      key={`${cron.hook}-${index}`}
                      className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        cron.is_overdue ? "bg-red-50/50 dark:bg-red-900/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            cron.is_overdue ? "bg-red-500" : "bg-green-500"
                          }`}
                        ></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {cron.hook
                                .replace("yatra_", "")
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                            <code className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                              {cron.schedule || "once"}
                            </code>
                            {cron.is_overdue && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span
                              className="flex items-center gap-1 cursor-help"
                              title={cron.next_run_formatted}
                            >
                              <Calendar className="w-3 h-3" />
                              {cron.next_run_relative}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              {cron.schedule_label}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 font-mono">
                            {cron.hook}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRunCronJob(cron.hook)}
                        disabled={runningCronJob === cron.hook}
                        className="ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        {runningCronJob === cron.hook ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="text-xs font-medium">Run</span>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <Activity className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No scheduled tasks
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Migration Tab */}
        {activeTab === "migration" && (
          <Card className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Data Migration
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Migrate from Yatra 2.x to 3.0
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {migrationStatus?.has_old_data && (
                <div className="flex items-center gap-2">
                  {(isMigrating || isStartingMigration) &&
                    !migrationProgress?.all_complete && (
                      <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mr-1">
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
                        <span>Migration running</span>
                      </div>
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      loadMigrationStatus();
                      if (isMigrating) loadMigrationProgress();
                    }}
                    disabled={
                      (isMigrating || isStartingMigration) &&
                      !migrationProgress?.all_complete
                    }
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${isMigrating && !migrationProgress?.all_complete ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>

                  {isMigrating && !migrationProgress?.all_complete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancelMigration}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}

                  {!isMigrating && (
                    <Button
                      onClick={() => setShowMigrationConfirm(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                      size="sm"
                      disabled={isStartingMigration}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      {migrationProgress?.all_complete &&
                      migrationProgress?.started_at
                        ? "Migrate Again"
                        : "Start Migration"}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {migrationStatus?.has_old_data &&
              (() => {
                const pm =
                  migrationProgress?.pro_migration ??
                  migrationStatus?.pro_migration;
                if (!pm || pm.ready) {
                  return null;
                }
                return (
                  <div className="mb-6 p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h4 className="font-medium text-amber-900 dark:text-amber-200">
                        {__(
                          "Yatra Pro 3.0+ required for full migration",
                          "yatra",
                        )}
                      </h4>
                      <p className="text-sm text-amber-800 dark:text-amber-300/90 mt-1">
                        {pm.warning_message}
                      </p>
                      {pm.multiple_pro_plugins &&
                        Array.isArray(pm.active_pro_plugins) &&
                        pm.active_pro_plugins.length > 0 && (
                          <ul className="text-xs text-amber-800 dark:text-amber-300/80 mt-2 list-disc pl-5 space-y-0.5">
                            {pm.active_pro_plugins.map(
                              (p: {
                                file: string;
                                name?: string;
                                version?: string | null;
                              }) => (
                                <li key={p.file}>
                                  {p.file}
                                  {p.version != null && p.version !== ""
                                    ? ` (${p.version})`
                                    : ""}
                                </li>
                              ),
                            )}
                          </ul>
                        )}
                    </div>
                  </div>
                );
              })()}

            {/* Loading State */}
            {isLoadingMigration ? (
              <div className="space-y-4">
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            ) : migrationStatus?.has_old_data ? (
              <div className="space-y-6">
                {/* Migration Completion Notice */}
                {migrationProgress?.all_complete &&
                  migrationProgress?.started_at &&
                  Object.keys(migrationProgress.progress || {}).length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-green-900 dark:text-green-300">
                            Migration Completed Successfully!
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                            All data has been migrated from Yatra 2.x to 3.0
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsMigrating(false);
                            setMigrationProgress(null);
                          }}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                {/* Advanced Progress Bar (only show during migration) */}
                {(isMigrating || isStartingMigration) &&
                  (!migrationProgress ||
                    !migrationProgress.started_at ||
                    Object.keys(migrationProgress.progress || {}).length ===
                      0) && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                        <div>
                          <div className="font-medium text-blue-900 dark:text-blue-300">
                            Starting migration…
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-400">
                            Initializing background tasks and loading progress.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {migrationProgress &&
                  !migrationProgress.all_complete &&
                  migrationProgress.started_at &&
                  Object.keys(migrationProgress.progress || {}).length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                          <span className="font-medium text-blue-900 dark:text-blue-300">
                            Migration in Progress
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setIsMigrating(false);
                            setMigrationProgress(null);
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Overall Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-700 dark:text-gray-300">
                            Overall Progress
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {(() => {
                              const total = Object.values(
                                migrationProgress.progress || {},
                              ).reduce(
                                (sum: number, p: any) => sum + (p.total || 0),
                                0,
                              );
                              const processed = Object.values(
                                migrationProgress.progress || {},
                              ).reduce(
                                (sum: number, p: any) =>
                                  sum +
                                  (p.migrated || 0) +
                                  (p.skipped || 0) +
                                  (p.failed || 0),
                                0,
                              );
                              return total > 0
                                ? Math.round((processed / total) * 100)
                                : 0;
                            })()}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-500"
                            style={{
                              width: `${(() => {
                                const total = Object.values(
                                  migrationProgress.progress || {},
                                ).reduce(
                                  (sum: number, p: any) => sum + (p.total || 0),
                                  0,
                                );
                                const processed = Object.values(
                                  migrationProgress.progress || {},
                                ).reduce(
                                  (sum: number, p: any) =>
                                    sum +
                                    (p.migrated || 0) +
                                    (p.skipped || 0) +
                                    (p.failed || 0),
                                  0,
                                );
                                return total > 0
                                  ? Math.round((processed / total) * 100)
                                  : 0;
                              })()}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Detailed Breakdown by Data Type */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Progress by Data Type
                        </h5>
                        {Object.entries(migrationProgress.progress || {}).map(
                          ([key, progress]: [string, any]) => {
                            const dataInfo = migrationStatus?.old_data?.[key];
                            if (!dataInfo || progress.total === 0) return null;

                            const percentage =
                              progress.total > 0
                                ? Math.round(
                                    (((progress.migrated || 0) +
                                      (progress.skipped || 0) +
                                      (progress.failed || 0)) /
                                      progress.total) *
                                      100,
                                  )
                                : 0;

                            return (
                              <div
                                key={key}
                                className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {progress.status === "running" ? (
                                      <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                                    ) : progress.status === "completed" ? (
                                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                    )}
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {dataInfo.label}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {(progress.migrated || 0) +
                                      (progress.skipped || 0) +
                                      (progress.failed || 0)}
                                    /{progress.total}
                                  </span>
                                </div>

                                {/* Individual Progress Bar */}
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      progress.status === "completed"
                                        ? "bg-green-500"
                                        : progress.status === "running"
                                          ? "bg-blue-500"
                                          : "bg-gray-400"
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>

                                {/* Stats */}
                                {(progress.migrated || 0) +
                                  (progress.skipped || 0) +
                                  (progress.failed || 0) >
                                  0 && (
                                  <div className="flex items-center gap-3 text-xs">
                                    {progress.migrated > 0 && (
                                      <span className="text-green-600 dark:text-green-400">
                                        ✓ {progress.migrated} migrated
                                      </span>
                                    )}
                                    {progress.skipped > 0 && (
                                      <span className="text-yellow-600 dark:text-yellow-400">
                                        ⊘ {progress.skipped} skipped
                                      </span>
                                    )}
                                    {progress.failed > 0 && (
                                      <span className="text-red-600 dark:text-red-400">
                                        ✗ {progress.failed} failed
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                {/* Migration Summary (show after completion) */}
                {migrationProgress?.all_complete &&
                  migrationProgress?.started_at &&
                  Object.keys(migrationProgress.progress || {}).length > 0 &&
                  (() => {
                    const totalMigrated = Object.values(
                      migrationProgress.progress || {},
                    ).reduce(
                      (sum: number, p: any) => sum + (p.migrated || 0),
                      0,
                    );
                    const totalSkipped = Object.values(
                      migrationProgress.progress || {},
                    ).reduce(
                      (sum: number, p: any) => sum + (p.skipped || 0),
                      0,
                    );
                    const totalFailed = Object.values(
                      migrationProgress.progress || {},
                    ).reduce((sum: number, p: any) => sum + (p.failed || 0), 0);

                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Migration Summary
                          </h4>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-green-600 dark:text-green-400">
                              ✓ {totalMigrated} migrated
                            </span>
                            {totalSkipped > 0 && (
                              <span className="text-yellow-600 dark:text-yellow-400">
                                ⊘ {totalSkipped} skipped
                              </span>
                            )}
                            {totalFailed > 0 && (
                              <span className="text-red-600 dark:text-red-400">
                                ✗ {totalFailed} failed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(migrationProgress.progress || {}).map(
                            ([key, progress]: [string, any]) => {
                              const dataInfo = migrationStatus?.old_data?.[key];

                              if (!dataInfo) return null;

                              const totalProcessed =
                                (progress.migrated || 0) +
                                (progress.skipped || 0) +
                                (progress.failed || 0);
                              if (totalProcessed === 0) return null;

                              return (
                                <div
                                  key={key}
                                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                >
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {dataInfo.label}
                                  </span>
                                  <div className="flex items-center gap-3 text-xs">
                                    {progress.migrated > 0 && (
                                      <span className="text-green-600 dark:text-green-400">
                                        ✓ {progress.migrated}
                                      </span>
                                    )}
                                    {progress.skipped > 0 && (
                                      <span className="text-yellow-600 dark:text-yellow-400">
                                        ⊘ {progress.skipped}
                                      </span>
                                    )}
                                    {progress.failed > 0 && (
                                      <span className="text-red-600 dark:text-red-400">
                                        ✗ {progress.failed}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    );
                  })()}

                {/* Data Type Cards - Simple Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(migrationStatus.old_data || {}).map(
                    ([key, data]: [string, any]) => (
                      <div
                        key={key}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {data.label}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {data.description}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {data.table}
                            </p>
                          </div>
                          <Badge className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                            {data.count}
                          </Badge>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : (
              // No Data State
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                  No Migration Needed
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your database is up to date
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            {/* Log Type Selector */}
            <div className="flex flex-wrap gap-2">
              {logTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.key}
                    variant={
                      selectedLogType === type.key ? "default" : "outline"
                    }
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
                <h3 className="text-lg font-semibold capitalize">
                  {selectedLogType} Logs
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadLogs(selectedLogType)}
                    disabled={isLoadingLogs}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isLoadingLogs ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllLogsToClipboard}
                    disabled={
                      !logs[selectedLogType]?.logs ||
                      logs[selectedLogType].logs.length === 0
                    }
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy All
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleClearLogs()}
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
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 animate-pulse"
                    >
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
                logs[selectedLogType].logs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getLogLevelBadge(log.level)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLogToClipboard(log)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 h-6 w-6"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm font-medium mb-2">{log.message}</p>
                    {log.context && Object.keys(log.context).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 dark:text-gray-400">
                          View Context
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No logs found for this type</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div
            className="fixed top-0 left-0 right-0 bottom-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-50"
            style={{ margin: 0, padding: 0 }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[85vh] overflow-hidden mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Select Data Types to Export
                </h3>
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
                      checked={
                        selectableDataTypes.length > 0 &&
                        selectableDataTypes.every((dt) =>
                          selectedExportData.includes(dt.key),
                        ) &&
                        !selectedExportData.includes("all")
                      }
                      onChange={handleExportSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                        {selectableDataTypes.length > 0 &&
                        selectableDataTypes.every((dt) =>
                          selectedExportData.includes(dt.key),
                        ) &&
                        !selectedExportData.includes("all")
                          ? "Deselect All"
                          : "Select All"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({selectableDataTypes.length} individual types)
                      </span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {dataTypes.map((dataType) => (
                    <label
                      key={dataType.key}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedExportData.includes(dataType.key)}
                        onChange={() => handleExportDataToggle(dataType.key)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <dataType.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {dataType.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {dataType.description}
                        </p>
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
          <div
            className="fixed top-0 left-0 right-0 bottom-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-50"
            style={{ margin: 0, padding: 0 }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm Deletion
                </h3>
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
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      Delete Export File?
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This action cannot be undone. The export file will be
                      permanently deleted from the server.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCancelDelete}>
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

        {/* Clear Logs Confirmation Modal */}
        {showClearLogsModal && (
          <div
            className="fixed top-0 left-0 right-0 bottom-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-50"
            style={{ margin: 0, padding: 0 }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Clear Logs
                </h3>
                <button
                  onClick={() => setShowClearLogsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      Clear {selectedLogType} logs?
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This action cannot be undone. All {selectedLogType} logs
                      will be permanently deleted from the server.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowClearLogsModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmClearLogs}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Logs
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && pendingImportFile && (
          <div
            className="fixed top-0 left-0 right-0 bottom-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-50"
            style={{ margin: 0, padding: 0 }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[85vh] overflow-hidden mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Select Data Types to Import
                  </h3>
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
                <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <label className="flex items-center gap-3 p-3 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={
                        selectableDataTypes.length > 0 &&
                        selectableDataTypes.every((dt) =>
                          selectedImportData.includes(dt.key),
                        ) &&
                        !selectedImportData.includes("all")
                      }
                      onChange={handleImportSelectAll}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                        {selectableDataTypes.length > 0 &&
                        selectableDataTypes.every((dt) =>
                          selectedImportData.includes(dt.key),
                        ) &&
                        !selectedImportData.includes("all")
                          ? "Deselect All"
                          : "Select All"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({selectableDataTypes.length} individual types)
                      </span>
                    </div>
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {dataTypes.map((dataType) => (
                    <label
                      key={dataType.key}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedImportData.includes(dataType.key)}
                        onChange={() => handleImportDataToggle(dataType.key)}
                        className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <dataType.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {dataType.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {dataType.description}
                        </p>
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

        {/* Migration Confirmation Modal */}
        <Modal
          isOpen={showMigrationConfirm}
          onClose={() => setShowMigrationConfirm(false)}
          title={__("Migrate All Data")}
          description={__(
            "This process runs in the background and may take several minutes. Please back up your database before proceeding.",
          )}
          size="md"
          footer={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setShowMigrationConfirm(false)}
                className="w-full sm:w-auto"
              >
                {__("Cancel")}
              </Button>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowMigrationConfirm(false);
                    handleMigrateAll(true);
                  }}
                  className="w-full sm:w-auto"
                >
                  {__("Re-migrate All")}
                </Button>
                <Button
                  onClick={() => {
                    setShowMigrationConfirm(false);
                    handleMigrateAll(false);
                  }}
                  className="w-full sm:w-auto"
                >
                  {__("Start Migration")}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <p>
              {__(
                "All legacy data types will be migrated to the new Yatra 3.0 database structure. The migration runs asynchronously via WordPress cron.",
              )}
            </p>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  {__("Important")}
                </p>
                <p className="mt-1 text-sm">
                  {__(
                    "Keep this tab open to monitor progress. Use “Re-migrate All” only if you need to reprocess items that were already migrated.",
                  )}
                </p>
              </div>
            </div>
            {migrationStatus?.pro_migration &&
              !migrationStatus.pro_migration.ready && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-md flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-200">
                      {__("Yatra Pro", "yatra")}
                    </p>
                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/90">
                      {migrationStatus.pro_migration.warning_message}
                    </p>
                  </div>
                </div>
              )}
          </div>
        </Modal>

        {/* Cache View Modal */}
        <Modal
          isOpen={showCacheModal}
          onClose={() => setShowCacheModal(false)}
          title="View Cache Data"
          size="lg"
        >
          <div className="space-y-4">
            {isLoadingCache ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span>Loading cache data...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {cacheData.length} cache items found
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadCacheData}
                    disabled={isLoadingCache}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-1 ${isLoadingCache ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>

                {cacheData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No cache data found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                            Cache Key
                          </th>
                          <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                            Type
                          </th>
                          <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                            Size
                          </th>
                          <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                            Created
                          </th>
                          <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                            Expires
                          </th>
                          <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cacheData.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <td className="p-3">
                              <div
                                className="max-w-md truncate font-mono text-xs font-semibold"
                                title={item.key}
                              >
                                {item.key}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 max-h-32 overflow-auto bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                                <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                                  {item.value}
                                </pre>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  item.type === "transient"
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {item.type}
                              </Badge>
                            </td>
                            <td className="p-3 text-gray-600 dark:text-gray-400">
                              {formatBytes(item.size)}
                            </td>
                            <td className="p-3 text-gray-600 dark:text-gray-400 text-xs">
                              {item.created_at}
                            </td>
                            <td className="p-3 text-gray-600 dark:text-gray-400 text-xs">
                              {item.expires_at}
                            </td>
                            <td className="p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  clearCacheItem(item.key, item.type)
                                }
                                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Clear
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Tools;
