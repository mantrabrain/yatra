<?php

declare(strict_types=1);

namespace Yatra\Core;

/**
 * Simple View Loader
 * 
 * @package Yatra
 * @since 1.0.0
 */
class View
{
    /**
     * Load a view file with variables
     *
     * @param string $view_path Path to the view file relative to Resources/Views
     * @param array $data Variables to pass to the view
     * @return void
     */
    public static function render(string $view_path, array $data = []): void
    {
        // Extract variables to make them available in the view
        extract($data);
        
        // Build the full path to the view file
        $full_path = YATRA_PLUGIN_PATH . 'resources/views/' . $view_path . '.php';
        
        // Check if the view file exists
        if (!file_exists($full_path)) {
            throw new \RuntimeException("View file not found: {$full_path}");
        }
        
        // Include the view file
        include $full_path;
    }
    
    /**
     * Get the rendered view as a string
     *
     * @param string $view_path Path to the view file relative to Resources/Views
     * @param array $data Variables to pass to the view
     * @return string
     */
    public static function renderToString(string $view_path, array $data = []): string
    {
        ob_start();
        self::render($view_path, $data);
        return ob_get_clean();
    }
} 