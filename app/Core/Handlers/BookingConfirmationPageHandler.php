<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Repositories\BookingRepository;

/**
 * Booking Confirmation Page Handler
 *
 * Handles booking confirmation page requests
 */
class BookingConfirmationPageHandler extends BasePageHandler
{
    /**
     * Handle booking confirmation page request
     *
     * @param array $route_data Route data from RouteMatcher
     * @return bool True if handled successfully
     */
    public function handle(array $route_data): bool
    {
        $confirmation_id = (string) ($route_data['confirmation_id'] ?? '');

        $bookingRepo = new BookingRepository();
        $booking = $bookingRepo->findByConfirmationSegment($confirmation_id);

        if (!$booking) {
            return false;
        }

        // Configure $wp_query + virtual WP_Post so FSE block themes don't fall back to 404.html.
        $this->setupPageEnvironment('singular', [
            'title' => __('Booking Confirmation', 'yatra'),
            'object_id' => (int) ($booking->id ?? 0),
            'post_type' => 'page',
            'post_name' => $confirmation_id,
        ]);

        // Set up global booking object
        $this->setGlobal('yatra_booking', $booking);

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_booking_confirmation' => $confirmation_id,
            'yatra_booking' => $booking,
        ]);

        // Ensure the payment gateways are registered before the template renders.
        // Gateways attach their confirmation-page hooks (e.g. Bank Transfer's
        // `yatra_booking_confirmation_after_details` renderer) in their
        // constructors, which only run once the registry is built. Without this,
        // the confirmation page fires the hook with no gateway listening, so the
        // bank-transfer account details never appear.
        if (class_exists('\\Yatra\\PaymentGateways\\PaymentGatewayRegistry')) {
            \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance();
        }

        // Process a PayPal return before the template renders. PayPal redirects
        // the buyer back here with `?paypal=success` (a param only PayPal sets),
        // so this runs only on a genuine PayPal return and affects nothing else.
        // For Advanced mode it captures the approved order and confirms the
        // booking; for Simple mode it is a no-op (the IPN webhook confirms).
        // Idempotency is guaranteed by the gateway (paid-guard + transaction-id).
        if (isset($_GET['paypal']) && sanitize_key((string) $_GET['paypal']) === 'success'
            && class_exists('\\Yatra\\PaymentGateways\\PaymentGatewayRegistry')) {
            $paypal = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance()->get('paypal');
            if ($paypal && method_exists($paypal, 'handlePaymentReturn')) {
                try {
                    $paypal->handlePaymentReturn($booking, $bookingRepo);
                    $reloaded = $bookingRepo->findByConfirmationSegment($confirmation_id);
                    if ($reloaded) {
                        $booking = $reloaded;
                        $this->setGlobal('yatra_booking', $booking);
                        $this->setQueryVars([
                            'yatra_booking_confirmation' => $confirmation_id,
                            'yatra_booking' => $booking,
                        ]);
                    }
                } catch (\Throwable $e) {
                    // Best-effort: the page still renders; the webhook can reconcile.
                }
            }
        }

        return $this->selectTemplate('booking-confirmation', null, 'booking-confirmation');
    }
}
