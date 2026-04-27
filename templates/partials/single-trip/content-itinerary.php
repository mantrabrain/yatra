<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="itinerary" itemscope itemtype="https://schema.org/TouristTrip">
    <div class="yatra-section-header-with-actions">
        <h2 class="yatra-trip-section-title">
            <?php yatra_render_tab_icon($tab->icon ?? null, 'calendar', 'yatra-trip-section-title-icon', $tab->label ?? __('Itinerary', 'yatra')); ?>
            <?php echo esc_html(isset($tab->label) ? $tab->label : __('Itinerary', 'yatra')); ?>
        </h2>
        <div class="yatra-itinerary-actions">
            <button type="button" class="yatra-toggle-all-btn" id="yatra-toggle-all">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="toggle-icon expand-icon" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                </svg>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="toggle-icon collapse-icon" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/>
                </svg>
                <span class="toggle-text"><?php echo esc_html__('Expand All', 'yatra'); ?></span>
            </button>
        </div>
    </div>

    <?php
    // Use dynamic itinerary data from trip only
    $itinerary_days = $trip->getItineraryDays();

    // Icon mapping function
    $get_icon = function($icon_name) {
        $icons = [
            'car' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17h.01M16 17h.01M3 11l1.5-4.5A2 2 0 016.4 5h11.2a2 2 0 011.9 1.5L21 11M3 11v6a1 1 0 001 1h1m16-7v6a1 1 0 01-1 1h-1M3 11h18"/></svg>',
            'plane' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>',
            'utensils' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v18m-7-4h14M5 3v4a2 2 0 002 2h10a2 2 0 002-2V3"/></svg>',
            'hotel' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
            'hiking' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM5 22l3-9 4 3 5-7"/></svg>',
            'moon' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>',
            'camera' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
        ];
        return $icons[$icon_name] ?? $icons['hiking'];
    };

    // Item type colors
    $type_colors = [
        'Transportation' => '#3b82f6',
        'Meal' => '#f59e0b',
        'Accommodation' => '#8b5cf6',
        'Activity' => '#10b981',
        'Rest' => '#6b7280',
    ];
    ?>

    <div class="yatra-itinerary-timeline">
        <?php if (empty($itinerary_days)): ?>
            <div class="yatra-empty-itinerary">
                <div class="yatra-empty-state-icon">
                    <?php echo yatra_svg_icon('calendar', 'yatra-icon-lg'); ?>
                </div>
                <h3 class="yatra-empty-state-title"><?php esc_html_e('No Itinerary Available', 'yatra'); ?></h3>
                <p class="yatra-empty-state-description">
                    <?php esc_html_e('Detailed itinerary information will be available soon. Please check back later or contact us for more details.', 'yatra'); ?>
                </p>
            </div>
        <?php else: ?>
            <?php foreach ($itinerary_days as $idx => $day): ?>
            <div class="yatra-itinerary-day<?php echo (int) $idx === 0 ? ' is-day-expanded' : ''; ?>" data-day="<?php echo esc_attr($day['day']); ?>">
                <div class="yatra-itinerary-day-header">
                    <div class="yatra-day-badge"><?php esc_html_e('Day', 'yatra'); ?> <?php echo esc_html($day['day']); ?></div>
                    <h3 class="yatra-day-title"><?php echo esc_html($day['day_title']); ?></h3>
                    <button type="button" class="yatra-day-toggle" aria-expanded="<?php echo (int) $idx === 0 ? 'true' : 'false'; ?>">
                        <svg class="yatra-chevron-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                </div>

                <div class="yatra-itinerary-day-content">
                    <?php if (!empty($day['day_description'])): ?>
                        <div class="yatra-day-description">
                            <?php echo wp_kses_post(wpautop($day['day_description'])); ?>
                        </div>
                    <?php endif; ?>
                    <div class="yatra-entries-timeline">
                        <?php foreach ($day['entries'] as $index => $entry):
                            $type_color = $type_colors[$entry['item_type']] ?? '#6b7280';
                            ?>
                            <div class="yatra-entry-item" style="--entry-color: <?php echo esc_attr($type_color); ?>">
                                <div class="yatra-entry-timeline-dot"></div>
                                <div class="yatra-entry-card">
                                    <div class="yatra-entry-header">
                                        <div class="yatra-entry-icon" style="background: <?php echo esc_attr($type_color); ?>15; color: <?php echo esc_attr($type_color); ?>">
                                            <?php echo $get_icon($entry['icon']); ?>
                                        </div>
                                        <div class="yatra-entry-info">
                                            <span class="yatra-entry-type" style="color: <?php echo esc_attr($type_color); ?>"><?php echo esc_html($entry['item_type']); ?></span>
                                            <h4 class="yatra-entry-title"><?php echo esc_html($entry['title']); ?></h4>
                                        </div>
                                        <?php if ($entry['start_time']): ?>
                                            <div class="yatra-entry-time">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                                <span>
                                                    <?php echo esc_html($entry['start_time']); ?>
                                                    <?php if ($entry['end_time']) { echo ' - ' . esc_html($entry['end_time']); } ?>
                                                </span>
                                            </div>
                                        <?php endif; ?>
                                    </div>

                                    <p class="yatra-entry-description"><?php echo esc_html($entry['description']); ?></p>

                                    <?php if (!empty($entry['cost']) && $entry['cost'] > 0): ?>
                                        <div class="yatra-entry-cost">
                                            <span class="yatra-cost-amount">
                                                <?php echo yatra_format_price($entry['cost']); ?>
                                            </span>
                                            <?php if ($entry['cost_per_person']): ?>
                                                <span class="yatra-cost-label"><?php esc_html_e('per person', 'yatra'); ?></span>
                                            <?php else: ?>
                                                <span class="yatra-cost-label"><?php esc_html_e('per booking', 'yatra'); ?></span>
                                            <?php endif; ?>
                                        </div>
                                    <?php endif; ?>

                                    <div class="yatra-entry-meta">
                                        <?php if ($entry['location']): ?>
                                            <div class="yatra-entry-meta-item">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                </svg>
                                                <span><?php echo esc_html($entry['location']); ?></span>
                                            </div>
                                        <?php endif; ?>

                                        <?php if ($entry['duration']): ?>
                                            <div class="yatra-entry-meta-item">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                                <span><?php echo esc_html($entry['duration']); ?></span>
                                            </div>
                                        <?php endif; ?>
                                    </div>

                                    <?php if (!empty($entry['included'])): ?>
                                        <div class="yatra-entry-included">
                                            <?php foreach ($entry['included'] as $item): ?>
                                                <span class="yatra-included-tag">
                                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                                </svg>
                                                <?php echo esc_html($item); ?>
                                            </span>
                                            <?php endforeach; ?>
                                        </div>
                                    <?php endif; ?>

                                    <!-- Gallery Section -->
                                    <?php if (!empty($entry['gallery']) && is_array($entry['gallery'])): ?>
                                        <div class="yatra-entry-gallery">
                                            <h5 class="yatra-gallery-title">
                                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                </svg>
                                                <?php esc_html_e('Photos', 'yatra'); ?>
                                            </h5>
                                            <div class="yatra-gallery-grid">
                                                <?php 
                                                global $yatra_itinerary_gallery_images;
                                                $global_index = 0;
                                                // Find the starting index in global data for this entry's gallery
                                                foreach ($yatra_itinerary_gallery_images as $idx => $img_url) {
                                                    foreach ($entry['gallery'] as $media) {
                                                        $media_url = $media['thumbnail_url'] ?? $media['url'] ?? '';
                                                        if ($img_url === $media_url) {
                                                            $global_index = $idx;
                                                            break 2;
                                                        }
                                                    }
                                                }
                                                ?>
                                                <?php foreach ($entry['gallery'] as $index => $media): ?>
                                                    <div class="yatra-gallery-item">
                                                        <a href="#" class="yatra-itinerary-gallery-link" 
                                                           data-gallery="itinerary-gallery" 
                                                           data-image-index="<?php echo esc_attr($global_index + $index); ?>">
                                                            <div class="yatra-media-card">
                                                                <img src="<?php echo esc_url($media['thumbnail_url'] ?? $media['url'] ?? ''); ?>" 
                                                                     data-full-size="<?php echo esc_url($media['url'] ?? ''); ?>"
                                                                     alt="<?php echo esc_attr($media['alt_text'] ?? $media['caption'] ?? $media['title'] ?? sprintf(__('Itinerary Gallery Image %d', 'yatra'), $global_index + $index + 1)); ?>"
                                                                     loading="lazy">
                                                                <?php if (isset($media['type']) && $media['type'] === 'video'): ?>
                                                                    <div class="yatra-media-overlay">
                                                                        <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                                                                            <path d="M8 5v14l11-7z"/>
                                                                        </svg>
                                                                    </div>
                                                                <?php endif; ?>
                                                            </div>
                                                        </a>
                                                    </div>
                                                <?php endforeach; ?>
                                        
                                        <!-- Add video to gallery if exists -->
                                        <?php if (!empty($entry['video_url'])): ?>
                                            <?php 
                                            global $yatra_itinerary_gallery_images;
                                            $video_global_index = 0;
                                            // Find the index of this video thumbnail in global data
                                            $video_url = esc_url($entry['video_url']);
                                            $video_id = '';
                                            $thumbnail_url = '';
                                            
                                            // Extract video ID and thumbnail
                                            if (strpos($video_url, 'youtube.com') !== false || strpos($video_url, 'youtu.be') !== false) {
                                                // YouTube thumbnail extraction
                                                preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/', $video_url, $matches);
                                                $video_id = $matches[1] ?? '';
                                                $thumbnail_url = "https://img.youtube.com/vi/{$video_id}/maxresdefault.jpg";
                                            } elseif (strpos($video_url, 'vimeo.com') !== false) {
                                                // Vimeo thumbnail extraction
                                                preg_match('#vimeo\.com\/.*?(\d+)#', $video_url, $matches);
                                                $video_id = $matches[1] ?? '';
                                                if ($video_id) {
                                                    // Get Vimeo thumbnail via oEmbed API
                                                    $oembed_url = "https://vimeo.com/api/oembed.json?url=" . urlencode($video_url);
                                                    $response = wp_remote_get($oembed_url);
                                                    if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                                                        $body = wp_remote_retrieve_body($response);
                                                        $data = json_decode($body, true);
                                                        if ($data && isset($data['thumbnail_url'])) {
                                                            $thumbnail_url = $data['thumbnail_url'];
                                                        }
                                                    }
                                                    
                                                    // Fallback if API fails
                                                    if (empty($thumbnail_url)) {
                                                        $thumbnail_url = 'https://i.vimeocdn.com/video/' . $video_id . '_640.jpg';
                                                    }
                                                }
                                            }
                                            
                                            // Find the thumbnail in global data
                                            foreach ($yatra_itinerary_gallery_images as $idx => $img_url) {
                                                if ($img_url === $thumbnail_url) {
                                                    $video_global_index = $idx;
                                                    break;
                                                }
                                            }
                                            ?>
                                            <div class="yatra-gallery-item">
                                                <a href="<?php echo esc_url($video_url); ?>" class="yatra-itinerary-video-link" 
                                                   data-gallery="itinerary-gallery" 
                                                   data-image-index="<?php echo esc_attr($video_global_index); ?>"
                                                   data-video-url="<?php echo esc_attr($video_url); ?>"
                                                   data-video-id="<?php echo esc_attr($video_id); ?>">
                                                    <div class="yatra-media-card">
                                                        <img src="<?php echo esc_url($thumbnail_url ?: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik04NSA0NUwxMTUgNjBMODE4IDc1VjQ1WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+'); ?>" 
                                                             data-full-size="<?php echo esc_url($thumbnail_url ?: ''); ?>"
                                                             alt="<?php esc_attr_e('Video thumbnail', 'yatra'); ?>"
                                                             loading="lazy">
                                                        <div class="yatra-media-overlay yatra-media-youtube-overlay">
                                                            <div class="yatra-youtube-play-button">
                                                                <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                                                                    <circle cx="50" cy="50" r="45" fill="rgba(255, 0, 0, 0.9)" stroke="white" stroke-width="3"/>
                                                                    <path d="M40 30 L70 50 L40 70 Z" fill="white"/>
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </a>
                                            </div>
                                        <?php endif; ?>
                                            </div>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
        <?php endif; ?>
    </div>
</section>

<!-- Hidden Gallery Section for JavaScript Collection -->
<?php if (!empty($yatra_itinerary_gallery_images)): ?>
    <div class="yatra-itinerary-trip-gallery" data-gallery="itinerary-gallery" aria-hidden="true">
        <?php foreach ($yatra_itinerary_gallery_images as $index => $image_url): ?>
            <?php if ($image_url): ?>
                <div class="yatra-gallery-item" data-image-index="<?php echo esc_attr($index); ?>" itemscope itemtype="https://schema.org/ImageObject">
                    <img src="<?php echo esc_url($image_url); ?>" 
                         data-full-size="<?php echo esc_url($image_url); ?>"
                         alt="<?php esc_attr_e('Itinerary Gallery Image', 'yatra'); ?>"
                         itemprop="url" content="<?php echo esc_url($image_url); ?>"
                         loading="lazy">
                    <meta itemprop="contentUrl" content="<?php echo esc_url($image_url); ?>">
                </div>
            <?php endif; ?>
        <?php endforeach; ?>
    </div>
<?php endif; ?>

<!-- Itinerary Gallery Modal -->
<div class="yatra-gallery-modal" id="itinerary-gallery" role="dialog" aria-modal="true" aria-label="<?php esc_attr_e('Itinerary Gallery', 'yatra'); ?>">
    <div class="yatra-gallery-modal-overlay"></div>
    <div class="yatra-gallery-modal-content">
        <button type="button" class="yatra-gallery-modal-close" aria-label="<?php esc_attr_e('Close Gallery', 'yatra'); ?>">
            <svg class="yatra-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
        <button type="button" class="yatra-gallery-modal-prev" aria-label="<?php esc_attr_e('Previous Image', 'yatra'); ?>">
            <svg class="yatra-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
        </button>
        <button type="button" class="yatra-gallery-modal-next" aria-label="<?php esc_attr_e('Next Image', 'yatra'); ?>">
            <svg class="yatra-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        </button>
        <div class="yatra-gallery-modal-main">
            <img src="" alt="<?php esc_attr_e('Itinerary Gallery Image', 'yatra'); ?>" class="yatra-gallery-modal-image">
            <div class="yatra-gallery-modal-loader"><?php esc_html_e('Loading...', 'yatra'); ?></div>
        </div>
        <div class="yatra-gallery-modal-info">
            <div class="yatra-gallery-modal-counter">
                <span class="yatra-gallery-current-index">1</span> / <span class="yatra-gallery-total-count">1</span>
            </div>
        </div>
        <div class="yatra-gallery-modal-thumbnails">
            <div class="yatra-gallery-thumbnails-container">
                <!-- Thumbnails will be populated by JavaScript -->
            </div>
        </div>
    </div>
</div>
