<?php

namespace Yatra\Core\Compatibility;

use Yatra\Core\Constant;

class Astra
{
    /**
     * Init WordPress hook
     *
     * @since 2.2.1
     */
    public static function init()
    {
        $self = new self;
        add_action('do_meta_boxes', array($self, 'remove_metabox'), 1, 3);

    }

    public function remove_metabox($post_type, $context, $post)
    {
        if ($post_type !== Constant::TOUR_POST_TYPE) {
            return;
        }
        remove_meta_box('astra_settings_meta_box', $post_type, $context);
        remove_meta_box('postcustom', $post_type, $context);

    }
}
