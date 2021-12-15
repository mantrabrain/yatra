<?php
/**
 * deprecated Functions.
 */

/**
 * @deprecated 2.1.5
 */
function yatra_get_currency_symbols($currency_key = '')
{
    yatra_deprecated_function('yatra_get_currency_symbols', '2.1.5', 'yatra_get_currency_symbol');
    
    return yatra_get_currency_symbol($currency_key);
}