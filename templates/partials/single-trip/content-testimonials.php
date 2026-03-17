<?php
/**
 * Testimonials Section Content Template
 * Displays testimonials as a separate section
 */

if (!defined('ABSPATH')) {
    exit;
}

// Expected variables: $tab, $trip
?>
<section class="yatra-trip-section" id="<?php echo esc_attr($tab->id); ?>">
    <h2 class="yatra-trip-section-title">
        <?php yatra_render_tab_icon($tab->icon ?? null, 'message-circle', 'yatra-trip-section-title-icon', $tab->label ?? 'Testimonials'); ?>
        <?php echo esc_html($tab->label); ?>
    </h2>
    
    <div class="yatra-testimonials-content">
        <?php
        // Get testimonials from trip data (loaded via SingleTripController)
        $display_testimonials = $trip->getTestimonials();
        ?>

        <?php if (!empty($display_testimonials)): ?>
            <div class="yatra-trip-testimonials">
                <?php foreach ($display_testimonials as $testimonial): ?>
                    <div class="yatra-testimonial-card">
                        <div class="yatra-testimonial-rating">
                            <?php 
                            $rating = !empty($testimonial->rating) ? intval($testimonial->rating) : 5;
                            for ($i = 1; $i <= 5; $i++): 
                                echo $i <= $rating ? '★' : '☆';
                            endfor; 
                            ?>
                        </div>
                        <div class="yatra-testimonial-text">
                            <?php echo wp_kses_post($testimonial->content ?? ''); ?>
                        </div>
                        <div class="yatra-testimonial-author">
                            <div class="yatra-testimonial-avatar">
                                <?php 
                                // Use default avatar or initials
                                $author_name = !empty($testimonial->author_name) ? $testimonial->author_name : 'Anonymous';
                                $initials = implode('', array_map(function($word) { return strtoupper(substr($word, 0, 1)); }, explode(' ', $author_name)));
                                echo esc_html(substr($initials, 0, 2));
                                ?>
                            </div>
                            <div class="yatra-testimonial-info">
                                <h4 class="yatra-testimonial-name">
                                    <?php echo esc_html($author_name); ?>
                                </h4>
                                <p class="yatra-testimonial-location">
                                    <?php 
                                    $trip_date = !empty($testimonial->trip_date) ? $testimonial->trip_date : '';
                                    $location = !empty($testimonial->location) ? $testimonial->location : '';
                                    
                                    if ($trip_date && $location) {
                                        echo esc_html(sprintf(__('Traveled %s in %s', 'yatra'), $trip_date, $location));
                                    } elseif ($trip_date) {
                                        echo esc_html(sprintf(__('Traveled %s', 'yatra'), $trip_date));
                                    } elseif ($location) {
                                        echo esc_html(sprintf(__('Traveled in %s', 'yatra'), $location));
                                    } else {
                                        echo esc_html__('Verified Traveler', 'yatra');
                                    }
                                    ?>
                                </p>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <div class="yatra-testimonials-empty">
                <div class="yatra-testimonials-empty-icon">
                    <?php echo yatra_svg_icon('message-circle', 'yatra-testimonials-empty-svg'); ?>
                </div>
                <h3 class="yatra-testimonials-empty-title">
                    <?php echo esc_html__('No testimonials yet', 'yatra'); ?>
                </h3>
                <p class="yatra-testimonials-empty-text">
                    <?php echo esc_html__('Be the first to share your experience on this amazing trip!', 'yatra'); ?>
                </p>
                <a href="#reviews" class="yatra-testimonials-empty-cta">
                    <?php echo esc_html__('Write a Review', 'yatra'); ?>
                </a>
            </div>
        <?php endif; ?>
    </div>
</section>

<style>
/* Testimonials Section Styles - Using existing Yatra styles */
.yatra-testimonials-content {
    margin-top: 32px;
}

/* Avatar styling for testimonials */
.yatra-testimonial-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 18px;
    flex-shrink: 0;
}

/* Empty state styling */
.yatra-testimonials-empty {
    text-align: center;
    padding: 80px 20px;
    background: #f8fafc;
    border-radius: 16px;
    border: 2px dashed #e2e8f0;
}

.yatra-testimonials-empty-icon {
    margin-bottom: 24px;
}

.yatra-testimonials-empty-svg {
    width: 80px;
    height: 80px;
    color: #cbd5e1;
    margin: 0 auto;
}

.yatra-testimonials-empty-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 12px;
}

.yatra-testimonials-empty-text {
    color: #64748b;
    margin-bottom: 32px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}

.yatra-testimonials-empty-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #3b82f6;
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    transition: background-color 0.3s ease;
}

.yatra-testimonials-empty-cta:hover {
    background: #2563eb;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .yatra-testimonials-empty {
        background: #1e293b;
        border-color: #334155;
    }
    
    .yatra-testimonials-empty-title {
        color: #f8fafc;
    }
    
    .yatra-testimonials-empty-text {
        color: #cbd5e1;
    }
}

/* Responsive Design */
@media (max-width: 768px) {
    .yatra-testimonials-empty {
        padding: 60px 20px;
    }
}
</style>
