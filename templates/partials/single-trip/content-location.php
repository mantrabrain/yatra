<?php
if (!defined('ABSPATH')) {
    exit;
} ?>
<section class="yatra-trip-section" id="location" itemscope itemtype="https://schema.org/Place">
    <h2 class="yatra-trip-section-title">
        <?php yatra_render_tab_icon($tab->icon ?? null, 'map-pin', 'yatra-trip-section-title-icon', $tab->label ?? 'Location'); ?>
        <?php echo esc_html(isset($tab->label) ? $tab->label : __('Location', 'yatra')); ?>
    </h2>

    <?php 
                // Use starting location coordinates if available
                $map_lat = $trip->starting_latitude ?? null;
                $map_lng = $trip->starting_longitude ?? null;
            ?>
            
            <?php if (!empty($map_lat) && !empty($map_lng)): ?>
                    <div class="yatra-trip-map" id="yatra-trip-map" 
                         data-lat="<?php echo esc_attr($map_lat); ?>"
                         data-lng="<?php echo esc_attr($map_lng); ?>"
                         data-starting-location="<?php echo esc_attr($trip->starting_location ?? ''); ?>"
                         itemprop="hasMap" itemscope itemtype="https://schema.org/Map">
                        <meta itemprop="mapType" content="OpenStreetMap">
                        <div id="yatra-openstreet-map" style="width: 100%; height: 400px; border-radius: 12px;"></div>
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
                    document.addEventListener('DOMContentLoaded', function() {
                        // Initialize map only if the map container exists
                        var mapContainer = document.getElementById('yatra-openstreet-map');
                        if (!mapContainer) return;
                        
                        var startLat = parseFloat('<?php echo esc_js($trip->starting_latitude ?? '0'); ?>');
                        var startLng = parseFloat('<?php echo esc_js($trip->starting_longitude ?? '0'); ?>');
                        var endLat = parseFloat('<?php echo esc_js($trip->ending_latitude ?? '0'); ?>');
                        var endLng = parseFloat('<?php echo esc_js($trip->ending_longitude ?? '0'); ?>');
                        var startingLocation = '<?php echo esc_js($trip->starting_location ?? ''); ?>';
                        var endingLocation = '<?php echo esc_js($trip->ending_location ?? ''); ?>';
                        
                        // Calculate center point for better map view
                        var centerLat = (startLat + endLat) / 2;
                        var centerLng = (startLng + endLng) / 2;
                        var mapLat = startLat || centerLat;
                        var mapLng = startLng || centerLng;
                        
                        // Initialize the map
                        var map = L.map('yatra-openstreet-map').setView([mapLat, mapLng], 10);
                        
                        // Add OpenStreetMap tiles
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                            maxZoom: 19
                        }).addTo(map);
                        
                        // Create custom icons
                        var startIcon = L.divIcon({
                            html: '<div style="background: linear-gradient(135deg, #10b981, #059669); color: white; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><span style="transform: rotate(45deg); font-size: 16px;">▶</span></div>',
                            iconSize: [32, 32],
                            iconAnchor: [16, 32],
                            popupAnchor: [0, -32],
                            className: 'yatra-start-marker'
                        });
                        
                        var endIcon = L.divIcon({
                            html: '<div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><span style="transform: rotate(45deg); font-size: 16px;">🏁</span></div>',
                            iconSize: [32, 32],
                            iconAnchor: [16, 32],
                            popupAnchor: [0, -32],
                            className: 'yatra-end-marker'
                        });
                        
                        var markers = [];
                        
                        // Add marker for starting location
                        if (startLat && startLng) {
                            var startMarker = L.marker([startLat, startLng], { icon: startIcon }).addTo(map);
                            var startPopupContent = startingLocation ? 
                                '<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 14px;"><strong style="color: #1e293b;">' + startingLocation + '</strong><br><span style="color: #10b981; font-size: 12px; font-weight: 600;">Starting Point</span><br><span style="color: #64748b; font-size: 11px;">' + startLat.toFixed(6) + ', ' + startLng.toFixed(6) + '</span></div>' :
                                '<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 14px;"><strong style="color: #1e293b;">Trip Starting Location</strong><br><span style="color: #10b981; font-size: 12px; font-weight: 600;">Starting Point</span><br><span style="color: #64748b; font-size: 11px;">' + startLat.toFixed(6) + ', ' + startLng.toFixed(6) + '</span></div>';
                            startMarker.bindPopup(startPopupContent);
                            markers.push(startMarker);
                        }
                        
                        // Add marker for ending location
                        if (endLat && endLng) {
                            var endMarker = L.marker([endLat, endLng], { icon: endIcon }).addTo(map);
                            var endPopupContent = endingLocation ? 
                                '<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 14px;"><strong style="color: #1e293b;">' + endingLocation + '</strong><br><span style="color: #ef4444; font-size: 12px; font-weight: 600;">Ending Point</span><br><span style="color: #64748b; font-size: 11px;">' + endLat.toFixed(6) + ', ' + endLng.toFixed(6) + '</span></div>' :
                                '<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 14px;"><strong style="color: #1e293b;">Trip Ending Location</strong><br><span style="color: #ef4444; font-size: 12px; font-weight: 600;">Ending Point</span><br><span style="color: #64748b; font-size: 11px;">' + endLat.toFixed(6) + ', ' + endLng.toFixed(6) + '</span></div>';
                            endMarker.bindPopup(endPopupContent);
                            markers.push(endMarker);
                        }
                        
                        // Draw route line if both points exist
                        if (startLat && startLng && endLat && endLng) {
                            var routeCoordinates = [[startLat, startLng], [endLat, endLng]];
                            var routeLine = L.polyline(routeCoordinates, {
                                color: '#3b82f6',
                                weight: 3,
                                opacity: 0.7,
                                dashArray: '10, 10'
                            }).addTo(map);
                            
                            // Fit map to show both markers
                            var group = new L.featureGroup(markers);
                            map.fitBounds(group.getBounds().pad(0.1));
                        } else if (markers.length > 0) {
                            // Open popup for the first marker
                            markers[0].openPopup();
                        }
                        
                        // Add animation to markers
                        setTimeout(function() {
                            markers.forEach(function(marker, index) {
                                var originalIcon = marker.options.icon;
                                var scaleIcon = L.divIcon({
                                    html: originalIcon.options.html.replace('scale(1)', 'scale(1.2)'),
                                    iconSize: originalIcon.options.iconSize,
                                    iconAnchor: originalIcon.options.iconAnchor,
                                    popupAnchor: originalIcon.options.popupAnchor,
                                    className: originalIcon.options.className + ' yatra-marker-bounce'
                                });
                                marker.setIcon(scaleIcon);
                            });
                        }, 500);
                        
                        // Add CSS animation
                        var style = document.createElement('style');
                        style.textContent = `
                            @keyframes pulse {
                                0% { transform: rotate(-45deg) scale(1); }
                                50% { transform: rotate(-45deg) scale(1.2); }
                                100% { transform: rotate(-45deg) scale(1); }
                            }
                            .yatra-custom-marker, .yatra-start-marker, .yatra-end-marker {
                                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                                transition: all 0.3s ease;
                            }
                            .yatra-custom-marker:hover, .yatra-start-marker:hover, .yatra-end-marker:hover {
                                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
                            }
                        `;
                        document.head.appendChild(style);
                    });
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
                                        <span class="yatra-external-link-icon">↗</span>
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
                                        <span class="yatra-external-link-icon">↗</span>
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