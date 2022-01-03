<div class="<?php echo esc_attr($data['class']) ?> yatra-tour-list-item">
    <div class="yatra-item-inner">
        <?php
        if (yatra_is_featured_tour($data['id'])) {
            echo '<span class="yatra-featured-tour"><i class="icon fa fa-bullhorn"></i><small class="text">' . __('Featured', 'yatra') . '</small></span>';
        } ?>
        <div class="yatra-figure-wrap">

            <figure><?php if (!empty($data['image'])) { ?>
                    <img src="<?php echo esc_attr($data['image']) ?>"/>
                <?php } ?>

            </figure>
            <?php yatra_get_price_html($data['id']); ?>
        </div>
        <?php yatra_entry_meta_options($data['id']); ?>
        <h2 class="yatra-tour-title"><a
                    href="<?php echo esc_url($data['permalink']) ?>"><?php echo esc_html($data['title']); ?></a></h2>
        <div class="yatra-tour-more">
            <a href="<?php echo esc_url($data['permalink']) ?>" class="yatra-button button yatra-tour-details-button">
                <?php
                echo esc_html(yatra_get_tour_view_details_button_text());
                ?>
            </a>
        </div>
    </div>
</div>