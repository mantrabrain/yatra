# Trip Form Components

This directory contains all components for the Trip Form page, broken down by section for better maintainability.

## Folder Structure

```
trip-form/
├── sections/           # Individual section components
│   ├── OverviewSection.tsx
│   ├── LocationSection.tsx
│   ├── DurationSection.tsx
│   ├── ActivitySection.tsx
│   ├── AccommodationSection.tsx
│   ├── TransportationSection.tsx
│   ├── PricingSection.tsx
│   ├── ItinerarySection.tsx
│   ├── IncludedSection.tsx
│   ├── BookingSection.tsx
│   ├── GallerySection.tsx
│   ├── FAQsSection.tsx
│   ├── FrontendTabsSection.tsx
│   ├── SEOSection.tsx
│   └── AdvancedSection.tsx
├── shared/            # Shared components and utilities
│   ├── SectionHeader.tsx
│   ├── SectionTabs.tsx
│   └── Modals.tsx
├── hooks/             # Custom hooks for form logic
│   ├── useTripForm.ts
│   └── useAutoSave.ts
├── types.ts           # TypeScript interfaces and types
└── index.ts           # Main export file
```

## Section Components

Each section component follows this structure:

```typescript
interface SectionProps {
  formData: TripFormData;
  errors: Record<string, string>;
  handleFieldChange: (field: keyof TripFormData, value: any) => void;
  // Additional section-specific props
}

export const SectionName: React.FC<SectionProps> = ({ 
  formData, 
  errors, 
  handleFieldChange,
  ...props 
}) => {
  // Section implementation
};
```

## Usage

Import sections in TripForm.tsx:

```typescript
import { 
  OverviewSection,
  LocationSection,
  // ... other sections
} from '../components/trip-form';
```

