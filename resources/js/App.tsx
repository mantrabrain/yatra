import React, { useMemo, useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import TripForm from './pages/TripForm';
import Activities from './pages/Activities';
import ActivityForm from './pages/ActivityForm';
import Destinations from './pages/Destinations';
import DestinationForm from './pages/DestinationForm';
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
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
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

