<?php
/**
 * Trip Listing Page Template - Static Version with Dummy Data
 * 
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

get_header();
?>

<div class="yatra-listing-page yatra-trip-listing">
    <!-- Advanced Search Bar -->
    <div class="yatra-advanced-search">
        <div class="yatra-search-container">
            <div class="yatra-search-header">
                <h2>Find Your Perfect Trip</h2>
                <button class="yatra-advanced-toggle" id="advancedToggle">Advanced Options <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button>
            </div>
            <div class="yatra-search-form">
                <div class="yatra-search-field">
                    <label>Destination</label>
                    <input type="text" placeholder="Where do you want to go?" value="" id="searchDestination">
                </div>
                <div class="yatra-search-field">
                    <label>Start Date</label>
                    <input type="date" value="" id="searchStartDate">
                </div>
                <div class="yatra-search-field">
                    <label>End Date</label>
                    <input type="date" value="" id="searchEndDate">
                </div>
                <div class="yatra-search-field">
                    <label>Travelers</label>
                    <div class="yatra-travelers-select" id="travelersSelect">
                        <input type="text" placeholder="Adults" value="2 Adults" readonly>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                </div>
                <div class="yatra-search-field">
                    <label>Budget Range</label>
                    <select id="searchBudget">
                        <option value="">Any Budget</option>
                        <option value="0-1000">Under $1,000</option>
                        <option value="1000-2000">$1,000 - $2,000</option>
                        <option value="2000-3000">$2,000 - $3,000</option>
                        <option value="3000+">$3,000+</option>
                    </select>
                </div>
                <button class="yatra-search-btn">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    Search Trips
                </button>
            </div>
            <div class="yatra-advanced-options" id="advancedOptions" style="display: none;">
                <div class="yatra-advanced-row">
                    <div class="yatra-search-field">
                        <label>Activity Type</label>
                        <select id="searchActivity">
                            <option value="">All Activities</option>
                            <option value="trekking">Trekking</option>
                            <option value="cultural">Cultural Tour</option>
                            <option value="adventure">Adventure</option>
                            <option value="wildlife">Wildlife Safari</option>
                            <option value="pilgrimage">Pilgrimage</option>
                        </select>
                    </div>
                    <div class="yatra-search-field">
                        <label>Difficulty Level</label>
                        <select id="searchDifficulty">
                            <option value="">Any Difficulty</option>
                            <option value="easy">Easy</option>
                            <option value="moderate">Moderate</option>
                            <option value="challenging">Challenging</option>
                            <option value="strenuous">Strenuous</option>
                        </select>
                    </div>
                    <div class="yatra-search-field">
                        <label>Duration</label>
                        <select id="searchDuration">
                            <option value="">Any Duration</option>
                            <option value="1-7">1-7 Days</option>
                            <option value="8-14">8-14 Days</option>
                            <option value="15-21">15-21 Days</option>
                            <option value="22+">22+ Days</option>
                        </select>
                    </div>
                </div>
                <div class="yatra-advanced-row">
                    <div class="yatra-search-field">
                        <label>Min Rating</label>
                        <select id="searchRating">
                            <option value="">Any Rating</option>
                            <option value="4.5">4.5+ Excellent</option>
                            <option value="4.0">4.0+ Very Good</option>
                            <option value="3.5">3.5+ Good</option>
                            <option value="3.0">3.0+ Fair</option>
                        </select>
                    </div>
                    <div class="yatra-search-field">
                        <label>Group Size</label>
                        <select id="searchGroupSize">
                            <option value="">Any Size</option>
                            <option value="1-4">1-4 People</option>
                            <option value="5-10">5-10 People</option>
                            <option value="11-20">11-20 People</option>
                            <option value="20+">20+ People</option>
                        </select>
                    </div>
                    <div class="yatra-search-field">
                        <label>Special Features</label>
                        <div class="yatra-checkbox-inline">
                            <label><input type="checkbox" value="instant"> Instant Confirmation</label>
                            <label><input type="checkbox" value="free-cancel"> Free Cancellation</label>
                            <label><input type="checkbox" value="discount"> Discount Available</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="yatra-listing-wrapper">
        <div class="yatra-listing-container">
            
            <!-- Results Header -->
            <div class="yatra-results-header">
                <div class="yatra-results-info">
                    <h1>All Trips</h1>
                    <p class="yatra-results-count">Showing <strong>24</strong> trips</p>
                </div>
                <div class="yatra-results-controls">
                    <div class="yatra-sort-control">
                        <label>Sort by:</label>
                        <select>
                            <option>Recommended</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                            <option>Rating: Highest</option>
                            <option>Duration: Shortest</option>
                            <option>Duration: Longest</option>
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

            <div class="yatra-listing-layout">
                <!-- Filter Sidebar -->
                <aside class="yatra-filter-sidebar">
                    <div class="yatra-filter-header">
                        <h2>Filters</h2>
                        <button class="yatra-clear-filters">Clear all</button>
                    </div>

                    <!-- Price Range -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="price">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span>Price Range</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-price-range">
                                <div class="yatra-price-inputs">
                                    <input type="number" placeholder="Min" min="0" value="">
                                    <span>-</span>
                                    <input type="number" placeholder="Max" min="0" value="">
                                </div>
                                <div class="yatra-price-slider">
                                    <input type="range" min="0" max="5000" step="100" value="0" class="yatra-range-min">
                                    <input type="range" min="0" max="5000" step="100" value="5000" class="yatra-range-max">
                                </div>
                                <div class="yatra-price-display">$0 - $5,000</div>
                            </div>
                        </div>
                    </div>

                    <!-- Duration -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="duration">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span>Duration</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="1-7">
                                    <span>1-7 Days</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="8-14">
                                    <span>8-14 Days</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="15-21">
                                    <span>15-21 Days</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="22+">
                                    <span>22+ Days</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Difficulty Level -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="difficulty">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                                </svg>
                                <span>Difficulty Level</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="easy">
                                    <span>Easy</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="moderate">
                                    <span>Moderate</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="challenging">
                                    <span>Challenging</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="strenuous">
                                    <span>Strenuous</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Destination -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="destination">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                <span>Destination</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="nepal">
                                    <span>Nepal</span>
                                    <span class="yatra-filter-count">(12)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="bhutan">
                                    <span>Bhutan</span>
                                    <span class="yatra-filter-count">(5)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="india">
                                    <span>India</span>
                                    <span class="yatra-filter-count">(4)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="tibet">
                                    <span>Tibet</span>
                                    <span class="yatra-filter-count">(3)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Activity Type -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="activity">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                                <span>Activity Type</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="trekking">
                                    <span>Trekking</span>
                                    <span class="yatra-filter-count">(15)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="cultural">
                                    <span>Cultural Tour</span>
                                    <span class="yatra-filter-count">(6)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="adventure">
                                    <span>Adventure</span>
                                    <span class="yatra-filter-count">(3)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Rating -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="rating">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="#fbbf24" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span>Rating</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="4.5+">
                                    <div class="yatra-rating-display">
                                        <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span>4.5+ Excellent</span>
                                    </div>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="4.0+">
                                    <div class="yatra-rating-display">
                                        <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span>4.0+ Very Good</span>
                                    </div>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="3.5+">
                                    <div class="yatra-rating-display">
                                        <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span>3.5+ Good</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Special Offers -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="offers">
                            <span>Special Offers</span>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="discount">
                                    <span>Discount Available</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="instant">
                                    <span>Instant Confirmation</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="free-cancel">
                                    <span>Free Cancellation</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </aside>

                <!-- Main Content Area -->
                <main class="yatra-listing-content">
                    <div class="yatra-trip-grid" id="trip-grid">
                        <?php
                        // Dummy trips data
                        $dummy_trips = [
                            [
                                'title' => 'Everest Base Camp Trek',
                                'image' => 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&h=600&fit=crop',
                                'duration' => '14 Days',
                                'price' => '$1,650',
                                'original_price' => '$1,850',
                                'discount' => '11%',
                                'rating' => 4.8,
                                'reviews' => 245,
                                'location' => 'Nepal',
                                'difficulty' => 'Challenging',
                                'highlights' => ['Small Group', 'Expert Guide', 'All Meals Included']
                            ],
                            [
                                'title' => 'Annapurna Circuit Trek',
                                'image' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                                'duration' => '18 Days',
                                'price' => '$1,450',
                                'original_price' => null,
                                'discount' => null,
                                'rating' => 4.9,
                                'reviews' => 189,
                                'location' => 'Nepal',
                                'difficulty' => 'Moderate',
                                'highlights' => ['Cultural Experience', 'Mountain Views', 'Teahouse Stay']
                            ],
                            [
                                'title' => 'Bhutan Cultural Tour',
                                'image' => 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
                                'duration' => '10 Days',
                                'price' => '$2,200',
                                'original_price' => '$2,500',
                                'discount' => '12%',
                                'rating' => 4.7,
                                'reviews' => 156,
                                'location' => 'Bhutan',
                                'difficulty' => 'Easy',
                                'highlights' => ['Tiger\'s Nest', 'Festival', 'Luxury Hotels']
                            ],
                            [
                                'title' => 'Ladakh Adventure Tour',
                                'image' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                                'duration' => '12 Days',
                                'price' => '$1,800',
                                'original_price' => null,
                                'discount' => null,
                                'rating' => 4.6,
                                'reviews' => 98,
                                'location' => 'India',
                                'difficulty' => 'Moderate',
                                'highlights' => ['High Altitude', 'Buddhist Culture', 'Scenic Drives']
                            ],
                            [
                                'title' => 'Langtang Valley Trek',
                                'image' => 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop',
                                'duration' => '10 Days',
                                'price' => '$1,200',
                                'original_price' => '$1,400',
                                'discount' => '14%',
                                'rating' => 4.5,
                                'reviews' => 112,
                                'location' => 'Nepal',
                                'difficulty' => 'Moderate',
                                'highlights' => ['Valley Views', 'Local Culture', 'Budget Friendly']
                            ],
                            [
                                'title' => 'Tibet Overland Tour',
                                'image' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                                'duration' => '15 Days',
                                'price' => '$2,500',
                                'original_price' => null,
                                'discount' => null,
                                'rating' => 4.8,
                                'reviews' => 76,
                                'location' => 'Tibet',
                                'difficulty' => 'Challenging',
                                'highlights' => ['Potala Palace', 'Mount Everest', 'Tibetan Culture']
                            ],
                        ];

                        foreach ($dummy_trips as $trip) {
                        ?>
                        <div class="yatra-trip-card">
                            <div class="yatra-trip-image">
                                <img src="<?php echo esc_url($trip['image']); ?>" alt="<?php echo esc_attr($trip['title']); ?>">
                                <?php if ($trip['discount']): ?>
                                <div class="yatra-discount-badge">
                                    <?php echo esc_html($trip['discount']); ?> OFF
                                </div>
                                <?php endif; ?>
                                <button class="yatra-favorite-btn" title="Add to favorites">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                    </svg>
                                </button>
                            </div>
                            
                            <div class="yatra-trip-content">
                                <div class="yatra-trip-meta">
                                    <span class="yatra-trip-location"><?php echo esc_html($trip['location']); ?></span>
                                    <span class="yatra-trip-separator">•</span>
                                    <span class="yatra-trip-duration"><?php echo esc_html($trip['duration']); ?></span>
                                    <span class="yatra-trip-separator">•</span>
                                    <span class="yatra-trip-difficulty"><?php echo esc_html($trip['difficulty']); ?></span>
                                </div>
                                
                                <h3 class="yatra-trip-title"><?php echo esc_html($trip['title']); ?></h3>
                                
                                <?php if (!empty($trip['highlights'])): ?>
                                <div class="yatra-trip-highlights">
                                    <?php foreach ($trip['highlights'] as $highlight): ?>
                                    <span class="yatra-highlight-badge"><?php echo esc_html($highlight); ?></span>
                                    <?php endforeach; ?>
                                </div>
                                <?php endif; ?>
                                
                                <div class="yatra-trip-rating">
                                    <div class="yatra-rating-stars">
                                        <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span class="yatra-rating-value"><?php echo esc_html($trip['rating']); ?></span>
                                    </div>
                                    <span class="yatra-reviews-count">(<?php echo esc_html($trip['reviews']); ?> reviews)</span>
                                </div>
                                
                                <div class="yatra-trip-footer">
                                    <div class="yatra-trip-price">
                                        <?php if ($trip['original_price']): ?>
                                        <div class="yatra-original-price"><?php echo esc_html($trip['original_price']); ?></div>
                                        <?php endif; ?>
                                        <div class="yatra-current-price"><?php echo esc_html($trip['price']); ?></div>
                                        <div class="yatra-price-note">per person</div>
                                    </div>
                                    <button class="yatra-view-btn">View Details</button>
                                </div>
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
                </main>
            </div>
        </div>
    </div>
</div>

<?php
get_footer();
?>
