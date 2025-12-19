<?php
/**
 * Debug script to check availability dates for trip ID 68
 */

// Include WordPress
require_once('../../../wp-config.php');

global $wpdb;

echo "<h2>Debug: Availability Dates for Trip ID 68</h2>";

// Check all availability dates for trip 68
$table = $wpdb->prefix . 'yatra_trip_availability_dates';
$results = $wpdb->get_results(
    $wpdb->prepare("SELECT id, departure_date, status, seats_total, seats_available FROM {$table} WHERE trip_id = %d ORDER BY departure_date ASC", 68)
);

echo "<h3>All Availability Dates in Database:</h3>";
echo "<table border='1'>";
echo "<tr><th>ID</th><th>Departure Date</th><th>Status</th><th>Total Seats</th><th>Available Seats</th></tr>";

foreach ($results as $row) {
    echo "<tr>";
    echo "<td>" . $row->id . "</td>";
    echo "<td>" . $row->departure_date . "</td>";
    echo "<td>" . $row->status . "</td>";
    echo "<td>" . $row->seats_total . "</td>";
    echo "<td>" . $row->seats_available . "</td>";
    echo "</tr>";
}
echo "</table>";

echo "<p><strong>Total records found: " . count($results) . "</strong></p>";

// Test SingleTripController
echo "<h3>SingleTripController Test:</h3>";
require_once('../app/Controllers/SingleTripController.php');
$controller = new \Yatra\Controllers\SingleTripController();
$trip_data = $controller->getById(68);

if ($trip_data) {
    echo "<p>Trip loaded successfully</p>";
    echo "<p>Availability dates from controller: " . count($trip_data->availability_dates) . "</p>";
    
    echo "<table border='1'>";
    echo "<tr><th>ID</th><th>Departure Date</th><th>Status</th><th>Total Seats</th><th>Available Seats</th></tr>";
    
    foreach ($trip_data->availability_dates as $avail) {
        echo "<tr>";
        echo "<td>" . $avail->id . "</td>";
        echo "<td>" . $avail->departure_date . "</td>";
        echo "<td>" . ($avail->status ?? 'N/A') . "</td>";
        echo "<td>" . $avail->seats_total . "</td>";
        echo "<td>" . $avail->seats_available . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>Failed to load trip data</p>";
}

// Test TripRepository
echo "<h3>TripRepository Test:</h3>";
require_once('../app/Repositories/TripRepository.php');
$repo = new \Yatra\Repositories\TripRepository();
$trip = $repo->find(68);

if ($trip) {
    echo "<p>Trip loaded from repository</p>";
    echo "<p>Availability dates from repository: " . count($trip->availability_dates) . "</p>";
} else {
    echo "<p>Failed to load trip from repository</p>";
}

echo "<h3>Current Date:</h3>";
echo "<p>" . date('Y-m-d') . "</p>";
?>
