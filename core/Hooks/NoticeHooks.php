<?php

namespace Yatra\Core\Hooks;

use Yatra\Core\Constant;

class NoticeHooks
{
    public static function init()
    {
        $self = new self;

        add_action('admin_notices', array($self, 'admin_header'), 1);

    }

    public function admin_header()
    {

        global $current_screen;

        $yatra_screens = array(
            'edit-tour',
            'toplevel_page_yatra-dashboard',
            'tour',
            'edit-activity',
            'edit-attributes',
            'yatra_page_enquiries',
            'edit-destination'
        );
        if (!isset($current_screen)) {
            return;
        }
        if (!isset($current_screen->id)) {
            return;
        }

        if (!in_array($current_screen->id, $yatra_screens) && strpos($current_screen->id, 'yatra') === false) {
            return;
        }
        $current_page = !empty($_GET['page']) ? sanitize_text_field($_GET['page']) : '';

        $action = !empty($_GET['action']) ? sanitize_text_field($_GET['action']) : '';

        $is_single_view = (bool)apply_filters('yatra_admin_is_single_view', !empty($_GET['view']));

        $page_title = '';

        switch ($current_page) {
            case 'yatra-settings':
                $page_title = __('Settings', 'yatra');
                break;
            case 'yatra_import_export':
                $page_title = __('Import & Export', 'yatra');
                break;
            default:
                if (!empty($_GET['page'])) {
                    $page_title = ucfirst(str_replace(array('yatra-', 'fes-'), '', $current_page));
                } else {
                    if (!empty($_GET['post_type']) && empty($_GET['taxonomy'])) {
                        $post_type = get_post_type_object(sanitize_text_field($_GET['post_type']));
                        $page_title = $post_type->labels->name;
                    } else if (!empty($_GET['post_type']) && !empty($_GET['taxonomy'])) {
                        $taxonomy = get_taxonomy(sanitize_text_field($_GET['taxonomy']));
                        $page_title = $taxonomy->labels->name;
                    } else if ($current_screen->id == Constant::TOUR_POST_TYPE && $action == "edit") {
                        $post_type = get_post_type_object(Constant::TOUR_POST_TYPE);
                        $page_title = $post_type->labels->name;
                     } else {
                        $page_title = __('Yatra', 'yatra');
                    }
                }

                break;
        }

        $page_title = apply_filters('yatra_settings_page_title', $page_title, $current_page, $is_single_view);
        if (!empty($page_title) && empty($is_single_view)) {
            ?>
            <style>
                .wrap > h1,
                .wrap h1.wp-heading-inline {
                    display: none;
                }

                .page-title-action {
                    visibility: hidden;
                }
            </style>
            <script>
                jQuery(document).ready(function ($) {
                    const coreAddNew = $('.page-title-action:visible');
                    const yatraAddNew = $('.add-new-h2:visible');

                    if (coreAddNew.length) {
                        coreAddNew.appendTo('.yatra-header-page-title-wrap').addClass('button').css('visibility', 'unset');
                    }

                    if (yatraAddNew.length) {
                        yatraAddNew.appendTo('.yatra-header-page-title-wrap').addClass('button');
                    }
                });
            </script>
            <?php
        }

        ?>

        <div id="yatra-header" class="yatra-header">
            <div id="yatra-header-wrapper">
                <span id="yatra-header-branding"><span class="name"><?php echo esc_html__('Yatra', 'yatra'); ?></span>
                    <span class="version"><?php echo esc_html(YATRA_VERSION) ?></span>
                </span>

                <?php if (!empty($page_title)) : ?>
                    <span class="yatra-header-page-title-wrap">
                    <span class="yatra-header-separator">/</span>
                    <?php $element = true === $is_single_view ? 'span' : 'h1'; ?>
                    <<?php echo esc_attr($element); ?>
                    class="yatra-header-page-title"><?php echo esc_html($page_title); ?>
                    </<?php echo esc_attr($element); ?>>
                    </span>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }
}