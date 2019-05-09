<?php

get_header();

do_action('yatra_before_page_content');

do_action('yatra_before_main_content');

do_action('yatra_main_content');

do_action('yatra_after_main_content');

do_action('yatra_after_page_content');

get_footer();