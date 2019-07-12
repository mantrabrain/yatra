<?php
defined('ABSPATH') || exit;
if (!class_exists('Yatra_Frontend_Tour_Tabs')) {

    class Yatra_Frontend_Tour_Tabs
    {

        public function __construct()
        {

            add_action('yatra_loaded', array($this, 'init'), 100);


        }

        public function init()
        {

            $yatra_frontend_tabs_config = yatra_frontend_tabs_config();


            foreach ($yatra_frontend_tabs_config as $config_key => $config_value) {

                $hook = 'yatra_frontend_tab_content_' . $config_key;

                if (!method_exists($this, $config_key)) {

                    $config_key = 'misc';
                }

                $action = apply_filters('yatra_frontend_tab_content_callback', array($this, $config_key));

                add_action($hook, $action, 10, 2);
            }
        }

        public function overview($title, $post)
        {

            $overview = get_post_meta($post->ID, 'overview_description', true);

            yatra_get_template('tabs/tmpl-tab-overview.php',
                array(
                    'overview' => $overview,
                    'title' => $title
                )
            );

        }

        public function itinerary($title, $post)
        {
            $itinerary = get_post_meta($post->ID, 'itinerary_repeator', true);
            if (!is_array($itinerary)) {

                $itinerary = array();
            }

            $formatted_itnierary = array();

            if (isset($itinerary['itinerary_heading'])) {

                foreach ($itinerary['itinerary_heading'] as $index => $item) {


                    $item_array = array(
                        'itinerary_heading' => str_replace('{index}', ($index + 1), $item),
                        'itinerary_title' => isset($itinerary['itinerary_title'][$index]) ? $itinerary['itinerary_title'][$index] : '',
                        'itinerary_details' => isset($itinerary['itinerary_details'][$index]) ? $itinerary['itinerary_details'][$index] : '',
                    );
                    array_push($formatted_itnierary, $item_array);
                }
            }

            yatra_get_template('tabs/tmpl-tab-itinerary.php',
                array(
                    'itinerary' => $formatted_itnierary,
                    'title' => $title
                )
            );
        }

        public function cost_info($title, $post)
        {

            $cost_info['includes_title'] = get_post_meta($post->ID, 'cost_info_price_includes_title', true);
            $cost_info['includes_description'] = get_post_meta($post->ID, 'cost_info_price_includes_description', true);
            $cost_info['excludes_title'] = get_post_meta($post->ID, 'cost_info_price_excludes_title', true);
            $cost_info['excludes_description'] = get_post_meta($post->ID, 'cost_info_price_excludes_description', true);

            yatra_get_template('tabs/tmpl-tab-cost-info.php',
                array(
                    'cost_info' => $cost_info,
                    'title' => $title
                )
            );
        }

        public function faq($title, $post)
        {

            $faqs = get_post_meta($post->ID, 'faq_repeator', true);
            if (!is_array($faqs)) {

                $faqs = array();
            }

            $formatted_faqs = array();

            if (isset($faqs['faq_heading'])) {

                foreach ($faqs['faq_heading'] as $index => $item) {


                    $item_array = array(
                        'faq_heading' => str_replace('{index}', ($index + 1), $item),
                        'faq_description' => isset($faqs['faq_description'][$index]) ? $faqs['faq_description'][$index] : '',
                    );
                    array_push($formatted_faqs, $item_array);
                }
            }

            yatra_get_template('tabs/tmpl-tab-faq.php',
                array(
                    'faqs' => $formatted_faqs,
                    'title' => $title
                )
            );
        }

        public function gallery($title, $post)
        {

            $image_ids = get_post_meta($post->ID, 'yatra_tour_meta_gallery', true);

            $image_id_array = explode(',', $image_ids);

            $attachment_datas = array();

            foreach ($image_id_array as $id) {

                $data = array();
                if (!empty(wp_get_attachment_url($id))) {

                    $data['url'] = wp_get_attachment_url($id);
                    $data['alt'] = get_post_meta($id, '_wp_attachment_image_alt', true);
                    $data['title'] = get_the_title($id);
                    $data['caption'] = wp_get_attachment_caption($id);

                    array_push($attachment_datas, $data);

                }
            }

            yatra_get_template('tabs/tmpl-tab-gallery.php',
                array(
                    'attachments' => $attachment_datas,

                    'title' => $title
                )
            );
        }

        function misc($title, $post)
        {

        }
    }

    return new Yatra_Frontend_Tour_Tabs();
}