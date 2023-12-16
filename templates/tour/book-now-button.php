<div class="yatra-book-btn-wrapper book-btn">
    <?php

    global $yatra_tour;

    $book_now_text = $book_now_text ?? __('Book now', 'yatra');

    if ($yatra_tour->is_type('external')) {
        $book_now = $yatra_tour->get_book_now_text();
        $book_now_text = $book_now === '' ? $book_now_text : $book_now;
        $book_now_url = $yatra_tour->get_external_url();
        ?>
        <a target="_blank" class="yatra-button button"
           href="<?php echo esc_url($book_now_url); ?>">
            <span class="fa fa-arrow-up-right-from-square"></span>&nbsp;&nbsp;
            <?php echo esc_html($book_now_text); ?></a>
        <?php
    } else {

        ?>
        <button type="submit" class="yatra-button button yatra-book-now-btn"
                data-text="<?php echo esc_attr($book_now_text); ?>"
                data-loading-text="<?php echo esc_attr(get_option('yatra_booknow_loading_text', __('Loading....', 'yatra'))) ?>"
                data-tour-id="<?php the_ID(); ?>"><?php echo esc_html($book_now_text); ?></button>
    <?php } ?>
</div>