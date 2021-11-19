<?php
function yatra_let_to_num($size)
{
    $l = substr($size, -1);
    $ret = (int)substr($size, 0, -1);
    switch (strtoupper($l)) {
        case 'P':
            $ret *= 1024;
// No break.
        case 'T':
            $ret *= 1024;
// No break.
        case 'G':
            $ret *= 1024;
// No break.
        case 'M':
            $ret *= 1024;
// No break.
        case 'K':
            $ret *= 1024;
// No break.
    }
    return $ret;
}

function yatra_clean($var)
{
    if (is_array($var)) {
        return array_map('yatra_clean', $var);
    } else {
        return is_scalar($var) ? sanitize_text_field($var) : $var;
    }
}

function yatra_get_price_decimal_separator()
{
    $separator = apply_filters('yatra_get_price_decimal_separator', false);

    return $separator ? stripslashes($separator) : '.';
}

function yatra_get_price_decimals()
{
    return absint(apply_filters('yatra_get_price_decimals', 2));
}

function yatra_get_rounding_precision()
{
    $precision = yatra_get_price_decimals() + 2;
    if (absint(YATRA_ROUNDING_PRECISION) > $precision) {
        $precision = absint(YATRA_ROUNDING_PRECISION);
    }
    return $precision;
}

function yatra_format_decimal($number, $dp = false, $trim_zeros = false)
{
    $locale = localeconv();
    $decimals = array(yatra_get_price_decimal_separator(), $locale['decimal_point'], $locale['mon_decimal_point']);

    // Remove locale from string.
    if (!is_float($number)) {
        $number = str_replace($decimals, '.', $number);

        // Convert multiple dots to just one.
        $number = preg_replace('/\.(?![^.]+$)|[^0-9.-]/', '', yatra_clean($number));
    }

    if (false !== $dp) {
        $dp = intval('' === $dp ? yatra_get_price_decimals() : $dp);
        $number = number_format(floatval($number), $dp, '.', '');
    } elseif (is_float($number)) {
        // DP is false - don't use number format, just return a string using whatever is given. Remove scientific notation using sprintf.
        $number = str_replace($decimals, '.', sprintf('%.' . yatra_get_rounding_precision() . 'f', $number));
        // We already had a float, so trailing zeros are not needed.
        $trim_zeros = true;
    }

    if ($trim_zeros && strstr($number, '.')) {
        $number = rtrim(rtrim($number, '0'), '.');
    }

    return $number;
}
