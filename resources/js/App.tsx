import React, { useMemo, useState, useEffect, Suspense, lazy } from "react";
import Layout from "./components/Layout";
import { Skeleton } from "./components/ui/skeleton";

/*
 * Page-loading strategy.
 *
 * Pages >1500 lines are split into separate chunks via React.lazy so they
 * land in the JS bundle on demand instead of inflating the initial paint.
 * Vite picks these up automatically as separate output files — operators
 * who never visit the Whatsapp tab never download its ~80KB of code.
 *
 * Pages that ship eagerly:
 *   - Dashboard: the default landing route, almost always rendered first
 *   - Smaller list pages (Trips, Bookings, Customers, etc.) where the
 *     lazy-chunk overhead (extra HTTP round-trip on first nav) outweighs
 *     the bytes saved on initial paint
 *
 * Pages that ship lazily (in line-count order, biggest savings first):
 *   - TripForm        (9.6k loc)
 *   - Settings        (8.6k loc)
 *   - Team            (3.5k loc)
 *   - Reports         (3.1k loc)
 *   - DiscountForm    (2.7k loc)
 *   - Itinerary       (2.7k loc)
 *   - RecurringRuleForm (2.6k loc)
 *   - Whatsapp        (2.6k loc)
 *   - ChannelManager  (2.5k loc)
 *   - Webhooks        (2.5k loc)
 *   - TripConsentForm (2.1k loc)
 *   - BookingForm     (1.8k loc)
 *   - DynamicPricing  (1.8k loc)
 *   - AvailabilityForm (1.7k loc)
 *   - AiAssistant     (1.6k loc)
 *   - AbandonedRecovery (1.6k loc)
 *   - WhiteLabel      (1.6k loc)
 *   - DynamicPricingRuleForm (1.5k loc)
 *   - ViewBooking     (1.5k loc)
 *
 * If you add a new heavy page, lazy-import it here too; cheap to add and
 * the only thing to remember is that lazy components must be rendered
 * inside a <Suspense> boundary (we wrap the whole renderPage() output).
 */
import Dashboard from "./pages/Dashboard";
import Trips from "./pages/Trips";
import Activities from "./pages/Activities";
import ActivityForm from "./pages/ActivityForm";
import Destinations from "./pages/Destinations";
import DestinationForm from "./pages/DestinationForm";
import Categories from "./pages/Categories";
import CategoryForm from "./pages/CategoryForm";
import DifficultyLevels from "./pages/DifficultyLevels";
import DifficultyLevelForm from "./pages/DifficultyLevelForm";
import Bookings from "./pages/Bookings";
import Customers from "./pages/Customers";
import CustomerForm from "./pages/CustomerForm";
import ViewCustomer from "./pages/ViewCustomer";
import Reviews from "./pages/Reviews";
import ReviewForm from "./pages/ReviewForm";
import ViewReview from "./pages/ViewReview";
import Tools from "./components/Tools";
import ItemTypes from "./pages/ItemTypes";
import ItemTypeForm from "./pages/ItemTypeForm";
import Items from "./pages/Items";
import ItemForm from "./pages/ItemForm";
import ItineraryForm from "./pages/ItineraryForm";
import Discounts from "./pages/Discounts";
import Payments from "./pages/Payments";
import PaymentForm from "./pages/PaymentForm";
import ViewPayment from "./pages/ViewPayment";
import TravelerCategories from "./pages/TravelerCategories";
import TravelerCategoryForm from "./pages/TravelerCategoryForm";
import Availability from "./pages/Availability";
import Departures from "./pages/Departures";
import DepartureForm from "./pages/DepartureForm";
import ViewDeparture from "./pages/ViewDeparture";
import Enquiries from "./pages/Enquiries";
import ViewEnquiry from "./pages/ViewEnquiry";
import EnquiryForm from "./pages/EnquiryForm";
import Modules from "./pages/Modules";
import Travelers from "./pages/Travelers";
import GoogleCalendar from "./pages/GoogleCalendar";
import AdditionalServices from "./pages/AdditionalServices";
import AdditionalServicesForm from "./pages/AdditionalServicesForm";
import TripConsent from "./pages/TripConsent";
import EmailAutomation from "./pages/EmailAutomation";
import EmailTemplateForm from "./pages/EmailTemplateForm";
import EmailSequenceForm from "./pages/EmailSequenceForm";
import Attributes from "./pages/Attributes";
import AttributeForm from "./pages/AttributeForm";
import License from "./pages/License";

// Lazy-loaded heavy pages — each becomes its own JS chunk.
const TripForm = lazy(() => import("./pages/TripForm"));
const Settings = lazy(() => import("./pages/Settings"));
const Team = lazy(() => import("./pages/Team"));
const Reports = lazy(() => import("./pages/Reports"));
const DiscountForm = lazy(() => import("./pages/DiscountForm"));
const Itinerary = lazy(() => import("./pages/Itinerary"));
const RecurringRuleForm = lazy(() => import("./pages/RecurringRuleForm"));
const Whatsapp = lazy(() => import("./pages/Whatsapp"));
const ChannelManager = lazy(() => import("./pages/ChannelManager"));
const Webhooks = lazy(() => import("./pages/Webhooks"));
const TripConsentForm = lazy(() => import("./pages/TripConsentForm"));
const BookingForm = lazy(() => import("./pages/BookingForm"));
const ViewBooking = lazy(() => import("./pages/ViewBooking"));
const AvailabilityForm = lazy(() => import("./pages/AvailabilityForm"));
const DynamicPricing = lazy(() => import("./pages/DynamicPricing"));
const DynamicPricingRuleForm = lazy(
  () => import("./pages/DynamicPricingRuleForm"),
);
const AiAssistant = lazy(() => import("./pages/AiAssistant"));
const AbandonedRecovery = lazy(() => import("./pages/AbandonedRecovery"));
const WhiteLabel = lazy(() => import("./pages/WhiteLabel"));

/**
 * Suspense fallback used between an old route unmounting and the new
 * lazy chunk's JS arriving. Stays compact — a skeleton matching the
 * common page-header / table shape so layout doesn't jump.
 */
const PageLoadingFallback: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const App: React.FC = () => {
  // Force re-render on URL change
  const [urlKey, setUrlKey] = useState(0);

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

  // Get subpage, tab, and action from URL query parameters
  const subpage = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("subpage") || "dashboard";
  }, [urlKey]);

  const tab = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "all";
  }, [urlKey]);

  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action");
  }, [urlKey, subpage]);

  // Render the appropriate page based on subpage, tab, and action parameters
  const renderPage = () => {
    switch (subpage.toLowerCase()) {
      case "trips":
        // Handle trips tabs
        switch (tab.toLowerCase()) {
          case "activities":
            // Check if we're creating or editing an activity
            if (action === "create" || action === "edit") {
              return <ActivityForm />;
            }
            return <Activities />;
          case "destinations":
            // Check if we're creating or editing a destination
            if (action === "create" || action === "edit") {
              return <DestinationForm />;
            }
            return <Destinations />;
          case "categories":
            // Check if we're creating or editing a category
            if (action === "create" || action === "edit") {
              return <CategoryForm />;
            }
            return <Categories />;
          case "difficulty-levels":
            // Check if we're creating or editing a difficulty level
            if (action === "create" || action === "edit") {
              return <DifficultyLevelForm />;
            }
            return <DifficultyLevels />;
          case "availability":
            // Check if we're creating or editing a recurring rule
            if (action === "create-rule" || action === "edit-rule") {
              return <RecurringRuleForm />;
            }
            // Check if we're creating or editing an availability date
            if (action === "create" || action === "edit") {
              return <AvailabilityForm />;
            }
            return <Availability />;
          case "additional-services":
            // Check if we're creating or editing a service
            if (action === "create" || action === "edit") {
              return <AdditionalServicesForm />;
            }
            return <AdditionalServices />;
          case "trip-consent":
            // Check if we're creating or editing a consent form
            if (action === "create" || action === "edit") {
              return <TripConsentForm />;
            }
            return <TripConsent />;
          case "attributes":
            // Check if we're creating or editing an attribute
            if (action === "create" || action === "edit") {
              return <AttributeForm />;
            }
            return <Attributes />;
          case "all":
          default:
            // Check if we're creating or editing a trip
            if (action === "create" || action === "edit") {
              return <TripForm />;
            }
            return <Trips />;
        }
      case "bookings":
        // Check if we're viewing, creating, or editing a booking
        if (action === "view") {
          return <ViewBooking />;
        }
        if (action === "create" || action === "edit") {
          return <BookingForm />;
        }
        return <Bookings />;
      case "customers":
        // Check if we're viewing, creating, or editing a customer
        if (action === "view") {
          return <ViewCustomer />;
        }
        if (action === "create" || action === "edit") {
          return <CustomerForm />;
        }
        return <Customers />;
      case "travelers":
        return <Travelers />;
      case "enquiries":
        // Check if we're viewing or editing an enquiry
        if (action === "view") {
          return <ViewEnquiry />;
        }
        if (action === "edit" || action === "new") {
          return <EnquiryForm />;
        }
        return <Enquiries />;
      case "reviews":
        // Check if we're viewing, creating, or editing a review
        if (action === "view") {
          return <ViewReview />;
        }
        if (action === "create" || action === "edit") {
          return <ReviewForm />;
        }
        return <Reviews />;
      case "email-automation":
        // Check if we're creating or editing a template or sequence
        if (action === "create" && tab === "template") {
          return <EmailTemplateForm />;
        }
        if (action === "edit" && tab === "template") {
          return <EmailTemplateForm />;
        }
        if (action === "create" && tab === "sequence") {
          return <EmailSequenceForm />;
        }
        if (action === "edit" && tab === "sequence") {
          return <EmailSequenceForm />;
        }
        // Default: if action is edit without tab, assume template
        if (action === "edit") {
          return <EmailTemplateForm />;
        }
        return <EmailAutomation />;
      case "itinerary":
        // Handle itinerary tabs
        switch (tab.toLowerCase()) {
          case "item-types":
            // Check if we're creating or editing an item type
            if (action === "create" || action === "edit") {
              return <ItemTypeForm />;
            }
            return <ItemTypes />;
          case "items":
            // Check if we're creating or editing an item
            if (action === "create" || action === "edit") {
              return <ItemForm />;
            }
            return <Items />;
          case "itinerary":
            // Check if we're creating or editing an itinerary entry
            if (action === "create" || action === "edit") {
              return <ItineraryForm />;
            }
            return <Itinerary />;
          default:
            return <ItemTypes />;
        }
      case "departures":
        // Check if we're viewing, creating, or editing a departure
        if (action === "view") {
          return <ViewDeparture />;
        }
        if (action === "create" || action === "edit") {
          return <DepartureForm />;
        }
        return <Departures />;
      case "discounts":
        // Check if we're creating or editing a discount
        if (action === "create" || action === "edit") {
          return <DiscountForm />;
        }
        return <Discounts />;
      case "payments":
        // Check if we're viewing, creating, or editing a payment
        if (action === "view") {
          return <ViewPayment />;
        }
        if (action === "create" || action === "edit") {
          return <PaymentForm />;
        }
        return <Payments />;
      case "traveler-categories":
        // Check if we're creating or editing a traveler category
        if (action === "create" || action === "edit") {
          return <TravelerCategoryForm />;
        }
        return <TravelerCategories />;
      case "reports":
        return <Reports />;
      case "tools":
        return <Tools />;
      case "settings":
        return <Settings />;
      case "modules":
        return <Modules />;
      case "google-calendar":
        return <GoogleCalendar />;
      case "additional-services":
        // Check if we're creating or editing a service
        if (action === "create" || action === "edit") {
          return <AdditionalServicesForm />;
        }
        return <AdditionalServices />;
      case "trip-consent":
        // Check if we're creating or editing a consent form
        if (action === "create" || action === "edit") {
          return <TripConsentForm />;
        }
        return <TripConsent />;
      case "abandoned-recovery":
        return <AbandonedRecovery tab={tab} />;
      case "dynamic-pricing":
        if (
          action === "create-pricing-rule" ||
          action === "edit-pricing-rule"
        ) {
          return <DynamicPricingRuleForm />;
        }

        return <DynamicPricing />;
      case "license":
        return <License />;
      case "white-label":
        return <WhiteLabel />;
      case "ai-assistant":
        return <AiAssistant />;
      case "whatsapp":
        return <Whatsapp />;
      case "channel-manager":
        return <ChannelManager />;
      case "webhooks":
        return <Webhooks />;
      case "team":
        return <Team />;
      case "dashboard":
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      <Suspense fallback={<PageLoadingFallback />}>{renderPage()}</Suspense>
    </Layout>
  );
};

export default App;
