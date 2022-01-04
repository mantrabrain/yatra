<?php

class Yatra_Block_Destination
{
    public function __construct()
    {
        add_action('init', array($this, 'register'));

    }

    public function attributes()
    {
        return array(
            'order' => array(
                'type' => 'string',
                'default' => 'asc'
            ),
            'columns' => array(
                'type' => 'number',
                'default' => 4
            ),
        );

    }

    public function callback($attributes, $content)
    {
        $attributes['order'] = isset($attributes['order']) ? sanitize_text_field($attributes['order']) : 'asc';
        
        $attributes['columns'] = isset($attributes['columns']) ? absint($attributes['columns']) : 4;

        ob_start();

        yatra_get_destination_lists($attributes);

        return ob_get_clean();
    }


    public function register()
    {
        $block_dependency = file_exists(YATRA_ABSPATH . 'assets/build/js/block-destination.asset.php') ? include_once(YATRA_ABSPATH . 'assets/build/js/block-destination.asset.php') : array();

        $block_dependency['dependencies'] = isset($block_dependency['dependencies']) ? $block_dependency['dependencies'] : array();

        $block_dependency['version'] = isset($block_dependency['version']) ? sanitize_text_field($block_dependency['version']) : YATRA_VERSION;

        wp_register_script('yatra-block-destination', YATRA_PLUGIN_URI . '/assets/build/js/block-destination.js', $block_dependency['dependencies'], $block_dependency['version']);

        wp_register_style('yatra-block-destination', YATRA_PLUGIN_URI . '/assets/build/block-destination.css', array(), $block_dependency['version']);

        register_block_type('yatra/destination', array(

            'api_version' => 2,

            'editor_style' => 'yatra-block-destination',

            'editor_script' => 'yatra-block-destination',

            'attributes' => $this->attributes(),

            'render_callback' => array($this, 'callback')

        ));
    }


}

new Yatra_Block_Destination();