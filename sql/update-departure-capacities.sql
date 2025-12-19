<?php

/**
 * SQL script to update departure capacities from availability dates
 * Run this directly in database or via WordPress admin
 */

-- Update departure max_capacity from availability dates
UPDATE wp_yatra_trip_departures d
SET d.max_capacity = (
    SELECT COALESCE(a.seats_total, 0)
    FROM wp_yatra_trip_availability_dates a
    WHERE a.trip_id = d.trip_id 
    AND a.departure_date = COALESCE(d.start_date, d.date)
    AND a.seats_total > 0
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM wp_yatra_trip_availability_dates a
    WHERE a.trip_id = d.trip_id 
    AND a.departure_date = COALESCE(d.start_date, d.date)
    AND a.seats_total > 0
);

-- Show results
SELECT 
    d.id,
    d.trip_id,
    COALESCE(d.start_date, d.date) as departure_date,
    d.max_capacity as old_capacity,
    a.seats_total as new_capacity
FROM wp_yatra_trip_departures d
JOIN wp_yatra_trip_availability_dates a ON a.trip_id = d.trip_id 
    AND a.departure_date = COALESCE(d.start_date, d.date)
WHERE d.max_capacity != a.seats_total 
    AND a.seats_total > 0;
