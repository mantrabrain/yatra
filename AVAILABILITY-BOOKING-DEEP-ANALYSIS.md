# Availability & Booking Section - Deep Implementation Analysis

**Analysis Date:** March 26, 2026  
**Analyst:** Senior Software Engineer Level Review  
**Scope:** Complete audit of Availability & Booking section in Trip Form

---

## 📋 Executive Summary

This document provides a comprehensive deep-dive analysis of the Availability & Booking section implementation in the Yatra trip form, examining all fields, data flow, backend integration, and identifying critical gaps.

### ✅ **Overall Assessment: MOSTLY COMPLETE with CRITICAL GAPS**

**Status Breakdown:**
- ✅ **Frontend Form**: 100% Complete
- ✅ **Database Schema**: 100% Complete  
- ✅ **Controller Layer**: 100% Complete
- ✅ **Validator Layer**: 100% Complete
- ❌ **Model Layer**: **INCOMPLETE** - Missing 3 critical properties
- ⚠️ **Service Integration**: Partial - Not using fallback settings

---

## 🏗️ Architecture Overview

### **Data Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│ 1. FRONTEND (TripForm.tsx)                                  │
│    - User inputs availability & booking data                │
│    - Includes fallback settings for flexible booking        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CONTROLLER (TripController.php)                          │
│    - Receives form data via REST API                        │
│    - JSON encodes complex fields                            │
│    - Passes to validator                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. VALIDATOR (TripValidator.php)                            │
│    - Sanitizes and validates all fields                     │
│    - Ensures data integrity                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. DATABASE (wp_yatra_trips table)                          │
│    - Stores all availability & booking data                 │
│    - Has columns for ALL fields including fallback settings │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. MODEL (Trip.php) ❌ CRITICAL GAP                         │
│    - Should map database columns to properties              │
│    - MISSING: has_default_time_slots property               │
│    - MISSING: default_time_slots property                   │
│    - MISSING: departure_time property                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. SERVICE (AvailabilityResolutionService.php)              │
│    - Generates trip_default availability                    │
│    - NOT USING fallback settings from Trip model            │
│    - Should use departure_time, time_slots from trip        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Field-by-Field Analysis

### **SECTION 1: Availability Period**

#### 1.1 Available From (`available_from`)
- **Frontend:** ✅ DatePicker component
- **Type:** `string` (date format: YYYY-MM-DD)
- **Database:** ✅ `available_from` DATE column
- **Model:** ✅ `public ?string $available_from`
- **Validator:** ✅ Sanitized
- **Integration:** ✅ Used in `generateDefaultAvailability()`
- **Status:** ✅ **FULLY IMPLEMENTED**

#### 1.2 Available To (`available_to`)
- **Frontend:** ✅ DatePicker component
- **Type:** `string` (date format: YYYY-MM-DD)
- **Database:** ✅ `available_to` DATE column
- **Model:** ✅ `public ?string $available_to`
- **Validator:** ✅ Sanitized
- **Integration:** ✅ Used in `generateDefaultAvailability()`
- **Status:** ✅ **FULLY IMPLEMENTED**

#### 1.3 Booking Window Days (`booking_window_days`)
- **Frontend:** ✅ Input number field
- **Type:** `string` (converted to number)
- **Database:** ✅ `booking_window_days` SMALLINT column
- **Model:** ✅ `public ?int $booking_window_days`
- **Validator:** ✅ Sanitized
- **Integration:** ⚠️ Not currently used in availability generation
- **Status:** ✅ **STORED** but ⚠️ **NOT UTILIZED**

#### 1.4 Seasonal Availability (`seasonal_availability`)
- **Frontend:** ✅ Input text field
- **Type:** `string`
- **Database:** ✅ `seasonal_availability` VARCHAR(100) column
- **Model:** ✅ `public ?string $seasonal_availability`
- **Validator:** ✅ Sanitized
- **Integration:** ℹ️ Display-only field
- **Status:** ✅ **FULLY IMPLEMENTED**

---

### **SECTION 2: Capacity & Travelers**

#### 2.1 Minimum Travelers (`min_travelers`)
- **Frontend:** ✅ Input number field with validation
- **Type:** `string` (converted to number)
- **Database:** ✅ `min_travelers` SMALLINT column
- **Model:** ✅ `public ?int $min_travelers`
- **Validator:** ✅ Sanitized with validation
- **Integration:** ✅ Used in booking validation
- **Status:** ✅ **FULLY IMPLEMENTED**

#### 2.2 Maximum Travelers (`max_travelers`)
- **Frontend:** ✅ Input number field with validation
- **Type:** `string` (converted to number)
- **Database:** ✅ `max_travelers` SMALLINT column
- **Model:** ✅ `public ?int $max_travelers`
- **Validator:** ✅ Sanitized with validation
- **Integration:** ✅ Used in `trip_default` availability (seats_total, seats_available)
- **Status:** ✅ **FULLY IMPLEMENTED**

---

### **SECTION 3: Fallback Settings** ❌ **CRITICAL GAPS FOUND**

#### 3.1 Has Default Time Slots (`has_default_time_slots`)
- **Frontend:** ✅ Checkbox with conditional UI
- **Type:** `boolean`
- **Database:** ✅ `has_default_time_slots` TINYINT(1) column
- **Model:** ❌ **MISSING PROPERTY**
- **Validator:** ✅ Sanitized as boolean
- **Controller:** ✅ Properly handled
- **Integration:** ❌ **NOT ACCESSIBLE** in services
- **Status:** ❌ **CRITICAL GAP - Model property missing**

**Impact:** 
- Data saves to database correctly
- Data loads from database correctly
- **BUT** Trip model cannot access this property
- Services cannot use this setting for flexible booking

#### 3.2 Default Time Slots (`default_time_slots`)
- **Frontend:** ✅ Complex UI with add/remove functionality
- **Type:** `TimeSlot[]` (array of objects: `{id, time, label}`)
- **Database:** ✅ `default_time_slots` TEXT column (JSON)
- **Model:** ❌ **MISSING PROPERTY**
- **Validator:** ✅ Sanitized (kept as JSON string)
- **Controller:** ✅ JSON encoded/decoded properly
- **Integration:** ❌ **NOT ACCESSIBLE** in services
- **Status:** ❌ **CRITICAL GAP - Model property missing**

**Frontend Structure:**
```typescript
interface TimeSlot {
  id: string;
  time: string;      // HH:mm format (e.g., "09:00")
  label: string;     // e.g., "Morning Tour"
}
```

**Impact:**
- Time slots save to database as JSON
- Time slots load from database correctly
- **BUT** Trip model cannot access this array
- `AvailabilityResolutionService` cannot generate multiple time slots for day tours

#### 3.3 Departure Time (`departure_time`)
- **Frontend:** ✅ Time input field (conditional based on trip type)
- **Type:** `string` (time format: HH:mm)
- **Database:** ✅ `departure_time` TIME column
- **Model:** ❌ **MISSING PROPERTY**
- **Validator:** ✅ Sanitized
- **Controller:** ✅ Properly handled
- **Integration:** ❌ **NOT ACCESSIBLE** in services
- **Status:** ❌ **CRITICAL GAP - Model property missing**

**Impact:**
- Departure time saves to database
- Departure time loads from database
- **BUT** Trip model cannot access this property
- `buildAvailabilityObject()` in `trip_default` case sets `departure_time = null` instead of using trip's default

---

### **SECTION 4: Booking Policies**

#### 4.1 Age Restrictions (`age_min`, `age_max`)
- **Frontend:** ✅ Two number inputs
- **Type:** `string` (converted to number)
- **Database:** ✅ `age_min`, `age_max` SMALLINT columns
- **Model:** ✅ `public ?int $age_min`, `public ?int $age_max`
- **Validator:** ✅ Sanitized
- **Integration:** ✅ Used in booking validation
- **Status:** ✅ **FULLY IMPLEMENTED**

#### 4.2 Booking Deadline Hours (`booking_deadline_hours`)
- **Frontend:** ✅ Input number field
- **Type:** `string` (converted to number)
- **Database:** ✅ `booking_deadline_hours` SMALLINT column
- **Model:** ✅ `public ?int $booking_deadline_hours`
- **Validator:** ✅ Sanitized
- **Integration:** ✅ Used in booking cutoff calculations
- **Status:** ✅ **FULLY IMPLEMENTED**

#### 4.3 Cancellation Policy (`cancellation_policy`)
- **Frontend:** ✅ RichTextEditor component
- **Type:** `string` (HTML content)
- **Database:** ✅ `cancellation_policy` TEXT column
- **Model:** ✅ `public ?string $cancellation_policy`
- **Validator:** ✅ Sanitized with wp_kses_post
- **Integration:** ℹ️ Display-only field
- **Status:** ✅ **FULLY IMPLEMENTED**

---

## 🔴 Critical Issues Found

### **Issue #1: Missing Trip Model Properties**

**Severity:** 🔴 **CRITICAL**

**Description:**
The `Trip` model (`app/Models/Trip.php`) is missing three essential properties that exist in:
- ✅ Frontend form (TripForm.tsx)
- ✅ Database schema (TripsTable.php)
- ✅ Controller (TripController.php)
- ✅ Validator (TripValidator.php)

**Missing Properties:**
```php
// MISSING in Trip.php:
public bool $has_default_time_slots = false;
public ?string $default_time_slots = null;  // JSON string
public ?string $departure_time = null;
```

**Impact:**
1. **Data Integrity:** Data saves to database but model cannot access it
2. **Service Integration:** `AvailabilityResolutionService` cannot use these settings
3. **Flexible Booking:** Trip defaults don't include departure times or time slots
4. **Day Tours:** Multiple time slot feature is non-functional
5. **API Responses:** These fields won't be included in API responses

**Evidence:**
- Database has columns: ✅ Confirmed in `TripsTable.php` lines 74-76
- Controller handles: ✅ Confirmed in `TripController.php` lines 525-527, 609-615
- Validator sanitizes: ✅ Confirmed in `TripValidator.php` lines 382-393
- Model properties: ❌ Not found in `Trip.php`

---

### **Issue #2: AvailabilityResolutionService Not Using Fallback Settings**

**Severity:** 🟡 **MEDIUM** (becomes CRITICAL after Issue #1 is fixed)

**Description:**
The `buildAvailabilityObject()` method in `AvailabilityResolutionService.php` creates `trip_default` availability objects but doesn't use the trip's fallback settings.

**Current Implementation:**
```php
case 'trip_default':
    $avail->departure_date = $departure_date;
    $avail->departure_time = null;  // ❌ Should use $trip->departure_time
    $avail->arrival_time = null;
    // ...
```

**Should Be:**
```php
case 'trip_default':
    $avail->departure_date = $departure_date;
    $avail->departure_time = $trip->departure_time ?? null;  // ✅ Use trip default
    $avail->arrival_time = null;
    // ...
```

**Additional Missing Logic:**
- Not generating multiple availability objects for day tours with `has_default_time_slots = true`
- Not using `default_time_slots` array to create separate availability for each time slot
- Not respecting trip type (single_day vs multi_day) for time slot generation

---

### **Issue #3: Time Slot Generation Not Implemented**

**Severity:** 🟡 **MEDIUM**

**Description:**
When a day tour has `has_default_time_slots = true` and multiple time slots configured, the system should generate separate availability objects for each time slot on each date.

**Expected Behavior:**
```
Trip: "City Walking Tour" (Day Tour)
has_default_time_slots: true
default_time_slots: [
  {id: "1", time: "09:00", label: "Morning Tour"},
  {id: "2", time: "14:00", label: "Afternoon Tour"},
  {id: "3", time: "18:00", label: "Evening Tour"}
]

For date 2026-04-01, should generate 3 availability objects:
1. 2026-04-01 09:00 (Morning Tour)
2. 2026-04-01 14:00 (Afternoon Tour)
3. 2026-04-01 18:00 (Evening Tour)
```

**Current Behavior:**
- Only generates 1 availability object per date
- `departure_time` is always `null`
- Time slots are ignored

---

## ✅ What's Working Well

### **1. Frontend Implementation**
- ✅ Comprehensive UI with all fields
- ✅ Conditional rendering based on trip type
- ✅ Proper validation and error handling
- ✅ Time slot management (add/remove/edit)
- ✅ Help text and tooltips
- ✅ Responsive design

### **2. Database Schema**
- ✅ All columns exist and properly typed
- ✅ Indexes on important fields
- ✅ JSON storage for complex data (time_slots)
- ✅ Proper constraints and defaults

### **3. Controller Layer**
- ✅ Proper JSON encoding/decoding
- ✅ Debug logging for troubleshooting
- ✅ Handles both create and update operations
- ✅ Validates data before saving

### **4. Validator Layer**
- ✅ Sanitizes all inputs
- ✅ Type casting (boolean, string)
- ✅ Security measures (XSS prevention)

### **5. Core Availability Fields**
- ✅ `available_from` / `available_to` fully functional
- ✅ `min_travelers` / `max_travelers` integrated with booking
- ✅ `booking_deadline_hours` used in cutoff calculations
- ✅ Age restrictions enforced

---

## 🔧 Required Fixes

### **Fix #1: Add Missing Properties to Trip Model** (CRITICAL)

**File:** `app/Models/Trip.php`

**Add after line 73:**
```php
// Fallback Settings (for trips without availability dates/rules)
public bool $has_default_time_slots = false;
public ?string $default_time_slots = null; // JSON string
public ?string $departure_time = null;
```

**Add getter methods (after line 1560):**
```php
/**
 * Check if trip has default time slots enabled
 */
public function getHasDefaultTimeSlots(): bool
{
    return $this->has_default_time_slots ?? false;
}

/**
 * Get default time slots as array
 */
public function getDefaultTimeSlots(): array
{
    if (empty($this->default_time_slots)) {
        return [];
    }
    
    if (is_array($this->default_time_slots)) {
        return $this->default_time_slots;
    }
    
    $decoded = json_decode($this->default_time_slots, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Get default departure time
 */
public function getDepartureTime(): ?string
{
    return $this->departure_time;
}
```

---

### **Fix #2: Update AvailabilityResolutionService to Use Fallback Settings**

**File:** `app/Services/AvailabilityResolutionService.php`

**Update `buildAvailabilityObject()` trip_default case (line 350):**
```php
case 'trip_default':
    // From trip defaults (flexible booking)
    $departure_date = null;
    if (is_object($source) && !empty($source->departure_date)) {
        $departure_date = $source->departure_date;
    } elseif (is_array($source) && !empty($source['departure_date'])) {
        $departure_date = $source['departure_date'];
    }
    
    // Get departure time from source or trip default
    $departure_time_value = null;
    if (is_object($source) && !empty($source->departure_time)) {
        $departure_time_value = $source->departure_time;
    } elseif (is_array($source) && !empty($source['departure_time'])) {
        $departure_time_value = $source['departure_time'];
    } else {
        // Use trip's default departure time
        $departure_time_value = $trip->departure_time ?? null;
    }
    
    $avail->id = $departure_date ? 'default_' . $departure_date : 'default';
    if ($departure_time_value) {
        $avail->id .= '_' . str_replace(':', '', $departure_time_value);
    }
    
    $avail->trip_id = (int) $trip->id;
    $avail->departure_date = $departure_date;
    $avail->arrival_date = null;
    $avail->return_date = null;
    $avail->departure_time = $departure_time_value;  // ✅ Use trip default
    $avail->arrival_time = null;
    // ... rest of the code
```

---

### **Fix #3: Implement Time Slot Generation**

**File:** `app/Services/AvailabilityResolutionService.php`

**Update `generateDefaultAvailability()` method (line 193):**
```php
private function generateDefaultAvailability(object $trip, string $fromDate, string $toDate): array
{
    $dateMap = [];
    
    // Respect trip's available_from and available_to if set
    $tripAvailableFrom = !empty($trip->available_from) ? $trip->available_from : null;
    $tripAvailableTo = !empty($trip->available_to) ? $trip->available_to : null;
    
    // Determine actual date range
    $startDate = $fromDate;
    $endDate = $toDate;
    
    if ($tripAvailableFrom && $tripAvailableFrom > $startDate) {
        $startDate = $tripAvailableFrom;
    }
    
    if ($tripAvailableTo && $tripAvailableTo < $endDate) {
        $endDate = $tripAvailableTo;
    }
    
    // Don't generate dates if the range is invalid
    if ($startDate > $endDate) {
        return [];
    }
    
    // Check if trip has multiple time slots (for day tours)
    $hasTimeSlots = !empty($trip->has_default_time_slots) && $trip->trip_type === 'single_day';
    $timeSlots = [];
    
    if ($hasTimeSlots) {
        // Parse time slots from JSON
        $timeSlotsData = $trip->default_time_slots;
        if (is_string($timeSlotsData)) {
            $timeSlotsData = json_decode($timeSlotsData, true);
        }
        if (is_array($timeSlotsData) && !empty($timeSlotsData)) {
            $timeSlots = $timeSlotsData;
        }
    }
    
    // Generate daily availability for the range
    $currentDate = new \DateTime($startDate);
    $finalDate = new \DateTime($endDate);
    
    while ($currentDate <= $finalDate) {
        $dateStr = $currentDate->format('Y-m-d');
        
        if ($hasTimeSlots && !empty($timeSlots)) {
            // Generate separate availability for each time slot
            foreach ($timeSlots as $slot) {
                $timeValue = $slot['time'] ?? null;
                if (!$timeValue) continue;
                
                $defaultData = [
                    'departure_date' => $dateStr,
                    'departure_time' => $timeValue,
                ];
                
                $dateKey = $dateStr . '_' . $timeValue;
                $dateMap[$dateKey] = $this->buildAvailabilityObject($trip, (object) $defaultData, 'trip_default');
            }
        } else {
            // Single availability per date
            $defaultData = [
                'departure_date' => $dateStr,
            ];
            
            $dateMap[$dateStr] = $this->buildAvailabilityObject($trip, (object) $defaultData, 'trip_default');
        }
        
        // Move to next day
        $currentDate->modify('+1 day');
    }
    
    return $dateMap;
}
```

---

## 📈 Implementation Priority

### **Phase 1: Critical Fixes** (Immediate)
1. ✅ Add missing properties to Trip model
2. ✅ Add getter methods to Trip model
3. ✅ Update `buildAvailabilityObject()` to use `departure_time`

### **Phase 2: Enhanced Features** (Next Sprint)
4. ✅ Implement time slot generation in `generateDefaultAvailability()`
5. ✅ Test with day tours having multiple time slots
6. ✅ Verify booking flow works with time slots

### **Phase 3: Optimization** (Future)
7. ⚠️ Consider using `booking_window_days` in availability generation
8. ⚠️ Add caching for generated time slot availability
9. ⚠️ Performance optimization for large date ranges

---

## 🧪 Testing Checklist

### **After Fix #1 (Model Properties):**
- [ ] Create new trip with fallback settings
- [ ] Verify data saves to database
- [ ] Verify data loads from database
- [ ] Check API response includes new fields
- [ ] Verify Trip model can access properties

### **After Fix #2 (Departure Time):**
- [ ] Create trip without availability dates/rules
- [ ] Set `departure_time = "14:00"`
- [ ] Check single trip page
- [ ] Verify generated availability shows 14:00 departure time
- [ ] Test booking with default departure time

### **After Fix #3 (Time Slots):**
- [ ] Create day tour with `has_default_time_slots = true`
- [ ] Add 3 time slots (Morning, Afternoon, Evening)
- [ ] Check single trip page
- [ ] Verify 3 separate availability cards per date
- [ ] Test booking each time slot
- [ ] Verify capacity management per time slot

---

## 📝 Conclusion

The Availability & Booking section is **well-designed** with a comprehensive frontend and proper database schema. However, there are **3 critical gaps** in the Trip model that prevent the fallback settings from being fully functional.

### **Summary:**
- **Frontend:** ✅ Excellent implementation
- **Database:** ✅ Complete schema
- **Controller:** ✅ Proper handling
- **Validator:** ✅ Secure sanitization
- **Model:** ❌ Missing 3 properties (CRITICAL)
- **Service:** ⚠️ Not using fallback settings

### **Impact if Not Fixed:**
1. Fallback settings save but are never used
2. Day tours can't have multiple time slots
3. Flexible booking always shows null departure times
4. Poor user experience for trips without specific availability

### **Recommendation:**
**Implement all 3 fixes immediately** to complete the flexible booking feature and ensure the Availability & Booking section works as designed.

---

**Analysis completed by:** Senior Software Engineer  
**Review status:** Ready for implementation  
**Next action:** Apply Fix #1 to Trip model
