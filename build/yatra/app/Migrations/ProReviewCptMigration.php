<?php

namespace Yatra\Migration;

use Yatra\Database\Tables\ReviewsTable;
use Yatra\Utils\Logger;

/**
 * Migrate legacy Pro reviews stored as CPT `yatra-review` into the new ReviewsTable.
 *
 * Legacy Pro stored review fields as post meta:
 * - tour_id, rating, fullname, email, url
 * Review content is in post_content; title in post_title.
 */
class ProReviewCptMigration extends BaseMigration
{
    public function run(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $reviewsTable = ReviewsTable::getTableName();

        $old = $this->wpdb->get_results(
            "SELECT ID, post_title, post_content, post_date, post_status
             FROM {$this->wpdb->posts}
             WHERE post_type = 'yatra-review'
             AND post_status NOT IN ('trash','auto-draft')"
        );

        $total = is_array($old) ? count($old) : 0;
        if ($total === 0) {
            return compact('migrated', 'skipped', 'failed');
        }

        foreach ($old as $post) {
            try {
                $meta = $this->getPostMeta((int) $post->ID);

                $tourId = (int) ($meta['tour_id'] ?? 0);
                if ($tourId <= 0) {
                    $skipped++;
                    $this->updateProgress('pro_reviews_cpt', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $newTripId = $this->getMigratedTripId($tourId);
                if (!$newTripId) {
                    $skipped++;
                    $this->updateProgress('pro_reviews_cpt', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $rating = isset($meta['rating']) ? (int) $meta['rating'] : 5;
                $rating = min(5, max(1, $rating ?: 5));

                $authorName = (string) ($meta['fullname'] ?? 'Anonymous');
                $authorEmail = isset($meta['email']) ? (string) $meta['email'] : null;
                $authorLocation = null;

                $status = 'pending';
                if ((string) $post->post_status === 'publish') {
                    $status = 'approved';
                }

                // De-dupe (best-effort) unless forced: match trip_id + author_email + content.
                if (!$this->isForceMigration() && $authorEmail) {
                    $exists = $this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT id FROM {$reviewsTable}
                         WHERE trip_id = %d AND author_email = %s AND content = %s LIMIT 1",
                        (int) $newTripId,
                        $authorEmail,
                        (string) $post->post_content
                    ));
                    if ($exists) {
                        $skipped++;
                        $this->updateProgress('pro_reviews_cpt', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                }

                $inserted = $this->wpdb->insert(
                    $reviewsTable,
                    [
                        'trip_id' => (int) $newTripId,
                        'user_id' => 0,
                        'rating' => $rating,
                        'title' => $post->post_title !== '' ? (string) $post->post_title : null,
                        'content' => (string) $post->post_content,
                        'author_name' => $authorName !== '' ? $authorName : 'Anonymous',
                        'author_email' => $authorEmail !== '' ? $authorEmail : null,
                        'author_location' => $authorLocation,
                        'status' => $status,
                        'helpful_count' => 0,
                        'created_at' => (string) $post->post_date,
                        'updated_at' => (string) $post->post_date,
                        'created_by' => null,
                        'updated_by' => null,
                    ]
                );

                if ($inserted) {
                    $migrated++;
                } else {
                    $failed++;
                    Logger::error('ProReviewCptMigration: insert failed', [
                        'source' => 'migration',
                        'post_id' => (int) $post->ID,
                        'error' => $this->wpdb->last_error,
                    ]);
                }

                $this->updateProgress('pro_reviews_cpt', 'running', $migrated, $skipped, $failed, $total, null, null);
            } catch (\Throwable $e) {
                $failed++;
                Logger::error('ProReviewCptMigration exception', [
                    'source' => 'migration',
                    'post_id' => (int) $post->ID,
                    'error' => $e->getMessage(),
                ]);
                $this->updateProgress('pro_reviews_cpt', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }
}

