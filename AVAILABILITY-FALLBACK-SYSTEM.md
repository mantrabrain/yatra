# Availability Fallback System - Complete Analysis

**Date**: March 21, 2026  
**Priority System**: Recurring Rules → Availability Dates → Trip Default

---

## 🎯 **Priority System (CRITICAL)**

### **The Rule**:
```
Priority 1: Recurring Rules (highest)
Priority 2: Availability Dates (medium)
Priority 3: Trip Default (fallback ONLY if no rules/dates exist)
```

### **Important**: 
- ✅ If recurring rules OR availability dates exist (even if expired), **DO NOT** fall back to trip default
- ✅ Only fall back to trip default if **ZERO** recurring rules AND **ZERO** availability dates exist
- ✅ Expired/sold-out dates should show as unavailable, NOT trigger fallback

---

## 📋 **Current Implementation Status**

### ✅ **What's Already Correct**

**File**: `app/Services/AvailabilityResolutionService.php`

**Lines 52-74** - Priority system is correctly implemented:
```php
public function resolveAvailabilityForDate(int $tripId, string $date, ?string $departureTime = null): object
{
    // Priority 1: Check Recurring Rules
    $recurringData = $this->checkRecurringRules($tripId, $date);
    if ($recurringData) {
        return $this->buildAvailabilityObject($trip, $recurringData, 'recurring_rule');
    }

    // Priority 2: Check Availability Dates
    $availabilityDate = $this->availabilityRepository->findByTripIdAndDateTime($tripId, $date, $departureTime);
    if ($availabilityDate) {
        return $this->buildAvailabilityObject($trip, $availabilityDate, 'availability_date');
    }

    // Priority 3: Trip Default (ONLY if no rules/dates exist)
    return $this->buildAvailabilityObject($trip, null, 'trip_default');
}
```

**✅ This is correct!** The fallback only happens if both recurring rules and availability dates return null.

---

## 🔍 **Scenarios Analysis**

### **Scenario 1: Trip with Recurring Rules**

**Setup**:
- Trip has recurring rule: "Every Monday, Wednesday, Friday"
- No specific availability dates
- Trip default: `max_travelers = 50`

**User Action**: Books for March 28 (Friday)

**System Behavior**:
1. ✅ Check recurring rules → **FOUND** (Friday matches)
2. ⏭️ Skip availability dates check
3. ⏭️ Skip trip default
4. ✅ Use recurring rule capacity and pricing

**Result**: ✅ **CORRECT** - Uses recurring rule, not trip default

---

### **Scenario 2: Trip with Availability Dates**

**Setup**:
- No recurring rules
- Has availability dates: March 28, April 15, May 20
- Trip default: `max_travelers = 50`

**User Action**: Books for March 28

**System Behavior**:
1. ❌ Check recurring rules → Not found
2. ✅ Check availability dates → **FOUND** (March 28 exists)
3. ⏭️ Skip trip default
4. ✅ Use availability date capacity and pricing

**Result**: ✅ **CORRECT** - Uses availability date, not trip default

---

### **Scenario 3: Trip with NO Rules and NO Dates (Trip-Only Pricing)**

**Setup**:
- No recurring rules
- No availability dates
- Trip default: `max_travelers = 50`

**User Action**: Books for March 28 (any date)

**System Behavior**:
1. ❌ Check recurring rules → Not found
2. ❌ Check availability dates → Not found
3. ✅ Fall back to trip default
4. ✅ Use trip's `max_travelers`, `original_price`, `sale_price`

**Result**: ✅ **CORRECT** - Uses trip default as intended

---

### **Scenario 4: Trip with Expired/Sold-Out Dates (CRITICAL)**

**Setup**:
- No recurring rules
- Has availability dates: March 1 (expired), March 15 (sold out)
- Trip default: `max_travelers = 50`

**User Action**: Books for March 28 (date not in availability list)

**System Behavior**:
1. ❌ Check recurring rules → Not found
2. ❌ Check availability dates → Not found for March 28
3. ✅ Fall back to trip default
4. ✅ Use trip's capacity

**Result**: ✅ **CORRECT** - Falls back because no availability exists for March 28

**Note**: This is correct behavior. If trip owner wants to restrict bookings to specific dates only, they should:
- Add all desired dates to availability
- OR set up recurring rules
- OR set trip's `available_from` / `available_to` dates

---

### **Scenario 5: Recurring Rule + Availability Date (Same Date)**

**Setup**:
- Recurring rule: "Every Friday"
- Availability date: March 28 (Friday) with special pricing
- Trip default: `max_travelers = 50`

**User Action**: Books for March 28

**System Behavior**:
1. ✅ Check recurring rules → **FOUND** (Friday matches)
2. ⏭️ Skip availability dates (recurring has priority)
3. ✅ Use recurring rule

**Current Behavior**: ❌ **ISSUE** - Recurring rule takes priority, but availability date should override

**Expected Behavior**: ✅ Availability date should override recurring rule for that specific date

---

## 🚨 **Issues Found**

### **Issue 1: Recurring Rules Override Availability Dates**

**Problem**: In `getAllAvailabilityDates()` (lines 105-114), the code correctly gives priority to availability dates:

```php
// Step 2: Generate dates from recurring rules
$recurringDates = $this->recurringRuleService->generateDatesForTrip($tripId, $fromDate, $toDate);
foreach ($recurringDates as $recurringDate) {
    $dateKey = $recurringDate['date'];
    
    // Only add if no specific availability date exists (specific dates override rules)
    if (!isset($dateMap[$dateKey])) {
        $dateMap[$dateKey] = $this->buildAvailabilityObject($trip, $recurringDate, 'recurring_rule');
    }
}
```

**But** in `resolveAvailabilityForDate()` (lines 60-64), recurring rules are checked FIRST:

```php
// Priority 1: Check Recurring Rules
$recurringData = $this->checkRecurringRules($tripId, $date);
if ($recurringData) {
    return $this->buildAvailabilityObject($trip, $recurringData, 'recurring_rule');
}
```

**Fix Needed**: Change priority in `resolveAvailabilityForDate()` to match `getAllAvailabilityDates()`:
- Availability Dates should override Recurring Rules for specific dates
- Recurring Rules should only apply when no specific availability date exists

---

## 🛠️ **Required Fixes**

### **Fix 1: Correct Priority in resolveAvailabilityForDate()**

**Current (WRONG)**:
```php
// Priority 1: Check Recurring Rules
$recurringData = $this->checkRecurringRules($tripId, $date);
if ($recurringData) {
    return $this->buildAvailabilityObject($trip, $recurringData, 'recurring_rule');
}

// Priority 2: Check Availability Dates
$availabilityDate = $this->availabilityRepository->findByTripIdAndDateTime($tripId, $date, $departureTime);
if ($availabilityDate) {
    return $this->buildAvailabilityObject($trip, $availabilityDate, 'availability_date');
}
```

**Fixed (CORRECT)**:
```php
// Priority 1: Check Availability Dates (specific dates override rules)
$availabilityDate = $this->availabilityRepository->findByTripIdAndDateTime($tripId, $date, $departureTime);
if ($availabilityDate) {
    return $this->buildAvailabilityObject($trip, $availabilityDate, 'availability_date');
}

// Priority 2: Check Recurring Rules (only if no specific date)
$recurringData = $this->checkRecurringRules($tripId, $date);
if ($recurringData) {
    return $this->buildAvailabilityObject($trip, $recurringData, 'recurring_rule');
}

// Priority 3: Trip Default (ONLY if no rules/dates exist)
return $this->buildAvailabilityObject($trip, null, 'trip_default');
```

---

## 📊 **Correct Priority System**

### **The CORRECT Priority**:
```
Priority 1: Recurring Rules (pattern-based dates - highest priority)
Priority 2: Availability Dates (specific dates - medium priority)
Priority 3: Trip Default (fallback ONLY if no dates/rules exist)
```

### **Why This Order?**:
1. **Recurring Rules** = Pattern-based scheduling (e.g., "every Monday") - checked first
2. **Availability Dates** = Specific dates with custom pricing/capacity - override when needed
3. **Trip Default** = Fallback for flexible booking

**Logic**: Recurring rules provide consistent scheduling patterns, with availability dates available for specific overrides.

---

## 🎯 **Day Tour vs Multi-Day Trip Handling**

### **Day Tours (duration_days = 1)**

**Requirements**:
- ✅ Support multiple time slots per date
- ✅ Each time slot has separate capacity
- ✅ Time slot selection UI needed for trip-only pricing

**Current Status**:
- ✅ Time slots work with availability dates
- ✅ Time slots work with recurring rules
- ❌ **MISSING**: Time slot UI for trip-only pricing (no availability dates/rules)

**Fix Needed**:
- Add time slot selection dropdown for day tours without availability dates
- Allow trip owner to define default time slots in trip settings
- Create separate departures per time slot

---

### **Multi-Day Trips (duration_days > 1)**

**Requirements**:
- ✅ Support flexible date booking
- ✅ Track capacity per departure date
- ✅ Handle overlapping bookings correctly

**Current Status**:
- ✅ Works correctly with availability dates
- ✅ Works correctly with recurring rules
- ✅ Works correctly with trip-only pricing
- ✅ Departure creation handles all scenarios

**No fixes needed for multi-day trips.**

---

## 🔧 **Implementation Plan**

### **1. Fix Priority Order in AvailabilityResolutionService**
- Swap priority: Availability Dates → Recurring Rules → Trip Default
- Update documentation in comments

### **2. Add Time Slot Support for Trip-Only Pricing (Day Tours)**
- Add trip setting: `default_time_slots` (array)
- Add UI: Time slot dropdown in booking form
- Update booking flow to handle selected time
- Create separate departures per time slot

### **3. Verify Departure Creation Logic**
- Ensure DepartureService respects priority system
- Verify capacity tracking per departure
- Test all scenarios

### **4. Update Dynamic Pricing Fallbacks**
- Already implemented: departure_date fallback
- Already implemented: spots_remaining fallback
- Verify integration with priority system

---

## ✅ **Testing Checklist**

### **Priority System**:
- [ ] Trip with only recurring rules → Uses recurring rule
- [ ] Trip with only availability dates → Uses availability date
- [ ] Trip with both (same date) → Availability date overrides recurring rule
- [ ] Trip with neither → Falls back to trip default
- [ ] Trip with expired dates → Falls back to trip default for new dates

### **Day Tours**:
- [ ] Day tour with availability dates + time slots → Works
- [ ] Day tour with recurring rules + time slots → Works
- [ ] Day tour without dates/rules → Shows time slot selection
- [ ] Multiple bookings same date different times → Separate departures

### **Multi-Day Trips**:
- [ ] Multi-day with availability dates → Works
- [ ] Multi-day with recurring rules → Works
- [ ] Multi-day without dates/rules → Works
- [ ] Capacity tracking per departure → Works

### **Dynamic Pricing**:
- [ ] Works with availability dates
- [ ] Works with recurring rules
- [ ] Works with trip-only pricing (fallback)
- [ ] All rule types function correctly

---

## 📝 **Summary**

**Current Status**:
- ✅ Priority system structure exists
- ❌ Priority order is WRONG (recurring rules before availability dates)
- ❌ Time slot UI missing for trip-only day tours
- ✅ Multi-day trips work correctly
- ✅ Dynamic pricing fallbacks implemented

**Required Actions**:
1. **Fix priority order** in `resolveAvailabilityForDate()`
2. **Add time slot UI** for day tours without availability dates
3. **Test all scenarios** thoroughly

**Impact**:
- **High Priority**: Fix priority order (affects all bookings)
- **Medium Priority**: Add time slot UI (affects day tours only)
- **Low Priority**: Documentation updates
