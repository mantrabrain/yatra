-- Comprehensive SQL to sync all departure capacities from availability dates
-- This updates departures to match their corresponding availability capacity

-- Update departures with capacity from availability dates (matching by trip_id and date)
UPDATE wp_yatra_trip_departures d
INNER JOIN wp_yatra_trip_availability_dates a 
    ON a.trip_id = d.trip_id 
    AND a.departure_date = COALESCE(d.start_date, d.date)
SET d.max_capacity = a.seats_total
WHERE a.seats_total > 0
    AND d.max_capacity != a.seats_total;

-- Verify the update
SELECT 
    d.id as departure_id,
    d.trip_id,
    COALESCE(d.start_date, d.date) as departure_date,
    d.time as departure_time,
    d.max_capacity as current_capacity,
    a.seats_total as availability_capacity,
    CASE 
        WHEN d.max_capacity = a.seats_total THEN 'SYNCED'
        ELSE 'NEEDS UPDATE'
    END as status
FROM wp_yatra_trip_departures d
LEFT JOIN wp_yatra_trip_availability_dates a 
    ON a.trip_id = d.trip_id 
    AND a.departure_date = COALESCE(d.start_date, d.date)
WHERE a.id IS NOT NULL
ORDER BY d.trip_id, departure_date;
