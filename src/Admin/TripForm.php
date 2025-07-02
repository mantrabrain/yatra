<?php
namespace Yatra\Admin;

/**
 * Handles Trip form configuration and extensibility (for Pro/Extensions)
 */
class TripForm
{
    /**
     * Trip form configuration array (tabs/sections/fields)
     *
     * @var array
     */
    protected $config = [
        [
            'id' => 'basic',
            'title' => 'Basic Info',
            'fields' => [
                [
                    'id' => 'title',
                    'label' => 'Trip Title',
                    'type' => 'text',
                    'required' => true,
                    'desc' => 'Enter the trip name as shown to customers.',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'slug',
                    'label' => 'Trip Code',
                    'type' => 'text',
                    'desc' => 'Unique code for internal reference. Leave blank to auto-generate.',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'short_description',
                    'label' => 'Short Description',
                    'type' => 'textarea',
                    'required' => true,
                    'desc' => 'Brief description for search results and listings.',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'description',
                    'label' => 'Detailed Description',
                    'type' => 'textarea',
                    'desc' => 'Comprehensive trip description.',
                    'sanitize_callback' => 'wp_kses_post',
                    'validate_callback' => null,
                ],
            ],
        ],
        [
            'id' => 'details',
            'title' => 'Trip Details',
            'fields' => [
                [
                    'id' => 'destination',
                    'label' => 'Destination',
                    'type' => 'text',
                    'required' => true,
                    'desc' => 'e.g., Bali, Indonesia',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'trip_type',
                    'label' => 'Trip Type',
                    'type' => 'select',
                    'options' => [
                        'adventure' => 'Adventure',
                        'cultural' => 'Cultural',
                        'relaxation' => 'Relaxation',
                        'family' => 'Family',
                        'luxury' => 'Luxury',
                    ],
                    'desc' => 'Select trip type',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'duration',
                    'label' => 'Duration (Days)',
                    'type' => 'number',
                    'required' => true,
                    'desc' => 'Total number of days',
                    'sanitize_callback' => 'absint',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'difficulty_level',
                    'label' => 'Difficulty Level',
                    'type' => 'select',
                    'options' => [
                        'easy' => 'Easy',
                        'moderate' => 'Moderate',
                        'challenging' => 'Challenging',
                        'expert' => 'Expert',
                    ],
                    'required' => true,
                    'desc' => 'Select difficulty',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'min_group_size',
                    'label' => 'Min Group Size',
                    'type' => 'number',
                    'desc' => '',
                    'sanitize_callback' => 'absint',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'max_group_size',
                    'label' => 'Max Group Size',
                    'type' => 'number',
                    'desc' => '',
                    'sanitize_callback' => 'absint',
                    'validate_callback' => null,
                ],
            ],
        ],
        [
            'id' => 'destinations',
            'title' => 'Destinations & Locations',
            'fields' => [
                [
                    'id' => 'primary_destination',
                    'label' => 'Primary Destination',
                    'type' => 'text',
                    'required' => true,
                    'desc' => 'Main destination/country (e.g., Nepal, Bali, Thailand)',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'secondary_destinations',
                    'label' => 'Secondary Destinations',
                    'type' => 'textarea',
                    'desc' => 'Additional destinations visited (one per line)',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'cities_visited',
                    'label' => 'Cities/Locations Visited',
                    'type' => 'textarea',
                    'desc' => 'Specific cities or locations included in the trip (one per line)',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'starting_point',
                    'label' => 'Starting Point',
                    'type' => 'text',
                    'desc' => 'Where the trip begins (e.g., Kathmandu Airport)',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'ending_point',
                    'label' => 'Ending Point',
                    'type' => 'text',
                    'desc' => 'Where the trip ends (e.g., Kathmandu Airport)',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'highlights',
                    'label' => 'Destination Highlights',
                    'type' => 'textarea',
                    'desc' => 'Key attractions and highlights of the destinations (one per line)',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'time_zones',
                    'label' => 'Time Zones',
                    'type' => 'text',
                    'desc' => 'Time zones covered (e.g., UTC+5:45 for Nepal)',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
            ],
        ],
        [
            'id' => 'logistics',
            'title' => 'Location & Logistics',
            'fields' => [
                [
                    'id' => 'meeting_point',
                    'label' => 'Meeting Point',
                    'type' => 'text',
                    'desc' => 'Starting location',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'end_point',
                    'label' => 'End Point',
                    'type' => 'text',
                    'desc' => 'Ending location',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'included_services',
                    'label' => 'Included Services',
                    'type' => 'textarea',
                    'desc' => 'What\'s included in the trip',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'excluded_services',
                    'label' => 'Excluded Services',
                    'type' => 'textarea',
                    'desc' => 'What\'s not included',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
            ],
        ],
        [
            'id' => 'pricing',
            'title' => 'Pricing & Dates',
            'fields' => [
                [
                    'id' => 'price',
                    'label' => 'Adult Price',
                    'type' => 'number',
                    'required' => true,
                    'desc' => 'Per person (18+ years)',
                    'sanitize_callback' => 'floatval',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'sale_price',
                    'label' => 'Sale Price',
                    'type' => 'number',
                    'desc' => 'Discounted price (optional)',
                    'sanitize_callback' => 'floatval',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'child_price',
                    'label' => 'Child Price',
                    'type' => 'number',
                    'desc' => 'Ages 6-17 years',
                    'sanitize_callback' => 'floatval',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'single_supplement',
                    'label' => 'Single Supplement',
                    'type' => 'number',
                    'desc' => 'Solo traveler fee',
                    'sanitize_callback' => 'floatval',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'season_start',
                    'label' => 'Season Start',
                    'type' => 'text',
                    'desc' => 'Start date (YYYY-MM-DD)',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'season_end',
                    'label' => 'Season End',
                    'type' => 'text',
                    'desc' => 'End date (YYYY-MM-DD)',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'early_bird_discount',
                    'label' => 'Early Bird Discount',
                    'type' => 'number',
                    'desc' => 'Percentage off for bookings 60+ days ahead',
                    'sanitize_callback' => 'absint',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'group_discount',
                    'label' => 'Group Discount',
                    'type' => 'number',
                    'desc' => 'Percentage off for groups of 8+ people',
                    'sanitize_callback' => 'absint',
                    'validate_callback' => null,
                ],
            ],
        ],
        [
            'id' => 'media',
            'title' => 'Media & Gallery',
            'fields' => [
                [
                    'id' => 'featured_image',
                    'label' => 'Featured Image URL',
                    'type' => 'text',
                    'desc' => 'Paste a direct link to the featured image.',
                    'sanitize_callback' => 'esc_url_raw',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'gallery',
                    'label' => 'Gallery (one image URL per line)',
                    'type' => 'textarea',
                    'desc' => 'Enter image URLs, one per line.',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
            ],
        ],
        [
            'id' => 'settings',
            'title' => 'Settings',
            'fields' => [
                [
                    'id' => 'status',
                    'label' => 'Status',
                    'type' => 'select',
                    'options' => [
                        'draft' => 'Draft',
                        'published' => 'Published',
                        'completed' => 'Completed',
                        'cancelled' => 'Cancelled',
                    ],
                    'desc' => 'Trip status',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'currency',
                    'label' => 'Currency',
                    'type' => 'select',
                    'options' => [
                        'USD' => 'USD ($)',
                        'EUR' => 'EUR (€)',
                        'GBP' => 'GBP (£)',
                        'CAD' => 'CAD (C$)',
                        'AUD' => 'AUD (A$)',
                    ],
                    'desc' => 'Trip currency',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'age_requirement',
                    'label' => 'Age Requirement',
                    'type' => 'text',
                    'desc' => 'e.g., 12+ years, Adults only',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'physical_requirement',
                    'label' => 'Physical Requirements',
                    'type' => 'text',
                    'desc' => 'e.g., Moderate fitness required',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'cancellation_policy',
                    'label' => 'Cancellation Policy',
                    'type' => 'textarea',
                    'desc' => 'Describe the cancellation policy and refund terms',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'terms_conditions',
                    'label' => 'Terms & Conditions',
                    'type' => 'textarea',
                    'desc' => 'Enter terms and conditions for this trip',
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'validate_callback' => null,
                ],
                [
                    'id' => 'featured',
                    'label' => 'Mark as Featured Trip',
                    'type' => 'checkbox',
                    'desc' => '',
                    'sanitize_callback' => 'rest_sanitize_boolean',
                    'validate_callback' => null,
                ],
            ],
        ],
        // Add more sections for Itinerary, Pricing, Media, Settings, etc.
    ];

    /**
     * Itinerary form configuration array (fields for each day)
     *
     * @var array
     */
    protected $itinerary_config = [
        [
            'id' => 'day',
            'label' => 'Day Number',
            'type' => 'number',
            'required' => true,
            'desc' => 'Day of the itinerary',
            'sanitize_callback' => 'absint',
            'validate_callback' => null,
        ],
        [
            'id' => 'title',
            'label' => 'Title',
            'type' => 'text',
            'required' => true,
            'desc' => 'Short title for the day',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => null,
        ],
        [
            'id' => 'location',
            'label' => 'Location',
            'type' => 'text',
            'desc' => 'Location for this day',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => null,
        ],
        [
            'id' => 'activities',
            'label' => 'Activities',
            'type' => 'textarea',
            'desc' => 'Main activities for the day',
            'sanitize_callback' => 'sanitize_textarea_field',
            'validate_callback' => null,
        ],
        [
            'id' => 'accommodation',
            'label' => 'Accommodation',
            'type' => 'text',
            'desc' => 'Where guests will stay',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => null,
        ],
        [
            'id' => 'meals',
            'label' => 'Meals',
            'type' => 'text',
            'desc' => 'Meals provided (e.g., Breakfast, Lunch, Dinner)',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => null,
        ],
        [
            'id' => 'transportation',
            'label' => 'Transportation',
            'type' => 'text',
            'desc' => 'How guests will travel',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => null,
        ],
        [
            'id' => 'notes',
            'label' => 'Notes',
            'type' => 'textarea',
            'desc' => 'Additional notes for the day',
            'sanitize_callback' => 'sanitize_textarea_field',
            'validate_callback' => null,
        ],
    ];

    /**
     * Get the trip form config, filtered for extensibility
     *
     * @param array $trip Current trip data (optional)
     * @param string $action add|edit
     * @return array
     */
    public function get_config($trip = [], $action = 'add') {
        return apply_filters('yatra_trip_form_config', $this->config, $trip, $action);
    }

    /**
     * Get the itinerary form config, filtered for extensibility
     *
     * @param array $day Current day data (optional)
     * @return array
     */
    public function get_itinerary_config($day = []) {
        return apply_filters('yatra_trip_itinerary_form_config', $this->itinerary_config, $day);
    }
} 