# Departure System Implementation Checklist

## Phase 1: Database Schema Updates ✅

### Bookings Table
- [ ] Add `start_date` DATE column
- [ ] Add `end_date` DATE column
- [ ] Migrate existing `travel_date` to `start_date`
- [ ] Calculate and populate `end_date` from trip duration

### Departures Table
- [ ] Add `start_date` DATE column
- [ ] Add `end_date` DATE column
- [ ] Migrate existing `date` to `start_date`
- [ ] Calculate and populate `end_date` from trip duration
- [ ] Update `source` field values if needed

### Relationship Table
- [ ] Create `wp_yatra_booking_departures` table
- [ ] Add foreign key constraints
- [ ] Add indexes for performance

## Phase 2: Model Updates ✅

### Departure Model
- [ ] Add `start_date` and `end_date` properties
- [ ] Update `fromArray()` to handle new fields
- [ ] Update `toArray()` to include new fields
- [ ] Update `calculateStatus()` to use `end_date` for past check

### Booking Model (if exists)
- [ ] Add `start_date` and `end_date` properties
- [ ] Update serialization methods

## Phase 3: Repository Updates ✅

### DepartureRepository
- [ ] Update `findByTripIdAndDate()` to use `start_date`
- [ ] Add `findByTripIdAndStartDate()` method
- [ ] Update `create()` to accept `start_date` and `end_date`
- [ ] Update `update()` to handle `start_date` and `end_date`
- [ ] Update `recalculateAllStatuses()` to use `end_date` for past check

### BookingRepository
- [ ] Update `create()` to accept and store `start_date` and `end_date`
- [ ] Update `update()` to handle date changes
- [ ] Add method to calculate `end_date` from `start_date` + duration
- [ ] Add query method to find bookings by departure_id

### BookingDepartureRepository (New)
- [ ] Create repository class
- [ ] Implement `link()` - Create relationship
- [ ] Implement `unlink()` - Remove relationship
- [ ] Implement `getDepartureForBooking()` - Find departure for booking
- [ ] Implement `getBookingsForDeparture()` - Find all bookings for departure
- [ ] Implement `updateDepartureForBooking()` - Handle date change

## Phase 4: Service Layer Updates ✅

### DepartureService
- [ ] Update `findOrCreateForBooking()` to use `start_date` and `end_date`
- [ ] Add `linkBookingToDeparture()` method
- [ ] Add `unlinkBookingFromDeparture()` method (mark cancelled if empty)
- [ ] Add `handleBookingDateChange()` method
- [ ] Add `cancelDeparture()` method (with note)
- [ ] Add `getBookingsForDeparture()` method
- [ ] Add `getDepartureForBooking()` method
- [ ] Update `recalculateAllStatuses()` to use `end_date`

### BookingService
- [ ] Update `createBooking()` to calculate `start_date` and `end_date`
- [ ] Update `createBooking()` to link to departure after creation
- [ ] Update `updateBooking()` to detect date changes
- [ ] Update `updateBooking()` to trigger departure date change flow
- [ ] Update `updateStatus()` to handle departure cancellation properly
- [ ] Add helper method `calculateEndDate($startDate, $tripDuration)`

## Phase 5: Controller Updates ✅

### BookingSessionController
- [ ] Update booking creation to calculate `start_date` and `end_date`
- [ ] Update departure creation to use `start_date` and `end_date`
- [ ] Link booking to departure via relationship table

### BookingsController
- [ ] Update `updateBooking()` to handle date changes
- [ ] Trigger departure update flow when date changes

## Phase 6: Cron Job Updates ✅

### DepartureCronService
- [ ] Update `dailyStatusUpdate()` to use `end_date` instead of `date`
- [ ] Query: `WHERE end_date < CURDATE() AND status != 'past'`
- [ ] Mark as `past` instead of deleting

## Phase 7: Frontend Updates ✅

### Booking Form
- [ ] Display calculated `end_date` when `start_date` is selected
- [ ] Show: "Trip ends on: {end_date}" 
- [ ] Show departure capacity information
- [ ] Show how many spots available for selected departure

### Admin UI
- [ ] Display `start_date` and `end_date` in departure listings
- [ ] Show booking count per departure
- [ ] Show cancelled departures with notes
- [ ] Filter by status (upcoming/full/past/cancelled)

## Phase 8: Testing Checklist ✅

### Booking Creation
- [ ] Test: Booking creates departure automatically
- [ ] Test: Multiple bookings link to same departure
- [ ] Test: `start_date` and `end_date` calculated correctly
- [ ] Test: Departure `booked_count` increments correctly

### Booking Cancellation
- [ ] Test: Cancelled booking decrements departure `booked_count`
- [ ] Test: Departure marked as `cancelled` when all bookings removed
- [ ] Test: Departure NOT deleted, only status changed
- [ ] Test: Cancellation note added to departure

### Booking Date Change
- [ ] Test: Date change creates new departure
- [ ] Test: Old departure marked as `cancelled` with note
- [ ] Test: Booking linked to new departure
- [ ] Test: Old departure NOT deleted
- [ ] Test: If old departure has other bookings, only decrement count

### Cron Job
- [ ] Test: Past departures marked correctly (using `end_date`)
- [ ] Test: Status updates run daily
- [ ] Test: No departures deleted by cron

### Edge Cases
- [ ] Test: Booking without departure (refund case)
- [ ] Test: Departure with no bookings (cancelled status)
- [ ] Test: Trip with duration_days = 1 (day trip)
- [ ] Test: Trip with duration_days = null (use default 1)

## Phase 9: Migration Script ✅

- [ ] Create migration script for database changes
- [ ] Test migration on staging
- [ ] Backup database before migration
- [ ] Document rollback procedure

## Phase 10: Documentation ✅

- [ ] Update API documentation
- [ ] Update developer documentation
- [ ] Create user guide for departure management
- [ ] Document date change workflow

