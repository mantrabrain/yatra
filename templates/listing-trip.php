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
    <!-- Horizontal Search Bar -->
    <div class="yatra-horizontal-search">
        <div class="yatra-horizontal-search-container">
            <div class="yatra-search-bar">
                <!-- Destination Dropdown -->
                <div class="yatra-search-dropdown" data-dropdown="destination">
                    <div class="yatra-dropdown-trigger">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <div class="yatra-dropdown-content">
                            <span class="yatra-dropdown-label">DESTINATION</span>
                            <span class="yatra-dropdown-value">Pick a destination</span>
                        </div>
                        <svg class="yatra-dropdown-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu">
                        <div class="yatra-dropdown-option" data-value="nepal">Nepal</div>
                        <div class="yatra-dropdown-option" data-value="bhutan">Bhutan</div>
                        <div class="yatra-dropdown-option" data-value="india">India</div>
                        <div class="yatra-dropdown-option" data-value="tibet">Tibet</div>
                        <div class="yatra-dropdown-option" data-value="sri-lanka">Sri Lanka</div>
                    </div>
                </div>

                <div class="yatra-search-divider"></div>

                <!-- Activities Dropdown -->
                <div class="yatra-search-dropdown" data-dropdown="activities">
                    <div class="yatra-dropdown-trigger">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <div class="yatra-dropdown-content">
                            <span class="yatra-dropdown-label">ACTIVITIES</span>
                            <span class="yatra-dropdown-value">Choose an activity</span>
                        </div>
                        <svg class="yatra-dropdown-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu">
                        <div class="yatra-dropdown-option" data-value="trekking">Trekking</div>
                        <div class="yatra-dropdown-option" data-value="cultural">Cultural Tour</div>
                        <div class="yatra-dropdown-option" data-value="adventure">Adventure</div>
                        <div class="yatra-dropdown-option" data-value="wildlife">Wildlife Safari</div>
                        <div class="yatra-dropdown-option" data-value="pilgrimage">Pilgrimage</div>
                    </div>
                </div>

                <div class="yatra-search-divider"></div>

                <!-- Duration Dropdown with Range Slider -->
                <div class="yatra-search-dropdown" data-dropdown="duration">
                    <div class="yatra-dropdown-trigger">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div class="yatra-dropdown-content">
                            <span class="yatra-dropdown-label">DURATION</span>
                            <span class="yatra-dropdown-value">Trip duration</span>
                        </div>
                        <svg class="yatra-dropdown-arrow yatra-arrow-up" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu yatra-duration-menu">
                        <div class="yatra-duration-slider-wrapper">
                            <div class="yatra-duration-badges">
                                <span class="yatra-duration-badge yatra-duration-min-badge">2 Days</span>
                                <span class="yatra-duration-badge yatra-duration-max-badge">29 Days</span>
                            </div>
                            <div class="yatra-dual-range-slider">
                                <input type="range" id="durationMin" min="1" max="30" value="2" class="yatra-range-min">
                                <input type="range" id="durationMax" min="1" max="30" value="29" class="yatra-range-max">
                                <div class="yatra-slider-track"></div>
                                <div class="yatra-slider-range"></div>
                            </div>
                            <div class="yatra-duration-labels">
                                <span>2 Days</span>
                                <span>29 Days</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="yatra-search-divider"></div>

                <!-- Budget Dropdown -->
                <div class="yatra-search-dropdown" data-dropdown="budget">
                    <div class="yatra-dropdown-trigger">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div class="yatra-dropdown-content">
                            <span class="yatra-dropdown-label">BUDGET</span>
                            <span class="yatra-dropdown-value">Your budget range</span>
                        </div>
                        <svg class="yatra-dropdown-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu">
                        <div class="yatra-dropdown-option" data-value="0-1000">Under $1,000</div>
                        <div class="yatra-dropdown-option" data-value="1000-2000">$1,000 - $2,000</div>
                        <div class="yatra-dropdown-option" data-value="2000-3000">$2,000 - $3,000</div>
                        <div class="yatra-dropdown-option" data-value="3000-5000">$3,000 - $5,000</div>
                        <div class="yatra-dropdown-option" data-value="5000+">$5,000+</div>
                    </div>
                </div>

                <!-- Search Button -->
                <button class="yatra-search-main-btn">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    Search
                </button>
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
                <!-- Filter Sidebar - Comprehensive Filters -->
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
                                    <input type="number" placeholder="Min" min="0" value="" id="priceMin">
                                    <span>-</span>
                                    <input type="number" placeholder="Max" min="0" value="" id="priceMax">
                                </div>
                                <div class="yatra-price-slider">
                                    <input type="range" min="0" max="10000" step="100" value="0" class="yatra-range-min" id="priceRangeMin">
                                    <input type="range" min="0" max="10000" step="100" value="10000" class="yatra-range-max" id="priceRangeMax">
                                </div>
                                <div class="yatra-price-display">$0 - $10,000</div>
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
                                    <span class="yatra-filter-count">(8)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="moderate">
                                    <span>Moderate</span>
                                    <span class="yatra-filter-count">(12)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="challenging">
                                    <span>Challenging</span>
                                    <span class="yatra-filter-count">(6)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="strenuous">
                                    <span>Strenuous</span>
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
                                    <span class="yatra-filter-count">(10)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="4.0+">
                                    <div class="yatra-rating-display">
                                        <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span>4.0+ Very Good</span>
                                    </div>
                                    <span class="yatra-filter-count">(18)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="3.5+">
                                    <div class="yatra-rating-display">
                                        <svg width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span>3.5+ Good</span>
                                    </div>
                                    <span class="yatra-filter-count">(22)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Group Size -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="group-size">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                                <span>Group Size</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="private">
                                    <span>Private Tour</span>
                                    <span class="yatra-filter-count">(5)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="small">
                                    <span>Small Group (2-8)</span>
                                    <span class="yatra-filter-count">(14)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="medium">
                                    <span>Medium Group (9-15)</span>
                                    <span class="yatra-filter-count">(8)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="large">
                                    <span>Large Group (16+)</span>
                                    <span class="yatra-filter-count">(4)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Best Season -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="season">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                                </svg>
                                <span>Best Season</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="spring">
                                    <span>Spring (Mar-May)</span>
                                    <span class="yatra-filter-count">(18)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="summer">
                                    <span>Summer (Jun-Aug)</span>
                                    <span class="yatra-filter-count">(10)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="autumn">
                                    <span>Autumn (Sep-Nov)</span>
                                    <span class="yatra-filter-count">(20)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="winter">
                                    <span>Winter (Dec-Feb)</span>
                                    <span class="yatra-filter-count">(6)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Accommodation Type -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="accommodation">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                                <span>Accommodation</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="luxury">
                                    <span>Luxury Hotels</span>
                                    <span class="yatra-filter-count">(6)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="standard">
                                    <span>Standard Hotels</span>
                                    <span class="yatra-filter-count">(12)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="teahouse">
                                    <span>Teahouse/Lodge</span>
                                    <span class="yatra-filter-count">(15)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="camping">
                                    <span>Camping</span>
                                    <span class="yatra-filter-count">(8)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="homestay">
                                    <span>Homestay</span>
                                    <span class="yatra-filter-count">(5)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Included Services -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="services">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span>Included Services</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="meals">
                                    <span>All Meals Included</span>
                                    <span class="yatra-filter-count">(18)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="guide">
                                    <span>Professional Guide</span>
                                    <span class="yatra-filter-count">(24)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="transport">
                                    <span>Airport Transfers</span>
                                    <span class="yatra-filter-count">(20)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="permits">
                                    <span>Permits Included</span>
                                    <span class="yatra-filter-count">(16)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="equipment">
                                    <span>Equipment Provided</span>
                                    <span class="yatra-filter-count">(10)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Special Offers -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="offers">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                                </svg>
                                <span>Special Offers</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="discount">
                                    <span>Discount Available</span>
                                    <span class="yatra-filter-count">(8)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="early-bird">
                                    <span>Early Bird Offer</span>
                                    <span class="yatra-filter-count">(5)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="last-minute">
                                    <span>Last Minute Deal</span>
                                    <span class="yatra-filter-count">(3)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="group-discount">
                                    <span>Group Discount</span>
                                    <span class="yatra-filter-count">(10)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Booking Options -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="booking">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                <span>Booking Options</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="instant">
                                    <span>Instant Confirmation</span>
                                    <span class="yatra-filter-count">(15)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="free-cancel">
                                    <span>Free Cancellation</span>
                                    <span class="yatra-filter-count">(12)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="flexible">
                                    <span>Flexible Dates</span>
                                    <span class="yatra-filter-count">(18)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="pay-later">
                                    <span>Reserve Now, Pay Later</span>
                                    <span class="yatra-filter-count">(8)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Age Suitability -->
                    <div class="yatra-filter-section">
                        <div class="yatra-filter-title" data-toggle="age">
                            <div class="yatra-filter-title-content">
                                <svg class="yatra-filter-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span>Age Suitability</span>
                            </div>
                            <svg class="yatra-filter-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="yatra-filter-content">
                            <div class="yatra-checkbox-group">
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="family">
                                    <span>Family Friendly</span>
                                    <span class="yatra-filter-count">(12)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="kids">
                                    <span>Suitable for Kids</span>
                                    <span class="yatra-filter-count">(8)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="seniors">
                                    <span>Senior Friendly</span>
                                    <span class="yatra-filter-count">(10)</span>
                                </label>
                                <label class="yatra-checkbox-label">
                                    <input type="checkbox" value="adults">
                                    <span>Adults Only</span>
                                    <span class="yatra-filter-count">(6)</span>
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
                                    <a href="<?php echo esc_url(home_url('/trip/' . sanitize_title($trip['title']))); ?>" class="yatra-card-view-btn">View Details</a>
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
