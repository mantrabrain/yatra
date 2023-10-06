<?php

class Yatra_Block_Activity
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
            'per_page' => array(
                'type' => 'number',
                'default' => -1,
            ),
        );

    }

    public function callback($attributes, $content)
    {
        $attributes['order'] = isset($attributes['order']) ? sanitize_text_field($attributes['order']) : 'asc';

        $attributes['per_page'] = isset($attributes['per_page']) ? intval($attributes['per_page']) : -1;

        $attributes['columns'] = isset($attributes['columns']) ? absint($attributes['columns']) : 4;

        ob_start();

        yatra_get_activity_lists($attributes);

        return ob_get_clean();
    }


    public function register()
    {
        $block_dependency = file_exists(YATRA_ABSPATH . 'assets/build/js/block-activity.asset.php') ? include_once(YATRA_ABSPATH . 'assets/build/js/block-activity.asset.php') : array();

        $block_dependency['dependencies'] = isset($block_dependency['dependencies']) ? $block_dependency['dependencies'] : array();

        $block_dependency['version'] = isset($block_dependency['version']) ? sanitize_text_field($block_dependency['version']) : YATRA_VERSION;

        wp_register_script('yatra-block-activity', YATRA_PLUGIN_URI . '/assets/build/js/block-activity.js', $block_dependency['dependencies'], $block_dependency['version']);

        wp_register_style('yatra-block-activity', YATRA_PLUGIN_URI . '/assets/build/block-activity.css', array(), $block_dependency['version']);

        register_block_type('yatra/activity', array(

            'api_version' => 2,

            'editor_style' => 'yatra-block-activity',

            'editor_script' => 'yatra-block-activity',

            'attributes' => $this->attributes(),

            'render_callback' => array($this, 'callback')

        ));
    }


}

new Yatra_Block_Activity();