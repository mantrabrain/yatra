import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../ui/toast";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { __, sprintf, brandName } from "../../lib/i18n";
import { apiService } from "../../lib/api-client";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Info,
  Pencil,
  Play,
  RefreshCw,
  Search,
  Shuffle,
  XCircle,
} from "lucide-react";

interface WteDetect {
  has_data: boolean;
  wte_active: boolean;
  wte_version: string;
  trips: number;
  terms: Record<string, number>;
  bookings: number;
  customers: number;
  enquiries: number;
  imported_trips: number;
  batch_size: number;
  last_run: {
    offset?: number;
    total?: number;
    done?: boolean;
    updated_at?: string;
  };
}

interface WteScanTrip {
  wte_id: number;
  title: string;
  status: string;
  action: "create" | "update";
  trip_id: number;
  itinerary_days: number;
  faqs: number;
  pricing: string;
  price: number;
  warnings: string[];
}

interface WteScan {
  trips_total: number;
  counts: { create: number; update: number; warnings: number };
  terms: Record<
    string,
    { total: number; mapped: number; matched: number; create: number }
  >;
  notes: string[];
  not_imported: string[];
  trips: WteScanTrip[];
}

interface WteTripResult {
  wte_id: number;
  title: string;
  action: "created" | "updated" | "skipped" | "failed";
  trip_id: number;
  edit_url: string;
  view_url: string;
  warnings: string[];
  error: string;
}

interface WteBatch {
  total: number;
  offset: number;
  next_offset: number;
  done: boolean;
  totals: { created: number; updated: number; skipped: number; failed: number };
  results: WteTripResult[];
}

const taxonomyLabel = (taxonomy: string): string => {
  switch (taxonomy) {
    case "destination":
      return __("Destinations", "yatra");
    case "activities":
      return __("Activities", "yatra");
    case "trip_types":
      return __("Trip types → Categories", "yatra");
    case "difficulty":
      return __("Difficulty levels", "yatra");
    case "trip-packages-categories":
      return __("Traveller categories", "yatra");
    default:
      return taxonomy;
  }
};

const actionBadge = (action: WteTripResult["action"]) => {
  switch (action) {
    case "created":
      return <Badge variant="success">{__("Created", "yatra")}</Badge>;
    case "updated":
      return <Badge variant="info">{__("Updated", "yatra")}</Badge>;
    case "skipped":
      return <Badge variant="default">{__("Skipped", "yatra")}</Badge>;
    default:
      return <Badge variant="error">{__("Failed", "yatra")}</Badge>;
  }
};

/**
 * Tools > Import from WP Travel Engine.
 *
 * Detect -> Scan (dry run) -> Import (terms, then trips in batches). WP Travel
 * Engine data is only read by the server; nothing is changed or deleted.
 */
const WteImport: React.FC = () => {
  const { showToast } = useToast();
  const brand = brandName();
  const [detect, setDetect] = useState<WteDetect | null>(null);
  const [loading, setLoading] = useState(true);
  const [scan, setScan] = useState<WteScan | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<WteTripResult[]>([]);
  const [termErrors, setTermErrors] = useState<string[]>([]);
  const [totals, setTotals] = useState<WteBatch["totals"] | null>(null);
  const [stage, setStage] = useState<"" | "terms" | "trips" | "done">("");
  const cancelRef = useRef(false);

  const loadDetect = async () => {
    setLoading(true);
    try {
      const data = (await apiService.detectWteData()) as WteDetect;
      setDetect(data);
    } catch (error: any) {
      showToast(
        error?.message ||
          __("Could not check for WP Travel Engine data.", "yatra"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetect();
    return () => {
      cancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runScan = async () => {
    setIsScanning(true);
    try {
      const data = (await apiService.scanWteData()) as WteScan;
      setScan(data);
    } catch (error: any) {
      showToast(error?.message || __("Scan failed.", "yatra"), "error");
    } finally {
      setIsScanning(false);
    }
  };

  const runImport = async (startOffset = 0) => {
    if (!detect) return;
    cancelRef.current = false;
    setIsImporting(true);
    if (startOffset === 0) {
      setResults([]);
      setTotals(null);
    }
    setProgress({ done: startOffset, total: detect.trips });
    try {
      setStage("terms");
      const termResult: any = await apiService.importWteTerms();
      // Destinations / activities / trip types that couldn't be created.
      const errs: string[] = [];
      Object.values((termResult?.data ?? termResult) || {}).forEach((t: any) => {
        if (t && Array.isArray(t.errors)) errs.push(...t.errors.map(String));
      });
      setTermErrors(errs);

      setStage("trips");
      let offset = startOffset;
      while (true) {
        if (cancelRef.current) break;
        const batch = (await apiService.importWteTrips({
          offset,
          limit: detect.batch_size || 10,
          update_existing: updateExisting,
        })) as WteBatch;
        setResults((prev) => [...prev, ...batch.results]);
        setTotals(batch.totals);
        setProgress({ done: batch.next_offset, total: batch.total });
        if (batch.done || batch.next_offset <= offset) break;
        offset = batch.next_offset;
      }

      if (!cancelRef.current) {
        setStage("done");
        showToast(__("WP Travel Engine import finished.", "yatra"), "success");
      }
      loadDetect();
    } catch (error: any) {
      setStage("");
      showToast(
        error?.message ||
          __("Import stopped. You can resume where it left off.", "yatra"),
        "error",
      );
      loadDetect();
    } finally {
      setIsImporting(false);
    }
  };

  const percent =
    progress.total > 0
      ? Math.min(100, Math.round((progress.done / progress.total) * 100))
      : 0;

  const canResume =
    !isImporting &&
    stage !== "done" &&
    !!detect?.last_run &&
    detect.last_run.done === false &&
    (detect.last_run.offset || 0) > 0;

  if (loading && !detect) {
    return (
      <Card className="p-8">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          {__("Looking for WP Travel Engine data...", "yatra")}
        </div>
      </Card>
    );
  }

  if (!detect || !detect.has_data) {
    return (
      <Card className="p-8" data-testid="wte-import-empty">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Shuffle className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {__("Import from WP Travel Engine", "yatra")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {__(
                "No WP Travel Engine trips were found on this site. Once WP Travel Engine data is present (the plugin does not need to be active), you can import it here.",
                "yatra",
              )}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8" data-testid="wte-import">
      <Card className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Shuffle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {__("Import from WP Travel Engine", "yatra")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sprintf(
                __(
                  "Copy your WP Travel Engine trips, itineraries, FAQs, prices and destinations into %s.",
                  "yatra",
                ),
                brand,
              )}
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-400">
            {__(
              "Your WP Travel Engine data is only read - nothing is changed or deleted, so you can keep WP Travel Engine until you are happy with the result. Running the import again never creates duplicates.",
              "yatra",
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {detect.trips}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {__("Trips", "yatra")}
            </div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(detect.terms.destination || 0) +
                (detect.terms.activities || 0) +
                (detect.terms.trip_types || 0)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {__("Destinations, activities & trip types", "yatra")}
            </div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {detect.imported_trips}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {__("Already imported", "yatra")}
            </div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {detect.bookings}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {__("Bookings (not imported)", "yatra")}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={runScan}
            variant="outline"
            disabled={isScanning || isImporting}
            className="flex items-center gap-2"
            data-testid="wte-scan"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {isScanning
              ? __("Scanning...", "yatra")
              : __("Scan (dry run)", "yatra")}
          </Button>
          <Button
            onClick={() => runImport(0)}
            disabled={!scan || isImporting || isScanning}
            className="flex items-center gap-2"
            data-testid="wte-import-start"
          >
            {isImporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isImporting ? __("Importing...", "yatra") : __("Import", "yatra")}
          </Button>
          {canResume && (
            <Button
              onClick={() => runImport(detect.last_run.offset || 0)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {sprintf(
                __("Resume from trip %1$d of %2$d", "yatra"),
                (detect.last_run.offset || 0) + 1,
                detect.last_run.total || detect.trips,
              )}
            </Button>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={updateExisting}
              disabled={isImporting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            {__("Update trips imported before", "yatra")}
          </label>
        </div>
        {!scan && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            {__("Run a scan first to see what will be imported.", "yatra")}
          </p>
        )}
        {updateExisting && (
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-3 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {__(
              "Trips imported before will be overwritten with their WP Travel Engine data, including any edits you made since.",
              "yatra",
            )}
          </p>
        )}

        {(isImporting || stage === "done" || results.length > 0) && (
          <div
            className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            data-testid="wte-progress"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {stage === "terms"
                  ? __("Importing destinations, activities and categories...", "yatra")
                  : stage === "done"
                    ? __("Import complete", "yatra")
                    : __("Importing trips...", "yatra")}
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {percent}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              {sprintf(
                __("%1$d / %2$d trips processed", "yatra"),
                progress.done,
                progress.total,
              )}
              {totals &&
                " · " +
                  sprintf(
                    __("%1$d created, %2$d updated, %3$d skipped, %4$d failed", "yatra"),
                    totals.created,
                    totals.updated,
                    totals.skipped,
                    totals.failed,
                  )}
            </p>
          </div>
        )}
      </Card>

      {scan && (
        <Card className="p-8" data-testid="wte-scan-results">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {__("Scan results", "yatra")}
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="success">
              {sprintf(__("%d to create", "yatra"), scan.counts.create)}
            </Badge>
            <Badge variant="info">
              {sprintf(__("%d already imported", "yatra"), scan.counts.update)}
            </Badge>
            <Badge variant="warning">
              {sprintf(__("%d with notes", "yatra"), scan.counts.warnings)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {Object.entries(scan.terms).map(([taxonomy, row]) => (
              <div
                key={taxonomy}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {taxonomyLabel(taxonomy)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {sprintf(
                    __("%1$d new, %2$d existing", "yatra"),
                    row.create,
                    row.matched + row.mapped,
                  )}
                </div>
              </div>
            ))}
          </div>

          {[...scan.notes, ...scan.not_imported].length > 0 && (
            <ul className="mb-6 space-y-1">
              {[...scan.notes, ...scan.not_imported].map((note, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-600 dark:text-gray-400 flex gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                  {note}
                </li>
              ))}
            </ul>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4">{__("Trip", "yatra")}</th>
                  <th className="py-2 pr-4">{__("Will", "yatra")}</th>
                  <th className="py-2 pr-4">{__("Days", "yatra")}</th>
                  <th className="py-2 pr-4">{__("FAQs", "yatra")}</th>
                  <th className="py-2 pr-4">{__("Pricing", "yatra")}</th>
                  <th className="py-2">{__("Notes", "yatra")}</th>
                </tr>
              </thead>
              <tbody>
                {scan.trips.map((trip) => (
                  <tr
                    key={trip.wte_id}
                    className="border-b border-gray-100 dark:border-gray-700/50 align-top"
                  >
                    <td className="py-2 pr-4 text-gray-900 dark:text-white">
                      {trip.title}
                      {trip.status !== "publish" && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({trip.status})
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {trip.action === "create" ? (
                        <Badge variant="success">{__("Create", "yatra")}</Badge>
                      ) : (
                        <Badge variant="info">
                          {updateExisting
                            ? __("Update", "yatra")
                            : __("Skip", "yatra")}
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 pr-4">{trip.itinerary_days}</td>
                    <td className="py-2 pr-4">{trip.faqs}</td>
                    <td className="py-2 pr-4">
                      {trip.pricing === "traveler_based"
                        ? __("Per traveller category", "yatra")
                        : trip.price > 0
                          ? __("Regular", "yatra")
                          : __("No price", "yatra")}
                    </td>
                    <td className="py-2 text-xs text-gray-500 dark:text-gray-400">
                      {trip.warnings.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-0.5">
                          {trip.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {termErrors.length > 0 && (
        <Card className="p-6 border-amber-200 dark:border-amber-800" data-testid="wte-term-errors">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
            {__("Some destinations, activities or trip types could not be imported", "yatra")}
          </h3>
          <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {termErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Card>
      )}

      {results.length > 0 && (
        <Card className="p-8" data-testid="wte-results">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {__("Import log", "yatra")}
          </h3>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {results.map((r, i) => (
              <li key={`${r.wte_id}-${i}`} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  {r.action === "failed" ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {r.title}
                  </span>
                  {actionBadge(r.action)}
                  {r.edit_url && (
                    <a
                      href={r.edit_url}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      data-testid="wte-edit-link"
                    >
                      <Pencil className="w-3 h-3" />
                      {__("Edit", "yatra")}
                    </a>
                  )}
                  {r.view_url && (
                    <a
                      href={r.view_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      data-testid="wte-view-link"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {__("View", "yatra")}
                    </a>
                  )}
                </div>
                {r.error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 ml-7">
                    {r.error}
                  </p>
                )}
                {r.warnings.length > 0 && (
                  <ul className="mt-1 ml-7 list-disc pl-4 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    {r.warnings.map((w, j) => (
                      <li key={j}>{w}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default WteImport;
