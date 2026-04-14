<?php
/**
 * Search Shortcode Template
 * 
 * @package Yatra
 * @var array $atts Shortcode attributes
 * @var array $categories Available categories
 * @var array $destinations Available destinations
 * @var array $activities Available activities
 * @var array $difficulties Available difficulty levels
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="yatra-search-shortcode">
    <form class="yatra-search-form" method="get" action="<?php echo esc_url(get_post_type_archive_link('trip')); ?>">
        <div class="yatra-search-main">
            <div class="yatra-search-input-group">
                <?php echo yatra_svg_icon('search', 'yatra-search-icon'); ?>
                <input 
                    type="text" 
                    name="s" 
                    class="yatra-search-input" 
                    placeholder="<?php echo esc_attr($atts['placeholder']); ?>"
                    value="<?php echo esc_attr(isset($_GET['s']) ? sanitize_text_field(wp_unslash($_GET['s'])) : ''); ?>"
                >
                <button type="submit" class="yatra-search-btn">
                    <?php echo esc_html($atts['button_text']); ?>
                </button>
            </div>
        </div>

        <?php if ($atts['show_filters'] === 'yes'): ?>
            <div class="yatra-search-filters">
                <div class="yatra-filters-toggle">
                    <button type="button" class="yatra-filters-toggle-btn">
                        <?php echo yatra_svg_icon('filter', 'yatra-filter-icon'); ?>
                        <?php esc_html_e('Advanced Filters', 'yatra'); ?>
                        <?php echo yatra_svg_icon('chevron-down', 'yatra-chevron-icon'); ?>
                    </button>
                </div>

                <div class="yatra-filters-content">
                    <div class="yatra-filters-grid">
                        <?php if ($atts['show_categories'] === 'yes' && !empty($categories)): ?>
                            <div class="yatra-filter-group">
                                <label for="yatra-search-category"><?php esc_html_e('Category', 'yatra'); ?></label>
                                <select id="yatra-search-category" name="category" class="yatra-filter-select">
                                    <option value=""><?php esc_html_e('All Categories', 'yatra'); ?></option>
                                    <?php foreach ($categories as $category): ?>
                                        <option value="<?php echo esc_attr($category->slug); ?>" <?php selected(isset($_GET['category']) ? sanitize_text_field(wp_unslash($_GET['category'])) : '', $category->slug); ?>>
                                            <?php echo esc_html($category->name); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        <?php endif; ?>

                        <?php if ($atts['show_destinations'] === 'yes' && !empty($destinations)): ?>
                            <div class="yatra-filter-group">
                                <label for="yatra-search-destination"><?php esc_html_e('Destination', 'yatra'); ?></label>
                                <select id="yatra-search-destination" name="destination" class="yatra-filter-select">
                                    <option value=""><?php esc_html_e('All Destinations', 'yatra'); ?></option>
                                    <?php foreach ($destinations as $destination): ?>
                                        <option value="<?php echo esc_attr($destination->slug); ?>" <?php selected(isset($_GET['destination']) ? sanitize_text_field(wp_unslash($_GET['destination'])) : '', $destination->slug); ?>>
                                            <?php echo esc_html($destination->name); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        <?php endif; ?>

                        <?php if ($atts['show_activities'] === 'yes' && !empty($activities)): ?>
                            <div class="yatra-filter-group">
                                <label for="yatra-search-activity"><?php esc_html_e('Activity', 'yatra'); ?></label>
                                <select id="yatra-search-activity" name="activity" class="yatra-filter-select">
                                    <option value=""><?php esc_html_e('All Activities', 'yatra'); ?></option>
                                    <?php foreach ($activities as $activity): ?>
                                        <option value="<?php echo esc_attr($activity->slug); ?>" <?php selected(isset($_GET['activity']) ? sanitize_text_field(wp_unslash($_GET['activity'])) : '', $activity->slug); ?>>
                                            <?php echo esc_html($activity->name); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        <?php endif; ?>

                        <?php if ($atts['show_difficulty'] === 'yes' && !empty($difficulties)): ?>
                            <div class="yatra-filter-group">
                                <label for="yatra-search-difficulty"><?php esc_html_e('Difficulty', 'yatra'); ?></label>
                                <select id="yatra-search-difficulty" name="difficulty" class="yatra-filter-select">
                                    <option value=""><?php esc_html_e('All Levels', 'yatra'); ?></option>
                                    <?php foreach ($difficulties as $difficulty): ?>
                                        <option value="<?php echo esc_attr($difficulty->slug); ?>" <?php selected(isset($_GET['difficulty']) ? sanitize_text_field(wp_unslash($_GET['difficulty'])) : '', $difficulty->slug); ?>>
                                            <?php echo esc_html($difficulty->name); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        <?php endif; ?>

                        <?php if ($atts['show_price_range'] === 'yes'): ?>
                            <div class="yatra-filter-group yatra-filter-group-full">
                                <label><?php esc_html_e('Price Range', 'yatra'); ?></label>
                                <div class="yatra-price-range">
                                    <input 
                                        type="number" 
                                        name="price_min" 
                                        class="yatra-price-input" 
                                        placeholder="<?php esc_attr_e('Min', 'yatra'); ?>"
                                        value="<?php echo esc_attr(isset($_GET['price_min']) ? sanitize_text_field(wp_unslash((string) $_GET['price_min'])) : ''); ?>"
                                        min="0"
                                    >
                                    <span class="yatra-price-separator">-</span>
                                    <input 
                                        type="number" 
                                        name="price_max" 
                                        class="yatra-price-input" 
                                        placeholder="<?php esc_attr_e('Max', 'yatra'); ?>"
                                        value="<?php echo esc_attr(isset($_GET['price_max']) ? sanitize_text_field(wp_unslash((string) $_GET['price_max'])) : ''); ?>"
                                        min="0"
                                    >
                                </div>
                            </div>
                        <?php endif; ?>

                        <?php if ($atts['show_duration'] === 'yes'): ?>
                            <div class="yatra-filter-group">
                                <label for="yatra-search-duration"><?php esc_html_e('Duration', 'yatra'); ?></label>
                                <select id="yatra-search-duration" name="duration" class="yatra-filter-select">
                                    <option value=""><?php esc_html_e('Any Duration', 'yatra'); ?></option>
                                    <option value="1-3" <?php selected(isset($_GET['duration']) ? sanitize_text_field(wp_unslash($_GET['duration'])) : '', '1-3'); ?>>1-3 <?php esc_html_e('days', 'yatra'); ?></option>
                                    <option value="4-7" <?php selected(isset($_GET['duration']) ? sanitize_text_field(wp_unslash($_GET['duration'])) : '', '4-7'); ?>>4-7 <?php esc_html_e('days', 'yatra'); ?></option>
                                    <option value="8-14" <?php selected(isset($_GET['duration']) ? sanitize_text_field(wp_unslash($_GET['duration'])) : '', '8-14'); ?>>8-14 <?php esc_html_e('days', 'yatra'); ?></option>
                                    <option value="15+" <?php selected(isset($_GET['duration']) ? sanitize_text_field(wp_unslash($_GET['duration'])) : '', '15+'); ?>>15+ <?php esc_html_e('days', 'yatra'); ?></option>
                                </select>
                            </div>
                        <?php endif; ?>
                    </div>

                    <div class="yatra-filters-actions">
                        <button type="submit" class="yatra-btn yatra-btn-primary">
                            <?php esc_html_e('Apply Filters', 'yatra'); ?>
                        </button>
                        <button type="button" class="yatra-btn yatra-btn-outline yatra-reset-filters">
                            <?php esc_html_e('Reset', 'yatra'); ?>
                        </button>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </form>
</div>

<style>
.yatra-search-shortcode {
    margin: 30px 0;
}

.yatra-search-form {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
}

.yatra-search-main {
    padding: 20px;
}

.yatra-search-input-group {
    display: flex;
    align-items: center;
    gap: 15px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 5px;
    transition: border-color 0.3s ease;
}

.yatra-search-input-group:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.yatra-search-icon {
    width: 20px;
    height: 20px;
    color: #6b7280;
    margin-left: 10px;
}

.yatra-search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 10px 5px;
    font-size: 1rem;
    outline: none;
}

.yatra-search-input::placeholder {
    color: #9ca3af;
}

.yatra-search-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.yatra-search-btn:hover {
    background: #2563eb;
}

.yatra-search-filters {
    border-top: 1px solid #e5e7eb;
}

.yatra-filters-toggle {
    padding: 15px 20px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
}

.yatra-filters-toggle-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    background: none;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    color: #6b7280;
    font-weight: 500;
    transition: all 0.3s ease;
    width: 100%;
    justify-content: center;
}

.yatra-filters-toggle-btn:hover {
    background: #e5e7eb;
    color: #374151;
}

.yatra-filter-icon {
    width: 16px;
    height: 16px;
}

.yatra-chevron-icon {
    width: 16px;
    height: 16px;
    transition: transform 0.3s ease;
}

.yatra-filters-toggle-btn.yatra-filters-open .yatra-chevron-icon {
    transform: rotate(180deg);
}

.yatra-filters-content {
    display: none;
    padding: 20px;
}

.yatra-filters-content.yatra-filters-open {
    display: block;
}

.yatra-filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.yatra-filter-group {
    display: flex;
    flex-direction: column;
}

.yatra-filter-group-full {
    grid-column: 1 / -1;
}

.yatra-filter-group label {
    margin-bottom: 8px;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
}

.yatra-filter-select,
.yatra-price-input {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
}

.yatra-filter-select:focus,
.yatra-price-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.yatra-price-range {
    display: flex;
    align-items: center;
    gap: 10px;
}

.yatra-price-input {
    flex: 1;
}

.yatra-price-separator {
    color: #6b7280;
    font-weight: 500;
}

.yatra-filters-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid #f3f4f6;
}

/* Responsive Design */
@media (max-width: 768px) {
    .yatra-search-input-group {
        flex-direction: column;
        gap: 10px;
    }
    
    .yatra-search-icon {
        margin-left: 0;
        align-self: center;
    }
    
    .yatra-search-btn {
        width: 100%;
    }
    
    .yatra-filters-grid {
        grid-template-columns: 1fr;
    }
    
    .yatra-price-range {
        flex-direction: column;
        align-items: stretch;
    }
    
    .yatra-price-separator {
        text-align: center;
    }
    
    .yatra-filters-actions {
        flex-direction: column;
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Filter toggle functionality
    const toggleBtn = document.querySelector('.yatra-filters-toggle-btn');
    const filtersContent = document.querySelector('.yatra-filters-content');
    
    if (toggleBtn && filtersContent) {
        toggleBtn.addEventListener('click', function() {
            this.classList.toggle('yatra-filters-open');
            filtersContent.classList.toggle('yatra-filters-open');
        });
    }
    
    // Reset filters functionality
    const resetBtn = document.querySelector('.yatra-reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            const form = document.querySelector('.yatra-search-form');
            if (form) {
                // Reset all select elements
                form.querySelectorAll('select').forEach(select => {
                    select.selectedIndex = 0;
                });
                
                // Reset all input fields except search
                form.querySelectorAll('input[type="number"]').forEach(input => {
                    input.value = '';
                });
                
                // Keep search term if it exists
                const searchInput = form.querySelector('input[name="s"]');
                if (searchInput && !searchInput.value) {
                    form.submit();
                }
            }
        });
    }
});
</script>
