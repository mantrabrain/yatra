<?php
/**
 * Shared React mount for customer account (virtual route + [yatra_my_account] shortcode).
 *
 * Expects boolean $yatra_account_react_embed: false = standalone full page, true = inside theme content.
 */
defined('ABSPATH') || exit();

$embed = !empty($yatra_account_react_embed);
$min_h = $embed ? 'min(85vh, 900px)' : '100vh';
?>
<div id="yatra-account-page-root" class="yatra-account-react-root<?php echo $embed ? ' yatra-account-react-root--embed' : ''; ?>" style="width:100%;min-height:<?php echo esc_attr($min_h); ?>;display:block;"></div>
