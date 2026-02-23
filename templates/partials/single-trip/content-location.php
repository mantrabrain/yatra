<?php
if (!defined('ABSPATH')) {
    exit;
} ?>
<section class="yatra-trip-section" id="location">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon('map-pin', 'yatra-trip-section-title-icon'); ?>
        <?php echo esc_html__('Location', 'yatra'); ?>
    </h2>

    <?php 
                // Use starting location coordinates if available, otherwise use trip coordinates
                $map_lat = !empty($trip->starting_location) ? $trip->latitude : $trip->latitude;
                $map_lng = !empty($trip->starting_location) ? $trip->longitude : $trip->longitude;
            ?>
            
            <?php if (!empty($map_lat) && !empty($map_lng)): ?>
                    <div class="yatra-trip-map" id="yatra-trip-map" data-lat="<?php echo esc_attr($map_lat); ?>"
                         data-lng="<?php echo esc_attr($map_lng); ?>">
                        <iframe
                                width="100%"
                                height="400"
                                style="border:0; border-radius: 12px;"
                                loading="lazy"
                                allowfullscreen
                                referrerpolicy="no-referrer-when-downgrade"
                                src="https://www.google.com/maps?q=<?php echo esc_attr($map_lat); ?>,<?php echo esc_attr($map_lng); ?>&output=embed">
                        </iframe>
                    </div>
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
                                <a href="https://www.google.com/maps?q=<?php echo esc_attr($trip->latitude); ?>,<?php echo esc_attr($trip->longitude); ?>" 
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