<?php

declare(strict_types=1);

namespace Yatra\Compatibility;

/**
 * Compatibility Manager (Loader)
 *
 * This file is intentionally small: it conditionally loads and registers
 * compatibility handlers (Elementor, etc.) from subfolders.
 *
 * Folder convention:
 * - app/Compatibility/Elementor/Assets.php
 * - app/Compatibility/SomePlugin/Assets.php
 */
final class Compatibility
{
    /**
     * Register all compatibility handlers.
     */
    public static function register(): void
    {
        if (is_admin()) {
            return;
        }

        foreach (self::handlers() as $handler) {
            $file = $handler['file'] ?? '';
            $class = $handler['class'] ?? '';

            if (!is_string($file) || $file === '' || !is_string($class) || $class === '') {
                continue;
            }

            if (file_exists($file)) {
                require_once $file;
            }

            if (!class_exists($class)) {
                continue;
            }

            // Handlers expose register(): void (and can self-check plugin presence)
            if (is_callable([$class, 'register'])) {
                try {
                    $class::register();
                } catch (\Throwable $e) {
                    // Never break frontend due to optional integrations.
                    continue;
                }
            }
        }
    }

    /**
     * @return array<int,array{file:string,class:string}>
     */
    private static function handlers(): array
    {
        $base = defined('YATRA_PLUGIN_PATH') ? rtrim((string) YATRA_PLUGIN_PATH, '/\\') . '/app/Compatibility/' : '';
        if ($base === '') {
            return [];
        }

        return [
            [
                'file'  => $base . 'Elementor/Assets.php',
                'class' => 'Yatra\\Compatibility\\Elementor\\Assets',
            ],
            [
                'file'  => $base . 'LiteSpeed/Assets.php',
                'class' => 'Yatra\\Compatibility\\LiteSpeed\\Assets',
            ],
        ];
    }
}

