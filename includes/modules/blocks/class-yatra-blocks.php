<?php

class Yatra_Blocks
{
    public function __construct()
    {
        $this->includes();

        add_filter('block_categories_all', array($this, 'register_category'), 10, 2);
    }

    public function register_category($categories, $context)
    {
        array_push(
            $categories,
            array(
                'slug' => 'yatra',
                'title' => __('Yatra', 'yatra'),
            )
        );
        return $categories;
    }

    public function includes()
    {
        include_once "blocks/class-yatra-block-tour.php";
        include_once "blocks/class-yatra-block-activity.php";
        include_once "blocks/class-yatra-block-destination.php";
    }
}

new Yatra_Blocks();