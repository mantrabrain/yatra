import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Calendar, 
  Star, 
  BarChart3, 
  Settings,
  Moon,
  Sun,
  Bell,
  User,
  ChevronDown,
  ChevronRight,
  List,
  Activity,
  Map,
  FileText,
  Tag,
  Route,
  BadgePercent,
  CreditCard,
  UserCircle,
  CalendarDays,
  MessageSquare,
  FolderTree,
  TrendingUp,
  RefreshCw,
  Puzzle,
  Loader2,
  Plane,
  ArrowLeft,
  Package,
  FileSignature,
  Mail
} from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { ConditionalRender } from '../components/ui/conditional-render';
import { useToast } from '../components/ui/toast';
import { apiClient } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useModulesQuery, useToggleModule, type ModuleDefinition } from '../hooks/useModules';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Load dark mode preference from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('yatra-dark-mode');
    return saved === 'true';
  });

  // Apply dark mode to document on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('yatra-dark-mode', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('yatra-dark-mode', 'false');
    }
  }, [darkMode]);
  
  const { showToast } = useToast();

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isModulesPanelOpen, setIsModulesPanelOpen] = useState(false);
  const modulesPanelRef = useRef<HTMLDivElement | null>(null);
  const { data: modulesData = [], isLoading: isLoadingModules } = useModulesQuery({
    enabled: isModulesPanelOpen,
  });
  const toggleModuleMutation = useToggleModule();
  const modulesPreview = useMemo<ModuleDefinition[]>(() => modulesData.slice(0, 3), [modulesData]);
  const handleQuickToggle = (module: ModuleDefinition, enabled: boolean) => {
    toggleModuleMutation.mutate({ slug: module.slug, enabled, name: module.name });
  };

  const handleRegenerateTables = async () => {
    if (isRegenerating) return;
    try {
      setIsRegenerating(true);
      await apiClient.post('/maintenance/regenerate-tables');
      showToast(__('Tables regenerated successfully.', 'Tables regenerated successfully.'), 'success');
    } catch (error: any) {
      showToast(error?.message || __('Failed to regenerate tables.', 'Failed to regenerate tables.'), 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Track URL changes to update menu state
  const [urlKey, setUrlKey] = useState(0);

  useEffect(() => {
    const handleLocationChange = () => {
      setUrlKey(prev => prev + 1);
    };

    // Listen for popstate (back/forward button)
    window.addEventListener('popstate', handleLocationChange);
    
    // Also check periodically (fallback for direct navigation)
    const interval = setInterval(() => {
      const currentSearch = window.location.search;
      if (currentSearch !== (window as any).__lastSearch) {
        (window as any).__lastSearch = currentSearch;
        handleLocationChange();
      }
    }, 100);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isModulesPanelOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modulesPanelRef.current && !modulesPanelRef.current.contains(event.target as Node)) {
        setIsModulesPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModulesPanelOpen]);
  
  // Get current subpage and tab from URL
  const currentSubpage = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('subpage') || 'dashboard';
  }, [urlKey]);

  const currentTab = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'all';
  }, [urlKey]);

  const currentAction = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action');
  }, [urlKey]);

  // Check if we're on the trip form page
  const isTripFormPage = useMemo(() => {
    return currentSubpage === 'trips' && 
           (currentTab === 'all' || !currentTab) && 
           (currentAction === 'create' || currentAction === 'edit');
  }, [currentSubpage, currentTab, currentAction, urlKey]);

  // Track expanded submenus - initialize based on current subpage
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const subpage = params.get('subpage') || 'dashboard';
    const menus: string[] = [];
    
    if (subpage === 'trips') {
      menus.push('trips');
    }
    
    if (subpage === 'itinerary') {
      menus.push('itinerary');
    }
    
    return menus;
  });

  // Auto-expand menu when on submenu pages
  useEffect(() => {
    const menusToExpand: string[] = [];
    
    if (currentSubpage === 'trips') {
      menusToExpand.push('trips');
    }
    
    if (currentSubpage === 'itinerary') {
      menusToExpand.push('itinerary');
    }
    
    setExpandedMenus(prev => {
      // Only update if the menus to expand are different
      const newMenus = [...new Set([...prev, ...menusToExpand])];
      if (newMenus.length !== prev.length || !newMenus.every(m => prev.includes(m))) {
        return newMenus;
      }
      return prev;
    });
  }, [currentSubpage, urlKey]);

  // Get base admin URL
  const baseUrl = useMemo(() => {
    return window.yatraAdmin?.siteUrl 
      ? `${window.yatraAdmin.siteUrl}/wp-admin/admin.php?page=yatra`
      : '/wp-admin/admin.php?page=yatra';
  }, []);

  const modulesPageUrl = useMemo(() => `${baseUrl}&subpage=modules`, [baseUrl]);

  const menuItems = [
    { subpage: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      subpage: 'trips', 
      label: 'Trips', 
      icon: MapPin,
      submenu: [
        { tab: 'all', label: 'All Trips', icon: List },
        { tab: 'activities', label: 'Activities', icon: Activity },
        { tab: 'destinations', label: 'Destinations', icon: Map },
        { tab: 'categories', label: 'Categories', icon: FolderTree },
        { tab: 'difficulty-levels', label: 'Difficulty Levels', icon: TrendingUp },
        { tab: 'availability', label: 'Availability', icon: CalendarDays },
        // Additional Services - only show if module is enabled
        ...((window as any).yatraAdmin?.additionalServicesEnabled ? [{ tab: 'additional-services', label: 'Additional Services', icon: Package, isPremium: true }] : []),
        // Trip Consent - only show if module is enabled
        ...((window as any).yatraAdmin?.tripConsentEnabled ? [{ tab: 'trip-consent', label: 'Trip Consent', icon: FileSignature, isPremium: true }] : []),
      ]
    },
    { subpage: 'traveler-categories', label: 'Traveler Categories', icon: UserCircle },
    { 
      subpage: 'itinerary', 
      label: 'Itinerary', 
      icon: FileText,
      submenu: [
        { tab: 'item-types', label: 'Item Types', icon: Tag },
        { tab: 'items', label: 'Items', icon: Route },
        { tab: 'itinerary', label: 'Itinerary', icon: FileText },
      ]
    },
    { subpage: 'departures', label: 'Departures', icon: Calendar },
    { subpage: 'discounts', label: 'Discounts', icon: BadgePercent },
    { subpage: 'payments', label: 'Payments', icon: CreditCard },
    { subpage: 'bookings', label: 'Bookings', icon: Calendar },
    { subpage: 'customers', label: 'Customers', icon: UserCircle },
    { subpage: 'travelers', label: 'Travelers', icon: Plane },
    { subpage: 'enquiries', label: 'Enquiries', icon: MessageSquare },
    { subpage: 'reviews', label: 'Reviews', icon: Star },
    { subpage: 'reports', label: 'Reports', icon: BarChart3 },
    // Email Automation - only show if module is enabled
    ...((window as any).yatraAdmin?.emailAutomationEnabled ? [{ subpage: 'email-automation', label: 'Email Automation', icon: Mail, isPremium: true }] : []),
    { subpage: 'modules', label: 'Modules', icon: Puzzle },
    { subpage: 'settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (subpage: string, tab?: string) => {
    if (tab) {
      return currentSubpage === subpage && currentTab === tab;
    }
    // For parent menu items, check if current subpage matches
    // or if any submenu item is active
    if (currentSubpage === subpage) {
      const menuItem = menuItems.find(item => item.subpage === subpage);
      if (menuItem?.submenu) {
        // If it has submenu, check if any submenu item is active
        return menuItem.submenu.some(sub => sub.tab === currentTab);
      }
      return true;
    }
    return false;
  };

  const isMenuExpanded = (subpage: string) => {
    return expandedMenus.includes(subpage);
  };

  const toggleMenu = (subpage: string) => {
    setExpandedMenus(prev => 
      prev.includes(subpage) 
        ? prev.filter(m => m !== subpage)
        : [...prev, subpage]
    );
  };

  const getUrl = (subpage: string, tab?: string) => {
    if (subpage === 'dashboard') {
      return baseUrl;
    }
    if (tab) {
      return `${baseUrl}&subpage=${subpage}&tab=${tab}`;
    }
    return `${baseUrl}&subpage=${subpage}`;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Logo */}
          <div className="h-16 px-6 flex items-center border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col w-full gap-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Y</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Yatra</span>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                    <span>v{window.yatraAdmin?.version || '1.0.0'}</span>
                    {window.yatraAdmin?.proVersion && (
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-medium">
                        Pro v{window.yatraAdmin.proVersion}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <a
                href={window.yatraAdmin?.siteUrl ? `${window.yatraAdmin.siteUrl}/wp-admin/` : '/wp-admin/'}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to WordPress</span>
              </a>
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
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                            const subActive = isActive(item.subpage, subItem.tab);
                            const SubIcon = subItem.icon;
                            return (
                              <a
                                key={subItem.tab}
                                href={getUrl(item.subpage, subItem.tab)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                                  subActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                {SubIcon && <SubIcon className="w-4 h-4" />}
                                <span className="text-sm">{subItem.label}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <a
                      href={getUrl(item.subpage)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </a>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Sticky bottom back link */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <a
              href={window.yatraAdmin?.siteUrl ? `${window.yatraAdmin.siteUrl}/wp-admin/` : '/wp-admin/'}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="w-3 h-3" />
                <span>{__('Back to WordPress', 'Back to WordPress')}</span>
              </span>
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${isTripFormPage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {/* Top Bar */}
          <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center">
            <div className="flex items-center justify-between w-full">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {(() => {
                  // Show specific text for trip form page
                  if (isTripFormPage) {
                    return currentAction === 'create' ? 'Create Trip' : 'Edit Trip';
                  }
                  
                  const activeItem = menuItems.find(item => isActive(item.subpage));
                  if (activeItem?.submenu && currentTab) {
                    const activeSubItem = activeItem.submenu.find(sub => sub.tab === currentTab);
                    return activeSubItem?.label || activeItem.label;
                  }
                  return activeItem?.label || 'Dashboard';
                })()}
              </h1>
              
              <div className="flex items-center gap-4">
                <ConditionalRender capability="yatra_edit_trips">
                  <Button
                    variant="outline"
                    onClick={handleRegenerateTables}
                    disabled={isRegenerating}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    {isRegenerating ? __('Regenerating...', 'Regenerating...') : __('Regenerate Tables', 'Regenerate Tables')}
                  </Button>
                </ConditionalRender>
                <ConditionalRender capability="yatra_edit_trips">
                  <Button
                    variant={currentSubpage === 'tools' ? 'default' : 'outline'}
                    onClick={() => {
                      const admin = (window as any)?.yatraAdmin;
                      const baseUrl = admin?.adminUrl || '';
                      window.location.href = `${baseUrl}?page=yatra&subpage=tools`;
                    }}
                    className={`flex items-center gap-2 ${
                      currentSubpage === 'tools' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                        : ''
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    {__('Tools', 'Tools')}
                  </Button>
                </ConditionalRender>
                <ConditionalRender capability="yatra_edit_trips">
                  <div className="relative">
                    <button
                      onClick={() => setIsModulesPanelOpen(prev => !prev)}
                      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 ${isModulesPanelOpen ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                      aria-label={__('Toggle modules panel', 'Toggle modules panel')}
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
                                <CardTitle className="text-base">{__('Modules', 'Modules')}</CardTitle>
                                <CardDescription>
                                  {__('Quickly enable or disable feature packs.', 'Quickly enable or disable feature packs.')}
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
                                {__('Open', 'Open')}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {isLoadingModules && (
                              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {__('Loading modules…', 'Loading modules…')}
                              </div>
                            )}
                            {!isLoadingModules && modulesPreview.length === 0 && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {__('No modules found.', 'No modules found.')}
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
                                          <Badge variant="outline" className="text-[10px]">
                                            {__('Core', 'Core')}
                                          </Badge>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {module.enabled
                                          ? __('Enabled', 'Enabled')
                                          : __('Disabled', 'Disabled')}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => handleQuickToggle(module, !module.enabled)}
                                      disabled={module.is_core || toggleModuleMutation.isPending}
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                        module.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                      } ${module.is_core ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                      aria-pressed={module.enabled}
                                      aria-label={
                                        module.enabled
                                          ? __('Disable module', 'Disable module')
                                          : __('Enable module', 'Enable module')
                                      }
                                    >
                                      <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                          module.enabled ? 'translate-x-5' : 'translate-x-1'
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
                                {__('Manage all modules', 'Manage all modules')}
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
                  aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {window.yatraAdmin?.currentUser || 'Admin'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className={`flex-1 ${isTripFormPage ? 'p-0 h-full min-h-0' : 'p-6 overflow-y-auto'}`}>
            <div className={currentSubpage === 'tools' ? '' : 'space-y-6'}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;

