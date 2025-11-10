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
    public ?string $group_discount_type; // 'percentage' | 'fixed'
    public ?float $group_discount_amount;
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
        $discount->trip_ids = isset($data['trip_ids']) ? (is_array($data['trip_ids']) ? $data['trip_ids'] : maybe_unserialize($data['trip_ids'])) : null;
        $discount->min_amount = isset($data['min_amount']) ? (float) $data['min_amount'] : null;
        $discount->first_time_customer_only = (bool) ($data['first_time_customer_only'] ?? false);
        $discount->is_group_discount = (bool) ($data['is_group_discount'] ?? false);
        $discount->min_group_size = isset($data['min_group_size']) ? (int) $data['min_group_size'] : null;
        $discount->group_discount_type = $data['group_discount_type'] ?? null;
        $discount->group_discount_amount = isset($data['group_discount_amount']) ? (float) $data['group_discount_amount'] : null;
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
            'group_discount_type' => $this->group_discount_type,
            'group_discount_amount' => $this->group_discount_amount,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
        ];
    }
}

