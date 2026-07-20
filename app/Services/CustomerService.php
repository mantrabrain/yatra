<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\CustomerRepository;
use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\PaymentRepository;
use Yatra\Utils\Logger;

/**
 * Customer Service
 * 
 * Contains business logic for customer management.
 * 
 * @package Yatra\Services
 */
class CustomerService
{
    private CustomerRepository $customerRepository;
    private BookingRepository $bookingRepository;
    private PaymentRepository $paymentRepository;

    public function __construct()
    {
        $this->customerRepository = new CustomerRepository();
        $this->bookingRepository = new BookingRepository();
        $this->paymentRepository = new PaymentRepository();
    }

    /**
     * Link any prior guest bookings made under a customer's email
     * to their newly-created WordPress user account.
     *
     * Without this, a customer who books as a guest first and only
     * registers later will never see those earlier bookings in My
     * Account — the rows persist with user_id=0 and the My Account
     * query filters by user_id. Wired to the `user_register` hook
     * (see Bootstrap::setupWordPressHooks).
     *
     * Returns the number of bookings that were linked. Returns 0
     * silently on any failure — registration should never break on
     * a reconciliation glitch, and the operator can re-run the
     * reconciliation later via an admin tool if needed.
     */
    public function linkGuestBookingsToUser(int $user_id): int
    {
        if ($user_id <= 0) {
            return 0;
        }
        $user = get_userdata($user_id);
        if (!$user || empty($user->user_email)) {
            return 0;
        }

        global $wpdb;
        $table = \Yatra\Database\Tables\BookingsTable::getTableName();

        // Match by exact email + user_id IS NULL/0. Limited to bookings
        // not yet linked to any user so we never re-assign someone
        // else's account.
        $updated = $wpdb->query(
            $wpdb->prepare(
                "UPDATE `{$table}` SET user_id = %d, updated_at = %s
                 WHERE contact_email = %s
                 AND (user_id IS NULL OR user_id = 0)",
                $user_id,
                current_time('mysql'),
                $user->user_email
            )
        );

        if ($updated && $updated > 0) {
            // Side-effect hook so other modules (Pro: Channel Manager,
            // notifications, audit log) can react. Fires once per
            // registration with the count + the user object.
            do_action('yatra_guest_bookings_linked', (int) $user_id, (int) $updated, $user);
        }

        return (int) max(0, (int) $updated);
    }

    /**
     * Get customer statistics
     *
     * @return array
     */
    public function getStats(): array
    {
        return $this->customerRepository->getStats();
    }

    /**
     * Get paginated customers
     *
     * @param array $filters Filters
     * @return array
     */
    public function getCustomers(array $filters = []): array
    {
        $result = $this->customerRepository->paginate($filters);

        $result['data'] = array_map([$this, 'formatCustomer'], $result['data']);

        return $result;
    }

    /**
     * Get single customer with details
     * 
     * @param int $id Customer ID
     * @return array|null
     */
    public function getCustomer(int $id): ?array
    {
        $customer = $this->customerRepository->find($id);

        if (!$customer) {
            return null;
        }

        return $this->formatCustomerWithDetails($customer);
    }

    /**
     * Get customer by email
     * 
     * @param string $email Customer email
     * @return array|null
     */
    public function getCustomerByEmail(string $email): ?array
    {
        $customer = $this->customerRepository->findByEmail($email);

        if (!$customer) {
            return null;
        }

        return $this->formatCustomer($customer);
    }

    /**
     * Get customer by WordPress user ID
     * 
     * @param int $userId WordPress user ID
     * @return array|null
     */
    public function getCustomerByUserId(int $userId): ?array
    {
        $customer = $this->customerRepository->findByUserId($userId);

        if (!$customer) {
            return null;
        }

        return $this->formatCustomer($customer);
    }

    /**
     * Account page /customers/me: Yatra customer when linked, otherwise WordPress user (display name, email).
     */
    public function getAccountProfileForUser(int $userId): ?array
    {
        if ($userId <= 0) {
            return null;
        }

        $profile = $this->getCustomerByUserId($userId);
        if ($profile === null) {
            $user = get_userdata($userId);
            if (!$user instanceof \WP_User) {
                return null;
            }
            $profile = $this->buildProfileArrayFromWpUser($user);
        }

        // Surface any pending (unconfirmed) email change so the account UI can
        // show "awaiting confirmation" — WordPress stores it in the _new_email meta.
        $pending = get_user_meta($userId, '_new_email', true);
        $profile['pending_email'] = (is_array($pending) && !empty($pending['newemail']))
            ? (string) $pending['newemail']
            : '';

        return $profile;
    }

    /**
     * Request a change to the account's login email, following WordPress core's
     * pending-change pattern ({@see send_confirmation_on_profile_email()}): the
     * email is NOT changed directly. Validate, store the pending change in the
     * `_new_email` user meta (the same shape core uses), and email a confirmation
     * link to the NEW address; the change only applies when that link is clicked.
     *
     * @return array{success:bool, message:string, pending_email?:string}
     */
    public function requestEmailChange(int $userId, string $newEmail): array
    {
        $user = get_userdata($userId);
        if (!$user instanceof \WP_User) {
            return ['success' => false, 'message' => __('Account not found.', 'yatra')];
        }

        $newEmail = trim($newEmail);
        if ($newEmail === '' || !is_email($newEmail)) {
            return ['success' => false, 'message' => __('Please enter a valid email address.', 'yatra')];
        }
        if (strtolower($newEmail) === strtolower((string) $user->user_email)) {
            return ['success' => false, 'message' => __('That is already your email address.', 'yatra')];
        }
        if (email_exists($newEmail)) {
            delete_user_meta($userId, '_new_email');
            return ['success' => false, 'message' => __('That email address is already in use.', 'yatra')];
        }

        // Identical meta shape + hash to WordPress core (wp-includes/user.php),
        // so the pending change is fully compatible with core's own flow.
        $hash = md5($newEmail . time() . wp_rand());
        update_user_meta($userId, '_new_email', ['hash' => $hash, 'newemail' => $newEmail]);

        $this->sendEmailChangeConfirmation($user, $newEmail, $hash);

        return [
            'success' => true,
            'message' => sprintf(
                /* translators: %s: the new email address. */
                __('A confirmation link has been sent to %s. Your email address will change once you confirm it there.', 'yatra'),
                $newEmail
            ),
            'pending_email' => $newEmail,
        ];
    }

    /**
     * Re-send the confirmation email for an already-pending email change. Reuses
     * the stored hash + address, so the original link stays valid (this does not
     * rotate the token or change any state). Returns an error if nothing is pending.
     *
     * @return array{success:bool, message:string, pending_email?:string}
     */
    public function resendEmailChangeConfirmation(int $userId): array
    {
        $user = get_userdata($userId);
        if (!$user instanceof \WP_User) {
            return ['success' => false, 'message' => __('Account not found.', 'yatra')];
        }

        $pending = get_user_meta($userId, '_new_email', true);
        if (!is_array($pending) || empty($pending['hash']) || empty($pending['newemail'])) {
            return ['success' => false, 'message' => __('There is no pending email change to confirm.', 'yatra')];
        }

        $newEmail = (string) $pending['newemail'];
        $this->sendEmailChangeConfirmation($user, $newEmail, (string) $pending['hash']);

        return [
            'success' => true,
            'message' => sprintf(
                /* translators: %s: the pending new email address. */
                __('We\'ve re-sent the confirmation link to %s.', 'yatra'),
                $newEmail
            ),
            'pending_email' => $newEmail,
        ];
    }

    /**
     * Cancel a pending email change, discarding the stored token so the emailed
     * link no longer works. Mirrors WordPress core's "dismiss" action
     * (profile.php?dismiss=<id>_new_email), which simply deletes the `_new_email`
     * user meta. Safe to call when nothing is pending.
     *
     * @return array{success:bool, message:string}
     */
    public function cancelEmailChange(int $userId): array
    {
        if (!get_userdata($userId) instanceof \WP_User) {
            return ['success' => false, 'message' => __('Account not found.', 'yatra')];
        }

        delete_user_meta($userId, '_new_email');

        return ['success' => true, 'message' => __('The pending email change has been cancelled.', 'yatra')];
    }

    /**
     * Send the email-change confirmation to the NEW address. Mirrors WordPress
     * core's message and reuses its `new_user_email_content` filter, but points
     * the confirmation link at the frontend account endpoint (not wp-admin).
     */
    private function sendEmailChangeConfirmation(\WP_User $user, string $newEmail, string $hash): void
    {
        // Point at the front-end account page (a normal request with cookie auth),
        // NOT a REST endpoint — a browser GET to REST carries no nonce and would be
        // read as anonymous. AccountPageHandler consumes the token there.
        $accountUrl = home_url('/' . trailingslashit(SettingsService::getAccountBase()));
        $confirmUrl = add_query_arg('yatra_email_token', rawurlencode($hash), $accountUrl);
        $firstName  = trim((string) $user->first_name) ?: (trim((string) $user->display_name) ?: (string) $user->user_login);

        // Send through the Yatra transactional-email template system (branded HTML,
        // merge tags, operator-editable in Settings → Email Templates) rather than a
        // raw wp_mail. {{verification_link}} is reused for the confirmation link.
        TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_ACCOUNT_EMAIL_CHANGE_REQUEST,
            $newEmail,
            [
                'customer_first_name' => $firstName,
                'customer_name'       => $firstName,
                'customer_email'      => (string) $user->user_email,
                'new_email'           => $newEmail,
                'verification_link'   => $confirmUrl,
                'intro_paragraph'     => __('You recently requested to change the email address on your account. To confirm this new address, click the button below.', 'yatra'),
                'footer_note'         => __('If you did not request this change, you can safely ignore this email — your address will not change.', 'yatra'),
            ]
        );
    }

    /**
     * Notify the OLD address that the account email was changed (WordPress core
     * sends an equivalent security notice). Uses the editable "Email changed"
     * transactional template.
     */
    private function sendEmailChangedNotice(string $oldEmail, string $firstName, string $newEmail): void
    {
        TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_ACCOUNT_EMAIL_CHANGED,
            $oldEmail,
            [
                'customer_first_name' => $firstName,
                'customer_name'       => $firstName,
                'customer_email'      => $oldEmail,
                'new_email'           => $newEmail,
                'intro_paragraph'     => __('The email address on your account was just changed. If this was you, no further action is needed.', 'yatra'),
                'footer_note'         => __('If you did not make this change, please contact us immediately — your account may have been accessed by someone else.', 'yatra'),
            ]
        );
    }

    /**
     * Confirm a pending email change (WordPress core pattern): verify the hash
     * against the `_new_email` meta, apply via wp_update_user, then clear the meta.
     *
     * @return array{success:bool, message:string}
     */
    public function confirmEmailChange(int $userId, string $hash): array
    {
        $pending = get_user_meta($userId, '_new_email', true);
        if (!is_array($pending) || empty($pending['hash']) || empty($pending['newemail'])) {
            return ['success' => false, 'message' => __('No pending email change was found.', 'yatra')];
        }
        if (!hash_equals((string) $pending['hash'], (string) $hash)) {
            return ['success' => false, 'message' => __('This confirmation link is invalid or has expired.', 'yatra')];
        }

        $newEmail = trim((string) $pending['newemail']);
        $existing = $newEmail !== '' ? email_exists($newEmail) : false;
        if ($existing && (int) $existing !== $userId) {
            delete_user_meta($userId, '_new_email');
            return ['success' => false, 'message' => __('That email address is now in use. Please try again.', 'yatra')];
        }

        // Capture the OLD address + name before the update, so we can send the
        // "email changed" security notice to it afterwards.
        $preUser  = get_userdata($userId);
        $oldEmail = $preUser instanceof \WP_User ? (string) $preUser->user_email : '';
        $firstName = $preUser instanceof \WP_User
            ? (trim((string) $preUser->first_name) ?: (trim((string) $preUser->display_name) ?: (string) $preUser->user_login))
            : '';

        $result = wp_update_user(['ID' => $userId, 'user_email' => $newEmail]);
        if (is_wp_error($result)) {
            return ['success' => false, 'message' => wp_strip_all_tags($result->get_error_message())];
        }

        // Keep the linked Yatra customer record in step with the WP user email,
        // otherwise the account page would keep showing the old address (it reads
        // the customer table's own email column).
        $customer = $this->customerRepository->findByUserId($userId);
        if ($customer && strtolower((string) $customer->email) !== strtolower($newEmail)) {
            $this->customerRepository->updateCustomer((int) $customer->id, ['email' => $newEmail]);
        }

        delete_user_meta($userId, '_new_email');

        // Security notice to the old address (best-effort; never block the change).
        if ($oldEmail !== '' && strtolower($oldEmail) !== strtolower($newEmail)) {
            $this->sendEmailChangedNotice($oldEmail, $firstName, $newEmail);
        }

        return ['success' => true, 'message' => __('Your email address has been updated.', 'yatra')];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildProfileArrayFromWpUser(\WP_User $user): array
    {
        $first = trim((string) $user->first_name);
        $last = trim((string) $user->last_name);
        $fromParts = trim($first . ' ' . $last);
        $display = trim((string) $user->display_name);
        $name = $fromParts !== '' ? $fromParts : $display;
        if ($name === '') {
            $name = (string) $user->user_login;
        }

        return [
            'id' => 0,
            'user_id' => (int) $user->ID,
            'name' => $name,
            'first_name' => $first,
            'last_name' => $last,
            'email' => (string) $user->user_email,
            'phone' => '',
            'country' => '',
            'city' => '',
            'status' => 'active',
            'total_bookings' => 0,
            'total_spent' => 0.0,
            'loyalty_tier' => '',
            'created_at' => $user->user_registered,
            'last_booking_date' => null,
            'registered_at' => $user->user_registered,
        ];
    }

    /**
     * Create a new customer
     * 
     * @param array $data Customer data
     * @return array {success: bool, customer_id?: int, message: string}
     */
    public function createCustomer(array $data): array
    {
        // Validate required fields
        if (empty($data['email'])) {
            return ['success' => false, 'message' => __('Email is required.', 'yatra')];
        }

        // Validate email format
        if (!is_email($data['email'])) {
            return ['success' => false, 'message' => __('Please provide a valid email address.', 'yatra')];
        }

        // Check if customer already exists
        $existingCustomer = $this->customerRepository->findByEmail($data['email']);
        if ($existingCustomer) {
            return [
                'success' => false,
                'message' => __('A customer with this email already exists.', 'yatra'),
                'existing_id' => (int) $existingCustomer->id,
            ];
        }

        // Create customer
        $customerId = $this->customerRepository->findOrCreate($data);

        if (!$customerId) {
            return ['success' => false, 'message' => __('Failed to create customer.', 'yatra')];
        }

        return [
            'success' => true,
            'customer_id' => $customerId,
            'message' => __('Customer created successfully.', 'yatra'),
        ];
    }

    /**
     * Update a customer
     * 
     * @param int   $id   Customer ID
     * @param array $data Customer data
     * @return array {success: bool, message: string}
     */
    public function updateCustomer(int $id, array $data): array
    {
        $customer = $this->customerRepository->find($id);

        if (!$customer) {
            return ['success' => false, 'message' => __('Customer not found.', 'yatra')];
        }

        $previousEmail = (string) $customer->email;
        $linkedUserId  = (int) ($customer->user_id ?? 0);

        // Check email uniqueness if changing
        $emailChanged = false;
        $newEmail     = '';
        if (!empty($data['email']) && $data['email'] !== $customer->email) {
            $newEmail = sanitize_email((string) $data['email']);

            if (!is_email($newEmail)) {
                return ['success' => false, 'message' => __('Please enter a valid email address.', 'yatra')];
            }

            $existingCustomer = $this->customerRepository->findByEmail($newEmail);
            if ($existingCustomer && (int) $existingCustomer->id !== $id) {
                return ['success' => false, 'message' => __('Email is already in use by another customer.', 'yatra')];
            }

            $data['email'] = $newEmail;
            $emailChanged  = true;
        }

        // Decide up-front whether this customer signs in, so a rejection happens
        // BEFORE anything is written.
        //
        // An account is only recognised when this customer row unambiguously
        // represents it — that is, the account currently carries this very same
        // address. Several customer rows can legitimately share one user_id (an
        // operator booking on behalf of guests while logged in links every row to
        // their own account), and acting on the account from one of those rows
        // would touch the WRONG person's login — including an administrator's.
        $accountUserId = 0;
        if ($emailChanged && $linkedUserId > 0) {
            $linkedUser = get_userdata($linkedUserId);

            if ($linkedUser && strtolower((string) $linkedUser->user_email) === strtolower($previousEmail)) {
                $ownerId = email_exists($data['email']);
                if ($ownerId && (int) $ownerId !== $linkedUserId) {
                    return [
                        'success' => false,
                        'message' => __('That email address already belongs to another user account.', 'yatra'),
                    ];
                }

                $accountUserId = $linkedUserId;
            }
        }

        // A customer who can sign in keeps ownership of their own login address:
        // the new address must confirm the change before it takes effect, exactly
        // as it does when the customer edits it themselves. Nothing is written
        // here — the stored email stays put until that link is clicked.
        //
        // A customer WITHOUT an account has no login and no inbox to confirm
        // from, so their record is corrected immediately.
        $pendingEmail = '';
        if ($accountUserId > 0) {
            unset($data['email']);
        }

        $updated = $this->customerRepository->updateCustomer($id, $data);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update customer.', 'yatra')];
        }

        if ($accountUserId > 0) {
            $requested = $this->requestEmailChange($accountUserId, $newEmail);

            if (empty($requested['success'])) {
                Logger::warning('Admin-requested customer email change could not be sent', [
                    'customer_id' => $id,
                    'user_id'     => $accountUserId,
                    'reason'      => $requested['message'] ?? '',
                ]);

                return [
                    'success' => false,
                    'message' => $requested['message'] ?? __('The email change could not be requested.', 'yatra'),
                ];
            }

            $pendingEmail = (string) ($requested['pending_email'] ?? $newEmail);

            return [
                'success'       => true,
                'message'       => sprintf(
                    /* translators: %s: the new email address awaiting confirmation. */
                    __('Customer updated. A confirmation link was sent to %s — their email address changes once it is confirmed there.', 'yatra'),
                    $pendingEmail
                ),
                'pending_email' => $pendingEmail,
            ];
        }

        return [
            'success' => true,
            'message' => __('Customer updated successfully.', 'yatra'),
        ];
    }

    /**
     * Update customer status
     * 
     * @param int    $id     Customer ID
     * @param string $status New status (active, inactive, blocked)
     * @return array {success: bool, message: string}
     */
    public function updateStatus(int $id, string $status): array
    {
        $validStatuses = ['active', 'inactive', 'blocked'];

        if (!in_array($status, $validStatuses, true)) {
            return ['success' => false, 'message' => __('Invalid status.', 'yatra')];
        }

        $customer = $this->customerRepository->find($id);

        if (!$customer) {
            return ['success' => false, 'message' => __('Customer not found.', 'yatra')];
        }

        $updated = $this->customerRepository->updateCustomer($id, ['status' => $status]);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update status.', 'yatra')];
        }

        return [
            'success' => true,
            'message' => sprintf(
                /* translators: %s: new customer status. */
                __('Customer status updated to %s.', 'yatra'),
                $status
            ),
        ];
    }

    /**
     * Delete a customer
     * 
     * @param int $id Customer ID
     * @return array {success: bool, message: string}
     */
    public function deleteCustomer(int $id): array
    {
        $customer = $this->customerRepository->find($id);

        if (!$customer) {
            return ['success' => false, 'message' => __('Customer not found.', 'yatra')];
        }

        // Check for existing bookings
        $bookings = $this->customerRepository->getCustomerBookings($id, 1);
        if (!empty($bookings)) {
            return [
                'success' => false,
                'message' => __('Cannot delete customer with existing bookings. Consider deactivating instead.', 'yatra'),
            ];
        }

        $deleted = $this->customerRepository->deleteCustomer($id);

        if (!$deleted) {
            return ['success' => false, 'message' => __('Failed to delete customer.', 'yatra')];
        }

        return [
            'success' => true,
            'message' => __('Customer deleted successfully.', 'yatra'),
        ];
    }

    /**
     * Get customer's bookings
     * 
     * @param int $customerId Customer ID
     * @param int $limit      Limit results
     * @return array
     */
    public function getCustomerBookings(int $customerId, int $limit = 10): array
    {
        return $this->customerRepository->getCustomerBookings($customerId, $limit);
    }

    /**
     * Get bookings by WordPress user ID (checks both customer_id and user_id)
     * 
     * @param int $userId WordPress user ID
     * @param int $limit  Limit results
     * @return array
     */
    public function getBookingsByUserId(int $userId, int $limit = 10): array
    {
        // First, try to get customer and bookings by customer_id
        $customer = $this->getCustomerByUserId($userId);
        $bookings = [];
        
        if ($customer) {
            $bookings = $this->getCustomerBookings((int) $customer['id'], $limit);
        }
        
        // Also get bookings directly by user_id (in case bookings were made before customer record was created)
        $bookingsByUserId = $this->bookingRepository->findByUserId($userId, $limit);

        // And include bookings made via the same email address
        $emailBookings = [];
        $user = get_userdata($userId);
        if ($user && !empty($user->user_email)) {
            $emailBookings = $this->bookingRepository->findByContactEmail($user->user_email, $limit);
        }
        
        // Merge and deduplicate by booking ID
        $bookingIds = [];
        $allBookings = [];
        $sources = [$bookings, $bookingsByUserId, $emailBookings];

        foreach ($sources as $collection) {
            foreach ($collection as $booking) {
                $bookingId = is_array($booking) ? ($booking['id'] ?? $booking['booking_id'] ?? null) : ($booking->id ?? null);
                if ($bookingId && !in_array($bookingId, $bookingIds, true)) {
                    $bookingIds[] = $bookingId;
                    $allBookings[] = $booking;
                }
            }
        }
        
        // Limit results
        if ($limit > 0 && count($allBookings) > $limit) {
            $allBookings = array_slice($allBookings, 0, $limit);
        }
        
        return $allBookings;
    }

    public function getBookingDetailsForUser(int $userId, int $bookingId): ?array
    {
        if ($userId <= 0 || $bookingId <= 0) {
            return null;
        }

        $booking = $this->bookingRepository->findWithTrip($bookingId);
        if (!$booking) {
            return null;
        }

        $user = get_userdata($userId);
        $userEmail = ($user && !empty($user->user_email)) ? (string) $user->user_email : '';

        $customer = $this->getCustomerByUserId($userId);
        $customerId = $customer ? (int) ($customer['id'] ?? 0) : 0;

        $bookingUserId = isset($booking->user_id) ? (int) $booking->user_id : 0;
        $bookingCustomerId = isset($booking->customer_id) ? (int) $booking->customer_id : 0;
        $bookingEmail = isset($booking->contact_email) ? (string) $booking->contact_email : '';

        $allowed = false;
        if ($bookingUserId > 0 && $bookingUserId === $userId) {
            $allowed = true;
        }
        if (!$allowed && $customerId > 0 && $bookingCustomerId > 0 && $bookingCustomerId === $customerId) {
            $allowed = true;
        }
        if (!$allowed && $userEmail !== '' && $bookingEmail !== '' && strtolower($userEmail) === strtolower($bookingEmail)) {
            $allowed = true;
        }

        if (!$allowed) {
            return null;
        }

        $emergencyContact = isset($booking->emergency_contact) ? maybe_unserialize($booking->emergency_contact) : null;
        if (is_string($emergencyContact)) {
            $decoded = json_decode($emergencyContact, true);
            if (is_array($decoded)) {
                $emergencyContact = $decoded;
            }
        }

        // Load travellers from the normalized meta tables — the SAME source the
        // admin booking screens use (TravellerRepository::getByBookingId, each
        // row carrying its dynamic `fields`). The previous code read
        // `$booking->travelers`, a column that does NOT exist (the schema only
        // has `travelers_count`), so `travelers_data` was ALWAYS empty and the
        // account-page "Travelers Information" card never rendered. Returns []
        // for older bookings with no normalized rows (card simply hidden), so
        // this is safe for existing bookings.
        $travellerRepository = new \Yatra\Repositories\TravellerRepository();
        $travelersList = $travellerRepository->getByBookingId($bookingId);
        if (!is_array($travelersList)) {
            $travelersList = [];
        }

        // contact_data is stored as JSON; decode to an array so the account
        // page can read custom contact fields (matches emergency_contact above
        // and BookingService::formatBookingWithDetails). maybe_unserialize is a
        // no-op on a JSON string, so a fallback json_decode is required.
        $contactData = isset($booking->contact_data) ? maybe_unserialize($booking->contact_data) : null;
        if (is_string($contactData)) {
            $decodedContact = json_decode($contactData, true);
            if (is_array($decodedContact)) {
                $contactData = $decodedContact;
            }
        }

        // Derive customer_* convenience fields. The admin React maps
        // contact_first_name + contact_last_name → customer_name at the
        // page level (see ViewBooking.tsx), so we mirror the same shape
        // server-side for the customer account view. Keeping ALL
        // original contact_* fields too so any caller depending on the
        // old shape (filters, integrations) stays unaffected.
        $contactFirst = (string) ($booking->contact_first_name ?? '');
        $contactLast  = (string) ($booking->contact_last_name ?? '');
        $customerName = trim($contactFirst . ' ' . $contactLast);

        $details = [
            'id' => (int) ($booking->id ?? 0),
            'reference' => $booking->reference ?? null,
            'trip_id' => (int) ($booking->trip_id ?? 0),
            'trip_title' => $booking->trip_title ?? null,
            'trip_slug' => $booking->trip_slug ?? null,
            'trip_url' => function_exists('yatra_get_trip_permalink') ? yatra_get_trip_permalink((int) ($booking->trip_id ?? 0)) : '',
            'featured_image' => $booking->featured_image ?? null,
            'created_at' => $booking->created_at ?? null,
            'updated_at' => $booking->updated_at ?? null,
            'travel_date' => $booking->travel_date ?? null,
            'start_date' => $booking->start_date ?? $booking->travel_date ?? null,
            'end_date' => $booking->end_date ?? null,
            'travelers_count' => (int) ($booking->travelers_count ?? 0),
            'total_amount' => (float) ($booking->total_amount ?? 0),
            'amount_paid' => (float) ($booking->amount_paid ?? 0),
            'amount_due' => (float) ($booking->amount_due ?? 0),
            'currency' => $booking->currency ?? null,
            'payment_status' => $booking->payment_status ?? null,
            'status' => $booking->status ?? null,
            'payment_gateway' => $booking->payment_gateway ?? null,
            'contact_first_name' => $booking->contact_first_name ?? null,
            'contact_last_name' => $booking->contact_last_name ?? null,
            'contact_email' => $booking->contact_email ?? null,
            'contact_phone' => $booking->contact_phone ?? null,
            'contact_country' => $booking->contact_country ?? null,
            // Convenience aliases the React account page (BookingDetails.tsx)
            // reads as `customer_name`/`customer_email`/`customer_phone`.
            'customer_name' => $customerName !== '' ? $customerName : null,
            'customer_email' => $booking->contact_email ?? null,
            'customer_phone' => $booking->contact_phone ?? null,
            'special_requests' => $booking->special_requests ?? null,
            'emergency_contact' => $emergencyContact,
            'contact_data' => $contactData,
            'travelers' => $travelersList,
            // React's BookingDetails reads `travelers_data` (same name
            // the admin ViewBooking screen uses); alias it here so the
            // "Travelers Information" card actually renders.
            'travelers_data' => is_array($travelersList) ? $travelersList : [],
            'payments' => [],
        ];

        return apply_filters('yatra_customer_booking_details', $details, $booking, $userId);
    }

    /**
     * Get customer's payments
     * 
     * @param int $customerId Customer ID
     * @param int $limit      Limit results
     * @return array
     */
    public function getCustomerPayments(int $customerId, int $limit = 50): array
    {
        $bookings = $this->customerRepository->getCustomerBookings($customerId, 1000);
        $bookingIds = array_map(static function($booking) {
            if (is_object($booking)) {
                return (int) ($booking->id ?? 0);
            }
            if (is_array($booking)) {
                return (int) ($booking['id'] ?? 0);
            }
            return 0;
        }, $bookings);

        // Include bookings linked via user ID or email (older bookings may not have customer_id)
        $customer = $this->customerRepository->find($customerId);
        if ($customer) {
            if (!empty($customer->user_id)) {
                $userBookings = $this->bookingRepository->findByUserId((int) $customer->user_id, 1000);
                $bookingIds = array_merge($bookingIds, array_map(static function($booking) {
                    if (is_object($booking)) {
                        return (int) ($booking->id ?? 0);
                    }
                    if (is_array($booking)) {
                        return (int) ($booking['id'] ?? 0);
                    }
                    return 0;
                }, $userBookings));
            }

            if (!empty($customer->email)) {
                $emailBookings = $this->bookingRepository->findByContactEmail($customer->email, 1000);
                $bookingIds = array_merge($bookingIds, array_map(static function($booking) {
                    if (is_object($booking)) {
                        return (int) ($booking->id ?? 0);
                    }
                    if (is_array($booking)) {
                        return (int) ($booking['id'] ?? 0);
                    }
                    return 0;
                }, $emailBookings));
            }
        }

        $bookingIds = array_values(array_unique(array_filter($bookingIds)));

        return $this->getPaymentsForBookingIds($bookingIds, $limit);
    }

    public function getPaymentsByUserId(int $userId, int $limit = 50): array
    {
        $bookings = $this->bookingRepository->findByUserId($userId, 1000);

        $user = get_userdata($userId);
        if ($user && !empty($user->user_email)) {
            $bookingsByEmail = $this->bookingRepository->findByContactEmail($user->user_email, 1000);
            $bookings = array_merge($bookings, $bookingsByEmail);
        }

        $bookingIds = array_map(static function($booking) {
            if (is_object($booking)) {
                return (int) ($booking->id ?? 0);
            }
            if (is_array($booking)) {
                return (int) ($booking['id'] ?? 0);
            }
            return 0;
        }, $bookings);

        return $this->getPaymentsForBookingIds($bookingIds, $limit);
    }

    private function getPaymentsForBookingIds(array $bookingIds, int $limit = 50): array
    {
        $bookingIds = array_values(array_filter(array_map('intval', $bookingIds))); // ensure ints

        if (empty($bookingIds)) {
            return [];
        }

        $customerRepository = new \Yatra\Repositories\CustomerRepository();
        $payments = $customerRepository->getPaymentsForBookingIds($bookingIds, $limit);

        // Route the customer-facing payments through the shared formatter so
        // they emit the same field shape the rest of the app uses — most
        // importantly the React Account → Payments tab's aliases
        // (`date`, `method`, `reference`, `type`, `booking_number`,
        // `payment_date`, `payment_number`). The previous inline formatter
        // omitted those keys, which is why the Payments cards rendered
        // "N/A" for the date, blank for the method, and an empty space
        // above the "Booking:" label.
        $paymentService = new \Yatra\Services\PaymentService();

        return array_map(static function ($payment) use ($paymentService) {
            $row = $paymentService->formatPayment($payment);
            // Preserve the booking-amount summary fields used by the React
            // payments tab to decide whether to render a "Pay Remaining" CTA.
            // formatPayment doesn't know about these (they come from the
            // CustomerRepository JOIN); attach them here so we keep the
            // canonical shape AND the extra context.
            $row['booking_amount_due']   = (float) ($payment->booking_amount_due ?? 0);
            $row['booking_amount_paid']  = (float) ($payment->booking_amount_paid ?? 0);
            $row['booking_total_amount'] = (float) ($payment->booking_total_amount ?? 0);
            return $row;
        }, $payments);
    }

    public function getDocumentsForBookings(array $bookings, int $customerId = 0): array
    {
        $documents = [];

        // Process each booking individually for vouchers and itineraries
        // but group by trip for downloads
        $tripsWithBookings = [];
        
        foreach ($bookings as $booking) {
            $bookingId = is_object($booking) ? (int) ($booking->id ?? 0) : (int) ($booking['id'] ?? $booking['booking_id'] ?? 0);
            $tripId = is_object($booking) ? (int) ($booking->trip_id ?? 0) : (int) ($booking['trip_id'] ?? 0);
            $tripTitle = is_object($booking) ? (string) ($booking->trip_title ?? '') : (string) ($booking['trip_title'] ?? '');
            $reference = is_object($booking) ? ($booking->reference ?? null) : ($booking['reference'] ?? null);
            $status = is_object($booking) ? (string) ($booking->status ?? '') : (string) ($booking['status'] ?? '');
            $createdAt = is_object($booking) ? (string) ($booking->created_at ?? '') : (string) ($booking['created_at'] ?? '');

            if ($bookingId <= 0) {
                continue;
            }

            // Store trip info for downloads (grouped by trip)
            if ($tripId > 0 && !isset($tripsWithBookings[$tripId])) {
                $tripsWithBookings[$tripId] = [
                    'booking_id' => $bookingId,
                    'trip_title' => $tripTitle,
                    'reference' => $reference,
                    'status' => $status,
                    'created_at' => $createdAt,
                ];
            }

            // Get payments for this booking (invoices per payment)
            $payments = $this->paymentRepository->findByBookingId($bookingId);
            $hasPaidInvoice = false;
            foreach ($payments as $payment) {
                $paymentId = (int) ($payment->id ?? 0);
                if ($paymentId <= 0) {
                    continue;
                }

                $paymentStatus = (string) ($payment->status ?? '');
                if (!in_array($paymentStatus, ['paid', 'completed', 'success'], true)) {
                    continue;
                }

                $docRef = $reference ?: $bookingId;

                // Invoice per payment
                $invoiceUrl = rest_url('yatra/v1/payment/' . $paymentId . '/invoice');
                $invoiceUrl = add_query_arg('_wpnonce', wp_create_nonce('wp_rest'), $invoiceUrl);

                $documents[] = [
                    'id' => 'invoice-payment-' . $paymentId,
                    'name' => sprintf(
                        /* translators: %s: booking reference or ID. */
                        __('Invoice #%s.pdf', 'yatra'),
                        $docRef
                    ),
                    'trip_title' => $tripTitle,
                    'category' => 'invoice',
                    'updated_at' => $payment->created_at ?? $createdAt ?: date('Y-m-d H:i:s'),
                    'url' => $invoiceUrl,
                    'booking_id' => $bookingId,
                    'payment_id' => $paymentId,
                ];
                $hasPaidInvoice = true;
            }

            // Pro-forma invoice for offline / unpaid bookings (e.g. Bank Transfer):
            // no completed payment yet, but there is a balance due. Carries the
            // gateway's payment instructions so the customer knows how to pay.
            $amountDue = is_object($booking)
                ? (float) ($booking->amount_due ?? $booking->booking_amount_due ?? 0)
                : (float) ($booking['amount_due'] ?? $booking['booking_amount_due'] ?? 0);
            if (!$hasPaidInvoice && $amountDue > 0) {
                $proformaToken = \Yatra\Controllers\PaymentGatewayController::issueInvoiceToken(0, $bookingId);
                $proformaUrl = add_query_arg(
                    ['invoice_token' => $proformaToken, '_wpnonce' => wp_create_nonce('wp_rest')],
                    rest_url('yatra/v1/booking/' . $bookingId . '/invoice')
                );
                $documents[] = [
                    'id' => 'invoice-booking-' . $bookingId,
                    'name' => sprintf(
                        /* translators: %s: booking reference or ID. */
                        __('Invoice #%s.pdf', 'yatra'),
                        $reference ?: $bookingId
                    ),
                    'trip_title' => $tripTitle,
                    'category' => 'invoice',
                    'updated_at' => $createdAt ?: date('Y-m-d H:i:s'),
                    'url' => $proformaUrl,
                    'booking_id' => $bookingId,
                ];
            }

            // Voucher per booking
            if ($status === 'confirmed') {
                $docRef = $reference ?: $bookingId;

                $voucherUrl = rest_url('yatra/v1/bookings/' . $bookingId . '/voucher');
                $voucherUrl = add_query_arg('_wpnonce', wp_create_nonce('wp_rest'), $voucherUrl);

                $documents[] = [
                    'id' => 'voucher-' . $bookingId, // Booking-based ID
                    'name' => sprintf(
                        /* translators: %s: booking reference or ID. */
                        __('Travel Voucher #%s.pdf', 'yatra'),
                        $docRef
                    ),
                    'trip_title' => $tripTitle,
                    'category' => 'voucher',
                    'updated_at' => $createdAt ?: date('Y-m-d H:i:s'),
                    'url' => $voucherUrl,
                    'booking_id' => $bookingId,
                ];

                // Itinerary per booking
                $itineraryUrl = rest_url('yatra/v1/bookings/' . $bookingId . '/itinerary');
                $itineraryUrl = add_query_arg('_wpnonce', wp_create_nonce('wp_rest'), $itineraryUrl);

                $documents[] = [
                    'id' => 'itinerary-' . $bookingId, // Booking-based ID
                    'name' => sprintf(
                        /* translators: %s: booking reference or ID. */
                        __('Travel Itinerary #%s.pdf', 'yatra'),
                        $docRef
                    ),
                    'trip_title' => $tripTitle,
                    'category' => 'itinerary',
                    'updated_at' => $createdAt ?: date('Y-m-d H:i:s'),
                    'url' => $itineraryUrl,
                    'booking_id' => $bookingId,
                ];
            }
        }

        usort($documents, function ($a, $b) {
            return strtotime($b['updated_at']) - strtotime($a['updated_at']);
        });

        // Apply downloads filter (which groups by trip)
        $documents = apply_filters('yatra_customer_documents', $documents, $bookings, $customerId);

        return is_array($documents) ? $documents : [];
    }

    /**
     * Get customer's documents (invoices, vouchers, itineraries)
     * 
     * @param int $customerId Customer ID
     * @return array
     */
    public function getCustomerDocuments(int $customerId): array
    {
        // Get customer's bookings
        $bookings = $this->customerRepository->getCustomerBookings($customerId, 1000);

        // Also include bookings linked via user_id/email (older bookings may not have customer_id)
        $customer = $this->customerRepository->find($customerId);
        if ($customer) {
            if (!empty($customer->user_id)) {
                $userBookings = $this->bookingRepository->findByUserId((int) $customer->user_id, 1000);
                $bookings = array_merge($bookings, $userBookings);
            }

            if (!empty($customer->email)) {
                $emailBookings = $this->bookingRepository->findByContactEmail((string) $customer->email, 1000);
                $bookings = array_merge($bookings, $emailBookings);
            }
        }

        // Deduplicate by booking id
        $seen = [];
        $unique = [];
        foreach ($bookings as $b) {
            $id = is_object($b) ? ($b->id ?? null) : ($b['id'] ?? $b['booking_id'] ?? null);
            if ($id && !isset($seen[$id])) {
                $seen[$id] = true;
                $unique[] = $b;
            }
        }

        return $this->getDocumentsForBookings($unique, $customerId);
    }

    /**
     * Get customer's support tickets
     * 
     * @param int $customerId Customer ID
     * @return array
     */
    public function getCustomerSupportTickets(int $customerId): array
    {
        // For now, return empty array as support tickets system may not be implemented yet
        // This can be extended when support ticket system is added
        return [];
    }

    /**
     * Merge two customer records
     * 
     * @param int $sourceId Source customer ID (will be deleted)
     * @param int $targetId Target customer ID (will be kept)
     * @return array {success: bool, message: string}
     */
    public function mergeCustomers(int $sourceId, int $targetId): array
    {
        if ($sourceId === $targetId) {
            return ['success' => false, 'message' => __('Cannot merge customer with itself.', 'yatra')];
        }

        $source = $this->customerRepository->find($sourceId);
        $target = $this->customerRepository->find($targetId);

        if (!$source || !$target) {
            return ['success' => false, 'message' => __('One or both customers not found.', 'yatra')];
        }

        // Update all bookings to point to target customer
        $this->bookingRepository->updateCustomerBookings($sourceId, $targetId);

        // Update target customer stats
        $this->customerRepository->updateCustomer($targetId, [
            'total_bookings' => (int) $target->total_bookings + (int) $source->total_bookings,
            'total_spent' => (float) $target->total_spent + (float) $source->total_spent,
        ]);

        // Delete source customer
        $this->customerRepository->deleteCustomer($sourceId);

        return [
            'success' => true,
            'message' => __('Customers merged successfully.', 'yatra'),
        ];
    }

    /**
     * Format customer for API response
     * 
     * @param object $customer Raw customer data
     * @return array
     */
    private function formatCustomer(object $customer): array
    {
        $name = trim((string) ($customer->first_name ?? '') . ' ' . (string) ($customer->last_name ?? ''));
        if ($name === '') {
            $uid = (int) ($customer->user_id ?? 0);
            if ($uid > 0) {
                $u = get_userdata($uid);
                if ($u instanceof \WP_User) {
                    $name = trim((string) $u->display_name);
                    if ($name === '') {
                        $name = trim($u->first_name . ' ' . $u->last_name);
                    }
                    if ($name === '') {
                        $name = (string) $u->user_login;
                    }
                }
            }
        }
        if ($name === '' && !empty($customer->email)) {
            $local = explode('@', (string) $customer->email)[0] ?? '';
            $name = $local !== '' ? $local : $name;
        }

        $created = $customer->created_at ?? '';

        return [
            'id' => (int) $customer->id,
            'user_id' => $customer->user_id ? (int) $customer->user_id : null,
            'name' => $name,
            'first_name' => $customer->first_name ?? '',
            'last_name' => $customer->last_name ?? '',
            'email' => $customer->email,
            'phone' => $customer->phone ?? '',
            'country' => $customer->country ?? '',
            'city' => $customer->city ?? '',
            // Address belongs to the account profile too. Without it here the
            // account page never received the saved value — which is exactly why
            // city/country updated but address didn't.
            'address' => $customer->address ?? '',
            'status' => $customer->status ?? 'active',
            'total_bookings' => (int) ($customer->total_bookings ?? 0),
            'total_spent' => (float) ($customer->total_spent ?? 0),
            'loyalty_tier' => $customer->loyalty_tier ?? 'bronze',
            'created_at' => $created,
            'registered_at' => $created,
            'last_booking_date' => $customer->last_booking_date ?? null,
        ];
    }

    /**
     * Format customer with all details
     * 
     * @param object $customer Raw customer data
     * @return array
     */
    private function formatCustomerWithDetails(object $customer): array
    {
        $formatted = $this->formatCustomer($customer);

        // Add additional fields
        $formatted['secondary_phone'] = $customer->secondary_phone ?? null;
        $formatted['address'] = $customer->address ?? null;
        $formatted['state'] = $customer->state ?? null;
        $formatted['postal_code'] = $customer->postal_code ?? null;
        $formatted['date_of_birth'] = $customer->date_of_birth ?? null;
        $formatted['gender'] = $customer->gender ?? null;
        $formatted['nationality'] = $customer->nationality ?? null;

        // Emergency contact
        $formatted['emergency_contact'] = [
            'name' => $customer->emergency_name ?? null,
            'phone' => $customer->emergency_phone ?? null,
            'relationship' => $customer->emergency_relationship ?? null,
        ];

        // Preferences
        $formatted['dietary_requirements'] = $customer->dietary_requirements ?? null;
        $formatted['medical_conditions'] = $customer->medical_conditions ?? null;
        $formatted['special_needs'] = $customer->special_needs ?? null;
        $formatted['preferred_language'] = $customer->preferred_language ?? 'en';
        $formatted['preferred_currency'] = $customer->preferred_currency ?? 'USD';

        // Marketing
        $formatted['newsletter_optin'] = (bool) ($customer->newsletter_optin ?? false);
        $formatted['marketing_optin'] = (bool) ($customer->marketing_optin ?? false);
        $formatted['source'] = $customer->source ?? null;

        // Stats
        $formatted['total_travelers'] = (int) ($customer->total_travelers ?? 0);
        $formatted['last_travel_date'] = $customer->last_travel_date ?? null;
        $formatted['loyalty_points'] = (int) ($customer->loyalty_points ?? 0);

        // Gateway IDs
        $formatted['stripe_customer_id'] = $customer->stripe_customer_id ?? null;
        $formatted['paypal_customer_id'] = $customer->paypal_customer_id ?? null;
        $formatted['razorpay_customer_id'] = $customer->razorpay_customer_id ?? null;

        // Notes
        $formatted['notes'] = $customer->notes ?? null;

        // Recent bookings
        $formatted['recent_bookings'] = $customer->recent_bookings ?? [];

        // Timestamps
        $formatted['updated_at'] = $customer->updated_at ?? null;
        $formatted['last_login_at'] = $customer->last_login_at ?? null;
        $formatted['verified_at'] = $customer->verified_at ?? null;

        return $formatted;
    }
}

