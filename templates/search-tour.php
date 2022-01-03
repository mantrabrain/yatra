<?php
/**
 * The Template for displaying all search tour
 * @package     Yatra\Templates
 * @version     2.1.2
 */
get_header();

do_action('yatra_before_page_content');

do_action('yatra_before_main_content');

do_action('yatra_main_content');

do_action('yatra_after_main_content');

do_action('yatra_after_page_content');

get_footer();