<?php

namespace Yatra\Migration;

use Yatra\Database\Tables\ReviewsTable;
use Yatra\Utils\Logger;

/**
 * Review Migration - Migrate reviews from WordPress comments on old 'tour' posts
 * to the new ReviewsTable.
 */
class ReviewMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $reviewsTable = ReviewsTable::getTableName();

        // Old reviews are WordPress comments on 'tour' post type
        $oldReviews = $this->wpdb->get_results(
            "SELECT c.*, cm_rating.meta_value AS rating
             FROM {$this->wpdb->comments} c
             INNER JOIN {$this->wpdb->posts} p ON c.comment_post_ID = p.ID
             LEFT JOIN {$this->wpdb->commentmeta} cm_rating
                 ON c.comment_ID = cm_rating.comment_id AND cm_rating.meta_key = 'rating'
             WHERE p.post_type = 'tour'
             AND c.comment_type IN ('', 'comment', 'review', 'yatra_review')
             AND c.comment_approved != 'trash'"
        );

        $total = count($oldReviews);

        if ($total === 0) {
            return compact('migrated', 'skipped', 'failed');
        }

        foreach ($oldReviews as $review) {
            try {
                // Get the migrated trip ID
                $newTripId = $this->getRawPostMeta((int) $review->comment_post_ID, '_migrated_to_trip_id');

                if (!$newTripId) {
                    $skipped++;
                    continue;
                }

                $newTripId = (int) $newTripId;
                $rating = !empty($review->rating) ? min(5, max(1, (int) $review->rating)) : 5;

                // Check if already migrated (by matching trip_id + author_email + content)
                if (!$this->isForceMigration()) {
                    $exists = $this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT id FROM {$reviewsTable}
                         WHERE trip_id = %d AND author_email = %s AND content = %s LIMIT 1",
                        $newTripId,
                        $review->comment_author_email,
                        $review->comment_content
                    ));

                    if ($exists) {
                        $skipped++;
                        continue;
                    }
                }

                // Map comment_approved to review status
                $status = 'pending';
                if ($review->comment_approved === '1') {
                    $status = 'approved';
                } elseif ($review->comment_approved === 'spam' || $review->comment_approved === '0') {
                    $status = 'pending';
                }

                $inserted = $this->wpdb->insert(
                    $reviewsTable,
                    [
                        'trip_id' => $newTripId,
                        'user_id' => (int) $review->user_id ?: 0,
                        'rating' => $rating,
                        'title' => null,
                        'content' => $review->comment_content,
                        'author_name' => $review->comment_author ?: 'Anonymous',
                        'author_email' => $review->comment_author_email ?: null,
                        'author_location' => null,
                        'status' => $status,
                        'helpful_count' => 0,
                        'created_at' => $review->comment_date,
                        'updated_at' => $review->comment_date,
                        'created_by' => (int) $review->user_id ?: null,
                        'updated_by' => null,
                    ]
                );

                if ($inserted) {
                    $migrated++;
                } else {
                    $failed++;
                    Logger::error("Failed to insert review", [
                        'source' => 'migration',
                        'comment_id' => $review->comment_ID,
                        'error' => $this->wpdb->last_error
                    ]);
                }

                $this->updateProgress('reviews', 'running', $migrated, $skipped, $failed, $total, null, null);

            } catch (\Exception $e) {
                $failed++;
                Logger::error("Review migration exception", [
                    'source' => 'migration',
                    'comment_id' => $review->comment_ID,
                    'error' => $e->getMessage()
                ]);
                $this->updateProgress('reviews', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }
}
