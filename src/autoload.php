<?php

declare(strict_types=1);

/**
 * Simple autoloader for Yatra plugin
 */
spl_autoload_register(function ($class) {
    // Only handle Yatra namespace
    if (strpos($class, 'Yatra\\') !== 0) {
        return;
    }

    // Convert namespace to file path
    $file = YATRA_PLUGIN_PATH . 'src/' . str_replace('\\', '/', substr($class, 6)) . '.php';

    // Load the file if it exists
    if (file_exists($file)) {
        require_once $file;
    }
}); 