<?php
/**
 * Custom widgets.
 *
 * @package Yatra
 */

if (!class_exists('Yatra_Activity_Widget')) :

    /**
     * CTA widget class.
     *
     * @since 1.0.0
     */
    class Yatra_Activity_Widget extends Yatra_Widget_Base
    {

        /**
         * Constructor.
         *
         * @since 1.0.0
         */
        function __construct()
        {
            $opts = array(
                'classname' => 'yatra_activity_widget',
                'description' => esc_html__('Displays tour activity list from Yatra tour.', 'yatra'),
            );
            parent::__construct('yatra-activity-widget', esc_html__('YT - Activity', 'yatra'), $opts);
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
                    'title' => esc_html__('Activity ordering', 'yatra'),
                    'type' => 'select',
                    'options' => array(
                        'asc' => esc_html__('ASC', 'yatra'),
                        'desc' => esc_html__('DESC', 'yatra')
                    ),
                    'default' => 'asc'
                )


            );

            return $fields;

        }

        /**
         * Echo the widget content.
         *
         * @since 1.0.0
         *
         * @param array $args Display arguments including before_title, after_title,
         *                        before_widget, and after_widget.
         * @param array $instance The settings for the particular instance of the widget.
         */
        function widget($args, $instance)
        {

            $valid_widget_instance = $this->validation->validate($instance, $this->widget_fields());

            echo $args['before_widget'];

            $widget_arguments = array();

            $widget_arguments['order'] = $valid_widget_instance['order'];
            ?>
            <div class="yatra-activity-widget-wrap">

                <?php if (!empty($valid_widget_instance['title'])) { ?>
                    <h2 class="widget-title"><?php echo esc_html($valid_widget_instance['title']); ?></h2>
                <?php }

                if (!empty($valid_widget_instance['description'])) { ?>

                    <p class="widget-description"><?php echo esc_html($valid_widget_instance['description']); ?></p>
                    <?php
                }

                yatra_get_activity_lists($widget_arguments);

                ?>

            </div>


            <?php
            echo $args['after_widget'];

        }

    }

endif;