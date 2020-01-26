<div class="yatra-admin--tab-content">
    <?php
    foreach ($tabs as $tab_key => $content) {

        $is_active = isset($content['is_active']) ? $content['is_active'] : false;

        $class = $is_active ? 'active' : '';

        ?>
        <section id="<?php echo esc_attr($tab_key) ?>"
                 class="yatra-admin-tab--content-section <?php echo esc_attr($class); ?>">
            <div class="yatra-admin-tab-content-inner">
                <?php
                do_action('yatra_tour_meta_tab_content_' . $tab_key, $content)
                ?>
            </div>
        </section>
    <?php } ?>
</div>