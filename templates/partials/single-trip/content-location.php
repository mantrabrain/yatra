<?php
if (!defined('ABSPATH')) {
    exit;
}

// Location Section
// Expected variables: $trip, $tab, $itinerary_entries
?>
<section class="yatra-trip-section" id="location" itemscope itemtype="https://schema.org/Place">
    <h2 class="yatra-trip-section-title">
        <?php yatra_render_tab_icon($tab->icon ?? null, 'map-pin', 'yatra-trip-section-title-icon', $tab->label ?? 'Location'); ?>
        <?php echo esc_html(isset($tab->label) ? $tab->label : __('Location', 'yatra')); ?>
    </h2>

    <?php 
                // Use starting location coordinates if available
                $map_lat = $trip->getStartingLatitude() ?? null;
                $map_lng = $trip->getStartingLongitude() ?? null;
                
                // Itinerary entries with coordinates are passed from controller (proper MVC pattern)
                // This follows the separation of concerns principle
            ?>
            
            <?php if (!empty($map_lat) && !empty($map_lng)): ?>
                    <div class="yatra-trip-map" id="yatra-trip-map" 
                         data-lat="<?php echo esc_attr($map_lat); ?>"
                         data-lng="<?php echo esc_attr($map_lng); ?>"
                         data-starting-location="<?php echo esc_attr($trip->getStartingLocation() ?? ''); ?>"
                         itemprop="hasMap" itemscope itemtype="https://schema.org/Map"
                         style="position: relative;">
                        <meta itemprop="mapType" content="OpenStreetMap">
                                                                        <div id="yatra-openstreet-map" style="width: 100%; height: 400px; border-radius: 12px; background: white; overflow: hidden;"></div>
                    </div>
                    <div itemprop="geo" itemscope itemtype="https://schema.org/GeoCoordinates">
                        <meta itemprop="latitude" content="<?php echo esc_attr($map_lat); ?>">
                        <meta itemprop="longitude" content="<?php echo esc_attr($map_lng); ?>">
                    </div>
                    
                    <!-- Load Leaflet CSS and JS -->
                    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
                          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
                          crossorigin=""/>
                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" 
                            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" 
                            crossorigin=""></script>
                                        
                    <script>
                    /**
                     * Yatra Trip Map Initialization
                     * Renders interactive map with trip route, markers, and directional arrows
                     * @version 1.0.0
                     */
                    (function() {
                        'use strict';
                        
                        // Wait for DOM and Leaflet to be ready
                        if (typeof L === 'undefined') {
                            console.error('[Yatra Map] Leaflet library not loaded');
                            return;
                        }
                        
                        document.addEventListener('DOMContentLoaded', function() {
                            try {
                                // Initialize map only if the map container exists
                                var mapContainer = document.getElementById('yatra-openstreet-map');
                                if (!mapContainer) {
                                    console.warn('[Yatra Map] Map container not found');
                                    return;
                                }
                                
                                // Parse and validate coordinates
                                var startLat = parseFloat('<?php echo esc_js($trip->getStartingLatitude() ?? '0'); ?>');
                                var startLng = parseFloat('<?php echo esc_js($trip->getStartingLongitude() ?? '0'); ?>');
                                var endLat = parseFloat('<?php echo esc_js($trip->ending_latitude ?? '0'); ?>');
                                var endLng = parseFloat('<?php echo esc_js($trip->ending_longitude ?? '0'); ?>');
                                var startingLocation = '<?php echo esc_js($trip->getStartingLocation() ?? ''); ?>';
                                var endingLocation = '<?php echo esc_js($trip->ending_location ?? ''); ?>';
                                
                                // Validate coordinates
                                if (isNaN(startLat) || isNaN(startLng) || startLat === 0 || startLng === 0) {
                                    console.warn('[Yatra Map] Invalid starting coordinates');
                                    mapContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #64748b;">Map location not available</div>';
                                    return;
                                }
                        
                                // Itinerary activities with coordinates (sanitized)
                                var activities = <?php echo wp_json_encode(array_map(function($entry) {
                                    return [
                                        'id' => absint($entry->id),
                                        'title' => sanitize_text_field($entry->title),
                                        'location' => sanitize_text_field($entry->location ?? ''),
                                        'lat' => floatval($entry->location_latitude),
                                        'lng' => floatval($entry->location_longitude),
                                        'day' => absint($entry->day_number),
                                        'day_title' => sanitize_text_field($entry->day_title ?? ''),
                                        'start_time' => sanitize_text_field($entry->start_time ?? ''),
                                        'end_time' => sanitize_text_field($entry->end_time ?? ''),
                                        'description' => wp_kses_post($entry->description ?? '')
                                    ];
                                }, $itinerary_entries ?? []), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
                                
                                // Validate activities data
                                if (!Array.isArray(activities)) {
                                    console.warn('[Yatra Map] Invalid activities data');
                                    activities = [];
                                }
                        
                                // Calculate center point for better map view
                                var centerLat = (startLat + endLat) / 2;
                                var centerLng = (startLng + endLng) / 2;
                                var mapLat = startLat || centerLat;
                                var mapLng = startLng || centerLng;
                                
                                // Initialize map with controls and error handling
                                var map = L.map('yatra-openstreet-map', {
                                    center: [startLat || 0, startLng || 0],
                                    zoom: 13,
                                    zoomControl: true,
                                    scrollWheelZoom: true,
                                    doubleClickZoom: true,
                                    touchZoom: true,
                                    dragging: true,
                                    tap: true,
                                    maxZoom: 19,
                                    minZoom: 2
                                });
                        
                        // Add scale control
                        L.control.scale().addTo(map);
                        
                        // Add attribution control
                        map.attributionControl.setPrefix('');
                        
                                // Add OpenStreetMap tiles with error handling
                                var tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                                    maxZoom: 19,
                                    minZoom: 2,
                                    errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                                    crossOrigin: true
                                });
                                
                                tileLayer.on('tileerror', function(error) {
                                    console.warn('[Yatra Map] Tile loading error:', error);
                                });
                                
                                tileLayer.addTo(map);
                        
                        // Create custom icons with SVG
                        var startIcon = L.divIcon({
                            html: '<div style="background: linear-gradient(135deg, #10b981, #059669); color: white; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><svg style="transform: rotate(45deg); width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>',
                            iconSize: [30, 30],
                            iconAnchor: [15, 30],
                            popupAnchor: [0, -30],
                            className: 'yatra-start-marker'
                        });
                        
                        var endIcon = L.divIcon({
                            html: '<div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><svg style="transform: rotate(45deg); width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>',
                            iconSize: [30, 30],
                            iconAnchor: [15, 30],
                            popupAnchor: [0, -30],
                            className: 'yatra-end-marker'
                        });
                        
                        // Activity marker icon
                        var activityIcon = L.divIcon({
                            html: '<div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><svg width="12px" height="12px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>',
                            iconSize: [26, 26],
                            iconAnchor: [13, 26],
                            popupAnchor: [0, -26],
                            className: 'yatra-activity-marker'
                        });
                        
                        var markers = [];
                        var routeCoordinates = [];
                        
                                // Helper function to escape HTML
                                function escapeHtml(text) {
                                    var div = document.createElement('div');
                                    div.textContent = text;
                                    return div.innerHTML;
                                }
                                
                                // Helper function to truncate text
                                function truncateText(text, maxLength) {
                                    if (!text) return '';
                                    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
                                }
                                
                                // Add marker for starting location
                                if (startLat && startLng && !isNaN(startLat) && !isNaN(startLng)) {
                            var startMarker = L.marker([startLat, startLng], { icon: startIcon }).addTo(map);
                            var startPopupContent = '<div class="yatra-popup-content">' +
                                '<div class="yatra-popup-header">' +
                                    '<div class="yatra-popup-icon-start">' +
                                        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>' +
                                    '</div>' +
                                    '<div class="yatra-popup-title-section">' +
                                        '<h4 class="yatra-popup-title">' + (startingLocation || 'Trip Starting Point') + '</h4>' +
                                        '<span class="yatra-popup-badge yatra-badge-start">Starting Point</span>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="yatra-popup-body">' +
                                    '<div class="yatra-popup-info">' +
                                        '<div class="yatra-popup-info-item">' +
                                            '<span class="yatra-popup-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Location:</span>' +
                                            '<span class="yatra-popup-value">' + (startingLocation || 'Trip Start') + '</span>' +
                                        '</div>' +
                                        '<div class="yatra-popup-info-item">' +
                                            '<span class="yatra-popup-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>Coordinates:</span>' +
                                            '<span class="yatra-popup-value">' + startLat.toFixed(6) + ', ' + startLng.toFixed(6) + '</span>' +
                                        '</div>' +
                                        '<div class="yatra-popup-info-item">' +
                                            '<span class="yatra-popup-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><polygon points="1 6 1 22 8 18 16 22 16 6"/><polyline points="8 18 8 12 16 12"/></svg>Map:</span>' +
                                            '<a href="https://www.openstreetmap.org/?mlat=' + startLat + '&mlon=' + startLng + '#map=15/' + startLat + '/' + startLng + '" target="_blank" class="yatra-popup-link">View on OpenStreetMap ↗</a>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                                '</div>';
                            startMarker.bindPopup(startPopupContent, {
                                maxWidth: 300,
                                className: 'yatra-custom-popup'
                            });
                            
                            // Add tooltip that shows on hover
                            var startTooltip = startingLocation ? startingLocation : 'Trip Starting Point';
                            startMarker.bindTooltip(startTooltip, {
                                permanent: false,
                                direction: 'top',
                                className: 'yatra-marker-tooltip',
                                offset: [0, -35]
                            });
                            
                            markers.push(startMarker);
                            routeCoordinates.push([startLat, startLng]);
                        }
                        
                                // Add markers for all itinerary activities with validation
                                activities.forEach(function(activity, index) {
                                    if (!activity || typeof activity !== 'object') {
                                        console.warn('[Yatra Map] Invalid activity data at index:', index);
                                        return;
                                    }
                                    
                                    if (activity.lat && activity.lng && !isNaN(activity.lat) && !isNaN(activity.lng)) {
                                var activityMarker = L.marker([activity.lat, activity.lng], { icon: activityIcon }).addTo(map);
                                
                                // Create comprehensive activity popup content
                                var activityPopupContent = '<div class="yatra-popup-content">' +
                                    '<div class="yatra-popup-header">' +
                                        '<div class="yatra-popup-icon-activity">' +
                                            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
                                        '</div>' +
                                        '<div class="yatra-popup-title-section">' +
                                            '<h4 class="yatra-popup-title">' + activity.title + '</h4>' +
                                            '<div class="yatra-popup-badges">' +
                                                '<span class="yatra-popup-badge yatra-badge-activity">Day ' + activity.day + '</span>' +
                                                (activity.day_title ? '<span class="yatra-popup-day-title">' + activity.day_title + '</span>' : '') +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="yatra-popup-body">' +
                                        '<div class="yatra-popup-info">' +
                                            (activity.location ? '<div class="yatra-popup-info-item">' +
                                                '<span class="yatra-popup-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Location:</span>' +
                                                '<span class="yatra-popup-value">' + activity.location + '</span>' +
                                            '</div>' : '') +
                                            (activity.start_time && activity.end_time ? '<div class="yatra-popup-info-item">' +
                                                '<span class="yatra-popup-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Time:</span>' +
                                                '<span class="yatra-popup-value">' + activity.start_time + ' - ' + activity.end_time + '</span>' +
                                            '</div>' : '') +
                                            '<div class="yatra-popup-info-item">' +
                                                '<span class="yatra-popup-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>Coordinates:</span>' +
                                                '<span class="yatra-popup-value">' + activity.lat.toFixed(6) + ', ' + activity.lng.toFixed(6) + '</span>' +
                                            '</div>' +
                                            '<div class="yatra-popup-info-item">' +
                                                '<span class="yatra-popup-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><polygon points="1 6 1 22 8 18 16 22 16 6"/><polyline points="8 18 8 12 16 12"/></svg>Map:</span>' +
                                                '<a href="https://www.openstreetmap.org/?mlat=' + activity.lat + '&mlon=' + activity.lng + '#map=15/' + activity.lat + '/' + activity.lng + '" target="_blank" class="yatra-popup-link">View on OpenStreetMap ↗</a>' +
                                            '</div>' +
                                        '</div>' +
                                        (activity.description ? '<div class="yatra-popup-description">' +
                                            '<div class="yatra-popup-desc-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>Description</div>' +
                                            '<div class="yatra-popup-desc-text">' + 
                                                (activity.description.length > 150 ? activity.description.substring(0, 150) + '...' : activity.description) +
                                            '</div>' +
                                        '</div>' : '') +
                                    '</div>' +
                                    '</div>';
                                
                                activityMarker.bindPopup(activityPopupContent, {
                                    maxWidth: 320,
                                    className: 'yatra-custom-popup'
                                });
                                
                                // Add tooltip that shows on hover
                                var activityTooltip = '<strong>' + activity.title + '</strong>';
                                if (activity.location) {
                                    activityTooltip += '<br><small>' + activity.location + '</small>';
                                }
                                activityMarker.bindTooltip(activityTooltip, {
                                    permanent: false,
                                    direction: 'top',
                                    className: 'yatra-marker-tooltip',
                                    offset: [0, -32]
                                });
                                
                                markers.push(activityMarker);
                                routeCoordinates.push([activity.lat, activity.lng]);
                            }
                        });
                        
                                // Add marker for ending location
                                if (endLat && endLng && !isNaN(endLat) && !isNaN(endLng)) {
                            var endMarker = L.marker([endLat, endLng], { icon: endIcon }).addTo(map);
                            var endPopupContent = '<div class="yatra-popup-content">' +
                                '<div class="yatra-popup-header">' +
                                    '<div class="yatra-popup-icon-end">' +
                                        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' +
                                    '</div>' +
                                    '<div class="yatra-popup-title-section">' +
                                        '<h4 class="yatra-popup-title">' + (endingLocation || 'Trip Ending Point') + '</h4>' +
                                        '<span class="yatra-popup-badge yatra-badge-end">Ending Point</span>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="yatra-popup-body">' +
                                    '<div class="yatra-popup-info">' +
                                        '<div class="yatra-popup-info-item">' +
                                            '<span class="yatra-popup-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Location:</span>' +
                                            '<span class="yatra-popup-value">' + (endingLocation || 'Trip End') + '</span>' +
                                        '</div>' +
                                        '<div class="yatra-popup-info-item">' +
                                            '<span class="yatra-popup-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>Coordinates:</span>' +
                                            '<span class="yatra-popup-value">' + endLat.toFixed(6) + ', ' + endLng.toFixed(6) + '</span>' +
                                        '</div>' +
                                        '<div class="yatra-popup-info-item">' +
                                            '<span class="yatra-popup-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><polygon points="1 6 1 22 8 18 16 22 16 6"/><polyline points="8 18 8 12 16 12"/></svg>Map:</span>' +
                                            '<a href="https://www.openstreetmap.org/?mlat=' + endLat + '&mlon=' + endLng + '#map=15/' + endLat + '/' + endLng + '" target="_blank" class="yatra-popup-link">View on OpenStreetMap ↗</a>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                                '</div>';
                            endMarker.bindPopup(endPopupContent, {
                                maxWidth: 300,
                                className: 'yatra-custom-popup'
                            });
                            
                            // Add tooltip that shows on hover
                            var endTooltip = endingLocation ? endingLocation : 'Trip Ending Point';
                            endMarker.bindTooltip(endTooltip, {
                                permanent: false,
                                direction: 'top',
                                className: 'yatra-marker-tooltip',
                                offset: [0, -35]
                            });
                            
                            markers.push(endMarker);
                            routeCoordinates.push([endLat, endLng]);
                        }
                        
                                // Draw complete travel route connecting all locations
                                if (routeCoordinates.length >= 2) {
                                    // Route is ready for visualization
                            
                            // Main route line with better visibility
                            var routeLine = L.polyline(routeCoordinates, {
                                color: '#3b82f6',
                                weight: 5,
                                opacity: 0.8,
                                smoothFactor: 1,
                                lineCap: 'round',
                                lineJoin: 'round'
                            }).addTo(map);
                            
                            // Add animated dashed overlay for travel effect
                            var dashedLine = L.polyline(routeCoordinates, {
                                color: '#60a5fa',
                                weight: 3,
                                opacity: 0.9,
                                dashArray: '10, 15',
                                dashOffset: '0',
                                className: 'animated-route'
                            }).addTo(map);
                            
                                    // Add directional arrows to show travel direction with distance-based distribution
                                    for (var i = 0; i < routeCoordinates.length - 1; i++) {
                                var start = routeCoordinates[i];
                                var end = routeCoordinates[i + 1];
                                
                                // Calculate distance between points (simplified haversine formula)
                                var deltaLat = end[0] - start[0];
                                var deltaLng = end[1] - start[1];
                                var distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng) * 111000; // Approximate distance in meters
                                
                                // Determine number of arrows based on distance (reduced for cleaner look)
                                var arrowCount;
                                if (distance < 1000) {
                                    arrowCount = 1; // Short distance: 1 arrow
                                } else if (distance < 3000) {
                                    arrowCount = 1; // Medium distance: still 1 arrow
                                } else if (distance < 8000) {
                                    arrowCount = 2; // Long distance: 2 arrows
                                } else {
                                    arrowCount = 2; // Very long distance: max 2 arrows
                                }
                                
                                // Place arrows evenly along the segment
                                for (var j = 0; j < arrowCount; j++) {
                                    var fraction = (j + 1) / (arrowCount + 1); // Even distribution
                                    var pointLat = start[0] + deltaLat * fraction;
                                    var pointLng = start[1] + deltaLng * fraction;
                                    
                                    // Calculate angle for arrow direction
                                    var angleRad = Math.atan2(deltaLng, deltaLat);
                                    var angleDeg = angleRad * 180 / Math.PI;
                                    
                                    var arrowIcon = L.divIcon({
                                        html: '<div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
                                              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(' + angleDeg + 'deg);"><polyline points="18 15 12 9 6 15"/></svg>' +
                                              '</div>',
                                        iconSize: [32, 32],
                                        iconAnchor: [16, 16],
                                        className: 'yatra-route-arrow'
                                    });
                                    
                                    var arrowMarker = L.marker([pointLat, pointLng], { icon: arrowIcon }).addTo(map);
                                }
                            }
                            
                            // Fit map to show all markers with padding
                            var group = new L.featureGroup(markers);
                            map.fitBounds(group.getBounds().pad(0.15));
                        } else if (markers.length > 0) {
                            // If only one marker, center on it
                            if (markers.length === 1) {
                                markers[0].openPopup();
                            } else {
                                // Fit to show all markers
                                var group = new L.featureGroup(markers);
                                map.fitBounds(group.getBounds().pad(0.15));
                            }
                        }
                        
                                // Markers are now properly added and persistent
                                
                                // Add CSS animation for route only
                                var style = document.createElement('style');
                        style.textContent = `
                            @keyframes dash {
                                to {
                                    stroke-dashoffset: -100;
                                }
                            }
                            .yatra-custom-marker, .yatra-start-marker, .yatra-end-marker, .yatra-activity-marker {
                                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                                transition: all 0.3s ease;
                            }
                            .yatra-custom-marker:hover, .yatra-start-marker:hover, .yatra-end-marker:hover, .yatra-activity-marker:hover {
                                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
                                transform: scale(1.1);
                            }
                            .animated-route {
                                animation: dash 30s linear infinite;
                            }
                            .yatra-route-arrow {
                                transition: all 0.3s ease;
                                z-index: 600 !important;
                            }
                            .yatra-route-arrow:hover {
                                transform: scale(1.2);
                                filter: brightness(1.2);
                            }
                        `;
                                document.head.appendChild(style);
                                
                            } catch (error) {
                                console.error('[Yatra Map] Initialization error:', error);
                                if (mapContainer) {
                                    mapContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #ef4444;">Map failed to load. Please refresh the page.</div>';
                                }
                            }
                        });
                    })();
                    </script>
                <?php else: ?>
                    <div class="yatra-trip-map yatra-map-placeholder">
                        <p><?php echo esc_html__('Map location not available', 'yatra'); ?></p>
                    </div>
                <?php endif; ?>

    <?php if (!empty($trip->starting_location) || !empty($trip->ending_location) || !empty($trip->landmarks) || (!empty($trip->starting_latitude) && !empty($trip->starting_longitude)) || (!empty($trip->ending_latitude) && !empty($trip->ending_longitude))): ?>
        <div class="yatra-location-details" style="margin-top: 24px;">
            <div class="yatra-location-grid">
                <?php if (!empty($trip->starting_location)): ?>
                    <div class="yatra-location-item">
                        <div class="yatra-location-icon">
                            <?php echo yatra_svg_icon('play', 'yatra-location-item-icon'); ?>
                        </div>
                        <div class="yatra-location-content">
                            <div class="yatra-location-label"><?php echo esc_html__('Starting Point', 'yatra'); ?></div>
                            <div class="yatra-location-value">
                                <?php if (!empty($trip->starting_latitude) && !empty($trip->starting_longitude)): ?>
                                    <a href="https://www.openstreetmap.org/?mlat=<?php echo esc_attr($trip->starting_latitude); ?>&mlon=<?php echo esc_attr($trip->starting_longitude); ?>#map=15/<?php echo esc_attr($trip->starting_latitude); ?>/<?php echo esc_attr($trip->starting_longitude); ?>" 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       class="yatra-coordinates-link">
                                        <?php echo esc_html($trip->starting_location); ?>
                                        
                                    </a>
                                <?php else: ?>
                                    <?php echo esc_html($trip->starting_location); ?>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($trip->ending_location)): ?>
                    <div class="yatra-location-item">
                        <div class="yatra-location-icon">
                            <?php echo yatra_svg_icon('check', 'yatra-location-item-icon'); ?>
                        </div>
                        <div class="yatra-location-content">
                            <div class="yatra-location-label"><?php echo esc_html__('Ending Point', 'yatra'); ?></div>
                            <div class="yatra-location-value">
                                <?php if (!empty($trip->ending_latitude) && !empty($trip->ending_longitude)): ?>
                                    <a href="https://www.openstreetmap.org/?mlat=<?php echo esc_attr($trip->ending_latitude); ?>&mlon=<?php echo esc_attr($trip->ending_longitude); ?>#map=15/<?php echo esc_attr($trip->ending_latitude); ?>/<?php echo esc_attr($trip->ending_longitude); ?>" 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       class="yatra-coordinates-link">
                                        <?php echo esc_html($trip->ending_location); ?>
                                    </a>
                                <?php else: ?>
                                    <?php echo esc_html($trip->ending_location); ?>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($trip->landmarks) && is_array($trip->landmarks)): ?>
                    <div class="yatra-location-item yatra-location-item-landmarks">
                        <div class="yatra-location-icon">
                            <?php echo yatra_svg_icon('map-pin', 'yatra-location-item-icon'); ?>
                        </div>
                        <div class="yatra-location-content">
                            <div class="yatra-location-label"><?php echo esc_html__('Key Landmarks', 'yatra'); ?></div>
                            <div class="yatra-location-value">
                                <div class="yatra-landmarks-list">
                                    <?php foreach ($trip->landmarks as $index => $landmark): ?>
                                        <span class="yatra-landmark-tag">
                                            <?php echo yatra_svg_icon('map-pin', 'yatra-landmark-icon'); ?>
                                            <?php echo esc_html($landmark); ?>
                                        </span>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        
        <style>
        /* Enhanced popup styling */
        .yatra-custom-popup {
            font-family: system-ui, -apple-system, sans-serif !important;
        }
        
        .yatra-popup-content {
            min-width: 280px;
            max-width: 320px;
        }
        
        .yatra-popup-header {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding-bottom: 12px;
            border-bottom: 2px solid #e2e8f0;
            margin-bottom: 12px;
        }
        
        .yatra-popup-icon-start,
        .yatra-popup-icon-activity,
        .yatra-popup-icon-end {
            font-size: 24px;
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }
        
        .yatra-popup-icon-start {
            background: linear-gradient(135deg, #10b981, #059669);
        }
        
        .yatra-popup-icon-activity {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        
        .yatra-popup-icon-end {
            background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        
        .yatra-popup-title-section {
            flex: 1;
        }
        
        .yatra-popup-title {
            margin: 0 0 6px 0;
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            line-height: 1.2;
        }
        
        .yatra-popup-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            align-items: center;
        }
        
        .yatra-popup-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .yatra-badge-start {
            background: #dcfce7;
            color: #166534;
        }
        
        .yatra-badge-activity {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .yatra-badge-end {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .yatra-popup-day-title {
            color: #64748b;
            font-size: 12px;
            font-style: italic;
        }
        
        .yatra-popup-body {
            
        }
        
        .yatra-popup-info {
            margin-bottom: 12px;
        }
        
        .yatra-popup-info-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
            gap: 8px;
        }
        
        .yatra-popup-label {
            color: #64748b;
            font-size: 12px;
            font-weight: 500;
            flex-shrink: 0;
            min-width: 80px;
        }
        
        .yatra-popup-value {
            color: #1e293b;
            font-size: 12px;
            font-weight: 500;
            text-align: right;
            flex: 1;
        }
        
        .yatra-popup-link {
            color: #3b82f6 !important;
            text-decoration: none !important;
            font-size: 11px !important;
            font-weight: 500 !important;
            transition: color 0.2s ease !important;
        }
        
        .yatra-popup-link:hover {
            color: #2563eb !important;
            text-decoration: underline !important;
        }
        
        .yatra-popup-description {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
        }
        
        .yatra-popup-desc-title {
            color: #475569;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 6px;
        }
        
        .yatra-popup-desc-text {
            color: #64748b;
            font-size: 12px;
            line-height: 1.4;
        }
        
        /* Tooltip styling */
        .yatra-marker-tooltip {
            background: rgba(30, 41, 59, 0.95) !important;
            border: none !important;
            border-radius: 8px !important;
            padding: 8px 12px !important;
            font-family: system-ui, -apple-system, sans-serif !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            color: white !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
            backdrop-filter: blur(10px) !important;
        }
        
        .yatra-marker-tooltip::before {
            border-top-color: rgba(30, 41, 59, 0.95) !important;
        }
        
        .leaflet-tooltip-top.yatra-marker-tooltip::before {
            border-top-color: rgba(30, 41, 59, 0.95) !important;
        }
        
        .yatra-marker-tooltip strong {
            color: white !important;
            font-weight: 600 !important;
        }
        
        .yatra-marker-tooltip small {
            color: #cbd5e1 !important;
            font-size: 11px !important;
        }
        
                        
        .yatra-location-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
            margin-top: 24px;
        }
        
        .yatra-location-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            transition: all 0.3s ease;
        }
        
        .yatra-location-item:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
            transform: translateY(-2px);
        }
        
        .yatra-location-item-landmarks {
            grid-column: 1 / -1;
        }
        
        .yatra-location-icon {
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }
        
        .yatra-location-item-icon {
            width: 20px;
            height: 20px;
        }
        
        .yatra-location-content {
            flex: 1;
        }
        
        .yatra-location-label {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        
        .yatra-location-value {
            font-size: 14px;
            color: #1e293b;
            font-weight: 500;
        }
        
        .yatra-coordinates-link {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #3b82f6;
            text-decoration: none;
            transition: color 0.2s ease;
        }
        
        .yatra-coordinates-link:hover {
            color: #2563eb;
            text-decoration: underline;
        }
        
        .yatra-external-link-icon {
            font-size: 12px;
            opacity: 0.7;
        }
        
        .yatra-landmarks-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .yatra-landmark-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            color: #0369a1;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .yatra-landmark-tag:hover {
            background: linear-gradient(135deg, #e0f2fe, #bae6fd);
            border-color: #7dd3fc;
        }
        
        .yatra-landmark-icon {
            width: 12px;
            height: 12px;
        }
        
                </style>
    <?php endif; ?>
</section>