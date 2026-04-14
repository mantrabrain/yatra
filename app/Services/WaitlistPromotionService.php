<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\AvailabilityRepository;
use Yatra\Repositories\BookingRepository;

/**
 * Promotes waitlist bookings to pending/confirmed when seats become available.
 */
final class WaitlistPromotionService
{
    /** @var int */
    private static $promotionDepth = 0;

    private const MAX_PROMOTION_CHAIN = 25;

    /**
     * Called after availability inventory sync. Promotes one waiter per invocation;
     * nested inventory sync continues the chain until seats or waiters run out.
     */
    public static function processAvailableSlots(int $tripId, int $availabilityId): void
    {
        if (self::$promotionDepth >= self::MAX_PROMOTION_CHAIN) {
            return;
        }

        if ($tripId <= 0 || $availabilityId <= 0) {
            return;
        }

        self::$promotionDepth++;
        try {
            $availRepo = new AvailabilityRepository();
            $availability = $availRepo->find($availabilityId);
            if (!$availability) {
                return;
            }

            $seatsFree = (int) ($availability->seats_available ?? 0);
            if ($seatsFree < 1) {
                return;
            }

            $bookingRepo = new BookingRepository();
            $waiters = $bookingRepo->findWaitlistBookingsForAvailability($availabilityId, 1);
            if ($waiters === []) {
                return;
            }

            $booking = $waiters[0];
            $bookingId = (int) ($booking->id ?? 0);
            $need = max(1, (int) ($booking->travelers_count ?? 1));

            if ($need > $seatsFree) {
                return;
            }

            if (!apply_filters('yatra_waitlist_before_promote_booking', true, $bookingId, $tripId, $availabilityId)) {
                return;
            }

            $auto = SettingsService::isEnabled('waitlist_auto_confirm');
            $newStatus = $auto ? 'confirmed' : 'pending';

            $availRepo->incrementSeatsWaitlist($availabilityId, -$need);

            $update = [
                'status' => $newStatus,
            ];
            if ($newStatus === 'confirmed') {
                $update['confirmed_at'] = current_time('mysql');
            }

            $bookingRepo->update($bookingId, $update);

            do_action('yatra_booking_status_changed', $bookingId, 'waitlist', $newStatus);
            do_action('yatra_waitlist_booking_promoted', $bookingId, $tripId, $availabilityId, $newStatus);

            if (SettingsService::isEnabled('booking_confirmation')) {
                $bs = new BookingService();
                $bs->sendNewBookingTransactionalConfirmation($bookingId);
            }
        } finally {
            self::$promotionDepth--;
        }
    }
}
