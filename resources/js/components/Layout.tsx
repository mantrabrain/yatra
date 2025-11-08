import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Calendar, 
  Users, 
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
  BadgePercent
} from 'lucide-react';

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
  
  // Get current subpage and tab from URL
  const currentSubpage = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('subpage') || 'dashboard';
  }, []);

  const currentTab = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'all';
  }, []);

  // Track expanded submenus
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    // Auto-expand trips or itinerary menu if we're on those pages
    if (currentSubpage === 'trips' || currentSubpage === 'itinerary') {
      return [currentSubpage];
    }
    return [];
  });

  // Get base admin URL
  const baseUrl = useMemo(() => {
    return window.yatraAdmin?.siteUrl 
      ? `${window.yatraAdmin.siteUrl}/wp-admin/admin.php?page=yatra`
      : '/wp-admin/admin.php?page=yatra';
  }, []);

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
      ]
    },
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
    { subpage: 'discounts', label: 'Discount', icon: BadgePercent },
    { subpage: 'bookings', label: 'Bookings', icon: Calendar },
    { subpage: 'customers', label: 'Customers', icon: Users },
    { subpage: 'reviews', label: 'Reviews', icon: Star },
    { subpage: 'reports', label: 'Reports', icon: BarChart3 },
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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Y</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Yatra</span>
            </div>
          </div>

          {/* Navigation */}
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

          {/* Back to WordPress Link */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <a 
              href={window.yatraAdmin?.siteUrl ? `${window.yatraAdmin.siteUrl}/wp-admin/` : '/wp-admin/'} 
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span>← Back to WordPress</span>
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center">
            <div className="flex items-center justify-between w-full">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {(() => {
                  const activeItem = menuItems.find(item => isActive(item.subpage));
                  if (activeItem?.submenu && currentTab) {
                    const activeSubItem = activeItem.submenu.find(sub => sub.tab === currentTab);
                    return activeSubItem?.label || activeItem.label;
                  }
                  return activeItem?.label || 'Dashboard';
                })()}
              </h1>
              
              <div className="flex items-center gap-4">
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
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;

