import React, { useMemo, useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import TripForm from './pages/TripForm';
import Activities from './pages/Activities';
import ActivityForm from './pages/ActivityForm';
import Destinations from './pages/Destinations';
import DestinationForm from './pages/DestinationForm';
import Categories from './pages/Categories';
import CategoryForm from './pages/CategoryForm';
import DifficultyLevels from './pages/DifficultyLevels';
import DifficultyLevelForm from './pages/DifficultyLevelForm';
import Bookings from './pages/Bookings';
import BookingForm from './pages/BookingForm';
import ViewBooking from './pages/ViewBooking';
import Customers from './pages/Customers';
import CustomerForm from './pages/CustomerForm';
import ViewCustomer from './pages/ViewCustomer';
import Reviews from './pages/Reviews';
import ReviewForm from './pages/ReviewForm';
import ViewReview from './pages/ViewReview';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ItemTypes from './pages/ItemTypes';
import ItemTypeForm from './pages/ItemTypeForm';
import Items from './pages/Items';
import ItemForm from './pages/ItemForm';
import Itinerary from './pages/Itinerary';
import ItineraryForm from './pages/ItineraryForm';
import Discounts from './pages/Discounts';
import DiscountForm from './pages/DiscountForm';
import Payments from './pages/Payments';
import PaymentForm from './pages/PaymentForm';
import ViewPayment from './pages/ViewPayment';
import TravelerCategories from './pages/TravelerCategories';
import TravelerCategoryForm from './pages/TravelerCategoryForm';
import Availability from './pages/Availability';
import AvailabilityForm from './pages/AvailabilityForm';
import Enquiries from './pages/Enquiries';
import ViewEnquiry from './pages/ViewEnquiry';
import Modules from './pages/Modules';

const App: React.FC = () => {
  // Force re-render on URL change
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

  // Get subpage, tab, and action from URL query parameters
  const subpage = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('subpage') || 'dashboard';
  }, [urlKey]);

  const tab = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'all';
  }, [urlKey]);

  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('action');
  }, [urlKey]);

  // Render the appropriate page based on subpage, tab, and action parameters
  const renderPage = () => {
    switch (subpage.toLowerCase()) {
      case 'trips':
        // Handle trips tabs
        switch (tab.toLowerCase()) {
          case 'activities':
            // Check if we're creating or editing an activity
            if (action === 'create' || action === 'edit') {
              return <ActivityForm />;
            }
            return <Activities />;
          case 'destinations':
            // Check if we're creating or editing a destination
            if (action === 'create' || action === 'edit') {
              return <DestinationForm />;
            }
            return <Destinations />;
          case 'categories':
            // Check if we're creating or editing a category
            if (action === 'create' || action === 'edit') {
              return <CategoryForm />;
            }
            return <Categories />;
          case 'difficulty-levels':
            // Check if we're creating or editing a difficulty level
            if (action === 'create' || action === 'edit') {
              return <DifficultyLevelForm />;
            }
            return <DifficultyLevels />;
          case 'availability':
            // Check if we're creating or editing an availability date
            if (action === 'create' || action === 'edit') {
              return <AvailabilityForm />;
            }
            return <Availability />;
          case 'all':
          default:
            // Check if we're creating or editing a trip
            if (action === 'create' || action === 'edit') {
              return <TripForm />;
            }
            return <Trips />;
        }
      case 'bookings':
        // Check if we're viewing, creating, or editing a booking
        if (action === 'view') {
          return <ViewBooking />;
        }
        if (action === 'create' || action === 'edit') {
          return <BookingForm />;
        }
        return <Bookings />;
      case 'customers':
        // Check if we're viewing, creating, or editing a customer
        if (action === 'view') {
          return <ViewCustomer />;
        }
        if (action === 'create' || action === 'edit') {
          return <CustomerForm />;
        }
        return <Customers />;
      case 'enquiries':
        // Check if we're viewing or editing an enquiry
        if (action === 'view') {
          return <ViewEnquiry />;
        }
        if (action === 'edit') {
          return <ViewEnquiry />;
        }
        return <Enquiries />;
      case 'reviews':
        // Check if we're viewing, creating, or editing a review
        if (action === 'view') {
          return <ViewReview />;
        }
        if (action === 'create' || action === 'edit') {
          return <ReviewForm />;
        }
        return <Reviews />;
      case 'itinerary':
        // Handle itinerary tabs
        switch (tab.toLowerCase()) {
          case 'item-types':
            // Check if we're creating or editing an item type
            if (action === 'create' || action === 'edit') {
              return <ItemTypeForm />;
            }
            return <ItemTypes />;
          case 'items':
            // Check if we're creating or editing an item
            if (action === 'create' || action === 'edit') {
              return <ItemForm />;
            }
            return <Items />;
          case 'itinerary':
            // Check if we're creating or editing an itinerary entry
            if (action === 'create' || action === 'edit') {
              return <ItineraryForm />;
            }
            return <Itinerary />;
          default:
            return <ItemTypes />;
        }
      case 'discounts':
        // Check if we're creating or editing a discount
        if (action === 'create' || action === 'edit') {
          return <DiscountForm />;
        }
        return <Discounts />;
      case 'payments':
        // Check if we're viewing, creating, or editing a payment
        if (action === 'view') {
          return <ViewPayment />;
        }
        if (action === 'create' || action === 'edit') {
          return <PaymentForm />;
        }
        return <Payments />;
      case 'traveler-categories':
        // Check if we're creating or editing a traveler category
        if (action === 'create' || action === 'edit') {
          return <TravelerCategoryForm />;
        }
        return <TravelerCategories />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'modules':
        return <Modules />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
};

export default App;

