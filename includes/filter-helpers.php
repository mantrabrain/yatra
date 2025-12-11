<?php
/**
 * Yatra Filter Helper Functions
 * 
 * Convenient wrapper functions for using the FilterService
 * 
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

use Yatra\Services\FilterService;

/**
 * Render individual price range filter
 * 
 * @param array $active_filters Current active filters
 * @param array $options Filter options
 * @return string HTML output
 */
function yatra_render_price_filter(array $active_filters = [], array $options = []): string
{
    $filter_service = new FilterService();
    return $filter_service->renderPriceRangeFilter($active_filters, $options);
}

/**
 * Render individual difficulty filter
 * 
 * @param array $active_filters Current active filters
 * @param array $options Filter options
 * @return string HTML output
 */
function yatra_render_difficulty_filter(array $active_filters = [], array $options = []): string
{
    $filter_service = new FilterService();
    return $filter_service->renderDifficultyFilter($active_filters, $options);
}

/**
 * Render individual rating filter
 * 
 * @param array $active_filters Current active filters
 * @param array $options Filter options
 * @return string HTML output
 */
function yatra_render_rating_filter(array $active_filters = [], array $options = []): string
{
    $filter_service = new FilterService();
    return $filter_service->renderRatingFilter($active_filters, $options);
}

/**
 * Render individual categories filter
 * 
 * @param array $active_filters Current active filters
 * @param array $options Filter options
 * @return string HTML output
 */
function yatra_render_categories_filter(array $active_filters = [], array $options = []): string
{
    $filter_service = new FilterService();
    return $filter_service->renderCategoriesFilter($active_filters, $options);
}

/**
 * Render individual destinations filter
 * 
 * @param array $active_filters Current active filters
 * @param array $options Filter options
 * @return string HTML output
 */
function yatra_render_destinations_filter(array $active_filters = [], array $options = []): string
{
    $filter_service = new FilterService();
    return $filter_service->renderDestinationsFilter($active_filters, $options);
}

/**
 * Render individual activities filter
 * 
 * @param array $active_filters Current active filters
 * @param array $options Filter options
 * @return string HTML output
 */
function yatra_render_activities_filter(array $active_filters = [], array $options = []): string
{
    $filter_service = new FilterService();
    return $filter_service->renderActivitiesFilter($active_filters, $options);
}

/**
 * Render complete filter sidebar
 * 
 * @param array $active_filters Current active filters
 * @param array $options Filter options and configuration
 * @return string HTML output
 */
function yatra_render_filter_sidebar(array $active_filters = [], array $options = []): string
{
    $filter_service = new FilterService();
    return $filter_service->renderFilterSidebar($active_filters, $options);
}

/**
 * Render custom filter combination
 * 
 * @param array $filter_types Array of filter types to render
 * @param array $active_filters Current active filters
 * @param array $options Filter options
 * @return string HTML output
 */
function yatra_render_custom_filters(array $filter_types, array $active_filters = [], array $options = []): string
{
    $filter_service = new FilterService();
    $output = '';
    
    foreach ($filter_types as $filter_type) {
        switch ($filter_type) {
            case 'price_range':
                $output .= $filter_service->renderPriceRangeFilter($active_filters, $options);
                break;
            case 'difficulty':
                $output .= $filter_service->renderDifficultyFilter($active_filters, $options);
                break;
            case 'rating':
                $output .= $filter_service->renderRatingFilter($active_filters, $options);
                break;
            case 'categories':
                $output .= $filter_service->renderCategoriesFilter($active_filters, $options);
                break;
            case 'destinations':
                $output .= $filter_service->renderDestinationsFilter($active_filters, $options);
                break;
            case 'activities':
                $output .= $filter_service->renderActivitiesFilter($active_filters, $options);
                break;
        }
    }
    
    return $output;
}
