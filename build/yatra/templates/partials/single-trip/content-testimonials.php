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
