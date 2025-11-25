<?php
/**
 * Single Trip Template - Static Version with Dummy Data
 * 
 * Industry-standard trip single page design
 * Based on leading travel booking platforms like Bookmundi, Viator, GetYourGuide
 * 
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get trip from query var (minimal check for template loading)
global $wp_query;
$trip = $wp_query->get('yatra_trip');

// Static dummy data for design showcase
$dummy_trip = (object) [
    'id' => 1,
    'title' => 'Everest Base Camp Trek - 14 Days Adventure',
    'slug' => 'everest-base-camp-trek',
    'short_description' => 'Experience the ultimate Himalayan adventure with our 14-day trek to Everest Base Camp. Walk in the footsteps of mountaineering legends and witness breathtaking mountain vistas.',
    'description' => '<p>Embark on an unforgettable journey to the base of the world\'s highest mountain. This 14-day trek takes you through traditional Sherpa villages, ancient monasteries, and stunning alpine landscapes. You\'ll experience the unique culture of the Khumbu region while challenging yourself physically and mentally.</p><p>The trek begins with a scenic flight to Lukla and gradually ascends through the Sagarmatha National Park, a UNESCO World Heritage Site. Along the way, you\'ll acclimatize properly, visit Tengboche Monastery, and enjoy spectacular views of peaks including Ama Dablam, Lhotse, and of course, Mount Everest.</p>',
    'trip_details' => '<p>This comprehensive trek includes all necessary permits, experienced guides, and comfortable teahouse accommodations. Our itinerary is carefully designed to ensure proper acclimatization, maximizing your chances of reaching Base Camp safely and enjoying every moment of the journey.</p>',
    'what_makes_special' => 'Small group sizes, expert local guides, proper acclimatization schedule, and authentic cultural experiences',
    'duration_days' => 14,
    'duration_nights' => 13,
    'difficulty_level' => 'challenging',
    'min_travelers' => 2,
    'max_travelers' => 12,
    'original_price' => 1850.00,
    'sale_price' => 1650.00,
    'currency' => 'USD',
    'featured_priority' => 'bestseller',
    'starting_location' => 'Kathmandu, Nepal',
    'ending_location' => 'Kathmandu, Nepal',
    'latitude' => '27.9881',
    'longitude' => '86.9250',
    'accommodation_type' => 'Teahouse',
    'accommodation_standard' => 'comfort',
    'meal_plan' => 'full_board',
    'transportation_included' => true,
    'age_min' => 18,
    'age_max' => 65,
];

// Helper function to output SVG icons
function yatra_svg_icon($name, $class = 'yatra-icon') {
    $icons = [
        'calendar' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
        'users' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
        'map-pin' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
        'star' => '<svg class="' . esc_attr($class) . '" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
        'dollar' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        'mountain' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>',
        'check' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
        'x' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
        'camera' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
        'home' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
        'truck' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        'shield' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
        'info' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        'phone' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>',
        'mail' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
        'clock' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        'credit-card' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>',
        'alert' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
        'cloud' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg>',
        'tag' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>',
        'chevron-down' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>',
        'book-open' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
        'heart' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>',
        'share' => '<svg class="' . esc_attr($class) . '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>',
        'star-filled' => '<svg class="' . esc_attr($class) . '" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    ];
    
    return isset($icons[$name]) ? $icons[$name] : '';
}

// Helper function to format price
function yatra_format_price($amount, $currency = 'USD') {
    if (empty($amount) || $amount == 0) return 'Contact for pricing';
    $symbols = ['USD' => '$', 'EUR' => '€', 'GBP' => '£', 'INR' => '₹', 'NPR' => 'Rs'];
    $symbol = $symbols[$currency] ?? $currency . ' ';
    return $symbol . number_format((float)$amount, 2);
}

// Helper function to format duration
function yatra_format_duration($days, $nights = null) {
    if ($days && $nights) {
        return $days . ' Days / ' . $nights . ' Nights';
    } elseif ($days) {
        return $days . ' Day' . ($days > 1 ? 's' : '');
    }
    return 'Flexible';
}

// Use dummy data
$trip_data = $dummy_trip;

// Set up page title
add_filter('wp_title', function($title) use ($trip_data) {
    return esc_html($trip_data->title) . ' - ' . get_bloginfo('name');
}, 10, 1);

get_header();
?>

<!-- Flatpickr CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<!-- Flatpickr JS -->
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

<div class="yatra-single-trip">
    <!-- Hero Section -->
    <div class="yatra-trip-hero-new">
        <div class="yatra-hero-header">
            <h1 class="yatra-trip-hero-title-new"><?php echo esc_html($trip_data->title); ?></h1>
            <div class="yatra-hero-rating">
                <div class="yatra-rating-stars">
                    <span class="yatra-star filled">★</span>
                    <span class="yatra-star filled">★</span>
                    <span class="yatra-star filled">★</span>
                    <span class="yatra-star filled">★</span>
                    <span class="yatra-star filled">★</span>
                </div>
                <span class="yatra-rating-number">4.9</span>
                <span class="yatra-rating-text">(250 Reviews)</span>
            </div>
        </div>

        <div class="yatra-hero-images">
            <div class="yatra-hero-main-image">
                <div class="yatra-hero-discount-tag">SAVE 20%</div>
                <img src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920&q=80" alt="<?php echo esc_attr($trip_data->title); ?>" class="yatra-hero-main-img">
                <a href="<?php echo esc_url(home_url('/book/' . $trip_data->slug)); ?>" class="yatra-hero-book-now-btn">
                    Book Now - <?php echo yatra_format_price($trip_data->sale_price, $trip_data->currency); ?>
                </a>
            </div>
            <div class="yatra-hero-side-images">
                <div class="yatra-side-image-item">
                    <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" alt="Gallery Image">
                    <button type="button" class="yatra-favorite-btn" aria-label="Add to favorites">
                        <?php echo yatra_svg_icon('heart', 'yatra-icon-sm'); ?>
                    </button>
                </div>
                <div class="yatra-side-image-item">
                    <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80" alt="Gallery Image">
                </div>
                <div class="yatra-side-image-item">
                    <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80" alt="Gallery Image">
                    <button type="button" class="yatra-view-all-photos-btn yatra-gallery-play-btn" data-gallery="hero-gallery">
                        <?php echo yatra_svg_icon('camera', 'yatra-icon-sm'); ?>
                        View all 20 photos
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Category, Activity, Destination Tags -->
    <div class="yatra-trip-tags">
        <div class="yatra-trip-tags-container">
            <div class="yatra-trip-tag">
                <span class="yatra-trip-tag-label">Category:</span>
                <span class="yatra-trip-tag-value">Adventure, Trekking</span>
            </div>
            <div class="yatra-trip-tag">
                <span class="yatra-trip-tag-label">Activity:</span>
                <span class="yatra-trip-tag-value">Mountain Climbing, Hiking</span>
            </div>
            <div class="yatra-trip-tag">
                <span class="yatra-trip-tag-label">Destination:</span>
                <span class="yatra-trip-tag-value">Nepal, Everest Region</span>
            </div>
        </div>
    </div>

    <!-- Quick Facts Bar -->
    <div class="yatra-trip-quick-facts">
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('calendar', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label">Duration</div>
                <div class="yatra-quick-fact-value"><?php echo esc_html(yatra_format_duration($trip_data->duration_days, $trip_data->duration_nights)); ?></div>
            </div>
        </div>
        
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('mountain', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label">Difficulty</div>
                <div class="yatra-quick-fact-value"><?php echo esc_html(ucfirst($trip_data->difficulty_level)); ?></div>
            </div>
        </div>

        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('users', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label">Group Size</div>
                <div class="yatra-quick-fact-value">
                    <?php echo esc_html($trip_data->min_travelers . '-' . $trip_data->max_travelers . ' travelers'); ?>
                </div>
            </div>
        </div>

        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('star', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label">Rating</div>
                <div class="yatra-quick-fact-value">4.9 (247 reviews)</div>
            </div>
        </div>

        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('dollar', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label">Starting From</div>
                <div class="yatra-quick-fact-price">
                    <?php echo yatra_format_price($trip_data->sale_price, $trip_data->currency); ?>
                    <span class="yatra-quick-fact-price-label">per person</span>
                </div>
            </div>
        </div>
    </div>


    <!-- Sticky Navigation Bar -->
    <div class="yatra-sticky-nav">
        <div class="yatra-sticky-nav-container">
            <a href="#overview" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('book-open', 'yatra-icon-sm'); ?>
                <span>Overview</span>
            </a>
            <a href="#trip-details" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('info', 'yatra-icon-sm'); ?>
                <span>Trip Details</span>
            </a>
            <a href="#itinerary" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                <span>Itinerary</span>
            </a>
            <a href="#included" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('check', 'yatra-icon-sm'); ?>
                <span>What's Included</span>
            </a>
            <a href="#gallery" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('camera', 'yatra-icon-sm'); ?>
                <span>Gallery</span>
            </a>
            <a href="#faq" class="yatra-sticky-nav-item">
                <?php echo yatra_svg_icon('info', 'yatra-icon-sm'); ?>
                <span>FAQ</span>
            </a>
            <div class="yatra-sticky-nav-price">
                <?php echo yatra_svg_icon('dollar', 'yatra-icon-sm'); ?>
                <span><?php echo yatra_format_price($trip_data->sale_price, $trip_data->currency); ?></span>
            </div>
        </div>
    </div>

    <!-- Gallery Modal -->
    <div class="yatra-gallery-modal" id="hero-gallery" role="dialog" aria-modal="true" aria-label="Trip Gallery">
        <div class="yatra-gallery-modal-overlay"></div>
        <div class="yatra-gallery-modal-content">
            <button type="button" class="yatra-gallery-modal-close" aria-label="Close Gallery">
                <svg class="yatra-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
            <button type="button" class="yatra-gallery-modal-prev" aria-label="Previous Image">
                <svg class="yatra-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
            </button>
            <button type="button" class="yatra-gallery-modal-next" aria-label="Next Image">
                <svg class="yatra-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </button>
            <div class="yatra-gallery-modal-main">
                <img src="" alt="Gallery Image" class="yatra-gallery-modal-image">
                <div class="yatra-gallery-modal-loader">Loading...</div>
            </div>
            <div class="yatra-gallery-modal-info">
                <div class="yatra-gallery-modal-counter">
                    <span class="yatra-gallery-current-index">1</span> / <span class="yatra-gallery-total-count">6</span>
                </div>
            </div>
            <div class="yatra-gallery-modal-thumbnails">
                <div class="yatra-gallery-thumbnails-container">
                    <!-- Thumbnails will be populated by JavaScript -->
                </div>
            </div>
        </div>
    </div>

    <!-- Main Container -->
    <div class="yatra-trip-container">
        <!-- Main Content -->
        <div class="yatra-trip-main">
            <!-- Overview Section -->
            <section class="yatra-trip-section" id="overview">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('book-open', 'yatra-trip-section-title-icon'); ?>
                    Overview
                </h2>
                <div class="yatra-trip-description">
                    <?php echo wp_kses_post($trip_data->description); ?>
                </div>

                <div class="yatra-trip-highlights">
                    <div class="yatra-highlight-item">
                        <?php echo yatra_svg_icon('star', 'yatra-highlight-icon'); ?>
                        <p class="yatra-highlight-text">Small group sizes (max 12 travelers) for personalized attention</p>
                    </div>
                    <div class="yatra-highlight-item">
                        <?php echo yatra_svg_icon('star', 'yatra-highlight-icon'); ?>
                        <p class="yatra-highlight-text">Expert local guides with 10+ years of experience</p>
                    </div>
                    <div class="yatra-highlight-item">
                        <?php echo yatra_svg_icon('star', 'yatra-highlight-icon'); ?>
                        <p class="yatra-highlight-text">Proper acclimatization schedule to ensure safety</p>
                    </div>
                    <div class="yatra-highlight-item">
                        <?php echo yatra_svg_icon('star', 'yatra-highlight-icon'); ?>
                        <p class="yatra-highlight-text">Authentic cultural experiences with local communities</p>
                    </div>
                </div>

                <div class="yatra-trip-features">
                    <div class="yatra-feature-card">
                        <?php echo yatra_svg_icon('shield', 'yatra-feature-icon'); ?>
                        <h3 class="yatra-feature-title">Fully Insured</h3>
                        <p class="yatra-feature-desc">Comprehensive travel insurance included</p>
                    </div>
                    <div class="yatra-feature-card">
                        <?php echo yatra_svg_icon('users', 'yatra-feature-icon'); ?>
                        <h3 class="yatra-feature-title">Small Groups</h3>
                        <p class="yatra-feature-desc">Maximum 12 travelers per group</p>
                    </div>
                    <div class="yatra-feature-card">
                        <?php echo yatra_svg_icon('home', 'yatra-feature-icon'); ?>
                        <h3 class="yatra-feature-title">Teahouse Stay</h3>
                        <p class="yatra-feature-desc">Authentic local accommodations</p>
                    </div>
                    <div class="yatra-feature-card">
                        <?php echo yatra_svg_icon('truck', 'yatra-feature-icon'); ?>
                        <h3 class="yatra-feature-title">All Transport</h3>
                        <p class="yatra-feature-desc">Airport transfers and flights included</p>
                    </div>
                </div>
            </section>

            <!-- Trip Details Section -->
            <section class="yatra-trip-section" id="trip-details">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('info', 'yatra-trip-section-title-icon'); ?>
                    Trip Details
                </h2>
                <div class="yatra-trip-description">
                    <?php echo wp_kses_post($trip_data->trip_details); ?>
                </div>
            </section>

            <!-- Itinerary Section -->
            <section class="yatra-trip-section" id="itinerary">
                <div class="yatra-section-header-with-actions">
                    <h2 class="yatra-trip-section-title">
                        <?php echo yatra_svg_icon('calendar', 'yatra-trip-section-title-icon'); ?>
                        Detailed Itinerary
                    </h2>
                    <div class="yatra-itinerary-actions">
                        <button type="button" class="yatra-toggle-all-btn" id="yatra-expand-all">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                            </svg>
                            Expand All
                        </button>
                        <button type="button" class="yatra-toggle-all-btn" id="yatra-collapse-all">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/>
                            </svg>
                            Collapse All
                        </button>
                    </div>
                </div>
                
                <?php
                // Itinerary data matching backend structure
                $itinerary_days = [
                    [
                        'day' => 1,
                        'day_title' => 'Arrival in Kathmandu',
                        'entries' => [
                            [
                                'item_type' => 'Transportation',
                                'item_name' => 'Airport Transfer',
                                'icon' => 'car',
                                'title' => 'Airport Pickup & Hotel Transfer',
                                'description' => 'Welcome to Nepal! Our representative will meet you at Tribhuvan International Airport with a welcome sign and transfer you to your hotel.',
                                'location' => 'Tribhuvan International Airport',
                                'start_time' => 'Flexible',
                                'end_time' => '',
                                'duration' => '45 mins',
                                'included' => ['Airport pickup', 'Private vehicle', 'Bottled water']
                            ],
                            [
                                'item_type' => 'Rest',
                                'item_name' => 'Free Time',
                                'icon' => 'moon',
                                'title' => 'Hotel Check-in & Rest',
                                'description' => 'Check into your hotel and take some time to rest after your flight. Freshen up and explore the hotel facilities.',
                                'location' => 'Hotel Yak & Yeti, Kathmandu',
                                'start_time' => '2:00 PM',
                                'end_time' => '6:00 PM',
                                'duration' => '4 hours',
                                'included' => ['Hotel accommodation', 'Free WiFi']
                            ],
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Dinner',
                                'icon' => 'utensils',
                                'title' => 'Welcome Dinner & Trip Briefing',
                                'description' => 'Join your fellow trekkers and guide for a traditional Nepali welcome dinner. Your guide will brief you about the trek, answer questions, and distribute any necessary equipment.',
                                'location' => 'Hotel Restaurant',
                                'start_time' => '7:00 PM',
                                'end_time' => '9:00 PM',
                                'duration' => '2 hours',
                                'included' => ['Welcome dinner', 'Beverages', 'Equipment check']
                            ],
                            [
                                'item_type' => 'Accommodation',
                                'item_name' => 'Hotel',
                                'icon' => 'hotel',
                                'title' => 'Overnight Stay',
                                'description' => 'Comfortable 4-star hotel accommodation with all modern amenities.',
                                'location' => 'Hotel Yak & Yeti, Kathmandu',
                                'start_time' => '',
                                'end_time' => '',
                                'duration' => 'Overnight',
                                'included' => ['Twin sharing room', 'Breakfast', 'Free WiFi']
                            ]
                        ]
                    ],
                    [
                        'day' => 2,
                        'day_title' => 'Flight to Lukla & Trek to Phakding',
                        'entries' => [
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Breakfast',
                                'icon' => 'utensils',
                                'title' => 'Early Breakfast',
                                'description' => 'Early breakfast at the hotel before heading to the airport.',
                                'location' => 'Hotel Restaurant',
                                'start_time' => '5:00 AM',
                                'end_time' => '5:45 AM',
                                'duration' => '45 mins',
                                'included' => ['Breakfast buffet', 'Tea/Coffee']
                            ],
                            [
                                'item_type' => 'Transportation',
                                'item_name' => 'Flight',
                                'icon' => 'plane',
                                'title' => 'Scenic Flight to Lukla',
                                'description' => 'Experience one of the world\'s most spectacular flights! Fly over the Himalayan foothills and land at Tenzing-Hillary Airport, one of the most challenging airports in the world.',
                                'location' => 'Kathmandu to Lukla',
                                'start_time' => '6:30 AM',
                                'end_time' => '7:05 AM',
                                'duration' => '35 mins',
                                'included' => ['Domestic flight', 'Airport transfers', 'Luggage allowance 15kg']
                            ],
                            [
                                'item_type' => 'Activity',
                                'item_name' => 'Trekking',
                                'icon' => 'hiking',
                                'title' => 'Trek to Phakding',
                                'description' => 'After landing in Lukla (2,860m), meet your porters and begin your trek. The trail descends through the village and follows the Dudh Koshi River to Phakding (2,610m).',
                                'location' => 'Lukla to Phakding',
                                'start_time' => '8:00 AM',
                                'end_time' => '12:00 PM',
                                'duration' => '3-4 hours',
                                'included' => ['Experienced guide', 'Porter service', 'Trail snacks']
                            ],
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Lunch',
                                'icon' => 'utensils',
                                'title' => 'Lunch at Phakding',
                                'description' => 'Enjoy a hearty lunch at a local teahouse with views of the river.',
                                'location' => 'Teahouse, Phakding',
                                'start_time' => '12:30 PM',
                                'end_time' => '1:30 PM',
                                'duration' => '1 hour',
                                'included' => ['Lunch', 'Tea/Coffee']
                            ],
                            [
                                'item_type' => 'Rest',
                                'item_name' => 'Free Time',
                                'icon' => 'moon',
                                'title' => 'Rest & Explore Phakding',
                                'description' => 'Free time to rest, explore the village, or simply relax and enjoy the peaceful surroundings.',
                                'location' => 'Phakding Village',
                                'start_time' => '2:00 PM',
                                'end_time' => '6:00 PM',
                                'duration' => '4 hours',
                                'included' => []
                            ],
                            [
                                'item_type' => 'Accommodation',
                                'item_name' => 'Teahouse',
                                'icon' => 'hotel',
                                'title' => 'Overnight at Teahouse',
                                'description' => 'Stay at a comfortable teahouse lodge with basic but clean facilities.',
                                'location' => 'Phakding (2,610m)',
                                'start_time' => '',
                                'end_time' => '',
                                'duration' => 'Overnight',
                                'included' => ['Twin sharing room', 'Dinner', 'Breakfast']
                            ]
                        ]
                    ],
                    [
                        'day' => 3,
                        'day_title' => 'Trek to Namche Bazaar',
                        'entries' => [
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Breakfast',
                                'icon' => 'utensils',
                                'title' => 'Breakfast at Teahouse',
                                'description' => 'Hot breakfast to fuel you for the challenging day ahead.',
                                'location' => 'Teahouse, Phakding',
                                'start_time' => '6:30 AM',
                                'end_time' => '7:30 AM',
                                'duration' => '1 hour',
                                'included' => ['Hot breakfast', 'Tea/Coffee']
                            ],
                            [
                                'item_type' => 'Activity',
                                'item_name' => 'Trekking',
                                'icon' => 'hiking',
                                'title' => 'Trek to Namche Bazaar',
                                'description' => 'Today\'s trek is challenging with significant altitude gain. Cross several suspension bridges including the famous Hillary Bridge. Enter Sagarmatha National Park at Monjo. The final ascent to Namche is steep but rewarding.',
                                'location' => 'Phakding to Namche Bazaar',
                                'start_time' => '8:00 AM',
                                'end_time' => '3:00 PM',
                                'duration' => '5-6 hours',
                                'included' => ['National Park entry permit', 'Guide service', 'Trail snacks']
                            ],
                            [
                                'item_type' => 'Activity',
                                'item_name' => 'Sightseeing',
                                'icon' => 'camera',
                                'title' => 'First Views of Everest',
                                'description' => 'On a clear day, catch your first glimpse of Mount Everest from the trail! Photo opportunity at the famous viewpoint.',
                                'location' => 'Everest View Point',
                                'start_time' => '1:00 PM',
                                'end_time' => '1:30 PM',
                                'duration' => '30 mins',
                                'included' => []
                            ],
                            [
                                'item_type' => 'Accommodation',
                                'item_name' => 'Teahouse',
                                'icon' => 'hotel',
                                'title' => 'Overnight in Namche Bazaar',
                                'description' => 'Stay at a comfortable teahouse in the bustling Sherpa capital. Namche has ATMs, bakeries, and shops.',
                                'location' => 'Namche Bazaar (3,440m)',
                                'start_time' => '',
                                'end_time' => '',
                                'duration' => 'Overnight',
                                'included' => ['Twin sharing room', 'Dinner', 'Breakfast']
                            ]
                        ]
                    ],
                    [
                        'day' => 4,
                        'day_title' => 'Acclimatization Day in Namche',
                        'entries' => [
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Breakfast',
                                'icon' => 'utensils',
                                'title' => 'Leisurely Breakfast',
                                'description' => 'Enjoy a relaxed breakfast at the teahouse.',
                                'location' => 'Teahouse, Namche Bazaar',
                                'start_time' => '7:30 AM',
                                'end_time' => '8:30 AM',
                                'duration' => '1 hour',
                                'included' => ['Hot breakfast', 'Tea/Coffee']
                            ],
                            [
                                'item_type' => 'Activity',
                                'item_name' => 'Hiking',
                                'icon' => 'hiking',
                                'title' => 'Acclimatization Hike to Everest View Hotel',
                                'description' => 'Climb to the famous Everest View Hotel (3,880m) for stunning panoramic views of Everest, Lhotse, Ama Dablam, and surrounding peaks. This is crucial for acclimatization.',
                                'location' => 'Namche to Everest View Hotel',
                                'start_time' => '9:00 AM',
                                'end_time' => '12:00 PM',
                                'duration' => '3 hours',
                                'included' => ['Guide service', 'Tea at viewpoint']
                            ],
                            [
                                'item_type' => 'Activity',
                                'item_name' => 'Sightseeing',
                                'icon' => 'camera',
                                'title' => 'Visit Sherpa Culture Museum',
                                'description' => 'Learn about Sherpa culture, history, and the legacy of mountaineering in the Khumbu region.',
                                'location' => 'Sherpa Culture Museum, Namche',
                                'start_time' => '2:00 PM',
                                'end_time' => '3:30 PM',
                                'duration' => '1.5 hours',
                                'included' => ['Museum entry fee', 'Guide explanation']
                            ],
                            [
                                'item_type' => 'Rest',
                                'item_name' => 'Free Time',
                                'icon' => 'moon',
                                'title' => 'Explore Namche Bazaar',
                                'description' => 'Free time to explore the local markets, bakeries, and shops. Great place to buy souvenirs or rent/buy any missing gear.',
                                'location' => 'Namche Bazaar Market',
                                'start_time' => '4:00 PM',
                                'end_time' => '6:00 PM',
                                'duration' => '2 hours',
                                'included' => []
                            ],
                            [
                                'item_type' => 'Accommodation',
                                'item_name' => 'Teahouse',
                                'icon' => 'hotel',
                                'title' => 'Overnight in Namche Bazaar',
                                'description' => 'Second night in Namche for proper acclimatization.',
                                'location' => 'Namche Bazaar (3,440m)',
                                'start_time' => '',
                                'end_time' => '',
                                'duration' => 'Overnight',
                                'included' => ['Twin sharing room', 'Dinner', 'Breakfast']
                            ]
                        ]
                    ],
                    [
                        'day' => 14,
                        'day_title' => 'Return to Kathmandu & Departure',
                        'entries' => [
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Breakfast',
                                'icon' => 'utensils',
                                'title' => 'Early Breakfast',
                                'description' => 'Quick breakfast before your flight.',
                                'location' => 'Teahouse, Lukla',
                                'start_time' => '5:30 AM',
                                'end_time' => '6:15 AM',
                                'duration' => '45 mins',
                                'included' => ['Hot breakfast', 'Tea/Coffee']
                            ],
                            [
                                'item_type' => 'Transportation',
                                'item_name' => 'Flight',
                                'icon' => 'plane',
                                'title' => 'Flight Back to Kathmandu',
                                'description' => 'Scenic flight back to Kathmandu. One last chance to enjoy aerial views of the Himalayas.',
                                'location' => 'Lukla to Kathmandu',
                                'start_time' => '7:00 AM',
                                'end_time' => '7:35 AM',
                                'duration' => '35 mins',
                                'included' => ['Domestic flight', 'Airport transfers']
                            ],
                            [
                                'item_type' => 'Rest',
                                'item_name' => 'Free Time',
                                'icon' => 'moon',
                                'title' => 'Rest & Optional Sightseeing',
                                'description' => 'Free day to rest, shop for souvenirs, or explore Kathmandu\'s heritage sites like Durbar Square, Swayambhunath, or Boudhanath.',
                                'location' => 'Kathmandu',
                                'start_time' => '9:00 AM',
                                'end_time' => '6:00 PM',
                                'duration' => 'Full day',
                                'included' => ['Day room at hotel', 'Luggage storage']
                            ],
                            [
                                'item_type' => 'Meal',
                                'item_name' => 'Dinner',
                                'icon' => 'utensils',
                                'title' => 'Farewell Dinner',
                                'description' => 'Celebrate the successful completion of your trek with a special farewell dinner featuring Nepali cuisine and cultural performance.',
                                'location' => 'Traditional Restaurant, Kathmandu',
                                'start_time' => '7:00 PM',
                                'end_time' => '9:30 PM',
                                'duration' => '2.5 hours',
                                'included' => ['Farewell dinner', 'Cultural show', 'Beverages']
                            ],
                            [
                                'item_type' => 'Transportation',
                                'item_name' => 'Airport Transfer',
                                'icon' => 'car',
                                'title' => 'Airport Drop-off (If departing)',
                                'description' => 'Transfer to Tribhuvan International Airport for your departure flight.',
                                'location' => 'Hotel to Airport',
                                'start_time' => 'Flexible',
                                'end_time' => '',
                                'duration' => '45 mins',
                                'included' => ['Private vehicle', 'Airport assistance']
                            ]
                        ]
                    ]
                ];
                
                // Icon mapping function
                $get_icon = function($icon_name) {
                    $icons = [
                        'car' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17h.01M16 17h.01M3 11l1.5-4.5A2 2 0 016.4 5h11.2a2 2 0 011.9 1.5L21 11M3 11v6a1 1 0 001 1h1m16-7v6a1 1 0 01-1 1h-1M3 11h18"/></svg>',
                        'plane' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>',
                        'utensils' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v18m-7-4h14M5 3v4a2 2 0 002 2h10a2 2 0 002-2V3"/></svg>',
                        'hotel' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
                        'hiking' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM5 22l3-9 4 3 5-7"/></svg>',
                        'moon' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>',
                        'camera' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
                    ];
                    return $icons[$icon_name] ?? $icons['hiking'];
                };
                
                // Item type colors
                $type_colors = [
                    'Transportation' => '#3b82f6',
                    'Meal' => '#f59e0b',
                    'Accommodation' => '#8b5cf6',
                    'Activity' => '#10b981',
                    'Rest' => '#6b7280',
                ];
                ?>
                
                <div class="yatra-itinerary-timeline">
                    <?php foreach ($itinerary_days as $day): ?>
                    <div class="yatra-itinerary-day" data-day="<?php echo esc_attr($day['day']); ?>">
                        <div class="yatra-itinerary-day-header">
                            <div class="yatra-day-badge">Day <?php echo esc_html($day['day']); ?></div>
                            <h3 class="yatra-day-title"><?php echo esc_html($day['day_title']); ?></h3>
                            <button type="button" class="yatra-day-toggle" aria-expanded="true">
                                <svg class="yatra-chevron-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="yatra-itinerary-day-content">
                            <div class="yatra-entries-timeline">
                                <?php foreach ($day['entries'] as $index => $entry): 
                                    $type_color = $type_colors[$entry['item_type']] ?? '#6b7280';
                                ?>
                                <div class="yatra-entry-item" style="--entry-color: <?php echo esc_attr($type_color); ?>">
                                    <div class="yatra-entry-timeline-dot"></div>
                                    <div class="yatra-entry-card">
                                        <div class="yatra-entry-header">
                                            <div class="yatra-entry-icon" style="background: <?php echo esc_attr($type_color); ?>15; color: <?php echo esc_attr($type_color); ?>">
                                                <?php echo $get_icon($entry['icon']); ?>
                                            </div>
                                            <div class="yatra-entry-info">
                                                <span class="yatra-entry-type" style="color: <?php echo esc_attr($type_color); ?>"><?php echo esc_html($entry['item_type']); ?></span>
                                                <h4 class="yatra-entry-title"><?php echo esc_html($entry['title']); ?></h4>
                                            </div>
                                            <?php if ($entry['start_time']): ?>
                                            <div class="yatra-entry-time">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                                <span>
                                                    <?php 
                                                    echo esc_html($entry['start_time']);
                                                    if ($entry['end_time']) {
                                                        echo ' - ' . esc_html($entry['end_time']);
                                                    }
                                                    ?>
                                                </span>
                                            </div>
                                            <?php endif; ?>
                                        </div>
                                        
                                        <p class="yatra-entry-description"><?php echo esc_html($entry['description']); ?></p>
                                        
                                        <div class="yatra-entry-meta">
                                            <?php if ($entry['location']): ?>
                                            <div class="yatra-entry-meta-item">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                </svg>
                                                <span><?php echo esc_html($entry['location']); ?></span>
                                            </div>
                                            <?php endif; ?>
                                            
                                            <?php if ($entry['duration']): ?>
                                            <div class="yatra-entry-meta-item">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                                <span><?php echo esc_html($entry['duration']); ?></span>
                                            </div>
                                            <?php endif; ?>
                                        </div>
                                        
                                        <?php if (!empty($entry['included'])): ?>
                                        <div class="yatra-entry-included">
                                            <?php foreach ($entry['included'] as $item): ?>
                                            <span class="yatra-included-tag">
                                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                                </svg>
                                                <?php echo esc_html($item); ?>
                                            </span>
                                            <?php endforeach; ?>
                                        </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                    
                    <!-- Days 5-13 Summary -->
                    <div class="yatra-itinerary-day yatra-itinerary-summary">
                        <div class="yatra-itinerary-day-header">
                            <div class="yatra-day-badge">Days 5-13</div>
                            <h3 class="yatra-day-title">Trek to Everest Base Camp & Return</h3>
                            <button type="button" class="yatra-day-toggle" aria-expanded="false">
                                <svg class="yatra-chevron-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="yatra-itinerary-day-content" style="display: none;">
                            <div class="yatra-summary-content">
                                <p>Continue your trek through the stunning Khumbu region:</p>
                                <ul class="yatra-summary-list">
                                    <li><strong>Day 5:</strong> Trek to Tengboche (3,860m) - Visit the famous Tengboche Monastery</li>
                                    <li><strong>Day 6:</strong> Trek to Dingboche (4,410m) - Enter the high altitude zone</li>
                                    <li><strong>Day 7:</strong> Acclimatization day in Dingboche - Hike to Nagarjun Hill</li>
                                    <li><strong>Day 8:</strong> Trek to Lobuche (4,940m) - Pass memorial cairns</li>
                                    <li><strong>Day 9:</strong> Trek to Gorak Shep (5,170m) - Visit Everest Base Camp (5,364m)</li>
                                    <li><strong>Day 10:</strong> Sunrise at Kala Patthar (5,545m) - Best Everest views</li>
                                    <li><strong>Day 11:</strong> Trek back to Pheriche (4,280m)</li>
                                    <li><strong>Day 12:</strong> Trek to Namche Bazaar (3,440m)</li>
                                    <li><strong>Day 13:</strong> Trek to Lukla (2,860m) - Celebration dinner</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- What's Included/Excluded -->
            <section class="yatra-trip-section" id="included">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('check', 'yatra-trip-section-title-icon'); ?>
                    What's Included & Excluded
                </h2>
                <div class="yatra-included-excluded">
                    <div class="yatra-included-section">
                        <h3>
                            <?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?>
                            Included
                        </h3>
                        <ul class="yatra-included-list">
                            <li><?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?> All airport transfers</li>
                            <li><?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?> Domestic flights (Kathmandu-Lukla-Kathmandu)</li>
                            <li><?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?> Teahouse accommodation (13 nights)</li>
                            <li><?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?> All meals (breakfast, lunch, dinner)</li>
                            <li><?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?> Experienced English-speaking guide</li>
                            <li><?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?> Porters (1 porter per 2 travelers)</li>
                            <li><?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?> All necessary permits (Sagarmatha National Park, TIMS)</li>
                            <li><?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?> First aid kit and oxygen cylinder</li>
                            <li><?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?> Trip completion certificate</li>
                        </ul>
                    </div>
                    <div class="yatra-excluded-section">
                        <h3>
                            <?php echo yatra_svg_icon('x', 'yatra-excluded-icon'); ?>
                            Excluded
                        </h3>
                        <ul class="yatra-excluded-list">
                            <li><?php echo yatra_svg_icon('x', 'yatra-excluded-icon'); ?> International flights</li>
                            <li><?php echo yatra_svg_icon('x', 'yatra-excluded-icon'); ?> Nepal visa ($30 USD)</li>
                            <li><?php echo yatra_svg_icon('x', 'yatra-excluded-icon'); ?> Travel insurance</li>
                            <li><?php echo yatra_svg_icon('x', 'yatra-excluded-icon'); ?> Personal expenses (drinks, snacks, tips)</li>
                            <li><?php echo yatra_svg_icon('x', 'yatra-excluded-icon'); ?> Tips for guide and porters</li>
                            <li><?php echo yatra_svg_icon('x', 'yatra-excluded-icon'); ?> Hot showers and charging (available at extra cost)</li>
                            <li><?php echo yatra_svg_icon('x', 'yatra-excluded-icon'); ?> Extra nights in Kathmandu</li>
                        </ul>
                    </div>
                </div>
            </section>

            <!-- Accommodation & Transportation -->
            <section class="yatra-trip-section">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('home', 'yatra-trip-section-title-icon'); ?>
                    Accommodation & Transportation
                </h2>
                <div class="yatra-accommodation-transport">
                    <div class="yatra-accommodation-card">
                        <h3 class="yatra-accommodation-title">
                            <?php echo yatra_svg_icon('home', 'yatra-accommodation-icon'); ?>
                            Accommodation
                        </h3>
                        <div class="yatra-accommodation-details">
                            <p><strong>Teahouse Lodges:</strong> Clean and comfortable teahouse accommodations throughout the trek. Rooms are basic but warm, typically with twin beds and shared bathroom facilities.</p>
                            <p><strong>Kathmandu:</strong> 3-star hotel with modern amenities, hot showers, and WiFi.</p>
                            <p><strong>Meal Plan:</strong> Full board (breakfast, lunch, dinner) included during the trek. Meals are hearty and nutritious, designed to fuel your adventure.</p>
                        </div>
                    </div>
                    <div class="yatra-transport-card">
                        <h3 class="yatra-transport-title">
                            <?php echo yatra_svg_icon('truck', 'yatra-transport-icon'); ?>
                            Transportation
                        </h3>
                        <div class="yatra-transport-details">
                            <p><strong>Flights:</strong> Round-trip flights between Kathmandu and Lukla included. These scenic flights offer stunning mountain views.</p>
                            <p><strong>Transfers:</strong> All airport transfers in private vehicles included.</p>
                            <p><strong>During Trek:</strong> All transportation is on foot. Porters carry your main luggage, allowing you to trek with just a daypack.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Booking Information -->
            <section class="yatra-trip-section">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('info', 'yatra-trip-section-title-icon'); ?>
                    Booking Information
                </h2>
                <div class="yatra-booking-info-grid">
                    <div class="yatra-booking-info-card">
                        <div class="yatra-booking-info-icon">
                            <?php echo yatra_svg_icon('credit-card', 'yatra-icon-lg'); ?>
                        </div>
                        <h3 class="yatra-booking-info-title">Payment Methods</h3>
                        <p class="yatra-booking-info-desc">We accept Visa, Mastercard, PayPal, and Stripe. Secure payment processing with SSL encryption.</p>
                    </div>
                    <div class="yatra-booking-info-card">
                        <div class="yatra-booking-info-icon">
                            <?php echo yatra_svg_icon('phone', 'yatra-icon-lg'); ?>
                        </div>
                        <h3 class="yatra-booking-info-title">Need Help?</h3>
                        <p class="yatra-booking-info-desc">Call us at <a href="tel:+1234567890" class="yatra-booking-info-link">+1 (234) 567-890</a> or email <a href="mailto:support@yatra.com" class="yatra-booking-info-link">support@yatra.com</a></p>
                    </div>
                    <div class="yatra-booking-info-card">
                        <div class="yatra-booking-info-icon">
                            <?php echo yatra_svg_icon('check', 'yatra-icon-lg'); ?>
                        </div>
                        <h3 class="yatra-booking-info-title">Instant Confirmation</h3>
                        <p class="yatra-booking-info-desc">Receive instant booking confirmation via email. Reserve now and pay later for flexible travel planning.</p>
                    </div>
                </div>
            </section>

            <!-- Requirements & Policies -->
            <section class="yatra-trip-section">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('info', 'yatra-trip-section-title-icon'); ?>
                    Requirements & Policies
                </h2>
                <div class="yatra-requirements-grid">
                    <div class="yatra-requirement-card">
                        <h3 class="yatra-requirement-title">
                            <?php echo yatra_svg_icon('users', 'yatra-requirement-icon'); ?>
                            Age Requirements
                        </h3>
                        <p class="yatra-requirement-content">Minimum age: <?php echo esc_html($trip_data->age_min); ?> years. Maximum age: <?php echo esc_html($trip_data->age_max); ?> years. Participants should be in good physical condition.</p>
                    </div>
                    <div class="yatra-requirement-card">
                        <h3 class="yatra-requirement-title">
                            <?php echo yatra_svg_icon('shield', 'yatra-requirement-icon'); ?>
                            Physical Requirements
                        </h3>
                        <p class="yatra-requirement-content">Good physical fitness required. Previous trekking experience recommended but not mandatory. Ability to walk 5-7 hours per day on uneven terrain.</p>
                    </div>
                    <div class="yatra-requirement-card">
                        <h3 class="yatra-requirement-title">
                            <?php echo yatra_svg_icon('info', 'yatra-requirement-icon'); ?>
                            Cancellation Policy
                        </h3>
                        <p class="yatra-requirement-content">Full refund if cancelled 60+ days before departure. 50% refund for 30-59 days. No refund for cancellations less than 30 days before departure.</p>
                    </div>
                    <div class="yatra-requirement-card">
                        <h3 class="yatra-requirement-title">
                            <?php echo yatra_svg_icon('shield', 'yatra-requirement-icon'); ?>
                            Travel Insurance
                        </h3>
                        <p class="yatra-requirement-content">Comprehensive travel insurance covering high-altitude trekking (up to 6,000m) is mandatory. Must include emergency evacuation coverage.</p>
                    </div>
                </div>
            </section>

            <!-- Gallery Section -->
            <section class="yatra-trip-section" id="gallery">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('camera', 'yatra-trip-section-title-icon'); ?>
                    Photo Gallery
                </h2>
                <div class="yatra-trip-gallery" data-gallery="hero-gallery">
                    <div class="yatra-gallery-item" data-image-index="0">
                        <img src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80" alt="Everest Base Camp">
                    </div>
                    <div class="yatra-gallery-item" data-image-index="1">
                        <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" alt="Mountain Views">
                    </div>
                    <div class="yatra-gallery-item" data-image-index="2">
                        <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80" alt="Trekking Trail">
                    </div>
                    <div class="yatra-gallery-item" data-image-index="3">
                        <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80" alt="Sherpa Village">
                    </div>
                    <div class="yatra-gallery-item" data-image-index="4">
                        <img src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80" alt="Mountain Sunrise">
                    </div>
                    <div class="yatra-gallery-item" data-image-index="5">
                        <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80" alt="Base Camp">
                    </div>
                </div>
            </section>

            <!-- Location/Map Section -->
            <section class="yatra-trip-section">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('map-pin', 'yatra-trip-section-title-icon'); ?>
                    Location
                </h2>
                <div class="yatra-trip-map">
                    <p>Interactive map will be displayed here</p>
                </div>
                <div style="margin-top: 24px; font-size: 15px; color: #374151;">
                    <p><strong>Starting Point:</strong> <?php echo esc_html($trip_data->starting_location); ?></p>
                    <p><strong>Ending Point:</strong> <?php echo esc_html($trip_data->ending_location); ?></p>
                </div>
            </section>

            <!-- FAQ Section -->
            <section class="yatra-trip-section" id="faq">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('info', 'yatra-trip-section-title-icon'); ?>
                    Frequently Asked Questions
                </h2>
                <ul class="yatra-trip-faq">
                    <li class="yatra-faq-item">
                        <h3 class="yatra-faq-question">
                            What is the best time to do the Everest Base Camp trek?
                            <?php echo yatra_svg_icon('chevron-down', 'yatra-faq-toggle'); ?>
                        </h3>
                        <div class="yatra-faq-answer">
                            <p>The best times are during the pre-monsoon (March to May) and post-monsoon (September to November) seasons. These periods offer clear skies, stable weather, and excellent visibility of the mountains.</p>
                        </div>
                    </li>
                    <li class="yatra-faq-item">
                        <h3 class="yatra-faq-question">
                            Do I need previous trekking experience?
                            <?php echo yatra_svg_icon('chevron-down', 'yatra-faq-toggle'); ?>
                        </h3>
                        <div class="yatra-faq-answer">
                            <p>While previous trekking experience is helpful, it's not mandatory. However, you should be in good physical condition and able to walk 5-7 hours per day on uneven terrain. Regular exercise and training before the trip is highly recommended.</p>
                        </div>
                    </li>
                    <li class="yatra-faq-item">
                        <h3 class="yatra-faq-question">
                            What about altitude sickness?
                            <?php echo yatra_svg_icon('chevron-down', 'yatra-faq-toggle'); ?>
                        </h3>
                        <div class="yatra-faq-answer">
                            <p>Our itinerary includes proper acclimatization days to minimize the risk of altitude sickness. We ascend gradually, and our guides are trained to recognize symptoms. However, it's important to stay hydrated, avoid alcohol, and inform your guide immediately if you experience any symptoms.</p>
                        </div>
                    </li>
                    <li class="yatra-faq-item">
                        <h3 class="yatra-faq-question">
                            What should I pack for the trek?
                            <?php echo yatra_svg_icon('chevron-down', 'yatra-faq-toggle'); ?>
                        </h3>
                        <div class="yatra-faq-answer">
                            <p>Essential items include: warm layers, waterproof jacket and pants, good trekking boots, sleeping bag (rated to -20°C), headlamp, water bottles, first aid kit, and personal medications. A detailed packing list will be provided upon booking confirmation.</p>
                        </div>
                    </li>
                    <li class="yatra-faq-item">
                        <h3 class="yatra-faq-question">
                            Is travel insurance required?
                            <?php echo yatra_svg_icon('chevron-down', 'yatra-faq-toggle'); ?>
                        </h3>
                        <div class="yatra-faq-answer">
                            <p>Yes, comprehensive travel insurance covering high-altitude trekking (up to 6,000m) and emergency evacuation is mandatory. You must provide proof of insurance before the trek begins.</p>
                        </div>
                    </li>
                    <li class="yatra-faq-item">
                        <h3 class="yatra-faq-question">
                            What is the cancellation policy?
                            <?php echo yatra_svg_icon('chevron-down', 'yatra-faq-toggle'); ?>
                        </h3>
                        <div class="yatra-faq-answer">
                            <p>Full refund if cancelled 60+ days before departure. 50% refund for cancellations 30-59 days before. No refund for cancellations less than 30 days before departure. We recommend purchasing trip cancellation insurance.</p>
                        </div>
                    </li>
                </ul>
            </section>

            <!-- Weather & Climate Section -->
            <section class="yatra-trip-section">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('cloud', 'yatra-trip-section-title-icon'); ?>
                    Weather & Climate
                </h2>
                <div class="yatra-weather-info">
                    <div class="yatra-weather-card">
                        <h3 class="yatra-weather-season">Best Time to Visit</h3>
                        <p class="yatra-weather-desc">The best times for the Everest Base Camp trek are during the pre-monsoon (March to May) and post-monsoon (September to November) seasons. These periods offer clear skies, stable weather, and excellent visibility.</p>
                    </div>
                    <div class="yatra-weather-details">
                        <div class="yatra-weather-detail-item">
                            <div class="yatra-weather-detail-label">Spring (Mar-May)</div>
                            <div class="yatra-weather-detail-value">Mild temperatures, clear skies, blooming rhododendrons</div>
                        </div>
                        <div class="yatra-weather-detail-item">
                            <div class="yatra-weather-detail-label">Autumn (Sep-Nov)</div>
                            <div class="yatra-weather-detail-value">Crisp air, excellent visibility, stable weather</div>
                        </div>
                        <div class="yatra-weather-detail-item">
                            <div class="yatra-weather-detail-label">Temperature Range</div>
                            <div class="yatra-weather-detail-value">-10°C to 15°C (varies with altitude)</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Packing List Section -->
            <section class="yatra-trip-section">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('tag', 'yatra-trip-section-title-icon'); ?>
                    What to Pack
                </h2>
                <div class="yatra-packing-list">
                    <div class="yatra-packing-category">
                        <h3 class="yatra-packing-category-title">Essential Clothing</h3>
                        <ul class="yatra-packing-items">
                            <li>Base layers (thermal underwear)</li>
                            <li>Fleece jacket and pants</li>
                            <li>Down jacket (rated to -20°C)</li>
                            <li>Waterproof jacket and pants</li>
                            <li>Trekking pants (2-3 pairs)</li>
                            <li>Hiking boots (broken in)</li>
                            <li>Woolen socks (4-5 pairs)</li>
                            <li>Gloves and warm hat</li>
                        </ul>
                    </div>
                    <div class="yatra-packing-category">
                        <h3 class="yatra-packing-category-title">Equipment & Accessories</h3>
                        <ul class="yatra-packing-items">
                            <li>Sleeping bag (rated to -20°C)</li>
                            <li>Trekking poles (highly recommended)</li>
                            <li>Headlamp with extra batteries</li>
                            <li>Water bottles or hydration system</li>
                            <li>Daypack (30-40L)</li>
                            <li>Sunglasses and sunscreen (SPF 50+)</li>
                            <li>First aid kit and personal medications</li>
                            <li>Camera and extra memory cards</li>
                        </ul>
                    </div>
                    <div class="yatra-packing-category">
                        <h3 class="yatra-packing-category-title">Documents & Money</h3>
                        <ul class="yatra-packing-items">
                            <li>Valid passport (6 months validity)</li>
                            <li>Travel insurance documents</li>
                            <li>Nepal visa (obtainable on arrival)</li>
                            <li>Cash (USD recommended for tips and extras)</li>
                            <li>Credit/debit cards</li>
                            <li>Emergency contact information</li>
                        </ul>
                    </div>
                </div>
            </section>

            <!-- Testimonials Section -->
            <section class="yatra-trip-section">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('star', 'yatra-trip-section-title-icon'); ?>
                    What Our Travelers Say
                </h2>
                <div class="yatra-trip-testimonials">
                    <div class="yatra-testimonial-card">
                        <div class="yatra-testimonial-rating">★★★★★</div>
                        <p class="yatra-testimonial-text">"An absolutely incredible experience! Our guide was knowledgeable and supportive, the scenery was breathtaking, and the entire trip was well-organized. Reaching Base Camp was a dream come true!"</p>
                        <div class="yatra-testimonial-author">
                            <div class="yatra-testimonial-avatar">SM</div>
                            <div class="yatra-testimonial-info">
                                <div class="yatra-testimonial-name">Sarah Mitchell</div>
                                <div class="yatra-testimonial-location">United States • March 2024</div>
                            </div>
                        </div>
                    </div>
                    <div class="yatra-testimonial-card">
                        <div class="yatra-testimonial-rating">★★★★★</div>
                        <p class="yatra-testimonial-text">"The best trekking experience of my life! The team was professional, the itinerary was perfect for acclimatization, and the views were beyond words. Highly recommend this trip to anyone considering it."</p>
                        <div class="yatra-testimonial-author">
                            <div class="yatra-testimonial-avatar">JD</div>
                            <div class="yatra-testimonial-info">
                                <div class="yatra-testimonial-name">James Davis</div>
                                <div class="yatra-testimonial-location">United Kingdom • October 2023</div>
                            </div>
                        </div>
                    </div>
                    <div class="yatra-testimonial-card">
                        <div class="yatra-testimonial-rating">★★★★☆</div>
                        <p class="yatra-testimonial-text">"Challenging but incredibly rewarding. The guides were excellent at managing the group's pace and ensuring everyone's safety. The teahouses were comfortable, and the food was surprisingly good!"</p>
                        <div class="yatra-testimonial-author">
                            <div class="yatra-testimonial-avatar">MW</div>
                            <div class="yatra-testimonial-info">
                                <div class="yatra-testimonial-name">Maria Wilson</div>
                                <div class="yatra-testimonial-location">Australia • November 2023</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Similar Trips Section -->
            <section class="yatra-trip-section">
                <h2 class="yatra-trip-section-title">
                    <?php echo yatra_svg_icon('mountain', 'yatra-trip-section-title-icon'); ?>
                    Similar Adventures
                </h2>
                <div class="yatra-similar-trips">
                    <div class="yatra-similar-trip-card">
                        <div class="yatra-similar-trip-image">
                            <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" alt="Annapurna Base Camp">
                        </div>
                        <div class="yatra-similar-trip-content">
                            <h3 class="yatra-similar-trip-title">Annapurna Base Camp Trek</h3>
                            <div class="yatra-similar-trip-meta">
                                <span>12 Days</span>
                                <span>•</span>
                                <span>Moderate</span>
                                <span>•</span>
                                <span><?php echo yatra_format_price(1450, $trip_data->currency); ?></span>
                            </div>
                        </div>
                    </div>
                    <div class="yatra-similar-trip-card">
                        <div class="yatra-similar-trip-image">
                            <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80" alt="Langtang Valley">
                        </div>
                        <div class="yatra-similar-trip-content">
                            <h3 class="yatra-similar-trip-title">Langtang Valley Trek</h3>
                            <div class="yatra-similar-trip-meta">
                                <span>10 Days</span>
                                <span>•</span>
                                <span>Moderate</span>
                                <span>•</span>
                                <span><?php echo yatra_format_price(1200, $trip_data->currency); ?></span>
                            </div>
                        </div>
                    </div>
                    <div class="yatra-similar-trip-card">
                        <div class="yatra-similar-trip-image">
                            <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80" alt="Manaslu Circuit">
                        </div>
                        <div class="yatra-similar-trip-content">
                            <h3 class="yatra-similar-trip-title">Manaslu Circuit Trek</h3>
                            <div class="yatra-similar-trip-meta">
                                <span>16 Days</span>
                                <span>•</span>
                                <span>Challenging</span>
                                <span>•</span>
                                <span><?php echo yatra_format_price(1850, $trip_data->currency); ?></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- Sidebar - Booking Card -->
        <aside class="yatra-trip-sidebar" id="booking">
            <div class="yatra-booking-card">
                <!-- Price -->
                <div class="yatra-booking-price">
                    <div class="yatra-booking-price-from">
                        <?php if ($trip_data->original_price > $trip_data->sale_price): ?>
                        <span class="yatra-booking-price-original"><?php echo yatra_format_price($trip_data->original_price, $trip_data->currency); ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="yatra-booking-price-main">
                        <span class="yatra-booking-price-amount"><?php echo yatra_format_price($trip_data->sale_price, $trip_data->currency); ?></span>
                        <span class="yatra-booking-price-label">per person</span>
                    </div>
                </div>

                <!-- Availability Alert (Compact) -->
                <div class="yatra-booking-availability-compact">
                    <span class="yatra-booking-availability-text">Only <strong>3 spots</strong> left for March</span>
                </div>

                <form class="yatra-booking-form">
                    <!-- Date Selection -->
                    <div class="yatra-booking-field-select">
                        <div class="yatra-booking-field-icon">
                            <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                        </div>
                        <input type="text" id="travel_date" name="travel_date" class="yatra-booking-select yatra-datepicker" placeholder="Select date" readonly required>
                        <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>

                    <!-- Travelers Selection -->
                    <div class="yatra-booking-field-select yatra-participants-select">
                        <div class="yatra-booking-field-icon">
                            <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                        </div>
                        <div class="yatra-participants-display" id="participants-display">
                            Adult x 1
                        </div>
                        <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                        <div class="yatra-booking-quantity-selector" id="quantity-selector">
                            <div class="yatra-quantity-row">
                                <div class="yatra-quantity-label">
                                    <span class="yatra-quantity-title">Adult</span>
                                    <span class="yatra-quantity-subtitle">(Age 13-99)</span>
                                </div>
                                <div class="yatra-quantity-controls">
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="adults" aria-label="Decrease adults">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                        </svg>
                                    </button>
                                    <input type="number" id="adults" name="adults" class="yatra-quantity-input" value="1" min="1" max="<?php echo $trip_data->max_travelers; ?>" readonly>
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="adults" aria-label="Increase adults">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="yatra-quantity-row">
                                <div class="yatra-quantity-label">
                                    <span class="yatra-quantity-title">Child</span>
                                    <span class="yatra-quantity-subtitle">(Age 4-12)</span>
                                </div>
                                <div class="yatra-quantity-controls">
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="children" aria-label="Decrease children" disabled>
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                        </svg>
                                    </button>
                                    <input type="number" id="children" name="children" class="yatra-quantity-input" value="0" min="0" max="10" readonly>
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="children" aria-label="Increase children">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="yatra-quantity-note">Ages 3 and younger are not permitted.</div>
                        </div>
                    </div>

                    <!-- Total Price Display (Dynamic) -->
                    <div class="yatra-booking-total" id="booking-total" style="display: none;">
                        <div class="yatra-booking-total-label">Total</div>
                        <div class="yatra-booking-total-amount" id="total-amount"><?php echo yatra_format_price($trip_data->sale_price, $trip_data->currency); ?></div>
                    </div>

                    <!-- Action Buttons -->
                    <button type="button" class="yatra-booking-button" id="check-availability-btn" data-trip-id="<?php echo esc_attr($wp_query->get('yatra_trip_id') ?: 1); ?>">
                        Check availability
                    </button>

                    <button type="button" class="yatra-booking-enquiry-button" id="open-enquiry-modal" onclick="event.preventDefault(); event.stopPropagation(); const modal = document.getElementById('enquiry-modal'); if(modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; } return false;">
                        Make Enquiry
                    </button>

                    <!-- Single Trust Signal -->
                    <div class="yatra-booking-trust">
                        <div class="yatra-booking-trust-icon">
                            <?php echo yatra_svg_icon('check', 'yatra-icon-xs'); ?>
                        </div>
                        <div class="yatra-booking-trust-text">
                            <strong>Free cancellation</strong> up to 24 hours before
                        </div>
                    </div>
                </form>
            </div>
        </aside>
    </div>
</div>

<!-- Enquiry Modal -->
<div class="yatra-enquiry-modal" id="enquiry-modal" role="dialog" aria-modal="true" aria-label="Make Enquiry">
    <div class="yatra-enquiry-modal-overlay"></div>
    <div class="yatra-enquiry-modal-content">
        <button type="button" class="yatra-enquiry-modal-close" aria-label="Close Enquiry Form">
            <svg class="yatra-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
        <div class="yatra-enquiry-modal-header">
            <h2 class="yatra-enquiry-modal-title">Make an Enquiry</h2>
            <p class="yatra-enquiry-modal-subtitle">Fill out the form below and we'll get back to you as soon as possible</p>
        </div>
        <form class="yatra-enquiry-form" id="enquiry-form">
            <div class="yatra-enquiry-form-grid">
                <div class="yatra-enquiry-field">
                    <label for="enquiry-name" class="yatra-enquiry-label">Full Name <span class="yatra-enquiry-required">*</span></label>
                    <input type="text" id="enquiry-name" name="name" class="yatra-enquiry-input" placeholder="Enter your full name" required>
                </div>
                
                <div class="yatra-enquiry-field">
                    <label for="enquiry-email" class="yatra-enquiry-label">Email Address <span class="yatra-enquiry-required">*</span></label>
                    <input type="email" id="enquiry-email" name="email" class="yatra-enquiry-input" placeholder="your.email@example.com" required>
                </div>
                
                <div class="yatra-enquiry-field">
                    <label for="enquiry-phone" class="yatra-enquiry-label">Phone Number</label>
                    <input type="tel" id="enquiry-phone" name="phone" class="yatra-enquiry-input" placeholder="+1 (234) 567-8900">
                </div>
            </div>
            
            <div class="yatra-enquiry-field-group">
                <div class="yatra-enquiry-field">
                    <label for="enquiry-travel-date" class="yatra-enquiry-label">Preferred Travel Date</label>
                    <div class="yatra-booking-field-select">
                        <div class="yatra-booking-field-icon">
                            <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                        </div>
                        <input type="text" id="enquiry-travel-date" name="travel_date" class="yatra-booking-select yatra-enquiry-datepicker" placeholder="Select date" readonly>
                        <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                </div>
                
                <div class="yatra-enquiry-field">
                    <label for="enquiry-travelers" class="yatra-enquiry-label">Number of Travelers</label>
                    <div class="yatra-booking-field-select yatra-participants-select yatra-enquiry-participants">
                        <div class="yatra-booking-field-icon">
                            <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                        </div>
                        <div class="yatra-participants-display" id="enquiry-participants-display">
                            Adult x 1
                        </div>
                        <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                        <div class="yatra-booking-quantity-selector" id="enquiry-quantity-selector">
                            <div class="yatra-quantity-row">
                                <div class="yatra-quantity-label">
                                    <span class="yatra-quantity-title">Adult</span>
                                    <span class="yatra-quantity-subtitle">(Age 13-99)</span>
                                </div>
                                <div class="yatra-quantity-controls">
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="enquiry-adults" aria-label="Decrease adults">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                        </svg>
                                    </button>
                                    <input type="number" id="enquiry-adults" name="enquiry_adults" class="yatra-quantity-input" value="1" min="1" max="20" readonly>
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="enquiry-adults" aria-label="Increase adults">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="yatra-quantity-row">
                                <div class="yatra-quantity-label">
                                    <span class="yatra-quantity-title">Child</span>
                                    <span class="yatra-quantity-subtitle">(Age 4-12)</span>
                                </div>
                                <div class="yatra-quantity-controls">
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="enquiry-children" aria-label="Decrease children" disabled>
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                        </svg>
                                    </button>
                                    <input type="number" id="enquiry-children" name="enquiry_children" class="yatra-quantity-input" value="0" min="0" max="10" readonly>
                                    <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="enquiry-children" aria-label="Increase children">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="yatra-quantity-note">Ages 3 and younger are not permitted.</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="yatra-enquiry-field">
                <label for="enquiry-message" class="yatra-enquiry-label">Message <span class="yatra-enquiry-required">*</span></label>
                <textarea id="enquiry-message" name="message" class="yatra-enquiry-textarea" rows="3" placeholder="Tell us about your travel plans, special requirements, or any questions you have..." required></textarea>
            </div>
            
            <div class="yatra-enquiry-actions">
                <button type="button" class="yatra-enquiry-cancel" id="close-enquiry-modal">Cancel</button>
                <button type="submit" class="yatra-enquiry-submit">Send Enquiry</button>
            </div>
        </form>
    </div>
</div>

<?php
get_footer();
?>

