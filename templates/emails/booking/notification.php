<?php
/**
 *
 * New Booking order template.
 *
 * @since 2.1.12
 */
$tour_details = array(
    '{{tour_name}}' => __('Tour', 'yatra'),
    '{{tour_date}}' => __('Date', 'yatra'),
    '{{number_of_person}}' => __('Persons', 'yatra'),
);
$billing_details = array(
    '{{customer_name}}' => __('Name', 'yatra'),
    '{{customer_email}}' => __('Email', 'yatra'),
    '{{customer_phone_number}}' => __('Phone Number', 'yatra'),
    '{{customer_country}}' => __('Country', 'yatra'),
);
$payment_details = array(
    '{{gross_booking_price}}' => __('Subtotal', 'yatra'),
    '{{discount}}' => __('Discount', 'yatra'),
);
?>
    <table class="main" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td class="content-wrap aligncenter">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td class="content-block">
                            <h1 class="aligncenter"><?php echo esc_html($heading); ?></h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content-block aligncenter">
                            <table class="invoice">
                                <tr>
                                    <td style="margin: 0; padding: 0px 0;"
                                        valign="top"><?php echo esc_html($greetings); ?><br><br>
                                        <?php echo wp_kses($byline_text, array('a' => array('href' => array()), 'br'=>array(), 'strong'=>array())); ?>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="margin: 0; padding: 5px 0;" valign="top">
                                        <table class="invoice-items" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td class="title-holder" style="margin: 0;" valign="top" colspan="2">
                                                    <h3 class="alignleft"><?php echo esc_html__('Tour Lists [ {{booking_tours_count}} ]', 'yatra'); ?></h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="2">
                                                    <ul class="tour-lists" style="margin:0;padding:0;">
                                                        {{tour_lists_loop_start}}
                                                        <li style="list-style:none;padding:0; margin:0;margin-top:10px;">
                                                            <?php foreach ($tour_details as $tag_id => $label_name) : ?>
                                                                <div>
                                                                    <strong><?php echo esc_html($label_name); ?></strong>:
                                                                    <span><?php echo esc_html($tag_id); ?></span></div>
                                                            <?php endforeach; ?>
                                                        </li>
                                                        {{tour_lists_loop_end}}
                                                    </ul>
                                                </td>

                                            </tr>
                                            <tr>
                                                <td class="title-holder" style="margin: 0;" valign="top">
                                                    <h3 class="alignleft"><?php echo esc_html__('Billing Details', 'yatra'); ?></h3>
                                                </td>
                                            </tr>
                                            <?php foreach ($billing_details as $tag => $label) : ?>
                                                <tr>
                                                    <td><?php echo esc_html($label); ?></td>
                                                    <td class="alignright"><?php echo esc_html($tag); ?></td>
                                                </tr>
                                            <?php endforeach; ?>

                                            <tr>
                                                <td class="title-holder" style="margin: 0;" valign="top">
                                                    <h3 class="alignleft"><?php echo esc_html__('Payment Details', 'yatra'); ?></h3>
                                                </td>
                                            </tr>
                                            <?php foreach ($payment_details as $p_tag_id => $p_label) : ?>
                                                <tr>
                                                    <td><?php echo esc_html($p_label); ?></td>
                                                    <td class="alignright"><?php echo $p_tag_id==='{{discount}}' ? ' - ': ''; echo esc_html($p_tag_id); ?></td>
                                                </tr>
                                            <?php endforeach; ?>
                                            <tr class="total">
                                                <td class="alignright"><?php echo esc_html__('Net total', 'yatra'); ?></td>
                                                <td class="alignright"><?php echo esc_html("{{net_booking_price}}"); ?></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <?php if ('admin' === $email_to) : ?>
                        <tr>
                            <td class="content-block aligncenter">
                                <a href="{{home_url}}"><?php esc_html_e('View booking on your website', 'yatra'); ?></a>
                            </td>
                        </tr>
                    <?php endif; ?>
                    <tr>
                        <td class="content-block aligncenter">
                            <a target="_blank" href="{{home_url}}">{{blog_info}}</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
<?php
