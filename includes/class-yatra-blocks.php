<?php

class Yatra_Blocks
{
    public function __construct()
    {
        add_action('init', array($this, 'register_blocks'));
    }

    public function register_blocks()
    {
        $block_dependency = file_exists(YATRA_ABSPATH . '/assets/build/blocks.asset.php') ? include_once(YATRA_ABSPATH . '/assets/build/blocks.asset.php') : array();
        $block_dependency['dependencies'] = isset($block_dependency['dependencies']) ? $block_dependency['dependencies'] : array();
        $block_dependency['version'] = isset($block_dependency['version']) ? sanitize_text_field($block_dependency['version']) : YATRA_VERSION;
        wp_register_script('yatra-blocks', YATRA_PLUGIN_URI . '/assets/build/blocks.js', $block_dependency['dependencies'], $block_dependency['version']);
        //wp_register_style('yatra-coupon-css', YATRA_PLUGIN_URI . '/assets/build/style-coupon.css', array('wp-components'), YATRA_VERSION);


        register_block_type('yatra/tour', array(
            'api_version' => 2,
            'editor_script' => 'yatra-blocks',
        ));
    }
}

new Yatra_Blocks();