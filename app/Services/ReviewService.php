<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\ReviewRepository;
use Yatra\Repositories\TripRepository;

/**
 * Review Service
 * 
 * Contains business logic for trip reviews.
 * 
 * @package Yatra\Services
 */
class ReviewService
{
    private ReviewRepository $reviewRepository;
    private TripRepository $tripRepository;

    public function __construct()
    {
        $this->reviewRepository = new ReviewRepository();
        $this->tripRepository = new TripRepository();
    }

    /**
     * Get paginated reviews
     * 
     * @param array $filters Filters
     * @return array
     */
    public function getReviews(array $filters = []): array
    {
        $result = $this->reviewRepository->paginate($filters);

        $result['data'] = array_map([$this, 'formatReview'], $result['data']);

        return $result;
    }

    /**
     * Get single review
     * 
     * @param int $id Review ID
     * @return array|null
     */
    public function getReview(int $id): ?array
    {
        $review = $this->reviewRepository->findWithTrip($id);

        if (!$review) {
            return null;
        }

        return $this->formatReview($review);
    }

    /**
     * Get approved reviews for a trip
     * 
     * @param int $tripId Trip ID
     * @param int $limit  Limit results
     * @return array
     */
    public function getTripReviews(int $tripId, int $limit = 10): array
    {
        $reviews = $this->reviewRepository->findApprovedByTripId($tripId, $limit);

        return array_map([$this, 'formatReview'], $reviews);
    }

    /**
     * Get trip rating summary
     * 
     * @param int $tripId Trip ID
     * @return array
     */
    public function getTripRatingSummary(int $tripId): array
    {
        return [
            'average_rating' => $this->reviewRepository->getAverageRating($tripId),
            'review_count' => $this->reviewRepository->getReviewCount($tripId),
            'distribution' => $this->reviewRepository->getRatingDistribution($tripId),
        ];
    }

    /**
     * Submit a review
     * 
     * @param array $data Review data
     * @return array {success: bool, review_id?: int, message: string}
     */
    public function submitReview(array $data): array
    {
        // Validate required fields
        if (empty($data['trip_id']) || empty($data['rating'])) {
            return ['success' => false, 'message' => __('Trip and rating are required.', 'yatra')];
        }

        // Validate trip exists
        $trip = $this->tripRepository->find((int) $data['trip_id']);
        if (!$trip) {
            return ['success' => false, 'message' => __('Trip not found.', 'yatra')];
        }

        // Validate rating
        $rating = (int) $data['rating'];
        if ($rating < 1 || $rating > 5) {
            return ['success' => false, 'message' => __('Rating must be between 1 and 5.', 'yatra')];
        }

        // Check if user already reviewed this trip
        $userId = $data['user_id'] ?? get_current_user_id();
        if ($userId) {
            $existingReview = $this->reviewRepository->findByUserAndTrip($userId, (int) $data['trip_id']);
            if ($existingReview) {
                return ['success' => false, 'message' => __('You have already reviewed this trip.', 'yatra')];
            }
            $data['user_id'] = $userId;
        }

        // Set reviewer info from user if logged in
        if ($userId && empty($data['reviewer_name'])) {
            $user = get_userdata($userId);
            if ($user) {
                $data['reviewer_name'] = $user->display_name;
                $data['reviewer_email'] = $user->user_email;
            }
        }

        // Set default status
        $settings = SettingsService::getSettings();
        $autoApprove = $settings['reviews']['auto_approve'] ?? false;
        $data['status'] = $autoApprove ? 'approved' : 'pending';

        // Create review
        $reviewId = $this->reviewRepository->create($data);

        if (!$reviewId) {
            return ['success' => false, 'message' => __('Failed to submit review.', 'yatra')];
        }

        // Update trip rating cache
        $this->updateTripRatingCache((int) $data['trip_id']);

        return [
            'success' => true,
            'review_id' => $reviewId,
            'message' => $autoApprove 
                ? __('Thank you for your review!', 'yatra')
                : __('Thank you! Your review is pending approval.', 'yatra'),
        ];
    }

    /**
     * Update a review
     * 
     * @param int   $id   Review ID
     * @param array $data Review data
     * @return array {success: bool, message: string}
     */
    public function updateReview(int $id, array $data): array
    {
        $review = $this->reviewRepository->find($id);

        if (!$review) {
            return ['success' => false, 'message' => __('Review not found.', 'yatra')];
        }

        // Check if user can edit
        $userId = get_current_user_id();
        if ($userId && !current_user_can('manage_options')) {
            if (!$this->reviewRepository->canUserEdit($id, $userId)) {
                return ['success' => false, 'message' => __('You cannot edit this review.', 'yatra')];
            }
        }

        // Validate rating if provided
        if (isset($data['rating'])) {
            $rating = (int) $data['rating'];
            if ($rating < 1 || $rating > 5) {
                return ['success' => false, 'message' => __('Rating must be between 1 and 5.', 'yatra')];
            }
        }

        $updated = $this->reviewRepository->update($id, $data);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update review.', 'yatra')];
        }

        // Update trip rating cache
        $this->updateTripRatingCache((int) $review->trip_id);

        return [
            'success' => true,
            'message' => __('Review updated successfully.', 'yatra'),
        ];
    }

    /**
     * Update review status
     * 
     * @param int    $id     Review ID
     * @param string $status New status
     * @return array {success: bool, message: string}
     */
    public function updateStatus(int $id, string $status): array
    {
        $validStatuses = ['pending', 'approved', 'rejected', 'spam'];

        if (!in_array($status, $validStatuses, true)) {
            return ['success' => false, 'message' => __('Invalid status.', 'yatra')];
        }

        $review = $this->reviewRepository->find($id);

        if (!$review) {
            return ['success' => false, 'message' => __('Review not found.', 'yatra')];
        }

        $updated = $this->reviewRepository->updateStatus($id, $status);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update status.', 'yatra')];
        }

        // Update trip rating cache
        $this->updateTripRatingCache((int) $review->trip_id);

        return [
            'success' => true,
            'message' => sprintf(__('Review status updated to %s.', 'yatra'), $status),
        ];
    }

    /**
     * Delete a review
     * 
     * @param int $id Review ID
     * @return array {success: bool, message: string}
     */
    public function deleteReview(int $id): array
    {
        $review = $this->reviewRepository->find($id);

        if (!$review) {
            return ['success' => false, 'message' => __('Review not found.', 'yatra')];
        }

        $tripId = (int) $review->trip_id;

        $deleted = $this->reviewRepository->delete($id);

        if (!$deleted) {
            return ['success' => false, 'message' => __('Failed to delete review.', 'yatra')];
        }

        // Update trip rating cache
        $this->updateTripRatingCache($tripId);

        return [
            'success' => true,
            'message' => __('Review deleted successfully.', 'yatra'),
        ];
    }

    /**
     * Check if user can review a trip
     * 
     * @param int      $tripId Trip ID
     * @param int|null $userId User ID (current user if null)
     * @return array {can_review: bool, reason?: string}
     */
    public function canUserReview(int $tripId, ?int $userId = null): array
    {
        $userId = $userId ?? get_current_user_id();

        // Check if user is logged in
        $settings = SettingsService::getSettings();
        $requireLogin = $settings['reviews']['require_login'] ?? true;

        if ($requireLogin && !$userId) {
            return [
                'can_review' => false,
                'reason' => __('You must be logged in to leave a review.', 'yatra'),
            ];
        }

        // Check if user already reviewed
        if ($userId) {
            $existingReview = $this->reviewRepository->findByUserAndTrip($userId, $tripId);
            if ($existingReview) {
                return [
                    'can_review' => false,
                    'reason' => __('You have already reviewed this trip.', 'yatra'),
                    'existing_review_id' => (int) $existingReview->id,
                ];
            }
        }

        return ['can_review' => true];
    }

    /**
     * Get review statistics
     * 
     * @return array
     */
    public function getStats(): array
    {
        return $this->reviewRepository->getStats();
    }

    /**
     * Format review for API response
     * 
     * @param object $review Raw review data
     * @return array
     */
    private function formatReview(object $review): array
    {
        return [
            'id' => (int) $review->id,
            'trip_id' => (int) $review->trip_id,
            'trip_title' => $review->trip_title ?? null,
            'trip_slug' => $review->trip_slug ?? null,
            'user_id' => $review->user_id ? (int) $review->user_id : null,
            'user_display_name' => $review->user_display_name ?? null,
            'rating' => (int) $review->rating,
            'review_text' => $review->review_text,
            'reviewer_name' => $review->reviewer_name,
            'reviewer_email' => $review->reviewer_email,
            'status' => $review->status,
            'admin_response' => $review->admin_response ?? null,
            'responded_by' => $review->responded_by ? (int) $review->responded_by : null,
            'responded_at' => $review->responded_at ?? null,
            'can_edit' => $review->user_id 
                ? $this->reviewRepository->canUserEdit((int) $review->id, (int) $review->user_id)
                : false,
            'created_at' => $review->created_at,
            'updated_at' => $review->updated_at,
        ];
    }

    /**
     * Update trip's cached rating values
     * 
     * @param int $tripId Trip ID
     */
    private function updateTripRatingCache(int $tripId): void
    {
        $averageRating = $this->reviewRepository->getAverageRating($tripId);
        $reviewCount = $this->reviewRepository->getReviewCount($tripId);

        // Update trip record with cached values via repository
        $this->tripRepository->update($tripId, [
            'average_rating' => $averageRating,
            'review_count' => $reviewCount,
        ]);
    }
}

