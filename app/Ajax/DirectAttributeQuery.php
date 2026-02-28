<?php

namespace Yatra\App\Ajax;

use Yatra\App\Repositories\AttributeRepository;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Constants\ClassificationTypes;

/**
 * Attribute Query AJAX Handler
 * Uses repository layer with proper caching
 */
class DirectAttributeQuery
{
    private $attributeRepository;

    public function __construct()
    {
        $this->attributeRepository = new AttributeRepository();
    }

    /**
     * Handle AJAX request for attribute data
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
            // Use repository layer with proper caching
            $attribute = $this->attributeRepository->find($attributeId);
            
            if (!$attribute) {
                wp_send_json_error('Attribute not found');
            }

            // Log the cached values
            error_log('CACHED QUERY - Attribute ID: ' . $attributeId);
            error_log('CACHED QUERY - required: ' . var_export($attribute->required, true));
            error_log('CACHED QUERY - show_on_frontend: ' . var_export($attribute->show_on_frontend, true));
            error_log('CACHED QUERY - show_in_filters: ' . var_export($attribute->show_in_filters, true));
            error_log('CACHED QUERY - searchable: ' . var_export($attribute->searchable, true));

            wp_send_json_success([
                'id' => $attribute->id,
                'name' => $attribute->name,
                'slug' => $attribute->slug,
                'description' => $attribute->description,
                'field_type' => $attribute->field_type,
                'field_options' => $attribute->field_options,
                'default_value' => $attribute->default_value,
                'placeholder' => $attribute->placeholder,
                'required' => $attribute->required,
                'validation_rules' => $attribute->validation_rules,
                'display_order' => $attribute->display_order,
                'show_on_frontend' => $attribute->show_on_frontend,
                'show_in_filters' => $attribute->show_in_filters,
                'filter_type' => $attribute->filter_type,
                'searchable' => $attribute->searchable,
                'status' => $attribute->status,
                'created_at' => $attribute->created_at,
                'updated_at' => $attribute->updated_at
            ]);

        } catch (\Exception $e) {
            error_log('Attribute query error: ' . $e->getMessage());
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
