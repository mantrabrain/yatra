<h2><?php echo __('Booking Summary', 'yatra') ?></h2>
<div id="tour-book_review" class="yatra-checkout-review-tour-book">
    <table class="yatra-checkout-review-tour-book-table">
        <thead>
        <tr>
            <th class="tour-name"><?php echo __('Tour', 'yatra') ?></th>
            <th class="tour-name"><?php echo __('Date', 'yatra') ?></th>
            <th class="tour-name"><?php echo __('Number of people', 'yatra') ?></th>
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
                    echo '<a target="_blank" href="' . esc_url(get_permalink($tour->ID)) . '" class="tour-title">' . esc_html($tour->post_title) . '</a>';
                    ?>
                </td>
                <td><span>
                        <?php
                        echo esc_html($item['selected_date']);
                        ?>
                    </span></td>

                <td><span>
                        <?php
                        echo is_array($item['number_of_person']) ? esc_html(array_sum($item['number_of_person'])) : esc_html($item['number_of_person']);
                        ?>
                    </span>
                </td>
                <td class="tour-total">
                    <span class="yatra-Price-amount amount"><?php echo yatra_get_price(yatra_get_current_currency_symbol(), $item['tour_final_price']) ?></span>
                </td>
            </tr>
        <?php } ?>
        </tbody>
        <tfoot>

        <tr class="cart-subtotal">
            <th colspan="3"><?php echo __('Subtotal', 'yatra') ?></th>

            <td><span class="yatra-Price-amount amount">
                    <?php echo yatra_get_price(yatra_get_current_currency_symbol(), yatra()->cart->get_cart_total()) ?></span>
            </td>


        </tr>
        <?php if (isset($coupon['id'])) { ?>
            <tr>
                <th colspan="3">
                    <strong><?php echo __('Coupon:', 'yatra') ?></strong>
                    <em><?php echo esc_html($coupon['code']); ?></em>
                </th>
                <td>
                    <strong>- <?php
                        echo yatra_get_price(yatra_get_current_currency_symbol(), $coupon['calculated_value']); ?>
                    </strong>
                </td>
            </tr>
        <?php } ?>
        <tr class="tour-book-total">
            <th colspan="3"><?php echo __('Total', 'yatra') ?></th>

            <td><strong><span
                            class="yatra-Price-amount amount"><?php echo yatra_get_price(yatra_get_current_currency_symbol(), yatra()->cart->get_cart_total(true)) ?></span>
                </strong>
            </td>

        </tr>


        </tfoot>
    </table>

</div>