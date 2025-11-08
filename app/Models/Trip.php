<?php

declare(strict_types=1);

namespace Yatra\Models;

/**
 * Trip Model
 * Represents a trip/tour entity
 */
class Trip
{
    /**
     * @var int
     */
    public int $id;

    /**
     * @var string
     */
    public string $title;

    /**
     * @var string
     */
    public string $slug;

    /**
     * @var string
     */
    public string $description;

    /**
     * @var float
     */
    public float $price;

    /**
     * @var string
     */
    public string $status;

    /**
     * @var string
     */
    public string $created_at;

    /**
     * @var string
     */
    public string $updated_at;

    /**
     * Create from array
     */
    public static function fromArray(array $data): self
    {
        $trip = new self();
        
        $trip->id = (int) ($data['id'] ?? 0);
        $trip->title = $data['title'] ?? '';
        $trip->slug = $data['slug'] ?? '';
        $trip->description = $data['description'] ?? '';
        $trip->price = (float) ($data['price'] ?? 0);
        $trip->status = $data['status'] ?? 'draft';
        $trip->created_at = $data['created_at'] ?? '';
        $trip->updated_at = $data['updated_at'] ?? '';

        return $trip;
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => $this->price,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

