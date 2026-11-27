/**
 * Downloads a CSV produced by a Yatra REST export endpoint
 * ({ data: { filename, csv, rows } }) as a file.
 */
import React, { useState } from "react";
import { Download } from "lucide-react";
import { apiClient } from "../../lib/api-client";
import { __, sprintf } from "../../lib/i18n";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";
import { ConditionalRender } from "../ui/conditional-render";

export const CsvExportButton: React.FC<{
  endpoint: string;
  params?: Record<string, unknown>;
  label?: string;
  capability: string;
  testId?: string;
}> = ({ endpoint, params, label, capability, testId }) => {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const res: any = await apiClient.get(endpoint, { params });
      const data = res?.data ?? res;
      if (!data || typeof data.csv !== "string") {
        throw new Error(res?.message || __("Export failed.", "yatra"));
      }
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || "yatra-export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (data.truncated) {
        showToast(
          sprintf(
            __("Exported the first %d rows. Narrow the filters to export the rest.", "yatra"),
            Number(data.rows) || 0,
          ),
          "warning",
        );
      } else {
        showToast(sprintf(__("Exported %d rows.", "yatra"), Number(data.rows) || 0), "success");
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message || e?.message || __("Export failed.", "yatra"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConditionalRender capability={capability}>
      <Button variant="outline" onClick={run} disabled={busy} className="flex items-center gap-2" data-testid={testId}>
        <Download className="w-4 h-4" />
        {busy ? __("Exporting…", "yatra") : label || __("Export CSV", "yatra")}
      </Button>
    </ConditionalRender>
  );
};

export default CsvExportButton;
