import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { API_ENDPOINTS } from "../lib/api-endpoints";
import { __ } from "../lib/i18n";
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  User,
  FileText,
  LogOut,
  ShieldCheck,
  Heart,
  Package,
  DollarSign,
} from "lucide-react";
import type {
  Section,
  Booking,
  Payment,
  TravelDocument,
  CustomerProfile,
} from "./account/types";
import {
  formatDate,
  getYatraAccountPageGlobals,
  phoneToTelHref,
} from "./account/utils";
import Dashboard from "./account/Dashboard";
import Bookings from "./account/Bookings";
import Payments from "./account/Payments";
import Documents from "./account/Documents";
import Profile from "./account/Profile";
import SavedTrips from "./account/SavedTrips";

const navigation: Array<{
  id: Section;
  label: string;
  icon: React.ElementType;
}> = [
  { id: "dashboard", label: __("Dashboard", "yatra"), icon: LayoutDashboard },
  { id: "bookings", label: __("Bookings", "yatra"), icon: Calendar },
  { id: "payments", label: __("Payments", "yatra"), icon: CreditCard },
  { id: "documents", label: __("Documents", "yatra"), icon: FileText },
  { id: "saved-trips", label: __("Saved Trips", "yatra"), icon: Heart },
  { id: "profile", label: __("Profile", "yatra"), icon: User },
];

const AccountPage: React.FC = () => {
  const accountShell = useMemo(() => getYatraAccountPageGlobals(), []);

  const accountNavigation = React.useMemo(() => {
    const wl =
      typeof window !== "undefined" &&
      !!(
        window as unknown as {
          yatraAccountPage?: { wishlistEnabled?: boolean };
        }
      ).yatraAccountPage?.wishlistEnabled;
    return navigation.filter((n) => n.id !== "saved-trips" || wl);
  }, []);

  // Track URL changes
  const [urlKey, setUrlKey] = useState(0);

  React.useEffect(() => {
    const handleLocationChange = () => {
      setUrlKey((prev) => prev + 1);
    };

    // Listen for popstate (back/forward button)
    window.addEventListener("popstate", handleLocationChange);

    // Also check periodically (fallback for direct navigation)
    const interval = setInterval(() => {
      const currentSearch = window.location.search;
      if (currentSearch !== (window as any).__lastAccountSearch) {
        (window as any).__lastAccountSearch = currentSearch;
        handleLocationChange();
      }
    }, 100);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      clearInterval(interval);
    };
  }, []);

  // Get section from URL parameter, localStorage, or default to 'dashboard'
  const getSectionFromUrl = (): Section => {
    if (typeof window !== "undefined") {
      const wl = !!(
        window as unknown as {
          yatraAccountPage?: { wishlistEnabled?: boolean };
        }
      ).yatraAccountPage?.wishlistEnabled;
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "saved-trips" && !wl) {
        return "dashboard";
      }
      if (
        tab &&
        [
          "dashboard",
          "bookings",
          "payments",
          "documents",
          "profile",
          "saved-trips",
        ].includes(tab)
      ) {
        return tab as Section;
      }
      // Fallback to localStorage
      const saved = localStorage.getItem("yatra-account-active-section");
      const wlSaved = !!(
        window as unknown as {
          yatraAccountPage?: { wishlistEnabled?: boolean };
        }
      ).yatraAccountPage?.wishlistEnabled;
      if (saved === "saved-trips" && !wlSaved) {
        return "dashboard";
      }
      if (
        saved &&
        [
          "dashboard",
          "bookings",
          "payments",
          "documents",
          "profile",
          "saved-trips",
        ].includes(saved)
      ) {
        return saved as Section;
      }
    }
    return "dashboard";
  };

  const [section, setSection] = useState<Section>(getSectionFromUrl);

  // Update section when URL changes
  React.useEffect(() => {
    const newSection = getSectionFromUrl();
    setSection(newSection);
  }, [urlKey]);

  // Update URL and localStorage when section changes
  const handleSectionChange = (newSection: Section) => {
    setSection(newSection);

    if (typeof window !== "undefined") {
      // Update URL
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set("tab", newSection);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.pushState({}, "", newUrl);

      // Save to localStorage
      localStorage.setItem("yatra-account-active-section", newSection);

      // Trigger URL change event
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  // State moved to individual components

  const unwrapArrayResponse = (response: any): any[] => {
    if (!response) return [];

    // Common WP pattern: { success: true, data: [...] }
    if (
      typeof response === "object" &&
      response.success === true &&
      Array.isArray(response.data)
    ) {
      return response.data;
    }

    // Nested wrapper pattern: { data: { success: true, data: [...] } }
    if (
      typeof response === "object" &&
      response.data &&
      typeof response.data === "object"
    ) {
      const inner = response.data;
      if (inner.success === true && Array.isArray(inner.data)) {
        return inner.data;
      }
      if (Array.isArray(inner)) {
        return inner;
      }
    }

    // Direct array
    if (Array.isArray(response)) {
      return response;
    }

    // Some endpoints may return {data: [...]} without success
    if (typeof response === "object" && Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  };

  const { data: profile, isLoading: isLoadingProfile } =
    useQuery<CustomerProfile | null>({
      queryKey: ["account-profile"],
      queryFn: async () => {
        try {
          const response = await apiClient.get(API_ENDPOINTS.CUSTOMER_ME);
          const raw =
            response &&
            typeof response === "object" &&
            "data" in response &&
            response.data &&
            typeof response.data === "object"
              ? response.data
              : response;
          if (
            !raw ||
            typeof raw !== "object" ||
            (!("id" in raw) && !("user_id" in raw) && !("email" in raw))
          ) {
            return null;
          }
          const row = raw as CustomerProfile & { created_at?: string };
          const fromParts = [row.first_name, row.last_name]
            .filter(Boolean)
            .join(" ")
            .trim();
          const name =
            (typeof row.name === "string" && row.name.trim()) ||
            fromParts ||
            (typeof row.email === "string"
              ? row.email.split("@")[0] || ""
              : "") ||
            "";
          return {
            ...row,
            name,
            registered_at: row.registered_at || row.created_at || "",
          } as CustomerProfile;
        } catch (error) {
          console.error("Error fetching profile:", error);
          return null;
        }
      },
      refetchOnMount: "always",
    });

  const displayProfile = profile;

  // Fetch bookings
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["account-bookings"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(
          API_ENDPOINTS.CUSTOMER_MY_BOOKINGS,
        );
        return unwrapArrayResponse(response) as Booking[];
      } catch (error) {
        console.error("Error fetching bookings:", error);
        return [];
      }
    },
    refetchOnMount: "always",
  });

  // Fetch payments
  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["account-payments"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(
          API_ENDPOINTS.CUSTOMER_MY_PAYMENTS,
        );
        return unwrapArrayResponse(response) as Payment[];
      } catch (error) {
        console.error("Error fetching payments:", error);
        return [];
      }
    },
    refetchOnMount: "always",
  });

  // Fetch documents
  const { data: documents = [] } = useQuery<TravelDocument[]>({
    queryKey: ["account-documents"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(
          API_ENDPOINTS.CUSTOMER_MY_DOCUMENTS,
        );
        return unwrapArrayResponse(response) as TravelDocument[];
      } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
      }
    },
    refetchOnMount: "always",
  });

  // Notifications (empty for now)
  const notifications: any[] = [];

  // Fetch saved trips
  const wishlistEnabled =
    typeof window !== "undefined" &&
    !!(
      window as unknown as { yatraAccountPage?: { wishlistEnabled?: boolean } }
    ).yatraAccountPage?.wishlistEnabled;

  const { data: savedTripsData, isLoading: isLoadingSavedTrips } =
    useQuery<any>({
      queryKey: ["account-saved-trips"],
      enabled: wishlistEnabled,
      queryFn: async () => {
        try {
          const response = await apiClient.get(API_ENDPOINTS.SAVED_TRIPS);
          // WordPress REST API returns: {success: true, data: [...]}
          // apiClient might wrap it in response.data
          let trips = [];

          if (response && typeof response === "object") {
            // Check if response has a data property (apiClient wrapper)
            if (response.data && typeof response.data === "object") {
              // Check for success property first (WordPress REST API format)
              if (
                response.data.success === true &&
                Array.isArray(response.data.data)
              ) {
                trips = response.data.data;
              }
              // Direct data property
              else if (Array.isArray(response.data.data)) {
                trips = response.data.data;
              }
              // Direct array in response.data
              else if (Array.isArray(response.data)) {
                trips = response.data;
              }
            }
            // Check for success property directly
            else if (
              response.success === true &&
              Array.isArray(response.data)
            ) {
              trips = response.data;
            }
            // Direct data property
            else if (Array.isArray(response.data)) {
              trips = response.data;
            }
            // Direct array response
            else if (Array.isArray(response)) {
              trips = response;
            }
          }

          // Debug: log first trip to see structure
          if (trips.length > 0) {
          }

          return trips;
        } catch (error) {
          console.error("Error fetching saved trips:", error);
          return [];
        }
      },
    });

  const savedTrips = Array.isArray(savedTripsData) ? savedTripsData : [];

  // Booking details fetching moved to Bookings component

  const currency = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(value);

  // formatDate imported from ./account/utils

  const stats = useMemo(() => {
    const outstanding = payments
      .filter((p: Payment) => p.status === "pending")
      .reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
    const upcoming = bookings.filter(
      (b: Booking) => new Date(b.travel_date) > new Date(),
    ).length;

    // Calculate from real data
    const totalSpent = displayProfile?.total_spent ?? 0;
    const totalBookings = bookings.length;

    return [
      {
        label: __("Total Bookings", "yatra"),
        value: displayProfile?.total_bookings ?? totalBookings,
        icon: Package,
        badge: displayProfile?.loyalty_tier || "",
      },
      {
        label: __("Upcoming Trips", "yatra"),
        value: upcoming,
        icon: Calendar,
      },
      {
        label: __("Outstanding Balance", "yatra"),
        value: currency(outstanding),
        icon: DollarSign,
      },
      {
        label: __("Total Spent", "yatra"),
        value: currency(totalSpent),
        icon: ShieldCheck,
      },
    ];
  }, [bookings, payments, displayProfile]);

  // getBadge moved to ./account/utils

  // Old render functions removed - now using components from ./account/

  const renderSection = () => {
    switch (section) {
      case "dashboard":
        return (
          <Dashboard
            bookings={bookings}
            payments={payments}
            displayProfile={displayProfile || null}
            stats={stats}
            notifications={notifications}
            conciergePhone={accountShell.companyPhone}
            conciergeEmail={accountShell.companyEmail}
            onSectionChange={(section: string) =>
              handleSectionChange(section as Section)
            }
          />
        );
      case "bookings":
        return (
          <Bookings
            bookings={bookings}
            conciergePhone={accountShell.companyPhone}
            conciergeEmail={accountShell.companyEmail}
            onSectionChange={(section: string) =>
              handleSectionChange(section as Section)
            }
          />
        );
      case "payments":
        return (
          <Payments
            payments={payments}
            onSectionChange={(section: string) =>
              handleSectionChange(section as Section)
            }
          />
        );
      case "documents":
        return <Documents documents={documents} />;
      case "saved-trips":
        if (!wishlistEnabled) {
          return null;
        }
        return (
          <SavedTrips savedTrips={savedTrips} isLoading={isLoadingSavedTrips} />
        );
      case "profile":
        return (
          <Profile
            profile={displayProfile || null}
            savedTrips={savedTrips}
            wishlistEnabled={wishlistEnabled}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {displayProfile?.registered_at
                  ? formatDate(displayProfile.registered_at)
                  : ""}
              </p>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {__("Hello,", "yatra")}{" "}
                {displayProfile?.name || __("Guest", "yatra")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {__(
                  "Manage bookings, payments, and documents – everything for your adventures in one place.",
                  "yatra",
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  const url = accountShell.logoutUrl;
                  if (url) {
                    window.location.href = url;
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    const url = accountShell.logoutUrl;
                    if (url) {
                      window.location.href = url;
                    }
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer text-sm"
              >
                <LogOut className="w-4 h-4" /> {__("Logout", "yatra")}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-4 lg:sticky lg:top-10 self-start bg-transparent">
            <nav className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
              <div className="p-4 space-y-1">
                {accountNavigation.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSectionChange(item.id)}
                    className={`yatra-nav-item yatra-nav-item-${item.id} w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                      section === item.id
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/40"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                ))}
              </div>
            </nav>

            <div
              className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white space-y-2 shadow-xl"
              style={{
                backgroundColor: "#2563eb",
                backgroundImage:
                  "linear-gradient(to bottom right, #2563eb, #4f46e5)",
              }}
            >
              <ShieldCheck className="w-6 h-6 text-white" />
              <p className="text-sm font-medium text-white">
                {__("Need help right away?", "yatra")}
              </p>
              <p className="font-semibold text-lg text-white">
                {accountShell.companyName || __("Concierge Desk", "yatra")}
              </p>
              {accountShell.companyPhone ? (
                <a
                  href={phoneToTelHref(accountShell.companyPhone)}
                  className="text-sm font-medium text-white hover:underline"
                >
                  {accountShell.companyPhone}
                </a>
              ) : accountShell.companyEmail ? (
                <a
                  href={`mailto:${encodeURIComponent(accountShell.companyEmail)}`}
                  className="text-sm font-medium text-white hover:underline break-all"
                >
                  {accountShell.companyEmail}
                </a>
              ) : null}
            </div>
          </aside>

          <section className="flex-1 min-w-0 space-y-6" style={{ minWidth: 0 }}>
            {isLoadingProfile && !profile ? (
              <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
                  </div>
                </div>

                {/* Stats Skeleton */}
                <div className="flex flex-nowrap gap-6 overflow-x-auto">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 min-w-0 flex-1"
                    >
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Content Cards Skeleton */}
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
                    >
                      <div className="animate-pulse">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              renderSection()
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
