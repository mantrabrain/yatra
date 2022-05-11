<?php

use Yatra\Core\Admin\Notices;

class Yatra_Admin_Review
{


    public function __construct()
    {

        // Admin notice requesting review.
        add_action('admin_init', [$this, 'review_request']);

        // Admin footer text.
        add_filter('admin_footer_text', [$this, 'admin_footer'], 1, 2);

        add_filter('update_footer', array($this, 'admin_hide_wp_version'), PHP_INT_MAX);

    }

    public function review_request()
    {

        // Only consider showing the review request to admin users.
        if (!is_super_admin()) {
            return;
        }

        // If the user has opted out of product announcement notifications, don't
        // display the review request.
        if ('yes' === get_option('yatra_hide_all_announcement_of_yatra_plugin', 'no')) {
            return;
        }

        // Verify that we can do a check for reviews.
        $notices = get_option('yatra_admin_notices', []);

       // delete_option('yatra_admin_notices');
        //delete_user_meta(get_current_user_id(), 'yatra_admin_notices');
        $notices['review_request']['time'] = time() + -1 - DAY_IN_SECONDS;
        //$notices['review_request']['dismissed'] = false;
        /* echo '<pre>';
         print_r($notices);
         echo '</pre>';
         exit;*/

        $time = time();
        /* echo "time " . $time . '<br/>';
         echo "time_update " . ($notices['review_request']['time'] + DAY_IN_SECONDS) . '<br/>';
         var_dump((($notices['review_request']['time'] + DAY_IN_SECONDS) <= $time));
         exit;*/
        /* echo '<pre>';
         print_r($notices);
         echo '</pre>';*/

        $load = false;

        if (empty($notices['review_request'])) {
            $notices['review_request'] = [
                'time' => $time,
                'dismissed' => false,
            ];

            update_option('yatra_admin_notices', $notices);

            return;
        }

        // Check if it has been dismissed or not.
        if (
            (isset($notices['review_request']['dismissed']) &&
                !$notices['review_request']['dismissed']) &&
            (
                isset($notices['review_request']['time']) &&
                (($notices['review_request']['time'] + DAY_IN_SECONDS) <= $time)
            )
        ) {
            $load = true;
        }

        // If we cannot load, return early.
        if (!$load) {

            return;
        }

        $this->review();

    }


    public function review()
    {
        //echo '<h1>Review Function</h1>';

        // Fetch total entries.
        $total_completed_bookings = 55;

        if (empty($total_completed_bookings) || $total_completed_bookings < 50) {
            return;
        }


        ob_start();

        // We have a candidate! Output a review message.
        ?>

        <p><?php esc_html_e('Hey, I noticed you just get new tour booking from Yatra - that’s awesome! Could you please do me a BIG favor and give it a 5-star rating on WordPress to help us spread the word and boost our motivation?', 'yatra'); ?></p>

        <p>
            <strong><?php echo wp_kses(__('Umesh Ghimire<br>Co-Founder of Yatra', 'yatra'), ['br' => []]); ?></strong>
        </p>
        <p>
            <a href="https://wordpress.org/support/plugin/yatra/reviews/?filter=5#new-post"
               class="yatra-notice-dismiss yatra-review-out" target="_blank"
               rel="noopener"><?php esc_html_e('Ok, you deserve it', 'yatra'); ?></a><br>
            <a href="#" class="yatra-notice-dismiss" target="_blank"
               rel="noopener noreferrer"><?php esc_html_e('Nope, maybe later', 'yatra'); ?></a><br>
            <a href="#" class="yatra-notice-dismiss" target="_blank"
               rel="noopener noreferrer"><?php esc_html_e('I already did', 'yatra'); ?></a>
        </p>
        <?php

        Notices::info(
            ob_get_clean(),
            [
                'dismiss' => Notices::DISMISS_GLOBAL,
                'slug' => 'review_request',
                'autop' => true,
                'class' => 'yatra-review-notice',
            ]
        );
    }


    public function admin_footer($text)
    {

        global $current_screen;


        $yatra_screens = array(
            'edit-tour',
            'tour_page_yatra-dashboard',
            'tour',
            'edit-activity',
            'edit-attributes',
            'tour_page_enquiries',
            'edit-destination'
        );


        if (!empty($current_screen->id) && (in_array($current_screen->id, $yatra_screens) || strpos($current_screen->id, 'yatra') !== false)) {
            $url = 'https://wordpress.org/support/plugin/yatra/reviews/?filter=5#new-post';
            $text = sprintf(
                wp_kses( /* translators: $1$s - Yatra plugin name; $2$s - WP.org review link; $3$s - WP.org review link. */
                    __('Please rate %1$s <a href="%2$s" target="_blank" rel="noopener noreferrer">&#9733;&#9733;&#9733;&#9733;&#9733;</a> on <a href="%3$s" target="_blank" rel="noopener">WordPress.org</a> to help us spread the word. Thank you from the Mantra Brain team!', 'yatra'),
                    [
                        'a' => [
                            'href' => [],
                            'target' => [],
                            'rel' => [],
                        ],
                    ]
                ),
                '<strong>Yatra</strong>',
                $url,
                $url
            );
        }

        return $text;
    }


    public function admin_hide_wp_version($text)
    {

        global $current_screen;


        $yatra_screens = array(
            'edit-tour',
            'tour_page_yatra-dashboard',
            'tour',
            'edit-activity',
            'edit-attributes',
            'tour_page_enquiries',
            'edit-destination'
        );


        if (!empty($current_screen->id) && (in_array($current_screen->id, $yatra_screens) || strpos($current_screen->id, 'yatra') !== false)) {
            return 'Yatra Version: ' . YATRA_VERSION;
        }

        return $text;
    }

}

new Yatra_Admin_Review();
