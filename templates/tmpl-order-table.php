<h3><?php echo __('Your booking', 'yatra') ?></h3>
<div id="tour-book_review" class="yatra-checkout-review-tour-book">
    <table class="shop_table yatra-checkout-review-tour-book-table">
        <thead>
        <tr>
            <th class="tour-name"><?php echo __('Tour', 'yatra') ?></th>
            <th class="tour-name"><?php echo __('Date', 'yatra') ?></th>
            <th class="tour-total"><?php echo __('Total', 'yatra') ?></th>
        </tr>
        </thead>
        <tbody>
        <?php

        $total_price = 0;

        foreach ($cart_items as $item) { ?>
            <tr class="cart_item">
                <td class="tour-name">
                    <?php
                    $total_price += $item['tour_final_price'];
                    $tour = isset($item['tour']) ? $item['tour'] : array();
                    echo '<a target="_blank" href="' . esc_url(get_post_permalink($tour->ID)) . '" class="tour-title">' . esc_html($tour->post_title) . '</a>';
                    ?>
                </td>
                <td><span>
                        <?php
                        echo esc_html($item['selected_date']);
                        ?>
                    </span></td>
                <td class="tour-total">
                    <span class="yatra-Price-amount amount"><span
                                class="yatra-Price-currencySymbol"><?php echo yatra_get_current_currency_symbol() ?></span><?php echo $item['tour_final_price']; ?></span>
                </td>
            </tr>
        <?php } ?>
        </tbody>
        <tfoot>

        <tr class="cart-subtotal">
            <th><?php echo __('Subtotal', 'yatra') ?></th>
            <td></td>
            <td colspan="2"><span class="yatra-Price-amount amount"><span
                            class="yatra-Price-currencySymbol"><?php echo yatra_get_current_currency_symbol() ?></span><?php echo $total_price; ?></span>
            </td>


        </tr>
        <tr class="tour-book-total">
            <th><?php echo __('Total', 'yatra') ?></th>
            <td></td>
            <td colspan="2"><strong><span class="yatra-Price-amount amount"><span
                                class="yatra-Price-currencySymbol"><?php echo yatra_get_current_currency_symbol() ?></span><?php echo $total_price; ?></span></strong>
            </td>

        </tr>


        </tfoot>
    </table>

</div>