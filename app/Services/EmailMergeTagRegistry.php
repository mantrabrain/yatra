<?php
/**
 * Central registry of email merge tags.
 *
 * The single source of truth for every {{tag}} an operator can put inside
 * an email subject or body. Defines the tag's label, description, category
 * and sample value, plus which automation events resolve it at send time.
 *
 * Consumed by:
 *   - {@see \YatraPro\Modules\EmailAutomation\Services\EmailAutomationService}
 *     for the Template Editor's "Available Variables" sidebar and for
 *     preview-sample defaults — instead of maintaining a parallel catalogue.
 *   - {@see \YatraPro\Modules\EmailAutomation\Support\EmailAutomationEvents}
 *     to derive each event's variable whitelist, so adding a new tag to
 *     the registry automatically surfaces it on the events that resolve it.
 *
 * To add a new tag: append a row in {@see self::definitions()} with the
 * event keys that actually inject the value, then make the renderer
 * (`variablesFromBooking`, etc.) inject it. Both ends stay in sync.
 *
 * @package Yatra\Services
 * @since 3.0.5
 */

declare(strict_types=1);

namespace Yatra\Services;

final class EmailMergeTagRegistry
{
    public const CATEGORY_GENERAL = 'general';
    public const CATEGORY_CUSTOMER = 'customer';
    public const CATEGORY_BOOKING = 'booking';
    public const CATEGORY_PAYMENT = 'payment';
    public const CATEGORY_SCHEDULED_PAYMENT = 'scheduled_payment';
    public const CATEGORY_ENQUIRY = 'enquiry';
    public const CATEGORY_TRIP_CONSENT = 'trip_consent';
    public const CATEGORY_ACCOUNT = 'account';
    public const CATEGORY_ABANDONED_RECOVERY = 'abandoned_recovery';
    public const CATEGORY_REMINDER = 'reminder';

    public const EVENT_BOOKING_CREATED = 'booking.created';
    public const EVENT_BOOKING_CONFIRMED = 'booking.confirmed';
    public const EVENT_BOOKING_CANCELLED = 'booking.cancelled';
    public const EVENT_BOOKING_COMPLETED = 'booking.completed';
    public const EVENT_BOOKING_EXPIRED = 'booking.expired';
    public const EVENT_PAYMENT_RECEIVED = 'payment.received';
    public const EVENT_PAYMENT_REMINDER = 'payment.reminder';
    public const EVENT_REMINDER_TRIP = 'reminder.trip';
    public const EVENT_ENQUIRY_CREATED = 'enquiry.created';
    public const EVENT_ENQUIRY_RESPONDED = 'enquiry.responded';
    public const EVENT_REVIEW_REQUEST = 'marketing.review_request';
    public const EVENT_CONSENT_REQUESTED = 'consent.requested';
    public const EVENT_ACCOUNT_EMAIL_VERIFICATION = 'account.email_verification';
    public const EVENT_SCHEDULED_PAYMENT_REMINDER = 'scheduled.payment.reminder';
    public const EVENT_SCHEDULED_PAYMENT_SUCCEEDED = 'scheduled.payment.succeeded';
    public const EVENT_SCHEDULED_PAYMENT_FAILED = 'scheduled.payment.failed';
    public const EVENT_BOOKING_ABANDONED_RECOVERY = 'booking.abandoned_recovery';

    /**
     * Every event that resolves a `variablesFromBooking()`-derived
     * booking context. Booking-context tags inherit this list so
     * the per-event whitelist stays in sync as events evolve.
     */
    private const BOOKING_CONTEXT_EVENTS = [
        self::EVENT_BOOKING_CREATED,
        self::EVENT_BOOKING_CONFIRMED,
        self::EVENT_BOOKING_CANCELLED,
        self::EVENT_BOOKING_COMPLETED,
        self::EVENT_BOOKING_EXPIRED,
        self::EVENT_PAYMENT_RECEIVED,
        self::EVENT_PAYMENT_REMINDER,
        self::EVENT_REMINDER_TRIP,
        self::EVENT_REVIEW_REQUEST,
        self::EVENT_SCHEDULED_PAYMENT_REMINDER,
        self::EVENT_SCHEDULED_PAYMENT_SUCCEEDED,
        self::EVENT_SCHEDULED_PAYMENT_FAILED,
    ];

    private const ENQUIRY_CONTEXT_EVENTS = [
        self::EVENT_ENQUIRY_CREATED,
        self::EVENT_ENQUIRY_RESPONDED,
    ];

    private const SCHEDULED_PAYMENT_EVENTS = [
        self::EVENT_SCHEDULED_PAYMENT_REMINDER,
        self::EVENT_SCHEDULED_PAYMENT_SUCCEEDED,
        self::EVENT_SCHEDULED_PAYMENT_FAILED,
    ];

    /**
     * Full merge-tag catalogue keyed by tag key.
     *
     * Each entry shape:
     *   - key (string)         — the literal token, e.g. `booking_reference`
     *   - label (string)       — human-readable label for the UI sidebar
     *   - description (string) — short hint shown under the label
     *   - category (string)    — bucket for grouping in the sidebar
     *   - sample (string)      — preview value when no real context is present
     *   - events (list|string) — automation events that inject this tag at
     *                            send time. Use the literal '*' to mark
     *                            event-independent tags (site_name, etc.).
     *
     * Filter `yatra_email_merge_tag_definitions` lets Pro modules / custom
     * integrations append their own tags without editing this method.
     *
     * @return array<string, array{key:string,label:string,description:string,category:string,sample:string,events:list<string>|string}>
     */
    public static function definitions(): array
    {
        $previewTok = defined('YATRA_EMAIL_VERIFICATION_PREVIEW_TOKEN')
            ? (string) YATRA_EMAIL_VERIFICATION_PREVIEW_TOKEN
            : 'preview-verify-token';
        $verificationSampleLink = function_exists('yatra_get_email_verification_url')
            ? yatra_get_email_verification_url($previewTok)
            : home_url('/?yatra_verify_email=' . rawurlencode($previewTok));

        $dateFormat = function_exists('get_option') ? (string) get_option('date_format') : 'Y-m-d';
        $sampleTravelDate = function_exists('date_i18n')
            ? date_i18n($dateFormat, strtotime('+30 days') ?: time())
            : date('Y-m-d', strtotime('+30 days') ?: time());
        $sampleDueDate = function_exists('date_i18n')
            ? date_i18n($dateFormat, strtotime('+14 days') ?: time())
            : date('Y-m-d', strtotime('+14 days') ?: time());

        $homeUrl = function_exists('home_url') ? home_url('/') : 'https://example.test/';
        $adminUrl = function_exists('admin_url') ? admin_url('admin.php?page=yatra') : $homeUrl . 'wp-admin/admin.php?page=yatra';
        $siteName = function_exists('get_bloginfo') ? (string) get_bloginfo('name') : 'Your Site';
        $adminEmail = function_exists('get_option') ? (string) get_option('admin_email') : 'admin@example.test';

        $bookingContextEvents = self::BOOKING_CONTEXT_EVENTS;
        $enquiryContextEvents = self::ENQUIRY_CONTEXT_EVENTS;
        $scheduledPaymentEvents = self::SCHEDULED_PAYMENT_EVENTS;

        $catalog = [
            // ---------------------------------------------------------
            // General — available to every event because parseTemplate
            // merges getDefaultVariables() over the caller's $variables.
            // ---------------------------------------------------------
            'site_name' => [
                'key' => 'site_name',
                'label' => 'Site Name',
                'description' => 'Your website name (from WordPress Site Title).',
                'category' => self::CATEGORY_GENERAL,
                'sample' => $siteName !== '' ? $siteName : 'Your Site',
                'events' => '*',
            ],
            'site_url' => [
                'key' => 'site_url',
                'label' => 'Site URL',
                'description' => 'Your website home URL.',
                'category' => self::CATEGORY_GENERAL,
                'sample' => $homeUrl,
                'events' => '*',
            ],
            'admin_email' => [
                'key' => 'admin_email',
                'label' => 'Admin Email',
                'description' => 'Site administrator email address.',
                'category' => self::CATEGORY_GENERAL,
                'sample' => $adminEmail !== '' ? $adminEmail : 'admin@example.test',
                'events' => '*',
            ],
            'admin_url' => [
                'key' => 'admin_url',
                'label' => 'Admin URL',
                'description' => 'Link to the Yatra admin dashboard.',
                'category' => self::CATEGORY_GENERAL,
                'sample' => $adminUrl,
                'events' => '*',
            ],
            'current_date' => [
                'key' => 'current_date',
                'label' => 'Current Date',
                'description' => "Today's date formatted per the site's date format.",
                'category' => self::CATEGORY_GENERAL,
                'sample' => function_exists('date_i18n') ? date_i18n($dateFormat) : date($dateFormat),
                'events' => '*',
            ],
            'current_year' => [
                'key' => 'current_year',
                'label' => 'Current Year',
                'description' => 'Current four-digit year.',
                'category' => self::CATEGORY_GENERAL,
                'sample' => date('Y'),
                'events' => '*',
            ],

            // ---------------------------------------------------------
            // Customer — produced by variablesFromBooking + variablesFromEnquiry
            // + the verification + consent + recovery senders.
            // ---------------------------------------------------------
            'customer_name' => [
                'key' => 'customer_name',
                'label' => 'Customer Name',
                'description' => 'Full name (first + last) of the customer / enquirer.',
                'category' => self::CATEGORY_CUSTOMER,
                'sample' => 'John Doe',
                'events' => array_merge(
                    $bookingContextEvents,
                    $enquiryContextEvents,
                    [
                        self::EVENT_ACCOUNT_EMAIL_VERIFICATION,
                        self::EVENT_BOOKING_ABANDONED_RECOVERY,
                    ]
                ),
            ],
            'customer_first_name' => [
                'key' => 'customer_first_name',
                'label' => 'First Name',
                'description' => 'Customer first name only.',
                'category' => self::CATEGORY_CUSTOMER,
                'sample' => 'John',
                'events' => array_merge(
                    $bookingContextEvents,
                    [self::EVENT_ACCOUNT_EMAIL_VERIFICATION]
                ),
            ],
            'customer_last_name' => [
                'key' => 'customer_last_name',
                'label' => 'Last Name',
                'description' => 'Customer last name only.',
                'category' => self::CATEGORY_CUSTOMER,
                'sample' => 'Doe',
                'events' => $bookingContextEvents,
            ],
            'customer_email' => [
                'key' => 'customer_email',
                'label' => 'Customer Email',
                'description' => 'Customer email address.',
                'category' => self::CATEGORY_CUSTOMER,
                'sample' => 'john.doe@example.com',
                'events' => array_merge(
                    $bookingContextEvents,
                    $enquiryContextEvents,
                    [
                        self::EVENT_ACCOUNT_EMAIL_VERIFICATION,
                        self::EVENT_BOOKING_ABANDONED_RECOVERY,
                    ]
                ),
            ],
            'customer_phone' => [
                'key' => 'customer_phone',
                'label' => 'Customer Phone',
                'description' => 'Customer phone number.',
                'category' => self::CATEGORY_CUSTOMER,
                'sample' => '+1 234 567 8900',
                'events' => array_merge($bookingContextEvents, $enquiryContextEvents),
            ],

            // ---------------------------------------------------------
            // Booking — core fields from variablesFromBooking + the rich
            // tags appended by BookingEmailRichMergeTags::forBooking.
            // ---------------------------------------------------------
            'booking_reference' => [
                'key' => 'booking_reference',
                'label' => 'Booking Reference',
                'description' => 'Customer-visible booking code (e.g. YTR-12345).',
                'category' => self::CATEGORY_BOOKING,
                'sample' => 'YTR-2024-001234',
                'events' => array_merge(
                    $bookingContextEvents,
                    [
                        self::EVENT_CONSENT_REQUESTED,
                        self::EVENT_BOOKING_ABANDONED_RECOVERY,
                    ]
                ),
            ],
            'booking_id' => [
                'key' => 'booking_id',
                'label' => 'Booking ID',
                'description' => 'Internal numeric booking identifier.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => '1234',
                'events' => $bookingContextEvents,
            ],
            'booking_url' => [
                'key' => 'booking_url',
                'label' => 'Booking URL',
                'description' => 'Link to view the booking in My Account.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => $homeUrl . 'my-account/bookings/1234',
                'events' => $bookingContextEvents,
            ],
            'booking_status' => [
                'key' => 'booking_status',
                'label' => 'Booking Status',
                'description' => 'pending / confirmed / cancelled / completed.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => 'confirmed',
                'events' => $bookingContextEvents,
            ],
            'payment_status' => [
                'key' => 'payment_status',
                'label' => 'Payment Status',
                'description' => 'unpaid / partial / paid / refunded.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => 'paid',
                'events' => $bookingContextEvents,
            ],
            'trip_name' => [
                'key' => 'trip_name',
                'label' => 'Trip Name',
                'description' => 'Title of the trip the booking / enquiry is for.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => 'Amazing Mountain Adventure',
                'events' => array_merge(
                    $bookingContextEvents,
                    $enquiryContextEvents,
                    [
                        self::EVENT_CONSENT_REQUESTED,
                        self::EVENT_BOOKING_ABANDONED_RECOVERY,
                    ]
                ),
            ],
            'trip_url' => [
                'key' => 'trip_url',
                'label' => 'Trip URL',
                'description' => 'Public link to the trip detail page.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => $homeUrl . 'trips/amazing-mountain-adventure',
                'events' => array_merge($bookingContextEvents, $enquiryContextEvents),
            ],
            'travel_date' => [
                'key' => 'travel_date',
                'label' => 'Travel Date',
                'description' => 'Departure date formatted per site settings.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => $sampleTravelDate,
                'events' => array_merge($bookingContextEvents, [self::EVENT_CONSENT_REQUESTED]),
            ],
            'travelers_count' => [
                'key' => 'travelers_count',
                'label' => 'Travelers Count',
                'description' => 'Number of travelers on the booking.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => '4',
                'events' => $bookingContextEvents,
            ],
            'travelers_list' => [
                'key' => 'travelers_list',
                'label' => 'Travelers List (plain)',
                'description' => 'Plain-text list of traveler names.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => "John Doe\nJane Doe",
                'events' => $bookingContextEvents,
            ],
            'travelers_list_html' => [
                'key' => 'travelers_list_html',
                'label' => 'Travelers List (HTML)',
                'description' => 'HTML-formatted list of traveler names.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => '<ul><li>John Doe</li><li>Jane Doe</li></ul>',
                'events' => $bookingContextEvents,
            ],
            'traveler_custom_fields_html' => [
                'key' => 'traveler_custom_fields_html',
                'label' => 'Traveler Custom Fields (HTML)',
                'description' => 'Dynamic Form Field answers per traveler, rendered as HTML.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => '',
                'events' => $bookingContextEvents,
            ],
            'booking_custom_fields_html' => [
                'key' => 'booking_custom_fields_html',
                'label' => 'Booking Custom Fields (HTML)',
                'description' => 'Booking-level Dynamic Form Field answers as HTML.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => '',
                'events' => $bookingContextEvents,
            ],
            'special_requests' => [
                'key' => 'special_requests',
                'label' => 'Special Requests (plain)',
                'description' => 'Customer-entered special requests text.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => 'Vegetarian meals please.',
                'events' => $bookingContextEvents,
            ],
            'special_requests_html' => [
                'key' => 'special_requests_html',
                'label' => 'Special Requests (HTML)',
                'description' => 'Special requests with line breaks preserved.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => 'Vegetarian meals please.',
                'events' => $bookingContextEvents,
            ],
            'cancellation_reason' => [
                'key' => 'cancellation_reason',
                'label' => 'Cancellation Reason',
                'description' => 'Reason recorded when the booking was cancelled.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => 'Change of plans',
                'events' => [self::EVENT_BOOKING_CANCELLED],
            ],
            'completion_date' => [
                'key' => 'completion_date',
                'label' => 'Completion Date',
                'description' => 'Date the trip / booking was marked completed.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => function_exists('date_i18n') ? date_i18n($dateFormat) : date($dateFormat),
                'events' => [self::EVENT_BOOKING_COMPLETED, self::EVENT_REVIEW_REQUEST],
            ],
            'expiry_policy_note' => [
                'key' => 'expiry_policy_note',
                'label' => 'Expiry Policy Note',
                'description' => 'Message shown when a booking auto-expires for non-payment.',
                'category' => self::CATEGORY_BOOKING,
                'sample' => 'This booking was automatically cancelled after the payment window expired.',
                'events' => [self::EVENT_BOOKING_EXPIRED],
            ],

            // ---------------------------------------------------------
            // Payment
            // ---------------------------------------------------------
            'total_amount_formatted' => [
                'key' => 'total_amount_formatted',
                'label' => 'Total Amount (formatted)',
                'description' => 'Total cost with currency symbol — preferred over total_amount.',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => '$2,500.00',
                'events' => $bookingContextEvents,
            ],
            // Alias of `total_amount_formatted` — exposed for templates
            // that use the short name. Renders identically (formatted
            // with currency) so admins can pick whichever reads
            // naturally in their copy.
            'total_amount' => [
                'key' => 'total_amount',
                'label' => 'Total Amount',
                'description' => 'Total cost with currency symbol (alias of total_amount_formatted).',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => '$2,500.00',
                'events' => $bookingContextEvents,
            ],
            'amount_due_formatted' => [
                'key' => 'amount_due_formatted',
                'label' => 'Amount Due (formatted)',
                'description' => 'Remaining balance with currency symbol.',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => '$2,000.00',
                'events' => $bookingContextEvents,
            ],
            // Aliases for the remaining balance — same value, different
            // common spellings. `{{balance_due}}` is the most common
            // legacy spelling in customer-edited templates; `amount_due`
            // (unformatted-looking name but actually formatted with
            // currency) matches the booking record column.
            'balance_due' => [
                'key' => 'balance_due',
                'label' => 'Balance Due',
                'description' => 'Remaining balance with currency symbol (alias of amount_due_formatted).',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => '$2,000.00',
                'events' => $bookingContextEvents,
            ],
            'amount_due' => [
                'key' => 'amount_due',
                'label' => 'Amount Due',
                'description' => 'Remaining balance with currency symbol (alias of amount_due_formatted).',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => '$2,000.00',
                'events' => $bookingContextEvents,
            ],
            'amount_paid' => [
                'key' => 'amount_paid',
                'label' => 'Amount Paid',
                'description' => 'Total paid so far with currency symbol.',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => '$500.00',
                'events' => $bookingContextEvents,
            ],
            'amount_paid_formatted' => [
                'key' => 'amount_paid_formatted',
                'label' => 'Amount Paid (formatted)',
                'description' => 'Total paid so far with currency symbol (alias of amount_paid).',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => '$500.00',
                'events' => $bookingContextEvents,
            ],
            'currency' => [
                'key' => 'currency',
                'label' => 'Currency',
                'description' => 'ISO 4217 currency code (e.g. USD).',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => 'USD',
                'events' => $bookingContextEvents,
            ],
            'payment_amount_formatted' => [
                'key' => 'payment_amount_formatted',
                'label' => 'Payment Amount (formatted)',
                'description' => 'Amount of the specific payment with currency.',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => '$500.00',
                'events' => [self::EVENT_PAYMENT_RECEIVED, self::EVENT_PAYMENT_REMINDER],
            ],
            'payment_method' => [
                'key' => 'payment_method',
                'label' => 'Payment Method',
                'description' => 'Instrument label (e.g. Card, Bank Transfer).',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => 'Credit Card',
                'events' => [self::EVENT_PAYMENT_RECEIVED, self::EVENT_PAYMENT_REMINDER],
            ],
            'transaction_id' => [
                'key' => 'transaction_id',
                'label' => 'Transaction ID',
                'description' => 'Gateway transaction reference for the payment.',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => 'ch_3O8XYZabc123',
                'events' => [self::EVENT_PAYMENT_RECEIVED],
            ],
            'payment_gateway' => [
                'key' => 'payment_gateway',
                'label' => 'Payment Gateway (slug)',
                'description' => 'Internal gateway slug — stripe / paypal / razorpay etc.',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => 'stripe',
                'events' => $bookingContextEvents,
            ],
            'payment_gateway_label' => [
                'key' => 'payment_gateway_label',
                'label' => 'Payment Gateway (label)',
                'description' => 'Human-readable gateway name — Stripe, PayPal etc.',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => 'Stripe',
                'events' => $bookingContextEvents,
            ],
            'payment_schedule' => [
                'key' => 'payment_schedule',
                'label' => 'Payment Schedule (slug)',
                'description' => 'full / deposit / partial — raw value.',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => 'deposit',
                'events' => $bookingContextEvents,
            ],
            'payment_schedule_label' => [
                'key' => 'payment_schedule_label',
                'label' => 'Payment Schedule (label)',
                'description' => 'Humanised schedule (e.g. Deposit, Full Payment).',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => 'Deposit',
                'events' => $bookingContextEvents,
            ],
            'due_date' => [
                'key' => 'due_date',
                'label' => 'Due Date',
                'description' => 'Payment due date for reminders.',
                'category' => self::CATEGORY_PAYMENT,
                'sample' => $sampleDueDate,
                'events' => [self::EVENT_PAYMENT_REMINDER],
            ],

            // ---------------------------------------------------------
            // Scheduled payments (installments)
            // ---------------------------------------------------------
            'scheduled_amount_formatted' => [
                'key' => 'scheduled_amount_formatted',
                'label' => 'Scheduled Amount (formatted)',
                'description' => 'Amount of the upcoming scheduled charge with currency.',
                'category' => self::CATEGORY_SCHEDULED_PAYMENT,
                'sample' => '$750.00',
                'events' => $scheduledPaymentEvents,
            ],
            'scheduled_date_formatted' => [
                'key' => 'scheduled_date_formatted',
                'label' => 'Scheduled Date (formatted)',
                'description' => 'When the next scheduled charge will run.',
                'category' => self::CATEGORY_SCHEDULED_PAYMENT,
                'sample' => $sampleDueDate,
                'events' => $scheduledPaymentEvents,
            ],
            'payment_type_label' => [
                'key' => 'payment_type_label',
                'label' => 'Payment Type Label',
                'description' => 'Humanised type (Deposit, Final, Installment 2 of 4 ...).',
                'category' => self::CATEGORY_SCHEDULED_PAYMENT,
                'sample' => 'Installment 2 of 4',
                'events' => $scheduledPaymentEvents,
            ],
            'balance_after_formatted' => [
                'key' => 'balance_after_formatted',
                'label' => 'Balance After (formatted)',
                'description' => 'Balance remaining after this charge succeeds.',
                'category' => self::CATEGORY_SCHEDULED_PAYMENT,
                'sample' => '$1,250.00',
                'events' => [self::EVENT_SCHEDULED_PAYMENT_SUCCEEDED],
            ],
            'failure_reason' => [
                'key' => 'failure_reason',
                'label' => 'Failure Reason',
                'description' => 'Provided by the gateway when a scheduled charge fails.',
                'category' => self::CATEGORY_SCHEDULED_PAYMENT,
                'sample' => 'Card declined',
                'events' => [self::EVENT_SCHEDULED_PAYMENT_FAILED],
            ],
            'failure_intro_html' => [
                'key' => 'failure_intro_html',
                'label' => 'Failure Intro (HTML)',
                'description' => 'Intro block for the payment-failure email body.',
                'category' => self::CATEGORY_SCHEDULED_PAYMENT,
                'sample' => '<p>We were unable to process your scheduled payment.</p>',
                'events' => [self::EVENT_SCHEDULED_PAYMENT_FAILED],
            ],
            'failure_followup_html' => [
                'key' => 'failure_followup_html',
                'label' => 'Failure Follow-up (HTML)',
                'description' => 'Closing block prompting the customer to update payment.',
                'category' => self::CATEGORY_SCHEDULED_PAYMENT,
                'sample' => '<p>Please update your payment method to avoid cancellation.</p>',
                'events' => [self::EVENT_SCHEDULED_PAYMENT_FAILED],
            ],

            // ---------------------------------------------------------
            // Reminder (trip & booking reminders)
            // ---------------------------------------------------------
            'days_until_trip' => [
                'key' => 'days_until_trip',
                'label' => 'Days Until Trip',
                'description' => 'Days remaining until departure.',
                'category' => self::CATEGORY_REMINDER,
                'sample' => '30',
                'events' => [self::EVENT_REMINDER_TRIP],
            ],
            'reminder_days' => [
                'key' => 'reminder_days',
                'label' => 'Reminder Days',
                'description' => 'Configured number of days before the trip when the reminder fires.',
                'category' => self::CATEGORY_REMINDER,
                'sample' => '3',
                'events' => [self::EVENT_REMINDER_TRIP],
            ],
            'reminder_extra_html' => [
                'key' => 'reminder_extra_html',
                'label' => 'Reminder Extra (HTML)',
                'description' => 'Optional extra block appended to reminder emails (packing list, etc.).',
                'category' => self::CATEGORY_REMINDER,
                'sample' => '<p>Don\'t forget your passport and travel insurance.</p>',
                'events' => [self::EVENT_REMINDER_TRIP],
            ],
            'review_url' => [
                'key' => 'review_url',
                'label' => 'Review URL',
                'description' => 'Public link the customer opens to leave a review.',
                'category' => self::CATEGORY_REMINDER,
                'sample' => $homeUrl . 'trips/amazing-mountain-adventure#reviews',
                'events' => [self::EVENT_REVIEW_REQUEST],
            ],

            // ---------------------------------------------------------
            // Enquiry
            // ---------------------------------------------------------
            'enquiry_id' => [
                'key' => 'enquiry_id',
                'label' => 'Enquiry ID',
                'description' => 'Internal numeric enquiry identifier.',
                'category' => self::CATEGORY_ENQUIRY,
                'sample' => '4567',
                'events' => $enquiryContextEvents,
            ],
            'enquiry_date' => [
                'key' => 'enquiry_date',
                'label' => 'Enquiry Date',
                'description' => 'When the enquiry was submitted.',
                'category' => self::CATEGORY_ENQUIRY,
                'sample' => function_exists('date_i18n') ? date_i18n($dateFormat) : date($dateFormat),
                'events' => $enquiryContextEvents,
            ],
            'subject' => [
                'key' => 'subject',
                'label' => 'Subject',
                'description' => 'Subject line the customer provided.',
                'category' => self::CATEGORY_ENQUIRY,
                'sample' => 'Question about Amazing Mountain Adventure',
                'events' => $enquiryContextEvents,
            ],
            'message' => [
                'key' => 'message',
                'label' => 'Message',
                'description' => 'Customer message body (sanitised, line breaks preserved).',
                'category' => self::CATEGORY_ENQUIRY,
                'sample' => 'I would like to know more about this trip. What is included in the package?',
                'events' => $enquiryContextEvents,
            ],
            'original_message' => [
                'key' => 'original_message',
                'label' => 'Original Message',
                'description' => 'First message in the enquiry thread (no line-break escaping).',
                'category' => self::CATEGORY_ENQUIRY,
                'sample' => 'I would like to know more about this trip.',
                'events' => $enquiryContextEvents,
            ],
            'response' => [
                'key' => 'response',
                'label' => 'Response',
                'description' => "Operator's typed reply (alias of response_message).",
                'category' => self::CATEGORY_ENQUIRY,
                'sample' => 'Thank you for your interest! The package includes accommodation, meals, and guided tours.',
                'events' => [self::EVENT_ENQUIRY_RESPONDED],
            ],
            'response_message' => [
                'key' => 'response_message',
                'label' => 'Response Message',
                'description' => "Operator's typed reply.",
                'category' => self::CATEGORY_ENQUIRY,
                'sample' => 'Thank you for your interest! The package includes accommodation, meals, and guided tours.',
                'events' => [self::EVENT_ENQUIRY_RESPONDED],
            ],
            'response_date' => [
                'key' => 'response_date',
                'label' => 'Response Date',
                'description' => 'When the reply was sent.',
                'category' => self::CATEGORY_ENQUIRY,
                'sample' => function_exists('date_i18n') ? date_i18n($dateFormat) : date($dateFormat),
                'events' => [self::EVENT_ENQUIRY_RESPONDED],
            ],

            // ---------------------------------------------------------
            // Trip consent (Pro)
            // ---------------------------------------------------------
            'recipient_name' => [
                'key' => 'recipient_name',
                'label' => 'Recipient Name',
                'description' => 'Traveler receiving the consent email.',
                'category' => self::CATEGORY_TRIP_CONSENT,
                'sample' => 'Alex Traveler',
                'events' => [self::EVENT_CONSENT_REQUESTED],
            ],
            'form_name' => [
                'key' => 'form_name',
                'label' => 'Consent Form Name',
                'description' => 'Title of the consent form.',
                'category' => self::CATEGORY_TRIP_CONSENT,
                'sample' => 'Trip liability & release',
                'events' => [self::EVENT_CONSENT_REQUESTED],
            ],
            'consent_link' => [
                'key' => 'consent_link',
                'label' => 'Consent Link',
                'description' => 'URL to open and sign the form.',
                'category' => self::CATEGORY_TRIP_CONSENT,
                'sample' => $homeUrl . 'trip-consent/preview-token/',
                'events' => [self::EVENT_CONSENT_REQUESTED],
            ],
            'consent_test_notice_html' => [
                'key' => 'consent_test_notice_html',
                'label' => 'Test Notice (HTML)',
                'description' => 'Shown only on admin test sends.',
                'category' => self::CATEGORY_TRIP_CONSENT,
                'sample' => '',
                'events' => [self::EVENT_CONSENT_REQUESTED],
            ],

            // ---------------------------------------------------------
            // Account verification
            // ---------------------------------------------------------
            'verification_link' => [
                'key' => 'verification_link',
                'label' => 'Verification Link',
                'description' => 'Magic link the customer opens to verify their email.',
                'category' => self::CATEGORY_ACCOUNT,
                'sample' => $verificationSampleLink,
                'events' => [self::EVENT_ACCOUNT_EMAIL_VERIFICATION],
            ],
            'intro_paragraph' => [
                'key' => 'intro_paragraph',
                'label' => 'Intro Paragraph',
                'description' => 'Opening sentence (registration / resend variant).',
                'category' => self::CATEGORY_ACCOUNT,
                'sample' => 'Thank you for registering. Click the button in this email to verify your address.',
                'events' => [self::EVENT_ACCOUNT_EMAIL_VERIFICATION],
            ],
            'footer_note' => [
                'key' => 'footer_note',
                'label' => 'Footer Note',
                'description' => 'Disclaimer for unintended recipients.',
                'category' => self::CATEGORY_ACCOUNT,
                'sample' => 'If you did not create an account, you can ignore this email.',
                'events' => [self::EVENT_ACCOUNT_EMAIL_VERIFICATION],
            ],
            'expiry_notice_html' => [
                'key' => 'expiry_notice_html',
                'label' => 'Expiry Notice (HTML)',
                'description' => 'Link-expiry messaging block (consent / verification emails).',
                'category' => self::CATEGORY_ACCOUNT,
                'sample' => '<strong>Security note:</strong> This link expires in 24 hours.',
                'events' => [
                    self::EVENT_ACCOUNT_EMAIL_VERIFICATION,
                    self::EVENT_CONSENT_REQUESTED,
                ],
            ],

            // ---------------------------------------------------------
            // Abandoned booking recovery (Pro)
            // ---------------------------------------------------------
            'recovery_link' => [
                'key' => 'recovery_link',
                'label' => 'Recovery Link',
                'description' => 'Resume the abandoned checkout from the customer email.',
                'category' => self::CATEGORY_ABANDONED_RECOVERY,
                'sample' => $homeUrl . 'checkout/recover/sample-token',
                'events' => [self::EVENT_BOOKING_ABANDONED_RECOVERY],
            ],
            'recovery_reminder_label' => [
                'key' => 'recovery_reminder_label',
                'label' => 'Reminder Label',
                'description' => 'Sequence-stage label (First, Second, Final).',
                'category' => self::CATEGORY_ABANDONED_RECOVERY,
                'sample' => 'First reminder',
                'events' => [self::EVENT_BOOKING_ABANDONED_RECOVERY],
            ],
            'recovery_intro_html' => [
                'key' => 'recovery_intro_html',
                'label' => 'Intro Paragraph (HTML)',
                'description' => 'Lead paragraph specific to each recovery email.',
                'category' => self::CATEGORY_ABANDONED_RECOVERY,
                'sample' => '<p>You\'re just one step away from booking your dream trip.</p>',
                'events' => [self::EVENT_BOOKING_ABANDONED_RECOVERY],
            ],
        ];

        // Dynamically expose every enabled Contact/Emergency booking-form field —
        // including custom fields an operator adds — so they're discoverable and
        // usable as email variables. Values are resolved at send time by
        // BookingEmailRichMergeTags (contact_/emergency_ prefixes).
        $catalog = array_merge($catalog, self::bookingFormFieldDefinitions($bookingContextEvents));

        /**
         * Filter the email merge-tag catalogue so integrations (Channel
         * Manager, WhatsApp, custom modules) can append their own tags.
         *
         * @param array $catalog The tag definitions keyed by tag key.
         */
        return function_exists('apply_filters')
            ? (array) apply_filters('yatra_email_merge_tag_definitions', $catalog)
            : $catalog;
    }

    /**
     * Build merge-tag definitions from the live booking-form config so dynamic
     * (and custom) Contact/Emergency fields surface in the email editor. Only
     * enabled fields in enabled sections are included; existing canonical tags
     * are never overwritten.
     *
     * @param array<int,string> $events
     * @return array<string, array<string,mixed>>
     */
    private static function bookingFormFieldDefinitions(array $events): array
    {
        // Custom/dynamic booking-form fields are a Pro-module feature. When the
        // Dynamic Form Field module is off the form is fixed, so we don't surface
        // these extra tags — free installs keep their existing tag list unchanged.
        if (!function_exists('apply_filters') || !apply_filters('yatra_dynamic_form_field_enabled', false)) {
            return [];
        }
        if (!function_exists('yatra_get_booking_form_config')) {
            return [];
        }

        $config = yatra_get_booking_form_config();
        if (!is_array($config)) {
            return [];
        }

        $sections = [
            'contact_form'           => ['prefix' => 'contact_',   'category' => self::CATEGORY_CUSTOMER],
            'emergency_contact_form' => ['prefix' => 'emergency_', 'category' => self::CATEGORY_BOOKING],
        ];

        $defs = [];
        foreach ($sections as $sectionKey => $meta) {
            $section = $config[$sectionKey] ?? null;
            if (!is_array($section) || (isset($section['enabled']) && !$section['enabled'])) {
                continue;
            }
            foreach (($section['fields'] ?? []) as $field) {
                if (empty($field['enabled']) || empty($field['id'])) {
                    continue;
                }
                // Text blocks are display-only content, not inputs — they hold no
                // booking value, so they must not become email merge tags.
                if (($field['type'] ?? '') === 'text_block') {
                    continue;
                }
                $id = sanitize_key((string) $field['id']);
                if ($id === '') {
                    continue;
                }
                $tagKey = $meta['prefix'] . $id;
                if (isset($defs[$tagKey])) {
                    continue;
                }
                $label = (string) ($field['label'] ?? ucwords(str_replace('_', ' ', $id)));
                $defs[$tagKey] = [
                    'key'         => $tagKey,
                    'label'       => $label,
                    /* translators: %s: booking form field label. */
                    'description' => sprintf(__('Booking form field: %s', 'yatra'), $label),
                    'category'    => $meta['category'],
                    'sample'      => '',
                    'events'      => $events,
                ];
            }
        }

        return $defs;
    }

    /**
     * Return tag definitions grouped by category, optionally filtered to
     * those that resolve for the given automation event.
     *
     * When $eventKey is empty or unknown, returns the full catalogue so
     * the operator never sees an empty sidebar.
     *
     * @return array<string, list<array{key:string,label:string,description:string}>>
     */
    public static function groupedForEvent(string $eventKey = ''): array
    {
        $eventKey = trim($eventKey);
        $defs = self::definitions();

        if ($eventKey !== '' && !self::eventHasAnyDefinitions($eventKey, $defs)) {
            // Unknown event — return the full registry rather than nothing.
            $eventKey = '';
        }

        $grouped = [];
        foreach ($defs as $def) {
            if ($eventKey !== '' && !self::tagAppliesToEvent($def, $eventKey)) {
                continue;
            }
            $cat = $def['category'] ?? self::CATEGORY_GENERAL;
            $grouped[$cat] = $grouped[$cat] ?? [];
            $grouped[$cat][] = [
                'key' => $def['key'],
                'label' => $def['label'],
                'description' => $def['description'],
            ];
        }

        return $grouped;
    }

    /**
     * Flat list of tag keys that resolve for the given event. Used by
     * EmailAutomationEvents::definitions to derive each event's variable
     * whitelist instead of hand-maintaining a parallel list.
     *
     * @return list<string>
     */
    public static function keysForEvent(string $eventKey): array
    {
        $eventKey = trim($eventKey);
        if ($eventKey === '') {
            return [];
        }
        $keys = [];
        foreach (self::definitions() as $def) {
            if (self::tagAppliesToEvent($def, $eventKey)) {
                $keys[] = $def['key'];
            }
        }
        return $keys;
    }

    /**
     * Sample variable map for the in-editor preview pipeline. Includes
     * every tag with a non-empty sample value — operators see realistic
     * placeholders rather than the literal {{tag}} string.
     *
     * @return array<string, string>
     */
    public static function samples(): array
    {
        $out = [];
        foreach (self::definitions() as $def) {
            $out[$def['key']] = (string) ($def['sample'] ?? '');
        }
        return $out;
    }

    /**
     * @param array{events:list<string>|string} $def
     */
    private static function tagAppliesToEvent(array $def, string $eventKey): bool
    {
        $events = $def['events'] ?? [];
        if ($events === '*' || $events === ['*']) {
            return true;
        }
        return is_array($events) && in_array($eventKey, $events, true);
    }

    /**
     * @param array<string, array{events:list<string>|string}> $defs
     */
    private static function eventHasAnyDefinitions(string $eventKey, array $defs): bool
    {
        foreach ($defs as $def) {
            $events = $def['events'] ?? [];
            if ($events === '*' || $events === ['*']) {
                continue; // General tags don't qualify the event as "known".
            }
            if (is_array($events) && in_array($eventKey, $events, true)) {
                return true;
            }
        }
        return false;
    }
}
