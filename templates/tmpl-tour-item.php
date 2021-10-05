<div class="yatra-tour-list-item">
    <div class="yatra-item-inner">
        <h2 class="yatra-tour-title"><a href="<?php echo esc_url($data['permalink']) ?>"><?php echo esc_html($data['title']); ?></a></h2>
        <figure><?php if(!empty($data['image'])){ ?>
            <img src="<?php echo $data['image'] ?>"/>
            <?php } ?>
        </figure>
        <?php yatra_entry_meta_options($data['id']); ?>
        <div class="deals-footer">
            <a href="<?php echo esc_url($data['permalink']) ?>" class="button button-primary">
                <?php
                $book_now_text = get_option('yatra_booknow_button_text', __('Book now', 'yatra'));
                echo esc_html($book_now_text);
                ?>
            </a>
        </div>
    </div>
</div>