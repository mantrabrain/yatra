<?php

abstract class Yatra_Module_Filter_Sections
{
    public function get_id()
    {
        return get_the_ID();
    }

    abstract function get_label();

    abstract function is_visible();

    abstract function render();

    public function taxonomy_filter_html($terms, $children = false)
    {

        $parent_count = 0;
        $term_count = 0;
        if (is_array($terms) && count($terms) > 0) {
            printf('<ul class="%1$s">', $children ? 'children' : 'yatra-search-terms-list');
            $invisible_terms = '';
            foreach ($terms as $term) {
                if ($term->parent && !$children) {
                    continue;
                }
                ob_start();
                printf('<li class="%1$s">', $children ? 'has-children' : '');
                printf(
                    '<label>'
                    . '<input type="checkbox" %1$s value="%2$s" name="%3$s" class="%3$s yatra-filter-item"/>'
                    . '<span>%4$s</span>'
                    . '</label>',
                    checked($term->slug, yatra_array_get($_GET, $term->taxonomy, false), false), // phpcs:ignore
                    $term->slug,
                    $term->taxonomy,
                    $term->name
                );

                if (apply_filters('yatra_advanced_search_filters_show_tax_count', true)) {
                    printf('<span class="count">%1$s</span>', $term->count);
                }
                if (is_array($term->children) && count($term->children) > 0) {
                    $_children = array();
                    foreach ($term->children as $term_child) {
                        if (!isset($terms[$term_child])) {
                            continue;
                        }
                        $_children[$term_child] = $terms[$term_child];
                    }
                    $this->taxonomy_filter_html($_children, true);
                }
                print('</li>');

                $list = ob_get_clean();
                if ((++$parent_count > 4) && !$children) {
                    $invisible_terms .= $list;
                } else {
                    $term_count += count($term->children) + 1;
                    echo $list;
                }
            }
            if ($invisible_terms != '' && !$children) {
                printf(
                    '<li class="yatra-terms-more"><button class="show-more">%2$s</button><ul class="yatra-terms-more-list">%1$s</ul><button class="show-less">%3$s</button></li>',
                    $invisible_terms,
                    sprintf(__('Show all %s', 'wp-travel-engine'), count($terms) - $term_count),
                    __('Show less', 'wp-travel-engine')
                );
            }
            print('</ul>');
        }

    }

}