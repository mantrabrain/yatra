<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Mint + verify magic-link tokens for guest-email verification.
 *
 * Each token encodes (booking_id, email_hash, expiry) signed with
 * an HMAC over a wp_salt('auth')-derived key. Validation rejects
 * tokens that:
 *   - have an invalid HMAC (forged or tampered with)
 *   - have expired
 *   - don't match the booking's stored contact email
 *
 * Why not just `wp_create_nonce`: nonces are short-lived (~24h) and
 * scoped to a `(user_id, action)` pair. Guest verification needs
 * (a) per-booking specificity so a token for booking A can't
 * verify booking B, (b) a customizable expiry window (operators
 * may want 1h or 7d), and (c) stateless verification — no DB read
 * to validate the signature itself.
 *
 * Format: `<booking_id>.<expiry_ts>.<email_prefix>.<hmac_hex>`
 *   - `booking_id` lets the verify endpoint look up the booking row
 *     without exposing customer info in the URL.
 *   - `expiry_ts` is Unix seconds (so we can validate without a DB
 *     round-trip to read a per-booking expiry column).
 *   - `email_prefix` is the first 8 hex chars of sha256(email).
 *     Lets verify() bind the token to a specific email even though
 *     we look up the booking by id. Without this, an attacker who
 *     intercepted one verification URL could potentially craft
 *     verification for a different email associated with the same
 *     booking (e.g. an admin-edited address).
 *   - `hmac_hex` is the truncated HMAC-SHA256 over the three parts.
 *
 * All four parts are URL-safe (digits + dot separator + hex).
 *
 * @package Yatra\Services
 * @since 3.0.5
 */
final class GuestVerificationTokenService
{
    /**
     * Default expiry window — 48 hours. Operators can change via
     * the `yatra_guest_verification_ttl_seconds` filter (e.g. tighten
     * to 1h for high-security setups, loosen to 7d for slow-deciding
     * customers).
     */
    private const DEFAULT_TTL_SECONDS = 48 * 3600;

    /**
     * Mint a token for the given booking + email. Returns a URL-safe
     * string the caller embeds in the verification magic link.
     */
    public static function mint(int $bookingId, string $email, ?int $ttlSeconds = null): string
    {
        $ttl = $ttlSeconds !== null && $ttlSeconds > 0
            ? $ttlSeconds
            : (int) apply_filters('yatra_guest_verification_ttl_seconds', self::DEFAULT_TTL_SECONDS);

        $expiry = time() + $ttl;
        $emailPrefix = self::emailPrefix($email);

        $payload = $bookingId . '.' . $expiry . '.' . $emailPrefix;
        $hmac = self::hmac($payload);

        return $payload . '.' . $hmac;
    }

    /**
     * Verify a token against a booking row.
     *
     * Returns a structured result so callers can distinguish
     * "expired" from "tampered with" from "wrong booking" — useful
     * for clear UX messaging on the verify page.
     *
     * @return array{ok: bool, reason?: string, booking_id?: int}
     */
    public static function verify(string $token, string $expectedEmail): array
    {
        if ($token === '') {
            return ['ok' => false, 'reason' => 'empty_token'];
        }
        $parts = explode('.', $token);
        if (\count($parts) !== 4) {
            return ['ok' => false, 'reason' => 'malformed_token'];
        }
        [$bookingIdStr, $expiryStr, $emailPrefix, $providedHmac] = $parts;

        if (!ctype_digit($bookingIdStr) || !ctype_digit($expiryStr)) {
            return ['ok' => false, 'reason' => 'malformed_token'];
        }
        $bookingId = (int) $bookingIdStr;
        $expiry = (int) $expiryStr;

        // HMAC check FIRST — every other check below leaks no info
        // about the booking if the signature is invalid.
        $payload = $bookingId . '.' . $expiry . '.' . $emailPrefix;
        $expectedHmac = self::hmac($payload);
        if (!hash_equals($expectedHmac, $providedHmac)) {
            return ['ok' => false, 'reason' => 'invalid_signature'];
        }

        if (time() >= $expiry) {
            return ['ok' => false, 'reason' => 'expired', 'booking_id' => $bookingId];
        }

        if ($expectedEmail !== '' && self::emailPrefix($expectedEmail) !== $emailPrefix) {
            // The booking's contact email changed since the token
            // was minted. Reject — the operator (or attacker) edited
            // the address; the original recipient is no longer the
            // person being asked to verify.
            return ['ok' => false, 'reason' => 'email_changed', 'booking_id' => $bookingId];
        }

        return ['ok' => true, 'booking_id' => $bookingId];
    }

    /**
     * Build the absolute verification URL the email's magic-link
     * button points at. Goes through the REST API namespace so it's
     * available even before WP rewrites are flushed on a fresh
     * install.
     */
    public static function buildVerifyUrl(int $bookingId, string $email, ?int $ttlSeconds = null): string
    {
        $token = self::mint($bookingId, $email, $ttlSeconds);
        return add_query_arg(
            ['token' => $token],
            rest_url('yatra/v1/booking/verify-email')
        );
    }

    /**
     * Truncated sha256 of the email — 8 hex chars (32 bits) is
     * enough to bind a token to a specific address without leaking
     * the address itself. Collision risk is irrelevant because we
     * still confirm full equality of `expectedEmail` against the
     * booking row inside verify().
     */
    private static function emailPrefix(string $email): string
    {
        return substr(hash('sha256', strtolower(trim($email))), 0, 8);
    }

    /**
     * HMAC-SHA256 truncated to 16 hex chars (64 bits). Enough to
     * prevent forgery while keeping the URL short. The key derives
     * from `wp_salt('auth')` so it rotates with WP_AUTH_KEY changes.
     */
    private static function hmac(string $payload): string
    {
        $key = wp_salt('auth') . '|yatra_guest_email_verification';
        return substr(hash_hmac('sha256', $payload, $key), 0, 16);
    }
}
