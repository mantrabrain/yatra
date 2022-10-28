<?php
/**
 * Cart Functions
 *
 * @package     EDD
 * @subpackage  Cart
 * @copyright   Copyright (c) 2018, Easy Digital Downloads, LLC
 * @license     http://opensource.org/licenses/gpl-2.0.php GNU Public License
 * @since 2.1.12
 */

// Exit if accessed directly
defined('ABSPATH') || exit;

/**
 * Get the contents of the cart
 *
 * @return array Returns an array of cart contents, or an empty array if no items in the cart
 * @since 2.1.12
 */
function yatra_get_cart_contents()
{
    return yatra()->cart->get_contents();
}

/**
 * Retrieve the Cart Content Details
 *
 * Includes prices, tax, etc of all items.
 *
 * @return array $details Cart content details
 * @since 2.1.12
 */
function yatra_get_cart_content_details()
{
    return yatra()->cart->get_contents_details();
}

/**
 * Get Cart Quantity
 *
 * @return int Sum quantity of items in the cart
 * @since 2.1.12
 */
function yatra_get_cart_quantity()
{
    return yatra()->cart->get_quantity();
}

/**
 * Add To Cart
 *
 * Adds a download ID to the shopping cart.
 *
 * @param int $tour_id Download IDs to be added to the cart
 * @param array $options Array of options, such as variable price
 *
 * @return string Cart key of the new item
 * @since 2.1.12
 *
 */
function yatra_add_to_cart($tour_id, $options = array())
{
    return yatra()->cart->add($tour_id, $options);
}

/**
 * Removes a Download from the Cart
 *
 * @param int $cart_key the cart key to remove. This key is the numerical index of the item contained within the cart array.
 * @return array Updated cart items
 * @since 2.1.12
 */
function yatra_remove_from_cart($cart_key)
{
    return yatra()->cart->remove($cart_key);
}

/**
 * Checks to see if an item is already in the cart and returns a boolean
 *
 * @param int $tour_id ID of the download to remove
 * @param array $options
 * @return bool Item in the cart or not?
 * @since 2.1.12
 *
 */
function yatra_item_in_cart($tour_id = 0, $options = array())
{
    return yatra()->cart->is_item_in_cart($tour_id, $options);
}

/**
 * Get the Item Position in Cart
 *
 * @param int $tour_id ID of the download to get position of
 * @param array $options array of price options
 * @return bool|int|string false if empty cart |  position of the item in the cart
 * @since 2.1.12.7.2
 *
 */
function yatra_get_item_position_in_cart($tour_id = 0, $options = array())
{
    return yatra()->cart->get_item_position($tour_id, $options);
}

/**
 * Check if quantities are enabled
 *
 * @return bool
 * @since 2.1.12
 */
function yatra_item_quantities_enabled()
{
    $ret = yatra_get_option('item_quantities', false);
    return (bool)apply_filters('yatra_item_quantities_enabled', $ret);
}

/**
 * Set Cart Item Quantity
 *
 * @param int $tour_id Download (cart item) ID number
 * @param int $quantity
 * @param array $options Download options, such as price ID
 * @return mixed New Cart array
 * @since 2.1.12
 *
 */
function yatra_set_cart_item_quantity($tour_id = 0, $quantity = 1, $options = array())
{
    return yatra()->cart->set_item_quantity($tour_id, $quantity, $options);
}

/**
 * Get Cart Item Quantity
 *
 * @param int $tour_id Download (cart item) ID number
 * @param array $options Download options, such as price ID
 * @return int $quantity Cart item quantity
 * @since 2.1.12
 */
function yatra_get_cart_item_quantity($tour_id = 0, $options = array())
{
    return yatra()->cart->get_item_quantity($tour_id, $options);
}

/**
 * Get Cart Item Price
 *
 * @param int $item_id Download (cart item) ID number
 * @param array $options Optional parameters, used for defining variable prices
 * @return string Fully formatted price
 * @since 2.1.12
 *
 */
function yatra_cart_item_price($item_id = 0, $options = array())
{
    return yatra()->cart->item_price($item_id, $options);
}

/**
 * Get Cart Item Price
 *
 * Gets the price of the cart item. Always exclusive of taxes
 *
 * Do not use this for getting the final price (with taxes and discounts) of an item.
 * Use yatra_get_cart_item_final_price()
 *
 * @param int $tour_id Download ID number
 * @param array $options Optional parameters, used for defining variable prices
 * @param bool $remove_tax_from_inclusive Remove the tax amount from tax inclusive priced products.
 * @return float|bool Price for this item
 * @since 2.1.12
 */
function yatra_get_cart_item_price($tour_id = 0, $options = array(), $remove_tax_from_inclusive = false)
{
    return yatra()->cart->get_item_price($tour_id, $options, $remove_tax_from_inclusive);
}

/**
 * Get cart item's final price
 *
 * Gets the amount after taxes and discounts
 *
 * @param int $item_key Cart item key
 * @return float Final price for the item
 * @since 2.1.12
 */
function yatra_get_cart_item_final_price($item_key = 0)
{
    return yatra()->cart->get_item_final_price($item_key);
}

/**
 * Get cart item tax
 *
 * @param array $tour_id Download ID
 * @param array $options Cart item options
 * @param float $subtotal Cart item subtotal
 * @return float Tax amount
 * @since 2.1.12
 */
function yatra_get_cart_item_tax($tour_id = 0, $options = array(), $subtotal = '')
{
    return yatra()->cart->get_item_tax($tour_id, $options, $subtotal);
}

/**
 * Get Price Name
 *
 * Gets the name of the specified price option,
 * for variable pricing only.
 *
 * @param       $tour_id Download ID number
 * @param array $options Optional parameters, used for defining variable prices
 * @return mixed|void Name of the price option
 * @since 2.1.12
 *
 */
function yatra_get_price_name($tour_id = 0, $options = array())
{
    $return = false;

    if (yatra_has_variable_prices($tour_id) && !empty($options)) {
        $prices = yatra_get_variable_prices($tour_id);
        $name = false;

        if ($prices) {
            if (isset($prices[$options['price_id']])) {
                $name = $prices[$options['price_id']]['name'];
            }
        }
        $return = $name;
    }

    return apply_filters('yatra_get_price_name', $return, $tour_id, $options);
}

/**
 * Get cart item price id
 *
 * @param array $item Cart item array
 * @return int Price id
 * @since 2.1.12
 *
 */
function yatra_get_cart_item_price_id($item = array())
{
    return yatra()->cart->get_item_price_id($item);
}

/**
 * Get cart item price name
 *
 * @param int $item Cart item array
 * @return string Price name
 * @since 2.1.12
 */
function yatra_get_cart_item_price_name($item = array())
{
    return yatra()->cart->get_item_price_name($item);
}

/**
 * Get cart item title
 *
 * @param array $item Cart item array
 * @return string item title
 * @since 2.1.12.3
 */
function yatra_get_cart_item_name($item = array())
{
    return yatra()->cart->get_item_name($item);
}

/**
 * Cart Subtotal
 *
 * Shows the subtotal for the shopping cart (no taxes)
 *
 * @return float Total amount before taxes fully formatted
 * @since 2.1.12
 */
function yatra_cart_subtotal()
{
    return yatra()->cart->subtotal();
}

/**
 * Get Cart Subtotal
 *
 * Gets the total price amount in the cart before taxes and before any discounts
 * uses yatra_get_cart_contents().
 *
 * @return float Total amount before taxes
 * @since 2.1.12.3
 */
function yatra_get_cart_subtotal()
{
    return yatra()->cart->get_subtotal();
}

/**
 * Get Cart Discountable Subtotal.
 *
 * @return float Total discountable amount before taxes
 */
function yatra_get_cart_discountable_subtotal($code_id)
{
    return yatra()->cart->get_discountable_subtotal($code_id);
}

/**
 * Get cart items subtotal
 * @param array $items Cart items array
 *
 * @return float items subtotal
 */
function yatra_get_cart_items_subtotal($items)
{
    return yatra()->cart->get_items_subtotal($items);
}

/**
 * Get Total Cart Amount
 *
 * Returns amount after taxes and discounts
 *
 * @param bool $discounts Array of discounts to apply (needed during AJAX calls)
 * @return float Cart amount
 * @since 2.1.12.1
 */
function yatra_get_cart_total($discounts = false)
{
    return yatra()->cart->get_total($discounts);
}


/**
 * Get Total Cart Amount
 *
 * Gets the fully formatted total price amount in the cart.
 * uses yatra_get_cart_amount().
 *
 * @param bool $echo
 * @return mixed|string|void
 * @since 2.1.12.3
 *
 */
function yatra_cart_total($echo = true)
{
    return yatra()->cart->total($echo);
}

/**
 * Check if cart has fees applied
 *
 * Just a simple wrapper function for EDD_Fees::has_fees()
 *
 * @param string $type
 * @return bool Whether the cart has fees applied or not
 * @uses yatra()->fees->has_fees()
 * @since 2.1.12
 */
function yatra_cart_has_fees($type = 'all')
{
    return yatra()->fees->has_fees($type);
}

/**
 * Get Cart Fees
 *
 * Just a simple wrapper function for EDD_Fees::get_fees()
 *
 * @param string $type
 * @param int $tour_id
 * @return array All the cart fees that have been applied
 * @uses yatra()->fees->get_fees()
 * @since 2.1.12
 */
function yatra_get_cart_fees($type = 'all', $tour_id = 0, $price_id = NULL)
{
    return yatra()->cart->get_fees($type, $tour_id, $price_id);
}

/**
 * Get Cart Fee Total
 *
 * Just a simple wrapper function for EDD_Fees::total()
 *
 * @return float Total Cart Fees
 * @uses yatra()->fees->total()
 * @since 2.1.12
 */
function yatra_get_cart_fee_total()
{
    return yatra()->cart->get_total_fees();
}

/**
 * Get cart tax on Fees
 *
 * @return float Total Cart tax on Fees
 * @uses yatra()->fees->get_fees()
 * @since 2.1.12
 */
function yatra_get_cart_fee_tax()
{
    return yatra()->cart->get_tax_on_fees();
}

/**
 * Is the cart empty?
 *
 * @return bool Is the cart empty?
 * @uses yatra()->cart->is_empty()
 * @since 2.1.12
 */
function yatra_is_cart_empty()
{
    return yatra()->cart->is_empty();
}

/**
 * Get Purchase Summary
 *
 * Retrieves the purchase summary.
 *
 * @param      $purchase_data
 * @param bool $email
 * @return string
 * @since 2.1.12
 *
 */
function yatra_get_purchase_summary($purchase_data, $email = true)
{
    $summary = '';

    if ($email) {
        $summary .= $purchase_data['user_email'] . ' - ';
    }

    if (!empty($purchase_data['downloads'])) {
        foreach ($purchase_data['downloads'] as $download) {
            $summary .= get_the_title($download['id']) . ', ';
        }

        $summary = substr($summary, 0, -2);
    }

    return apply_filters('yatra_get_purchase_summary', $summary, $purchase_data, $email);
}

/**
 * Gets the total tax amount for the cart contents
 *
 * @return mixed|void Total tax amount
 * @since 2.1.12.3
 *
 */
function yatra_get_cart_tax()
{
    return yatra()->cart->get_tax();
}

/**
 * Gets the tax rate charged on the cart.
 *
 * @param string $country Country code for tax rate.
 * @param string $state State for tax rate.
 * @param string $postal_code Postal code for tax rate. Not used by core, but for developers.
 * @return float Tax rate.
 * @since 2.1.12
 */
function yatra_get_cart_tax_rate($country = '', $state = '', $postal_code = '')
{
    $rate = yatra_get_tax_rate($country, $state);

    return (float)apply_filters('yatra_get_cart_tax_rate', $rate, $country, $state, $postal_code);
}

/**
 * Gets the total tax amount for the cart contents in a fully formatted way
 *
 * @param bool $echo Whether to echo the tax amount or not (default: false)
 * @return string Total tax amount (if $echo is set to true)
 * @since 2.1.12.3
 */
function yatra_cart_tax($echo = false)
{
    return yatra()->cart->tax($echo);
}

/**
 * Add Collection to Cart
 *
 * Adds all downloads within a taxonomy term to the cart.
 *
 * @param string $taxonomy Name of the taxonomy
 * @param mixed $terms Slug or ID of the term from which to add | An array of terms
 * @return array Array of IDs for each item added to the cart
 * @since 2.1.12.6
 */
function yatra_add_collection_to_cart($taxonomy, $terms)
{

    // Bail if taxonomy is not a string
    if (!is_string($taxonomy)) {
        return false;
    }

    if (is_numeric($terms)) {
        $terms = get_term($terms, $taxonomy);
        $terms = $terms->slug;
    }

    $cart_item_ids = array();

    $items = get_posts(array(
        'post_type' => 'download',
        'posts_per_page' => -1,
        $taxonomy => $terms
    ));

    if (!empty($items)) {
        foreach ($items as $item) {
            yatra_add_to_cart($item->ID);
            $cart_item_ids[] = $item->ID;
        }
    }

    return $cart_item_ids;
}

/**
 * Returns the URL to remove an item from the cart
 *
 * @param int $cart_key Cart item key
 * @return string $remove_url URL to remove the cart item
 * @since 2.1.12
 * @global $post
 */
function yatra_remove_item_url($cart_key)
{
    return yatra()->cart->remove_item_url($cart_key);
}

/**
 * Returns the URL to remove an item from the cart
 *
 * @param string $fee_id Fee ID
 * @return string $remove_url URL to remove the cart item
 * @since 2.1.12
 * @global $post
 */
function yatra_remove_cart_fee_url($fee_id = '')
{
    return yatra()->cart->remove_fee_url($fee_id);
}

/**
 * Empties the Cart
 *
 * @return void
 * @uses yatra()->session->set()
 * @since 2.1.12
 */
function yatra_empty_cart()
{
    yatra()->cart->empty_cart();
}

/**
 * Store Purchase Data in Sessions
 *
 * Used for storing info about purchase
 *
 * @param $purchase_data
 *
 * @since 2.1.12.5
 *
 * @uses yatra()->session->set()
 */
function yatra_set_purchase_session($purchase_data = array())
{
    yatra()->session->set('yatra_purchase', $purchase_data);
}

/**
 * Retrieve Purchase Data from Session
 *
 * Used for retrieving info about purchase
 * after completing a purchase
 *
 * @return mixed array | false
 * @uses yatra()->session->get()
 * @since 2.1.12.5
 */
function yatra_get_purchase_session()
{
    return yatra()->session->get('yatra_purchase');
}

/**
 * Checks if cart saving has been disabled
 *
 * @return bool Whether or not cart saving has been disabled
 * @since 2.1.12
 */
function yatra_is_cart_saving_disabled()
{
    return !yatra()->cart->is_saving_enabled();
}

/**
 * Checks if a cart has been saved
 *
 * @return bool
 * @since 2.1.12
 */
function yatra_is_cart_saved()
{
    return yatra()->cart->is_saved();
}

/**
 * Process the Cart Save
 *
 * @return bool
 * @since 2.1.12
 */
function yatra_save_cart()
{
    return yatra()->cart->save();
}


/**
 * Process the Cart Restoration
 *
 * @return mixed || false Returns false if cart saving is disabled
 * @since 2.1.12
 */
function yatra_restore_cart()
{
    return yatra()->cart->restore();
}

/**
 * Retrieve a saved cart token. Used in validating saved carts
 *
 * @return int
 * @since 2.1.12
 */
function yatra_get_cart_token()
{
    return yatra()->cart->get_token();
}

/**
 * Delete Saved Carts after one week
 *
 * This function is only intended to be used by WordPress cron.
 *
 * @return void
 * @global $wpdb
 * @since 2.1.12
 */
function yatra_delete_saved_carts()
{
    global $wpdb;

    // Bail if not in WordPress cron
    if (!yatra_doing_cron()) {
        return;
    }

    $start = date('Y-m-d', strtotime('-7 days'));
    $carts = $wpdb->get_results(
        "
		SELECT user_id, meta_key, FROM_UNIXTIME(meta_value, '%Y-%m-%d') AS date
		FROM {$wpdb->usermeta}
		WHERE meta_key = 'yatra_cart_token'
		", ARRAY_A
    );

    if ($carts) {
        foreach ($carts as $cart) {
            $user_id = $cart['user_id'];
            $meta_value = $cart['date'];

            if (strtotime($meta_value) < strtotime('-1 week')) {
                $wpdb->delete(
                    $wpdb->usermeta,
                    array(
                        'user_id' => $user_id,
                        'meta_key' => 'yatra_cart_token'
                    )
                );

                $wpdb->delete(
                    $wpdb->usermeta,
                    array(
                        'user_id' => $user_id,
                        'meta_key' => 'yatra_saved_cart'
                    )
                );
            }
        }
    }
}

add_action('yatra_weekly_scheduled_events', 'yatra_delete_saved_carts');

/**
 * Generate URL token to restore the cart via a URL
 *
 * @return string UNIX timestamp
 * @since 2.1.12
 */
function yatra_generate_cart_token()
{
    return yatra()->cart->generate_token();
}
