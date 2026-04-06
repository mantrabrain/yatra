# Yatra - Travel Booking & Management Plugin

A professional travel booking and management system for WordPress with modern React admin interface.

**Author:** [MantraBrain](https://wpyatra.com/) · **WordPress.org:** [Plugin page](https://wordpress.org/plugins/yatra/) · **Support (reviews):** [5-star reviews on WordPress.org](https://wordpress.org/support/plugin/yatra/reviews/?filter=5) · **Contact:** [MantraBrain](https://mantrabrain.com/contact) · **Rate the plugin:** [Add a review](https://wordpress.org/support/plugin/yatra/reviews/#new-post)

## 🚀 Quick Start

### Prerequisites

- WordPress 6.0+
- PHP 8.0+
- Node.js 18+
- npm or yarn

### Installation

1. Clone the plugin to your WordPress plugins directory:
```bash
cd /path/to/wordpress/wp-content/plugins/
git clone <repository-url> yatra
```

2. Install PHP dependencies:
```bash
cd yatra
composer install
```

3. Install JavaScript dependencies:
```bash
npm install
```

4. Activate the plugin in WordPress admin

---

## 🔧 Development Setup

### 1. WordPress Configuration

Add the following to your `wp-config.php` file:

#### **Development Mode Constants:**
```php
// Enable WordPress debugging
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

// ⚠️ IMPORTANT: Enable Yatra development mode for auto-reload
define('YATRA_DEV_MODE', true);

// Disable script concatenation for development (better debugging)
define('CONCATENATE_SCRIPTS', false);
define('COMPRESS_SCRIPTS', false);
```

#### **Production Mode Constants:**
```php
// Disable debugging in production
define('WP_DEBUG', false);

// ⚠️ IMPORTANT: Remove or set to false for production
// define('YATRA_DEV_MODE', false);

// Enable script optimization for performance
define('CONCATENATE_SCRIPTS', true);
define('COMPRESS_SCRIPTS', true);
```

#### **What Each Constant Does:**

| Constant | Development | Production | Purpose |
|----------|-------------|------------|---------|
| `YATRA_DEV_MODE` | `true` | `false` | Enables auto-reload & Vite dev server |
| `WP_DEBUG` | `true` | `false` | WordPress debugging & error reporting |
| `CONCATENATE_SCRIPTS` | `false` | `true` | Combines JavaScript files |
| `COMPRESS_SCRIPTS` | `false` | `true` | Minifies JavaScript files |

#### **⚠️ Important Security Notes:**
- **Never** enable `YATRA_DEV_MODE` on production servers
- **Never** enable `WP_DEBUG` on production servers
- The `YATRA_DEV_MODE` constant is required for auto-reload functionality

### 2. Start Development Server

```bash
npm run dev
```

The Vite dev server will start on `http://localhost:3000` with:
- ✅ Hot Module Replacement (HMR)
- ✅ Auto-reload on file changes
- ✅ Source maps for debugging
- ✅ React DevTools support

### 3. Access Admin Interface

Open your WordPress admin:
```
https://yatra.local/wp-admin/admin.php?page=yatra
```

**Features in Development Mode:**
- 🔄 **Auto-reload**: Changes to TypeScript/React files appear instantly
- 🛠️ **Live debugging**: Source maps and React DevTools
- 📱 **Responsive testing**: Mobile-friendly development
- 🔐 **API integration**: Full WordPress REST API access

---

## 🏗️ Build for Production

### 1. Production Build

```bash
npm run build
```

This command:
- Compiles TypeScript to JavaScript
- Optimizes and minifies all assets
- Generates source maps
- Creates block asset files
- Generates translation files

### 2. Production WordPress Configuration

For production, ensure your `wp-config.php` has the **Production Mode Constants** (see section above):

```php
// Disable debugging in production
define('WP_DEBUG', false);

// ⚠️ IMPORTANT: Remove or comment out development mode
// define('YATRA_DEV_MODE', false);

// Enable script optimization for performance
define('CONCATENATE_SCRIPTS', true);
define('COMPRESS_SCRIPTS', true);
```

**Key Changes for Production:**
- ❌ Remove `YATRA_DEV_MODE` constant (or set to `false`)
- ❌ Set `WP_DEBUG` to `false`
- ✅ Enable script concatenation and compression

---

## 📁 Project Structure

```
yatra/
├── app/                          # PHP application code
│   ├── Bootstrap.php            # Plugin bootstrap
│   ├── Controllers/            # MVC controllers
│   ├── Models/                 # Data models
│   ├── Providers/              # Service providers
│   └── Repositories/           # Data repositories
├── resources/js/               # React/TypeScript frontend
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   └── main.tsx               # Application entry point
├── templates/                  # PHP templates
├── assets/                     # Built assets (generated)
│   ├── admin/dist/            # Admin panel assets
│   └── dist/                  # Frontend assets
├── i18n/languages/             # Translation files
├── routes/                     # API routes
├── scripts/                    # Build scripts
└── vite.config.ts             # Vite configuration
```

---

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start development server with HMR
npm run type-check    # TypeScript type checking
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format code with Prettier
npm run format:check  # Check code formatting
```

### Production
```bash
npm run build         # Build for production
npm run clean         # Clean build artifacts
npm run preview       # Preview production build
```

### Translation
```bash
npm run makepot       # Generate translation files
npm run i18n          # Alias for makepot
```

---

## 🔌 Development Features

### Auto-Reload System

The plugin includes a sophisticated auto-reload system:

1. **Vite Dev Server**: Serves assets with HMR
2. **WordPress Integration**: Seamlessly loads dev assets in admin
3. **API Authentication**: Maintains WordPress nonce in dev mode
4. **Hot Module Replacement**: Instant updates without page refresh

### API Integration

Development mode includes full API access:
- ✅ WordPress REST API authentication
- ✅ User permissions and capabilities
- ✅ Media library integration
- ✅ Translation support

### Debugging Tools

- **React DevTools**: Available in development
- **Source Maps**: Full debugging capability
- **Console Logging**: Detailed error reporting
- **Network Inspector**: API call monitoring

---

## 🚀 Production Deployment

### 1. Build Assets

```bash
npm run build
```

### 2. Deploy Files

Upload the entire plugin directory to your production server.

### 3. Verify Configuration

Ensure production `wp-config.php` settings are applied.

### 4. Test Functionality

- ✅ Admin panel loads correctly
- ✅ All features work without errors
- ✅ API calls authenticated properly
- ✅ Assets optimized and minified

---

## 🐛 Troubleshooting

### Common Issues

#### Auto-Reload Not Working
```bash
# Check if Vite server is running
lsof -i :3000

# Restart development server
npm run dev
```

#### API 403 Errors
- Verify `YATRA_DEV_MODE` is defined in `wp-config.php`
- Check user has required WordPress capabilities
- Ensure nonce is being passed correctly

#### Build Errors
```bash
# Clean and rebuild
npm run clean
npm run build

# Check TypeScript errors
npm run type-check
```

#### Asset Loading Issues
- Verify build completed successfully
- Check file permissions in `assets/` directory
- Ensure WordPress can access built files

### Development Tips

1. **Always hard refresh** (Ctrl+Shift+R) after changing dev mode settings
2. **Check browser console** for HMR connection status
3. **Monitor network tab** for API call debugging
4. **Use React DevTools** for component inspection

---

## 📚 Development Guidelines

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Enforced code quality
- **Prettier**: Consistent code formatting
- **React Hooks**: Follow React best practices

### Git Workflow

1. Create feature branch from `main`
2. Develop with `npm run dev`
3. Test thoroughly
4. Run `npm run build` to verify production build
5. Submit pull request

### Performance Considerations

- **Development**: Unminified with source maps
- **Production**: Optimized and minified
- **Bundle Splitting**: Separate admin and frontend assets
- **Lazy Loading**: Components loaded on demand

---

## 🔐 Security Notes

### Development Mode
- Never enable `YATRA_DEV_MODE` in production
- Development server (`localhost:3000`) should not be publicly accessible
- Debug information is exposed in development

### Production Mode
- All assets are minified and optimized
- Debug information is disabled
- WordPress security best practices apply

---

## 📞 Support

For development issues:
1. Check this README first
2. Review browser console for errors
3. Verify WordPress configuration
4. Check network connectivity for API calls

---

## 📄 License

GPL v2 or later

---

**Happy Development! 🚀**
