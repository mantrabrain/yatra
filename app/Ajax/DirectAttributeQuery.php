<?php

namespace Yatra\App\Ajax;

use Yatra\App\Repositories\AttributeRepository;

/**
 * Direct Attribute Query AJAX Handler
 * Bypasses all caching to get real database values
 */
class DirectAttributeQuery
{
    private $attributeRepository;

    public function __construct()
    {
        $this->attributeRepository = new AttributeRepository();
    }

    /**
     * Handle AJAX request for direct attribute data
     */
    public function handle()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_admin_nonce')) {
            wp_send_json_error(__('Your session has expired. Please refresh the page and try again.', 'yatra'));
        }

        $attributeId = intval($_POST['attribute_id'] ?? 0);
        
        if (!$attributeId) {
            wp_send_json_error('Invalid attribute ID');
        }

        try {
            // Direct database query - no caching
            global $wpdb;
            $table = $wpdb->prefix . 'yatra_attributes';
            
            $query = $wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE id = %d",
                $attributeId
            );
            
            $result = $wpdb->get_row($query);
            
            if (!$result) {
                wp_send_json_error('Attribute not found');
            }

            // Log the actual database values
            error_log('DIRECT QUERY - Attribute ID: ' . $attributeId);
            error_log('DIRECT QUERY - required: ' . var_export($result->required, true));
            error_log('DIRECT QUERY - show_on_frontend: ' . var_export($result->show_on_frontend, true));
            error_log('DIRECT QUERY - show_in_filters: ' . var_export($result->show_in_filters, true));
            error_log('DIRECT QUERY - searchable: ' . var_export($result->searchable, true));

            wp_send_json_success([
                'id' => $result->id,
                'name' => $result->name,
                'slug' => $result->slug,
                'description' => $result->description,
                'field_type' => $result->field_type,
                'field_options' => $result->field_options,
                'default_value' => $result->default_value,
                'placeholder' => $result->placeholder,
                'required' => $result->required,
                'validation_rules' => $result->validation_rules,
                'display_order' => $result->display_order,
                'show_on_frontend' => $result->show_on_frontend,
                'show_in_filters' => $result->show_in_filters,
                'filter_type' => $result->filter_type,
                'searchable' => $result->searchable,
                'status' => $result->status,
                'created_at' => $result->created_at,
                'updated_at' => $result->updated_at
            ]);

        } catch (\Exception $e) {
            error_log('Direct attribute query error: ' . $e->getMessage());
            wp_send_json_error('Database query failed: ' . $e->getMessage());
        }
    }

    /**
     * Register AJAX action
     */
    public function register()
    {
        add_action('wp_ajax_yatra_get_attribute_direct', [$this, 'handle']);
    }
}
