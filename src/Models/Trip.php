<?php

declare(strict_types=1);

namespace Yatra\Models;

use Yatra\Core\Model;

/**
 * Trip model for managing travel packages and tours
 */
class Trip extends Model
{
    protected $table = 'yatra_trips';
    
    protected $fillable = [
        'title',
        'slug',
        'description',
        'short_description',
        'featured_image',
        'gallery',
        'duration',
        'duration_type', // days, weeks, months
        'price',
        'sale_price',
        'currency',
        'max_travelers',
        'min_travelers',
        'destination',
        'primary_destination',
        'secondary_destinations',
        'cities_visited',
        'starting_point',
        'ending_point',
        'highlights',
        'time_zones',
        'departure_location',
        'departure_date',
        'return_date',
        'included_services',
        'excluded_services',
        'itinerary',
        'accommodation',
        'transportation',
        'meals',
        'activities',
        'difficulty_level', // easy, moderate, challenging
        'age_requirement',
        'physical_requirement',
        'cancellation_policy',
        'terms_conditions',
        'status', // draft, published, completed, cancelled
        'featured',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'gallery' => 'array',
        'included_services' => 'array',
        'excluded_services' => 'array',
        'itinerary' => 'array',
        'accommodation' => 'array',
        'transportation' => 'array',
        'meals' => 'array',
        'activities' => 'array',
        'secondary_destinations' => 'array',
        'cities_visited' => 'array',
        'highlights' => 'array',
        'featured' => 'boolean',
        'price' => 'float',
        'sale_price' => 'float',
        'max_travelers' => 'integer',
        'min_travelers' => 'integer',
        'departure_date' => 'datetime',
        'return_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get all published trips
     */
    public static function getPublished()
    {
        return self::where('status', 'published')->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get featured trips
     */
    public static function getFeatured()
    {
        return self::where('status', 'published')
                  ->where('featured', true)
                  ->orderBy('created_at', 'desc')
                  ->get();
    }

    /**
     * Get trips by destination
     */
    public static function getByDestination($destination)
    {
        return self::where('status', 'published')
                  ->where('destination', 'LIKE', "%{$destination}%")
                  ->orderBy('created_at', 'desc')
                  ->get();
    }

    /**
     * Get trips by price range
     */
    public static function getByPriceRange($min_price, $max_price)
    {
        return self::where('status', 'published')
                  ->where('price', '>=', $min_price)
                  ->where('price', '<=', $max_price)
                  ->orderBy('price', 'asc')
                  ->get();
    }

    /**
     * Get trips by duration
     */
    public static function getByDuration($duration, $duration_type = 'days')
    {
        return self::where('status', 'published')
                  ->where('duration', $duration)
                  ->where('duration_type', $duration_type)
                  ->orderBy('created_at', 'desc')
                  ->get();
    }

    /**
     * Search trips
     */
    public static function search($query)
    {
        return self::where('status', 'published')
                  ->where(function($q) use ($query) {
                      $q->where('title', 'LIKE', "%{$query}%")
                        ->orWhere('description', 'LIKE', "%{$query}%")
                        ->orWhere('destination', 'LIKE', "%{$query}%")
                        ->orWhere('short_description', 'LIKE', "%{$query}%");
                  })
                  ->orderBy('created_at', 'desc')
                  ->get();
    }

    /**
     * Get trip by slug
     */
    public static function getBySlug($slug)
    {
        return self::where('slug', $slug)->where('status', 'published')->first();
    }

    /**
     * Get related trips
     */
    public function getRelated($limit = 4)
    {
        return self::where('status', 'published')
                  ->where('id', '!=', $this->id)
                  ->where('destination', $this->destination)
                  ->limit($limit)
                  ->get();
    }

    /**
     * Check if trip is available for booking
     */
    public function isAvailable()
    {
        return $this->status === 'published' && 
               $this->departure_date > now() && 
               $this->max_travelers > 0;
    }

    /**
     * Get current price (sale price if available, otherwise regular price)
     */
    public function getCurrentPrice()
    {
        return $this->sale_price > 0 ? $this->sale_price : $this->price;
    }

    /**
     * Get price discount percentage
     */
    public function getDiscountPercentage()
    {
        if ($this->sale_price > 0 && $this->price > 0) {
            return round((($this->price - $this->sale_price) / $this->price) * 100);
        }
        return 0;
    }

    /**
     * Get formatted duration
     */
    public function getFormattedDuration()
    {
        $duration = $this->duration . ' ' . $this->duration_type;
        return $this->duration > 1 ? $duration : rtrim($duration, 's');
    }

    /**
     * Get formatted price
     */
    public function getFormattedPrice()
    {
        $currency = $this->currency ?: 'USD';
        $price = $this->getCurrentPrice();
        
        switch ($currency) {
            case 'USD':
                return '$' . number_format($price, 2);
            case 'EUR':
                return '€' . number_format($price, 2);
            case 'GBP':
                return '£' . number_format($price, 2);
            default:
                return $currency . ' ' . number_format($price, 2);
        }
    }
} 