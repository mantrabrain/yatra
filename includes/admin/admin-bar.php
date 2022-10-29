<?php


// Exit if accessed directly
defined('ABSPATH') || exit;


function yatra_maybe_add_site_mode_admin_bar_menu($wp_admin_bar)
{

    // Bail if no admin bar.
    if (empty($wp_admin_bar)) {
        return;
    }

    // Bail if user cannot manage shop settings.
    if (!current_user_can('manage_yatra')) {
        return;
    }

    // Add the menu
    $wp_admin_bar->add_menu(
        array(
            'id' => 'yatra-admin-bar-menu',
            'title' => '<span class="yatra-admin-bar-menu-title"><img src="' . esc_attr(YATRA_PLUGIN_URI . '/assets/images/menu-icon.png') . '" alt=""> <strong>Yatra</strong></span>',
            'href' => admin_url('admin.php?page=yatra-dashboard'),

        )
    );

    $wp_admin_bar->add_menu(array(
        'parent' => 'yatra-admin-bar-menu',
        'id' => 'yatra-admin-bar-tours',
        'title' => __('All Tours', 'yatra'),
        'href' => admin_url('edit.php?post_type=tour')
    ));

    $wp_admin_bar->add_menu(array(
        'parent' => 'yatra-admin-bar-menu',
        'id' => 'yatra-admin-bar-settings',
        'title' => __('Settings', 'yatra'),
        'href' => admin_url('admin.php?page=yatra-settings'),
    ));

    // String.
    $text = !yatra_payment_gateway_test_mode()
        ? __('Live', 'yatra')
        : __('Test Mode', 'yatra');

    // Mode.
    $mode = !yatra_payment_gateway_test_mode()
        ? 'live'
        : 'test';

    $wp_admin_bar->add_menu(array(
        'parent' => 'yatra-admin-bar-menu',
        'id' => 'yatra-site-status',
        'title' => sprintf(__('Site Status: &nbsp; %s', 'yatra'), '<span class="yatra-mode yatra-mode-' . esc_attr($mode) . '">' . $text . '</span>'),
        'href' => admin_url('admin.php?page=yatra-settings&tab=payment-gateways'),
    ));

    if (count(yatra_get_premium_addons()) < 1) {

        $wp_admin_bar->add_menu(array(
            'parent' => 'yatra-admin-bar-menu',
            'id' => 'yatra-upgrade',
            'title' => esc_html__('Upgrade to Pro', 'yatra'),
            'href' => 'https://wpyatra.com/pricing/?utm_campaign=freeplugin&utm_medium=admin-menu&utm_source=WordPress&utm_content=Upgrade+to+Pro',
            'meta' => array(
                'target' => '_blank',
                'rel' => 'noopener noreferrer',
            ),
        ));
    }

}

add_action('admin_bar_menu', 'yatra_maybe_add_site_mode_admin_bar_menu', 9999);


function yatra_mode_admin_bar_print_link_styles()
{

    if (!current_user_can('manage_yatra')) {
        return;
    } ?>

    <style type="text/css" id="yatra-admin-bar-menu-styling">
        #wp-admin-bar-yatra-site-status .yatra-mode {
            line-height: inherit;
        }

        #wp-admin-bar-yatra-admin-bar-menu .yatra-admin-bar-menu-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        #wp-admin-bar-yatra-admin-bar-menu .yatra-admin-bar-menu-title strong {
            font-weight: bold;
        }

        #wp-admin-bar-yatra-admin-bar-menu .yatra-admin-bar-menu-title img {
            height: 15px;
            margin-top: 3px;
            margin-right: 2px;
        }

        #wp-admin-bar-yatra-site-status .yatra-mode-live {
            color: #32CD32;
        }

        #wp-admin-bar-yatra-admin-bar-menu .yatra-mode-test {
            color: #FF8C00;
        }


        #wpadminbar #wp-admin-bar-yatra-upgrade a {
            background-color: #e27730;
            color: #fff;
            margin-top: 5px;
        }

        #wpadminbar #wp-admin-bar-yatra-upgrade a:hover {
            background-color: #d06d2d;
        }

        #wpadminbar .yatra-menu-form-last {
            border-bottom: 1px solid #3c4146 !important;
            margin-bottom: 6px !important;
            padding-bottom: 6px !important;
        }

    </style>

    <?php
}

add_action('wp_print_styles', 'yatra_mode_admin_bar_print_link_styles');
add_action('admin_print_styles', 'yatra_mode_admin_bar_print_link_styles');
