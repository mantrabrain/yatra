import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  CalendarDays,
  Star,
  BarChart3,
  Settings,
  Wrench,
  Moon,
  FileText,
  CreditCard,
  Package,
  UserCircle,
  FolderTree,
  Tag,
  TrendingUp,
  List,
  Activity,
  Crown,
  ChevronDown,
  ChevronRight,
  Mail,
  Key,
  FileSignature,
  Route,
  BadgePercent,
  Plane,
  MessageSquare,
  Puzzle,
  ArrowLeft,
  Loader2,
  RotateCcw,
  Sun,
  User,
} from "lucide-react";
import { __ } from "../lib/i18n";
import { Button } from "../components/ui/button";

// Helper function to extract Gravatar URL from WordPress get_avatar HTML
function extractGravatarUrl(avatarHtml: string, size: number): string {
  if (!avatarHtml) {
    return `https://www.gravatar.com/avatar/00000000000000000000000000000000?s=${size}&d=identicon&r=pg`;
  }
  
  // Extract src attribute from img tag
  const imgMatch = avatarHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    // Replace size parameter if needed
    return imgMatch[1].replace(/s=\d+/, `s=${size}`);
  }
  
  // Fallback to default
  return `https://www.gravatar.com/avatar/00000000000000000000000000000000?s=${size}&d=identicon&r=pg`;
}

// Helper function to get Gravatar URL using WordPress data
function getGravatarUrl(size: number): string {
  const avatarHtml = (window as any)?.yatraAdmin?.currentUserAvatar || '';
  return extractGravatarUrl(avatarHtml, size);
}

import { ConditionalRender } from "../components/ui/conditional-render";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  useModulesQuery,
  useToggleModule,
  type ModuleDefinition,
} from "../hooks/useModules";
import { isProPluginActive, isModuleActive } from "../lib/plugin-utils";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Load dark mode preference from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("yatra-dark-mode");
    return saved === "true";
  });

  // Apply dark mode to document on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("yatra-dark-mode", "true");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("yatra-dark-mode", "false");
    }
  }, [darkMode]);

  const [isModulesPanelOpen, setIsModulesPanelOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const modulesPanelRef = useRef<HTMLDivElement | null>(null);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);

  // License status state for real-time updates
  const [licenseStatus, setLicenseStatus] = useState<string | null>(
    (window as any).yatraAdmin?.licenseStatus || null,
  );
  const { data: modulesData, isLoading: isLoadingModules } = useModulesQuery({
    enabled: isModulesPanelOpen,
  });
  const toggleModuleMutation = useToggleModule();
  // Ensure modulesData is always an array before slicing
  const safeModulesData = Array.isArray(modulesData) ? modulesData : [];
  const modulesPreview = useMemo<ModuleDefinition[]>(
    () => safeModulesData.slice(0, 3),
    [safeModulesData],
  );
  const handleQuickToggle = (module: ModuleDefinition, enabled: boolean) => {
    toggleModuleMutation.mutate({
      slug: module.slug,
      enabled,
      name: module.name,
    });
  };


  // Track URL changes to update menu state
  const [urlKey, setUrlKey] = useState(0);
  const [navRefreshKey, setNavRefreshKey] = useState(0);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modulesPanelRef.current && !modulesPanelRef.current.contains(event.target as Node)) {
        setIsModulesPanelOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      setUrlKey((prev) => prev + 1);
    };

    // Listen for popstate (back/forward button)
    window.addEventListener("popstate", handleLocationChange);

    // Also check periodically (fallback for direct navigation)
    const interval = setInterval(() => {
      const currentSearch = window.location.search;
      if (currentSearch !== (window as any).__lastSearch) {
        (window as any).__lastSearch = currentSearch;
        handleLocationChange();
      }
    }, 100);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      clearInterval(interval);
    };
  }, []);

  // Listen for module updates to refresh navigation
  useEffect(() => {
    const handleModuleUpdate = () => {
      // Force re-render of menu items by updating navRefreshKey
      setNavRefreshKey((prev) => prev + 1);
      // Also update urlKey to ensure all memoized values refresh
      setUrlKey((prev) => prev + 1);
    };

    const handleForceRefresh = () => {
      setNavRefreshKey((prev) => prev + 1);
      setUrlKey((prev) => prev + 1);
    };

    const handleLicenseStatusUpdate = (event: any) => {
      const newStatus = event.detail?.status;
      if (newStatus) {
        setLicenseStatus(newStatus);
      }
    };

    window.addEventListener("yatra-modules-updated", handleModuleUpdate);
    window.addEventListener("yatra-force-nav-refresh", handleForceRefresh);
    window.addEventListener(
      "yatra-license-status-updated",
      handleLicenseStatusUpdate,
    );

    return () => {
      window.removeEventListener("yatra-modules-updated", handleModuleUpdate);
      window.removeEventListener("yatra-force-nav-refresh", handleForceRefresh);
      window.removeEventListener(
        "yatra-license-status-updated",
        handleLicenseStatusUpdate,
      );
    };
  }, []);

  useEffect(() => {
    if (!isModulesPanelOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modulesPanelRef.current &&
        !modulesPanelRef.current.contains(event.target as Node)
      ) {
        setIsModulesPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModulesPanelOpen]);

  // Get current subpage and tab from URL
  const currentSubpage = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("subpage") || "dashboard";
  }, [urlKey]);

  const currentTab = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "all";
  }, [urlKey]);

  const currentAction = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action");
  }, [urlKey]);

  // Check if we're on the trip form page
  const isTripFormPage = useMemo(() => {
    return (
      currentSubpage === "trips" &&
      (currentTab === "all" || !currentTab) &&
      (currentAction === "create" || currentAction === "edit")
    );
  }, [currentSubpage, currentTab, currentAction, urlKey]);

  // Track expanded submenus - initialize based on current subpage
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const subpage = params.get("subpage") || "dashboard";
    const menus: string[] = [];

    if (subpage === "trips") {
      menus.push("trips");
    }

    if (subpage === "itinerary") {
      menus.push("itinerary");
    }

    return menus;
  });

  // Auto-expand menu when on submenu pages
  useEffect(() => {
    const menusToExpand: string[] = [];

    if (currentSubpage === "trips") {
      menusToExpand.push("trips");
    }

    if (currentSubpage === "itinerary") {
      menusToExpand.push("itinerary");
    }

    setExpandedMenus((prev) => {
      // Only update if the menus to expand are different
      const newMenus = [...new Set([...prev, ...menusToExpand])];
      if (
        newMenus.length !== prev.length ||
        !newMenus.every((m) => prev.includes(m))
      ) {
        return newMenus;
      }
      return prev;
    });
  }, [currentSubpage, urlKey]);

  // Get base admin URL
  const baseUrl = useMemo(() => {
    return window.yatraAdmin?.siteUrl
      ? `${window.yatraAdmin.siteUrl}/wp-admin/admin.php?page=yatra`
      : "/wp-admin/admin.php?page=yatra";
  }, []);

  const modulesPageUrl = useMemo(() => `${baseUrl}&subpage=modules`, [baseUrl]);

  const menuItems = useMemo(
    () => [
      { subpage: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      {
        subpage: "trips",
        label: "Trips",
        icon: MapPin,
        submenu: [
          { tab: "all", label: "All Trips", icon: List },
          { tab: "activities", label: "Activities", icon: Activity },
          { tab: "destinations", label: "Destinations", icon: Route },
          { tab: "categories", label: "Categories", icon: FolderTree },
          {
            tab: "difficulty-levels",
            label: "Difficulty Levels",
            icon: TrendingUp,
          },
          // Availability - FREE feature, always show
          { tab: "availability", label: "Availability", icon: CalendarDays },
          // Attributes - FREE feature, always show
          { tab: "attributes", label: "Attributes", icon: Tag },
          // Additional Services - show only if Pro plugin is active and module is enabled
          ...(isProPluginActive() && isModuleActive("additional_services")
            ? [
                {
                  tab: "additional-services",
                  label: "Additional Services",
                  icon: Package,
                  isPremium: true,
                },
              ]
            : []),
          // Trip Consent - show only if Pro plugin is active and module is enabled
          ...(isProPluginActive() && isModuleActive("trip_consent")
            ? [
                {
                  tab: "trip-consent",
                  label: "Trip Consent",
                  icon: FileSignature,
                  isPremium: true,
                },
              ]
            : []),
        ],
      },
      {
        subpage: "traveler-categories",
        label: "Traveler Categories",
        icon: UserCircle,
      },
      {
        subpage: "itinerary",
        label: "Itinerary",
        icon: FileText,
        submenu: [
          { tab: "item-types", label: "Item Types", icon: Tag },
          { tab: "items", label: "Items", icon: Route },
          { tab: "itinerary", label: "Itinerary", icon: FileText },
        ],
      },
      // Departures - FREE feature, always show
      { subpage: "departures", label: "Departures", icon: Calendar },
      { subpage: "discounts", label: "Discounts", icon: BadgePercent },
      { subpage: "payments", label: "Payments", icon: CreditCard },
      { subpage: "bookings", label: "Bookings", icon: Calendar },
      { subpage: "customers", label: "Customers", icon: UserCircle },
      { subpage: "travelers", label: "Travelers", icon: Plane },
      { subpage: "enquiries", label: "Enquiries", icon: MessageSquare },
      { subpage: "reviews", label: "Reviews", icon: Star },
      { subpage: "reports", label: "Reports", icon: BarChart3 },
      // Email — SMTP & transactional for all; Pro adds automation tabs on the same screen
      {
        subpage: "email-automation",
        label: __("Email", "yatra"),
        icon: Mail,
        isPremium: false,
      },
      // Abandoned Booking Recovery - show only if Pro plugin is active and module is enabled
      ...(isProPluginActive() && isModuleActive("abandoned_booking_recovery")
        ? [
            {
              subpage: "abandoned-recovery",
              label: "Abandoned Recovery",
              icon: RotateCcw,
              isPremium: true,
            },
          ]
        : []),
      // Dynamic Pricing - show only if Pro plugin is active and module is enabled
      ...(isProPluginActive() && isModuleActive("dynamic_pricing")
        ? [
            {
              subpage: "dynamic-pricing",
              label: "Dynamic Pricing",
              icon: TrendingUp,
              isPremium: true,
            },
          ]
        : []),
      { subpage: "modules", label: "Modules", icon: Puzzle },
      { subpage: "license", label: "License", icon: Key },
      { subpage: "settings", label: "Settings", icon: Settings },
    ],
    [navRefreshKey],
  ); // Re-calculate when navRefreshKey changes

  const isActive = (subpage: string, tab?: string) => {
    if (tab) {
      return currentSubpage === subpage && currentTab === tab;
    }
    // For parent menu items, check if current subpage matches
    // or if any submenu item is active
    if (currentSubpage === subpage) {
      const menuItem = menuItems.find((item) => item.subpage === subpage);
      if (menuItem?.submenu) {
        // If it has submenu, check if any submenu item is active
        return menuItem.submenu.some((sub) => sub.tab === currentTab);
      }
      return true;
    }
    return false;
  };

  const isMenuExpanded = (subpage: string) => {
    return expandedMenus.includes(subpage);
  };

  const toggleMenu = (subpage: string) => {
    setExpandedMenus((prev) =>
      prev.includes(subpage)
        ? prev.filter((m) => m !== subpage)
        : [...prev, subpage],
    );
  };

  const getUrl = (subpage: string, tab?: string) => {
    if (subpage === "dashboard") {
      return baseUrl;
    }
    if (tab) {
      return `${baseUrl}&subpage=${subpage}&tab=${tab}`;
    }
    return `${baseUrl}&subpage=${subpage}`;
  };

  return (
    <div
      className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Logo */}
          <div className="h-16 px-6 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                {window.yatraAdmin?.brandLogoUrl ? (
                  <img
                    src={window.yatraAdmin.brandLogoUrl}
                    alt={__("Yatra", "yatra")}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-lg object-contain shrink-0 bg-blue-600 p-1 border border-blue-700 dark:border-blue-500"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-lg">Y</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    Yatra
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                    <span>v{window.yatraAdmin?.version || "1.0.0"}</span>
                    {(window as any).yatraAdmin?.proVersion && (
                      <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded font-medium">
                        Pro v{(window as any).yatraAdmin?.proVersion}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation + Bottom Actions */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = hasSubmenu && isMenuExpanded(item.subpage);
              const active = isActive(item.subpage);

              return (
                <div key={item.subpage}>
                  {hasSubmenu ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.subpage)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                          active || isExpanded
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {isExpanded && item.submenu && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.submenu.map((subItem) => {
                            const subActive = isActive(
                              item.subpage,
                              subItem.tab,
                            );
                            const SubIcon = subItem.icon;
                            return (
                              <a
                                key={subItem.tab}
                                href={getUrl(item.subpage, subItem.tab)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors relative ${
                                  subActive
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {SubIcon && (
                                    <div className="w-4 h-4">
                                      {React.createElement(SubIcon, {
                                        className: "w-4 h-4",
                                      })}
                                    </div>
                                  )}
                                  <span className="text-sm">
                                    {subItem.label}
                                  </span>
                                </div>
                                {subItem.isPremium && !isProPluginActive() && (
                                  <div className="absolute inset-y-0 right-2 flex items-center justify-center">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center">
                                      <Crown className="w-2.5 h-2.5" />
                                    </div>
                                  </div>
                                )}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <a
                      href={getUrl(item.subpage)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors relative ${
                        active
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.isPremium && !isProPluginActive() && (
                        <div className="absolute inset-y-0 right-2 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center">
                            <Crown className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      )}
                      {item.subpage === "license" &&
                        isProPluginActive() &&
                        licenseStatus && (
                          <Badge
                            variant={
                              licenseStatus === "active"
                                ? "success"
                                : licenseStatus === "expired"
                                  ? "error"
                                  : licenseStatus === "invalid"
                                    ? "error"
                                    : "error"
                            }
                            className="text-[10px] px-2 py-0.5"
                          >
                            {licenseStatus === "active"
                              ? "Active"
                              : licenseStatus === "expired"
                                ? "Expired"
                                : licenseStatus === "invalid"
                                  ? "Invalid"
                                  : "Inactive"}
                          </Badge>
                        )}
                    </a>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Sticky bottom back link */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <a
              href={
                window.yatraAdmin?.siteUrl
                  ? `${window.yatraAdmin.siteUrl}/wp-admin/`
                  : "/wp-admin/"
              }
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="w-3 h-3" />
                <span>{__("Back to WordPress", "yatra")}</span>
              </span>
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col ${isTripFormPage ? "overflow-hidden" : "overflow-y-auto"}`}
        >
          {/* Top Bar */}
          <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center">
            <div className="flex items-center justify-between w-full">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {(() => {
                  // Show specific text for trip form page
                  if (isTripFormPage) {
                    return currentAction === "create"
                      ? "Create Trip"
                      : "Edit Trip";
                  }

                  const activeItem = menuItems.find((item) =>
                    isActive(item.subpage),
                  );
                  if (activeItem?.submenu && currentTab) {
                    const activeSubItem = activeItem.submenu.find(
                      (sub) => sub.tab === currentTab,
                    );
                    return activeSubItem?.label || activeItem.label;
                  }
                  return activeItem?.label || "Dashboard";
                })()}
              </h1>

              <div className="flex items-center gap-4">
                {/* Back to WordPress button */}
                <a
                  href={
                    window.yatraAdmin?.siteUrl
                      ? `${window.yatraAdmin.siteUrl}/wp-admin/`
                      : "/wp-admin/"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {__("Back to WordPress", "yatra")}
                </a>

                <ConditionalRender capability="yatra_edit_trips">
                  <Button
                    variant={currentSubpage === "tools" ? "default" : "outline"}
                    onClick={() => {
                      const admin = (window as any)?.yatraAdmin;
                      const baseUrl = admin?.adminUrl || "";
                      window.location.href = `${baseUrl}?page=yatra&subpage=tools`;
                    }}
                    className={`flex items-center gap-2 ${
                      currentSubpage === "tools"
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        : ""
                    }`}
                  >        
                    <Wrench className="w-4 h-4" />
                    {__("Tools", "yatra")}
                  </Button>
                </ConditionalRender>
                <ConditionalRender capability="yatra_edit_trips">
                  <div className="relative">
                    <button
                      onClick={() => setIsModulesPanelOpen((prev) => !prev)}
                      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 ${isModulesPanelOpen ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                      aria-label={__("Toggle modules panel", "yatra")}
                    >
                      <Puzzle className="w-5 h-5" />
                    </button>
                    {isModulesPanelOpen && (
                      <div
                        ref={modulesPanelRef}
                        className="absolute right-0 top-12 z-50 w-80"
                      >
                        <Card className="shadow-xl border border-gray-200 dark:border-gray-700">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  {__("Modules", "yatra")}
                                </CardTitle>
                                <CardDescription>
                                  {__(
                                    "Quickly enable or disable feature packs.",
                                    "yatra",
                                  )}
                                </CardDescription>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setIsModulesPanelOpen(false);
                                  window.location.href = modulesPageUrl;
                                }}
                              >
                                {__("Open", "yatra")}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {isLoadingModules && (
                              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {__("Loading modules…", "yatra")}
                              </div>
                            )}
                            {!isLoadingModules &&
                              modulesPreview.length === 0 && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {__("No modules found.", "yatra")}
                                </div>
                              )}
                            {!isLoadingModules && modulesPreview.length > 0 && (
                              <div className="space-y-3">
                                {modulesPreview.map((module) => (
                                  <div
                                    key={module.slug}
                                    className="flex items-center justify-between border border-gray-100 dark:border-gray-800 rounded-lg p-2"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        {module.name}
                                        {module.is_core && (
                                          <Badge
                                            variant="outline"
                                            className="text-[10px]"
                                          >
                                            {__("Core", "yatra")}
                                          </Badge>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {module.enabled
                                          ? __("Enabled", "yatra")
                                          : __("Disabled", "yatra")}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleQuickToggle(
                                          module,
                                          !module.enabled,
                                        )
                                      }
                                      disabled={
                                        module.is_core ||
                                        toggleModuleMutation.isPending
                                      }
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                        module.enabled
                                          ? "bg-blue-600"
                                          : "bg-gray-300 dark:bg-gray-600"
                                      } ${module.is_core ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                                      aria-pressed={module.enabled}
                                      aria-label={
                                        module.enabled
                                          ? __("Disable module", "yatra")
                                          : __("Enable module", "yatra")
                                      }
                                    >
                                      <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                          module.enabled
                                            ? "translate-x-5"
                                            : "translate-x-1"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setIsModulesPanelOpen(false);
                                  window.location.href = modulesPageUrl;
                                }}
                              >
                                {__("Manage all modules", "yatra")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </ConditionalRender>
                <button
                  onClick={() => {
                    setDarkMode(!darkMode);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  aria-label={
                    darkMode ? "Switch to light mode" : "Switch to dark mode"
                  }
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 transition-colors"
                    aria-label={__("User menu", "yatra")}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img 
                        src={getGravatarUrl(32)}
                        alt={__("User avatar", "yatra")}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<svg class="w-5 h-5 text-gray-600 dark:text-gray-400 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                        }}
                      />
                    </div>
                  </button>
                  
                  {isUserDropdownOpen && (
                    <div
                      ref={userDropdownRef}
                      className="absolute right-0 top-12 z-50 w-64"
                    >
                      <Card className="shadow-xl border border-gray-200 dark:border-gray-700">
                        <CardContent className="p-0">
                          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                <img 
                                  src={getGravatarUrl(40)}
                                  alt={__("User avatar", "yatra")}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML = '<svg class="w-6 h-6 text-gray-600 dark:text-gray-400 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {(window as any)?.yatraAdmin?.currentUserDisplayName || (window as any)?.yatraAdmin?.currentUserLogin || "Admin"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {(window as any)?.yatraAdmin?.currentUserEmail || ""}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <a
                            href={`${(window as any)?.yatraAdmin?.siteUrl || ""}/wp-admin/profile.php`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            {__("Edit Profile", "yatra")}
                          </a>
                          
                          <a
                            href={`${(window as any)?.yatraAdmin?.siteUrl || ""}/wp-admin/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {__("Back to WordPress", "yatra")}
                          </a>
                          
                          <button
                            onClick={() => {
                              const admin = (window as any)?.yatraAdmin;
                              const siteUrl = admin?.siteUrl || "";
                              window.location.href = `${siteUrl}/wp-login.php?action=logout`;
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-3 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {__("Logout", "yatra")}
                          </button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* License Warning Banner */}
          {isProPluginActive() &&
            licenseStatus &&
            licenseStatus !== "active" && (
              <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-b-2 border-red-500">
                <div className="px-6 py-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        <span className="font-semibold">
                          {licenseStatus === "expired"
                            ? "License Expired: "
                            : licenseStatus === "invalid"
                              ? "Invalid License: "
                              : "License Not Activated: "}
                        </span>
                        {licenseStatus === "expired"
                          ? "Renew your license to continue receiving updates and support."
                          : licenseStatus === "invalid"
                            ? "Please check your license key."
                            : "Activate your license to receive updates and support."}
                      </p>
                    </div>
                    <a
                      href={getUrl("license")}
                      className="flex-shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      {licenseStatus === "expired"
                        ? "Renew Now"
                        : "Activate Now"}
                    </a>
                  </div>
                </div>
              </div>
            )}

          {/* Page Content */}
          <main
            className={`flex-1 ${isTripFormPage ? "p-0 h-full min-h-0" : "p-6 overflow-y-auto"}`}
          >
            <div className={currentSubpage === "tools" ? "" : "space-y-6"}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
