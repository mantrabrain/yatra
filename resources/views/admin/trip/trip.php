<?php
/**
 * Trip Editor View (Dynamic)
 * 
 * @package Yatra
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

use Yatra\Admin\TripForm;
use Yatra\Models\Activity;

$trip = $trip ?? null;
$action = $action ?? 'add';
$tripForm = new TripForm();
$config = $tripForm->get_config($trip, $action);
$itinerary_config = $tripForm->get_itinerary_config();

// Fetch all active activities for JS
$all_activities = Activity::getAll(true);

// Simple field rendering function
function yatra_render_field($field, $trip) {
    $id = $field['id'];
    $type = $field['type'];
    $label = $field['label'];
    $desc = $field['desc'] ?? '';
    $required = !empty($field['required']);
    $options = $field['options'] ?? [];
    $value = $trip && isset($trip->$id) ? $trip->$id : '';
    $input_id = 'trip-' . $id;
    $required_attr = $required ? 'required' : '';
    $required_class = $required ? 'required' : '';
    
    echo '<div class="form-group">';
    echo '<label class="form-label ' . $required_class . '" for="' . esc_attr($input_id) . '">' . esc_html($label) . '</label>';
    
    if ($type === 'text' || $type === 'number') {
        $type_attr = $type === 'number' ? 'number' : 'text';
        echo '<input type="' . $type_attr . '" class="form-input" id="' . esc_attr($input_id) . '" name="' . esc_attr($id) . '" value="' . esc_attr($value) . '" ' . $required_attr . ' />';
    } elseif ($type === 'textarea') {
        echo '<textarea class="form-textarea" id="' . esc_attr($input_id) . '" name="' . esc_attr($id) . '" ' . $required_attr . '>' . esc_textarea($value) . '</textarea>';
    } elseif ($type === 'select') {
        echo '<select class="form-select" id="' . esc_attr($input_id) . '" name="' . esc_attr($id) . '" ' . $required_attr . '>';
        echo '<option value="">Select ' . esc_html($label) . '</option>';
        foreach ($options as $opt_val => $opt_label) {
            $selected = $value == $opt_val ? 'selected' : '';
            echo '<option value="' . esc_attr($opt_val) . '" ' . $selected . '>' . esc_html($opt_label) . '</option>';
        }
        echo '</select>';
    }
    
    if ($desc) {
        echo '<div class="form-desc">' . esc_html($desc) . '</div>';
    }
    echo '</div>';
}
?>
<script>
    // Pass global activities to JS first
    const globalActivities = <?php echo json_encode($all_activities); ?>;
</script>

<div class="trip-editor">
    <header class="admin-header">
        <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.8 19.2L16 11L21.6 7L19.6 5L14 9L11 2L9 3L10.6 9L4 12L2 10L1 12L3 13L9.6 16L8 22L10 23L13 16L19 20L17.8 19.2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Trip Editor - <?php echo $trip ? esc_html($trip->title) : 'New Trip'; ?>
        </h1>
    </header>
    <div class="admin-container vertical-tabs-layout">
        <nav class="vertical-tabs">
            <?php foreach ($config as $section): ?>
                <button class="tab-button<?php echo $section['id'] === 'basic' ? ' active' : ''; ?>" data-tab="<?php echo esc_attr($section['id']); ?>" role="tab" aria-selected="<?php echo $section['id'] === 'basic' ? 'true' : 'false'; ?>" aria-controls="<?php echo esc_attr($section['id']); ?>">
                    <?php 
                    // Add appropriate icon based on section ID
                    $icon = '';
                    switch ($section['id']) {
                        case 'basic':
                            $icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H8M16 4V2H8V4M16 4V6H8V4M8 8H16M8 12H16M8 16H12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                            break;
                        case 'details':
                            $icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                            break;
                        case 'destinations':
                            $icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                            break;
                        case 'pricing':
                            $icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                            break;
                        case 'images':
                            $icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V5C1 4.46957 1.21071 3.96086 1.58579 3.58579C1.96086 3.21071 2.46957 3 3 3H21C21.5304 3 22.0391 3.21071 22.4142 3.58579C22.7893 3.96086 23 4.46957 23 5V19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 16L8 9L13 14L16 11L23 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 8C17.5523 8 18 7.55228 18 7C18 6.44772 17.5523 6 17 6C16.4477 6 16 6.44772 16 7C16 7.55228 16.4477 8 17 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                            break;
                        case 'seo':
                            $icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                            break;
                        case 'settings':
                            $icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2579 9.77251 19.9887C9.5799 19.7195 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.7421 9.96512 4.0113 9.77251C4.2805 9.5799 4.48574 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                            break;
                        default:
                            $icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                            break;
                    }
                    ?>
                    <span class="tab-icon"><?php echo $icon; ?></span>
                    <span class="tab-text"><?php echo esc_html($section['title']); ?></span>
                </button>
            <?php endforeach; ?>
            <button class="tab-button" data-tab="itinerary" role="tab" aria-selected="false" aria-controls="itinerary">
                <span class="tab-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 2V5M16 2V5M3 8H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7 12H17M7 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                <span class="tab-text">Itinerary</span>
            </button>
        </nav>
        <main class="main-content">
            <form id="trip-form" method="post">
                <?php if ($trip): ?>
                <input type="hidden" name="id" value="<?php echo $trip->id; ?>">
                <?php endif; ?>
                <?php foreach ($config as $section): ?>
                    <div class="tab-content<?php echo $section['id'] === 'basic' ? ' active' : ''; ?>" id="<?php echo esc_attr($section['id']); ?>">
                    <div class="form-section">
                            <h3 class="section-title"><?php echo esc_html($section['title']); ?></h3>
                            <div class="form-row<?php echo count($section['fields']) === 1 ? ' full' : ''; ?>">
                                <?php foreach ($section['fields'] as $field): ?>
                                    <?php yatra_render_field($field, $trip); ?>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
                <!-- Itinerary Tab -->
                <div class="tab-content" id="itinerary">
                    <div class="form-section">
                        <h3 class="section-title">
                            <svg class="section-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 2V5M16 2V5M3 8H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M7 12H17M7 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Itinerary Builder
                        </h3>
                        
                        <div class="itinerary-builder">
                            <div class="itinerary-header">
                                <div class="itinerary-info">
                                    <h4>Plan Your Perfect Trip</h4>
                                    <p>Create a detailed day-by-day itinerary with activities, accommodations, and travel details.</p>
                                </div>
                                <div class="itinerary-actions">
                                    <button type="button" class="yatra-btn yatra-btn-secondary" id="add-day-btn" style="margin-left: 1rem;">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        Add Day
                                    </button>
                                </div>
                            </div>
                            
                            <div class="itinerary-expand-collapse-links">
                                <a href="#" id="toggle-expand-collapse-link" class="itinerary-link">
                                    <span class="expand-collapse-icon" id="expand-collapse-icon">
                                        <svg id="expand-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L12 15L18 9" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </span>
                                    <span id="expand-collapse-text">Expand All</span>
                                </a>
                            </div>
                            
                            <div class="itinerary-days" id="itinerary-days">
                                <!-- Days will be added here dynamically -->
                            </div>

                            <div class="itinerary-empty" id="itinerary-empty">
                                <div class="empty-state">
                                    <div class="empty-icon">
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                    <h4>Start Building Your Itinerary</h4>
                                    <p>Add your first day to begin creating your perfect trip schedule.</p>
                                    <button type="button" class="yatra-btn yatra-btn-primary" id="add-first-itinerary-day-btn">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        Add Your First Day
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-actions" style="margin-top:2rem;">
                    <button type="submit" class="yatra-btn yatra-btn-primary">Save Trip</button>
                </div>
            </form>
        </main>
    </div>
</div>
