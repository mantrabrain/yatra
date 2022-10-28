<?php

namespace Yatra\Core;

// Exit if accessed directly
defined('ABSPATH') || exit;

/**
 * EDD_Cart Class
 *
 * @since 2.1.12
 */
class Cart
{
    /**
     * Cart contents
     *
     * @var array
     * @since 2.1.12
     */
    public $contents = array();

    /**
     * Details of the cart contents
     *
     * @var array
     * @since 2.1.12
     */
    public $details = array();

    /**
     * Cart Quantity
     *
     * @var int
     * @since 2.1.12
     */
    public $quantity = 0;

    /**
     * Subtotal
     *
     * @var float
     * @since 2.1.12
     */
    public $subtotal = 0.00;

    /**
     * Total
     *
     * @var float
     * @since 2.1.12
     */
    public $total = 0.00;

    /**
     * Fees
     *
     * @var array
     * @since 2.1.12
     */
    public $fees = array();

    /**
     * Tax
     *
     * @var float
     * @since 2.1.12
     */
    public $tax = 0.00;

    /**
     * Determined tax rate, based on the customer's address.
     * This will be `null` until it is set for the first time.
     *
     * @var float|null
     * @since 3.0
     */
    private $tax_rate = null;

    /**
     * Purchase Session
     *
     * @var array
     * @since 2.1.12
     */
    public $session;

    /**
     * Discount codes
     *
     * @var array
     * @since 2.1.12
     */
    public $discounts = array();

    /**
     * Cart saving
     *
     * @var bool
     * @since 2.1.12
     */
    public $saving;

    /**
     * Saved cart
     *
     * @var array
     * @since 2.1.12
     */
    public $saved;

    /**
     * Has discount?
     *
     * @var bool
     * @since 2.1.12
     */
    public $has_discounts = null;

    /**
     * Constructor.
     *
     * @since 2.1.12
     */
    public function __construct()
    {
        add_action('init', array($this, 'setup_cart'), 1);
    }

    /**
     * Sets up cart components
     *
     * @return void
     * @since  2.1.12
     * @access private
     */
    public function setup_cart()
    {
        $this->get_contents_from_session();
        $this->get_contents();
        $this->get_contents_details();
        $this->get_all_fees();
        $this->get_discounts_from_session();
        $this->get_quantity();
    }

    /**
     * Retrieves the tax rate.
     *
     * This sets up the tax rate once so we don't have to recaculate it each time we need it.
     *
     * @return float
     * @since 3.0
     */
    private function get_tax_rate()
    {
        if (null === $this->tax_rate) {
            $this->tax_rate = yatra_get_tax_rate();
        }

        return $this->tax_rate;
    }

    /**
     * Sets the tax rate.
     *
     * @param float $tax_rate
     *
     * @since 3.0
     */
    public function set_tax_rate($tax_rate)
    {
        $this->tax_rate = $tax_rate;
    }

    /**
     * Populate the cart with the data stored in the session
     *
     * @return void
     * @since 2.1.12
     */
    public function get_contents_from_session()
    {
        $cart = yatra()->session->get('yatra_cart');
        $this->contents = $cart;

        do_action('yatra_cart_contents_loaded_from_session', $this);
    }

    /**
     * Populate the discounts with the data stored in the session.
     *
     * @return void
     * @since  2.1.12
     */
    public function get_discounts_from_session()
    {
        $discounts = yatra()->session->get('cart_discounts');
        $this->discounts = $discounts;

        do_action('yatra_cart_discounts_loaded_from_session', $this);
    }

    /**
     * Get cart contents
     *
     * @return array List of cart contents.
     * @since 2.1.12
     */
    public function get_contents()
    {
        if (!did_action('yatra_cart_contents_loaded_from_session')) {
            $this->get_contents_from_session();
        }

        $cart = is_array($this->contents) && !empty($this->contents) ? array_values($this->contents) : array();
        $cart_count = count($cart);

        foreach ($cart as $key => $item) {
            $download = new EDD_Download($item['id']);

            // If the item is not a download or it's status has changed since it was added to the cart.
            if (empty($download->ID) || !$download->can_purchase()) {
                unset($cart[$key]);
            }
        }

        // We've removed items, reset the cart session
        if (count($cart) < $cart_count) {
            $this->contents = $cart;
            $this->update_cart();
        }

        $this->contents = apply_filters('yatra_cart_contents', $cart);

        do_action('yatra_cart_contents_loaded');

        return (array)$this->contents;
    }

    /**
     * Get cart contents details
     *
     * @return array
     * @since 2.1.12
     */
    public function get_contents_details()
    {
        global $yatra_is_last_cart_item, $yatra_flat_discount_total;

        if (empty($this->contents)) {
            return array();
        }

        $details = array();
        $length = count($this->contents) - 1;

        foreach ($this->contents as $key => $item) {
            if ($key >= $length) {
                $yatra_is_last_cart_item = true;
            }

            $item['quantity'] = yatra_item_quantities_enabled() ? absint($item['quantity']) : 1;
            $item['quantity'] = max(1, $item['quantity']); // Force quantity to 1

            $options = isset($item['options']) ? $item['options'] : array();

            $price_id = isset($options['price_id']) ? $options['price_id'] : null;

            $item_price = $this->get_item_price($item['id'], $options);
            $discount = $this->get_item_discount_amount($item);
            $discount = apply_filters('yatra_get_cart_content_details_item_discount_amount', $discount, $item);
            $quantity = $this->get_item_quantity($item['id'], $options);
            $fees = $this->get_fees('fee', $item['id'], $price_id);
            $subtotal = floatval($item_price) * $quantity;

            // Subtotal for tax calculation must exclude fees that are greater than 0. See $this->get_tax_on_fees()
            $subtotal_for_tax = $subtotal;

            foreach ($fees as $fee) {

                $fee_amount = (float)$fee['amount'];
                $subtotal += $fee_amount;

                if ($fee_amount > 0) {
                    continue;
                }

                $subtotal_for_tax += $fee_amount;
            }

            $tax = $this->get_item_tax($item['id'], $options, $subtotal_for_tax - $discount);

            if (yatra_prices_include_tax()) {
                $subtotal -= round($tax, yatra_currency_decimal_filter());
            }

            $total = $subtotal - $discount + $tax;

            if ($total < 0) {
                $total = 0;
            }

            $details[$key] = array(
                'name' => get_the_title($item['id']),
                'id' => $item['id'],
                'item_number' => $item,
                'item_price' => round($item_price, yatra_currency_decimal_filter()),
                'quantity' => $quantity,
                'discount' => round($discount, yatra_currency_decimal_filter()),
                'subtotal' => round($subtotal, yatra_currency_decimal_filter()),
                'tax' => round($tax, yatra_currency_decimal_filter()),
                'fees' => $fees,
                'price' => round($total, yatra_currency_decimal_filter())
            );

            if ($yatra_is_last_cart_item) {
                $yatra_is_last_cart_item = false;
                $yatra_flat_discount_total = 0.00;
            }
        }

        $this->details = $details;

        return $this->details;
    }

    /**
     * Get Discounts.
     *
     * @return array $discounts The active discount codes
     * @since 2.1.12
     */
    public function get_discounts()
    {
        $this->get_discounts_from_session();
        $this->discounts = !empty($this->discounts) ? explode('|', $this->discounts) : array();
        return $this->discounts;
    }

    /**
     * Update Cart
     *
     * @return void
     * @since 2.1.12
     */
    public function update_cart()
    {
        yatra()->session->set('yatra_cart', $this->contents);
    }

    /**
     * Checks if any discounts have been applied to the cart
     *
     * @return bool
     * @since 2.1.12
     */
    public function has_discounts()
    {
        if (null !== $this->has_discounts) {
            return $this->has_discounts;
        }

        $has_discounts = false;

        $discounts = $this->get_discounts();
        if (!empty($discounts)) {
            $has_discounts = true;
        }

        $this->has_discounts = apply_filters('yatra_cart_has_discounts', $has_discounts);

        return $this->has_discounts;
    }

    /**
     * Get quantity
     *
     * @return int
     * @since 2.1.12
     */
    public function get_quantity()
    {
        $total_quantity = 0;

        $contents = $this->get_contents();
        if (!empty($contents)) {
            $quantities = wp_list_pluck($this->contents, 'quantity');
            $total_quantity = absint(array_sum($quantities));
        }

        $this->quantity = apply_filters('yatra_get_cart_quantity', $total_quantity, $this->contents);
        return $this->quantity;
    }

    /**
     * Checks if the cart is empty
     *
     * @return boolean
     * @since 2.1.12
     */
    public function is_empty()
    {
        return 0 === count((array)$this->get_contents());
    }

    /**
     * Add to cart
     *
     * As of EDD 2.1.12, items can only be added to the cart when the object passed extends EDD_Cart_Item
     *
     * @return array $cart Updated cart object
     * @since 2.1.12
     */
    public function add($tour_id, $options = array())
    {
        $tour = new Tour($tour_id);

        if (empty($tour->ID)) {
            return; // Not a download product
        }

        if (!$tour->can_purchase()) {
            return; // Do not allow draft/pending to be purchased if can't edit
        }

        do_action('yatra_pre_add_to_cart', $tour_id, $options);

        /**
         * Pre-Add to Cart Contents.
         *
         * Prior to adding the new item to the cart, allow filtering of the current contents
         *
         * @param array The current cart contents.
         * @param int   The download ID being added to the cart.
         * @param array The options for the item being added including but not limited to quantity.
         * @since 2.1.12 Added the additional $tour_id and $options arguments.
         *
         * @since
         */
        $this->contents = apply_filters('yatra_pre_add_to_cart_contents', $this->contents, $tour_id, $options);

        $quantities_enabled = yatra_item_quantities_enabled() && !yatra_download_quantities_disabled($tour_id);

        if ($download->has_variable_prices() && !isset($options['price_id'])) {
            // Forces to the default price ID if none is specified and download has variable prices
            $options['price_id'] = get_post_meta($download->ID, '_yatra_default_price_id', true);
        }

        if (isset($options['quantity'])) {
            if (is_array($options['quantity'])) {
                $quantity = array();
                foreach ($options['quantity'] as $q) {
                    $quantity[] = $quantities_enabled ? absint(preg_replace('/[^0-9\.]/', '', $q)) : 1;
                }
            } else {
                $quantity = $quantities_enabled ? absint(preg_replace('/[^0-9\.]/', '', $options['quantity'])) : 1;
            }

            unset($options['quantity']);
        } else {
            $quantity = 1;
        }

        // If the price IDs are a string and is a coma separated list, make it an array (allows custom add to cart URLs)
        if (isset($options['price_id']) && !is_array($options['price_id']) && false !== strpos($options['price_id'], ',')) {
            $options['price_id'] = explode(',', $options['price_id']);
        }

        $items = array();

        if (isset($options['price_id']) && is_array($options['price_id'])) {
            // Process multiple price options at once
            foreach ($options['price_id'] as $key => $price) {
                $items[] = array(
                    'id' => $tour_id,
                    'options' => array(
                        'price_id' => preg_replace('/[^0-9\.-]/', '', $price)
                    ),
                    'quantity' => is_array($quantity) && isset($quantity[$key]) ? $quantity[$key] : $quantity,
                );
            }
        } else {
            // Sanitize price IDs
            foreach ($options as $key => $option) {
                if ('price_id' == $key) {
                    $options[$key] = preg_replace('/[^0-9\.-]/', '', $option);
                }
            }

            // Add a single item
            $items[] = array(
                'id' => $tour_id,
                'options' => $options,
                'quantity' => $quantity
            );
        }

        foreach ($items as &$item) {
            $item = apply_filters('yatra_add_to_cart_item', $item);
            $to_add = $item;

            if (!is_array($to_add)) {
                return;
            }

            if (!isset($to_add['id']) || empty($to_add['id'])) {
                return;
            }

            if (yatra_item_in_cart($to_add['id'], $to_add['options']) && yatra_item_quantities_enabled()) {
                $key = yatra_get_item_position_in_cart($to_add['id'], $to_add['options']);

                if (is_array($quantity)) {
                    $this->contents[$key]['quantity'] += $quantity[$key];
                } else {
                    $this->contents[$key]['quantity'] += $quantity;
                }
            } else {
                $this->contents[] = $to_add;
            }
        }

        unset($item);

        $this->update_cart();

        do_action('yatra_post_add_to_cart', $tour_id, $options, $items);

        // Clear all the checkout errors, if any
        yatra_clear_errors();

        return count($this->contents) - 1;
    }

    /**
     * Remove from cart
     *
     * @param int $key Cart key to remove. This key is the numerical index of the item contained within the cart array.
     * @return array Updated cart contents
     * @since 2.1.12
     *
     */
    public function remove($key)
    {
        $cart = $this->get_contents();

        do_action('yatra_pre_remove_from_cart', $key);

        if (!is_array($cart)) {
            return true; // Empty cart
        } else {
            $item_id = isset($cart[$key]['id']) ? $cart[$key]['id'] : null;
            unset($cart[$key]);
        }

        $this->contents = $cart;
        $this->update_cart();

        do_action('yatra_post_remove_from_cart', $key, $item_id);

        yatra_clear_errors();

        return $this->contents;
    }

    /**
     * Generate the URL to remove an item from the cart.
     *
     * @param int $cart_key Cart item key
     * @return string $remove_url URL to remove the cart item
     * @since 2.1.12
     *
     */
    public function remove_item_url($cart_key)
    {

        $current_page = yatra_doing_ajax()
            ? yatra_get_checkout_uri()
            : yatra_get_current_page_url();

        $remove_url = yatra_add_cache_busting(add_query_arg(array(
            'cart_item' => urlencode($cart_key),
            'yatra_action' => 'remove',
        ), $current_page));

        return apply_filters('yatra_remove_item_url', $remove_url);
    }

    /**
     * Generate the URL to remove a fee from the cart.
     *
     * @param int $fee_id Fee ID.
     * @return string $remove_url URL to remove the cart item
     * @since 2.1.12
     *
     */
    public function remove_fee_url($fee_id = '')
    {

        $current_page = yatra_doing_ajax()
            ? yatra_get_checkout_uri()
            : yatra_get_current_page_url();

        $remove_url = add_query_arg(array(
            'fee' => urlencode($fee_id),
            'yatra_action' => 'remove_fee',
            'nocache' => 'true'
        ), $current_page);

        return apply_filters('yatra_remove_fee_url', $remove_url);
    }

    /**
     * Empty the cart
     *
     * @return void
     * @since 2.1.12
     */
    public function empty_cart()
    {

        // Remove cart contents.
        yatra()->session->set('yatra_cart', NULL);

        // Remove all cart fees.
        yatra()->session->set('yatra_cart_fees', NULL);

        // Remove any resuming payments.
        yatra()->session->set('yatra_resume_payment', NULL);

        // Remove any active discounts
        $this->remove_all_discounts();
        $this->contents = array();

        do_action('yatra_empty_cart');
    }

    /**
     * Remove discount from the cart
     *
     * @return array Discount codes
     * @since 2.1.12
     */
    public function remove_discount($code = '')
    {
        if (empty($code)) {
            return;
        }

        if ($this->discounts) {
            $key = array_search($code, $this->discounts);

            if (false !== $key) {
                unset($this->discounts[$key]);
            }

            $this->discounts = implode('|', array_values($this->discounts));

            // update the active discounts
            yatra()->session->set('cart_discounts', $this->discounts);
        }

        do_action('yatra_cart_discount_removed', $code, $this->discounts);
        do_action('yatra_cart_discounts_updated', $this->discounts);

        return $this->discounts;
    }

    /**
     * Remove all discount codes
     *
     * @return void
     * @since 2.1.12
     */
    public function remove_all_discounts()
    {
        yatra()->session->set('cart_discounts', null);
        do_action('yatra_cart_discounts_removed');
    }

    /**
     * Get the discounted amount on a price
     *
     * @param array $item Cart item.
     * @param bool|string $discount False to use the cart discounts or a string to check with a discount code.
     * @return float The discounted amount
     * @since 3.0 Use `yatra_get_item_discount_amount()` for calculations.
     *
     * @since 2.1.12
     */
    public function get_item_discount_amount($item = array(), $discount = false)
    {
        // Validate item.
        if (empty($item) || empty($item['id'])) {
            return 0;
        }

        if (!isset($item['quantity'])) {
            return 0;
        }

        if (!isset($item['options'])) {
            $item['options'] = array();

            /*
             * Support for variable pricing when calling `yatra_get_cart_item_discount_amount()`
             * @link https://github.com/easydigitaldownloads/easy-digital-downloads/issues/8246
             */
            if (isset($item['item_number']['options'])) {
                $item['options'] = $item['item_number']['options'];
            }
        }

        $discounts = false === $discount
            ? $this->get_discounts()
            : array($discount);

        $item_price = $this->get_item_price($item['id'], $item['options']);
        $discount_amount = yatra_get_item_discount_amount($item, $this->get_contents(), $discounts, $item_price);

        $discounted_amount = ($item_price - $discount_amount);

        /**
         * Filters the amount to be discounted from the original cart item amount.
         *
         * @param float $discounted_amount Amount to be discounted from the cart item amount.
         * @param string[] $discounts Discount codes applied to the Cart.
         * @param array $item Cart item.
         * @param float $item_price Cart item price.
         * @since unknown
         *
         */
        $discounted_amount = apply_filters(
            'yatra_get_cart_item_discounted_amount',
            $discounted_amount,
            $discounts,
            $item,
            $item_price
        );

        // Recalculate using the legacy filter discounted amount.
        $discount_amount = round(($item_price - $discounted_amount), yatra_currency_decimal_filter());

        return $discount_amount;
    }

    /**
     * Shows the fully formatted cart discount
     *
     * @param bool $echo Echo?
     * @return string $amount Fully formatted cart discount
     * @since 2.1.12
     *
     */
    public function display_cart_discount($echo = false)
    {
        $discounts = $this->get_discounts();

        if (empty($discounts)) {
            return false;
        }

        $discount_id = yatra_get_discount_id_by_code($discounts[0]);
        $amount = yatra_format_discount_rate(yatra_get_discount_type($discount_id), yatra_get_discount_amount($discount_id));

        if ($echo) {
            echo esc_html($amount);
        }

        return $amount;
    }

    /**
     * Checks to see if an item is in the cart.
     *
     * @param int $tour_id Tour ID of the item to check.
     * @param array $options
     * @return bool
     * @since 2.1.12
     *
     */
    public function is_item_in_cart($tour_id = 0, $options = array())
    {
        $cart = $this->get_contents();

        $ret = false;

        if (is_array($cart)) {
            foreach ($cart as $item) {
                if ($item['id'] == $tour_id) {
                    if (isset($options['price_id']) && isset($item['options']['price_id'])) {
                        if ($options['price_id'] == $item['options']['price_id']) {
                            $ret = true;
                            break;
                        }
                    } else {
                        $ret = true;
                        break;
                    }
                }
            }
        }

        return (bool)apply_filters('yatra_item_in_cart', $ret, $tour_id, $options);
    }

    /**
     * Get the position of an item in the cart
     *
     * @param int $tour_id Tour ID of the item to check.
     * @param array $options
     * @return mixed int|false
     * @since 2.1.12
     *
     */
    public function get_item_position($tour_id = 0, $options = array())
    {
        $cart = $this->get_contents();

        if (!is_array($cart)) {
            return false;
        } else {
            foreach ($cart as $position => $item) {
                if ($item['id'] == $tour_id) {
                    if (isset($options['price_id']) && isset($item['options']['price_id'])) {
                        if ((int)$options['price_id'] == (int)$item['options']['price_id']) {
                            return $position;
                        }
                    } else {
                        return $position;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Get the quantity of an item in the cart.
     *
     * @param int $tour_id Tour ID of the item
     * @param array $options
     * @return int Numerical index of the position of the item in the cart
     * @since 2.1.12
     *
     */
    public function get_item_quantity($tour_id = 0, $options = array())
    {
        $key = $this->get_item_position($tour_id, $options);

        $quantity = isset($this->contents[$key]['quantity']) && yatra_item_quantities_enabled() ? $this->contents[$key]['quantity'] : 1;

        if ($quantity < 1) {
            $quantity = 1;
        }

        return absint(apply_filters('yatra_get_cart_item_quantity', $quantity, $tour_id, $options));
    }

    /**
     * Set the quantity of an item in the cart.
     *
     * @param int $tour_id Tour ID of the item
     * @param int $quantity Updated quantity of the item
     * @param array $options
     * @return array $contents Updated cart object.
     * @since 2.1.12
     *
     */
    public function set_item_quantity($tour_id = 0, $quantity = 1, $options = array())
    {
        $key = $this->get_item_position($tour_id, $options);

        if (false === $key) {
            return $this->contents;
        }

        if ($quantity < 1) {
            $quantity = 1;
        }

        $this->contents[$key]['quantity'] = $quantity;
        $this->update_cart();

        do_action('yatra_after_set_cart_item_quantity', $tour_id, $quantity, $options, $this->contents);

        return $this->contents;
    }

    /**
     * Cart Item Price.
     *
     * @param int $item_id Download (cart item) ID number
     * @param array $options Optional parameters, used for defining variable prices
     * @return string Fully formatted price
     * @since 2.1.12
     *
     */
    public function item_price($item_id = 0, $options = array())
    {
        $price = $this->get_item_price($item_id, $options);
        $label = '';

        $price_id = isset($options['price_id']) ? $options['price_id'] : false;

        if (!yatra_is_free_download($item_id, $price_id) && !yatra_download_is_tax_exclusive($item_id)) {
            if (yatra_prices_show_tax_on_checkout() && !yatra_prices_include_tax()) {
                $price += yatra_get_cart_item_tax($item_id, $options, $price);
            }

            if (!yatra_prices_show_tax_on_checkout() && yatra_prices_include_tax()) {
                $price -= yatra_get_cart_item_tax($item_id, $options, $price);
            }

            if (yatra_display_tax_rate()) {
                $label = '&nbsp;&ndash;&nbsp;';

                if (yatra_prices_show_tax_on_checkout()) {
                    $label .= sprintf(__('includes %s tax', 'easy-digital-downloads'), yatra_get_formatted_tax_rate());
                } else {
                    $label .= sprintf(__('excludes %s tax', 'easy-digital-downloads'), yatra_get_formatted_tax_rate());
                }

                $label = apply_filters('yatra_cart_item_tax_description', $label, $item_id, $options);
            }
        }

        $price = yatra_currency_filter(yatra_format_amount($price));

        return apply_filters('yatra_cart_item_price_label', $price . $label, $item_id, $options);
    }

    /**
     * Gets the price of the cart item. Always exclusive of taxes.
     *
     * Do not use this for getting the final price (with taxes and discounts) of an item.
     * Use yatra_get_cart_item_final_price()
     *
     * @param int $tour_id Tour ID for the cart item
     * @param array $options Optional parameters, used for defining variable prices
     * @param bool $remove_tax_from_inclusive Remove the tax amount from tax inclusive priced products.
     * @return float|bool Price for this item
     * @since 2.1.12
     *
     */
    public function get_item_price($tour_id = 0, $options = array(), $remove_tax_from_inclusive = false)
    {
        $price = 0;
        $variable_prices = yatra_has_variable_prices($tour_id);

        if ($variable_prices) {
            $prices = yatra_get_variable_prices($tour_id);

            if ($prices) {
                if (!empty($options)) {
                    $price = isset($prices[$options['price_id']]) ? $prices[$options['price_id']]['amount'] : false;
                } else {
                    $price = false;
                }
            }
        }

        if (!$variable_prices || false === $price) {
            // Get the standard Download price if not using variable prices
            $price = yatra_get_download_price($tour_id);
        }

        if ($remove_tax_from_inclusive && yatra_prices_include_tax()) {
            $price -= $this->get_item_tax($tour_id, $options, $price);
        }

        return apply_filters('yatra_cart_item_price', $price, $tour_id, $options);
    }

    /**
     * Final Price of Item in Cart (incl. discounts and taxes)
     *
     * @param int $item_key Cart item key
     * @return float Final price for the item
     * @since 2.1.12
     *
     */
    public function get_item_final_price($item_key = 0)
    {
        $final_price = $this->details[$item_key]['price'];

        return apply_filters('yatra_cart_item_final_price', $final_price, $item_key);
    }

    /**
     * Calculate the tax for an item in the cart.
     *
     * @param array $tour_id Tour ID
     * @param array $options Cart item options
     * @param float $subtotal Cart item subtotal
     * @return float Tax amount
     * @since 2.1.12
     *
     */
    public function get_item_tax($tour_id = 0, $options = array(), $subtotal = '')
    {
        $tax = 0;

        if (!yatra_download_is_tax_exclusive($tour_id)) {
            $country = !empty($_POST['billing_country']) ? $_POST['billing_country'] : false;
            $state = !empty($_POST['card_state']) ? $_POST['card_state'] : false;

            $tax = yatra_calculate_tax($subtotal, $country, $state, true, $this->get_tax_rate());
        }

        $tax = max($tax, 0);

        return apply_filters('yatra_get_cart_item_tax', $tax, $tour_id, $options, $subtotal);
    }

    /**
     * Get Cart Fees
     *
     * @return array Cart fees
     * @since 2.1.12
     */
    public function get_fees($type = 'all', $tour_id = 0, $price_id = null)
    {
        return [];
    }

    /**
     * Get All Cart Fees.
     *
     * @return array
     * @since 2.1.12
     */
    public function get_all_fees()
    {
        return [];
    }

    /**
     * Get Cart Items Subtotal.
     *
     * @param array $items Cart items array
     * @return float items subtotal
     * @since 2.1.12
     *
     */
    public function get_items_subtotal($items)
    {
        $subtotal = 0.00;

        if (is_array($items) && !empty($items)) {
            $prices = wp_list_pluck($items, 'subtotal');

            if (is_array($prices)) {
                $subtotal = array_sum($prices);
            } else {
                $subtotal = 0.00;
            }

            if ($subtotal < 0) {
                $subtotal = 0.00;
            }
        }

        $this->subtotal = apply_filters('yatra_get_cart_items_subtotal', $subtotal);

        return $this->subtotal;
    }

    /**
     * Get Discountable Subtotal.
     *
     * @return float Total discountable amount before taxes
     * @since 2.1.12
     */
    public function get_discountable_subtotal($code_id)
    {
        $cart_items = $this->get_contents_details();
        $items = array();

        $excluded_products = yatra_get_discount_excluded_products($code_id);

        if ($cart_items) {
            foreach ($cart_items as $item) {
                if (!in_array($item['id'], $excluded_products)) {
                    $items[] = $item;
                }
            }
        }

        $subtotal = $this->get_items_subtotal($items);

        return apply_filters('yatra_get_cart_discountable_subtotal', $subtotal);
    }

    /**
     * Get Discounted Amount.
     *
     * @param bool $discounts Discount codes
     * @return float|mixed|void Total discounted amount
     * @since 2.1.12
     *
     */
    public function get_discounted_amount($discounts = false)
    {
        $amount = 0.00;
        $items = $this->get_contents_details();

        if ($items) {
            $discounts = wp_list_pluck($items, 'discount');

            if (is_array($discounts)) {
                $discounts = array_map('floatval', $discounts);
                $amount = array_sum($discounts);
            }
        }

        return apply_filters('yatra_get_cart_discounted_amount', $amount);
    }

    /**
     * Get Cart Subtotal.
     *
     * Gets the total price amount in the cart before taxes and before any discounts.
     *
     * @return float Total amount before taxes
     * @since 2.1.12
     *
     */
    public function get_subtotal()
    {
        $items = $this->get_contents_details();
        $subtotal = $this->get_items_subtotal($items);

        return apply_filters('yatra_get_cart_subtotal', $subtotal);
    }

    /**
     * Subtotal (before taxes).
     *
     * @return float Total amount before taxes fully formatted
     * @since 2.1.12
     */
    public function subtotal()
    {
        return esc_html(yatra_currency_filter(yatra_format_amount(yatra_get_cart_subtotal())));
    }

    /**
     * Get Total Cart Amount.
     *
     * @param bool $discounts Array of discounts to apply (needed during AJAX calls)
     * @return float Cart amount
     * @since 2.1.12
     *
     */
    public function get_total($discounts = false)
    {
        $subtotal = (float)$this->get_subtotal();
        $discounts = (float)$this->get_discounted_amount();
        $fees = (float)$this->get_total_fees();
        $cart_tax = (float)$this->get_tax();
        $total_wo_tax = $subtotal - $discounts + $fees;
        $total = $subtotal - $discounts + $cart_tax + $fees;

        if ($total < 0 || !$total_wo_tax > 0) {
            $total = 0.00;
        }

        $this->total = (float)apply_filters('yatra_get_cart_total', $total);

        return $this->total;
    }

    /**
     * Fully Formatted Total Cart Amount.
     *
     * @param bool $echo
     * @return mixed|string|void
     * @since 2.1.12
     *
     */
    public function total($echo = false)
    {
        $total = apply_filters('yatra_cart_total', yatra_currency_filter(yatra_format_amount($this->get_total())));

        if ($echo) {
            echo esc_html($total);
        }

        return $total;
    }

    /**
     * Get Cart Fee Total
     *
     * @return double
     * @since 2.1.12
     */
    public function get_total_fees()
    {
        $fee_total = 0.00;

        foreach ($this->get_fees() as $fee) {

            // Since fees affect cart item totals, we need to not count them towards the cart total if there is an association.
            if (!empty($fee['tour_id'])) {
                continue;
            }

            $fee_total += $fee['amount'];
        }

        return apply_filters('yatra_get_fee_total', $fee_total, $this->fees);
    }

    /**
     * Get the price ID for an item in the cart.
     *
     * @param array $item Item details
     * @return string $price_id Price ID
     * @since 2.1.12
     *
     */
    public function get_item_price_id($item = array())
    {
        if (isset($item['item_number'])) {
            $price_id = isset($item['item_number']['options']['price_id']) ? $item['item_number']['options']['price_id'] : null;
        } else {
            $price_id = isset($item['options']['price_id']) ? $item['options']['price_id'] : null;
        }

        return $price_id;
    }

    /**
     * Get the price name for an item in the cart.
     *
     * @param array $item Item details
     * @return string $name Price name
     * @since 2.1.12
     *
     */
    public function get_item_price_name($item = array())
    {
        $price_id = (int)$this->get_item_price_id($item);
        $prices = yatra_get_variable_prices($item['id']);
        $name = !empty($prices[$price_id]) ? $prices[$price_id]['name'] : '';

        return apply_filters('yatra_get_cart_item_price_name', $name, $item['id'], $price_id, $item);
    }

    /**
     * Get the name of an item in the cart.
     *
     * @param array $item Item details
     * @return string $name Item name
     * @since 2.1.12
     *
     */
    public function get_item_name($item = array())
    {
        $item_title = get_the_title($item['id']);

        if (empty($item_title)) {
            $item_title = $item['id'];
        }

        if (yatra_has_variable_prices($item['id']) && false !== yatra_get_cart_item_price_id($item)) {
            $item_title .= ' - ' . yatra_get_cart_item_price_name($item);
        }

        return apply_filters('yatra_get_cart_item_name', $item_title, $item['id'], $item);
    }

    /**
     * Get all applicable tax for the items in the cart
     *
     * @return float Total tax amount
     * @since 2.1.12
     */
    public function get_tax()
    {
        $cart_tax = 0;
        $items = $this->get_contents_details();

        if ($items) {

            $taxes = wp_list_pluck($items, 'tax');

            if (is_array($taxes)) {
                $cart_tax = array_sum($taxes);
            }
        }
        $cart_tax += $this->get_tax_on_fees();

        $subtotal = $this->get_subtotal();
        if (empty($subtotal)) {
            $cart_tax = 0;
        }

        $cart_tax = apply_filters('yatra_get_cart_tax', yatra_sanitize_amount($cart_tax));

        return $cart_tax;
    }

    /**
     * Gets the total tax amount for the cart contents in a fully formatted way
     *
     * @param boolean $echo Decides if the result should be returned or not
     * @return string Total tax amount
     * @since 2.1.12
     *
     */
    public function tax($echo = false)
    {
        $cart_tax = $this->get_tax();
        $cart_tax = yatra_currency_filter(yatra_format_amount($cart_tax));

        $tax = max($cart_tax, 0);
        $tax = apply_filters('yatra_cart_tax', $cart_tax);

        if ($echo) {
            echo esc_html($tax);
        }

        return $tax;
    }

    /**
     * Get tax applicable for fees.
     *
     * @return float Total taxable amount for fees
     * @since 2.1.12
     */
    public function get_tax_on_fees()
    {
        $tax = 0;
        $fees = yatra_get_cart_fees();

        if ($fees) {
            foreach ($fees as $fee_id => $fee) {
                if (!empty($fee['no_tax']) || $fee['amount'] < 0) {
                    continue;
                }

                /**
                 * Fees (at this time) must be exclusive of tax
                 */
                add_filter('yatra_prices_include_tax', '__return_false');
                $tax += yatra_calculate_tax($fee['amount'], '', '', true, $this->get_tax_rate());
                remove_filter('yatra_prices_include_tax', '__return_false');
            }
        }

        return apply_filters('yatra_get_cart_fee_tax', $tax);
    }

    /**
     * Is Cart Saving Enabled?
     *
     * @return bool
     * @since 2.1.12
     */
    public function is_saving_enabled()
    {
        return yatra_get_option('enable_cart_saving', false);
    }

    /**
     * Checks if the cart has been saved
     *
     * @return bool
     * @since 2.1.12
     */
    public function is_saved()
    {
        if (!$this->is_saving_enabled()) {
            return false;
        }

        $saved_cart = get_user_meta(get_current_user_id(), 'yatra_saved_cart', true);

        if (is_user_logged_in()) {
            if (!$saved_cart) {
                return false;
            }

            if ($saved_cart === yatra()->session->get('yatra_cart')) {
                return false;
            }

            return true;
        } else {
            if (!isset($_COOKIE['yatra_saved_cart'])) {
                return false;
            }

            if (json_decode(stripslashes($_COOKIE['yatra_saved_cart']), true) === yatra()->session->get('yatra_cart')) {
                return false;
            }

            return true;
        }
    }

    /**
     * Save Cart
     *
     * @return bool
     * @since 2.1.12
     */
    public function save()
    {

        // Bail if carts cannot be saved
        if (!$this->is_saving_enabled()) {
            return false;
        }

        // Get cart & cart token
        $cart = yatra()->session->get('yatra_cart');
        $token = yatra_generate_cart_token();

        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            update_user_meta($user_id, 'yatra_saved_cart', $cart, false);
            update_user_meta($user_id, 'yatra_cart_token', $token, false);
        } else {
            $cart = json_encode($cart);
            $expires = time() + WEEK_IN_SECONDS;
            @setcookie('yatra_saved_cart', $cart, $expires, COOKIEPATH, COOKIE_DOMAIN);
            @setcookie('yatra_cart_token', $token, $expires, COOKIEPATH, COOKIE_DOMAIN);
        }

        // Get all cart messages
        $messages = yatra()->session->get('yatra_cart_messages');

        // Make sure it's an array, if empty
        if (empty($messages)) {
            $messages = array();
        }

        $checkout_url = add_query_arg(
            array(
                'yatra_action' => 'restore_cart',
                'yatra_cart_token' => sanitize_key($token),
            ),
            yatra_get_checkout_uri()
        );

        // Add the success message
        $messages['yatra_cart_save_successful'] = sprintf(
            '<strong>%1$s</strong>: %2$s <a href="%3$s">%3$s</a>',
            __('Success', 'easy-digital-downloads'),
            __('Cart saved successfully. You can restore your cart using this URL:', 'easy-digital-downloads'),
            esc_url(yatra_get_checkout_uri() . '?yatra_action=restore_cart&yatra_cart_token=' . urlencode($token))
        );

        // Set these messages in the session
        yatra()->session->set('yatra_cart_messages', $messages);

        // Return if cart saved
        return !empty($cart);
    }

    /**
     * Restore Cart
     *
     * @return bool
     * @since 2.1.12
     */
    public function restore()
    {
        if (!$this->is_saving_enabled()) {
            return false;
        }

        $user_id = get_current_user_id();
        $saved_cart = get_user_meta($user_id, 'yatra_saved_cart', true);
        $token = $this->get_token();

        if (is_user_logged_in() && $saved_cart) {
            $messages = yatra()->session->get('yatra_cart_messages');

            if (!$messages) {
                $messages = array();
            }

            if (isset($_GET['yatra_cart_token']) && !hash_equals($_GET['yatra_cart_token'], $token)) {
                $messages['yatra_cart_restoration_failed'] = sprintf('<strong>%1$s</strong>: %2$s', __('Error', 'easy-digital-downloads'), __('Cart restoration failed. Invalid token.', 'easy-digital-downloads'));
                yatra()->session->set('yatra_cart_messages', $messages);
            }

            delete_user_meta($user_id, 'yatra_saved_cart');
            delete_user_meta($user_id, 'yatra_cart_token');

            if (isset($_GET['yatra_cart_token']) && $_GET['yatra_cart_token'] != $token) {
                return new WP_Error('invalid_cart_token', __('The cart cannot be restored. Invalid token.', 'easy-digital-downloads'));
            }
        } elseif (!is_user_logged_in() && isset($_COOKIE['yatra_saved_cart']) && $token) {
            $saved_cart = $_COOKIE['yatra_saved_cart'];

            if (!hash_equals($_GET['yatra_cart_token'], $token)) {
                $messages['yatra_cart_restoration_failed'] = sprintf('<strong>%1$s</strong>: %2$s', __('Error', 'easy-digital-downloads'), __('Cart restoration failed. Invalid token.', 'easy-digital-downloads'));
                yatra()->session->set('yatra_cart_messages', $messages);

                return new WP_Error('invalid_cart_token', __('The cart cannot be restored. Invalid token.', 'easy-digital-downloads'));
            }

            $saved_cart = json_decode(stripslashes($saved_cart), true);

            setcookie('yatra_saved_cart', '', time() - 3600, COOKIEPATH, COOKIE_DOMAIN);
            setcookie('yatra_cart_token', '', time() - 3600, COOKIEPATH, COOKIE_DOMAIN);
        }

        $messages['yatra_cart_restoration_successful'] = sprintf('<strong>%1$s</strong>: %2$s', __('Success', 'easy-digital-downloads'), __('Cart restored successfully.', 'easy-digital-downloads'));
        yatra()->session->set('yatra_cart', $saved_cart);
        yatra()->session->set('yatra_cart_messages', $messages);

        // @e also have to set this instance to what the session is.
        $this->contents = $saved_cart;

        return true;
    }

    /**
     * Retrieve a saved cart token. Used in validating saved carts
     *
     * @return int
     * @since 2.1.12
     */
    public function get_token()
    {
        $user_id = get_current_user_id();

        if (is_user_logged_in()) {
            $token = get_user_meta($user_id, 'yatra_cart_token', true);
        } else {
            $token = isset($_COOKIE['yatra_cart_token']) ? $_COOKIE['yatra_cart_token'] : false;
        }

        return apply_filters('yatra_get_cart_token', $token, $user_id);
    }

    /**
     * Generate URL token to restore the cart via a URL
     *
     * @return int
     * @since 2.1.12
     */
    public function generate_token()
    {
        return apply_filters('yatra_generate_cart_token', md5(mt_rand() . time()));
    }
}
