<?php
/**
 *
 * Enquiry notification tempalte
 *
 * @since 2.1.12
 */

$enquiry_details = array(
    '{{enquiry_fullname}}' => __('Name', 'yatra'),
    '{{enquiry_email}}' => __('Email', 'yatra'),
    '{{enquiry_country}}' => __('Country', 'yatra'),
    '{{enquiry_phone_number}}' => __('Phone Number', 'yatra'),
    '{{enquiry_number_of_adults}}' => __('Number of adults', 'yatra'),
    '{{enquiry_number_of_childs}}' => __('Number of childs', 'yatra'),
    '{{enquiry_subject}}' => __('Subject', 'yatra'),
    '{{enquiry_date}}' => __('Date', 'yatra'),
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
                                    <td style="margin: 0; padding: 5px 0;"
                                        valign="top"><?php echo esc_html($greetings); ?><br><br>
                                        <?php echo wp_kses($byline_text, array('a' => array('href' => array()), 'br' => array(), 'strong' => array())); ?>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="margin: 0; padding: 5px 0;" valign="top">
                                        <table class="invoice-items" cellpadding="0" cellspacing="0">

                                            <tr>
                                                <td class="title-holder" style="margin: 0;" valign="top">
                                                    <h3 class="alignleft"><?php echo esc_html__('Enquiry Details', 'yatra'); ?></h3>
                                                </td>
                                            </tr>
                                            <?php foreach ($enquiry_details as $tag => $label) : ?>
                                                <tr>
                                                    <td><?php echo esc_html($label); ?></td>
                                                    <td class="alignright"><?php echo esc_html($tag); ?></td>
                                                </tr>
                                            <?php endforeach; ?>

                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <?php if ('admin' === $email_to) : ?>
                        <tr>
                            <td class="content-block aligncenter">
                                <a href="{{home_url}}"><?php esc_html_e('View enquiry on your website', 'yatra'); ?></a>
                            </td>
                        </tr>
                    <?php endif; ?>
                    <tr>
                        <td class="content-block aligncenter">
                            {{blog_info}}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
<?php
