# Fallback Settings Implementation

**Date**: March 21, 2026  
**Feature**: Trip Fallback Settings for Flexible Booking (Trip-Only Pricing)

---

## 🎯 Overview

Implemented comprehensive fallback settings UI and backend support for trips without availability dates or recurring rules. These settings provide default values for flexible booking scenarios.

---

## 📋 What Was Implemented

### 1. **Backend Database Fields**

Added to `yatra_trips` table:
- `has_default_time_slots` (BOOLEAN) - Enable multiple time slots for day tours
- `default_time_slots` (TEXT) - JSON configuration for time slots
- `departure_time` (TIME) - Default departure time

### 2. **Frontend UI (TripForm.tsx)**

Created a comprehensive "Fallback Settings" section with:

#### **Visual Structure:**
- Section header with help icon tooltip
- Amber info banner explaining when settings are used
- Grouped settings by trip type (Day Tour vs Multi-Day)
- Nested cards with proper visual hierarchy

#### **Day Tour Settings:**
- **Toggle**: Enable Multiple Time Slots
- **When Enabled**: JSON textarea for time slot configuration
  - Example format provided
  - Validation hints
  - Blue highlighted configuration area
- **When Disabled**: Single departure time picker

#### **Multi-Day Trip Settings:**
- Default departure time picker
- Explanation of usage for capacity tracking

#### **No Trip Type Selected:**
- Helpful message prompting user to select trip type

### 3. **Data Flow**

```
Trip Form (UI)
    ↓
TripForm.tsx (formData)
    ↓
handleSubmit (data preparation)
    ↓
API: POST /wp-json/yatra/v1/trips
    ↓
TripController.php (validation)
    ↓
TripRepository.php (database save)
    ↓
yatra_trips table
```

---

## 🎨 UI Features

### **Color Coding:**
- **Amber Banner**: Important context about when settings apply
- **Gray Cards**: Main trip type containers
- **White Cards**: Individual setting containers
- **Blue Highlight**: JSON configuration area

### **Icons Used:**
- `Clock` - Day tour time settings
- `Calendar` - Multi-day trip settings
- `AlertCircle` - Info banner
- `HelpCircle` - Section help tooltip

### **Dark Mode:**
- Full dark mode support throughout
- Proper contrast ratios
- Themed borders and backgrounds

---

## 📝 JSON Time Slots Format

### **Structure:**
```json
{
  "slots": [
    {"time": "09:00", "label": "Morning Tour"},
    {"time": "14:00", "label": "Afternoon Tour"},
    {"time": "17:00", "label": "Evening Tour"}
  ]
}
```

### **Fields:**
- `time` (required): HH:MM format (24-hour)
- `label` (required): Display name for the time slot

---

## 🔄 When Fallback Settings Are Used

### **Priority System:**
1. **Recurring Rules** (highest priority)
2. **Availability Dates** (medium priority)
3. **Trip Default / Fallback Settings** (ONLY if zero dates AND zero rules)

### **Important:**
- Fallback settings apply **ONLY** when trip has:
  - ✅ ZERO availability dates
  - ✅ ZERO recurring rules
- If trip has at least one date or rule, fallback settings are **NOT** used
- Even if dates/rules expire, system does not fall back (as per user requirement)

---

## 🎯 Use Cases

### **Day Tour with Fallback Settings:**
1. Admin creates day tour
2. Does NOT add availability dates or recurring rules
3. Enables "Multiple Time Slots" in Fallback Settings
4. Configures 3 time slots: Morning (09:00), Afternoon (14:00), Evening (17:00)
5. Customer can book any date within trip's available period
6. Customer selects preferred time slot at booking

### **Multi-Day Trip with Fallback Settings:**
1. Admin creates multi-day trip
2. Does NOT add availability dates or recurring rules
3. Sets default departure time to 10:00 AM
4. Customer can book any date within trip's available period
5. All departures use 10:00 AM as departure time

---

## 🔧 Backend Processing

### **DepartureService.php:**
- Uses `departure_time` from trip settings when creating departures
- For day tours with `has_default_time_slots`, parses JSON and creates separate departures for each time slot
- Falls back to trip's `departure_time` if no time provided

### **AvailabilityResolutionService.php:**
- Checks recurring rules first
- Then checks availability dates
- Finally falls back to trip default settings
- Returns availability object with trip-level pricing and capacity

### **Frontend Booking Form:**
- Will need to display time slot selection for day tours with fallback time slots
- (Implementation pending - requires frontend booking form update)

---

## 📊 Database Schema

```sql
ALTER TABLE yatra_trips ADD COLUMN has_default_time_slots TINYINT(1) DEFAULT 0;
ALTER TABLE yatra_trips ADD COLUMN default_time_slots TEXT NULL;
ALTER TABLE yatra_trips ADD COLUMN departure_time TIME DEFAULT '09:00:00';
```

---

## ✅ Completed

- ✅ Database migration for new fields
- ✅ Backend API support (TripController, TripRepository)
- ✅ Frontend UI in TripForm.tsx
- ✅ Data submission and validation
- ✅ Visual design with proper grouping
- ✅ Dark mode support
- ✅ Help text and examples
- ✅ TypeScript build (with Clock icon fix)
- ✅ Documentation

---

## 🔜 Pending

- ⏳ Frontend booking form UI for time slot selection (trip-only day tours)
- ⏳ Backend processing of selected time slots in booking flow
- ⏳ Testing with actual bookings

---

## 🐛 Related Fixes

### **Mailchimp Module Warning Fix:**
- Fixed null array offset warning in `MailchimpModule.php` line 218
- Added null checks before accessing `$connectionStatus['connected']`
- Prevents PHP warnings when Mailchimp API key is not configured

---

## 📚 Related Documentation

- `AVAILABILITY-FALLBACK-SYSTEM.md` - Availability priority system
- `TRIP-ONLY-PRICING-ANALYSIS.md` - Complete trip-only pricing analysis
- `FIXES-SUMMARY.md` - Overall fixes summary
- `yatra-pro/app/Modules/DynamicPricing/README.md` - Dynamic pricing with fallbacks

---

## 🎓 Key Learnings

1. **Proper UI Grouping**: Single section with clear visual hierarchy improves UX
2. **Contextual Help**: Info banners explaining when features apply reduces confusion
3. **Progressive Disclosure**: Show/hide based on selections keeps UI clean
4. **Type Safety**: Always check for null/undefined before array access
5. **Consistent Patterns**: Follow existing Yatra UI patterns for familiarity

---

**Status**: ✅ Implementation Complete (UI + Backend)  
**Next Step**: Frontend booking form integration for time slot selection
