<?php
/**
 * The Template for displaying tour taxonomy
 * @package     Yatra\Templates
 * @version     2.1.2
 */
yatra_header('taxonomy-activity');

do_action('yatra_before_page_content');

do_action('yatra_before_main_content');

do_action('yatra_main_content');

do_action('yatra_after_main_content');

do_action('yatra_after_page_content');

yatra_footer('taxonomy-activity');