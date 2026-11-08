<?php
if (!defined('ABSPATH')) {
    exit;
}

// Single review card. Shared by the initial list in reviews.php and the
// "Show more reviews" REST response, so appended reviews render identically.
// Expected variables: $review (row object or array from the reviews table)
$review_id = (int) (is_object($review) ? ($review->id ?? 0) : ($review['id'] ?? 0));
$review_rating = is_object($review) ? ($review->rating ?? 5) : ($review['rating'] ?? 5);
$review_title = is_object($review) ? ($review->title ?? '') : ($review['title'] ?? '');
$review_content = is_object($review) ? ($review->content ?? '') : ($review['content'] ?? '');
$review_author = is_object($review) ? ($review->author_name ?? __('Anonymous', 'yatra')) : ($review['author_name'] ?? __('Anonymous', 'yatra'));
$review_location = is_object($review) ? ($review->author_location ?? '') : ($review['author_location'] ?? '');
$review_date = is_object($review) ? ($review->created_at ?? '') : ($review['created_at'] ?? '');
$review_user_id = is_object($review) ? ($review->user_id ?? 0) : ($review['user_id'] ?? 0);
$is_verified = $review_user_id > 0;
$author_initial = strtoupper(substr($review_author, 0, 1));
$avatar_colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
$avatar_color = $avatar_colors[ord($author_initial) % count($avatar_colors)];
?>
<div class="yatra-review-item"<?php if ($review_id > 0): ?> data-review-id="<?php echo esc_attr($review_id); ?>"<?php endif; ?>>
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
                        <span class="yatra-review-date"><?php echo esc_html(mysql2date('F j, Y', (string) $review_date)); ?></span>
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
