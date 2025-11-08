# Yatra Plugin Setup Guide

## Quick Start

### 1. Install PHP Dependencies

```bash
cd /path/to/yatra-plugin
composer install
```

### 2. Install Node Dependencies

```bash
npm install
```

### 3. Build React App

For development (with hot reload):
```bash
npm run dev
```

For production:
```bash
npm run build
```

### 4. Activate Plugin

1. Go to WordPress Admin → Plugins
2. Activate "Yatra - Travel Booking & Management"
3. The plugin will automatically create database tables on activation

### 5. Access Admin Interface

Navigate to **WordPress Admin → Yatra** to access the React admin interface.

## Development Workflow

### PHP Development

1. Make changes to PHP files in `app/`
2. Changes take effect immediately (no build step needed)
3. Follow PSR-4 autoloading conventions

### React Development

1. Start Vite dev server: `npm run dev`
2. Make changes to files in `resources/js/`
3. Changes hot-reload automatically
4. For production, run `npm run build`

## Project Structure

```
yatra/
├── app/                    # PHP Application
│   ├── Controllers/        # REST API Controllers
│   ├── Models/             # Data Models
│   ├── Repositories/       # Database Layer
│   ├── Services/           # Business Logic
│   ├── Providers/          # Service Providers
│   ├── Http/Requests/      # Validation
│   └── Core/               # Core Classes
├── resources/
│   └── js/                 # React Source
│       ├── pages/          # Page Components
│       ├── components/     # Reusable Components
│       └── lib/            # Utilities
├── routes/
│   └── api.php            # REST API Routes
├── templates/
│   └── admin.php          # Admin Wrapper
└── public/                # Compiled Assets
```

## Creating New Modules

### 1. Create Model

`app/Models/YourModel.php`:
```php
<?php
namespace Yatra\Models;

class YourModel { ... }
```

### 2. Create Repository

`app/Repositories/YourRepository.php`:
```php
<?php
namespace Yatra\Repositories;

class YourRepository extends BaseRepository
{
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'yatra_your_table';
    }
}
```

### 3. Create Service

`app/Services/YourService.php`:
```php
<?php
namespace Yatra\Services;

class YourService extends BaseService
{
    protected function getRepository() { ... }
}
```

### 4. Create Controller

`app/Controllers/YourController.php`:
```php
<?php
namespace Yatra\Controllers;

class YourController extends BaseController
{
    public function register_routes(): void { ... }
}
```

### 5. Register Routes

Add to `routes/api.php`:
```php
$your_controller = new YourController();
$your_controller->register_routes();
```

### 6. Create React Page

`resources/js/pages/YourPage.tsx`:
```tsx
import React from 'react';

const YourPage: React.FC = () => {
  return <div>Your Page</div>;
};

export default YourPage;
```

## Database Tables

Tables are created automatically on plugin activation. To manually create:

```php
use Yatra\Core\Database;
Database::createTables();
```

## REST API

All endpoints are under `/wp-json/yatra/v1/`:

- `GET /trips` - List trips
- `POST /trips` - Create trip
- `GET /trips/{id}` - Get trip
- `PUT /trips/{id}` - Update trip
- `DELETE /trips/{id}` - Delete trip

## Troubleshooting

### React app not loading

1. Ensure `npm run build` has been run
2. Check that `public/js/app.js` and `public/css/app.css` exist
3. Clear browser cache

### Database errors

1. Check table exists: `wp_yatra_trips`
2. Deactivate and reactivate plugin to recreate tables

### PHP errors

1. Check PHP version (8.0+ required)
2. Enable error logging in `wp-config.php`
3. Check file permissions

## Next Steps

- Add more modules (Bookings, Customers, etc.)
- Implement authentication/authorization
- Add frontend public pages
- Add payment gateway integration
- Add email notifications

