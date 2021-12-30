<?php

class Yatra_Module_Filter_Top
{

    public function __construct()
    {
        $this->includes();
        $this->hooks();
    }

    public function includes()
    {
        // include_once YATRA_ABSPATH . 'includes/modules/filters/includes/abstract-class-yatra-module-filter-sections.php';

    }

    public function hooks()
    {
        add_action('yatra_before_main_content_area_inner', array($this, 'top_filter'), 10);

    }

    public function callback_call($section)
    {
        $callback = isset($section['callback']) ? $section['callback'] : array();

        if (is_string($callback)) {

            if (is_callable($callback)) {

                $callback($section);
            }
        } else if (is_array($callback)) {

            $class = isset($callback[0]) ? $callback[0] : '';

            $method = isset($callback[1]) ? $callback[1] : '';

            if ($class != '' && $method != '') {

                if (is_object($class)) {

                    if (method_exists($class, $method)) {

                        $class->$method($section);
                    }
                }
            }
        }
    }


    public function get_filter_sections()
    {
        return apply_filters(
            'yatra_topbar_filter_sections',
            array(
                'sorting' => array(
                    'label' => __('Sort', 'yatra'),
                    'callback' => array($this, 'sorting_section')
                ),
                'display' => array(
                    'label' => '',
                    'callback' => array($this, 'display_section')
                ),
            )
        );
    }

    public function top_filter()
    {

        if (!yatra_is_archive_page()) {
            return;
        }
        echo '<div class="yatra-tour-filter-top">';

        echo '<div class="yatra-tour-filter-top-inner">';

        $sections = $this->get_filter_sections();

        foreach ($sections as $section_id => $section) {

            echo '<div class="yatra-top-filter-section ' . esc_attr($section_id) . '">';

            $this->callback_call($section);

            echo '</div>';
        }

        echo '</div>';

        echo '</div>';

    }

    public function sorting_section($section)
    {
        $label = isset($section['label']) ? $section['label'] : '';

        $selected = isset($_GET['orderby']) ? sanitize_text_field($_GET['orderby']) : 'default';

        $sorting_fields = yatra_filter_get_sort_by();

        $action = get_post_type_archive_link('tour');

        $filter_params = yatra_get_filter_params();

        ?>
        <div class="yatra-top-filter-sorting">
            <form method="get" action="<?php echo esc_attr($action) ?>" class="yatra-topbar-filter-order-form">
                <?php

                foreach ($filter_params as $param_id => $param_value) {

                    if ($param_id !== 'orderby') {

                        $value = is_array($param_value) ? implode(',', $param_value) : $param_value;
                        $value = trim($value);
                        $param_id = is_array($param_value) ? 'filter_' . $param_id : $param_id;
                        ?>
                        <input type="hidden" value="<?php echo esc_attr($value) ?>"
                               name="<?php echo esc_attr($param_id) ?>"/>
                        <?php
                    }
                }
                ?>
                <?php if ($label != '') { ?>
                    <label for="yatra-top-filter-sorting-by"><?php echo esc_html($label) ?>: </label>
                <?php } ?>
                <select name="orderby" class="yatra-top-filter-sorting-by"
                        id="yatra-top-filter-sorting-by">
                    <?php foreach ($sorting_fields as $option_id => $option_label) { ?>
                        <option <?php echo $selected === $option_id ? 'selected="selected"' : ''; ?>
                                value="<?php echo esc_attr($option_id) ?>"><?php echo esc_html($option_label) ?></option>
                    <?php } ?>
                </select>

            </form>
        </div>
        <?php
    }

    public function display_section($section)
    {
        $selected = 'list';

        ?>
        <ul class="yatra-top-filter-display-list">
            <li class="grid<?php echo $selected === 'grid' ? ' selected' : ''; ?>">
                <span class="icon fa fa-th"></span>
            </li>
            <li class="list<?php echo $selected === 'list' ? ' selected' : ''; ?>">
                <span class="icon fa fa-list"></span>
            </li>
        </ul>
        <?php
    }

}

new Yatra_Module_Filter_Top();


