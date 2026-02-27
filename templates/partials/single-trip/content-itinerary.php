<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="itinerary" itemscope itemtype="https://schema.org/TouristTrip">
    <div class="yatra-section-header-with-actions">
        <h2 class="yatra-trip-section-title">
            <?php echo yatra_svg_icon('calendar', 'yatra-trip-section-title-icon'); ?>
            <?php echo esc_html__('Itinerary', 'yatra'); ?>
        </h2>
        <div class="yatra-itinerary-actions">
            <button type="button" class="yatra-toggle-all-btn" id="yatra-expand-all">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                </svg>
                Expand All
            </button>
            <button type="button" class="yatra-toggle-all-btn" id="yatra-collapse-all">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/>
                </svg>
                Collapse All
            </button>
        </div>
    </div>

    <?php
    // Use dynamic itinerary data from trip only
    $itinerary_days = !empty($trip->itinerary_days) ? $trip->itinerary_days : [];

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
            <?php foreach ($itinerary_days as $day): ?>
            <div class="yatra-itinerary-day" data-day="<?php echo esc_attr($day['day']); ?>">
                <div class="yatra-itinerary-day-header">
                    <div class="yatra-day-badge"><?php esc_html_e('Day', 'yatra'); ?> <?php echo esc_html($day['day']); ?></div>
                    <h3 class="yatra-day-title"><?php echo esc_html($day['day_title']); ?></h3>
                    <button type="button" class="yatra-day-toggle" aria-expanded="true">
                        <svg class="yatra-chevron-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                </div>

                <div class="yatra-itinerary-day-content">
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
                                                    <?php
                                                    echo esc_html($entry['start_time']);
                                                    if ($entry['end_time']) {
                                                        echo ' - ' . esc_html($entry['end_time']);
                                                    }
                                                    ?>
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

<style>
.yatra-empty-itinerary {
    text-align: center;
    padding: 60px 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.yatra-empty-state-icon {
    margin-bottom: 20px;
    color: #6b7280;
}

.yatra-empty-state-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
}

.yatra-empty-state-description {
    color: #6b7280;
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.6;
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
    .yatra-empty-itinerary {
        background: #1f2937;
        border-color: #374151;
    }
    
    .yatra-empty-state-icon {
        color: #9ca3af;
    }
    
    .yatra-empty-state-title {
        color: #f9fafb;
    }
    
    .yatra-empty-state-description {
        color: #9ca3af;
    }
}
</style>