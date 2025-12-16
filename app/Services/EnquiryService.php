<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\EnquiryRepository;
use Yatra\Repositories\TripRepository;

/**
 * Enquiry Service
 * 
 * Contains business logic for customer enquiries.
 * 
 * @package Yatra\Services
 */
class EnquiryService
{
    private EnquiryRepository $enquiryRepository;
    private TripRepository $tripRepository;

    public function __construct()
    {
        $this->enquiryRepository = new EnquiryRepository();
        $this->tripRepository = new TripRepository();
    }

    /**
     * Get paginated enquiries
     * 
     * @param array $filters Filters
     * @return array
     */
    public function getEnquiries(array $filters = []): array
    {
        $result = $this->enquiryRepository->paginate($filters);

        $result['data'] = array_map([$this, 'formatEnquiry'], $result['data']);

        return $result;
    }

    /**
     * Get single enquiry
     * 
     * @param int $id Enquiry ID
     * @return array|null
     */
    public function getEnquiry(int $id): ?array
    {
        $enquiry = $this->enquiryRepository->findWithTrip($id);

        if (!$enquiry) {
            return null;
        }

        return $this->formatEnquiry($enquiry);
    }

    /**
     * Create a new enquiry
     * 
     * @param array $data Enquiry data
     * @return array {success: bool, enquiry_id?: int, message: string}
     */
    public function createEnquiry(array $data): array
    {
        // Validate required fields
        if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
            return ['success' => false, 'message' => __('Name, email, and message are required.', 'yatra')];
        }

        // Validate email
        if (!is_email($data['email'])) {
            return ['success' => false, 'message' => __('Please provide a valid email address.', 'yatra')];
        }

        // Validate trip if provided
        if (!empty($data['trip_id'])) {
            $trip = $this->tripRepository->find((int) $data['trip_id']);
            if (!$trip) {
                return ['success' => false, 'message' => __('Trip not found.', 'yatra')];
            }
        }

        // Set default status
        if (empty($data['status'])) {
            $data['status'] = 'pending';
        }

        // Create enquiry
        $enquiryId = $this->enquiryRepository->create($data);

        if (!$enquiryId) {
            return ['success' => false, 'message' => __('Failed to submit enquiry.', 'yatra')];
        }
        
        // Get the full enquiry object for the action
        $enquiry = $this->enquiryRepository->find($enquiryId);
        
        /**
         * Action: Enquiry created
         * Fires after a new enquiry is successfully created
         * 
         * @param object $enquiry The enquiry object
         * @since 3.0.0
         */
        do_action('yatra_enquiry_created', $enquiry);

        // Send admin notification
        $this->sendAdminNotification($enquiryId);

        // Send customer confirmation
        $this->sendCustomerConfirmation($enquiryId);

        return [
            'success' => true,
            'enquiry_id' => $enquiryId,
            'message' => __('Your enquiry has been submitted successfully. We will get back to you soon.', 'yatra'),
        ];
    }

    /**
     * Update an enquiry
     * 
     * @param int   $id   Enquiry ID
     * @param array $data Enquiry data
     * @return array {success: bool, message: string}
     */
    public function updateEnquiry(int $id, array $data): array
    {
        $enquiry = $this->enquiryRepository->find($id);

        if (!$enquiry) {
            return ['success' => false, 'message' => __('Enquiry not found.', 'yatra')];
        }

        $updated = $this->enquiryRepository->update($id, $data);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update enquiry.', 'yatra')];
        }

        return [
            'success' => true,
            'message' => __('Enquiry updated successfully.', 'yatra'),
        ];
    }

    /**
     * Respond to an enquiry
     * 
     * @param int    $id       Enquiry ID
     * @param string $response Response message
     * @return array {success: bool, message: string}
     */
    public function respondToEnquiry(int $id, string $response): array
    {
        $enquiry = $this->enquiryRepository->findWithTrip($id);

        if (!$enquiry) {
            return ['success' => false, 'message' => __('Enquiry not found.', 'yatra')];
        }

        if (empty(trim($response))) {
            return ['success' => false, 'message' => __('Response message is required.', 'yatra')];
        }

        $updated = $this->enquiryRepository->addResponse($id, $response, get_current_user_id());

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to save response.', 'yatra')];
        }
        
        /**
         * Action: Enquiry responded
         * Fires after admin responds to an enquiry
         * 
         * @param object $enquiry The enquiry object
         * @param string $response The response message
         * @since 3.0.0
         */
        do_action('yatra_enquiry_responded', $enquiry, $response);

        // Send response email to customer
        $this->sendResponseEmail($enquiry, $response);

        return [
            'success' => true,
            'message' => __('Response sent successfully.', 'yatra'),
        ];
    }

    /**
     * Delete an enquiry
     * 
     * @param int $id Enquiry ID
     * @return array {success: bool, message: string}
     */
    public function deleteEnquiry(int $id): array
    {
        $enquiry = $this->enquiryRepository->find($id);

        if (!$enquiry) {
            return ['success' => false, 'message' => __('Enquiry not found.', 'yatra')];
        }

        $deleted = $this->enquiryRepository->delete($id);

        if (!$deleted) {
            return ['success' => false, 'message' => __('Failed to delete enquiry.', 'yatra')];
        }

        return [
            'success' => true,
            'message' => __('Enquiry deleted successfully.', 'yatra'),
        ];
    }

    /**
     * Bulk update status
     * 
     * @param array  $ids    Enquiry IDs
     * @param string $status New status
     * @return array {success: bool, affected: int, message: string}
     */
    public function bulkUpdateStatus(array $ids, string $status): array
    {
        // Allowed statuses for bulk updates. This list is mirrored in the admin UI.
        $validStatuses = ['pending', 'read', 'responded', 'archived', 'spam', 'trash'];

        if (!in_array($status, $validStatuses, true)) {
            return ['success' => false, 'affected' => 0, 'message' => __('Invalid status.', 'yatra')];
        }

        $affected = $this->enquiryRepository->bulkUpdateStatus($ids, $status);

        return [
            'success' => true,
            'affected' => $affected,
            'message' => sprintf(__('%d enquiries updated.', 'yatra'), $affected),
        ];
    }

    /**
     * Bulk delete enquiries
     * 
     * @param array $ids Enquiry IDs
     * @return array {success: bool, affected: int, message: string}
     */
    public function bulkDelete(array $ids): array
    {
        $affected = $this->enquiryRepository->bulkDelete($ids);

        return [
            'success' => true,
            'affected' => $affected,
            'message' => sprintf(__('%d enquiries deleted.', 'yatra'), $affected),
        ];
    }

    /**
     * Get enquiry statistics
     * 
     * @return array
     */
    public function getStats(): array
    {
        return $this->enquiryRepository->getStats();
    }

    /**
     * Format enquiry for API response
     * 
     * @param object $enquiry Raw enquiry data
     * @return array
     */
    private function formatEnquiry(object $enquiry): array
    {
        return [
            'id' => (int) $enquiry->id,
            'trip_id' => $enquiry->trip_id ? (int) $enquiry->trip_id : null,
            'trip_title' => $enquiry->trip_title ?? null,
            'trip_slug' => $enquiry->trip_slug ?? null,
            'name' => $enquiry->name,
            'email' => $enquiry->email,
            'phone' => $enquiry->phone,
            'subject' => $enquiry->subject ?? null,
            'message' => $enquiry->message,
            'travel_date' => $enquiry->travel_date ?? null,
            'travelers_count' => isset($enquiry->travelers_count) ? (int) $enquiry->travelers_count : (((int) ($enquiry->adults ?? 0) + (int) ($enquiry->children ?? 0)) ?: null),
            'status' => $enquiry->status,
            'response' => $enquiry->response ?? null,
            'responded_by' => $enquiry->responded_by ? (int) $enquiry->responded_by : null,
            'responded_at' => $enquiry->responded_at ?? null,
            'created_at' => $enquiry->created_at,
            'updated_at' => $enquiry->updated_at,
        ];
    }

    /**
     * Send admin notification for new enquiry
     * 
     * @param int $enquiryId Enquiry ID
     */
    private function sendAdminNotification(int $enquiryId): void
    {
        $enquiry = $this->enquiryRepository->findWithTrip($enquiryId);

        if (!$enquiry) {
            return;
        }

        $adminEmail = get_option('admin_email');

        $subject = sprintf(
            __('[%s] New Enquiry from %s', 'yatra'),
            get_bloginfo('name'),
            $enquiry->name
        );

        $message = sprintf(
            __("New enquiry received:\n\nName: %s\nEmail: %s\nPhone: %s\nTrip: %s\n\nMessage:\n%s\n\nView in admin: %s", 'yatra'),
            $enquiry->name,
            $enquiry->email,
            $enquiry->phone ?: 'N/A',
            $enquiry->trip_title ?: 'General',
            $enquiry->message,
            admin_url('admin.php?page=yatra&subpage=enquiries&action=view&id=' . $enquiryId)
        );

        wp_mail($adminEmail, $subject, $message);
    }

    /**
     * Send customer confirmation email
     * 
     * @param int $enquiryId Enquiry ID
     */
    private function sendCustomerConfirmation(int $enquiryId): void
    {
        $enquiry = $this->enquiryRepository->findWithTrip($enquiryId);

        if (!$enquiry || empty($enquiry->email)) {
            return;
        }

        $subject = sprintf(
            __('[%s] We received your enquiry', 'yatra'),
            get_bloginfo('name')
        );

        $message = sprintf(
            __("Hi %s,\n\nThank you for your enquiry. We have received your message and will get back to you shortly.\n\nBest regards,\n%s", 'yatra'),
            $enquiry->name,
            get_bloginfo('name')
        );

        wp_mail($enquiry->email, $subject, $message);
    }

    /**
     * Send response email to customer
     * 
     * @param object $enquiry  Enquiry data
     * @param string $response Response message
     */
    private function sendResponseEmail(object $enquiry, string $response): void
    {
        if (empty($enquiry->email)) {
            return;
        }

        $subject = sprintf(
            __('[%s] Response to your enquiry', 'yatra'),
            get_bloginfo('name')
        );

        $message = sprintf(
            __("Hi %s,\n\nThank you for contacting us. Here is our response to your enquiry:\n\n%s\n\nYour original message:\n%s\n\nBest regards,\n%s", 'yatra'),
            $enquiry->name,
            $response,
            $enquiry->message,
            get_bloginfo('name')
        );

        wp_mail($enquiry->email, $subject, $message);
    }
}

