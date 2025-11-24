<?php
/**
 * Activity Listing Page Template - Static Version with Dummy Data
 * 
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

get_header();
?>

<div class="yatra-listing-page yatra-activity-listing">
    <div class="yatra-listing-wrapper">
        <div class="yatra-listing-container">
            
            <!-- Page Header -->
            <div class="yatra-activity-header">
                <div class="yatra-activity-header-content">
                    <h1>All Activities</h1>
                    <p>Discover exciting activities and experiences</p>
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

            <!-- Activity Grid -->
            <div class="yatra-activity-grid" id="activity-grid">
                <?php
                // Dummy activities data
                $dummy_activities = [
                    [
                        'name' => 'Trekking',
                        'image' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                        'trips_count' => 78,
                        'description' => 'Explore mountains and trails on foot, from easy day hikes to challenging multi-day treks',
                        'avg_rating' => 4.8,
                        'starting_price' => '$1,200'
                    ],
                    [
                        'name' => 'Cultural Tours',
                        'image' => 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
                        'trips_count' => 45,
                        'description' => 'Immerse in local culture, visit historical sites, temples, and experience traditional customs',
                        'avg_rating' => 4.6,
                        'starting_price' => '$1,800'
                    ],
                    [
                        'name' => 'Adventure Sports',
                        'image' => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
                        'trips_count' => 32,
                        'description' => 'Thrilling outdoor activities including rafting, paragliding, bungee jumping, and more',
                        'avg_rating' => 4.7,
                        'starting_price' => '$2,000'
                    ],
                    [
                        'name' => 'Wildlife Safari',
                        'image' => 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop',
                        'trips_count' => 28,
                        'description' => 'Discover exotic wildlife in their natural habitats with expert guides',
                        'avg_rating' => 4.9,
                        'starting_price' => '$2,500'
                    ],
                    [
                        'name' => 'Pilgrimage Tours',
                        'image' => 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&h=600&fit=crop',
                        'trips_count' => 19,
                        'description' => 'Spiritual journeys to sacred sites, monasteries, and places of religious significance',
                        'avg_rating' => 4.5,
                        'starting_price' => '$1,500'
                    ],
                    [
                        'name' => 'Photography Tours',
                        'image' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                        'trips_count' => 24,
                        'description' => 'Capture stunning moments with guided photography tours to scenic locations',
                        'avg_rating' => 4.6,
                        'starting_price' => '$1,900'
                    ],
                ];

                foreach ($dummy_activities as $activity) {
                ?>
                <div class="yatra-activity-card">
                    <div class="yatra-activity-image">
                        <img src="<?php echo esc_url($activity['image']); ?>" alt="<?php echo esc_attr($activity['name']); ?>">
                    </div>
                    <div class="yatra-activity-content">
                        <h3><?php echo esc_html($activity['name']); ?></h3>
                        <p><?php echo esc_html($activity['description']); ?></p>
                        <div class="yatra-activity-stats">
                            <div class="yatra-activity-stat">
                                <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span><?php echo esc_html($activity['avg_rating']); ?></span>
                            </div>
                            <div class="yatra-activity-stat">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                                <span><?php echo esc_html($activity['trips_count']); ?> Trips</span>
                            </div>
                            <div class="yatra-activity-stat">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span>From <?php echo esc_html($activity['starting_price']); ?></span>
                            </div>
                        </div>
                        <button class="yatra-activity-btn">View Trips</button>
                    </div>
                </div>
                <?php } ?>
            </div>

            <!-- Pagination -->
            <div class="yatra-listing-pagination">
                <button class="yatra-pagination-btn" disabled>Previous</button>
                <button class="yatra-pagination-btn active">1</button>
                <button class="yatra-pagination-btn">2</button>
                <button class="yatra-pagination-btn">Next</button>
            </div>
        </div>
    </div>
</div>

<?php
get_footer();
?>
