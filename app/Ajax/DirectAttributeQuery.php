<?php

namespace Yatra\App\Ajax;

use Yatra\Repositories\AttributeRepository;

/**
 * Attribute Query AJAX Handler (admin fallback when REST cache shape differs).
 */
class DirectAttributeQuery
{
    private AttributeRepository $attributeRepository;

    public function __construct()
    {
        $this->attributeRepository = new AttributeRepository();
    }

    /**
     * Handle AJAX request for attribute data
     */
    public function handle(): void
    {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_admin_nonce')) {
            wp_send_json_error(__('Your session has expired. Please refresh the page and try again.', 'yatra'));
        }

        $attributeId = (int) ($_POST['attribute_id'] ?? 0);

        if ($attributeId <= 0) {
            wp_send_json_error('Invalid attribute ID');
        }

        try {
            $attribute = $this->attributeRepository->find($attributeId);

            if (!$attribute) {
                wp_send_json_error('Attribute not found');
            }

            $row = [
                'id' => (int) $attribute->id,
                'name' => (string) $attribute->name,
                'slug' => (string) $attribute->slug,
                'description' => (string) ($attribute->description ?? ''),
                'status' => (string) ($attribute->status ?? 'draft'),
                'icon' => null,
                'created_at' => $attribute->created_at ?? null,
                'updated_at' => $attribute->updated_at ?? null,
            ];

            if (!empty($attribute->icon)) {
                $iconData = maybe_unserialize($attribute->icon);
                if (is_array($iconData)) {
                    $row['icon'] = $iconData;
                } else {
                    $row['icon'] = [
                        'type' => 'icon',
                        'value' => (string) $attribute->icon,
                    ];
                }
            }

            if (!empty($attribute->metadata)) {
                $metadata = json_decode((string) $attribute->metadata, true);
                if (is_array($metadata)) {
                    $row['field_type'] = $metadata['field_type'] ?? 'text_field';
                    $row['field_options'] = $metadata['field_options'] ?? '';
                    $row['default_value'] = $metadata['default_value'] ?? '';
                    $row['placeholder'] = $metadata['placeholder'] ?? '';
                    $row['required'] = $metadata['required'] ?? false;
                    $row['validation_rules'] = $metadata['validation_rules'] ?? '';
                    $row['display_order'] = isset($metadata['display_order']) ? (int) $metadata['display_order'] : 0;
                    $row['show_on_frontend'] = $metadata['show_on_frontend'] ?? false;
                    $row['show_in_filters'] = $metadata['show_in_filters'] ?? false;
                    $row['filter_type'] = $metadata['filter_type'] ?? 'exact';
                    $row['searchable'] = $metadata['searchable'] ?? false;
                }
            }

            wp_send_json_success($row);
        } catch (\Exception $e) {
            wp_send_json_error('Database query failed: ' . $e->getMessage());
        }
    }

    /**
     * Register AJAX action
     */
    public function register(): void
    {
        add_action('wp_ajax_yatra_get_attribute_direct', [$this, 'handle']);
    }
}
