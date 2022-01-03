<div class="yatra-book-btn-wrapper book-btn">
    <?php $book_now_text = get_option('yatra_booknow_button_text', __('Book now', 'yatra')); ?>
    <button type="submit" class="yatra-button button yatra-book-now-btn"
            data-text="<?php echo esc_attr($book_now_text); ?>"
            data-loading-text="<?php echo esc_attr(get_option('yatra_booknow_loading_text', __('Loading....', 'yatra'))) ?>"
            data-tour-id="<?php the_ID(); ?>"><?php echo esc_html($book_now_text); ?></button>
</div>