<?php

declare(strict_types=1);

namespace Yatra\Models;

/**
 * Discount Model
 * Represents a discount coupon entity
 */
class Discount
{
    public int $id;
    public string $code;
    public string $description;
    public string $type; // 'percentage' | 'fixed'
    public float $amount;
    public ?float $max_discount_amount;
    public int $usage_limit;
    public int $usage_limit_per_customer;
    public int $usage_count;
    public ?string $valid_from;
    public ?string $expiry_date;
    public string $status; // 'active' | 'inactive' | 'expired'
    public string $applicable_to; // 'all' | 'specific_trips'
    public ?array $trip_ids; // Array of trip IDs
    public ?float $min_amount;
    public bool $first_time_customer_only;
    public bool $is_group_discount;
    public ?int $min_group_size;
    public ?int $max_group_size; // DEPRECATED - kept for backward compatibility
    public ?string $group_discount_type; // DEPRECATED - kept for backward compatibility
    public ?float $group_discount_amount; // DEPRECATED - kept for backward compatibility
    public ?string $group_discount_mode; // 'total' | 'category_based' - DEPRECATED, replaced by ranges
    public ?array $category_discounts; // DEPRECATED - replaced by ranges

    // New: Multiple group size ranges
    public ?array $group_discount_ranges; // JSON array of ranges with different rates
    public string $created_at;
    public string $updated_at;
    public int $created_by;
    public int $updated_by;

    public static function fromArray(array $data): self
    {
        $discount = new self();
        
        $discount->id = (int) ($data['id'] ?? 0);
        $discount->code = $data['code'] ?? '';
        $discount->description = $data['description'] ?? '';
        $discount->type = $data['type'] ?? 'percentage';
        $discount->amount = (float) ($data['amount'] ?? 0);
        $discount->max_discount_amount = isset($data['max_discount_amount']) ? (float) $data['max_discount_amount'] : null;
        $discount->usage_limit = (int) ($data['usage_limit'] ?? 0);
        $discount->usage_limit_per_customer = (int) ($data['usage_limit_per_customer'] ?? 0);
        $discount->usage_count = (int) ($data['usage_count'] ?? 0);
        $discount->valid_from = $data['valid_from'] ?? null;
        $discount->expiry_date = $data['expiry_date'] ?? null;
        $discount->status = $data['status'] ?? 'active';
        $discount->applicable_to = $data['applicable_to'] ?? 'all';
        if (!isset($data['trip_ids']) || $data['trip_ids'] === '' || $data['trip_ids'] === null) {
            $discount->trip_ids = null;
        } elseif (is_array($data['trip_ids'])) {
            $discount->trip_ids = $data['trip_ids'];
        } elseif (is_string($data['trip_ids'])) {
            $raw = trim($data['trip_ids']);
            if ($raw !== '' && ($raw[0] === '[' || $raw[0] === '{')) {
                $decoded = json_decode($raw, true);
                $discount->trip_ids = is_array($decoded) ? $decoded : null;
            } else {
                $unser = maybe_unserialize($data['trip_ids']);
                $discount->trip_ids = is_array($unser) ? $unser : array_values(array_filter(array_map('trim', explode(',', $raw))));
            }
        } else {
            $discount->trip_ids = null;
        }
        $discount->min_amount = isset($data['min_amount']) ? (float) $data['min_amount'] : null;
        $discount->first_time_customer_only = (bool) ($data['first_time_customer_only'] ?? false);
        $discount->is_group_discount = (bool) ($data['is_group_discount'] ?? false);
        $discount->min_group_size = isset($data['min_group_size']) ? (int) $data['min_group_size'] : null;
        $discount->max_group_size = isset($data['max_group_size']) ? (int) $data['max_group_size'] : null;
        $discount->group_discount_type = $data['group_discount_type'] ?? null;
        $discount->group_discount_amount = isset($data['group_discount_amount']) ? (float) $data['group_discount_amount'] : null;
        $discount->group_discount_mode = $data['group_discount_mode'] ?? 'total';
        $discount->category_discounts = isset($data['category_discounts']) ? 
            (is_array($data['category_discounts']) ? $data['category_discounts'] : json_decode($data['category_discounts'], true)) : null;
        
        // New: Group discount ranges
        $discount->group_discount_ranges = isset($data['group_discount_ranges']) ?
            (is_array($data['group_discount_ranges']) ? $data['group_discount_ranges'] : json_decode($data['group_discount_ranges'], true)) : null;
        
        $discount->created_at = $data['created_at'] ?? '';
        $discount->updated_at = $data['updated_at'] ?? '';
        $discount->created_by = (int) ($data['created_by'] ?? 0);
        $discount->updated_by = (int) ($data['updated_by'] ?? 0);

        return $discount;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'description' => $this->description,
            'type' => $this->type,
            'amount' => $this->amount,
            'max_discount_amount' => $this->max_discount_amount,
            'usage_limit' => $this->usage_limit,
            'usage_limit_per_customer' => $this->usage_limit_per_customer,
            'usage_count' => $this->usage_count,
            'valid_from' => $this->valid_from,
            'expiry_date' => $this->expiry_date,
            'status' => $this->status,
            'applicable_to' => $this->applicable_to,
            'trip_ids' => $this->trip_ids,
            'min_amount' => $this->min_amount,
            'first_time_customer_only' => $this->first_time_customer_only,
            'is_group_discount' => $this->is_group_discount,
            'min_group_size' => $this->min_group_size,
            'max_group_size' => $this->max_group_size,
            'group_discount_type' => $this->group_discount_type,
            'group_discount_amount' => $this->group_discount_amount,
            'group_discount_mode' => $this->group_discount_mode,
            'category_discounts' => $this->category_discounts,
            'group_discount_ranges' => $this->group_discount_ranges,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
        ];
    }
}

