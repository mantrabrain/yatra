import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { __ } from "../lib/i18n";
import { useToast } from "../components/ui/toast";
import {
  Key,
  Check,
  XCircle,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Bug,
  ChevronDown,
} from "lucide-react";

interface LicenseInfo {
  key: string;
  status: string;
  last_checked: number;
  server_response: {
    expires?: string;
    customer_name?: string;
    customer_email?: string;
    license_limit?: number;
    site_count?: number;
    activations_left?: number;
  };
}

interface LicenseData {
  is_pro: boolean;
  license_info?: LicenseInfo;
  upgrade_url: string;
}

const License: React.FC = () => {
  const [licenseKey, setLicenseKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Check if Pro is active from global config
  const yatraAdmin = (window as any)?.yatraAdmin;
  const isPro = yatraAdmin?.isPro || false;

  // Fetch license data
  const { data: licenseData, isLoading } = useQuery<LicenseData>({
    queryKey: ["license"],
    queryFn: async () => {
      const response = await apiClient.get("/license");

      return response;
    },
  });

  // Set license key from data
  useEffect(() => {
    if (licenseData?.license_info?.key) {
      setLicenseKey(licenseData.license_info.key);
    } else {
    }
  }, [licenseData]);

  // Activate license mutation
  const activateMutation = useMutation({
    mutationFn: async (key: string) => {
      try {
        const response = await apiClient.post("/license/activate", {
          license_key: key,
        });

        return response;
      } catch (error) {
        console.error("License activation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Always store debug data (will be shown if debug mode is enabled)

      const debugInfo = {
        type: "activate",
        request: { license_key: licenseKey },
        response: data,
        timestamp: new Date().toISOString(),
      };

      setDebugData(debugInfo);

      if (data?.status === "valid") {
        showToast(data.notice || "License activated successfully!", "success");
        // Refetch license data to get updated status
        queryClient.invalidateQueries({ queryKey: ["license"] });
        // Dispatch event for real-time badge update
        window.dispatchEvent(
          new CustomEvent("yatra-license-status-updated", {
            detail: { status: "active" },
          }),
        );
      } else {
        showToast(data?.notice || "License activation failed.", "error");
      }
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.message ||
        "Failed to activate license. Please try again.";
      showToast(errorMsg, "error");
      // Always store debug data (will be shown if debug mode is enabled)
      setDebugData({
        type: "activate",
        request: { license_key: licenseKey },
        response: error.response?.data,
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString(),
      });
    },
  });

  // Deactivate license mutation
  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/license/deactivate");
      return response.data;
    },
    onSuccess: (data) => {
      // Always store debug data (will be shown if debug mode is enabled)
      setDebugData({
        type: "deactivate",
        request: {},
        response: data,
        timestamp: new Date().toISOString(),
      });

      setLicenseKey("");
      showToast(data?.notice || "License deactivated successfully!", "success");
      // Refetch license data to get updated status
      queryClient.invalidateQueries({ queryKey: ["license"] });
      // Dispatch event for real-time badge update
      window.dispatchEvent(
        new CustomEvent("yatra-license-status-updated", {
          detail: { status: "inactive" },
        }),
      );
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.message ||
        "Failed to deactivate license. Please try again.";
      showToast(errorMsg, "error");
      // Always store debug data (will be shown if debug mode is enabled)
      setDebugData({
        type: "deactivate",
        request: {},
        response: error.response?.data,
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString(),
      });
    },
  });

  // Save license mutation
  const saveMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiClient.post("/license/save", {
        license_key: key,
      });
      return response;
    },
    onSuccess: (data) => {
      showToast(data?.notice || "License key saved successfully!", "success");
      // Refetch license data to show the saved key
      queryClient.invalidateQueries({ queryKey: ["license"] });
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.message || "Failed to save license key.";
      showToast(errorMsg, "error");
    },
  });

  // Check license mutation
  const checkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/license/check");
      return response;
    },
    onSuccess: (data) => {
      // Always store debug data (will be shown if debug mode is enabled)
      setDebugData({
        type: "check",
        request: {},
        response: data,
        timestamp: new Date().toISOString(),
      });

      showToast(data?.notice || "License status updated.", "success");
      // Refetch license data to get updated status
      queryClient.invalidateQueries({ queryKey: ["license"] });
      // Dispatch event for real-time badge update with actual status from response
      if (data?.license_info?.status) {
        window.dispatchEvent(
          new CustomEvent("yatra-license-status-updated", {
            detail: { status: data.license_info.status },
          }),
        );
      }
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.message || "Failed to check license status.";
      showToast(errorMsg, "error");
      // Always store debug data (will be shown if debug mode is enabled)
      setDebugData({
        type: "check",
        request: {},
        response: error.response?.data,
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString(),
      });
    },
  });

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      showToast("Please enter a license key.", "error");
      return;
    }
    activateMutation.mutate(licenseKey);
  };

  const handleDeactivate = () => {
    setShowDeactivateConfirm(true);
  };

  const confirmDeactivate = () => {
    setShowDeactivateConfirm(false);
    deactivateMutation.mutate();
  };

  const handleCheckStatus = () => {
    checkMutation.mutate();
  };

  const maskLicenseKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 4) + "••••••••••••" + key.substring(key.length - 4);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      active: {
        bg: "bg-green-100 dark:bg-green-900/20",
        text: "text-green-800 dark:text-green-400",
        label: "Active",
      },
      valid: {
        bg: "bg-green-100 dark:bg-green-900/20",
        text: "text-green-800 dark:text-green-400",
        label: "Active",
      },
      inactive: {
        bg: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-800 dark:text-gray-300",
        label: "Inactive",
      },
      expired: {
        bg: "bg-red-100 dark:bg-red-900/20",
        text: "text-red-800 dark:text-red-400",
        label: "Expired",
      },
      disabled: {
        bg: "bg-red-100 dark:bg-red-900/20",
        text: "text-red-800 dark:text-red-400",
        label: "Disabled",
      },
      invalid: {
        bg: "bg-yellow-100 dark:bg-yellow-900/20",
        text: "text-yellow-800 dark:text-yellow-400",
        label: "Invalid",
      },
    };

    const config = statusConfig[status] || statusConfig.inactive;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  // Skeleton loading component
  const SkeletonLoader = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header Skeleton */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
            <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <SkeletonLoader />;
  }

  // Yatra Free - Show upgrade message
  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <Key className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {__("License", "yatra")}
              </h1>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                <Key className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Yatra Free Version
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                You're using the free version of Yatra. No license is required
                for the free version.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Upgrade to Yatra Pro
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Unlock premium features with Yatra Pro:
                </p>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Dynamic Pricing & Revenue Management
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {__("Advanced Booking Management", "yatra")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {__("Premium Payment Gateways", "yatra")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Priority Support & Updates
                    </span>
                  </li>
                </ul>
                <a
                  href="https://wpyatra.com/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Upgrade to Pro
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Yatra Pro - Show license management
  const licenseInfo = licenseData?.license_info;
  const isActive =
    licenseInfo?.status === "active" || licenseInfo?.status === "valid";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {__("License Management", "yatra")}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {licenseInfo?.status && getStatusBadge(licenseInfo.status)}
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  debugMode
                    ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                title="Toggle debug mode to see API requests and responses"
              >
                <Bug className="w-4 h-4" />
                Debug
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* License Activation Form */}
          {!isActive && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Activate Your License
              </h2>
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label
                    htmlFor="license-key"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    License Key
                  </label>
                  <input
                    type="text"
                    id="license-key"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="Enter your license key"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={activateMutation.isPending}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!licenseKey.trim()) {
                        showToast("Please enter a license key.", "error");
                        return;
                      }
                      // Save the license key without activating
                      saveMutation.mutate(licenseKey);
                    }}
                    disabled={
                      activateMutation.isPending || saveMutation.isPending
                    }
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg border border-gray-800 dark:border-gray-700"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={activateMutation.isPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-500 text-white font-medium rounded-lg transition-colors shadow-sm"
                  >
                    {activateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Activating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save & Activate
                      </>
                    )}
                  </button>
                </div>
              </form>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Don't have a license key?{" "}
                <a
                  href="https://store.mantrabrain.com/account/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Get it from your account
                </a>
              </p>
            </div>
          )}

          {/* Active License Information */}
          {isActive && licenseInfo && (
            <div className="space-y-6">
              {/* License Key Display */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {__("License Key", "yatra")}
                  </h3>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {showKey ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Show
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-4 py-3 text-gray-900 dark:text-white">
                  {showKey ? licenseInfo.key : maskLicenseKey(licenseInfo.key)}
                </div>
              </div>

              {/* License Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {licenseInfo.server_response?.customer_name && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {__("Licensed To", "yatra")}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {licenseInfo.server_response.customer_name}
                    </div>
                  </div>
                )}

                {licenseInfo.server_response?.customer_email && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {__("Email", "yatra")}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {licenseInfo.server_response.customer_email}
                    </div>
                  </div>
                )}

                {licenseInfo.server_response?.expires &&
                  licenseInfo.server_response.expires !== "lifetime" && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {__("Expires", "yatra")}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {(() => {
                          try {
                            const date = new Date(
                              licenseInfo.server_response.expires,
                            );
                            return isNaN(date.getTime())
                              ? licenseInfo.server_response.expires
                              : date.toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                });
                          } catch {
                            return licenseInfo.server_response.expires;
                          }
                        })()}
                      </div>
                    </div>
                  )}

                {licenseInfo.server_response?.expires === "lifetime" && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {__("Expires", "yatra")}
                    </div>
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {__("Lifetime License", "yatra")}
                    </div>
                  </div>
                )}

                {licenseInfo.server_response?.site_count !== undefined && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {__("Active Sites", "yatra")}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {licenseInfo.server_response.site_count} /{" "}
                      {licenseInfo.server_response.license_limit || "∞"}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCheckStatus}
                  disabled={checkMutation.isPending}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {checkMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Check Status
                    </>
                  )}
                </button>

                <button
                  onClick={handleDeactivate}
                  disabled={deactivateMutation.isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {deactivateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Deactivate License
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              If you're having trouble with your license, please contact our
              support team.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://store.mantrabrain.com/account/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Manage License
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://mantrabrain.com/contact/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Contact Support
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Debug Panel */}
          {debugMode && (
            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Debug Information
                </h3>
                {debugData && (
                  <button
                    onClick={() => setDebugData(null)}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {__("Clear", "yatra")}
                  </button>
                )}
              </div>

              {debugData ? (
                <div className="space-y-3">
                  {/* Operation Type */}
                  <div>
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase">
                      Operation: {debugData.type}
                    </span>
                    <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">
                      {debugData.timestamp}
                    </span>
                  </div>

                  {/* Full Response Body */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ChevronDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                          Full Response Body:
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(debugData.response, null, 2),
                          );
                          showToast("Response copied to clipboard!", "success");
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Copy
                      </button>
                    </div>
                    <pre className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded p-3 text-xs overflow-x-auto max-h-96 overflow-y-auto">
                      <code className="text-gray-800 dark:text-gray-200">
                        {JSON.stringify(debugData.response, null, 2)}
                      </code>
                    </pre>
                  </div>

                  {/* EDD API Request */}
                  {debugData.response?.edd_api_request && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ChevronDown className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                            EDD API Request (to store.mantrabrain.com):
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              JSON.stringify(
                                debugData.response.edd_api_request,
                                null,
                                2,
                              ),
                            );
                            showToast(
                              "Request copied to clipboard!",
                              "success",
                            );
                          }}
                          className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Copy
                        </button>
                      </div>
                      <pre className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded p-3 text-xs overflow-x-auto">
                        <code className="text-gray-800 dark:text-gray-200">
                          {JSON.stringify(
                            debugData.response.edd_api_request,
                            null,
                            2,
                          )}
                        </code>
                      </pre>
                    </div>
                  )}

                  {/* EDD API Response */}
                  {debugData.response?.edd_api_response && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ChevronDown className="w-3 h-3 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                            EDD API Response (from store.mantrabrain.com):
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              JSON.stringify(
                                debugData.response.edd_api_response,
                                null,
                                2,
                              ),
                            );
                            showToast(
                              "Response copied to clipboard!",
                              "success",
                            );
                          }}
                          className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Copy
                        </button>
                      </div>
                      <pre className="bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 rounded p-3 text-xs overflow-x-auto">
                        <code className="text-gray-800 dark:text-gray-200">
                          {JSON.stringify(
                            debugData.response.edd_api_response,
                            null,
                            2,
                          )}
                        </code>
                      </pre>
                    </div>
                  )}

                  {/* Error Data */}
                  {debugData.error && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ChevronDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                          <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                            Error Data:
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              JSON.stringify(debugData.error, null, 2),
                            );
                            showToast("Error copied to clipboard!", "success");
                          }}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Copy
                        </button>
                      </div>
                      <pre className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded p-3 text-xs overflow-x-auto">
                        <code className="text-gray-800 dark:text-gray-200">
                          {JSON.stringify(debugData.error, null, 2)}
                        </code>
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Perform a license operation (activate, deactivate, or check
                  status) to see debug information here.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deactivate Confirmation Dialog */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Deactivate License
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to deactivate this license? You will
                  lose support and updates for Yatra Pro.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeactivateConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeactivate}
                    disabled={deactivateMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {deactivateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deactivating...
                      </>
                    ) : (
                      "Deactivate"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default License;
