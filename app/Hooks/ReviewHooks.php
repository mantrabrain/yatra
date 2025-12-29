<?php

declare(strict_types=1);

namespace Yatra\Hooks;

use Yatra\Repositories\ReviewRepository;
use Yatra\Repositories\EnquiryRepository;

/**
 * Review and Enquiry AJAX Hooks
 *
 * Handles AJAX requests for reviews and enquiries
 */
class ReviewHooks
{
    /**
     * Initialize review and enquiry hooks
     */
    public static function init(): void
    {
        // AJAX handler for review submission
        add_action('wp_ajax_yatra_submit_review', [self::class, 'handleReviewSubmission']);
        add_action('wp_ajax_nopriv_yatra_submit_review', [self::class, 'handleReviewSubmissionNoPriv']);

        // AJAX handler for enquiry submission (allow both logged in and guest users)
        add_action('wp_ajax_yatra_submit_enquiry', [self::class, 'handleEnquirySubmission']);
        add_action('wp_ajax_nopriv_yatra_submit_enquiry', [self::class, 'handleEnquirySubmission']);
    }

    /**
     * Handle review submission (logged-in users)
     */
    public static function handleReviewSubmission(): void
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_review_nonce')) {
            wp_send_json_error(['message' => __('Security check failed.', 'yatra')]);
        }

        // Check if user is logged in
        if (!is_user_logged_in()) {
            wp_send_json_error(['message' => __('You must be logged in to submit a review.', 'yatra')]);
        }

        $user_id = get_current_user_id();

        // Validate required fields
        $trip_id = (int) ($_POST['trip_id'] ?? 0);
        $rating = (int) ($_POST['rating'] ?? 0);
        $title = sanitize_text_field($_POST['title'] ?? '');
        $content = sanitize_textarea_field($_POST['content'] ?? '');

        // Validate trip ID
        if ($trip_id <= 0) {
            wp_send_json_error(['message' => __('Invalid trip.', 'yatra')]);
        }

        // Validate rating
        if ($rating < 1 || $rating > 5) {
            wp_send_json_error(['message' => __('Please provide a valid rating.', 'yatra')]);
        }

        // Validate title and content
        if (empty($title) || empty($content)) {
            wp_send_json_error(['message' => __('Please provide both title and content for your review.', 'yatra')]);
        }

        $reviewRepository = new ReviewRepository();

        // Check if this is an edit or new review
        $action_type = $_POST['action_type'] ?? 'create';
        $review_id = (int) ($_POST['review_id'] ?? 0);

        if ($action_type === 'edit' && $review_id > 0) {
            // Editing existing review
            $existing_review = yatra_get_user_review($trip_id, $user_id);

            if (!$existing_review || (int) $existing_review->id !== $review_id) {
                wp_send_json_error(['message' => __('Review not found or you do not have permission to edit it.', 'yatra')]);
            }

            $result = $reviewRepository->update($review_id, [
                'rating' => $rating,
                'title' => $title,
                'content' => $content,
                'updated_at' => current_time('mysql'),
            ]);

            if ($result) {
                wp_send_json_success(['message' => __('Your review has been updated!', 'yatra')]);
            } else {
                wp_send_json_error(['message' => __('Failed to update review. Please try again.', 'yatra')]);
            }
        } else {
            // Creating new review
            if (!yatra_can_review($trip_id, $user_id)) {
                wp_send_json_error(['message' => __('You cannot review this trip.', 'yatra')]);
            }

            // Get user info
            $user = wp_get_current_user();

            $result = $reviewRepository->create([
                'trip_id' => $trip_id,
                'user_id' => $user_id,
                'rating' => $rating,
                'title' => $title,
                'content' => $content,
                'status' => \Yatra\Services\SettingsService::autoApproveReviews() ? 'approved' : 'pending',
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ]);

            if ($result) {
                wp_send_json_success(['message' => __('Your review has been submitted!', 'yatra')]);
            } else {
                wp_send_json_error(['message' => __('Failed to submit review. Please try again.', 'yatra')]);
            }
        }
    }

    /**
     * Handle review submission (non-logged-in users)
     */
    public static function handleReviewSubmissionNoPriv(): void
    {
        wp_send_json_error(['message' => __('You must be logged in to submit a review.', 'yatra')]);
    }

    /**
     * Handle enquiry submission
     */
    public static function handleEnquirySubmission(): void
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_enquiry_nonce')) {
            wp_send_json_error(['message' => __('Security check failed.', 'yatra')]);
        }

        // Validate required fields
        $name = sanitize_text_field($_POST['name'] ?? '');
        $email = sanitize_email($_POST['email'] ?? '');
        $phone = sanitize_text_field($_POST['phone'] ?? '');
        $message = sanitize_textarea_field($_POST['message'] ?? '');
        $trip_id = (int) ($_POST['trip_id'] ?? 0);
        $adults = (int) ($_POST['adults'] ?? 0);
        $children = (int) ($_POST['children'] ?? 0);

        if (empty($name) || empty($email) || empty($message)) {
            wp_send_json_error(['message' => __('Please fill in all required fields.', 'yatra')]);
        }

        if (!is_email($email)) {
            wp_send_json_error(['message' => __('Please provide a valid email address.', 'yatra')]);
        }

        if ($adults < 0 || $children < 0 || ($adults + $children) === 0) {
            wp_send_json_error(['message' => __('Please specify at least one traveler.', 'yatra')]);
        }

        // Save enquiry
        $enquiryRepository = new EnquiryRepository();

        $result = $enquiryRepository->create([
            'trip_id' => $trip_id > 0 ? $trip_id : null,
            'name' => $name,
            'email' => $email,
            'phone' => $phone ?: null,
            'message' => $message,
            'adults' => $adults,
            'children' => $children,
            'status' => 'pending',
            'created_at' => current_time('mysql'),
        ]);

        if ($result) {
            // Send email notification
            self::sendEnquiryNotificationEmail($result, [
                'trip_id' => $trip_id,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'message' => $message,
                'adults' => $adults,
                'children' => $children,
            ]);

            wp_send_json_success(['message' => __('Your enquiry has been submitted successfully!', 'yatra')]);
        } else {
            wp_send_json_error(['message' => __('Failed to submit enquiry. Please try again.', 'yatra')]);
        }
    }

    /**
     * Send enquiry notification email
     */
    private static function sendEnquiryNotificationEmail(int $enquiry_id, array $data): void
    {
        // Get admin email
        $admin_email = get_option('admin_email');

        // Get trip title if available
        $trip_title = '';
        if (!empty($data['trip_id'])) {
            $tripRepository = new \Yatra\Repositories\TripRepository();
            $trip = $tripRepository->find((int) $data['trip_id']);
            $trip_title = $trip ? $trip->title : '';
        }

        // Build email subject
        $subject = sprintf(__('New Enquiry from %s', 'yatra'), $data['name']);
        if ($trip_title) {
            $subject .= ' - ' . $trip_title;
        }

        // Build email body
        $body = sprintf(__('Name: %s', 'yatra'), $data['name']) . "\n";
        $body .= sprintf(__('Email: %s', 'yatra'), $data['email']) . "\n";

        if (!empty($data['phone'])) {
            $body .= sprintf(__('Phone: %s', 'yatra'), $data['phone']) . "\n";
        }

        if (!empty($trip_title)) {
            $body .= sprintf(__('Trip: %s', 'yatra'), $trip_title) . "\n";
        }

        $body .= sprintf(__('Travelers: %d Adults, %d Children', 'yatra'), $data['adults'], $data['children']) . "\n\n";
        $body .= sprintf(__('Message:', 'yatra')) . "\n" . $data['message'];

        // Send email
        wp_mail($admin_email, $subject, $body);
    }
}
