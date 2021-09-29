<div class="yatra-admin--tab-content">
    <?php
    foreach ($tabs as $tab_key => $content) {

        $is_active = isset($content['is_active']) ? $content['is_active'] : false;
		if ($active_tab != '') {
			$is_active = $active_tab === $tab_key;
		}
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
    <input type="hidden" value="<?php echo wp_create_nonce('yatra_tour_post_type_metabox_nonce') ?>"
           name="yatra_tour_cpt_meta_nonce"/>
    <?php
    global $post;

    ?>
    <input type="hidden" value="<?php echo $post->ID ?>"
           name="yatra_tour_cpt_meta_post_id" class="yatra_tour_cpt_meta_post_id"/>
</div>
