<?php
if (!defined('ABSPATH')) {
    exit;
}

// Gallery Modal for Single Trip Page
// Expected variables: $trip
?>
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
