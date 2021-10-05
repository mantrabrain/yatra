<?php
/**
 * My Account navigation
 */

if (!defined('ABSPATH')) {
    exit;
}

do_action('yatra_before_account_navigation');
?>

<nav class="yatra-my-account-navigation">
    <?php $items = yatra_get_account_menu_items();
    foreach ($items as $item_key => $item_value) {
        $child_items = isset($item_value['items']) ? $item_value['items'] : array();
        if (count($child_items) > 0) {
            $label = isset($item_value['label']) ? $item_value['label'] : '';
            echo '<h3 class="yatra-heading-' . esc_attr($item_key) . '">' . esc_html($label) . '</h3>';

        }

        echo '<ul class="yatra-account-nav-' . esc_attr($item_key) . '">';

        foreach ($child_items as $child_item_key => $child_item_value) {

            $class = $current_endpoint == $child_item_key ? 'active' : '';

            $papge_permalink = add_query_arg(array(
                'page_type' => $child_item_key,
            ), get_permalink());

            echo '<li class="' . esc_attr($class) . '"><a href="' . $papge_permalink . '">';

            if (isset($child_item_value['icon'])) {

                echo '<span class="' . esc_attr($child_item_value['icon']) . '"></span> ';

            }


            echo isset($child_item_value['label']) ? esc_html($child_item_value['label']) : '';

            echo '</a></li>';
        }
        echo '</ul>';

    }
    ?>
    <h3 class="yatra-heading-signout"><?php echo __('Signout', 'yatra'); ?></h3>
    <ul class="yatra-account-nav-signout">
        <li>
            <a href="<?php echo yatra_logout_url(); ?>"><span
                        class="fa fa-sign-out-alt"></span> <?php echo __('Signout', 'yatra'); ?></a></li>
    </ul>
</nav>

<?php do_action('yatra_after_account_navigation'); ?>
