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

                        ?>
                        <input type="hidden" value="<?php echo esc_attr($value) ?>"
                               name="<?php echo esc_attr($param_id) ?>"/>
                        <?php
                    }
                }
                if (strpos($action, "post_type=tour") !== false) {
                    echo '<input type="hidden" name="post_type" value="tour"/>';
                }
                $search_text = get_query_var('s');

                if ('' != $search_text) {
                    ?>

                    <input type="hidden" name="s" value="<?php echo esc_attr($search_text) ?>"
                           placeholder="<?php echo esc_attr__('Search …', 'yatra') ?>"/>

                    <?php
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
        global $wp;

        $selected = isset($_GET['display_mode']) ? sanitize_text_field($_GET['display_mode']) : 'list';

        $selected = $selected === 'list' || $selected === 'grid' ? $selected : 'list';

        if (is_tax('destination') || is_tax('activity')) {
            $term_id = get_queried_object()->term_id;
            $current_url = get_term_link($term_id);
        } else if (is_post_type_archive('tour')) {
            $current_url = get_post_type_archive_link('tour');
        } else {
            $current_url = home_url($wp->request);
        }

        $extra_prams = (array)yatra_get_filter_params();

        $search = get_query_var('s');
        if ($search != '') {
            $extra_prams['s'] = $search;
        }
        foreach ($extra_prams as $filter_id => $filter) {
            $filter = is_array($filter) ? implode(',', $filter) : $filter;
            $extra_prams[$filter_id] = $filter;
        }


        if (isset($extra_prams['display_mode'])) {
            unset($extra_prams['display_mode']);
        }
        $current_url = add_query_arg($extra_prams, $current_url);

        $grid_mode_link = add_query_arg(array('display_mode' => 'grid'), $current_url);

        $list_mode_link = add_query_arg(array('display_mode' => 'list'), $current_url);
        ?>
        <ul class="yatra-top-filter-display-list">
            <li class="yatra-display-type-grid<?php echo $selected === 'grid' ? ' selected' : ''; ?>">
                <a href="<?php echo esc_attr($grid_mode_link) ?>"><i class="icon fa fa-th"></i></a>
            </li>
            <li class="yatra-display-type-list<?php echo $selected === 'list' ? ' selected' : ''; ?>">
                <a href="<?php echo esc_attr($list_mode_link) ?>"><i class="icon fa fa-list"></i></a>
            </li>
        </ul>
        <?php
    }

}

new Yatra_Module_Filter_Top();


