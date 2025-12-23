# Yatra - Travel Booking & Management WordPress Plugin

A modern WordPress plugin built with Laravel-style architecture and React + TypeScript admin interface.

## 🏗️ Architecture

This repo is for testing Cascade's ability to read and understand very large files.

- **Controllers**: Handle REST API requests
- **Repositories**: Abstract database operations
- **Services**: Business logic layer
- **Models**: Data entities
- **Providers**: Service registration and bootstrapping

## 📁 Folder Structure

```
yatra/
├── app/
│   ├── Controllers/          # REST API controllers
│   ├── Models/               # Data models
│   ├── Repositories/         # Database abstraction
│   ├── Services/             # Business logic
│   ├── Providers/            # Service providers
│   └── Core/                 # Core classes (Container, etc.)
├── resources/
│   └── js/                   # React + TypeScript source
│       ├── pages/            # Admin pages
│       ├── components/       # React components
│       └── lib/             # Utilities
├── routes/
│   └── api.php              # REST API route definitions
├── templates/
│   └── admin.php            # Admin page wrapper
└── public/                  # Compiled assets (generated)
```

## 🚀 Setup

### 1. Install PHP Dependencies

```bash
composer install
```

### 2. Install Node Dependencies

```bash
npm install
```

### 3. Development

Start the Vite dev server:

```bash
npm run dev
```

The React app will be available at `http://localhost:3000` and will hot-reload on changes.

### 4. Production Build

Build the React app for production:

```bash
npm run build
```

This compiles TypeScript and bundles assets to the `public/` directory.

## 📝 Usage

### Accessing the Admin Interface

1. Navigate to **WordPress Admin → Yatra**
2. The React admin interface will load

### REST API Endpoints

All endpoints are under `/wp-json/yatra/v1/`:

- `GET /trips` - List all trips
- `GET /trips/{id}` - Get single trip
- `POST /trips` - Create trip
- `PUT /trips/{id}` - Update trip
- `DELETE /trips/{id}` - Delete trip

### Creating New Modules

1. Create Model in `app/Models/`
2. Create Repository in `app/Repositories/`
3. Create Service in `app/Services/`
4. Create Controller in `app/Controllers/`
5. Register routes in `routes/api.php`
6. Create React page in `resources/js/pages/`

## 🛠️ Development

### PHP Coding Standards

- Follow WordPress PHP Coding Standards
- Use PSR-4 autoloading
- Type hints for all methods
- Strict types enabled

### React/TypeScript Standards

- Use TypeScript for all components
- Follow React best practices
- Use ShadCN UI components
- Tailwind CSS for styling

## 📦 Dependencies

### PHP
- PHP 8.0+
- WordPress 6.0+
- Composer for autoloading

### JavaScript
- React 18
- TypeScript
- Vite
- React Router
- React Query
- Tailwind CSS
- ShadCN UI components

## 🔧 Configuration

Plugin constants are defined in `yatra.php`:
- `YATRA_PLUGIN_PATH` - Plugin directory path
- `YATRA_PLUGIN_URL` - Plugin URL
- `YATRA_VERSION` - Plugin version

## 📚 Documentation

- [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [ShadCN UI](https://ui.shadcn.com/)

## 📄 License

GPL v2 or later

