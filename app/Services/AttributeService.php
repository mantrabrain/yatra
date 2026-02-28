<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\AttributeRepository;
use Yatra\Repositories\TripAttributeRepository;
use Yatra\Utils\Logger;
use Yatra\Utils\Cache;
use Yatra\Helpers\FormatHelper;

/**
 * Attribute Service
 * Handles business logic for trip attributes
 */
class AttributeService extends BaseService
{
    /**
     * @var AttributeRepository
     */
    private $attributeRepository;

    /**
     * @var TripAttributeRepository
     */
    private $tripAttributeRepository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->attributeRepository = new AttributeRepository();
        $this->tripAttributeRepository = new TripAttributeRepository();
    }

    /**
     * Get repository instance
     */
    protected function getRepository()
    {
        return $this->attributeRepository;
    }

    /**
     * Get all published attributes for frontend
     */
    public function getFrontendAttributes(): array
    {
        try {
            $cacheKey = 'yatra_frontend_attributes';
            
            if ($this->isCacheEnabled()) {
                return Cache::remember($cacheKey, function () {
                    return $this->attributeRepository->getAllPublished();
                }, 3600); // Cache for 1 hour
            } else {
                // Bypass cache and get fresh data
                Logger::debug("Cache disabled, getting fresh frontend attributes");
                return $this->attributeRepository->getAllPublished();
            }
            
        } catch (\Exception $e) {
            Logger::error('Failed to get frontend attributes: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get filterable attributes
     */
    public function getFilterableAttributes(): array
    {
        try {
            $cacheKey = 'yatra_filterable_attributes';
            
            if ($this->isCacheEnabled()) {
                return Cache::remember($cacheKey, function () {
                    return $this->attributeRepository->getFilterableAttributes();
                }, 1800); // Cache for 30 minutes
            } else {
                // Bypass cache and get fresh data
                Logger::debug("Cache disabled, getting fresh filterable attributes");
                return $this->attributeRepository->getFilterableAttributes();
            }
            
        } catch (\Exception $e) {
            Logger::error('Failed to get filterable attributes: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get attributes for a specific trip
     */
    public function getTripAttributes(int $tripId): array
    {
        try {
            $cacheKey = "yatra_trip_attributes_{$tripId}";
            
            if ($this->isCacheEnabled()) {
                return Cache::remember($cacheKey, function () use ($tripId) {
                    return $this->tripAttributeRepository->getTripAttributes($tripId);
                }, 1800); // Cache for 30 minutes
            } else {
                // Bypass cache and get fresh data
                Logger::debug("Cache disabled, getting fresh trip attributes", ['trip_id' => $tripId]);
                return $this->tripAttributeRepository->getTripAttributes($tripId);
            }
            
        } catch (\Exception $e) {
            Logger::error("Failed to get attributes for trip {$tripId}: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Set attribute value for a trip
     */
    public function setTripAttribute(int $tripId, int $attributeId, $value): bool
    {
        try {
            if (!$tripId || !$attributeId) {
                throw new \InvalidArgumentException('Trip ID and Attribute ID are required');
            }

            // Validate attribute exists
            $attribute = $this->attributeRepository->find($attributeId);
            if (!$attribute || $attribute->status !== 'publish') {
                throw new \InvalidArgumentException('Attribute not found or not published');
            }

            // Validate value based on field type
            $this->validateAttributeValue($attribute, $value);

            $result = $this->tripAttributeRepository->setTripAttribute($tripId, $attributeId, $value);
            
            if ($result) {
                // Clear cache
                $this->clearTripAttributeCache($tripId);
                
                // Log action
                Logger::info("Set attribute {$attributeId} value for trip {$tripId}");
                
                // Fire action hook
                do_action('yatra_trip_attribute_set', $tripId, $attributeId, $value);
            }
            
            return $result;
            
        } catch (\Exception $e) {
            Logger::error("Failed to set attribute for trip {$tripId}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Remove attribute value from a trip
     */
    public function removeTripAttribute(int $tripId, int $attributeId): bool
    {
        try {
            if (!$tripId || !$attributeId) {
                throw new \InvalidArgumentException('Trip ID and Attribute ID are required');
            }

            $result = $this->tripAttributeRepository->deleteTripAttribute($tripId, $attributeId);
            
            if ($result) {
                // Clear cache
                $this->clearTripAttributeCache($tripId);
                
                // Log action
                Logger::info("Removed attribute {$attributeId} from trip {$tripId}");
                
                // Fire action hook
                do_action('yatra_trip_attribute_removed', $tripId, $attributeId);
            }
            
            return $result;
            
        } catch (\Exception $e) {
            Logger::error("Failed to remove attribute from trip {$tripId}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get trips by attribute value
     */
    public function getTripsByAttributeValue(int $attributeId, string $value): array
    {
        try {
            $cacheKey = "yatra_trips_by_attr_{$attributeId}_" . md5($value);
            
            if ($this->isCacheEnabled()) {
                return Cache::remember($cacheKey, function () use ($attributeId, $value) {
                    // This method is not available - implement a basic version
                    $tripAttributeTable = $this->tripAttributeRepository->getTableName();
                    $query = "SELECT DISTINCT t.* FROM {$this->attributeRepository->getTableName()} a
                             INNER JOIN {$tripAttributeTable} ta ON ta.attribute_id = a.id
                             INNER JOIN {$this->attributeRepository->getTripsTableName()} t ON t.id = ta.trip_id
                             WHERE a.id = %d AND ta.value = %s AND t.status = 'publish'";
                    
                    return $this->attributeRepository->wpdb->get_results(
                        $this->attributeRepository->wpdb->prepare($query, $attributeId, $value)
                    ) ?: [];
                }, 1800); // Cache for 30 minutes
            } else {
                // Bypass cache and get fresh data
                Logger::debug("Cache disabled, getting fresh trips by attribute value", ['attribute_id' => $attributeId, 'value' => $value]);
                // This method is not available - implement a basic version
                $tripAttributeTable = $this->tripAttributeRepository->getTableName();
                $query = "SELECT DISTINCT t.* FROM {$this->attributeRepository->getTableName()} a
                         INNER JOIN {$tripAttributeTable} ta ON ta.attribute_id = a.id
                         INNER JOIN {$this->attributeRepository->getTripsTableName()} t ON t.id = ta.trip_id
                         WHERE a.id = %d AND ta.value = %s AND t.status = 'publish'";
                
                return $this->attributeRepository->wpdb->get_results(
                    $this->attributeRepository->wpdb->prepare($query, $attributeId, $value)
                ) ?: [];
            }
            
        } catch (\Exception $e) {
            Logger::error("Failed to get trips by attribute value: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get all possible values for an attribute (for filter dropdowns)
     */
    public function getAttributeValues(int $attributeId): array
    {
        try {
            $cacheKey = "yatra_attribute_values_{$attributeId}";
            
            if ($this->isCacheEnabled()) {
                return Cache::remember($cacheKey, function () use ($attributeId) {
                    // This method is not available - implement a basic version
                    $tripAttributeTable = $this->tripAttributeRepository->getTableName();
                    $query = "SELECT DISTINCT value, COUNT(*) as count FROM {$tripAttributeTable}
                             WHERE attribute_id = %d AND value IS NOT NULL AND value != ''
                             GROUP BY value ORDER BY count DESC, value ASC";
                    
                    return $this->attributeRepository->wpdb->get_results(
                        $this->attributeRepository->wpdb->prepare($query, $attributeId)
                    ) ?: [];
                }, 3600); // Cache for 1 hour
            } else {
                // Bypass cache and get fresh data
                Logger::debug("Cache disabled, getting fresh attribute values", ['attribute_id' => $attributeId]);
                // This method is not available - implement a basic version
                $tripAttributeTable = $this->tripAttributeRepository->getTableName();
                $query = "SELECT DISTINCT value, COUNT(*) as count FROM {$tripAttributeTable}
                         WHERE attribute_id = %d AND value IS NOT NULL AND value != ''
                         GROUP BY value ORDER BY count DESC, value ASC";
                
                return $this->attributeRepository->wpdb->get_results(
                    $this->attributeRepository->wpdb->prepare($query, $attributeId)
                ) ?: [];
            }
            
        } catch (\Exception $e) {
            Logger::error("Failed to get attribute values: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Search attributes
     */
    public function search(string $term): array
    {
        try {
            $cacheKey = 'yatra_search_attributes_' . md5($term);
            
            if ($this->isCacheEnabled()) {
                return Cache::remember($cacheKey, function () use ($term) {
                    return $this->attributeRepository->search($term);
                }, 1800); // Cache for 30 minutes
            } else {
                // Bypass cache and get fresh data
                Logger::debug("Cache disabled, searching attributes directly", ['term' => $term]);
                return $this->attributeRepository->search($term);
            }
            
        } catch (\Exception $e) {
            Logger::error("Failed to search attributes: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Clear related entity caches
     */
    protected function clearRelatedEntityCaches(int $id, string $operation): void
    {
        // Clear frontend attributes cache
        $this->clearCacheByPattern('yatra_frontend_attributes');
        
        // Clear filterable attributes cache
        $this->clearCacheByPattern('yatra_filterable_attributes');
        
        // Clear trip-related attribute caches
        $this->clearCacheByPattern('yatra_trip_attributes_');
        
        // Clear search attributes cache
        $this->clearCacheByPattern('yatra_search_attributes_');
        
        // Clear attribute values cache
        $this->clearCacheByPattern('yatra_attribute_values_');
        
        // Clear trips by attribute value cache
        $this->clearCacheByPattern('yatra_trips_by_attr_');
        
        // Clear trip listing caches since attributes affect trip filtering
        $this->clearCacheByPattern('trip_listing_');
        
        // Clear query result caches
        $this->clearCacheByPattern(Cache::PREFIX_QUERY_RESULT);
        
        Logger::debug("Attribute related caches cleared", [
            'attribute_id' => $id,
            'operation' => $operation
        ]);
    }

    /**
     * Clear cache by pattern
     */
    private function clearCacheByPattern(string $pattern): void
    {
        try {
            Cache::clearByPrefix($pattern);
        } catch (\Exception $e) {
            Logger::warning("Failed to clear attribute cache pattern", [
                'pattern' => $pattern,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Create new attribute
     */
    public function createAttribute(array $data): int
    {
        try {
            // Validate required fields
            if (empty($data['name'])) {
                throw new \InvalidArgumentException('Attribute name is required');
            }

            // Generate slug if not provided
            if (empty($data['slug'])) {
                $data['slug'] = sanitize_title($data['name']);
            }

            // Check if slug already exists
            if ($this->attributeRepository->slugExists($data['slug'])) {
                throw new \InvalidArgumentException('Attribute with this slug already exists');
            }

            // Set default values
            $data = array_merge([
                'field_type' => 'text_field',
                'required' => 0,
                'show_on_frontend' => 1,
                'show_in_filters' => 0,
                'filter_type' => 'exact',
                'searchable' => 0,
                'status' => 'publish',
                'display_order' => $this->attributeRepository->getMaxDisplayOrder() + 1
            ], $data);

            // Validate field type
            $validFieldTypes = ['text_field', 'number', 'email', 'url', 'textarea', 'select', 'radio', 'checkbox', 'date', 'time', 'color'];
            if (!in_array($data['field_type'], $validFieldTypes)) {
                throw new \InvalidArgumentException('Invalid field type');
            }

            // Validate field options for select/radio/checkbox
            if (in_array($data['field_type'], ['select', 'radio', 'checkbox']) && empty($data['field_options'])) {
                throw new \InvalidArgumentException('Field options are required for select, radio, and checkbox fields');
            }

            // Process field options
            if (isset($data['field_options']) && is_array($data['field_options'])) {
                $data['field_options'] = wp_json_encode($data['field_options']);
            }

            // Process validation rules
            if (isset($data['validation_rules']) && is_array($data['validation_rules'])) {
                $data['validation_rules'] = wp_json_encode($data['validation_rules']);
            }

            // Sanitize description as rich text
            if (isset($data['description'])) {
                $data['description'] = FormatHelper::sanitizeQuillHtml($data['description']);
            }

            // Process icon field
            if (isset($data['icon'])) {
                error_log('DEBUG: AttributeService create - Icon data before processing: ' . var_export($data['icon'], true));
                
                if (is_array($data['icon'])) {
                    // Sanitize icon array
                    $icon = [
                        'type' => isset($data['icon']['type']) && in_array($data['icon']['type'], ['icon', 'image'], true)
                            ? $data['icon']['type']
                            : 'icon',
                        'value' => isset($data['icon']['value']) 
                            ? sanitize_text_field($data['icon']['value'])
                            : '',
                    ];
                    $data['icon'] = maybe_serialize($icon);
                    error_log('DEBUG: AttributeService create - Icon data after processing: ' . var_export($data['icon'], true));
                } elseif (is_string($data['icon'])) {
                    // If it's already a string, sanitize it
                    $data['icon'] = sanitize_text_field($data['icon']);
                    error_log('DEBUG: AttributeService create - Icon as string: ' . var_export($data['icon'], true));
                }
            } else {
                error_log('DEBUG: AttributeService create - Icon data not set');
            }

            $attributeId = $this->attributeRepository->create($data);
            
            if ($attributeId) {
                // Clear cache
                $this->clearAttributeCache();
                
                // Log action
                Logger::info("Created attribute: {$data['name']} (ID: {$attributeId})");
                
                // Fire action hook
                do_action('yatra_attribute_created', $attributeId, $data);
            }
            
            return $attributeId;
            
        } catch (\Exception $e) {
            Logger::error("Failed to create attribute: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update attribute
     */
    public function updateAttribute(int $id, array $data): bool
    {
        try {
            if (!$id) {
                throw new \InvalidArgumentException('Attribute ID is required');
            }

            // Check if attribute exists
            $existing = $this->attributeRepository->find($id);
            if (!$existing) {
                throw new \InvalidArgumentException('Attribute not found');
            }

            // Update slug if name changed
            if (isset($data['name']) && !isset($data['slug'])) {
                $data['slug'] = sanitize_title($data['name']);
            }

            // Check slug uniqueness (excluding current attribute)
            if (isset($data['slug']) && $this->attributeRepository->slugExists($data['slug'], $id)) {
                throw new \InvalidArgumentException('Attribute with this slug already exists');
            }

            // Process field options
            if (isset($data['field_options']) && is_array($data['field_options'])) {
                $data['field_options'] = wp_json_encode($data['field_options']);
            }

            // Process validation rules
            if (isset($data['validation_rules']) && is_array($data['validation_rules'])) {
                $data['validation_rules'] = wp_json_encode($data['validation_rules']);
            }

            // Sanitize description as rich text
            if (isset($data['description'])) {
                $data['description'] = FormatHelper::sanitizeQuillHtml($data['description']);
            }

            // Process icon field
            if (isset($data['icon'])) {
                error_log('DEBUG: AttributeService update - Icon data before processing: ' . var_export($data['icon'], true));
                
                if (is_array($data['icon'])) {
                    // Sanitize icon array
                    $icon = [
                        'type' => isset($data['icon']['type']) && in_array($data['icon']['type'], ['icon', 'image'], true)
                            ? $data['icon']['type']
                            : 'icon',
                        'value' => isset($data['icon']['value']) 
                            ? sanitize_text_field($data['icon']['value'])
                            : '',
                    ];
                    $data['icon'] = maybe_serialize($icon);
                    error_log('DEBUG: AttributeService update - Icon data after processing: ' . var_export($data['icon'], true));
                } elseif (is_string($data['icon'])) {
                    // If it's already a string, sanitize it
                    $data['icon'] = sanitize_text_field($data['icon']);
                    error_log('DEBUG: AttributeService update - Icon as string: ' . var_export($data['icon'], true));
                }
            } else {
                error_log('DEBUG: AttributeService update - Icon data not set');
            }

            $result = $this->attributeRepository->update($id, $data);
            
            if ($result) {
                // Clear cache
                $this->clearAttributeCache();
                
                // Log action
                Logger::info("Updated attribute ID: {$id}");
                
                // Fire action hook
                do_action('yatra_attribute_updated', $id, $data);
            }
            
            return $result;
            
        } catch (\Exception $e) {
            Logger::error("Failed to update attribute {$id}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Delete attribute (soft delete)
     */
    public function deleteAttribute(int $id): bool
    {
        try {
            if (!$id) {
                throw new \InvalidArgumentException('Attribute ID is required');
            }

            $result = $this->attributeRepository->delete($id);
            
            if ($result) {
                // Clear cache
                $this->clearAttributeCache();
                
                // Log action
                Logger::info("Deleted attribute ID: {$id}");
                
                // Fire action hook
                do_action('yatra_attribute_deleted', $id);
            }
            
            return $result;
            
        } catch (\Exception $e) {
            Logger::error("Failed to delete attribute {$id}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Permanently delete attribute
     */
    public function forceDeleteAttribute(int $id): bool
    {
        try {
            if (!$id) {
                throw new \InvalidArgumentException('Attribute ID is required');
            }

            $result = $this->attributeRepository->forceDelete($id);
            
            if ($result) {
                // Clear cache
                $this->clearAttributeCache();
                
                // Log action
                Logger::info("Force deleted attribute ID: {$id}");
                
                // Fire action hook
                do_action('yatra_attribute_force_deleted', $id);
            }
            
            return $result;
            
        } catch (\Exception $e) {
            Logger::error("Failed to force delete attribute {$id}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update attribute display orders
     */
    public function updateDisplayOrders(array $orders): bool
    {
        try {
            if (empty($orders) || !is_array($orders)) {
                throw new \InvalidArgumentException('Orders array is required');
            }

            $result = $this->attributeRepository->updateDisplayOrders($orders);
            
            if ($result) {
                // Clear cache
                $this->clearAttributeCache();
                
                // Log action
                Logger::info('Updated attribute display orders');
                
                // Fire action hook
                do_action('yatra_attribute_orders_updated', $orders);
            }
            
            return $result;
            
        } catch (\Exception $e) {
            Logger::error("Failed to update attribute display orders: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Validate attribute value based on field type and rules
     */
    private function validateAttributeValue(\stdClass $attribute, $value): void
    {
        // Basic validation based on field type
        switch ($attribute->field_type) {
            case 'number':
                if (!is_numeric($value)) {
                    throw new \InvalidArgumentException('Value must be a number');
                }
                break;
                
            case 'email':
                if (!empty($value) && !is_email($value)) {
                    throw new \InvalidArgumentException('Invalid email address');
                }
                break;
                
            case 'url':
                if (!empty($value) && !filter_var($value, FILTER_VALIDATE_URL)) {
                    throw new \InvalidArgumentException('Invalid URL');
                }
                break;
                
            case 'date':
                if (!empty($value) && !strtotime($value)) {
                    throw new \InvalidArgumentException('Invalid date format');
                }
                break;
                
            case 'time':
                if (!empty($value) && !preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $value)) {
                    throw new \InvalidArgumentException('Invalid time format (HH:MM)');
                }
                break;
                
            case 'select':
            case 'radio':
                $options = $attribute->field_options ? json_decode($attribute->field_options, true) : [];
                if (!empty($value) && !in_array($value, array_column($options, 'value'))) {
                    throw new \InvalidArgumentException('Invalid option selected');
                }
                break;
                
            case 'checkbox':
                if (!empty($value) && !is_array($value)) {
                    throw new \InvalidArgumentException('Checkbox values must be an array');
                }
                $options = $attribute->field_options ? json_decode($attribute->field_options, true) : [];
                if (!empty($value)) {
                    $validOptions = array_column($options, 'value');
                    foreach ($value as $val) {
                        if (!in_array($val, $validOptions)) {
                            throw new \InvalidArgumentException('Invalid checkbox option: ' . $val);
                        }
                    }
                }
                break;
        }

        // Check if required field is empty
        if ($attribute->required && (empty($value) || (is_string($value) && trim($value) === ''))) {
            throw new \InvalidArgumentException('This attribute is required');
        }

        // Additional validation rules
        if (!empty($attribute->validation_rules)) {
            $rules = json_decode($attribute->validation_rules, true);
            if (is_array($rules)) {
                $this->applyValidationRules($value, $rules);
            }
        }
    }

    /**
     * Apply custom validation rules
     */
    private function applyValidationRules($value, array $rules): void
    {
        foreach ($rules as $rule => $ruleValue) {
            switch ($rule) {
                case 'min_length':
                    if (strlen($value) < $ruleValue) {
                        throw new \InvalidArgumentException("Minimum length is {$ruleValue} characters");
                    }
                    break;
                    
                case 'max_length':
                    if (strlen($value) > $ruleValue) {
                        throw new \InvalidArgumentException("Maximum length is {$ruleValue} characters");
                    }
                    break;
                    
                case 'min_value':
                    if (is_numeric($value) && $value < $ruleValue) {
                        throw new \InvalidArgumentException("Minimum value is {$ruleValue}");
                    }
                    break;
                    
                case 'max_value':
                    if (is_numeric($value) && $value > $ruleValue) {
                        throw new \InvalidArgumentException("Maximum value is {$ruleValue}");
                    }
                    break;
                    
                case 'pattern':
                    if (!preg_match($ruleValue, $value)) {
                        throw new \InvalidArgumentException('Value format is invalid');
                    }
                    break;
            }
        }
    }

    /**
     * Clear attribute-related cache
     */
    private function clearAttributeCache(): void
    {
        Cache::delete('yatra_frontend_attributes');
        Cache::delete('yatra_filterable_attributes');
        
        // Clear search cache by prefix
        Cache::clearByPrefix('yatra_search_attributes_');
    }

    /**
     * Clear trip attribute cache
     */
    private function clearTripAttributeCache(int $tripId): void
    {
        Cache::delete("yatra_trip_attributes_{$tripId}");
    }

    /**
     * Bulk update trip attributes
     */
    public function bulkUpdateTripAttributes(int $tripId, array $attributes): bool
    {
        try {
            if (!$tripId || empty($attributes)) {
                error_log("Yatra AttributeService: bulkUpdateTripAttributes - INVALID INPUT: trip_id={$tripId}, attributes=" . json_encode($attributes));
                return false;
            }

            error_log("Yatra AttributeService: bulkUpdateTripAttributes - START: trip_id={$tripId}, attribute_count=" . count($attributes));

            // Use repository layer for transaction handling
            $success = $this->tripAttributeRepository->saveTripAttributes($tripId, $attributes);
            
            if ($success) {
                error_log("Yatra AttributeService: bulkUpdateTripAttributes - COMMIT SUCCESS");
                
                // Fire bulk update hook
                do_action('yatra_trip_attributes_bulk_updated', $tripId, $attributes);
                
                // Clear cache
                $this->clearTripAttributeCache($tripId);
            } else {
                error_log("Yatra AttributeService: bulkUpdateTripAttributes - FAILED");
            }
            
            error_log("Yatra AttributeService: bulkUpdateTripAttributes - FINAL RESULT: " . var_export($success, true));
            return $success;
            
        } catch (\Exception $e) {
            Logger::error("Failed to bulk update trip attributes: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if slug already exists
     */
    public function slugExists(string $slug, ?int $excludeId = null): bool
    {
        try {
            return $this->attributeRepository->slugExists($slug, $excludeId);
        } catch (\Exception $e) {
            Logger::error('Error checking slug existence: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get status counts for attributes
     */
    public function getStatusCounts(): array
    {
        $counts = $this->attributeRepository->getStatusCounts();

        $publish = $counts['publish'] ?? 0;
        $draft = $counts['draft'] ?? 0;
        $trash = $counts['trash'] ?? 0;
        
        // Calculate total from all statuses, not just the main three
        $all = array_sum(array_values($counts));

        $result = [
            'all' => (int) $all,
            'publish' => (int) $publish,
            'draft' => (int) $draft,
            'trash' => (int) $trash,
        ];

        return $result;
    }
}
