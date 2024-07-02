<?php
/**
 * The Template for displaying all single tour
 * @package     Yatra\Templates
 * @version     2.1.2
 */
yatra_header('single-tour');

do_action('yatra_before_page_content');

do_action('yatra_before_main_content');

do_action('yatra_main_content');

do_action('yatra_after_main_content');

do_action('yatra_after_page_content');

yatra_footer('single-tour');