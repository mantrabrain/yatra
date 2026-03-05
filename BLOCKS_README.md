# Yatra Gutenberg Blocks - React Build Setup

## Overview
The Yatra blocks are now built using React with TypeScript and Vite, following modern WordPress block development practices.

## Structure
```
resources/js/blocks/
├── tour/
│   ├── index.tsx       # Block registration
│   ├── edit.tsx        # Block editor component with InspectorControls
│   └── block.json      # Block metadata
├── activity/
│   └── (same structure)
└── destination/
    └── (same structure)
```

## Build Process

### 1. Install Dependencies
```bash
cd /Users/umesh/Local Sites/yatra/app/public/wp-content/plugins/yatra
npm install
```

This will install:
- @wordpress/blocks
- @wordpress/block-editor
- @wordpress/components
- @wordpress/element
- @wordpress/i18n
- TypeScript types for all WordPress packages

### 2. Build the Blocks
```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Bundle React components
- Generate files in `assets/dist/blocks/` directory:
  - `assets/dist/blocks/tour.js`
  - `assets/dist/blocks/tour.asset.php` (with dependencies)
  - `assets/dist/blocks/activity.js`
  - `assets/dist/blocks/activity.asset.php`
  - `assets/dist/blocks/destination.js`
  - `assets/dist/blocks/destination.asset.php`

### 3. Development Mode
```bash
npm run dev
```

This will watch for changes and rebuild automatically.

## How It Works

### PHP Side (Server-Side Rendering)
- `app/Blocks/TourBlock.php` - Registers the block and loads the built JS
- `app/Blocks/ActivityBlock.php` - Same for activity
- `app/Blocks/DestinationBlock.php` - Same for destination
- `app/Services/BlockDataService.php` - Handles rendering with real data

### React Side (Editor UI)
- `resources/js/blocks/tour/edit.tsx` - Provides the block editor interface with:
  - InspectorControls (settings panel in sidebar)
  - Block preview in editor
  - All block attributes (title, order, columns, etc.)

### Build Configuration
- `vite.config.ts` - Configured to build blocks to `assets/dist/blocks/` directory
- Blocks are externalized (WordPress packages loaded from WordPress core)
- Asset files track dependencies automatically

## Features

### Block Settings (InspectorControls)
Each block has a settings panel with:
- **Title** - Text input for block title
- **Order** - Select dropdown (Ascending/Descending)
- **Number of Tours/Activities/Destinations** - Range slider (1-50)
- **Columns** - Range slider (1-6)
- **Show only featured** - Toggle switch
- **Show pagination** - Toggle switch
- **Show filters** - Toggle switch

### Block Preview
Shows a styled placeholder in the editor with:
- Block title
- Description of what will be displayed
- Current settings summary

### Frontend Rendering
- Uses existing PHP render callbacks
- Leverages BlockDataService for data
- Maintains backward compatibility with shortcodes

## Next Steps

1. **Run npm install** to get WordPress dependencies
2. **Run npm run build** to compile the blocks
3. **Refresh WordPress admin** to see the new blocks
4. **Add blocks to a page** - they'll appear in the "Yatra" category
5. **Configure settings** in the sidebar panel
6. **View frontend** to see real data rendered

## Troubleshooting

### TypeScript Errors
The TypeScript errors about missing modules will resolve after running `npm install`.

### Build Errors
If build fails, check:
- Node version (should be 16+)
- npm version (should be 8+)
- All dependencies installed

### Blocks Not Showing
If blocks don't appear:
- Check `assets/dist/blocks/` directory exists
- Verify `.js` and `.asset.php` files are present
- Check browser console for errors
- Clear WordPress cache

## File Locations

- **Source**: `resources/js/blocks/`
- **Built**: `assets/dist/blocks/`
- **PHP**: `app/Blocks/`
- **Config**: `vite.config.ts`
