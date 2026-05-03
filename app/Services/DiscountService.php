<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\DiscountRepository;

/**
 * Discount Service
 * Contains business logic for discounts
 */
class DiscountService extends BaseService
{
    private DiscountRepository $repository;

    public function __construct()
    {
        $this->repository = new DiscountRepository();
    }

    protected function getRepository(): DiscountRepository
    {
        return $this->repository;
    }

    /**
     * Get group discounts applicable to a specific trip
     * 
     * @param int $tripId The trip ID
     * @return array Array of group discount objects
     */
    public function getGroupDiscountsForTrip(int $tripId): array
    {
        global $wpdb;
        $table = \Yatra\Database\Tables\DiscountsTable::getTableName();
        $today = date('Y-m-d H:i:s');

        // Query for active group discounts
        // Check both is_group_discount=1 OR discount_mode IN ('group', 'both') for backward compatibility
        $query = $wpdb->prepare(
            "SELECT * FROM `{$table}` 
            WHERE (is_group_discount = 1 OR discount_mode IN ('group', 'both'))
            AND status IN ('publish', 'active')
            AND (valid_from IS NULL OR valid_from <= %s)
            AND (expiry_date IS NULL OR expiry_date >= %s)
            ORDER BY created_at DESC",
            $today,
            $today
        );
        
        $results = $wpdb->get_results($query);
        
        // Filter by trip_ids in PHP since it's stored as serialized array
        $filtered = [];
        foreach ($results as $discount) {
            $applicable = (string) ($discount->applicable_to ?? 'all');
            if ($applicable === '' || $applicable === 'all') {
                $filtered[] = $discount;
                continue;
            }
            if ($applicable !== 'specific_trips') {
                continue;
            }

            // specific_trips: include only when this trip is in the configured list
            $rawIds = $discount->trip_ids;
            $trip_ids = [];
            if (is_string($rawIds) && $rawIds !== '') {
                $t = trim($rawIds);
                if ($t !== '' && ($t[0] === '[' || $t[0] === '{')) {
                    $decoded = json_decode($t, true);
                    $trip_ids = is_array($decoded) ? $decoded : [];
                } else {
                    $unser = maybe_unserialize($rawIds);
                    $trip_ids = is_array($unser) ? $unser : array_map('trim', explode(',', $t));
                }
            } elseif (is_array($rawIds)) {
                $trip_ids = $rawIds;
            }
            $trip_ids = array_values(array_unique(array_map('absint', $trip_ids)));
            if (in_array($tripId, $trip_ids, true)) {
                $filtered[] = $discount;
            }
        }
        
        return $filtered;
    }

    protected function validate(array $data, ?int $id = null): void
    {
        if (empty($data['code'])) {
            throw new \InvalidArgumentException('Discount code is required');
        }

        // Check code uniqueness (excluding current ID if updating)
        $existing = $this->repository->findByCode($data['code']);
        if ($existing && (int) $existing->id !== $id) {
            throw new \InvalidArgumentException('Discount code already exists');
        }

        $allowed_types = ['percentage', 'fixed'];
        if (isset($data['type']) && !in_array($data['type'], $allowed_types, true)) {
            throw new \InvalidArgumentException('Invalid discount type. Must be one of: ' . implode(', ', $allowed_types));
        }

        $allowed_statuses = ['draft', 'publish', 'trash', 'expired'];
        if (isset($data['status']) && !in_array($data['status'], $allowed_statuses, true)) {
            throw new \InvalidArgumentException('Invalid status. Must be one of: ' . implode(', ', $allowed_statuses));
        }

        $allowed_applicable_to = ['all', 'specific_trips'];
        if (isset($data['applicable_to']) && !in_array($data['applicable_to'], $allowed_applicable_to, true)) {
            throw new \InvalidArgumentException('Invalid applicable_to. Must be one of: ' . implode(', ', $allowed_applicable_to));
        }

        if (isset($data['amount']) && (float) $data['amount'] < 0) {
            throw new \InvalidArgumentException('Discount amount cannot be negative');
        }
    }

    protected function processBeforeCreate(array $data): array
    {
        if (isset($data['code'])) {
            $data['code'] = strtoupper(sanitize_text_field($data['code']));
        }

        if (isset($data['description'])) {
            $data['description'] = sanitize_textarea_field($data['description']);
        }

        if (isset($data['type'])) {
            $allowed_types = ['percentage', 'fixed'];
            $data['type'] = in_array($data['type'], $allowed_types, true) ? $data['type'] : 'percentage';
        } else {
            $data['type'] = 'percentage';
        }

        if (isset($data['amount'])) {
            $data['amount'] = (float) $data['amount'];
        } else {
            $data['amount'] = 0.0;
        }

        if (isset($data['max_discount_amount'])) {
            $data['max_discount_amount'] = !empty($data['max_discount_amount']) ? (float) $data['max_discount_amount'] : null;
        }

        if (isset($data['usage_limit'])) {
            $data['usage_limit'] = absint($data['usage_limit']);
        } else {
            $data['usage_limit'] = 0;
        }

        if (isset($data['usage_limit_per_customer'])) {
            $data['usage_limit_per_customer'] = absint($data['usage_limit_per_customer']);
        } else {
            $data['usage_limit_per_customer'] = 0;
        }

        if (isset($data['valid_from']) && !empty($data['valid_from'])) {
            $data['valid_from'] = sanitize_text_field($data['valid_from']);
        } else {
            $data['valid_from'] = null;
        }

        if (isset($data['expiry_date']) && !empty($data['expiry_date'])) {
            $data['expiry_date'] = sanitize_text_field($data['expiry_date']);
        } else {
            $data['expiry_date'] = null;
        }

        if (isset($data['status'])) {
            $allowed_statuses = ['draft', 'publish', 'trash', 'expired'];
            $data['status'] = in_array($data['status'], $allowed_statuses, true) ? $data['status'] : 'draft';
        } else {
            $data['status'] = 'draft';
        }

        if (isset($data['applicable_to'])) {
            $allowed_applicable_to = ['all', 'specific_trips'];
            $data['applicable_to'] = in_array($data['applicable_to'], $allowed_applicable_to, true) ? $data['applicable_to'] : 'all';
        } else {
            $data['applicable_to'] = 'all';
        }

        if (isset($data['trip_ids']) && is_array($data['trip_ids'])) {
            $trip_ids = array_map('absint', $data['trip_ids']);
            $data['trip_ids'] = maybe_serialize($trip_ids);
        } elseif (isset($data['trip_ids'])) {
            $data['trip_ids'] = maybe_serialize([]);
        } else {
            $data['trip_ids'] = null;
        }

        if (isset($data['min_amount'])) {
            $data['min_amount'] = !empty($data['min_amount']) ? (float) $data['min_amount'] : null;
        }

        if (isset($data['first_time_customer_only'])) {
            $data['first_time_customer_only'] = (bool) $data['first_time_customer_only'];
        } else {
            $data['first_time_customer_only'] = false;
        }

        // Handle discount_mode (promo, group, or both)
        if (isset($data['discount_mode'])) {
            $allowed_modes = ['promo', 'group', 'both'];
            $data['discount_mode'] = in_array($data['discount_mode'], $allowed_modes, true) ? $data['discount_mode'] : 'both';
            
            // If discount_mode is 'group', ensure is_group_discount is true
            if ($data['discount_mode'] === 'group') {
                $data['is_group_discount'] = true;
            }
        } else {
            $data['discount_mode'] = 'both';
        }

        if (isset($data['is_group_discount'])) {
            $data['is_group_discount'] = (bool) $data['is_group_discount'];
            
            // If group discount is disabled, clear all group discount fields
            if (!$data['is_group_discount']) {
                $data['min_group_size'] = null;
                $data['max_group_size'] = null;
                $data['group_discount_type'] = null;
                $data['group_discount_amount'] = null;
                $data['group_discount_mode'] = null;
                $data['category_discounts'] = null;
            } else {
                // Only process group discount fields if enabled
                if (isset($data['min_group_size'])) {
                    $data['min_group_size'] = !empty($data['min_group_size']) ? absint($data['min_group_size']) : null;
                }

                if (isset($data['max_group_size'])) {
                    $data['max_group_size'] = !empty($data['max_group_size']) ? absint($data['max_group_size']) : null;
                }

                // Validate min/max group size logic
                if ($data['min_group_size'] && $data['max_group_size'] && $data['min_group_size'] >= $data['max_group_size']) {
                    throw new \InvalidArgumentException('Minimum group size must be less than maximum group size');
                }

                if (isset($data['group_discount_type'])) {
                    $allowed_types = ['percentage', 'fixed'];
                    $data['group_discount_type'] = in_array($data['group_discount_type'], $allowed_types, true) ? $data['group_discount_type'] : 'percentage';
                } else {
                    $data['group_discount_type'] = 'percentage';
                }

                if (isset($data['group_discount_amount'])) {
                    $data['group_discount_amount'] = !empty($data['group_discount_amount']) ? (float) $data['group_discount_amount'] : null;
                }

                if (isset($data['group_discount_mode'])) {
                    $allowed_modes = ['total', 'category_based'];
                    $data['group_discount_mode'] = in_array($data['group_discount_mode'], $allowed_modes, true) ? $data['group_discount_mode'] : 'total';
                } else {
                    $data['group_discount_mode'] = 'total';
                }

                // Process group discount ranges (for total mode)
                if (isset($data['group_discount_ranges']) && is_array($data['group_discount_ranges'])) {
                    $processedRanges = [];
                    $minGroupSizeFromRanges = null;
                    foreach ($data['group_discount_ranges'] as $range) {
                        if (!is_array($range)) continue;
                        
                        $allowed_types = ['percentage', 'fixed'];
                        $discountType = isset($range['discount_type']) && in_array($range['discount_type'], $allowed_types, true) 
                            ? $range['discount_type'] 
                            : 'percentage';
                        
                        $discountAmount = isset($range['discount_amount']) ? (float) $range['discount_amount'] : 0;
                        if ($discountAmount < 0) {
                            throw new \InvalidArgumentException('Group discount amount cannot be negative');
                        }
                        
                        $rangeMinSize = isset($range['min_group_size']) && $range['min_group_size'] !== '' ? absint($range['min_group_size']) : null;
                        
                        // Track the minimum group size from all ranges
                        if ($rangeMinSize !== null && ($minGroupSizeFromRanges === null || $rangeMinSize < $minGroupSizeFromRanges)) {
                            $minGroupSizeFromRanges = $rangeMinSize;
                        }
                        
                        $processedRanges[] = [
                            'id' => sanitize_text_field($range['id'] ?? uniqid()),
                            'min_group_size' => $rangeMinSize,
                            'max_group_size' => isset($range['max_group_size']) && $range['max_group_size'] !== '' ? absint($range['max_group_size']) : null,
                            'discount_type' => $discountType,
                            'discount_amount' => $discountAmount,
                            'categories' => $range['categories'] ?? []
                        ];
                    }
                    $data['group_discount_ranges'] = !empty($processedRanges) ? json_encode($processedRanges) : null;
                    
                    // Set min_group_size from ranges if not already set (for backward compatibility with frontend query)
                    if ($minGroupSizeFromRanges !== null && empty($data['min_group_size'])) {
                        $data['min_group_size'] = $minGroupSizeFromRanges;
                    }
                } elseif (isset($data['group_discount_ranges'])) {
                    $data['group_discount_ranges'] = null;
                }

                // Process category discounts (new format with traveler categories and ranges)
                if (isset($data['category_discounts']) && is_array($data['category_discounts'])) {
                    $processedCategories = [];
                    foreach ($data['category_discounts'] as $categoryData) {
                        // New format: {traveler_category_id, traveler_category_label, ranges: [...]}
                        if (is_array($categoryData) && isset($categoryData['traveler_category_id'])) {
                            $processedCategory = [
                                'traveler_category_id' => sanitize_text_field($categoryData['traveler_category_id']),
                                'traveler_category_label' => sanitize_text_field($categoryData['traveler_category_label'] ?? ''),
                                'ranges' => []
                            ];
                            
                            // Process ranges for this category
                            if (isset($categoryData['ranges']) && is_array($categoryData['ranges'])) {
                                foreach ($categoryData['ranges'] as $range) {
                                    if (!is_array($range)) continue;
                                    
                                    $allowed_types = ['percentage', 'fixed'];
                                    $discountType = isset($range['discount_type']) && in_array($range['discount_type'], $allowed_types, true) 
                                        ? $range['discount_type'] 
                                        : 'percentage';
                                    
                                    $discountAmount = isset($range['discount_amount']) ? (float) $range['discount_amount'] : 0;
                                    if ($discountAmount < 0) {
                                        throw new \InvalidArgumentException('Category discount amount cannot be negative');
                                    }
                                    
                                    $processedCategory['ranges'][] = [
                                        'id' => sanitize_text_field($range['id'] ?? uniqid()),
                                        'min_group_size' => isset($range['min_group_size']) && $range['min_group_size'] !== '' ? absint($range['min_group_size']) : null,
                                        'max_group_size' => isset($range['max_group_size']) && $range['max_group_size'] !== '' ? absint($range['max_group_size']) : null,
                                        'discount_type' => $discountType,
                                        'discount_amount' => $discountAmount
                                    ];
                                }
                            }
                            
                            $processedCategories[] = $processedCategory;
                        }
                        // Legacy format support: {category => {type, amount}}
                        elseif (is_array($categoryData) && isset($categoryData['type']) && isset($categoryData['amount'])) {
                            $allowed_types = ['percentage', 'fixed'];
                            if (!in_array($categoryData['type'], $allowed_types, true)) {
                                throw new \InvalidArgumentException('Invalid category discount type');
                            }
                            if ((float) $categoryData['amount'] < 0) {
                                throw new \InvalidArgumentException('Category discount amount cannot be negative');
                            }
                            $processedCategories[] = $categoryData;
                        }
                    }
                    $data['category_discounts'] = !empty($processedCategories) ? json_encode($processedCategories) : null;
                } elseif (isset($data['category_discounts'])) {
                    $data['category_discounts'] = null;
                }
            }
        } else {
            // If is_group_discount is not set, default to false and clear fields
            $data['is_group_discount'] = false;
            $data['min_group_size'] = null;
            $data['max_group_size'] = null;
            $data['group_discount_type'] = null;
            $data['group_discount_amount'] = null;
            $data['group_discount_mode'] = null;
            $data['category_discounts'] = null;
        }

        $current_user_id = get_current_user_id();
        $data['created_by'] = absint($current_user_id);
        $data['updated_by'] = absint($current_user_id);
        $data['usage_count'] = 0; // Always start at 0

        return $data;
    }

    protected function processBeforeUpdate(int $id, array $data): array
    {
        if (isset($data['code'])) {
            $data['code'] = strtoupper(sanitize_text_field($data['code']));
        }

        if (isset($data['description'])) {
            $data['description'] = sanitize_textarea_field($data['description']);
        }

        if (isset($data['type'])) {
            $allowed_types = ['percentage', 'fixed'];
            $data['type'] = in_array($data['type'], $allowed_types, true) ? $data['type'] : 'percentage';
        }

        if (isset($data['amount'])) {
            $data['amount'] = (float) $data['amount'];
        }

        if (isset($data['max_discount_amount'])) {
            $data['max_discount_amount'] = !empty($data['max_discount_amount']) ? (float) $data['max_discount_amount'] : null;
        }

        if (isset($data['usage_limit'])) {
            $data['usage_limit'] = absint($data['usage_limit']);
        }

        if (isset($data['usage_limit_per_customer'])) {
            $data['usage_limit_per_customer'] = absint($data['usage_limit_per_customer']);
        }

        if (isset($data['valid_from']) && !empty($data['valid_from'])) {
            $data['valid_from'] = sanitize_text_field($data['valid_from']);
        } elseif (isset($data['valid_from']) && empty($data['valid_from'])) {
            $data['valid_from'] = null;
        }

        if (isset($data['expiry_date']) && !empty($data['expiry_date'])) {
            $data['expiry_date'] = sanitize_text_field($data['expiry_date']);
        } elseif (isset($data['expiry_date']) && empty($data['expiry_date'])) {
            $data['expiry_date'] = null;
        }

        if (isset($data['status'])) {
            $allowed_statuses = ['draft', 'publish', 'trash', 'expired'];
            $data['status'] = in_array($data['status'], $allowed_statuses, true) ? $data['status'] : 'draft';
        }

        if (isset($data['applicable_to'])) {
            $allowed_applicable_to = ['all', 'specific_trips'];
            $data['applicable_to'] = in_array($data['applicable_to'], $allowed_applicable_to, true) ? $data['applicable_to'] : 'all';
        }

        if (isset($data['trip_ids']) && is_array($data['trip_ids'])) {
            $trip_ids = array_map('absint', $data['trip_ids']);
            $data['trip_ids'] = maybe_serialize($trip_ids);
        } elseif (isset($data['trip_ids']) && empty($data['trip_ids'])) {
            $data['trip_ids'] = null;
        }

        if (isset($data['min_amount'])) {
            $data['min_amount'] = !empty($data['min_amount']) ? (float) $data['min_amount'] : null;
        }

        if (isset($data['first_time_customer_only'])) {
            $data['first_time_customer_only'] = (bool) $data['first_time_customer_only'];
        }

        // Handle discount_mode (promo, group, or both)
        if (isset($data['discount_mode'])) {
            $allowed_modes = ['promo', 'group', 'both'];
            $data['discount_mode'] = in_array($data['discount_mode'], $allowed_modes, true) ? $data['discount_mode'] : 'both';
            
            // If discount_mode is 'group', ensure is_group_discount is true
            if ($data['discount_mode'] === 'group') {
                $data['is_group_discount'] = true;
            }
        }

        if (isset($data['is_group_discount'])) {
            $data['is_group_discount'] = (bool) $data['is_group_discount'];
            
            // If group discount is disabled, clear all group discount fields
            if (!$data['is_group_discount']) {
                $data['min_group_size'] = null;
                $data['max_group_size'] = null;
                $data['group_discount_type'] = null;
                $data['group_discount_amount'] = null;
                $data['group_discount_mode'] = null;
                $data['category_discounts'] = null;
            } else {
                // Only process group discount fields if enabled
                if (isset($data['min_group_size'])) {
                    $data['min_group_size'] = !empty($data['min_group_size']) ? absint($data['min_group_size']) : null;
                }

                if (isset($data['max_group_size'])) {
                    $data['max_group_size'] = !empty($data['max_group_size']) ? absint($data['max_group_size']) : null;
                }

                // Validate min/max group size logic
                if ($data['min_group_size'] && $data['max_group_size'] && $data['min_group_size'] >= $data['max_group_size']) {
                    throw new \InvalidArgumentException('Minimum group size must be less than maximum group size');
                }

                if (isset($data['group_discount_type'])) {
                    $allowed_types = ['percentage', 'fixed'];
                    $data['group_discount_type'] = in_array($data['group_discount_type'], $allowed_types, true) ? $data['group_discount_type'] : 'percentage';
                }

                if (isset($data['group_discount_amount'])) {
                    $data['group_discount_amount'] = !empty($data['group_discount_amount']) ? (float) $data['group_discount_amount'] : null;
                }

                if (isset($data['group_discount_mode'])) {
                    $allowed_modes = ['total', 'category_based'];
                    $data['group_discount_mode'] = in_array($data['group_discount_mode'], $allowed_modes, true) ? $data['group_discount_mode'] : 'total';
                }

                // Process group discount ranges (for total mode)
                if (isset($data['group_discount_ranges']) && is_array($data['group_discount_ranges'])) {
                    $processedRanges = [];
                    foreach ($data['group_discount_ranges'] as $range) {
                        if (!is_array($range)) continue;
                        
                        $allowed_types = ['percentage', 'fixed'];
                        $discountType = isset($range['discount_type']) && in_array($range['discount_type'], $allowed_types, true) 
                            ? $range['discount_type'] 
                            : 'percentage';
                        
                        $discountAmount = isset($range['discount_amount']) ? (float) $range['discount_amount'] : 0;
                        if ($discountAmount < 0) {
                            throw new \InvalidArgumentException('Group discount amount cannot be negative');
                        }
                        
                        $processedRanges[] = [
                            'id' => sanitize_text_field($range['id'] ?? uniqid()),
                            'min_group_size' => isset($range['min_group_size']) && $range['min_group_size'] !== '' ? absint($range['min_group_size']) : null,
                            'max_group_size' => isset($range['max_group_size']) && $range['max_group_size'] !== '' ? absint($range['max_group_size']) : null,
                            'discount_type' => $discountType,
                            'discount_amount' => $discountAmount,
                            'categories' => $range['categories'] ?? []
                        ];
                    }
                    $data['group_discount_ranges'] = !empty($processedRanges) ? json_encode($processedRanges) : null;
                } elseif (isset($data['group_discount_ranges']) && empty($data['group_discount_ranges'])) {
                    $data['group_discount_ranges'] = null;
                }

                // Process category discounts (new format with traveler categories and ranges)
                if (isset($data['category_discounts']) && is_array($data['category_discounts'])) {
                    $processedCategories = [];
                    foreach ($data['category_discounts'] as $categoryData) {
                        // New format: {traveler_category_id, traveler_category_label, ranges: [...]}
                        if (is_array($categoryData) && isset($categoryData['traveler_category_id'])) {
                            $processedCategory = [
                                'traveler_category_id' => sanitize_text_field($categoryData['traveler_category_id']),
                                'traveler_category_label' => sanitize_text_field($categoryData['traveler_category_label'] ?? ''),
                                'ranges' => []
                            ];
                            
                            // Process ranges for this category
                            if (isset($categoryData['ranges']) && is_array($categoryData['ranges'])) {
                                foreach ($categoryData['ranges'] as $range) {
                                    if (!is_array($range)) continue;
                                    
                                    $allowed_types = ['percentage', 'fixed'];
                                    $discountType = isset($range['discount_type']) && in_array($range['discount_type'], $allowed_types, true) 
                                        ? $range['discount_type'] 
                                        : 'percentage';
                                    
                                    $discountAmount = isset($range['discount_amount']) ? (float) $range['discount_amount'] : 0;
                                    if ($discountAmount < 0) {
                                        throw new \InvalidArgumentException('Category discount amount cannot be negative');
                                    }
                                    
                                    $processedCategory['ranges'][] = [
                                        'id' => sanitize_text_field($range['id'] ?? uniqid()),
                                        'min_group_size' => isset($range['min_group_size']) && $range['min_group_size'] !== '' ? absint($range['min_group_size']) : null,
                                        'max_group_size' => isset($range['max_group_size']) && $range['max_group_size'] !== '' ? absint($range['max_group_size']) : null,
                                        'discount_type' => $discountType,
                                        'discount_amount' => $discountAmount
                                    ];
                                }
                            }
                            
                            $processedCategories[] = $processedCategory;
                        }
                        // Legacy format support: {category => {type, amount}}
                        elseif (is_array($categoryData) && isset($categoryData['type']) && isset($categoryData['amount'])) {
                            $allowed_types = ['percentage', 'fixed'];
                            if (!in_array($categoryData['type'], $allowed_types, true)) {
                                throw new \InvalidArgumentException('Invalid category discount type');
                            }
                            if ((float) $categoryData['amount'] < 0) {
                                throw new \InvalidArgumentException('Category discount amount cannot be negative');
                            }
                            $processedCategories[] = $categoryData;
                        }
                    }
                    $data['category_discounts'] = !empty($processedCategories) ? json_encode($processedCategories) : null;
                } elseif (isset($data['category_discounts']) && empty($data['category_discounts'])) {
                    $data['category_discounts'] = null;
                }
            }
        } else {
            // If is_group_discount is not set, keep existing values (don't clear on partial updates)
            // Only clear if explicitly set to false
        }

        $data['updated_by'] = absint(get_current_user_id());

        return $data;
    }

    public function getAll(array $args = []): array
    {
        if (!empty($args['search'])) {
            $search = sanitize_text_field($args['search']);
            return $this->repository->search($search, $args);
        }

        if (!empty($args['status']) && $args['status'] !== 'all') {
            $allowed_statuses = ['draft', 'publish', 'trash', 'expired'];
            $status = in_array($args['status'], $allowed_statuses, true) ? $args['status'] : null;
            if ($status) {
                $args['where']['status'] = $status;
            }
        }

        if (!empty($args['type']) && $args['type'] !== 'all') {
            $allowed_types = ['percentage', 'fixed'];
            $type = in_array($args['type'], $allowed_types, true) ? $args['type'] : null;
            if ($type) {
                $args['where']['type'] = $type;
            }
        }

        return $this->repository->all($args);
    }

    public function count(array $args = []): int
    {
        if (!empty($args['search'])) {
            $search = sanitize_text_field($args['search']);
            $items = $this->repository->search($search, $args);
            return count($items);
        }

        if (!empty($args['status']) && $args['status'] !== 'all') {
            $allowed_statuses = ['draft', 'publish', 'trash', 'expired'];
            $status = in_array($args['status'], $allowed_statuses, true) ? $args['status'] : null;
            if ($status) {
                $args['where']['status'] = $status;
            }
        }

        if (!empty($args['type']) && $args['type'] !== 'all') {
            $allowed_types = ['percentage', 'fixed'];
            $type = in_array($args['type'], $allowed_types, true) ? $args['type'] : null;
            if ($type) {
                $args['where']['type'] = $type;
            }
        }

        return $this->repository->count($args);
    }

    /**
     * Admin toolbar: counts per discount status (stable, unfiltered).
     *
     * @return array{all: int, publish: int, draft: int, trash: int, expired: int}
     */
    public function getAdminStatusCounts(): array
    {
        return $this->repository->getAdminStatusCounts();
    }

    /**
     * Calculate group discounts for booking
     */
    public function calculateGroupDiscounts(array $bookingData): array {
        // Check if Advanced Discount module is enabled - group discounts are a Pro feature
        if (!apply_filters('yatra_advanced_discount_enabled', false)) {
            return [];
        }
        
        $totalTravelers = $this->countTotalTravelers($bookingData);

        // Find applicable group discounts
        $applicableDiscounts = $this->findApplicableGroupDiscounts($bookingData, $totalTravelers);

        $discounts = [];
        foreach ($applicableDiscounts as $discount) {
            $discountAmount = $this->calculateGroupDiscountAmount($discount, $bookingData, $totalTravelers);
            if ($discountAmount > 0) {
                $discounts[] = [
                    'discount_id' => $discount->id,
                    'type' => 'group_discount',
                    'amount' => $discountAmount,
                    'description' => $this->generateGroupDiscountDescription($discount, $totalTravelers),
                    'mode' => $discount->group_discount_mode,
                    'category_breakdown' => $discount->group_discount_mode === 'category_based' ?
                        $this->calculateCategoryBreakdown($discount, $bookingData) : null
                ];
            }
        }

        return $discounts;
    }

    /**
     * Count total billable travelers
     */
    private function countTotalTravelers(array $bookingData): int {
        // Exclude infants from group size calculation (typically free or minimal cost)
        return (
            ($bookingData['travelers']['adults'] ?? 0) +
            ($bookingData['travelers']['children'] ?? 0) +
            ($bookingData['travelers']['seniors'] ?? 0)
        );
    }

    /**
     * Find applicable group discounts for the booking
     */
    private function findApplicableGroupDiscounts(array $bookingData, int $totalTravelers): array {
        return \Yatra\Models\Discount::where('is_group_discount', true)
            ->where('status', 'publish')
            ->where(function($query) use ($bookingData) {
                $query->whereNull('valid_from')
                      ->orWhere('valid_from', '<=', $bookingData['start_date']);
            })
            ->where(function($query) use ($bookingData) {
                $query->whereNull('expiry_date')
                      ->orWhere('expiry_date', '>=', $bookingData['start_date']);
            })
            ->where(function($query) use ($bookingData) {
                $query->where('applicable_to', 'all')
                      ->orWhere(function($subQuery) use ($bookingData) {
                          $subQuery->where('applicable_to', 'specific_trips')
                                   ->whereJsonContains('trip_ids', $bookingData['trip_id']);
                      });
            })
            ->where(function($query) use ($totalTravelers) {
                $query->where(function($subQuery) use ($totalTravelers) {
                    // Check if traveler count falls within any range
                    $subQuery->where(function($rangeQuery) use ($totalTravelers) {
                        // 1-10 range
                        $rangeQuery->where('min_group_size', '<=', $totalTravelers)
                                   ->where(function($maxQuery) {
                                       $maxQuery->whereNull('max_group_size')
                                               ->orWhere('max_group_size', '>=', $totalTravelers);
                                   });
                    });
                });
            })
            ->orderBy('min_group_size', 'desc') // Prefer more restrictive discounts first
            ->get();
    }

    /**
     * Calculate group discount amount based on mode
     */
    private function calculateGroupDiscountAmount($discount, array $bookingData, int $totalTravelers): float {
        if ($discount->group_discount_mode === 'category_based') {
            return $this->calculateCategoryBasedDiscount($discount, $bookingData);
        } else {
            return $this->calculateTotalBasedDiscount($discount, $bookingData['subtotal'] ?? 0);
        }
    }

    /**
     * Calculate total-based group discount
     */
    private function calculateTotalBasedDiscount($discount, float $subtotal): float {
        if ($discount->group_discount_type === 'percentage') {
            $discountAmount = $subtotal * ($discount->group_discount_amount / 100);
        } else {
            $discountAmount = $discount->group_discount_amount;
        }

        return min($discountAmount, $subtotal); // Never exceed subtotal
    }

    /**
     * Calculate category-based group discount
     */
    private function calculateCategoryBasedDiscount($discount, array $bookingData): float {
        $totalDiscount = 0;
        $categoryDiscounts = $discount->category_discounts ?? [];

        foreach ($categoryDiscounts as $category => $discountConfig) {
            $travelerCount = $bookingData['travelers'][$category] ?? 0;
            if ($travelerCount > 0) {
                // Calculate per-person price for this category
                $categoryPrice = $this->calculateCategoryPrice($bookingData, $category);

                if ($discountConfig['type'] === 'percentage') {
                    $categoryDiscount = $categoryPrice * $travelerCount * ($discountConfig['amount'] / 100);
                } else {
                    $categoryDiscount = min($discountConfig['amount'] * $travelerCount, $categoryPrice * $travelerCount);
                }

                $totalDiscount += $categoryDiscount;
            }
        }

        return $totalDiscount;
    }

    /**
     * Calculate price per person for a specific traveler category
     */
    private function calculateCategoryPrice(array $bookingData, string $category): float {
        $basePrice = $bookingData['trip_price'] ?? 0;

        // Apply category multipliers (children might be 80%, seniors 90%, etc.)
        $multipliers = [
            'adults' => 1.0,
            'children' => 0.8,  // 80% of adult price
            'seniors' => 0.9,   // 90% of adult price
        ];

        return $basePrice * ($multipliers[$category] ?? 1.0);
    }

    /**
     * Calculate category breakdown for display
     */
    private function calculateCategoryBreakdown($discount, array $bookingData): array {
        $breakdown = [];
        $categoryDiscounts = $discount->category_discounts ?? [];

        foreach ($categoryDiscounts as $category => $discountConfig) {
            $travelerCount = $bookingData['travelers'][$category] ?? 0;
            if ($travelerCount > 0) {
                $categoryPrice = $this->calculateCategoryPrice($bookingData, $category);
                $totalCategoryPrice = $categoryPrice * $travelerCount;

                if ($discountConfig['type'] === 'percentage') {
                    $discountAmount = $totalCategoryPrice * ($discountConfig['amount'] / 100);
                } else {
                    $discountAmount = min($discountConfig['amount'] * $travelerCount, $totalCategoryPrice);
                }

                $breakdown[$category] = [
                    'traveler_count' => $travelerCount,
                    'original_price' => $totalCategoryPrice,
                    'discount_amount' => $discountAmount,
                    'final_price' => $totalCategoryPrice - $discountAmount,
                    'discount_type' => $discountConfig['type'],
                    'discount_rate' => $discountConfig['amount']
                ];
            }
        }

        return $breakdown;
    }

    /**
     * Generate human-readable discount description
     */
    private function generateGroupDiscountDescription($discount, int $totalTravelers): string {
        $rangeText = $this->formatGroupSizeRange($discount);
        $discountText = $this->formatDiscountAmount($discount);

        if ($discount->group_discount_mode === 'category_based') {
            return "Group discount for {$totalTravelers} travelers ({$rangeText}) - Category-based rates";
        } else {
            return "Group discount for {$totalTravelers} travelers ({$rangeText}): {$discountText}";
        }
    }

    /**
     * Format group size range for display
     */
    private function formatGroupSizeRange($discount): string {
        if ($discount->max_group_size) {
            return "{$discount->min_group_size}-{$discount->max_group_size} people";
        } else {
            return "{$discount->min_group_size}+ people";
        }
    }

    /**
     * Format discount amount for display
     */
    private function formatDiscountAmount($discount): string {
        $amount = $discount->group_discount_amount ?? 0;
        if ($discount->group_discount_type === 'percentage') {
            return "{$amount}% off";
        } else {
            return "$" . number_format((float) $amount, 2) . " off";
        }
    }

    /**
     * @param array $travelerCounts Array of category_id => count (e.g., ['3' => 4, '5' => 1])
     * @param array $priceTypes Array of price type objects with category_id and effective_price
     * @return array|null Discount info or null if no discount applies
     */
    public function calculateGroupDiscount(int $tripId, array $travelerCounts, array $priceTypes = []): ?array
    {
        // Cast tripId to int to ensure type safety
        $tripId = (int) $tripId;
        
        // Check if Advanced Discount module is enabled - group discounts are a Pro feature
        if (!apply_filters('yatra_advanced_discount_enabled', false)) {
            return null;
        }
        
        $groupDiscounts = $this->getGroupDiscountsForTrip($tripId);
        
        if (empty($groupDiscounts)) {
            return null;
        }
        

        $totalTravelers = array_sum(array_map('intval', $travelerCounts));
        
        // Build price lookup by category_id
        $priceByCategory = [];
        foreach ($priceTypes as $pt) {
            $pt = (object) $pt;
            $categoryId = $pt->category_id ?? null;
            if ($categoryId !== null) {
                $priceByCategory[$categoryId] = (float) ($pt->effective_price ?? $pt->sale_price ?? $pt->original_price ?? 0);
            }
        }


        foreach ($groupDiscounts as $discount) {
            $discountMode = $discount->discount_mode ?? 'total';

            // Category-based discounts: check each category's count and apply to that category's subtotal
            if ($discountMode === 'category_based' && !empty($discount->category_discounts)) {
                $totalDiscountAmount = 0;
                $appliedCategories = [];
                
                $categoryDiscounts = $this->decodeStoredList($discount->category_discounts ?? null);
                foreach ($categoryDiscounts as $catDiscount) {
                    $catDiscount = (object) $catDiscount;
                    $categoryId = $catDiscount->traveler_category_id ?? null;
                    if ($categoryId === null) continue;
                    
                    // Get the count for this specific category
                    $categoryCount = (int) ($travelerCounts[$categoryId] ?? 0);
                    if ($categoryCount <= 0) continue;
                    
                    // Check if this category's count falls within any range
                    if (!empty($catDiscount->ranges)) {
                        $ranges = $this->decodeStoredList($catDiscount->ranges ?? null);
                        foreach ($ranges as $range) {
                            $range = (object) $range;
                            $minSize = (int) ($range->min_group_size ?? 0);
                            $maxSize = !empty($range->max_group_size) ? (int) $range->max_group_size : PHP_INT_MAX;
                            
                            if ($categoryCount >= $minSize && $categoryCount <= $maxSize) {
                                $discountType = $range->discount_type ?? 'percentage';
                                $discountValue = (float) ($range->discount_amount ?? 0);
                                
                                // Calculate discount for this category's subtotal only
                                $categoryPrice = $priceByCategory[$categoryId] ?? 0;
                                $categorySubtotal = $categoryPrice * $categoryCount;
                                
                                if ($discountType === 'percentage') {
                                    $categoryDiscount = $categorySubtotal * ($discountValue / 100);
                                } else {
                                    $categoryDiscount = $discountValue;
                                }
                                
                                $totalDiscountAmount += $categoryDiscount;
                                $appliedCategories[] = [
                                    'category_id' => $categoryId,
                                    'category_label' => $catDiscount->traveler_category_label ?? 'Traveler',
                                    'count' => $categoryCount,
                                    'discount_type' => $discountType,
                                    'discount_value' => $discountValue,
                                    'discount_amount' => $categoryDiscount,
                                ];
                                break; // Found matching range for this category
                            }
                        }
                    }
                }
                
                if ($totalDiscountAmount > 0) {
                    // Build label with discount info from applied categories
                    $discountInfo = '';
                    if (!empty($appliedCategories)) {
                        $firstCat = $appliedCategories[0];
                        if ($firstCat['discount_type'] === 'percentage') {
                            $discountInfo = sprintf(__('Group Discount (%s%%)', 'yatra'), $firstCat['discount_value']);
                        } else {
                            $discountInfo = sprintf(__('Group Discount (%s)', 'yatra'), yatra_format_price($firstCat['discount_value']));
                        }
                    } else {
                        $discountInfo = __('Group Discount', 'yatra');
                    }
                    
                    return [
                        'type' => 'category_based',
                        'amount' => round($totalDiscountAmount, 2),
                        'code' => $discount->code ?? null,
                        'label' => $discountInfo,
                        'applied_categories' => $appliedCategories,
                    ];
                }
            }
            // Total-based discounts: check total travelers and apply to total
            elseif (!empty($discount->group_discount_ranges)) {
                $groupDiscountRanges = $this->decodeStoredList($discount->group_discount_ranges ?? null);
                foreach ($groupDiscountRanges as $range) {
                    $range = (object) $range;
                    $minSize = (int) ($range->min_group_size ?? 0);
                    $maxSize = !empty($range->max_group_size) ? (int) $range->max_group_size : PHP_INT_MAX;
                    
                    if ($totalTravelers >= $minSize && $totalTravelers <= $maxSize) {
                        $discountType = $range->discount_type ?? 'percentage';
                        $discountValue = (float) ($range->discount_amount ?? 0);
                        
                        // Calculate total subtotal from all categories
                        $totalSubtotal = 0;
                        foreach ($travelerCounts as $catId => $count) {
                            $categoryPrice = $priceByCategory[$catId] ?? 0;
                            $totalSubtotal += $categoryPrice * $count;
                        }
                        
                        // Calculate the actual discount amount
                        $calculatedAmount = $discountType === 'percentage' 
                            ? $totalSubtotal * ($discountValue / 100)
                            : $discountValue;
                        
                        return [
                            'type' => $discountType,
                            'value' => $discountValue,
                            'amount' => round($calculatedAmount, 2),
                            'code' => $discount->code ?? null,
                            'label' => $discountType === 'percentage' 
                                ? sprintf(__('Group Discount (%s%%)', 'yatra'), $discountValue)
                                : sprintf(__('Group Discount (%s)', 'yatra'), yatra_format_price($discountValue)),
                        ];
                    }
                }
            } else {
                // Legacy format
                $minSize = (int) ($discount->min_group_size ?? 0);
                $maxSize = !empty($discount->max_group_size) ? (int) $discount->max_group_size : PHP_INT_MAX;
                
                // If min_size is 0 but we have a discount value, this might be a simple discount
                // that applies to any group size >= 2
                if ($minSize === 0 && $discountValue > 0) {
                    $minSize = 2; // Default to minimum 2 travelers for group discount
                }
                
                // Handle different field names for discount type and value
                $discountType = $discount->type ?? $discount->discount_type ?? 'percentage';
                $discountValue = (float) ($discount->amount ?? $discount->discount_amount ?? 0);
                

                if ($totalTravelers >= $minSize && $totalTravelers <= $maxSize) {
                    
                    // Calculate total subtotal from all categories
                    $totalSubtotal = 0;
                    foreach ($travelerCounts as $catId => $count) {
                        $categoryPrice = $priceByCategory[$catId] ?? 0;
                        $totalSubtotal += $categoryPrice * $count;
                    }
                    
                    // Calculate the actual discount amount
                    $calculatedAmount = $discountType === 'percentage' 
                        ? $totalSubtotal * ($discountValue / 100)
                        : $discountValue;
                    
                    return [
                        'type' => $discountType,
                        'value' => $discountValue,
                        'amount' => round($calculatedAmount, 2),
                        'code' => $discount->code ?? null,
                        'label' => $discountType === 'percentage' 
                            ? sprintf(__('Group Discount (%s%%)', 'yatra'), $discountValue)
                            : sprintf(__('Group Discount (%s)', 'yatra'), yatra_format_price($discountValue)),
                    ];
                }
            }
        }

        return null;
    }
    
    /**
     * Calculate coupon discount for booking
     * 
     * @param string $coupon_code Coupon code to apply
     * @param float $subtotal Subtotal amount (after group discount)
     * @param int $trip_id Trip ID
     * @param int $travelers_count Total travelers
     * @param array $traveler_counts Traveler counts by category
     * @return array Coupon discount data with code, type, amount, calculated_amount, label
     */
    public function calculateCouponDiscount(
        string $coupon_code,
        float $subtotal,
        int $trip_id,
        int $travelers_count = 1,
        array $traveler_counts = []
    ): array {
        // Default empty discount
        $default = [
            'code'              => $coupon_code,
            'type'              => '',
            'amount'            => 0,
            'calculated_amount' => 0,
            'label'             => __('Coupon Discount', 'yatra'),
        ];
        
        if (empty($coupon_code)) {
            return $default;
        }
        
        // Find discount by code
        $discount = $this->repository->findByCode($coupon_code);
        
        $status = (string) ($discount->status ?? '');
        // Migrated coupons once used "active"; 3.x uses "publish" for live discounts.
        $isLive = ($status === 'publish' || $status === 'active');
        if (!$discount || !$isLive) {
            return $default;
        }
        
        // Validate coupon
        $validation = $this->validateCoupon($discount, $trip_id, $subtotal, $travelers_count);
        if (!$validation['valid']) {
            return $default;
        }
        
        // Calculate discount amount
        $calculated_discount = 0;
        
        if ($discount->type === 'percentage') {
            $calculated_discount = ($subtotal * (float) $discount->amount) / 100;
        } elseif ($discount->type === 'fixed') {
            $calculated_discount = min((float) $discount->amount, $subtotal);
        }
        
        // Apply max discount cap if set
        if (!empty($discount->max_discount_amount) && $calculated_discount > (float) $discount->max_discount_amount) {
            $calculated_discount = (float) $discount->max_discount_amount;
        }
        
        return [
            'code'              => $coupon_code,
            'type'              => $discount->type,
            'amount'            => (float) $discount->amount,
            'calculated_amount' => round($calculated_discount, 2),
            'label'             => $discount->type === 'percentage' 
                ? sprintf(__('Coupon (%s%%)', 'yatra'), $discount->amount)
                : __('Coupon Discount', 'yatra'),
        ];
    }
    
    /**
     * Decode list-shaped discount DB fields: JSON (current storage), array, or legacy PHP serialized.
     *
     * @param mixed $raw
     * @return array<int|string, mixed>
     */
    private function decodeStoredList($raw): array
    {
        if ($raw === null || $raw === '') {
            return [];
        }
        if (is_array($raw)) {
            return $raw;
        }
        if (is_object($raw)) {
            $asArray = json_decode(wp_json_encode($raw), true);

            return is_array($asArray) ? $asArray : [];
        }
        if (!is_string($raw)) {
            return [];
        }
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return [];
        }
        $first = $trimmed[0];
        if ($first === '[' || $first === '{') {
            $decoded = json_decode($trimmed, true);

            return is_array($decoded) ? $decoded : [];
        }

        $maybe = maybe_unserialize($trimmed);

        return is_array($maybe) ? $maybe : [];
    }

    /**
     * Validate coupon for booking
     * 
     * @param \stdClass $discount Discount object
     * @param int $trip_id Trip ID
     * @param float $total Total amount
     * @param int $travelers_count Travelers count
     * @return array Validation result with 'valid' and 'message'
     */
    private function validateCoupon(\stdClass $discount, int $trip_id, float $total, int $travelers_count): array
    {
        // Check validity dates
        $now = current_time('Y-m-d');
        
        if (!empty($discount->valid_from) && $now < $discount->valid_from) {
            return ['valid' => false, 'message' => __('This coupon is not yet valid.', 'yatra')];
        }
        
        if (!empty($discount->expiry_date) && $now > $discount->expiry_date) {
            return ['valid' => false, 'message' => __('This coupon has expired.', 'yatra')];
        }
        
        // Check usage limit
        if ($discount->usage_limit > 0 && $discount->usage_count >= $discount->usage_limit) {
            return ['valid' => false, 'message' => __('This coupon has reached its usage limit.', 'yatra')];
        }
        
        // Check if applicable to this trip
        if ($discount->applicable_to === 'specific_trips') {
            $trip_ids = is_string($discount->trip_ids) ? maybe_unserialize($discount->trip_ids) : ($discount->trip_ids ?? []);
            if (!empty($trip_ids) && !in_array($trip_id, array_map('intval', $trip_ids), true)) {
                return ['valid' => false, 'message' => __('This coupon is not applicable to this trip.', 'yatra')];
            }
        }
        
        // Check minimum amount
        if (!empty($discount->min_amount) && $total < (float) $discount->min_amount) {
            return [
                'valid' => false, 
                'message' => sprintf(
                    __('Minimum amount of %s required for this coupon.', 'yatra'),
                    yatra_format_price((float) $discount->min_amount)
                )
            ];
        }
        
        return ['valid' => true, 'message' => ''];
    }
}
