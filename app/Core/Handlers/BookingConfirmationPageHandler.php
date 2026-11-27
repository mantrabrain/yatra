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
            // Keep the virtual post ID at 0 (like the account/login/booking
            // handlers). Using the booking row id made get_queried_object_id()
            // collide with a real wp_posts row of the same id, so SEO plugins /
            // WordPress emitted THAT page's title, description and OG tags on the
            // confirmation page. The booking is read from the `yatra_booking`
            // global, so no queried-object id is needed here.
            'object_id' => 0,
            'post_type' => 'page',
            'post_name' => $confirmation_id,
        ]);

        // Set up global booking object
        $this->setGlobal('yatra_booking', self::inVisitorLanguage($booking));

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
                        $this->setGlobal('yatra_booking', self::inVisitorLanguage($booking));
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

        $booking = $this->confirmRedirectGatewayReturn($booking, $bookingRepo, (string) $confirmation_id);

        return $this->selectTemplate('booking-confirmation', null, 'booking-confirmation');
    }

    /**
     * A customer back from a redirect gateway (Mollie, Paystack, …) lands
     * here, and nothing else records the payment if the gateway's webhook
     * can't reach the site (or is late). Ask the gateway about the payment
     * started at checkout and record it before the page renders.
     *
     * Only for gateways that declare it (`confirmsOnReturn()`), so PayPal,
     * Stripe and offline methods keep their own paths. Every check of the
     * public confirm endpoint applies, and a recorded payment is never
     * recorded twice. At most one lookup per booking every 20 seconds.
     */
    private function confirmRedirectGatewayReturn(object $booking, BookingRepository $bookingRepo, string $confirmationId): object
    {
        try {
            $gatewayId = sanitize_key((string) ($booking->payment_gateway ?? ''));
            $sessionId = trim((string) ($booking->payment_session_id ?? ''));
            if ($gatewayId === '' || $sessionId === '' || (string) ($booking->payment_status ?? '') === 'paid'
                || !class_exists('\\Yatra\\PaymentGateways\\PaymentGatewayRegistry')) {
                return $booking;
            }

            $gateway = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance()->get($gatewayId);
            if (!$gateway || !method_exists($gateway, 'confirmsOnReturn') || !$gateway->confirmsOnReturn()) {
                return $booking;
            }

            $throttle = 'yatra_return_check_' . (int) $booking->id;
            if (get_transient($throttle)) {
                return $booking;
            }
            set_transient($throttle, 1, 20);

            $controller = new \Yatra\Controllers\PaymentGatewayController();
            if (!$controller->confirmVerifiedGatewayPayment($gatewayId, $sessionId, (int) $booking->id)) {
                return $booking;
            }

            $reloaded = $bookingRepo->findByConfirmationSegment($confirmationId);
            if ($reloaded) {
                $booking = $reloaded;
                $this->setGlobal('yatra_booking', self::inVisitorLanguage($booking));
                $this->setQueryVars([
                    'yatra_booking_confirmation' => $confirmationId,
                    'yatra_booking' => $booking,
                ]);
            }
        } catch (\Throwable $e) {
            // Best effort: the page still renders; the webhook can reconcile.
        }

        return $booking;
    }

    /**
     * The booking as shown on the confirmation page: the trip title in the
     * visitor's language (WPML / Polylang).
     *
     * @param mixed $booking
     * @return mixed
     */
    private static function inVisitorLanguage($booking)
    {
        if (!is_object($booking) || empty($booking->trip_title) || empty($booking->trip_id)
            || !class_exists(\Yatra\Multilingual\Multilingual::class) || !\Yatra\Multilingual\Multilingual::isTranslating()) {
            return $booking;
        }
        $copy = clone $booking;
        $copy->trip_title = \Yatra\Multilingual\Multilingual::translate(
            (string) $booking->trip_title,
            \Yatra\Multilingual\TripStrings::hint((int) $booking->trip_id, 'title')
        );

        return $copy;
    }
}
