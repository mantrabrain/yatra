<?php
namespace Yatra\Admin;

use Yatra\Models\Destination;

class DestinationsController {
    public function __construct() {
        // AJAX handlers
        add_action('wp_ajax_yatra_save_destination', [$this, 'saveDestination']);
        add_action('wp_ajax_yatra_delete_destination', [$this, 'deleteDestination']);
        add_action('wp_ajax_yatra_get_destinations', [$this, 'getDestinations']);
    }

    private function checkPermissions() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied.');
        }
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'wp_rest')) {
            wp_send_json_error('Invalid nonce.');
        }
    }

    public function saveDestination() {
        $this->checkPermissions();
        
        $destination_id = intval($_POST['id'] ?? 0);
        
        // Debug: Log received data
        error_log('Yatra: Received destination data: ' . print_r($_POST, true));
        
        // Map form fields to model fields
        $data = [
            'name' => sanitize_text_field($_POST['name'] ?? ''),
            'slug' => sanitize_title($_POST['slug'] ?? ''),
            'description' => wp_kses_post($_POST['description'] ?? ''),
            'short_description' => sanitize_textarea_field($_POST['short_description'] ?? ''),
            'featured_image' => esc_url_raw($_POST['featured_image'] ?? ''),
            'gallery' => $this->parseJsonField($_POST['gallery'] ?? ''),
            'country' => sanitize_text_field($_POST['country'] ?? ''),
            'region' => sanitize_text_field($_POST['region'] ?? ''),
            'timezone' => sanitize_text_field($_POST['timezone'] ?? ''),
            'latitude' => floatval($_POST['latitude'] ?? 0),
            'longitude' => floatval($_POST['longitude'] ?? 0),
            'elevation' => intval($_POST['elevation'] ?? 0),
            'climate_info' => $this->parseJsonField($_POST['climate_info'] ?? ''),
            'best_time_to_visit' => $this->parseJsonField($_POST['best_time_to_visit'] ?? ''),
            'emergency_contacts' => $this->parseJsonField($_POST['emergency_contacts'] ?? ''),
            'visa_requirements' => wp_kses_post($_POST['visa_requirements'] ?? ''),
            'status' => sanitize_text_field($_POST['status'] ?? 'active'),
            'sort_order' => intval($_POST['sort_order'] ?? 0),
            'seo_title' => sanitize_text_field($_POST['seo_title'] ?? ''),
            'seo_description' => sanitize_textarea_field($_POST['seo_description'] ?? ''),
            'seo_keywords' => sanitize_text_field($_POST['seo_keywords'] ?? ''),
        ];

        // Validate required fields
        if (empty($data['name'])) {
            wp_send_json_error('Destination name is required.');
        }

        // Generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = sanitize_title($data['name']);
        }

        if ($destination_id) {
            // Update existing destination
            $result = Destination::updateDestination($destination_id, $data);
            $message = 'Destination updated successfully.';
        } else {
            // Create new destination
            $result = Destination::createDestination($data);
            $message = 'Destination created successfully.';
        }

        if ($result) {
            wp_send_json_success([
                'message' => $message,
                'destination' => $result
            ]);
        } else {
            wp_send_json_error('Failed to save destination.');
        }
    }

    /**
     * Parse JSON field from form input
     */
    private function parseJsonField($value) {
        if (empty($value)) {
            return [];
        }
        
        // If it's already an array, return it
        if (is_array($value)) {
            return $value;
        }
        
        // Try to decode JSON
        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }
        
        // If JSON parsing fails, return as empty array
        return [];
    }

    public function deleteDestination() {
        $this->checkPermissions();
        
        $destination_id = intval($_POST['id'] ?? 0);
        
        if (!$destination_id) {
            wp_send_json_error('Invalid destination ID.');
        }

        $result = Destination::deleteDestination($destination_id);

        if ($result) {
            wp_send_json_success('Destination deleted successfully.');
        } else {
            wp_send_json_error('Failed to delete destination.');
        }
    }

    public function getDestinations() {
        $this->checkPermissions();
        
        $destinations = Destination::getDestinationsForDisplay();
        
        wp_send_json_success([
            'destinations' => $destinations
        ]);
    }
} 