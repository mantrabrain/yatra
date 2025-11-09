# Trip Form Component Structure

## 📁 Complete Folder Structure

```
trip-form/
│
├── 📄 README.md                    # Documentation
├── 📄 STRUCTURE.md                 # This file - structure overview
├── 📄 types.ts                     # TypeScript interfaces and types
├── 📄 index.ts                     # Main export file
│
├── 📁 sections/                    # Individual section components
│   ├── OverviewSection.tsx         # Basic info, highlights, rich content, classification
│   ├── LocationSection.tsx         # Location & geography
│   ├── DurationSection.tsx         # Duration & schedule
│   ├── ActivitySection.tsx          # Activity types & category
│   ├── AccommodationSection.tsx    # Accommodation details
│   ├── TransportationSection.tsx   # Transportation details
│   ├── PricingSection.tsx          # Pricing & payment
│   ├── ItinerarySection.tsx        # Itinerary builder
│   ├── IncludedSection.tsx          # What's included/excluded
│   ├── BookingSection.tsx          # Booking requirements & settings
│   ├── GallerySection.tsx          # Photo gallery
│   ├── FAQsSection.tsx             # FAQs
│   ├── FrontendTabsSection.tsx     # Frontend tabs management
│   ├── SEOSection.tsx              # SEO settings
│   └── AdvancedSection.tsx          # Status & lifecycle management
│
├── 📁 shared/                       # Shared components and utilities
│   ├── SectionHeader.tsx           # Reusable section header
│   ├── SectionTabs.tsx             # Reusable tab navigation
│   └── index.ts                    # Shared components export
│
└── 📁 hooks/                        # Custom hooks for form logic
    ├── useTripForm.ts              # Form state management hook
    ├── useAutoSave.ts              # Auto-save functionality hook
    └── index.ts                     # Hooks export
```

## 📋 Component Breakdown

### Section Components (15 files)
Each section corresponds to a menu item in the trip creation sidebar:

1. **OverviewSection** - Most complex, has 5 tabs (basic, highlights, details, rich-content, classification)
2. **LocationSection** - Destination, coordinates, landmarks
3. **DurationSection** - Trip type, days, availability
4. **ActivitySection** - Activity types, difficulty, categories
5. **AccommodationSection** - Accommodation type and details
6. **TransportationSection** - Transportation details
7. **PricingSection** - Pricing options and payment terms
8. **ItinerarySection** - Day-by-day itinerary builder (complex)
9. **IncludedSection** - Included/excluded items
10. **BookingSection** - Booking requirements
11. **GallerySection** - Photo gallery management
12. **FAQsSection** - Frequently asked questions
13. **FrontendTabsSection** - Frontend display tabs
14. **SEOSection** - SEO optimization
15. **AdvancedSection** - Status and lifecycle management

### Shared Components
- **SectionHeader** - Consistent header for all sections
- **SectionTabs** - Reusable tab navigation component

### Hooks
- **useTripForm** - Centralized form state management
- **useAutoSave** - Auto-save functionality with debouncing

## 🔄 Next Steps

1. **Extract Content**: Move code from `TripForm.tsx` to each section component
2. **Update TripForm.tsx**: Replace switch statement with component imports
3. **Test Each Section**: Verify each section works independently
4. **Refactor Shared Logic**: Move common handlers to hooks

## 📝 Line References (from TripForm.tsx)

- Overview: ~1310-1875
- Location: ~1876-2023
- Duration: ~2024-2271
- Activity: ~2272-2442
- Accommodation: ~2443-2526
- Transportation: ~2527-2622
- Pricing: ~2623-3153
- Booking: ~3154-3315
- Itinerary: ~3316-3582
- Included: ~3583-3697
- Gallery: ~3698-3734
- FAQs: ~3735-3799
- Frontend Tabs: ~3800-3970
- SEO: ~3971-4018
- Advanced: ~4019-4171

## ✅ Benefits of This Structure

1. **Maintainability**: Each section is in its own file
2. **Readability**: Easy to find and edit specific sections
3. **Reusability**: Shared components can be reused
4. **Testability**: Each section can be tested independently
5. **Scalability**: Easy to add new sections or modify existing ones
6. **Organization**: Clear separation of concerns

