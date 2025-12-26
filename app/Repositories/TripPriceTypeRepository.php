<?php

namespace Yatra\Repositories;

class TripPriceTypeRepository extends BaseRepository
{
    /**
     * Get price types for a trip with category information
     * 
     * @param int $tripId Trip ID
     * @return array Array of price type objects with category info
     */
    public function getByTripId(int $tripId): array
    {
        // Using hardcoded table names since there's no dedicated repository for these tables
        $priceTypesTable = $this->wpdb->prefix . 'yatra_trip_price_types';
        $categoriesTable = $this->wpdb->prefix . 'yatra_traveler_categories';
        
        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT pt.*, tc.label as category_label, tc.slug as category_slug, tc.age_min, tc.age_max
             FROM {$priceTypesTable} pt
             LEFT JOIN {$categoriesTable} tc ON pt.category_id = tc.id
             WHERE pt.trip_id = %d
             ORDER BY pt.id ASC",
            $tripId
        ));
    }

    /**
     * Get table name for price types
     * 
     * @return string Table name
     */
    protected function getTableName(): string
    {
        return $this->wpdb->prefix . 'yatra_trip_price_types';
    }

    /**
     * Get price range for a trip
     * 
     * @param int $tripId Trip ID
     * @return array ['min_price' => float, 'max_price' => float]
     */
    public function getPriceRangeByTripId(int $tripId): array
    {
        $table = esc_sql($this->getTableName());
        
        $row = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT
                MIN(CAST(COALESCE(adult_price, 0) AS DECIMAL(10,2))) as min_price,
                MAX(CAST(COALESCE(adult_price, 0) AS DECIMAL(10,2))) as max_price
             FROM {$table}
             WHERE trip_id = %d
             AND adult_price IS NOT NULL
             AND adult_price > 0",
            $tripId
        ));

        if (!$row) {
            return ['min_price' => 0, 'max_price' => 0];
        }

        return [
            'min_price' => (float) $row->min_price,
            'max_price' => (float) $row->max_price
        ];
    }
}
