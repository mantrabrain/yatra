import React, { useMemo, useState } from "react";
import {
  Puzzle,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Crown,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import {
  useModulesQuery,
  useToggleModule,
  ModuleDefinition,
  useBulkToggleModules,
} from "../hooks/useModules";
import { usePermissions } from "../hooks/usePermissions";
import { PremiumUpgradeDialog } from "../components/modules/PremiumUpgradeDialog";

const Modules: React.FC = () => {
  const { can } = usePermissions();
  const canManageModules = can("yatra_edit_trips");
  const { data: modules = [], isLoading, error } = useModulesQuery();
  const toggleMutation = useToggleModule();
  const bulkToggleMutation = useBulkToggleModules();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [sortOption, setSortOption] = useState<
    "name_asc" | "name_desc" | "status_enabled" | "status_disabled"
  >("name_asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const set = new Set<string>();
    modules.forEach((module) => {
      if (module.category) {
        set.add(module.category);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [modules]);

  const filteredModules = useMemo(() => {
    let list = modules;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (module) =>
          module.name.toLowerCase().includes(term) ||
          (module.description?.toLowerCase().includes(term) ?? false) ||
          (module.tags?.some((tag) => tag.toLowerCase().includes(term)) ??
            false),
      );
    }

    if (categoryFilter !== "all") {
      list = list.filter(
        (module) =>
          (module.category || __("General", "yatra")) === categoryFilter,
      );
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortOption) {
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "status_enabled":
          return Number(b.enabled) - Number(a.enabled);
        case "status_disabled":
          return Number(a.enabled) - Number(b.enabled);
        case "name_asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [modules, searchTerm, categoryFilter, sortOption]);

  const moduleMap = useMemo(() => {
    const map = new Map<string, ModuleDefinition>();
    modules.forEach((module) => {
      map.set(module.slug, module);
    });
    return map;
  }, [modules]);

  const [premiumDialog, setPremiumDialog] = useState<{
    open: boolean;
    module?: ModuleDefinition;
  }>({ open: false });

  const handleToggle = (module: ModuleDefinition) => {
    if (module.is_core || !canManageModules) return;
    // Show premium dialog only if module requires Pro and is NOT available (Pro not active or module not in Pro)
    if (module.is_premium && !module.enabled && !module.is_available) {
      setPremiumDialog({ open: true, module });
      return;
    }
    toggleMutation.mutate({
      slug: module.slug,
      enabled: !module.enabled,
      name: module.name,
    });
  };

  const renderToggle = (module: ModuleDefinition) => {
    // Module is locked if it's premium, not enabled, and not available (Pro not active)
    const isLockedPremium =
      module.is_premium && !module.enabled && !module.is_available;
    // When Pro is active and module is available, allow toggling (user can enable/disable)
    const disabled =
      module.is_core || toggleMutation.isPending || !canManageModules;
    return (
      <button
        onClick={(event) => {
          event.stopPropagation();
          if (isLockedPremium) {
            setPremiumDialog({ open: true, module });
            return;
          }
          handleToggle(module);
        }}
        disabled={disabled}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
          module.enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        } ${
          isLockedPremium
            ? "ring-2 ring-amber-300 dark:ring-amber-500 cursor-pointer"
            : ""
        } ${disabled && !isLockedPremium ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        aria-pressed={module.enabled}
        aria-label={
          module.enabled
            ? __("Disable module", "yatra")
            : __("Enable module", "yatra")
        }
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            module.enabled ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    );
  };

  const handleSelect = (slug: string) => {
    const module = moduleMap.get(slug);
    // Only show premium dialog if module is premium, not enabled, and not available
    if (module?.is_premium && !module.enabled && !module.is_available) {
      setPremiumDialog({ open: true, module });
      return;
    }

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = filteredModules.every((module) =>
        next.has(module.slug),
      );
      if (allSelected) {
        filteredModules.forEach((module) => next.delete(module.slug));
      } else {
        filteredModules.forEach((module) => next.add(module.slug));
      }
      return next;
    });
  };

  const bulkUpdate = (enabled: boolean) => {
    const items = Array.from(selected)
      .map((slug) => moduleMap.get(slug))
      .filter((module): module is ModuleDefinition => !!module)
      // Only filter out premium modules that are NOT available (Pro not active)
      .filter(
        (module) => !(module.is_premium && enabled && !module.is_available),
      );

    if (items.length === 0) {
      if (selected.size > 0 && enabled) {
        // Only show premium dialog for modules that are not available
        const premiumModules = Array.from(selected)
          .map((slug) => moduleMap.get(slug))
          .filter((module) => module?.is_premium && !module?.is_available);
        if (premiumModules.length > 0) {
          setPremiumDialog({ open: true, module: premiumModules[0] });
        }
      }
      return;
    }

    const payload = items.map((module) => ({
      slug: module.slug,
      enabled,
      name: module.name,
    }));

    bulkToggleMutation.mutate(payload, {
      onSuccess: () => setSelected(new Set()),
    });
  };

  const isAllVisibleSelected =
    filteredModules.length > 0 &&
    filteredModules.every((module) => selected.has(module.slug));
  const selectedCount = selected.size;

  return (
    <div className="space-y-4">
      <PageHeader
        title={__("Modules", "yatra")}
        description={__(
          "Manage feature modules and control which capabilities are active.",
          "yatra",
        )}
        actionCapability="yatra_edit_trips"
        actions={
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <Puzzle className="w-4 h-4" />
            {__("Refresh Modules", "yatra")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={isAllVisibleSelected ? "default" : "outline"}
                onClick={handleSelectAllVisible}
                disabled={filteredModules.length === 0}
                className="flex items-center gap-2"
              >
                <ArrowUpDown className="w-4 h-4" />
                {isAllVisibleSelected
                  ? __("Clear visible selection", "yatra")
                  : __("Select visible", "yatra")}
              </Button>
              <Button
                variant="outline"
                onClick={() => bulkUpdate(true)}
                disabled={
                  !canManageModules ||
                  selectedCount === 0 ||
                  bulkToggleMutation.isPending
                }
              >
                {__("Enable Selected", "yatra")}
              </Button>
              <Button
                variant="outline"
                onClick={() => bulkUpdate(false)}
                disabled={
                  !canManageModules ||
                  selectedCount === 0 ||
                  bulkToggleMutation.isPending
                }
              >
                {__("Disable Selected", "yatra")}
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 pl-2">
                <Filter className="w-4 h-4" />
                <span>
                  {__("Showing {count} modules", "yatra").replace(
                    "{count}",
                    String(filteredModules.length),
                  )}
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 lg:flex-row lg:items-center lg:justify-end lg:gap-3">
              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={__("Search modules...", "yatra")}
                  className="pl-9"
                />
              </div>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full lg:w-48"
              >
                <option value="all">{__("All Categories", "yatra")}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
              <Select
                value={sortOption}
                onChange={(e) =>
                  setSortOption(e.target.value as typeof sortOption)
                }
                className="w-full lg:w-48"
              >
                <option value="name_asc">{__("Name A → Z", "yatra")}</option>
                <option value="name_desc">{__("Name Z → A", "yatra")}</option>
                <option value="status_enabled">
                  {__("Enabled first", "yatra")}
                </option>
                <option value="status_disabled">
                  {__("Disabled first", "yatra")}
                </option>
              </Select>
              {(searchTerm ||
                categoryFilter !== "all" ||
                sortOption !== "name_asc") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setSortOption("name_asc");
                  }}
                >
                  {__("Reset", "yatra")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-4">
            <div className="animate-pulse space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex-1 h-10 rounded-md bg-gray-100 dark:bg-gray-800" />
                <div className="flex gap-3 w-full lg:w-auto">
                  <div className="h-10 w-40 rounded-md bg-gray-100 dark:bg-gray-800" />
                  <div className="h-10 w-40 rounded-md bg-gray-100 dark:bg-gray-800" />
                  <div className="h-10 w-24 rounded-md bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={`module-skeleton-${idx}`}
                    className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex gap-3">
                      <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
                      </div>
                    </div>
                    <div className="h-24 rounded bg-gray-50 dark:bg-gray-900" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-6 text-red-600 dark:text-red-400">
            {__("Failed to load modules", "yatra")}
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && modules.length === 0 && (
        <Card>
          <CardContent className="p-6 text-gray-500 dark:text-gray-400">
            {__("No modules available yet.", "yatra")}
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && filteredModules.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {filteredModules.map((module) => (
            <Card
              key={module.slug}
              className={`border ${
                // Only show premium styling if module is premium AND not available (Pro not active)
                module.is_premium && !module.is_available
                  ? "border-amber-300 dark:border-amber-500/60 bg-amber-50/80 dark:bg-amber-500/10 relative overflow-hidden"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              {...(module.is_premium &&
              !module.is_available &&
              canManageModules &&
              !module.enabled
                ? {
                    role: "button" as const,
                    tabIndex: 0,
                    onClick: () => setPremiumDialog({ open: true, module }),
                    onKeyDown: (event: React.KeyboardEvent) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPremiumDialog({ open: true, module });
                      }
                    },
                  }
                : {})}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <input
                        id={`module-select-${module.slug}`}
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selected.has(module.slug)}
                        onChange={() => handleSelect(module.slug)}
                      />
                      {module.enabled && (
                        <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wide [writing-mode:vertical-rl] [text-orientation:mixed] transform rotate-180 bg-green-100 dark:bg-green-900/40 px-1 py-1 rounded">
                          {__("Enabled", "yatra")}
                        </span>
                      )}
                    </div>
                    <div
                      className="cursor-pointer select-none"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelect(module.slug);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelect(module.slug);
                        }
                      }}
                    >
                      <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                        {module.name}
                        {module.is_core && (
                          <Badge variant="outline">{__("Core", "yatra")}</Badge>
                        )}
                        {/* Plan badge — Personal for any Pro module, Agency
                            for white-label-tier modules. Always visible so
                            customers know which plan unlocks the module. */}
                        {module.plan === "agency" && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 border-purple-700 text-white shadow-sm dark:from-purple-500 dark:to-indigo-400 dark:border-purple-400 dark:text-white"
                          >
                            <Crown className="w-3 h-3" />
                            {__("Agency", "yatra")}
                          </Badge>
                        )}
                        {module.plan === "personal" && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500/40 dark:text-blue-200"
                          >
                            {__("Personal", "yatra")}
                          </Badge>
                        )}
                        {/* Only show Premium badge if module is premium AND not available (Pro not active) */}
                        {module.is_premium && !module.is_available && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 border-orange-600 text-white shadow-sm dark:bg-orange-600/60 dark:border-orange-500 dark:text-orange-50"
                          >
                            <Crown className="w-3 h-3" />
                            {__("Premium", "yatra")}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm line-clamp-3">
                        {module.description}
                      </CardDescription>
                      <p className="inline-flex items-center px-2 py-0.5 mt-1 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span>
                        {module.category || __("General", "yatra")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {renderToggle(module)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  {module.video_url && (
                    <a
                      href={module.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-red-600 hover:text-red-500 dark:text-red-400 text-xs font-medium"
                      title={__("Watch video tutorial", "yatra")}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      {__("Video", "yatra")}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {module.slug === "dynamic_form_field" && module.enabled && (
                    <a
                      href={`${window.location.origin}/wp-admin/admin.php?page=yatra&subpage=settings`}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-xs font-medium"
                      title={__("Settings", "yatra")}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      {__("Settings", "yatra")}
                    </a>
                  )}
                  {module.docs_url && (
                    <a
                      href={module.docs_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-xs font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {__("Docs", "yatra")}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <PremiumUpgradeDialog
        open={premiumDialog.open}
        moduleName={premiumDialog.module?.name}
        purchaseUrl={premiumDialog.module?.purchase_url}
        moduleDescription={premiumDialog.module?.description}
        onClose={() => setPremiumDialog({ open: false })}
      />
    </div>
  );
};

export default Modules;
