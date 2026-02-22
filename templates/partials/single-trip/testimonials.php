<?php
if (!defined('ABSPATH')) {
    exit;
}

// Testimonials Section
// Expected variables: $trip
?>
<!-- Testimonials Section - Integrated in Overview -->
<section class="yatra-testimonials-section-overview" id="testimonials">
    <div class="yatra-testimonials-section-container">
        <div class="yatra-testimonials-header">
            <h3 class="yatra-testimonials-section-title">
                <?php echo yatra_svg_icon('heart', 'yatra-testimonials-section-icon'); ?>
                <?php echo esc_html__('What Travelers Say', 'yatra'); ?>
            </h3>
            <p class="yatra-testimonials-section-subtitle">
                <?php echo esc_html__('Selected reviews from our happy customers', 'yatra'); ?>
            </p>
        </div>

        <?php
        // Get testimonials from trip data (loaded via SingleTripController)
        $display_testimonials = !empty($trip->testimonials) && is_array($trip->testimonials) ? $trip->testimonials : [];
        ?>

        <?php if (!empty($display_testimonials)): ?>
            <div class="yatra-testimonials-container">
                <div class="yatra-testimonials-carousel">
                    <div class="yatra-testimonials-track">
                        <?php foreach ($display_testimonials as $index => $testimonial): ?>
                            <div class="yatra-testimonial-slide" data-slide="<?php echo $index; ?>">
                                <div class="yatra-testimonial-card">
                                    <div class="yatra-testimonial-content">
                                        <?php if (!empty($testimonial->rating)): ?>
                                            <div class="yatra-testimonial-rating">
                                                <?php for ($i = 1; $i <= 5; $i++): ?>
                                                    <?php
                                                    $star_class = $i <= (int) $testimonial->rating 
                                                        ? 'yatra-star-filled' 
                                                        : 'yatra-star-empty';
                                                    ?>
                                                    <span class="yatra-star <?php echo esc_attr($star_class); ?>">
                                                        <?php echo yatra_svg_icon('star'); ?>
                                                    </span>
                                                <?php endfor; ?>
                                            </div>
                                        <?php endif; ?>

                                        <?php if (!empty($testimonial->title)): ?>
                                            <h4 class="yatra-testimonial-title">
                                                <?php echo esc_html($testimonial->title); ?>
                                            </h4>
                                        <?php endif; ?>

                                        <?php if (!empty($testimonial->content)): ?>
                                            <div class="yatra-testimonial-text">
                                                <?php echo wp_kses_post($testimonial->content); ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>

                                    <div class="yatra-testimonial-author">
                                        <div class="yatra-testimonial-author-info">
                                            <div class="yatra-testimonial-author-name">
                                                <?php 
                                                $author_name = !empty($testimonial->author_name) 
                                                    ? esc_html($testimonial->author_name)
                                                    : (!empty($testimonial->author_display_name) 
                                                        ? esc_html($testimonial->author_display_name)
                                                        : esc_html__('Anonymous', 'yatra'));
                                                echo $author_name;
                                                ?>
                                            </div>
                                            
                                            <?php if (!empty($testimonial->author_location)): ?>
                                                <div class="yatra-testimonial-author-location">
                                                    <?php echo yatra_svg_icon('map-pin', 'yatra-testimonial-location-icon'); ?>
                                                    <?php echo esc_html($testimonial->author_location); ?>
                                                </div>
                                            <?php endif; ?>
                                        </div>

                                        <?php if (!empty($testimonial->created_at)): ?>
                                            <div class="yatra-testimonial-date">
                                                <?php 
                                                $date = new DateTime($testimonial->created_at);
                                                echo esc_html($date->format('F j, Y')); 
                                                ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <!-- Carousel Navigation -->
                    <button class="yatra-testimonials-prev" aria-label="Previous testimonial">
                        <?php echo yatra_svg_icon('chevron-left'); ?>
                    </button>
                    <button class="yatra-testimonials-next" aria-label="Next testimonial">
                        <?php echo yatra_svg_icon('chevron-right'); ?>
                    </button>

                    <!-- Carousel Indicators -->
                    <div class="yatra-testimonials-indicators">
                        <?php foreach ($display_testimonials as $index => $testimonial): ?>
                            <button class="yatra-testimonials-indicator" data-slide="<?php echo $index; ?>" aria-label="Go to testimonial <?php echo $index + 1; ?>"></button>
                        <?php endforeach; ?>
                    </div>
                </div>
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
/* Testimonials Section Styles - Overview Integration */
.yatra-testimonials-section-overview {
    padding: 60px 0;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    margin: 40px 0;
}

.yatra-testimonials-section-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 20px;
}

.yatra-testimonials-header {
    text-align: center;
    margin-bottom: 40px;
}

.yatra-testimonials-section-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 12px;
}

.yatra-testimonials-section-icon {
    width: 32px;
    height: 32px;
    color: #ef4444;
}

.yatra-testimonials-section-subtitle {
    font-size: 1rem;
    color: #64748b;
    max-width: 500px;
    margin: 0 auto;
}

.yatra-testimonials-carousel {
    position: relative;
    max-width: 800px;
    margin: 0 auto;
    overflow: hidden;
    border-radius: 16px;
}

.yatra-testimonials-track {
    display: flex;
    transition: transform 0.5s ease-in-out;
}

.yatra-testimonial-slide {
    min-width: 100%;
    padding: 0 15px;
}

.yatra-testimonial-card {
    background: white;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    height: 100%;
}

.yatra-testimonial-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.yatra-testimonial-card:hover .yatra-testimonial-title {
    color: #1e293b;
}

.yatra-testimonial-card:hover .yatra-testimonial-text {
    color: #475569;
}

.yatra-testimonial-card:hover .yatra-testimonial-author-name {
    color: #1e293b;
}

.yatra-testimonial-card:hover .yatra-testimonial-author-location {
    color: #64748b;
}

.yatra-testimonial-card:hover .yatra-testimonial-date {
    color: #94a3b8;
}

/* Carousel Navigation Buttons */
.yatra-testimonials-prev,
.yatra-testimonials-next {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    border: none;
    border-radius: 50%;
    background: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: all 0.3s ease;
}

.yatra-testimonials-prev {
    left: -24px;
}

.yatra-testimonials-next {
    right: -24px;
}

.yatra-testimonials-prev:hover,
.yatra-testimonials-next:hover {
    background: #3b82f6;
    color: white;
    transform: translateY(-50%) scale(1.1);
}

.yatra-testimonials-prev svg,
.yatra-testimonials-next svg {
    width: 20px;
    height: 20px;
}

/* Carousel Indicators */
.yatra-testimonials-indicators {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 24px;
}

.yatra-testimonials-indicator {
    width: 8px;
    height: 8px;
    border: none;
    border-radius: 50%;
    background: #e5e7eb;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
}

.yatra-testimonials-indicator:hover {
    background: #9ca3af;
}

.yatra-testimonials-indicator.active {
    background: #3b82f6;
    width: 24px;
    border-radius: 4px;
}

.yatra-testimonial-content {
    margin-bottom: 24px;
}

.yatra-testimonial-rating {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
}

.yatra-testimonial-title {
    color: #1e293b;
}

.yatra-testimonial-text {
    color: #475569;
}

.yatra-testimonial-author-name {
    color: #1e293b;
}

.yatra-testimonial-author-location {
    color: #64748b;
}

.yatra-testimonial-date {
    color: #94a3b8;
}

.yatra-star {
    width: 20px;
    height: 20px;
}

.yatra-star-filled {
    color: #fbbf24;
}

.yatra-star-empty {
    color: #e5e7eb;
}

.yatra-testimonial-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 12px;
}

.yatra-testimonial-text {
    color: #475569;
    line-height: 1.6;
    font-size: 0.95rem;
}

.yatra-testimonial-author {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
}

.yatra-testimonial-author-info {
    flex: 1;
}

.yatra-testimonial-author-name {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
}

.yatra-testimonial-author-location {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #64748b;
    font-size: 0.875rem;
}

.yatra-testimonial-location-icon {
    width: 14px;
    height: 14px;
}

.yatra-testimonial-date {
    color: #94a3b8;
    font-size: 0.875rem;
}

.yatra-testimonials-empty {
    text-align: center;
    padding: 80px 20px;
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
    padding: 12px 24px;
    background: #3b82f6;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: background-color 0.3s ease;
}

.yatra-testimonials-empty-cta:hover {
    background: #2563eb;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .yatra-testimonials-section-overview {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    }
    
    .yatra-testimonials-section-title {
        color: #f8fafc;
    }
    
    .yatra-testimonials-section-subtitle {
        color: #cbd5e1;
    }
    
    .yatra-testimonial-card {
        background: #1e293b;
        border: 1px solid #334155;
    }
    
    .yatra-testimonial-title {
        color: #f8fafc;
    }
    
    .yatra-testimonial-text {
        color: #cbd5e1;
    }
    
    .yatra-testimonial-author {
        border-top-color: #334155;
    }
    
    .yatra-testimonial-author-name {
        color: #f8fafc;
    }
    
    .yatra-testimonial-author-location {
        color: #94a3b8;
    }
    
    .yatra-testimonial-date {
        color: #64748b;
    }
    
    .yatra-testimonials-empty-title {
        color: #f8fafc;
    }
    
    .yatra-testimonials-empty-text {
        color: #cbd5e1;
    }
    
    /* Carousel controls in dark mode */
    .yatra-testimonials-prev,
    .yatra-testimonials-next {
        background: #1e293b;
        border: 1px solid #334155;
    }
    
    .yatra-testimonials-prev:hover,
    .yatra-testimonials-next:hover {
        background: #3b82f6;
        color: white;
    }
    
    .yatra-testimonials-indicator {
        background: #475569;
    }
    
    .yatra-testimonials-indicator:hover {
        background: #64748b;
    }
    
    .yatra-testimonials-indicator.active {
        background: #3b82f6;
    }
}

/* Responsive design */
@media (max-width: 768px) {
    .yatra-testimonials-section-overview {
        padding: 40px 0;
        margin: 30px 0;
    }
    
    .yatra-testimonials-section-title {
        font-size: 1.75rem;
    }
    
    .yatra-testimonials-section-subtitle {
        font-size: 0.9rem;
    }
    
    .yatra-testimonial-card {
        padding: 30px;
    }
    
    .yatra-testimonial-author {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    
    .yatra-testimonials-prev,
    .yatra-testimonials-next {
        width: 40px;
        height: 40px;
    }
    
    .yatra-testimonials-prev {
        left: -20px;
    }
    
    .yatra-testimonials-next {
        right: -20px;
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.yatra-testimonials-carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.yatra-testimonials-track');
    const slides = carousel.querySelectorAll('.yatra-testimonial-slide');
    const prevBtn = carousel.querySelector('.yatra-testimonials-prev');
    const nextBtn = carousel.querySelector('.yatra-testimonials-next');
    const indicators = carousel.querySelectorAll('.yatra-testimonials-indicator');

    let currentSlide = 0;
    const totalSlides = slides.length;

    function updateCarousel() {
        // Update track position
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update indicators
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });

        // Update button states
        prevBtn.disabled = currentSlide === 0;
        nextBtn.disabled = currentSlide === totalSlides - 1;
    }

    function goToSlide(slideIndex) {
        if (slideIndex < 0 || slideIndex >= totalSlides) return;
        currentSlide = slideIndex;
        updateCarousel();
    }

    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateCarousel();
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
            updateCarousel();
        }
    }

    // Event listeners
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => goToSlide(index));
    });

    // Auto-play functionality
    let autoPlayInterval;
    let isAutoPlaying = true;

    function startAutoPlay() {
        autoPlayInterval = setInterval(() => {
            if (currentSlide < totalSlides - 1) {
                nextSlide();
            } else {
                goToSlide(0); // Loop back to first slide
            }
        }, 5000); // Change slide every 5 seconds
    }

    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }

    // Start auto-play
    startAutoPlay();

    // Pause auto-play on hover
    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', () => {
        if (isAutoPlaying) startAutoPlay();
    });

    // Pause auto-play when user interacts
    [prevBtn, nextBtn, ...indicators].forEach(element => {
        element.addEventListener('click', () => {
            stopAutoPlay();
            isAutoPlaying = false;
            // Resume auto-play after 10 seconds of inactivity
            setTimeout(() => {
                isAutoPlaying = true;
                startAutoPlay();
            }, 10000);
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            stopAutoPlay();
            isAutoPlaying = false;
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            stopAutoPlay();
            isAutoPlaying = false;
        }
    });

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
    });

    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }

    // Initialize
    updateCarousel();
});
</script>
