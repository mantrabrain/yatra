<?php

defined('ABSPATH') || exit;

/**
 * Post types Class.
 */
class Yatra_Post_Types
{

    /**
     * Hook in methods.
     */
    public static function init()
    {
        add_action('init', array(__CLASS__, 'register_taxonomies'), 5);
        add_action('init', array(__CLASS__, 'register_post_types'), 5);
        add_action('init', array(__CLASS__, 'register_post_status'), 9);
        add_action('yatra_after_register_post_type', array(__CLASS__, 'maybe_flush_rewrite_rules'));
        add_action('yatra_flush_rewrite_rules', array(__CLASS__, 'flush_rewrite_rules'));
        self::hooks();
    }

    /**
     * Register core taxonomies.
     */
    public static function register_taxonomies()
    {
        if (!is_blog_installed()) {
            return;
        }

        if (taxonomy_exists('activity')) {
            return;
        }

        do_action('yatra_register_taxonomy');

        Yatra_Taxonomy_Activity::register();
        Yatra_Taxonomy_Attributes::register();
        Yatra_Taxonomy_Destination::register();

        do_action('yatra_after_register_taxonomy');
    }

    /**
     * Register core post types.
     */
    public static function register_post_types()
    {
        if (!is_blog_installed() || post_type_exists('tour')) {
            return;
        }

        do_action('yatra_register_post_type');

        Yatra_Custom_Post_Type_Tour::register();
        Yatra_Custom_Post_Type_Booking::register();
        Yatra_Custom_Post_Type_Coupons::register();
        Yatra_Custom_Post_Type_Customers::register();

        do_action('yatra_after_register_post_type');
    }

    public static function register_post_status()
    {

        Yatra_Custom_Post_Type_Booking::register_post_status();
    }

    public static function maybe_flush_rewrite_rules()
    {

        if ('yes' === get_option('yatra_queue_flush_rewrite_rules')) {
            update_option('yatra_queue_flush_rewrite_rules', 'no');
            self::flush_rewrite_rules();
        }
    }

    public static function flush_rewrite_rules()
    {
        flush_rewrite_rules();
    }

    private static function hooks()
    {
        //Taxonomy
        new Yatra_Taxonomy_Activity();
        new Yatra_Taxonomy_Attributes();
        new Yatra_Taxonomy_Destination();

        //Custom Post Type

        new Yatra_Custom_Post_Type_Booking();
        new Yatra_Custom_Post_Type_Customers();
        new Yatra_Custom_Post_Type_Coupons();

    }


}

Yatra_Post_types::init();
