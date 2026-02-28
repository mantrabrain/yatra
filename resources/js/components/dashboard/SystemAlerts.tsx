/**
 * System Alerts Widget
 * Displays important system notifications and alerts
 */

import React from "react";
import { __ } from "../../lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertCircle, Info, AlertTriangle, CheckCircle } from "lucide-react";

interface Alert {
  id: number;
  type: "info" | "warning" | "error" | "success";
  message: string;
  timestamp: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface SystemAlertsProps {
  alerts: Alert[];
  loading?: boolean;
}

/**
 * System Alerts Widget
 */
export const SystemAlerts: React.FC<SystemAlertsProps> = ({
  alerts,
  loading = false,
}) => {
  const getIcon = (type: Alert["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{__("System Alerts", "yatra")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {__("Loading...", "yatra")}
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts =
    alerts?.filter((a) => a.type === "error" || a.type === "warning") || [];
  const hasAlerts = alerts && alerts.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{__("System Alerts", "yatra")}</CardTitle>
          {criticalAlerts.length > 0 && (
            <Badge variant="error">
              {criticalAlerts.length} {__("critical", "yatra")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasAlerts ? (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-2.5 rounded-lg border ${
                  alert.type === "error"
                    ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                    : alert.type === "warning"
                      ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                      : alert.type === "success"
                        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                        : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                    {alert.action && (
                      <button
                        onClick={alert.action.onClick}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
                      >
                        {alert.action.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{__("All systems operational", "yatra")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemAlerts;
