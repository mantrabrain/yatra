<?php

class Yatra_Tour_Block
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
                'default' => 'desc'
            ),
            'featured' => array(
                'type' => 'boolean',
                'default' => false
            ),
            'posts_per_page' => array(
                'type' => 'number',
                'default' => 9,
            ),
            'columns' => array(
                'type' => 'number',
                'default' => 3
            ),
        );

    }

    public function callback($attributes, $content)
    {
        $attributes['order'] = isset($attributes['order']) ? sanitize_text_field($attributes['order']) : 'DESC';

        $attributes['order'] = in_array(strtolower($attributes['order']), array('asc', 'desc')) ? $attributes['order'] : 'desc';

        $attributes['featured'] = isset($attributes['featured']) ? absint($attributes['featured']) : 2;

        $attributes['posts_per_page'] = isset($attributes['posts_per_page']) ? absint($attributes['posts_per_page']) : 9;

        $attributes['columns'] = isset($attributes['columns']) ? absint($attributes['columns']) : 3;

        ob_start();

        yatra_get_tour_lists($attributes);

        return ob_get_clean();
    }


    public function register()
    {
        $block_dependency = file_exists(YATRA_ABSPATH . 'assets/build/js/block-tour.asset.php') ? include_once(YATRA_ABSPATH . 'assets/build/js/block-tour.asset.php') : array();

        $block_dependency['dependencies'] = isset($block_dependency['dependencies']) ? $block_dependency['dependencies'] : array();

        $block_dependency['version'] = isset($block_dependency['version']) ? sanitize_text_field($block_dependency['version']) : YATRA_VERSION;

        wp_register_script('yatra-block-tour', YATRA_PLUGIN_URI . '/assets/build/js/block-tour.js', $block_dependency['dependencies'], $block_dependency['version']);

        wp_register_style('yatra-block-tour', YATRA_PLUGIN_URI . '/assets/build/block-tour.css', array(), $block_dependency['version']);

        register_block_type('yatra/tour', array(

            'api_version' => 2,

            'editor_script' => 'yatra-block-tour',

            'editor_style' => 'yatra-block-tour',

            'attributes' => $this->attributes(),

            'render_callback' => array($this, 'callback')

        ));
    }


}

new Yatra_Tour_Block();