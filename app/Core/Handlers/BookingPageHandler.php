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
                if ($trip && !empty($trip->featured_image)) {
                    if (is_numeric($trip->featured_image)) {
                        $imgUrl = wp_get_attachment_url((int) $trip->featured_image);
                        if ($imgUrl) {
                            $trip->featured_image = $imgUrl;
                        }
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
                error_log('BookingPageHandler: enabled_gateways count = ' . count($enabled_gateways));
                if (!empty($enabled_gateways)) {
                    error_log('BookingPageHandler: gateway IDs = ' . implode(', ', array_keys($enabled_gateways)));
                }
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
                    // amounts for templates
                    'total_amount' => $session['total_amount'] ?? null,
                    'amount_paid' => $session['amount_paid'] ?? null,
                    'remaining_amount' => $session['remaining_amount'] ?? null,
                    'booking_reference' => $session['booking_reference'] ?? null,
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
