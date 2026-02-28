/**
 * Trip Form Components - Main Export
 *
 * This file exports all trip form section components and utilities
 * for easy importing in TripForm.tsx
 */

// Types
export * from "./types";

// Section Components
export { OverviewSection } from "./sections/OverviewSection";
export { LocationSection } from "./sections/LocationSection";
export { DurationSection } from "./sections/DurationSection";
export { ActivitySection } from "./sections/ActivitySection";
export { AccommodationSection } from "./sections/AccommodationSection";
export { TransportationSection } from "./sections/TransportationSection";
export { PricingSection } from "./sections/PricingSection";
export { ItinerarySection } from "./sections/ItinerarySection";
export { IncludedSection } from "./sections/IncludedSection";
export { BookingSection } from "./sections/BookingSection";
export { GallerySection } from "./sections/GallerySection";
export { FAQsSection } from "./sections/FAQsSection";
export { FrontendTabsSection } from "./sections/FrontendTabsSection";
export { SEOSection } from "./sections/SEOSection";
export { AdvancedSection } from "./sections/AdvancedSection";

// Shared Components
export { SectionHeader } from "./shared/SectionHeader";
export { SectionTabs } from "./shared/SectionTabs";

// Hooks
export { useTripForm } from "./hooks/useTripForm";
export { useAutoSave } from "./hooks/useAutoSave";
