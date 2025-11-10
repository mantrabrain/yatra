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

        $allowed_statuses = ['draft', 'publish', 'trash'];
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
            $allowed_statuses = ['draft', 'publish', 'trash'];
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

        if (isset($data['is_group_discount'])) {
            $data['is_group_discount'] = (bool) $data['is_group_discount'];
            
            // If group discount is disabled, clear all group discount fields
            if (!$data['is_group_discount']) {
                $data['min_group_size'] = null;
                $data['group_discount_type'] = null;
                $data['group_discount_amount'] = null;
            } else {
                // Only process group discount fields if enabled
                if (isset($data['min_group_size'])) {
                    $data['min_group_size'] = !empty($data['min_group_size']) ? absint($data['min_group_size']) : null;
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
            }
        } else {
            // If is_group_discount is not set, default to false and clear fields
            $data['is_group_discount'] = false;
            $data['min_group_size'] = null;
            $data['group_discount_type'] = null;
            $data['group_discount_amount'] = null;
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
            $allowed_statuses = ['draft', 'publish', 'trash'];
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

        if (isset($data['is_group_discount'])) {
            $data['is_group_discount'] = (bool) $data['is_group_discount'];
            
            // If group discount is disabled, clear all group discount fields
            if (!$data['is_group_discount']) {
                $data['min_group_size'] = null;
                $data['group_discount_type'] = null;
                $data['group_discount_amount'] = null;
            } else {
                // Only process group discount fields if enabled
                if (isset($data['min_group_size'])) {
                    $data['min_group_size'] = !empty($data['min_group_size']) ? absint($data['min_group_size']) : null;
                }

                if (isset($data['group_discount_type'])) {
                    $allowed_types = ['percentage', 'fixed'];
                    $data['group_discount_type'] = in_array($data['group_discount_type'], $allowed_types, true) ? $data['group_discount_type'] : 'percentage';
                }

                if (isset($data['group_discount_amount'])) {
                    $data['group_discount_amount'] = !empty($data['group_discount_amount']) ? (float) $data['group_discount_amount'] : null;
                }
            }
        } else {
            // If is_group_discount is not set, default to false and clear fields
            $data['is_group_discount'] = false;
            $data['min_group_size'] = null;
            $data['group_discount_type'] = null;
            $data['group_discount_amount'] = null;
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
            $allowed_statuses = ['draft', 'publish', 'trash'];
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
            $allowed_statuses = ['draft', 'publish', 'trash'];
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
}

