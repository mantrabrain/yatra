<?php
/**
 * Trip View
 * 
 * @package Yatra
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get trip data from the controller
$trip = $trip ?? null;

// If no trip is provided, show error message
if (!$trip) {
    echo '<div class="yatra-error-message">Trip not found or invalid trip ID.</div>';
    return;
}
?>

<div class="yatra-trip-view">
    <div class="yatra-page-header">
        <div class="yatra-page-header-left">
            <h2><?php echo esc_html($trip->title ?? 'Trip Not Found'); ?></h2>
            <p>Trip Details</p>
        </div>
        <div class="yatra-page-header-right">
            <a href="?page=yatra-app&subpage=trips&action=edit&id=<?php echo $trip->id ?? ''; ?>" class="yatra-btn yatra-btn-primary">Edit Trip</a>
            <a href="?page=yatra-app&subpage=trips" class="yatra-btn yatra-btn-secondary">← Back to Trips</a>
        </div>
    </div>

    <div class="yatra-content-card">
        <div class="yatra-trip-details">
            <!-- Trip Image -->
            <?php if ($trip->featured_image): ?>
                <div class="yatra-trip-image">
                    <img src="<?php echo esc_url($trip->featured_image); ?>" alt="<?php echo esc_attr($trip->title); ?>">
                </div>
            <?php endif; ?>

            <!-- Trip Info -->
            <div class="yatra-trip-info">
                <div class="yatra-trip-meta">
                    <span class="yatra-trip-destination">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <?php echo esc_html($trip->destination); ?>
                    </span>
                    <?php if ($trip->duration): ?>
                        <span class="yatra-trip-duration">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 8V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <?php echo esc_html($trip->duration . ' ' . ($trip->duration_type ?: 'days')); ?>
                        </span>
                    <?php endif; ?>
                    <span class="yatra-trip-status yatra-status-<?php echo esc_attr($trip->status); ?>"><?php echo esc_html(ucfirst($trip->status)); ?></span>
                    <?php if ($trip->featured): ?>
                        <span class="yatra-trip-featured">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Featured
                        </span>
                    <?php endif; ?>
                </div>

                <?php if ($trip->short_description): ?>
                    <div class="yatra-trip-summary">
                        <p><?php echo esc_html($trip->short_description); ?></p>
                    </div>
                <?php endif; ?>

                <?php if ($trip->description): ?>
                    <div class="yatra-trip-section">
                        <h3>Description</h3>
                        <div class="yatra-trip-content">
                            <?php echo wp_kses_post($trip->description ?: 'No description available'); ?>
                        </div>
                    </div>
                <?php endif; ?>

                <?php if ($trip->primary_destination || $trip->secondary_destinations || $trip->cities_visited || $trip->starting_point || $trip->ending_point || $trip->highlights): ?>
                <div class="yatra-trip-section">
                    <h3>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Destinations & Locations
                    </h3>
                    <div class="yatra-destinations-grid">
                        <?php if ($trip->primary_destination): ?>
                        <div class="yatra-destination-item">
                            <strong>Primary Destination:</strong> <?php echo esc_html($trip->primary_destination); ?>
                        </div>
                        <?php endif; ?>
                        
                        <?php if ($trip->secondary_destinations): ?>
                        <div class="yatra-destination-item">
                            <strong>Secondary Destinations:</strong>
                            <div class="yatra-destination-list">
                                <?php 
                                $secondary_destinations = is_string($trip->secondary_destinations) ? explode("\n", $trip->secondary_destinations) : $trip->secondary_destinations;
                                if (is_array($secondary_destinations)):
                                    foreach ($secondary_destinations as $dest): ?>
                                        <span class="yatra-destination-tag"><?php echo esc_html(trim($dest)); ?></span>
                                    <?php endforeach;
                                endif; ?>
                            </div>
                        </div>
                        <?php endif; ?>
                        
                        <?php if ($trip->cities_visited): ?>
                        <div class="yatra-destination-item">
                            <strong>Cities/Locations Visited:</strong>
                            <div class="yatra-destination-list">
                                <?php 
                                $cities = is_string($trip->cities_visited) ? explode("\n", $trip->cities_visited) : $trip->cities_visited;
                                if (is_array($cities)):
                                    foreach ($cities as $city): ?>
                                        <span class="yatra-destination-tag"><?php echo esc_html(trim($city)); ?></span>
                                    <?php endforeach;
                                endif; ?>
                            </div>
                        </div>
                        <?php endif; ?>
                        
                        <?php if ($trip->starting_point): ?>
                        <div class="yatra-destination-item">
                            <strong>Starting Point:</strong> <?php echo esc_html($trip->starting_point); ?>
                        </div>
                        <?php endif; ?>
                        
                        <?php if ($trip->ending_point): ?>
                        <div class="yatra-destination-item">
                            <strong>Ending Point:</strong> <?php echo esc_html($trip->ending_point); ?>
                        </div>
                        <?php endif; ?>
                        
                        <?php if ($trip->highlights): ?>
                        <div class="yatra-destination-item">
                            <strong>Destination Highlights:</strong>
                            <div class="yatra-highlights-list">
                                <?php 
                                $highlights = is_string($trip->highlights) ? explode("\n", $trip->highlights) : $trip->highlights;
                                if (is_array($highlights)):
                                    foreach ($highlights as $highlight): ?>
                                        <div class="yatra-highlight-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                            <?php echo esc_html(trim($highlight)); ?>
                                        </div>
                                    <?php endforeach;
                                endif; ?>
                            </div>
                        </div>
                        <?php endif; ?>
                        
                        <?php if ($trip->time_zones): ?>
                        <div class="yatra-destination-item">
                            <strong>Time Zones:</strong> <?php echo esc_html($trip->time_zones); ?>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endif; ?>

                <?php if ($trip->itinerary): ?>
                <div class="yatra-trip-section">
                    <h3>Itinerary</h3>
                    <div class="yatra-itinerary-display">
                        <?php 
                        $itinerary = is_string($trip->itinerary) ? json_decode($trip->itinerary, true) : $trip->itinerary;
                        if (is_array($itinerary)): 
                            foreach ($itinerary as $day): ?>
                            <div class="yatra-itinerary-day-display">
                                <div class="yatra-itinerary-day-header-display">
                                    <h4>Day <?php echo esc_html($day['day']); ?></h4>
                                    <?php if (!empty($day['location'])): ?>
                                    <span class="yatra-itinerary-location">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <?php echo esc_html($day['location']); ?>
                                    </span>
                                    <?php endif; ?>
                                </div>
                                <div class="yatra-itinerary-day-content-display">
                                    <?php if (!empty($day['title'])): ?>
                                    <div class="yatra-itinerary-item">
                                        <strong>Title:</strong> <?php echo esc_html($day['title']); ?>
                                    </div>
                                    <?php endif; ?>
                                    
                                    <?php if (!empty($day['activities'])): ?>
                                    <div class="yatra-itinerary-item">
                                        <strong>Activities:</strong> <?php echo esc_html($day['activities']); ?>
                                    </div>
                                    <?php endif; ?>
                                    
                                    <?php if (!empty($day['accommodation'])): ?>
                                    <div class="yatra-itinerary-item">
                                        <strong>Accommodation:</strong> <?php echo esc_html($day['accommodation']); ?>
                                    </div>
                                    <?php endif; ?>
                                    
                                    <?php if (!empty($day['meals'])): ?>
                                    <div class="yatra-itinerary-item">
                                        <strong>Meals:</strong> <?php echo esc_html(ucfirst(str_replace('_', ' ', $day['meals']))); ?>
                                    </div>
                                    <?php endif; ?>
                                    
                                    <?php if (!empty($day['transportation'])): ?>
                                    <div class="yatra-itinerary-item">
                                        <strong>Transportation:</strong> <?php echo esc_html($day['transportation']); ?>
                                    </div>
                                    <?php endif; ?>
                                    
                                    <?php if (!empty($day['notes'])): ?>
                                    <div class="yatra-itinerary-item">
                                        <strong>Notes:</strong> <?php echo esc_html($day['notes']); ?>
                                    </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <?php endforeach; 
                        endif; ?>
                    </div>
                </div>
                <?php endif; ?>

                <?php if ($trip->included_services || $trip->excluded_services): ?>
                <div class="yatra-trip-section">
                    <h3>Services</h3>
                    <div class="yatra-services-grid">
                        <?php if ($trip->included_services): ?>
                        <div class="yatra-services-item">
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Included Services
                            </h4>
                            <div class="yatra-services-content">
                                <?php echo nl2br(esc_html($trip->included_services)); ?>
                            </div>
                        </div>
                        <?php endif; ?>
                        
                        <?php if ($trip->excluded_services): ?>
                        <div class="yatra-services-item">
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Excluded Services
                            </h4>
                            <div class="yatra-services-content">
                                <?php echo nl2br(esc_html($trip->excluded_services)); ?>
                            </div>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endif; ?>

                <?php if ($trip->difficulty_level || $trip->age_requirement || $trip->physical_requirement): ?>
                <div class="yatra-trip-section">
                    <h3>Requirements</h3>
                    <div class="yatra-requirements-grid">
                        <?php if ($trip->difficulty_level): ?>
                        <div class="yatra-requirement-item">
                            <strong>Difficulty Level:</strong> 
                            <span class="yatra-badge yatra-badge-<?php echo esc_attr($trip->difficulty_level); ?>">
                                <?php echo esc_html(ucfirst($trip->difficulty_level)); ?>
                            </span>
                        </div>
                        <?php endif; ?>
                        
                        <?php if ($trip->age_requirement): ?>
                        <div class="yatra-requirement-item">
                            <strong>Age Requirement:</strong> <?php echo esc_html($trip->age_requirement); ?>
                        </div>
                        <?php endif; ?>
                        
                        <?php if ($trip->physical_requirement): ?>
                        <div class="yatra-requirement-item">
                            <strong>Physical Requirements:</strong> <?php echo esc_html($trip->physical_requirement); ?>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endif; ?>

                <?php if ($trip->cancellation_policy): ?>
                <div class="yatra-trip-section">
                    <h3>Cancellation Policy</h3>
                    <div class="yatra-trip-content">
                        <?php echo nl2br(esc_html($trip->cancellation_policy)); ?>
                    </div>
                </div>
                <?php endif; ?>

                <?php if ($trip->terms_conditions): ?>
                <div class="yatra-trip-section">
                    <h3>Terms & Conditions</h3>
                    <div class="yatra-trip-content">
                        <?php echo nl2br(esc_html($trip->terms_conditions)); ?>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div> 