<?php
if (!defined('ABSPATH')) {
    exit;
}

// Reviews Section
// Expected variables: $trip
?>
<!-- Reviews: full width within unified trip container (same max-width + padding as .yatra-trip-container) -->
<section class="yatra-reviews-section" id="reviews" itemscope itemtype="https://schema.org/Review">
    <div class="yatra-reviews-section-container">
        <div class="yatra-reviews-header">
            <h2 class="yatra-reviews-section-title">
                <?php echo yatra_svg_icon('star', 'yatra-reviews-section-icon'); ?>
                <?php echo esc_html__('Reviews', 'yatra'); ?>
            </h2>
            <meta itemprop="about" content="<?php echo esc_attr($trip->getTitle()); ?>">
        </div>

        <?php
        // Use dynamic reviews from database (via SingleTripController)
        $display_reviews = !empty($trip->reviews) && is_array($trip->reviews) ? $trip->reviews : [];

        // Total approved count and average come from SQL on the Trip model (list may be capped at N rows).
        $total_reviews = (int) ($trip->review_count ?? 0);
        if ($total_reviews < 1) {
            $total_reviews = count($display_reviews);
        }
        $avg_rating = (isset($trip->average_rating) && (float) $trip->average_rating > 0)
            ? (float) $trip->average_rating
            : 0.0;

        // Rating distribution: prefer full aggregate from Trip (accurate when review list is limited).
        $rating_distribution = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
        $dist = $trip->rating_distribution ?? null;
        if (is_array($dist) && $dist !== [] && ($trip->review_count ?? 0) > 0) {
            foreach ([5, 4, 3, 2, 1] as $star) {
                $rating_distribution[$star] = (int) ($dist[$star] ?? $dist[(string) $star] ?? 0);
            }
        } else {
            foreach ($display_reviews as $review) {
                $review_rating = (int) (is_object($review) ? ($review->rating ?? 0) : ($review['rating'] ?? 0));
                if ($review_rating >= 1 && $review_rating <= 5) {
                    $rating_distribution[$review_rating]++;
                }
            }
        }

        // If we have reviews, calculate average from them
        if ($total_reviews > 0 && $avg_rating == 0) {
            $total_rating = 0;
            foreach ($display_reviews as $review) {
                $total_rating += (int) (is_object($review) ? ($review->rating ?? 0) : ($review['rating'] ?? 0));
            }
            $avg_rating = round($total_rating / $total_reviews, 1);
        }
        ?>

        <div class="yatra-reviews-container">
            <!-- Left: Overall Rating Summary -->
            <div class="yatra-reviews-summary">
                <div class="yatra-overall-rating">
                    <div class="yatra-overall-rating-score">
                        <span class="yatra-rating-big"><?php echo esc_html(number_format($avg_rating, 1)); ?></span>
                        <span class="yatra-rating-max">/5</span>
                    </div>
                    <div class="yatra-overall-stars">
                        <?php
                        $full_stars = floor($avg_rating);
                        $has_half = ($avg_rating - $full_stars) >= 0.3;
                        for ($i = 1; $i <= 5; $i++):
                            if ($i <= $full_stars):
                                ?>
                                <span class="yatra-star-icon filled">★</span>
                            <?php elseif ($i == $full_stars + 1 && $has_half): ?>
                                <span class="yatra-star-icon half">★</span>
                            <?php else: ?>
                                <span class="yatra-star-icon">★</span>
                            <?php endif; endfor; ?>
                    </div>
                    <p class="yatra-reviews-based-on">
                        <?php echo esc_html(sprintf(_n('based on %s review', 'based on %s reviews', $total_reviews, 'yatra'), number_format($total_reviews))); ?>
                    </p>
                </div>

                <div class="yatra-rating-distribution">
                    <h4 class="yatra-rating-distribution-title"><?php echo esc_html__('Rating breakdown', 'yatra'); ?></h4>
                    <?php for ($star = 5; $star >= 1; $star--):
                        $count = $rating_distribution[$star];
                        $percentage = $total_reviews > 0 ? ($count / $total_reviews) * 100 : 0;
                        ?>
                        <div class="yatra-rating-row">
                            <span class="yatra-rating-star-label">
                                <?php for ($s = 1; $s <= 5; $s++): ?>
                                    <span class="yatra-breakdown-star <?php echo $s <= $star ? 'filled' : ''; ?>">★</span>
                                <?php endfor; ?>
                            </span>
                            <div class="yatra-rating-bar">
                                <div class="yatra-rating-bar-fill" style="width: <?php echo esc_attr($percentage); ?>%"></div>
                            </div>
                            <span class="yatra-rating-count"><?php echo esc_html($count); ?></span>
                        </div>
                    <?php endfor; ?>
                </div>
            </div>

            <!-- Right: Reviews List -->
            <div class="yatra-reviews-list">
                <?php if (!empty($display_reviews)): ?>
                    <!-- Sort & Filter Toolbar -->
                    <div class="yatra-reviews-toolbar">
                        <div class="yatra-reviews-sort">
                            <span class="yatra-sort-label"><?php echo esc_html__('Sort by:', 'yatra'); ?></span>
                            <select class="yatra-sort-select" id="review-sort">
                                <option value="newest"><?php echo esc_html__('Newest first', 'yatra'); ?></option>
                                <option value="highest"><?php echo esc_html__('Highest rated', 'yatra'); ?></option>
                                <option value="lowest"><?php echo esc_html__('Lowest rated', 'yatra'); ?></option>
                            </select>
                        </div>
                    </div>
                    <!-- Reviews -->
                    <div class="yatra-reviews-items">
                        <?php foreach ($display_reviews as $review):
                            $review_rating = is_object($review) ? ($review->rating ?? 5) : ($review['rating'] ?? 5);
                            $review_title = is_object($review) ? ($review->title ?? '') : ($review['title'] ?? '');
                            $review_content = is_object($review) ? ($review->content ?? '') : ($review['content'] ?? '');
                            $review_author = is_object($review) ? ($review->author_name ?? 'Anonymous') : ($review['author_name'] ?? 'Anonymous');
                            $review_location = is_object($review) ? ($review->author_location ?? '') : ($review['author_location'] ?? '');
                            $review_date = is_object($review) ? ($review->created_at ?? '') : ($review['created_at'] ?? '');
                            $review_user_id = is_object($review) ? ($review->user_id ?? 0) : ($review['user_id'] ?? 0);
                            $is_verified = $review_user_id > 0;
                            $author_initial = strtoupper(substr($review_author, 0, 1));
                            $avatar_colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
                            $avatar_color = $avatar_colors[ord($author_initial) % count($avatar_colors)];
                            ?>
                            <div class="yatra-review-item">
                                <div class="yatra-review-header">
                                    <div class="yatra-review-header-left">
                                        <div class="yatra-review-avatar" style="background: linear-gradient(135deg, <?php echo esc_attr($avatar_color); ?> 0%, <?php echo esc_attr($avatar_color); ?>dd 100%);">
                                            <?php echo esc_html($author_initial); ?>
                                        </div>
                                        <div class="yatra-review-author-info">
                                            <div class="yatra-review-author-top">
                                                <span class="yatra-review-author-name"><?php echo esc_html($review_author); ?></span>
                                                <?php if ($is_verified): ?>
                                                    <span class="yatra-verified-badge">
                                                <svg class="yatra-icon-xs" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                                    <path d="M20 6L9 17l-5-5"/>
                                                </svg>
                                                <?php echo esc_html__('Verified', 'yatra'); ?>
                                            </span>
                                                <?php endif; ?>
                                            </div>
                                            <div class="yatra-review-meta">
                                                <?php if ($review_date): ?>
                                                    <span class="yatra-review-date"><?php echo esc_html(date_i18n('F j, Y', strtotime($review_date))); ?></span>
                                                <?php endif; ?>
                                                <?php if ($review_location): ?>
                                                    <span class="yatra-review-author-location">• <?php echo esc_html($review_location); ?></span>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="yatra-review-stars">
                                        <?php for ($i = 1; $i <= 5; $i++): ?>
                                            <span class="yatra-star-sm <?php echo $i <= $review_rating ? 'filled' : ''; ?>">★</span>
                                        <?php endfor; ?>
                                    </div>
                                </div>
                                <div class="yatra-review-body">
                                    <?php if ($review_title): ?>
                                        <h4 class="yatra-review-title"><?php echo esc_html($review_title); ?></h4>
                                    <?php endif; ?>
                                    <p class="yatra-review-content"><?php echo esc_html($review_content); ?></p>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <!-- Load More -->
                    <?php if ($total_reviews > 3): ?>
                        <div class="yatra-reviews-load-more">
                            <button class="yatra-load-more-btn" type="button">
                                <?php echo esc_html__('Show more reviews', 'yatra'); ?>
                            </button>
                        </div>
                    <?php endif; ?>
                <?php else: ?>
                    <div class="yatra-no-reviews-message">
                        <div class="yatra-no-reviews-icon">
                            <?php echo yatra_svg_icon('message-circle', 'yatra-icon-lg'); ?>
                        </div>
                        <p><?php echo esc_html__('No reviews yet. Be the first to review this trip!', 'yatra'); ?></p>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Review Form -->
        <?php
        $can_review = yatra_can_review((int) $trip->id);
        $require_booking = yatra_setting_enabled('require_booking_to_review');
        $minimum_rating = (int) yatra_get_setting('minimum_rating', 1);

        // Check for existing review that can be edited
        $existing_review = null;
        $can_edit_review = false;
        $edit_time_remaining = '';

        if (is_user_logged_in()) {
            $existing_review = yatra_get_user_review((int) $trip->id);
            if ($existing_review) {
                $can_edit_review = yatra_can_edit_review($existing_review);
                if ($can_edit_review) {
                    $edit_time_remaining = yatra_get_review_edit_time_remaining($existing_review);
                }
            }
        }
        ?>
        <div class="yatra-review-form-section">
            <?php if ($existing_review && $can_edit_review): ?>
                <h3 class="yatra-review-form-title"><?php echo esc_html__('Edit Your Review', 'yatra'); ?></h3>
                <div class="yatra-review-edit-notice">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p><?php echo esc_html(sprintf(__('You can edit your review for %s more.', 'yatra'), $edit_time_remaining)); ?></p>
                </div>
            <?php else: ?>
                <h3 class="yatra-review-form-title"><?php echo esc_html__('Write a Review', 'yatra'); ?></h3>
            <?php endif; ?>

            <?php if (!is_user_logged_in()): ?>
                <div class="yatra-review-login-notice">
                    <p><?php echo esc_html__('Please', 'yatra'); ?> <a href="<?php echo esc_url(wp_login_url(get_permalink())); ?>"><?php echo esc_html__('log in', 'yatra'); ?></a> <?php echo esc_html__('to write a review.', 'yatra'); ?></p>
                </div>
            <?php elseif (!$can_review && $require_booking): ?>
                <div class="yatra-review-booking-notice">
                    <p><?php echo esc_html__('Only customers who have booked this trip can leave a review.', 'yatra'); ?></p>
                </div>
            <?php elseif ($existing_review && !$can_edit_review): ?>
                <div class="yatra-review-already-notice">
                    <?php if (isset($existing_review->status) && $existing_review->status === 'approved'): ?>
                        <p><?php echo esc_html__('Thank you! Your review has been approved and published.', 'yatra'); ?></p>
                    <?php else: ?>
                        <p><?php echo esc_html__('You have already reviewed this trip.', 'yatra'); ?></p>
                    <?php endif; ?>
                </div>
            <?php elseif ($can_review || ($existing_review && $can_edit_review)): ?>
                <form class="yatra-review-form" id="yatra-review-form" method="post">
                    <?php wp_nonce_field('yatra_submit_review', 'yatra_review_nonce'); ?>
                    <input type="hidden" name="trip_id" value="<?php echo esc_attr($trip->id); ?>">
                    <?php if ($existing_review && $can_edit_review): ?>
                        <input type="hidden" name="review_id" value="<?php echo esc_attr($existing_review->id); ?>">
                        <input type="hidden" name="action_type" value="edit">
                    <?php endif; ?>

                    <!-- Rating -->
                    <div class="yatra-form-field yatra-rating-field">
                        <label class="yatra-form-label"><?php echo esc_html__('Your Rating', 'yatra'); ?> <span class="yatra-required">*</span></label>
                        <div class="yatra-star-rating-input" data-min-rating="<?php echo esc_attr($minimum_rating); ?>">
                            <?php
                            $selected_rating = $existing_review ? (int) $existing_review->rating : 5;
                            for ($i = 1; $i <= 5; $i++):
                                ?>
                                <input type="radio" name="rating" id="rating-<?php echo $i; ?>" value="<?php echo $i; ?>" <?php echo $i === $selected_rating ? 'checked' : ''; ?> <?php echo $i < $minimum_rating ? 'disabled' : ''; ?>>
                                <label for="rating-<?php echo $i; ?>" class="yatra-star-label" title="<?php echo esc_attr(sprintf(__('%d star', 'yatra'), $i)); ?>">★</label>
                            <?php endfor; ?>
                        </div>
                        <?php if ($minimum_rating > 1): ?>
                            <p class="yatra-field-hint"><?php echo esc_html(sprintf(__('Minimum rating: %d star(s)', 'yatra'), $minimum_rating)); ?></p>
                        <?php endif; ?>
                    </div>

                    <!-- Title -->
                    <div class="yatra-form-field">
                        <label for="review-title" class="yatra-form-label"><?php echo esc_html__('Review Title', 'yatra'); ?></label>
                        <input type="text" id="review-title" name="title" class="yatra-form-input" placeholder="<?php echo esc_attr__('Summarize your experience', 'yatra'); ?>" maxlength="100" value="<?php echo $existing_review ? esc_attr($existing_review->title ?? '') : ''; ?>">
                    </div>

                    <!-- Review Content -->
                    <div class="yatra-form-field">
                        <label for="review-content" class="yatra-form-label"><?php echo esc_html__('Your Review', 'yatra'); ?> <span class="yatra-required">*</span></label>
                        <textarea id="review-content" name="content" class="yatra-form-textarea" rows="5" placeholder="<?php echo esc_attr__('Share your experience with this trip...', 'yatra'); ?>" required minlength="20"><?php echo $existing_review ? esc_textarea($existing_review->content ?? '') : ''; ?></textarea>
                        <p class="yatra-field-hint"><?php echo esc_html__('Minimum 20 characters', 'yatra'); ?></p>
                    </div>

                    <!-- Submit Button -->
                    <div class="yatra-form-field">
                        <button type="submit" class="yatra-review-submit-btn">
                            <?php echo yatra_svg_icon('check', 'yatra-icon-sm'); ?>
                            <?php echo $existing_review && $can_edit_review ? esc_html__('Update Review', 'yatra') : esc_html__('Submit Review', 'yatra'); ?>
                        </button>
                        <?php if (yatra_setting_enabled('enable_review_moderation')): ?>
                            <p class="yatra-review-moderation-notice"><?php echo esc_html__('Your review will be published after moderation.', 'yatra'); ?></p>
                        <?php endif; ?>
                    </div>
                </form>
            <?php endif; ?>
        </div>
    </div>
</section>
