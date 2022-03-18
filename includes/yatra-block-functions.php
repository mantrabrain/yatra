<?php

if (!function_exists('yatra_supports_block_templates')) {
    function yatra_supports_block_templates()
    {
        if (
            (!function_exists('wp_is_block_theme') || !wp_is_block_theme()) &&
            (!function_exists('gutenberg_supports_block_templates') || !gutenberg_supports_block_templates())
        ) {
            return false;
        }

        return true;
    }
}