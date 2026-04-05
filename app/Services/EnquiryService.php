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

        // Build metadata for traveler classifications (flat array, no wrapper)
        $classifications = [];
        if (!empty($data['metadata'])) {
            $metaValue = $data['metadata'];
            if (is_string($metaValue)) {
                $decoded = json_decode($metaValue, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $metaValue = $decoded;
                }
            }
            if (is_array($metaValue)) {
                // Accept both wrapped {classifications: [...]} and direct array [...]
                if (isset($metaValue['classifications']) && is_array($metaValue['classifications'])) {
                    $classifications = $metaValue['classifications'];
                } elseif (array_is_list($metaValue)) {
                    $classifications = $metaValue;
                }
            }
        }

        // Backward compatibility: derive from adults/children if still not provided
        if (empty($classifications) && (isset($data['adults']) || isset($data['children']))) {
            $adults = isset($data['adults']) ? (int) $data['adults'] : null;
            $children = isset($data['children']) ? (int) $data['children'] : null;
            if ($adults !== null) {
                $classifications[] = ['id' => 'adult', 'title' => 'Adult', 'count' => $adults];
            }
            if ($children !== null) {
                $classifications[] = ['id' => 'child', 'title' => 'Child', 'count' => $children];
            }
        }

        // Compute travelers_count from classifications
        $travelersCount = null;
        if (!empty($classifications)) {
            $travelersCount = array_reduce($classifications, function ($carry, $item) {
                $count = isset($item['count']) ? (int) $item['count'] : 0;
                return $carry + $count;
            }, 0);
            if ($travelersCount === 0) {
                $travelersCount = null;
            }
        } elseif (isset($data['adults']) || isset($data['children'])) {
            $travelersCount = ((int) ($data['adults'] ?? 0) + (int) ($data['children'] ?? 0)) ?: null;
        }

        $data['metadata'] = !empty($classifications) ? wp_json_encode($classifications) : null;
        $data['travelers_count'] = $travelersCount;

        // Capture IP and user agent if not provided
        if (empty($data['ip_address'])) {
            $data['ip_address'] = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null;
        }
        if (empty($data['user_agent'])) {
            $data['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? null;
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

        // Core plaintext (wp_mail). Pro Email Automation sends HTML when templates exist — see
        // yatra_send_enquiry_created_* filters in yatra-pro EmailAutomationHooks.
        if (apply_filters('yatra_send_enquiry_created_admin_email', true, $enquiry)) {
            $this->sendAdminNotification($enquiryId);
        }

        if (apply_filters('yatra_send_enquiry_created_customer_email', true, $enquiry)) {
            $this->sendCustomerConfirmation($enquiryId);
        }

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

        if (apply_filters('yatra_send_enquiry_response_core_email', true, $enquiry, $response)) {
            $this->sendResponseEmail($enquiry, $response);
        }

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
        $metadata = [];
        if (!empty($enquiry->metadata)) {
            $decoded = json_decode($enquiry->metadata, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $metadata = $decoded;
            }
        }

        $travelersCount = null;
        if (!empty($metadata['classifications']) && is_array($metadata['classifications'])) {
            $travelersCount = array_reduce($metadata['classifications'], function ($carry, $item) {
                $count = isset($item['count']) ? (int) $item['count'] : 0;
                return $carry + $count;
            }, 0);
            if ($travelersCount === 0) {
                $travelersCount = null;
            }
        } elseif (isset($enquiry->travelers_count)) {
            $travelersCount = $enquiry->travelers_count ? (int) $enquiry->travelers_count : null;
        } elseif (isset($enquiry->adults) || isset($enquiry->children)) {
            // Backward compatibility fallback
            $travelersCount = ((int) ($enquiry->adults ?? 0) + (int) ($enquiry->children ?? 0)) ?: null;
        }

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
            'travelers_count' => $travelersCount,
            'metadata' => $metadata ?: null,
            'status' => $enquiry->status,
            'response' => $enquiry->response_notes ?? ($enquiry->response ?? null),
            'response_notes' => $enquiry->response_notes ?? null,
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
        if ($adminEmail === '' || !is_email($adminEmail)) {
            return;
        }

        $subject = sprintf(
            /* translators: 1: site name, 2: customer name */
            __('💬 [%1$s] New enquiry · %2$s', 'yatra'),
            get_bloginfo('name'),
            $enquiry->name
        );

        $body = EmailTemplateDefaults::renderCoreEnquiryAdminNotificationHtml($enquiry);

        EmailService::send($adminEmail, $subject, $body, ['Content-Type: text/html; charset=UTF-8']);
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
            __('✉️ [%s] We received your message', 'yatra'),
            get_bloginfo('name')
        );

        $body = EmailTemplateDefaults::renderCoreEnquiryCustomerConfirmationHtml($enquiry);

        EmailService::send($enquiry->email, $subject, $body, ['Content-Type: text/html; charset=UTF-8']);
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
            __('💬 [%s] Re: your enquiry', 'yatra'),
            get_bloginfo('name')
        );

        $body = EmailTemplateDefaults::renderCoreEnquiryResponseHtml($enquiry, $response);

        EmailService::send($enquiry->email, $subject, $body, ['Content-Type: text/html; charset=UTF-8']);
    }
}

