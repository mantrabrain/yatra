YATRA PLUGIN DOCUMENTATION
===========================

TABLE OF CONTENTS
-----------------
1. Installation
2. Configuration
3. Core Features
4. API Endpoints
5. Frontend Components
6. Shortcodes
7. Hooks and Filters
8. Database Schema
9. Troubleshooting


INSTALLATION
============

SYSTEM REQUIREMENTS
-------------------
• WordPress 5.0 or higher
• PHP 7.4 or higher
• MySQL 5.7 or higher
• Memory: 64MB or higher recommended
• Web Server: Apache or Nginx with mod_rewrite enabled


SETUP STEPS
-----------

1. Upload Plugin
   Log in to WordPress Admin dashboard, navigate to Plugins → Add New, click "Upload Plugin", choose the yatra.zip file, and click "Install Now".

2. Activate Plugin
   Go to Plugins and click "Activate" under Yatra plugin.

3. Database Setup
   The plugin automatically creates required database tables upon activation:
   • yatra_trips - Trip information storage
   • yatra_availability - Availability dates and pricing
   • yatra_bookings - Booking records
   • yatra_settings - Plugin configuration

4. Basic Configuration
   After activation, configure basic settings in Yatra → Settings:
   • Set Site URL and Currency
   • Configure Permalink Structure
   • Set up Email Settings
   • Configure Payment Gateways

5. Verify Installation
   Test the following functionality:
   • Trip pages load correctly
   • Availability checking works
   • Booking forms submit properly
   • Responsive design works on mobile


API TESTING
-----------
Test REST API endpoints:

curl -X GET "http://yoursite.com/wp-json/yatra/v1/trips"


COMMON ISSUES
=============

"Plugin has no valid header" Error
----------------------------------
• Cause: Missing plugin header information
• Solution: Ensure all plugin files are in correct yatra folder structure


PERFORMANCE OPTIMIZATION
------------------------
• Enable WordPress object caching
• Configure CDN for static assets
• Optimize database queries with proper indexing


SUPPORT RESOURCES
-----------------
• Official Documentation: Check /docs/ folder
• WordPress Codex: https://codex.wordpress.org/
• Plugin Developer Handbook: https://developer.wordpress.org/plugins/

Next Steps: Configure Settings → Create Test Trip → Test Availability → Test Booking


CONFIGURATION
=============

Location: WordPress Admin → Yatra → Settings


GENERAL SETTINGS
----------------
• Site URL: Base URL for all plugin operations
• Currency: Default currency (USD, EUR, GBP, JPY)
• Date Format: Display format for dates
• Timezone: Site timezone for date calculations


PERMALINK STRUCTURE
-------------------
Critical Setting: Affects REST API routing and URL generation

• Pretty Permalinks: SEO-friendly URLs (recommended)
• Plain Permalinks: Compatibility with certain servers


PAYMENT SETTINGS
-----------------
• WooCommerce Integration: Toggle payment integration
• Custom Payment Gateways: Configure external payment processors
• Test Mode: Enable sandbox testing


API ENDPOINTS
=============

Base URL: /wp-json/yatra/v1/


TRIP ENDPOINTS
--------------
• GET /trips: Get all trips with filtering
• GET /trips/{id}: Get single trip details
• GET /trips/{id}/availability-template: Get availability as HTML
• GET /trips/{id}/available-months: Get available months
• GET /trips/{id}/availability-paginated: Get paginated availability with filtering


EXAMPLE RESPONSE
----------------
{
  "months": [
    {
      "key": "apr-2026",
      "label": "Apr 2026",
      "count": 15
    }
  ],
  "total_months": 13
}


FRONTEND COMPONENTENTS
======================

• PaginatedAvailability: Progressive loading with filtering
• BookingSidebar: Handle booking forms and traveler details
• TripPage: Main page initialization


SHORTCODES
==========

• [yatra_trip]: Display single trip page
• [yatra_trips]: Display trip listings
• [yatra_booking]: Display booking form


DATABASE SCHEMA
===============

• yatra_trips: Store trip information
• yatra_availability: Store availability dates and pricing
• yatra_bookings: Store booking information


TROUBLESHOOTING
===============

DEBUG MODE
----------
Enable in wp-config.php:

define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);


BEST PRACTICES
--------------
• Security: Always sanitize input and use nonces
• Performance: Implement caching and optimize queries
• UX: Provide clear feedback and progressive loading


================================
Complete documentation available in the /docs/ folder

Last updated: April 2026
