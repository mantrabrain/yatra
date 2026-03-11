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
                // Use starting location coordinates if available, otherwise use trip coordinates
                $map_lat = !empty($trip->starting_location) ? $trip->latitude : $trip->latitude;
                $map_lng = !empty($trip->starting_location) ? $trip->longitude : $trip->longitude;
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
                        
                        var lat = parseFloat('<?php echo esc_js($map_lat); ?>');
                        var lng = parseFloat('<?php echo esc_js($map_lng); ?>');
                        var startingLocation = '<?php echo esc_js($trip->starting_location ?? ''); ?>';
                        
                        // Initialize the map
                        var map = L.map('yatra-openstreet-map').setView([lat, lng], 13);
                        
                        // Add OpenStreetMap tiles
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                            maxZoom: 19
                        }).addTo(map);
                        
                        // Create custom icon for the marker
                        var customIcon = L.divIcon({
                            html: '<div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><span style="transform: rotate(45deg); font-size: 14px;">📍</span></div>',
                            iconSize: [30, 30],
                            iconAnchor: [15, 30],
                            popupAnchor: [0, -30],
                            className: 'yatra-custom-marker'
                        });
                        
                        // Add marker for starting location
                        var marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
                        
                        // Create popup content
                        var popupContent = startingLocation ? 
                            '<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 14px;"><strong style="color: #1e293b;">' + startingLocation + '</strong><br><span style="color: #64748b; font-size: 12px;">Starting Point</span><br><span style="color: #3b82f6; font-size: 11px;">' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</span></div>' :
                            '<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 14px;"><strong style="color: #1e293b;">Trip Starting Location</strong><br><span style="color: #64748b; font-size: 12px;">Coordinates</span><br><span style="color: #3b82f6; font-size: 11px;">' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</span></div>';
                        
                        marker.bindPopup(popupContent).openPopup();
                        
                        // Add a subtle animation to the marker
                        setTimeout(function() {
                            marker.bounce = true;
                            var bounceIcon = L.divIcon({
                                html: '<div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg) scale(1.1); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4); animation: pulse 2s infinite;"><span style="transform: rotate(45deg); font-size: 14px;">📍</span></div>',
                                iconSize: [30, 30],
                                iconAnchor: [15, 30],
                                popupAnchor: [0, -30],
                                className: 'yatra-custom-marker yatra-marker-bounce'
                            });
                            marker.setIcon(bounceIcon);
                        }, 500);
                        
                        // Add CSS animation
                        var style = document.createElement('style');
                        style.textContent = `
                            @keyframes pulse {
                                0% { transform: rotate(-45deg) scale(1); }
                                50% { transform: rotate(-45deg) scale(1.2); }
                                100% { transform: rotate(-45deg) scale(1); }
                            }
                            .yatra-custom-marker {
                                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                                transition: all 0.3s ease;
                            }
                            .yatra-custom-marker:hover {
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

    <?php if (!empty($trip->starting_location) || !empty($trip->ending_location) || !empty($trip->landmarks) || (!empty($trip->latitude) && !empty($trip->longitude))): ?>
        <div class="yatra-location-details" style="margin-top: 24px;">
            <div class="yatra-location-grid">
                <?php if (!empty($trip->starting_location)): ?>
                    <div class="yatra-location-item">
                        <div class="yatra-location-icon">
                            <?php echo yatra_svg_icon('play', 'yatra-location-item-icon'); ?>
                        </div>
                        <div class="yatra-location-content">
                            <div class="yatra-location-label"><?php echo esc_html__('Starting Point', 'yatra'); ?></div>
                            <div class="yatra-location-value"><?php echo esc_html($trip->starting_location); ?></div>
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
                            <div class="yatra-location-value"><?php echo esc_html($trip->ending_location); ?></div>
                        </div>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($trip->latitude) && !empty($trip->longitude) && !empty($trip->starting_location)): ?>
                    <div class="yatra-location-item">
                        <div class="yatra-location-icon">
                            <?php echo yatra_svg_icon('globe', 'yatra-location-item-icon'); ?>
                        </div>
                        <div class="yatra-location-content">
                            <div class="yatra-location-label"><?php echo esc_html__('Starting Location Coordinates', 'yatra'); ?></div>
                            <div class="yatra-location-value">
                                <a href="https://www.openstreetmap.org/?mlat=<?php echo esc_attr($trip->latitude); ?>&mlon=<?php echo esc_attr($trip->longitude); ?>#map=15/<?php echo esc_attr($trip->latitude); ?>/<?php echo esc_attr($trip->longitude); ?>" 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   class="yatra-coordinates-link">
                                    <?php echo esc_html($trip->latitude); ?>, <?php echo esc_html($trip->longitude); ?>
                                    <span class="yatra-external-link-icon">↗</span>
                                </a>
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