import React, { useMemo } from "react";
import { Button } from "./ui/button";
import { __ } from "@wordpress/i18n";

// Pro Feature Component Props
interface ProFeatureProps {
  title?: string;
  description: string;
  moduleName: string;
  pricingUrl: string;
  isProActive: boolean;
  isModuleEnabled: boolean;
  children: React.ReactNode;
}

// Reusable PRO Badge Component Props
interface ProBadgeProps {
  isProActive: boolean;
}

// Reusable PRO Badge Component
export const ProBadge: React.FC<ProBadgeProps> = ({ isProActive }) => {
  // Only show PRO badge when Pro is not active
  if (!isProActive) {
    return (
      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white">
        PRO
      </span>
    );
  }
  return null;
};

// Reusable Pro Feature Component
export const ProFeature: React.FC<ProFeatureProps> = ({
  title,
  description,
  moduleName,
  pricingUrl,
  isProActive,
  isModuleEnabled,
  children,
}) => {
  // Get the correct modules page URL
  const modulesPageUrl = useMemo(() => {
    const baseUrl = window.yatraAdmin?.siteUrl
      ? `${window.yatraAdmin.siteUrl}/wp-admin/admin.php?page=yatra`
      : "/wp-admin/admin.php?page=yatra";
    return `${baseUrl}&subpage=modules`;
  }, []);

  // Show full settings if Pro is active AND module is enabled
  if (isProActive && isModuleEnabled) {
    return <>{children}</>;
  }

  // Show "Enable Module" if Pro is active BUT module is not enabled
  if (isProActive && !isModuleEnabled) {
    return (
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              {__("Please activate", "yatra")} {moduleName}
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              {__(
                "You have Yatra Pro installed. Enable the",
                "yatra",
              )} {moduleName} {__("module to access", "yatra")} {description.toLowerCase()} {__("features.", "yatra")}
            </p>
            <Button
              type="button"
              onClick={() => window.open(modulesPageUrl, '_blank')}
              className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {__("Activate Module", "yatra")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show "Upgrade to Pro" if Pro is not active
  return (
    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            {__("Upgrade to Pro for", "yatra")} {moduleName}
          </h4>
          <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
            {__(
              `Get Yatra Pro to access ${description} and unlock all premium features.`,
              "yatra",
            )}
          </p>
          <a
            href={pricingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            {__("Upgrade to Pro", "yatra")}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};
