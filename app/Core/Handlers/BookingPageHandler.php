<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Services\SettingsService;

/**
 * Booking Page Handler
 *
 * Handles booking page requests
 */
class BookingPageHandler extends BasePageHandler
{
    /**
     * Handle booking page request
     *
     * @param array $route_data Route data from RouteMatcher
     * @return bool True if handled successfully
     */
    public function handle(array $route_data): bool
    {
        // Check if custom booking page is enabled
        if (SettingsService::useCustomBookingPage()) {
            return false;
        }

        $page = $route_data['page'] ?? 'main';
        $base = $route_data['base'];

        // Prevent 404 handling
        $this->prevent404();

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_booking_page' => $page,
        ]);

        // Hydrate global $booking from session so templates don't crash
        $booking = null;
        if (function_exists('yatra_get_booking_session')) {
            $session = yatra_get_booking_session();
            
            // If no session exists, initialize with defaults for display purposes
            // This allows logged-out users to see pricing without "Contact for pricing" error
            if (empty($session) || empty($session['trip_id'])) {
                // Try to get trip_id from URL parameters (for direct booking page access)
                $trip_id = isset($_GET['trip_id']) ? (int) $_GET['trip_id'] : null;
                
                if ($trip_id) {
                    // Initialize minimal session for pricing display
                    $session = [
                        'trip_id' => $trip_id,
                        'travelers' => 1, // Default to 1 traveler
                        'travel_date' => '',
                        'timestamp' => time(),
                    ];
                }
            }
            
            if (!empty($session) && !empty($session['trip_id'])) {
                // Load trip for display context
                try {
                    $tripRepo = new \Yatra\Repositories\TripRepository();
                    $trip = $tripRepo->findPublished((int) $session['trip_id']);
                } catch (\Throwable $e) {
                    $trip = null;
                }

                // Ensure trip has a price property for templates
                if ($trip && !isset($trip->price)) {
                    $price = null;
                    if (!empty($trip->discounted_price)) {
                        $price = (float) $trip->discounted_price;
                    } elseif (!empty($trip->sale_price)) {
                        $price = (float) $trip->sale_price;
                    } elseif (!empty($trip->original_price)) {
                        $price = (float) $trip->original_price;
                    }
                    $trip->price = $price;
                }

                // Ensure trip has a usable featured_image URL (not attachment ID)
                if ($trip) {
                    // If featured_image is not set, try to get it from WordPress
                    if (empty($trip->featured_image) && !empty($trip->id)) {
                        $attachment_id = get_post_thumbnail_id($trip->id);
                        if ($attachment_id) {
                            $trip->featured_image = $attachment_id;
                        }
                    }
                    
                    // Convert attachment ID to URL if needed
                    if (!empty($trip->featured_image) && is_numeric($trip->featured_image)) {
                        $imgUrl = wp_get_attachment_url((int) $trip->featured_image);
                        if ($imgUrl) {
                            $trip->featured_image = $imgUrl;
                        } else {
                            // If attachment URL fails, use placeholder
                            $trip->featured_image = plugins_url('assets/images/trip-placeholder.svg', YATRA_PLUGIN_FILE);
                        }
                    } elseif (empty($trip->featured_image)) {
                        // No featured image at all, use placeholder
                        $trip->featured_image = plugins_url('assets/images/trip-placeholder.svg', YATRA_PLUGIN_FILE);
                    }
                }

                // Load trip attributes for booking page display
                if ($trip && !empty($trip->id)) {
                    try {
                        $singleTripController = new \Yatra\Controllers\SingleTripController();
                        // Use reflection to access private method
                        $reflection = new \ReflectionClass($singleTripController);
                        $method = $reflection->getMethod('getTripAttributes');
                        $method->setAccessible(true);
                        $trip->attributes = $method->invoke($singleTripController, (int) $trip->id);
                    } catch (\Throwable $e) {
                        $trip->attributes = [];
                    }
                }

                // Resolve enabled gateways - always get full gateway data from registry
                $gatewayRegistry = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance();
                $availableGateways = $gatewayRegistry->getForCheckout();
                $enabled_gateways = [];
                
                // Get gateway IDs from session (if any)
                $session_gateway_ids = $session['enabled_gateways'] ?? [];
                
                // If session has gateway IDs (as strings), filter available gateways
                if (!empty($session_gateway_ids) && is_array($session_gateway_ids)) {
                    // Check if session has full gateway data or just IDs
                    $first_item = reset($session_gateway_ids);
                    if (is_array($first_item) && isset($first_item['id'])) {
                        // Session has full gateway data
                        $enabled_gateways = $session_gateway_ids;
                    } else {
                        // Session has just IDs, resolve to full gateway data
                        foreach ($availableGateways as $gateway) {
                            if (!empty($gateway['id']) && in_array($gateway['id'], $session_gateway_ids)) {
                                $enabled_gateways[$gateway['id']] = $gateway;
                            }
                        }
                    }
                } else {
                    // No session gateways, use all available gateways
                    foreach ($availableGateways as $gateway) {
                        if (!empty($gateway['id'])) {
                            $enabled_gateways[$gateway['id']] = $gateway;
                        }
                    }
                }

                // Debug log to verify gateways are being resolved
                if (!empty($enabled_gateways)) {
                    }
                // Calculate pricing using CalculationService (single source of truth)
                $calculationService = new \Yatra\Services\CalculationService();
                $pricing_calculation = [];
                
                // Get coupon code from session if available
                $coupon_code = isset($session['coupon']['code']) ? $session['coupon']['code'] : '';
                
                try {
                    $pricing_calculation = $calculationService->calculateFromSession($session, $coupon_code);
                } catch (\Throwable $e) {
                    // If calculation fails, set empty pricing
                    $pricing_calculation = [
                        'base_amount' => 0,
                        'gross_total' => 0,
                        'final_total' => 0,
                        'amount_due' => 0,
                        'tax_calculation' => [
                            'tax_breakdown' => [],
                            'total_tax_amount' => 0,
                            'tax_inclusive' => false,
                        ],
                    ];
                }
                
                // Get itinerary costs (premium feature)
                $trip_id = (int) $session['trip_id'];
                $total_travelers = (int) ($session['travelers'] ?? 1);
                $traveler_counts = $session['traveler_counts'] ?? [];
                $travel_date = $session['travel_date'] ?? '';
                
                $itinerary_costs = apply_filters('yatra_booking_itinerary_costs', [], $trip_id, $total_travelers, $traveler_counts, $travel_date);
                $itinerary_costs_total = 0.0;
                
                foreach ($itinerary_costs as $cost) {
                    $basePrice = (float) ($cost['price'] ?? 0);
                    $pricePer = $cost['price_per'] ?? 'person';
                    
                    switch ($pricePer) {
                        case 'person':
                            $calculatedPrice = $basePrice * $total_travelers;
                            break;
                        case 'group':
                            $calculatedPrice = $basePrice;
                            break;
                        case 'day':
                            $duration_days = (int) ($trip->duration_days ?? 1);
                            $calculatedPrice = $basePrice * $duration_days;
                            break;
                        default:
                            $calculatedPrice = $basePrice;
                            break;
                    }
                    
                    $itinerary_costs_total += $calculatedPrice;
                }
                
                // Add itinerary costs to pricing calculation
                $pricing_calculation['itinerary_costs'] = $itinerary_costs;
                $pricing_calculation['itinerary_costs_total'] = $itinerary_costs_total;
                
                // Note: CalculationService already includes itinerary costs in final_total and amount_due
                // No need to add them again here
                
                // Create Checkout model instance
                $checkout = new \Yatra\Models\Checkout($trip, $session, $pricing_calculation);
                
                // Build booking view model expected by templates
                $booking = (object) [
                    'trip' => $trip,
                    'travel_date' => $session['travel_date'] ?? '',
                    'travelers' => $session['travelers'] ?? 0,
                    'pricing_type' => $session['pricing_type'] ?? 'regular',
                    'price_types' => $session['price_types'] ?? [],
                    'traveler_counts' => $session['traveler_counts'] ?? [],
                    'partial_payment' => $session['partial_payment'] ?? null,
                    'partial_payment_percentage' => $session['partial_payment_percentage'] ?? null,
                    'deposit_required' => $session['deposit_required'] ?? null,
                    'deposit_percentage' => $session['deposit_percentage'] ?? null,
                    'enabled_gateways' => $enabled_gateways,
                    'group_discount' => $session['group_discount'] ?? null,
                    // Pre-calculated pricing data
                    'pricing_calculation' => $pricing_calculation,
                    'tax_calculation' => $pricing_calculation['tax_calculation'] ?? [],
                    // amounts for templates
                    'total_amount' => $session['total_amount'] ?? null,
                    'amount_paid' => $session['amount_paid'] ?? null,
                    'remaining_amount' => $session['remaining_amount'] ?? null,
                    'booking_reference' => $session['booking_reference'] ?? null,
                    // Checkout model for clean template access
                    'checkout' => $checkout,
                ];
            }
        }

        if ($booking !== null) {
            $this->setGlobal('booking', $booking);
        }

        // Load the booking page template
        $template_path = YATRA_PLUGIN_PATH . 'templates/booking.php';

        if (!file_exists($template_path)) {
            $this->logError("Booking template not found: {$template_path}");
            return false;
        }

        include $template_path;
        $this->exit();

        return true;
    }
}
