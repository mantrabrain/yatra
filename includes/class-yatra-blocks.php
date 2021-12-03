<?php

class Yatra_Blocks
{
    public function __construct()
    {
        add_action('init', array($this, 'register_blocks'));
        add_filter('block_categories_all', array($this, 'block_categories'), 10, 2);
        add_action('wp_ajax_get_tours', array($this, 'get_tours'));
    }

    public function get_tours()
    {

        wp_send_json_success(array(
            'tour_class' => "response_from_php"
        ));
    }

    public function register_blocks()
    {
        $block_dependency = file_exists(YATRA_ABSPATH . '/assets/build/blocks.asset.php') ? include_once(YATRA_ABSPATH . '/assets/build/blocks.asset.php') : array();
        $block_dependency['dependencies'] = isset($block_dependency['dependencies']) ? $block_dependency['dependencies'] : array();
        $block_dependency['version'] = isset($block_dependency['version']) ? sanitize_text_field($block_dependency['version']) : YATRA_VERSION;
        wp_register_script('yatra-blocks', YATRA_PLUGIN_URI . '/assets/build/blocks.js', $block_dependency['dependencies'], $block_dependency['version']);

        wp_localize_script('yatra-blocks', 'yatraBlocks', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'tour_action' => 'get_tours'
        ));
        //wp_register_style('yatra-coupon-css', YATRA_PLUGIN_URI . '/assets/build/style-coupon.css', array('wp-components'), YATRA_VERSION);


        register_block_type('yatra/tour', array(
            'api_version' => 2,
            'editor_script' => 'yatra-blocks',
        ));
    }

    public function block_categories($categories, $context)
    {
        if (!empty($context->post)) {
            array_push(
                $categories,
                array(
                    'slug' => 'yatra',
                    'title' => __('Yatra', 'yatra'),
                    'icon' => YATRA_PLUGIN_URI . '/assets/images/menu-icon.png'
                )
            );
        }
        return $categories;
    }
}

new Yatra_Blocks();