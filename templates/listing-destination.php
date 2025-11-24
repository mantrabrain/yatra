<?php
/**
 * Destination Listing Page Template - Static Version with Dummy Data
 * 
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

get_header();
?>

<div class="yatra-listing-page yatra-destination-listing">
    <div class="yatra-listing-wrapper">
        <div class="yatra-listing-container">
            
            <!-- Page Header -->
            <div class="yatra-destination-header">
                <div class="yatra-destination-header-content">
                    <h1>All Destinations</h1>
                    <p>Explore breathtaking destinations around the world</p>
                </div>
                <div class="yatra-results-controls">
                    <div class="yatra-sort-control">
                        <label>Sort by:</label>
                        <select>
                            <option>Most Popular</option>
                            <option>Most Trips</option>
                            <option>Name: A-Z</option>
                            <option>Name: Z-A</option>
                        </select>
                    </div>
                    <div class="yatra-view-toggle">
                        <button class="yatra-view-btn active" data-view="grid" title="Grid View">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                            </svg>
                        </button>
                        <button class="yatra-view-btn" data-view="list" title="List View">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Destination Grid -->
            <div class="yatra-destination-grid" id="destination-grid">
                <?php
                // Dummy destinations data
                $dummy_destinations = [
                    [
                        'name' => 'Nepal',
                        'image' => 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&h=600&fit=crop',
                        'trips_count' => 45,
                        'description' => 'Land of the Himalayas - Experience majestic mountains, ancient temples, and rich culture',
                        'avg_rating' => 4.8,
                        'starting_price' => '$1,200'
                    ],
                    [
                        'name' => 'Bhutan',
                        'image' => 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
                        'trips_count' => 28,
                        'description' => 'Kingdom of Happiness - Discover Buddhist monasteries and pristine landscapes',
                        'avg_rating' => 4.7,
                        'starting_price' => '$2,500'
                    ],
                    [
                        'name' => 'India',
                        'image' => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
                        'trips_count' => 62,
                        'description' => 'Incredible Diversity - From the Himalayas to beaches, explore diverse cultures',
                        'avg_rating' => 4.6,
                        'starting_price' => '$1,500'
                    ],
                    [
                        'name' => 'Tibet',
                        'image' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                        'trips_count' => 18,
                        'description' => 'Roof of the World - High-altitude adventures and Tibetan culture',
                        'avg_rating' => 4.9,
                        'starting_price' => '$2,800'
                    ],
                    [
                        'name' => 'Sri Lanka',
                        'image' => 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop',
                        'trips_count' => 32,
                        'description' => 'Pearl of the Indian Ocean - Tropical beaches, wildlife, and ancient ruins',
                        'avg_rating' => 4.5,
                        'starting_price' => '$1,800'
                    ],
                    [
                        'name' => 'Myanmar',
                        'image' => 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&h=600&fit=crop',
                        'trips_count' => 15,
                        'description' => 'Golden Land - Temples, pagodas, and authentic Southeast Asian culture',
                        'avg_rating' => 4.4,
                        'starting_price' => '$1,600'
                    ],
                ];

                foreach ($dummy_destinations as $destination) {
                ?>
                <div class="yatra-destination-card">
                    <div class="yatra-destination-image">
                        <img src="<?php echo esc_url($destination['image']); ?>" alt="<?php echo esc_attr($destination['name']); ?>">
                        <div class="yatra-destination-overlay">
                            <h3><?php echo esc_html($destination['name']); ?></h3>
                        </div>
                    </div>
                    <div class="yatra-destination-content">
                        <p><?php echo esc_html($destination['description']); ?></p>
                        <div class="yatra-destination-stats">
                            <div class="yatra-destination-stat">
                                <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span><?php echo esc_html($destination['avg_rating']); ?></span>
                            </div>
                            <div class="yatra-destination-stat">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                                <span><?php echo esc_html($destination['trips_count']); ?> Trips</span>
                            </div>
                            <div class="yatra-destination-stat">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span>From <?php echo esc_html($destination['starting_price']); ?></span>
                            </div>
                        </div>
                        <button class="yatra-destination-btn">Explore Destination</button>
                    </div>
                </div>
                <?php } ?>
            </div>

            <!-- Pagination -->
            <div class="yatra-listing-pagination">
                <button class="yatra-pagination-btn" disabled>Previous</button>
                <button class="yatra-pagination-btn active">1</button>
                <button class="yatra-pagination-btn">2</button>
                <button class="yatra-pagination-btn">3</button>
                <button class="yatra-pagination-btn">Next</button>
            </div>
        </div>
    </div>
</div>

<?php
get_footer();
?>
