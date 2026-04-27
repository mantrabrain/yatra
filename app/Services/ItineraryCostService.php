<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\ItineraryRepository;

/**
 * Itinerary Cost Service
 * 
 * Handles calculation and retrieval of itinerary costs for booking
 * This is a free feature that calculates costs from itinerary activities
 * 
 * @package Yatra\Services
 * @since 3.0.0
 */
class ItineraryCostService
{
    private ItineraryRepository $itineraryRepository;
    private static ?self $instance = null;
    
    public function __construct()
    {
        $this->itineraryRepository = new ItineraryRepository();
    }
    
    /**
     * Initialize the service (singleton pattern)
     */
    public static function init(): void
    {
        if (self::$instance === null) {
            self::$instance = new self();
            
            // Register the filter hooks only once
            add_filter('yatra_booking_itinerary_costs', [self::$instance, 'getItineraryCosts'], 10, 5);
            add_filter('yatra_booking_details', [self::$instance, 'addItineraryCostsToBookingDetails'], 10, 2);
            add_filter('yatra_booking_get_services', [self::$instance, 'getItineraryCostsAsServices'], 10, 2);
        }
    }
    
    /**
     * Get itinerary costs for a trip booking
     * 
     * @param array $costs Empty array (filter default)
     * @param int $tripId Trip ID
     * @param int $totalTravelers Total number of travelers
     * @param array $travelerCounts Traveler counts by category
     * @param string $travelDate Travel date
     * @return array Array of itinerary costs with pricing
     */
    public function getItineraryCosts(array $costs, int $tripId, int $totalTravelers, array $travelerCounts, string $travelDate): array
    {
        try {
            $itineraryEntries = $this->itineraryRepository->getByTripId($tripId);
            $itineraryCosts = [];
            
            foreach ($itineraryEntries as $entry) {
                // Only include entries that have a cost
                if (empty($entry->cost) || $entry->cost <= 0) {
                    continue;
                }
                
                // Skip day entries (item_type_id = 0) - only include actual activities
                if (empty($entry->item_type_id) || $entry->item_type_id == 0) {
                    continue;
                }
                
                $costPerPerson = !empty($entry->cost_per_person);
                $basePrice = (float) $entry->cost;
                
                // Calculate total cost based on pricing type
                if ($costPerPerson) {
                    $totalCost = $basePrice * $totalTravelers;
                    $pricePer = 'person';
                } else {
                    $totalCost = $basePrice;
                    $pricePer = 'group';
                }
                
                $itineraryCosts[] = [
                    'id' => $entry->id,
                    'name' => $entry->title ?: $entry->item_type ?: $entry->item_name ?: 'Itinerary Activity',
                    'description' => $entry->description ?? '',
                    'price' => $basePrice,
                    'price_per' => $pricePer,
                    'total_cost' => $totalCost,
                    'cost_per_person' => $costPerPerson,
                    'item_type' => $entry->item_type,
                    'day_number' => $entry->day_number,
                ];
            }
            
            //  
            
            return $itineraryCosts;
            
        } catch (\Exception $e) {
            return [];
        }
    }
    
    /**
     * Add itinerary costs to booking details for admin display
     * 
     * @param array $bookingDetails Booking details array
     * @param int $bookingId Booking ID
     * @return array Updated booking details
     */
    public function addItineraryCostsToBookingDetails(array $bookingDetails, int $bookingId): array
    {
        try {
            $tripId = (int) ($bookingDetails['trip_id'] ?? 0);
            $travelersCount = (int) ($bookingDetails['travelers_count'] ?? 1);
            
            if ($tripId <= 0) {
                return $bookingDetails;
            }
            
            // Get itinerary costs for this booking
            $itineraryCosts = $this->getItineraryCosts([], $tripId, $travelersCount, [], $bookingDetails['travel_date'] ?? '');
            
            // Calculate total
            $itineraryCostsTotal = array_sum(array_column($itineraryCosts, 'total_cost'));
            
            // Add to booking details
            $bookingDetails['itinerary_costs'] = $itineraryCosts;
            $bookingDetails['itinerary_costs_total'] = $itineraryCostsTotal;
            
            //  
            
        } catch (\Exception $e) {
        }
        
        return $bookingDetails;
    }
    
    /**
     * Get itinerary costs formatted as services for admin display
     * 
     * @param array $services Existing services array
     * @param int $bookingId Booking ID
     * @return array Updated services array with itinerary costs
     */
    public function getItineraryCostsAsServices(array $services, int $bookingId): array
    {
        try {
            // Get booking details directly from database to avoid potential loops
            global $wpdb;
            $table_name = $wpdb->prefix . 'yatra_new_bookings';
            
            $booking = $wpdb->get_row($wpdb->prepare(
                "SELECT trip_id, travelers_count, travel_date, itinerary_costs FROM {$table_name} WHERE id = %d",
                $bookingId
            ));
            
            if (!$booking) {
                return $services;
            }
            
            $tripId = (int) $booking->trip_id;
            $travelersCount = (int) $booking->travelers_count;
            
            if ($tripId <= 0) {
                return $services;
            }
            
            // Try to get itinerary costs from stored data first
            $itineraryCosts = [];
            if (!empty($booking->itinerary_costs)) {
                $itineraryCosts = json_decode($booking->itinerary_costs, true) ?: [];
            }
            
            // If no stored costs, calculate them
            if (empty($itineraryCosts)) {
                $itineraryCosts = $this->getItineraryCosts([], $tripId, $travelersCount, [], $booking->travel_date ?? '');
            }
            
            // Format as services for admin display
            foreach ($itineraryCosts as $cost) {
                $services[] = [
                    'id' => $cost['id'],
                    'name' => $cost['name'],
                    'type' => 'itinerary_cost',
                    'price' => $cost['price'],
                    'price_per' => $cost['price_per'],
                    'total_cost' => $cost['total_cost'],
                    'quantity' => $cost['price_per'] === 'person' ? $travelersCount : 1,
                    'calculated_price' => $cost['total_cost'],
                    'description' => $cost['description'] ?? '',
                    'day_number' => $cost['day_number'] ?? null,
                    'item_type' => $cost['item_type'] ?? '',
                ];
            }
            
            //  
            
        } catch (\Exception $e) {
        }
        
        return $services;
    }
}
