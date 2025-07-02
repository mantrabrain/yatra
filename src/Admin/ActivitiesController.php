<?php
namespace Yatra\Admin;

use Yatra\Models\Activity;

class ActivitiesController {
    public function __construct() {
        // AJAX handlers
        add_action('wp_ajax_yatra_save_activity', [$this, 'saveActivity']);
        add_action('wp_ajax_yatra_delete_activity', [$this, 'deleteActivity']);
    }

    private function checkPermissions() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied.');
        }
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'wp_rest')) {
            wp_send_json_error('Invalid nonce.');
        }
    }

    public function saveActivity() {
        $this->checkPermissions();
        
        $activity_id = intval($_POST['id'] ?? 0);
        
        // Map form fields to model fields
        $data = [
            'title' => sanitize_text_field($_POST['name'] ?? ''),
            'description' => sanitize_textarea_field($_POST['description'] ?? ''),
            'time' => sanitize_text_field($_POST['duration'] ?? ''),
            'location' => sanitize_text_field($_POST['category'] ?? ''),
            'image' => sanitize_text_field($_POST['icon'] ?? ''),
            'status' => 'active',
            'meta' => [
                'difficulty' => sanitize_text_field($_POST['difficulty'] ?? 'Easy'),
                'icon' => sanitize_text_field($_POST['icon'] ?? ''),
                'category' => sanitize_text_field($_POST['category'] ?? ''),
            ]
        ];

        // Validate required fields
        if (empty($data['title'])) {
            wp_send_json_error('Activity name is required.');
        }

        if ($activity_id) {
            // Update existing activity
            $result = Activity::updateActivity($activity_id, $data);
            $message = 'Activity updated successfully.';
        } else {
            // Create new activity
            $result = Activity::createActivity($data);
            $message = 'Activity created successfully.';
        }

        if ($result) {
            wp_send_json_success([
                'message' => $message,
                'activity' => $result
            ]);
        } else {
            wp_send_json_error('Failed to save activity.');
        }
    }

    public function deleteActivity() {
        $this->checkPermissions();
        
        $activity_id = intval($_POST['id'] ?? 0);
        
        if (!$activity_id) {
            wp_send_json_error('Invalid activity ID.');
        }

        $result = Activity::deleteActivity($activity_id);

        if ($result) {
            wp_send_json_success('Activity deleted successfully.');
        } else {
            wp_send_json_error('Failed to delete activity.');
        }
    }
} 