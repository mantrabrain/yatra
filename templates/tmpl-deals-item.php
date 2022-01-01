<div class="<?php echo esc_attr($data['class']); ?> yatra-deals-item">
    <div class="yatra-item-inner">
        <?php
        if (yatra_is_featured_tour($data['id'])) {
            echo '<span class="yatra-featured-tour"><i class="icon fa fa-bullhorn"></i><small class="text">' . __('Featured', 'yatra') . '</small></span>';
        } ?>
        <div class="yatra-figure-wrap">
            <figure><?php if (!empty($data['image'])) { ?>
                    <img src="<?php echo $data['image'] ?>"/>
                <?php } ?>
            </figure>
        </div>
        <?php yatra_get_price_html($data['id']); ?>
        <?php yatra_entry_meta_options($data['id']); ?>
        <h2 class="yatra-deals-title"><a
                    href="<?php echo esc_url($data['permalink']) ?>"><?php echo esc_html($data['title']); ?></a></h2>
        <div class="book-now-wrap">
            <a href="<?php echo esc_url($data['permalink']) ?>" class="button button-primary">
                <?php
                $book_now_text = get_option('yatra_booknow_button_text', __('Book now', 'yatra'));
                echo esc_html($book_now_text);
                ?>
            </a>
        </div>
    </div>
</div>