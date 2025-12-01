# Departure System Flow & Architecture

## Core Concept

**Key Understanding:**
- A **Departure** is a scheduled trip date that can have **multiple bookings**
- A **Booking** is a customer reservation that belongs to a **Departure**
- **Not all bookings are departures** - some bookings might be custom/private trips
- A departure tracks **ongoing trips** and maintains **past departures** for historical records

## Current Implementation Analysis

### 1. Booking Structure
- **Current:** Bookings store only `travel_date` (single date)
- **Needed:** Bookings should store `start_date` and `end_date`
  - `start_date` = Selected departure date (from availability/recurring rule/trip)
  - `end_date` = start_date + trip duration (duration_days)

### 2. Departure Structure
- **Current:** Departures store:
  - `date` (single date - YYYY-MM-DD)
  - `booked_count` (aggregate count)
  - No direct link to individual bookings

- **Needed:** 
  - Store `start_date` and `end_date` (trip duration range)
  - Link to bookings via relationship table or JSON array of booking_ids
  - Track which bookings belong to this departure

### 3. Date Source Priority
When a booking is created, the date comes from (in priority order):
1. **Availability Date** (`yatra_trip_availability_dates` table)
   - Specific manually created dates
   - Has `departure_date` and `return_date`
2. **Recurring Rule** (dynamically generated)
   - Generated from `yatra_trip_recurring_availability` rules
   - Calculated on-the-fly based on pattern
3. **Trip Directly** (flexible dates)
   - If no availability/recurring rules exist
   - Uses trip's `available_from` and `available_to` range

## Proposed Flow

### Phase 1: Booking Creation Flow

```
1. User selects trip and date
   ├─ From Availability Card (specific date)
   ├─ From Recurring Rule (generated date)
   └─ From Trip Directly (flexible date)

2. Calculate Booking Dates
   ├─ start_date = Selected departure date
   ├─ end_date = start_date + trip.duration_days
   └─ Validate dates are within trip's available_from/available_to

3. Create Booking
   ├─ Store: booking_id, trip_id, start_date, end_date
   ├─ Store: travelers, pricing, contact info
   └─ Status: pending/confirmed

4. Link to Departure
   ├─ Find existing departure for start_date
   │  └─ OR create new departure
   ├─ Link booking to departure (via relationship table)
   ├─ Increment departure.booked_count
   └─ Update departure.status (upcoming/full/past)
```

### Phase 2: Departure Management

```
Departure Table Structure:
- id
- trip_id
- start_date (YYYY-MM-DD) - When trip starts
- end_date (YYYY-MM-DD) - When trip ends
- time (HH:MM:SS, optional) - Departure time
- max_capacity
- booked_count
- status (upcoming | full | past | cancelled)
- source (manual | recurring_generated | booking_created)
- booking_ids (JSON array) - Array of booking IDs for this departure
- created_at
- updated_at
```

### Phase 3: Relationship Table (Optional but Recommended)

```
Table: wp_yatra_booking_departures
- id (primary key)
- booking_id (foreign key → yatra_bookings)
- departure_id (foreign key → yatra_trip_departures)
- created_at
```

**Benefits:**
- Easy query: "Get all bookings for departure X"
- Easy query: "Get departure for booking Y"
- Maintains referential integrity
- Allows booking to belong to multiple departures (if needed in future)

## Detailed Flow Diagram

### Booking Creation Process

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER SELECTS DATE                                        │
└─────────────────────────────────────────────────────────────┘
                    │
                    ├─► From Availability?
                    │   └─► Use availability.departure_date
                    │
                    ├─► From Recurring Rule?
                    │   └─► Generate date from rule pattern
                    │
                    └─► From Trip Directly?
                        └─► Use selected date (flexible)

┌─────────────────────────────────────────────────────────────┐
│ 2. CALCULATE BOOKING DATES                                   │
└─────────────────────────────────────────────────────────────┘
                    │
                    ├─► start_date = selected_date
                    ├─► end_date = start_date + trip.duration_days
                    └─► Validate: start_date >= trip.available_from
                        Validate: end_date <= trip.available_to

┌─────────────────────────────────────────────────────────────┐
│ 3. CREATE BOOKING                                            │
└─────────────────────────────────────────────────────────────┘
                    │
                    ├─► Insert into yatra_bookings:
                    │   ├─ booking_id
                    │   ├─ trip_id
                    │   ├─ start_date (NEW)
                    │   ├─ end_date (NEW)
                    │   ├─ travel_date (keep for backward compat)
                    │   ├─ travelers_count
                    │   └─ ... other booking fields
                    │
                    └─► Save travelers to yatra_booking_travellers

┌─────────────────────────────────────────────────────────────┐
│ 4. LINK TO DEPARTURE                                         │
└─────────────────────────────────────────────────────────────┘
                    │
                    ├─► Find or Create Departure
                    │   ├─ Query: departure WHERE trip_id = X 
                    │   │         AND start_date = booking.start_date
                    │   │
                    │   ├─ IF EXISTS:
                    │   │   └─► Use existing departure
                    │   │
                    │   └─► IF NOT EXISTS:
                    │       ├─► Create new departure
                    │       ├─► start_date = booking.start_date
                    │       ├─► end_date = booking.end_date
                    │       ├─► max_capacity = trip.max_capacity
                    │       └─► source = 'booking_created'
                    │
                    ├─► Link Booking to Departure
                    │   ├─► Insert into yatra_booking_departures:
                    │   │   ├─ booking_id
                    │   │   └─ departure_id
                    │   │
                    │   └─► OR Update departure.booking_ids JSON:
                    │       └─► Add booking_id to array
                    │
                    └─► Update Departure
                        ├─► Increment booked_count
                        ├─► Recalculate status (upcoming/full/past)
                        └─► Update updated_at
```

### Departure Status Management

```
┌─────────────────────────────────────────────────────────────┐
│ DAILY CRON JOB (yatra_daily_departure_status_update)       │
└─────────────────────────────────────────────────────────────┘
                    │
                    ├─► Find all departures WHERE:
                    │   ├─ end_date < TODAY
                    │   └─ status != 'past'
                    │
                    └─► Update status = 'past'

┌─────────────────────────────────────────────────────────────┐
│ ON BOOKING CANCELLATION                                     │
└─────────────────────────────────────────────────────────────┘
                    │
                    ├─► Find departure for booking
                    │   └─► Query via yatra_booking_departures
                    │
                    ├─► Update Departure (DO NOT DELETE DATA)
                    │   ├─► Decrement booked_count
                    │   ├─► Remove booking_id from relationship table
                    │   │   └─► OR Remove booking_id from JSON array
                    │   ├─► IF booked_count = 0:
                    │   │   └─► Update status = 'cancelled'
                    │   │   └─► Update notes = 'Cancelled - All bookings removed'
                    │   └─► ELSE:
                    │       └─► Recalculate status (upcoming/full/past)
                    │
                    └─► Keep departure record for historical tracking

┌─────────────────────────────────────────────────────────────┐
│ ON BOOKING DATE CHANGE                                      │
└─────────────────────────────────────────────────────────────┘
                    │
                    ├─► Get current booking
                    │   └─► Read: booking.start_date, booking.departure_id
                    │
                    ├─► Calculate new dates
                    │   ├─► new_start_date = new selected date
                    │   └─► new_end_date = new_start_date + trip.duration_days
                    │
                    ├─► Find/Create NEW departure
                    │   ├─► Query: departure WHERE trip_id = X 
                    │   │         AND start_date = new_start_date
                    │   │
                    │   ├─► IF EXISTS:
                    │   │   └─► Use existing departure
                    │   │
                    │   └─► IF NOT EXISTS:
                    │       ├─► Create new departure
                    │       ├─► start_date = new_start_date
                    │       ├─► end_date = new_end_date
                    │       └─► source = 'booking_created'
                    │
                    ├─► Update OLD departure
                    │   ├─► IF old departure has other bookings:
                    │   │   ├─► Decrement booked_count
                    │   │   └─► Remove booking_id from relationship
                    │   │
                    │   └─► IF old departure has NO other bookings:
                    │       ├─► Update status = 'cancelled'
                    │       ├─► Update notes = 'Cancelled - Booking date changed (Booking ID: {booking_id})'
                    │       └─► Keep departure record (DO NOT DELETE)
                    │
                    ├─► Link booking to NEW departure
                    │   ├─► Update yatra_booking_departures:
                    │   │   ├─► Update departure_id to new departure
                    │   │   └─► OR Update booking_ids JSON in new departure
                    │   │
                    │   └─► Increment new departure.booked_count
                    │
                    └─► Update booking
                        ├─► Update start_date = new_start_date
                        ├─► Update end_date = new_end_date
                        └─► Update travel_date = new_start_date (backward compat)
```

## Database Schema Changes Needed

### 1. Update Bookings Table
```sql
ALTER TABLE wp_yatra_bookings
ADD COLUMN start_date DATE AFTER travel_date,
ADD COLUMN end_date DATE AFTER start_date;

-- Migrate existing data
UPDATE wp_yatra_bookings
SET start_date = travel_date,
    end_date = DATE_ADD(travel_date, INTERVAL (
        SELECT COALESCE(duration_days, 1) - 1 
        FROM wp_yatra_trips 
        WHERE id = wp_yatra_bookings.trip_id
    ) DAY);
```

### 2. Update Departures Table
```sql
ALTER TABLE wp_yatra_trip_departures
ADD COLUMN start_date DATE AFTER date,
ADD COLUMN end_date DATE AFTER start_date,
ADD COLUMN booking_ids JSON AFTER notes;

-- Migrate existing data
UPDATE wp_yatra_trip_departures
SET start_date = date,
    end_date = DATE_ADD(date, INTERVAL (
        SELECT COALESCE(duration_days, 1) - 1 
        FROM wp_yatra_trips 
        WHERE id = wp_yatra_trip_departures.trip_id
    ) DAY);
```

### 3. Create Relationship Table (Recommended)
```sql
CREATE TABLE wp_yatra_booking_departures (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    departure_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_booking_departure (booking_id, departure_id),
    KEY idx_departure_id (departure_id),
    KEY idx_booking_id (booking_id),
    FOREIGN KEY (booking_id) REFERENCES wp_yatra_bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (departure_id) REFERENCES wp_yatra_trip_departures(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## API & Service Layer Changes

### 1. BookingService Updates
- Calculate `start_date` and `end_date` during booking creation
  - `start_date` = selected travel date
  - `end_date` = start_date + (trip.duration_days - 1) days
- Link booking to departure after creation
- Handle departure updates on booking cancellation (mark cancelled if no bookings)
- Handle departure updates on booking date change (create new, cancel old)
- `updateBooking()` - Check if date changed and trigger departure update flow

### 2. DepartureService Updates
- `findOrCreateForBooking()` - Use `start_date` and `end_date` instead of single `date`
- `linkBookingToDeparture()` - New method to create relationship
- `unlinkBookingFromDeparture()` - Remove relationship on cancellation (mark cancelled if no bookings)
- `handleBookingDateChange()` - New method to handle date changes (create new, cancel old)
- `getBookingsForDeparture()` - Get all bookings for a departure
- `getDepartureForBooking()` - Get departure for a booking
- `cancelDeparture()` - Mark departure as cancelled with note (never delete)

### 3. BookingRepository Updates
- Add `start_date` and `end_date` to booking creation
- Update `start_date` and `end_date` when booking date changes
- Query bookings by departure_id (via relationship table)
- Calculate `end_date` from `start_date` + trip duration

## Frontend Changes

### Booking Form
- Display calculated `end_date` based on selected `start_date` + trip duration
- Show departure information when date is selected
- Display how many spots are available for that departure

## Benefits of This Architecture

1. **Historical Tracking**: Past departures maintain complete record of all bookings
2. **Capacity Management**: Easy to see how many bookings per departure
3. **Reporting**: Generate reports on departures (revenue, occupancy, etc.)
4. **Flexibility**: Bookings can exist without departures (custom trips)
5. **Data Integrity**: Clear relationship between bookings and departures
6. **Future Features**: 
   - Waitlist for full departures
   - Group bookings management
   - Departure-specific pricing changes

## Finalized Requirements (Based on User Feedback)

### 1. Booking-Departure Relationship
- **Most bookings have departures** - Normal flow creates departure automatically
- **Some bookings can exist without departures** - Edge cases like:
  - Refunds before departure creation
  - Cancelled bookings that never got linked
  - Custom/private trips that don't follow standard departure pattern
- **One booking = One departure** - No multiple departures per booking

### 2. Departure Creation
- **NO manual creation** - Departures are ONLY created when bookings are made
- **Automatic creation** - When booking is created, departure is found or created automatically
- **Source tracking** - Departures created from bookings have `source = 'booking_created'`

### 3. Date Change Handling
- **When booking date changes:**
  1. Find or create NEW departure for new date
  2. Link booking to NEW departure
  3. Update OLD departure:
     - If has other bookings: Just decrement booked_count and remove booking link
     - If NO other bookings: Mark as `cancelled` with note: "Cancelled - Booking date changed (Booking ID: X)"
  4. **NEVER DELETE** old departure - Keep for historical records
  5. Update booking's start_date, end_date, and travel_date

### 4. Cancellation Handling
- **When booking is cancelled:**
  1. Find departure for booking
  2. Decrement departure.booked_count
  3. Remove booking link from relationship table/JSON
  4. If booked_count = 0: Mark departure as `cancelled` with note
  5. **NEVER DELETE** departure - Keep for historical tracking
  6. Departure status becomes: `cancelled` (not deleted)

### 5. Departure Status Values
- `upcoming` - Future date, has capacity
- `full` - Future date, booked_count >= max_capacity
- `past` - end_date < today (automatically marked by cron)
- `cancelled` - All bookings removed OR booking date changed

## Implementation Notes

### End Date Calculation
```php
// Formula: end_date = start_date + (duration_days - 1)
// Example: If trip is 5 days starting Jan 1:
//   start_date = 2025-01-01
//   end_date = 2025-01-05 (Jan 1 + 4 days = 5 days total)
$end_date = date('Y-m-d', strtotime($start_date . ' + ' . ($trip->duration_days - 1) . ' days'));
```

### Departure Notes Field Usage
- Store cancellation reasons: "Cancelled - All bookings removed"
- Store date change info: "Cancelled - Booking date changed (Booking ID: 123)"
- Store manual notes from admin if needed

### Relationship Table vs JSON Array
**Recommended: Use Relationship Table** (`wp_yatra_booking_departures`)
- Better for queries: "Get all bookings for departure X"
- Better for integrity: Foreign key constraints
- Better for performance: Indexed lookups
- Easier to maintain: No JSON parsing needed

**Alternative: JSON Array** (if relationship table is not preferred)
- Store booking_ids as JSON in departure.booking_ids
- Simpler structure but harder to query
- No referential integrity 


