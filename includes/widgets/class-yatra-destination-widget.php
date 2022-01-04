<?php
/**
 * Custom widgets.
 *
 * @package Yatra
 */

if (!class_exists('Yatra_Destination_Widget')) :

    /**
     * CTA widget class.
     *
     * @since 1.0.0
     */
    class Yatra_Destination_Widget extends Yatra_Widget_Base
    {

        /**
         * Constructor.
         *
         * @since 1.0.0
         */
        function __construct()
        {
            $opts = array(
                'classname' => 'yatra_destination_widget',
                'description' => esc_html__('Displays tour destination list from Yatra tour.', 'yatra'),
            );
            parent::__construct('yatra-destination-widget', esc_html__('Yatra - Destination', 'yatra'), $opts);
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
                    'title' => esc_html__('Destination ordering', 'yatra'),
                    'type' => 'select',
                    'options' => array(
                        'asc' => esc_html__('ASC', 'yatra'),
                        'desc' => esc_html__('DESC', 'yatra')
                    ),
                    'default' => 'asc'
                ),
                'columns' => array(
                    'name' => 'order',
                    'title' => esc_html__('Columns', 'yatra'),
                    'type' => 'select',
                    'options' => array(
                        '2' => esc_html__('Two (2)', 'yatra'),
                        '3' => esc_html__('Three (3)', 'yatra'),
                        '4' => esc_html__('Four (4)', 'yatra'),
                    ),
                    'default' => '4'
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
            $widget_arguments['columns'] = $valid_widget_instance['columns'];

            ?>
            <div class="yatra-destination-widget-wrap">

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

                yatra_get_destination_lists($widget_arguments);

                ?>

            </div>


            <?php
            echo $args['after_widget'];

        }

    }

endif;