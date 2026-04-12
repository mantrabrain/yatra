<?php
/**
 * Trip Search Shortcode Template
 *
 * @package Yatra
 * @var array $atts Shortcode attributes
 * @var array $destinations
 * @var array $activities
 * @var string $listing_url
 * @var array{min:int,max:int} $duration_bounds
 * @var list<object{value:string,label:string}> $budget_presets
 */

if (!defined('ABSPATH')) {
    exit;
}

$listing_url = $listing_url ?? home_url('/trip/');
$duration_bounds = is_array($duration_bounds ?? null) ? $duration_bounds : ['min' => 1, 'max' => 30];
$budget_presets = is_array($budget_presets ?? null) ? $budget_presets : [];

$dmin = max(1, (int) ($duration_bounds['min'] ?? 1));
$dmax = max($dmin, (int) ($duration_bounds['max'] ?? 30));

$active_filters = [
    's' => isset($_GET['s']) ? sanitize_text_field(wp_unslash((string) $_GET['s'])) : '',
    'destination' => isset($_GET['destination']) ? sanitize_text_field(wp_unslash((string) $_GET['destination'])) : '',
    'activity' => isset($_GET['activity']) ? sanitize_text_field(wp_unslash((string) $_GET['activity'])) : '',
    'duration' => isset($_GET['duration']) ? sanitize_text_field(wp_unslash((string) $_GET['duration'])) : '',
    'budget' => isset($_GET['budget']) ? sanitize_text_field(wp_unslash((string) $_GET['budget'])) : '',
];

$dur_initial_min = $dmin;
$dur_initial_max = $dmax;
if ($active_filters['duration'] !== '' && preg_match('/^(\d+)-(\d+)$/', $active_filters['duration'], $dm)) {
    $dur_initial_min = max($dmin, (int) $dm[1]);
    $dur_initial_max = min($dmax, max($dur_initial_min, (int) $dm[2]));
}

$dest_default = __('Destination', 'yatra');
$dest_label = $dest_default;
if ($active_filters['destination'] !== '') {
    foreach ($destinations as $d) {
        if ((string) ($d->slug ?? '') === $active_filters['destination']) {
            $dest_label = (string) ($d->name ?? $active_filters['destination']);
            break;
        }
    }
    if ($dest_label === $dest_default) {
        $dest_label = $active_filters['destination'];
    }
}

$act_default = __('Activity', 'yatra');
$act_label = $act_default;
if ($active_filters['activity'] !== '') {
    foreach ($activities as $a) {
        if ((string) ($a->slug ?? '') === $active_filters['activity']) {
            $act_label = (string) ($a->name ?? $active_filters['activity']);
            break;
        }
    }
    if ($act_label === $act_default) {
        $act_label = $active_filters['activity'];
    }
}

$budget_default = __('Budget', 'yatra');
$budget_label = $budget_default;
if ($active_filters['budget'] !== '') {
    foreach ($budget_presets as $bp) {
        if ((string) ($bp->value ?? '') === $active_filters['budget']) {
            $budget_label = (string) ($bp->label ?? $active_filters['budget']);
            break;
        }
    }
    if ($budget_label === $budget_default) {
        $budget_label = $active_filters['budget'];
    }
}

$dur_display_label = __('Duration', 'yatra');
if ($active_filters['duration'] !== '' && preg_match('/^(\d+)-(\d+)$/', $active_filters['duration'], $dmDur)) {
    $dur_display_label = sprintf(
        /* translators: 1: min days, 2: max days */
        __('%1$d – %2$d days', 'yatra'),
        (int) $dmDur[1],
        (int) $dmDur[2]
    );
}
?>

<div class="yatra-trip-search-shortcode" data-listing-url="<?php echo esc_url($listing_url); ?>">
    <div class="yatra-horizontal-search">
        <div class="yatra-horizontal-search-container">
            <div class="yatra-search-bar">
                <div class="yatra-search-keyword-segment">
                    <label class="screen-reader-text" for="yatra-trip-search-s"><?php esc_html_e('Search trips', 'yatra'); ?></label>
                    <div class="yatra-search-keyword-inner">
                        <span class="yatra-search-keyword-leading" aria-hidden="true"><?php echo yatra_svg_icon('search'); ?></span>
                        <div class="yatra-search-keyword-stack">
                            <span class="yatra-dropdown-label"><?php esc_html_e('Search', 'yatra'); ?></span>
                            <input
                                type="search"
                                id="yatra-trip-search-s"
                                name="s"
                                class="yatra-search-keyword-input"
                                autocomplete="off"
                                inputmode="search"
                                enterkeyhint="search"
                                placeholder="<?php esc_attr_e('Trip name or keyword…', 'yatra'); ?>"
                                value="<?php echo esc_attr($active_filters['s']); ?>"
                            >
                        </div>
                    </div>
                </div>

                <div class="yatra-search-divider"></div>

                <div class="yatra-search-dropdown" data-dropdown="destination">
                    <div class="yatra-dropdown-trigger">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <div class="yatra-dropdown-content">
                            <span class="yatra-dropdown-label"><?php esc_html_e('Destination', 'yatra'); ?></span>
                            <span class="yatra-dropdown-value"><?php echo esc_html($dest_label); ?></span>
                        </div>
                        <svg class="yatra-dropdown-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu yatra-dropdown-menu--filterable">
                        <div class="yatra-dropdown-search-wrap">
                            <label class="screen-reader-text" for="yatra-trip-search-dest-filter"><?php esc_html_e('Search destinations', 'yatra'); ?></label>
                            <input
                                type="search"
                                id="yatra-trip-search-dest-filter"
                                class="yatra-dropdown-filter-input"
                                placeholder="<?php esc_attr_e('Search destinations…', 'yatra'); ?>"
                                autocomplete="off"
                                tabindex="0"
                            >
                        </div>
                        <div class="yatra-dropdown-options">
                            <?php if (!empty($destinations)) : ?>
                                <div class="yatra-dropdown-option<?php echo $active_filters['destination'] === '' ? ' selected' : ''; ?>" data-value="" data-search-text="<?php echo esc_attr(__('Any destination', 'yatra')); ?>"><?php esc_html_e('Any destination', 'yatra'); ?></div>
                                <?php foreach ($destinations as $dest) : ?>
                                    <?php
                                    $dname = (string) ($dest->name ?? '');
                                    $dslug = (string) ($dest->slug ?? '');
                                    ?>
                                    <div class="yatra-dropdown-option<?php echo ($active_filters['destination'] === $dslug) ? ' selected' : ''; ?>" data-value="<?php echo esc_attr($dslug); ?>" data-search-text="<?php echo esc_attr($dname . ' ' . $dslug); ?>">
                                        <?php echo esc_html($dname); ?>
                                    </div>
                                <?php endforeach; ?>
                            <?php else : ?>
                                <div class="yatra-dropdown-option selected" data-value="" data-search-text=""><?php esc_html_e('All destinations', 'yatra'); ?></div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <div class="yatra-search-divider"></div>

                <div class="yatra-search-dropdown" data-dropdown="activities">
                    <div class="yatra-dropdown-trigger">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <div class="yatra-dropdown-content">
                            <span class="yatra-dropdown-label"><?php esc_html_e('Activities', 'yatra'); ?></span>
                            <span class="yatra-dropdown-value"><?php echo esc_html($act_label); ?></span>
                        </div>
                        <svg class="yatra-dropdown-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu yatra-dropdown-menu--filterable">
                        <div class="yatra-dropdown-search-wrap">
                            <label class="screen-reader-text" for="yatra-trip-search-act-filter"><?php esc_html_e('Search activities', 'yatra'); ?></label>
                            <input
                                type="search"
                                id="yatra-trip-search-act-filter"
                                class="yatra-dropdown-filter-input"
                                placeholder="<?php esc_attr_e('Search activities…', 'yatra'); ?>"
                                autocomplete="off"
                                tabindex="0"
                            >
                        </div>
                        <div class="yatra-dropdown-options">
                            <?php if (!empty($activities)) : ?>
                                <div class="yatra-dropdown-option<?php echo $active_filters['activity'] === '' ? ' selected' : ''; ?>" data-value="" data-search-text="<?php echo esc_attr(__('Any activity', 'yatra')); ?>"><?php esc_html_e('Any activity', 'yatra'); ?></div>
                                <?php foreach ($activities as $act) : ?>
                                    <?php
                                    $aname = (string) ($act->name ?? '');
                                    $aslug = (string) ($act->slug ?? '');
                                    ?>
                                    <div class="yatra-dropdown-option<?php echo ($active_filters['activity'] === $aslug) ? ' selected' : ''; ?>" data-value="<?php echo esc_attr($aslug); ?>" data-search-text="<?php echo esc_attr($aname . ' ' . $aslug); ?>">
                                        <?php echo esc_html($aname); ?>
                                    </div>
                                <?php endforeach; ?>
                            <?php else : ?>
                                <div class="yatra-dropdown-option selected" data-value="" data-search-text=""><?php esc_html_e('All activities', 'yatra'); ?></div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <div class="yatra-search-divider"></div>

                <div class="yatra-search-dropdown" data-dropdown="duration" data-duration-min="<?php echo esc_attr((string) $dmin); ?>" data-duration-max="<?php echo esc_attr((string) $dmax); ?>">
                    <div class="yatra-dropdown-trigger">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 018 0z"/>
                        </svg>
                        <div class="yatra-dropdown-content">
                            <span class="yatra-dropdown-label"><?php esc_html_e('Duration', 'yatra'); ?></span>
                            <span class="yatra-dropdown-value"><?php echo esc_html($dur_display_label); ?></span>
                        </div>
                        <svg class="yatra-dropdown-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu yatra-duration-menu">
                        <div class="yatra-duration-slider-wrapper">
                            <div class="yatra-duration-header">
                                <div class="yatra-duration-title"><?php esc_html_e('Select Trip Duration', 'yatra'); ?></div>
                                <div class="yatra-duration-subtitle"><?php esc_html_e('Choose your preferred trip length', 'yatra'); ?></div>
                            </div>
                            <div class="yatra-duration-badges">
                                <span class="yatra-duration-badge yatra-duration-min-badge"></span>
                                <span class="yatra-duration-badge yatra-duration-max-badge"></span>
                            </div>
                            <div class="yatra-dual-range-slider">
                                <input type="range" id="durationMin" min="<?php echo esc_attr((string) $dmin); ?>" max="<?php echo esc_attr((string) $dmax); ?>" value="<?php echo esc_attr((string) $dur_initial_min); ?>" class="yatra-range-min">
                                <input type="range" id="durationMax" min="<?php echo esc_attr((string) $dmin); ?>" max="<?php echo esc_attr((string) $dmax); ?>" value="<?php echo esc_attr((string) $dur_initial_max); ?>" class="yatra-range-max">
                                <div class="yatra-slider-track"></div>
                                <div class="yatra-slider-range"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="yatra-search-divider"></div>

                <div class="yatra-search-dropdown" data-dropdown="budget">
                    <div class="yatra-dropdown-trigger">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                        </svg>
                        <div class="yatra-dropdown-content">
                            <span class="yatra-dropdown-label"><?php esc_html_e('Budget', 'yatra'); ?></span>
                            <span class="yatra-dropdown-value"><?php echo esc_html($budget_label); ?></span>
                        </div>
                        <svg class="yatra-dropdown-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <div class="yatra-dropdown-menu">
                        <?php if (!empty($budget_presets)) : ?>
                            <div class="yatra-dropdown-option<?php echo $active_filters['budget'] === '' ? ' selected' : ''; ?>" data-value=""><?php esc_html_e('Any budget', 'yatra'); ?></div>
                            <?php foreach ($budget_presets as $preset) : ?>
                                <div class="yatra-dropdown-option<?php echo ($active_filters['budget'] === (string) ($preset->value ?? '')) ? ' selected' : ''; ?>" data-value="<?php echo esc_attr($preset->value ?? ''); ?>">
                                    <?php echo esc_html($preset->label ?? ''); ?>
                                </div>
                            <?php endforeach; ?>
                        <?php else : ?>
                            <div class="yatra-dropdown-option selected" data-value=""><?php esc_html_e('No price data yet', 'yatra'); ?></div>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="yatra-search-button-container">
                    <button type="button" class="yatra-search-main-btn">
                        <?php esc_html_e('Search', 'yatra'); ?>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
