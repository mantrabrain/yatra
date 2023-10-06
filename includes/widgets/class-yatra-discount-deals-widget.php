<?php
/**
 * Custom widgets.
 *
 * @package Yatra
 */

if (!class_exists('Yatra_Discount_Deals_Widget')) :

    /**
     * CTA widget class.
     *
     * @since 1.0.0
     */
    class Yatra_Discount_Deals_Widget extends Yatra_Widget_Base
    {

        /**
         * Constructor.
         *
         * @since 1.0.0
         */
        function __construct()
        {
            $opts = array(
                'classname' => 'yatra_discount_deals_widget',
                'description' => esc_html__('Displays tour discount & deals list from Yatra tour.', 'yatra'),
            );
            parent::__construct('yatra-discount-deals-widget', esc_html__('Yatra - Discount & Deals', 'yatra'), $opts);
        }


        function widget_fields()
        {

            $fields = array(
                'title' => array(
                    'name' => 'title',
                    'title' => esc_html__('Widget Title', 'yatra'),
                    'type' => 'text',
                ),
                'description' => array(
                    'name' => 'description',
                    'title' => esc_html__('Description', 'yatra'),
                    'type' => 'textarea',
                ),
                'order' => array(
                    'name' => 'order',
                    'title' => esc_html__('Ordering', 'yatra'),
                    'type' => 'select',
                    'options' => array(
                        'asc' => esc_html__('ASC', 'yatra'),
                        'desc' => esc_html__('DESC', 'yatra')
                    ),
                    'default' => 'desc'
                ),
                'columns' => array(
                    'name' => 'columns',
                    'title' => esc_html__('Columns', 'yatra'),
                    'type' => 'select',
                    'options' => array(
                        '2' => esc_html__('Two (2)', 'yatra'),
                        '3' => esc_html__('Three (3)', 'yatra'),
                        '4' => esc_html__('Four (4)', 'yatra'),
                    ),
                    'default' => '3'
                ),
                'posts_per_page' => array(
                    'name' => 'posts_per_page',
                    'title' => esc_html__('Posts Per Page', 'yatra'),
                    'type' => 'number',
                    'default' => '9'
                ),


            );

            return $fields;

        }

        /**
         * Echo the widget content.
         *
         * @param array $args Display arguments including before_title, after_title,
         *                        before_widget, and after_widget.
         * @param array $instance The settings for the particular instance of the widget.
         * @since 1.0.0
         *
         */
        function widget($args, $instance)
        {

            $valid_widget_instance = $this->validation->validate($instance, $this->widget_fields());

            echo $args['before_widget'];

            $widget_arguments = array();

            $widget_arguments['order'] = $valid_widget_instance['order'];

            $widget_arguments['columns'] = $valid_widget_instance['columns'];

            $widget_arguments['posts_per_page'] = $valid_widget_instance['posts_per_page'];
            ?>
            <div class="yatra-discount-deals-widget-wrap">

                <?php if (!empty($valid_widget_instance['title']) || !empty($valid_widget_instance['description'])) { ?>
                    <div class="yatra-widget-header">
                        <?php if (!empty($valid_widget_instance['title'])) { ?>
                            <h2 class="widget-title"><?php echo esc_html($valid_widget_instance['title']); ?></h2>
                        <?php }

                        if (!empty($valid_widget_instance['description'])) { ?>

                            <p class="widget-description"><?php echo esc_html($valid_widget_instance['description']); ?></p>
                            <?php
                        }
                        ?>
                    </div>
                    <?php
                }

                yatra_get_discount_deals_lists($widget_arguments);

                ?>

            </div>


            <?php
            echo $args['after_widget'];

        }

    }

endif;