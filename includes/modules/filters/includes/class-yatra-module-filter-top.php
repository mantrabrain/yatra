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
        ?>
        <div class="yatra-top-filter-sorting">
            <label for="cars">Choose a car:</label>
            <select name="cars" id="cars">
                <optgroup label="Swedish Cars">
                    <option value="volvo">Volvo</option>
                    <option value="saab">Saab</option>
                </optgroup>
                <optgroup label="German Cars">
                    <option value="mercedes">Mercedes</option>
                    <option value="audi">Audi</option>
                </optgroup>
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


