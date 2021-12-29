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
                    'label' => __('Sort By', 'yatra'),
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
        $selected = 'price_asc';
        $sorting_fields = array(
            '' => array(
                'options' => array(
                    'latest' => __('Latest', 'yatra')
                )
            ),
            'price' => array(
                'label' => __('Price', 'yatra'),
                'options' => array('asc' => __('Low to high', 'yatra'),
                    'desc' => __('High to low', 'yatra')
                )
            ),
            'days' => array(
                'label' => __('Days', 'yatra'),
                'options' =>
                    array('asc' => __('Low to high', 'yatra'),
                        'desc' => __('High to low', 'yatra')
                    )
            ),
            'name' => array(
                'label' => __('Name', 'yatra'),
                'options' => array('asc' => __('a - z', 'yatra'),
                    'desc' => __('z - a', 'yatra')
                )
            )
        );
        ?>
        <div class="yatra-top-filter-sorting">
            <?php if ($label != '') { ?>
                <label for="yatra-top-filter-sorting-by"><?php echo esc_html($label) ?>: </label>
            <?php } ?>
            <select name="yatra-top-filter-sorting-by" class="yatra-top-filter-sorting-by" id="yatra-top-filter-sorting-by">
                <?php foreach ($sorting_fields as $field_group_id => $field_group) {

                    $option_group_label = isset($field_group['label']) ? $field_group['label'] : '';

                    $options = isset($field_group['options']) ? $field_group['options'] : array();
                    if ($option_group_label != '') {
                        ?>
                        <optgroup label="<?php echo esc_attr($option_group_label) ?>">
                    <?php } ?>
                    <?php foreach ($options as $option_id => $option_label) {

                        $option_dynamic_id = $field_group_id != '' ? $field_group_id . '_' . $option_id : $option_id;

                        ?>
                        <option <?php echo $selected === $option_dynamic_id ? 'selected="selected"' : ''; ?>
                                value="<?php echo esc_attr($option_dynamic_id) ?>"><?php echo esc_html($option_label) ?></option>
                    <?php }
                    if ($option_group_label != '') {
                        ?>
                        </optgroup>
                    <?php }
                } ?>
            </select>
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


