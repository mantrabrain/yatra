# Yatra - WordPress Travel Booking Plugin

A comprehensive WordPress plugin for travel websites that enables trip and travel booking functionality. Built with modern PHP practices and a scalable architecture.

## Features

### Core Features (Phase 1)
- **Trip Management**: Create and manage trips with detailed information
- **Destination Management**: Organize trips by destinations with rich metadata
- **Booking System**: Real-time availability checking and booking management
- **Payment Integration**: Support for multiple payment gateways
- **Admin Dashboard**: Comprehensive admin interface with statistics and reports
- **Custom Post Types**: WordPress-native trip and destination post types
- **Shortcodes**: Easy integration with any theme using shortcodes

## Requirements

- **PHP**: 8.0 or higher
- **WordPress**: 6.0 or higher
- **MySQL**: 5.7 or higher
- **Required Extensions**: curl, json, mbstring

## Installation

1. Upload the `yatra` folder to `/wp-content/plugins/`
2. Activate the plugin through the WordPress admin panel
3. The plugin will automatically create necessary database tables

## Quick Start

### 1. Create Your First Trip
1. Go to **Yatra > Trips** in the admin panel
2. Click **Add New Trip**
3. Fill in trip details and publish

### 2. Display Trips on Your Website
Use shortcodes to display trips on any page:

```php
// Display all trips
[yatra_trips]

// Display a specific trip
[yatra_trip id="123"]

// Display search form
[yatra_search_form]
```

### 3. Configure Settings
Go to **Yatra > Settings** to configure currency, payment gateways, and other options.

## Shortcodes Reference

### `[yatra_trips]`
Display a list of trips with optional filters.

**Parameters:**
- `limit` (int): Number of trips to display (default: 12)
- `destination` (string): Filter by destination slug
- `type` (string): Filter by trip type

### `[yatra_trip]`
Display a single trip.

**Parameters:**
- `id` (int): Trip ID (required)

### `[yatra_search_form]`
Display the trip search form.

### `[yatra_booking_form]`
Display the booking form for a specific trip.

**Parameters:**
- `trip_id` (int): Trip ID (required)

## Support

For support and documentation:
- **Documentation**: [https://yatra.com/docs](https://yatra.com/docs)
- **Support Forum**: [https://yatra.com/support](https://yatra.com/support)
- **Email**: support@yatra.com

## License

This plugin is licensed under the GPL v2 or later.

## Credits

Developed by the Yatra Development Team. 