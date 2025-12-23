-- Create Yatra Attributes Table
-- Run this SQL directly in your database

CREATE TABLE IF NOT EXISTS `wp_yatra_attributes` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` varchar(200) NOT NULL COMMENT 'Attribute display name',
    `slug` varchar(200) NOT NULL COMMENT 'URL-friendly identifier',
    `description` text DEFAULT NULL COMMENT 'Attribute description',
    `field_type` enum('text_field','number','email','url','textarea','select','radio','checkbox','date','time','color') DEFAULT 'text_field' COMMENT 'Form field type',
    `field_options` text DEFAULT NULL COMMENT 'JSON options for select/radio/checkbox fields',
    `default_value` varchar(255) DEFAULT NULL COMMENT 'Default value for new trips',
    `placeholder` varchar(255) DEFAULT NULL COMMENT 'Field placeholder text',
    `required` tinyint(1) DEFAULT 0 COMMENT 'Whether attribute is required',
    `validation_rules` text DEFAULT NULL COMMENT 'JSON validation rules',
    `display_order` int(11) DEFAULT 0 COMMENT 'Display order in forms',
    `show_on_frontend` tinyint(1) DEFAULT 1 COMMENT 'Show on trip pages',
    `show_in_filters` tinyint(1) DEFAULT 0 COMMENT 'Show in trip listing filters',
    `filter_type` enum('exact','partial','range','dropdown') DEFAULT 'exact' COMMENT 'How to filter this attribute',
    `searchable` tinyint(1) DEFAULT 0 COMMENT 'Include in search index',
    `status` enum('publish','draft','trash') DEFAULT 'publish' COMMENT 'Attribute status',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `slug` (`slug`),
    KEY `status` (`status`),
    KEY `field_type` (`field_type`),
    KEY `show_on_frontend` (`show_on_frontend`),
    KEY `show_in_filters` (`show_in_filters`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Trip attribute definitions and field configurations';

-- Also create the trip attributes relationship table
CREATE TABLE IF NOT EXISTS `wp_yatra_trip_attributes` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `trip_id` bigint(20) UNSIGNED NOT NULL COMMENT 'Reference to yatra_trips.id',
    `attribute_id` bigint(20) UNSIGNED NOT NULL COMMENT 'Reference to yatra_attributes.id',
    `value` text DEFAULT NULL COMMENT 'Attribute value for this trip',
    `value_serialized` tinyint(1) DEFAULT 0 COMMENT 'Whether value is serialized (arrays/objects)',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_trip_attribute` (`trip_id`, `attribute_id`),
    KEY `trip_id` (`trip_id`),
    KEY `attribute_id` (`attribute_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Trip-specific attribute values';
