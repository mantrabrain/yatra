# Trip Form & Database Schema Audit Report

## Executive Summary

This audit identifies critical issues with field persistence, data duplication, and unused database columns in the Yatra trip management system.

## Issues Identified

### 1. **CRITICAL: Duplicate Data Storage**

Array-based data is currently stored in **multiple locations**, causing:
- Data inconsistency risks
- Increased storage overhead
- Maintenance complexity
- Potential sync issues

**Affected Data:**
- `highlights` → trips.highlights (JSON) + trip_content table (content_type='highlight')
- `gallery_images` → trips.gallery_images (JSON) + trip_content table (content_type='image')
- `faqs` → trips.faqs (JSON) + trip_content table (content_type='faq')
- `itinerary_days` → trips.itinerary_days (JSON) + trip_itinerary_days + trip_itinerary_day_entry tables
- `availability_dates` → trips.availability_dates (JSON) + trip_availability_dates table
- `price_types` → trips.price_types (JSON) + (previously) trip_pricing table

**Recommendation:** Use separate tables as single source of truth. Remove JSON columns from trips table.

### 2. **Unused Columns in trips Table (60+ fields)**

The following columns exist in the trips table but are **NOT** submitted by TripForm.tsx:

#### Identification & Basic Info
- `trip_code` - Internal trip code (not in form)
- `excerpt` - Meta description excerpt (not in form)

#### Location & Geography
- `map_zoom_level` - Default map zoom (not in form)
- `timezone` - Destination timezone (not in form)
- `country_code` - ISO 3166-1 alpha-2 (not in form)

#### Duration & Schedule
- `duration_hours` - For single-day trips (not in form)
- `booking_deadline_hours` - Hours before trip start (form sends `booking_deadline` but not mapped)
- `flexible_dates` - Can book any date in range (not in form)
- `fixed_departures_only` - Only specific departure dates (not in form)
- `blackout_dates` - JSON array of unavailable dates (not in form)

#### Categorization (Legacy Fields)
- `trip_category` - varchar(100) (form uses array → classifications table)
- `trip_category_parent` - varchar(100) (legacy)
- `trip_category_sub` - varchar(100) (legacy)
- `activity_intensity` - varchar(50) (not in form)
- `trip_style` - varchar(50) (not in form)
- `group_type` - varchar(50) (not in form)

#### Pricing (Advanced Features Not in Form)
- `currency` - char(3) (should use global setting)
- `price_per_person` - tinyint(1) (not in form)
- `deposit_required` - tinyint(1) (not in form)
- `payment_plans_enabled` - tinyint(1) (not in form)
- `tax_included` - tinyint(1) (not in form)
- `tax_rate` - decimal(5,2) (not in form)
- `service_charge` - decimal(10,2) (not in form)
- `service_charge_percentage` - decimal(5,2) (not in form)

#### Group Pricing (Not in Form)
- `group_pricing_enabled` - tinyint(1)
- `group_size_min` - smallint unsigned
- `group_size_max` - smallint unsigned
- `group_discount_type` - varchar(50)
- `group_discount_percentage` - decimal(5,2)
- `group_discount_amount` - decimal(10,2)

#### Early Bird / Last Minute (Not in Form)
- `early_bird_discount_enabled` - tinyint(1)
- `early_bird_days` - smallint unsigned
- `early_bird_discount` - decimal(5,2)
- `last_minute_discount_enabled` - tinyint(1)
- `last_minute_days` - smallint unsigned
- `last_minute_discount` - decimal(5,2)

#### Booking Settings (Not in Form)
- `max_travelers_per_booking` - smallint unsigned
- `waitlist_enabled` - tinyint(1)
- `waitlist_capacity` - smallint unsigned
- `instant_booking` - tinyint(1)
- `requires_approval` - tinyint(1)
- `booking_confirmation_email` - tinyint(1)
- `booking_reminder_email` - tinyint(1)
- `reminder_days_before` - smallint unsigned

#### Requirements (Not in Form)
- `medical_requirements` - text
- `passport_validity_months` - tinyint unsigned
- `travel_insurance_required` - tinyint(1)
- `special_equipment` - text

#### Policies (Not in Form)
- `refund_policy` - text
- `change_policy` - text
- `weather_policy` - text
- `force_majeure_policy` - text
- `terms_conditions` - longtext

#### Accommodation (Not in Form)
- `accommodation_standard` - varchar(50)
- `accommodation_included` - tinyint(1)

#### Transportation (Not in Form)
- `pickup_location_lat` - decimal(10,8)
- `pickup_location_lng` - decimal(11,8)
- `dropoff_location_lat` - decimal(10,8)
- `dropoff_location_lng` - decimal(11,8)
- `internal_transportation` - text
- `international_flights_included` - tinyint(1)
- `domestic_flights_included` - tinyint(1)

#### Media & Marketing (Not in Form)
- `featured_image_url` - varchar(500)
- `promo_video_url` - varchar(500)
- `social_share_image_id` - bigint unsigned

#### SEO (Not in Form)
- `og_title` - varchar(255)
- `og_description` - text
- `og_image_id` - bigint unsigned
- `schema_markup` - text (JSON-LD structured data)

#### Status & Lifecycle (Not in Form)
- `published_at` - datetime
- `featured_order` - int
- `sort_order` - int

#### Analytics (System-Managed, Not in Form)
- `views_count` - int unsigned
- `bookings_count` - int unsigned
- `revenue_total` - decimal(12,2)
- `conversion_rate` - decimal(5,2)
- `avg_rating` - decimal(3,2)
- `reviews_count` - int unsigned
- `last_viewed_at` - datetime
- `last_booked_at` - datetime

#### Complex Data (JSON Columns - Should Be Removed)
- `highlights` - text (use trip_content table)
- `testimonials` - text (use trip_content table)
- `countries` - text (use classifications table)
- `regions` - text (use classifications table)
- `landmarks` - text (use classifications table)
- `tags` - text (use classifications table)
- `included_items` - text (store in trips table as JSON or trip_content)
- `excluded_items` - text (store in trips table as JSON or trip_content)
- `gallery_images` - text (use trip_content table)
- `price_types` - text (store in trips table as JSON for reference)
- `itinerary_days` - text (use trip_itinerary_days table)
- `faqs` - text (use trip_content table)
- `frontend_tabs` - text (store in trips table as JSON)
- `availability_dates` - text (use trip_availability_dates table)
- `custom_fields` - text (keep for extensibility)
- `pricing_rules` - text (not in form, can remove)
- `booking_rules` - text (not in form, can remove)

### 3. **Fields Submitted by Form But Not Properly Saved**

- **`booking_deadline`**: Form sends this field, TripController maps it to `booking_deadline_hours`, but the trips table doesn't have proper handling for this field.

## Fields Actually Used by TripForm.tsx

### Direct Fields (Saved to trips table):
1. `title` ✅
2. `slug` ✅
3. `description` ✅
4. `short_description` ✅
5. `trip_details` ✅
6. `what_makes_special` ✅
7. `trip_story` ✅
8. `video_url` ✅
9. `virtual_tour_url` ✅
10. `starting_location` ✅
11. `ending_location` ✅
12. `latitude` ✅
13. `longitude` ✅
14. `trip_type` ✅
15. `duration_days` ✅
16. `duration_nights` ✅
17. `available_from` ✅
18. `available_to` ✅
19. `booking_window_days` ✅
20. `seasonal_availability` ✅
21. `best_season` ✅
22. `peak_season` ✅
23. `off_season` ✅
24. `difficulty_level` ✅
25. `featured_priority` ✅
26. `accommodation_type` ✅
27. `meal_plan` ✅
28. `accommodation_details` ✅
29. `transportation_included` ✅
30. `pickup_location` ✅
31. `dropoff_location` ✅
32. `transportation_details` ✅
33. `pricing_type` ✅
34. `original_price` ✅
35. `discounted_price` ✅
36. `deposit_amount` ✅
37. `deposit_percentage` ✅
38. `payment_terms` ✅
39. `max_travelers` ✅
40. `min_travelers` ✅
41. `booking_deadline` ⚠️ (needs mapping fix)
42. `cancellation_policy` ✅
43. `age_min` ✅
44. `age_max` ✅
45. `physical_requirements` ✅
46. `visa_requirements` ✅
47. `vaccination_requirements` ✅
48. `status` ✅
49. `scheduled_publish_date` ✅
50. `scheduled_unpublish_date` ✅
51. `version` ✅
52. `seasonal_auto_enable` ✅
53. `seasonal_enable_date` ✅
54. `seasonal_disable_date` ✅
55. `meta_title` ✅
56. `meta_description` ✅
57. `meta_keywords` ✅
58. `featured_image` ✅ (as featured_image_id)

### Relationship Fields (Saved to separate tables):
1. `destinations` → trip_classifications table
2. `activity_types` → trip_classifications table
3. `trip_category` → trip_classifications table
4. `tags` → trip_classifications table
5. `countries` → trip_classifications table
6. `regions` → trip_classifications table
7. `landmarks` → trip_classifications table
8. `testimonials` → trip_content table or trips.testimonials JSON
9. `highlights` → trip_content table
10. `included_items` → trips.included_items JSON or trip_content
11. `excluded_items` → trips.excluded_items JSON or trip_content
12. `itinerary_days` → trip_itinerary_days + trip_itinerary_day_entry tables
13. `gallery_images` → trip_content table
14. `faqs` → trip_content table
15. `frontend_tabs` → trips.frontend_tabs JSON
16. `availability_dates` → trip_availability_dates table
17. `price_types` → trips.price_types JSON (after removal of trip_pricing table)
18. `attributes` → trip_attribute_values table
19. `downloadable_items` → trip_content table (content_type='download')

## Recommendations

### Immediate Actions Required:

1. **Remove Duplicate JSON Columns from trips Table**
   - Remove: highlights, gallery_images, faqs, itinerary_days, availability_dates
   - Keep: price_types (for reference), included_items, excluded_items, frontend_tabs, custom_fields
   - Remove: testimonials, countries, regions, landmarks, tags (use classifications table)
   - Remove: pricing_rules, booking_rules (not used)

2. **Remove Unused Columns from trips Table**
   - Remove all 60+ unused columns listed above
   - Keep only fields actually submitted by the form
   - Keep system-managed analytics fields
   - Keep audit fields (created_at, updated_at, created_by, updated_by, deleted_at, deleted_by)

3. **Fix Field Mapping Issues**
   - Properly map `booking_deadline` to `booking_deadline_hours` in TripController
   - Ensure TripRepository saves all form fields correctly

4. **Establish Single Source of Truth**
   - Highlights → trip_content table ONLY
   - Gallery → trip_content table ONLY
   - FAQs → trip_content table ONLY
   - Itinerary → trip_itinerary_days/entry tables ONLY
   - Availability → trip_availability_dates table ONLY
   - Price Types → trips.price_types JSON (after trip_pricing table removal)
   - Included/Excluded Items → trips table JSON (simple data)
   - Frontend Tabs → trips table JSON (UI configuration)

5. **Update TripRepository Methods**
   - Ensure `create()` and `update()` methods save all form fields
   - Remove logic for saving to JSON columns that should use separate tables
   - Ensure `savePriceTypes()` properly updates trips.price_types JSON

### Future Enhancements (Optional):

If you want to add these features later, you can add them back:
- Group pricing fields
- Early bird / last minute discount fields
- Waitlist management fields
- Advanced policy fields (refund, change, weather, force majeure)
- Advanced accommodation/transportation fields
- Advanced SEO fields (OG tags, schema markup)

## Current Status

- ✅ TripPricingTable removed
- ✅ TripPriceTypeRepository removed
- ✅ TripRepository.savePriceTypes() updated to save to trips.price_types JSON
- ⚠️ Trips table still has 60+ unused columns
- ⚠️ Duplicate storage still exists for array data
- ⚠️ booking_deadline field mapping needs fix

## Next Steps

1. Create optimized trips table schema with only used fields
2. Run database migration to remove unused columns
3. Update TripRepository to ensure all form fields persist correctly
4. Test trip create/edit functionality thoroughly
5. Update documentation

---

**Generated:** 2024-12-30
**Author:** Cascade AI Senior Software Engineer Analysis
