<?php

namespace Yatra\Core;

defined('ABSPATH') || exit;

class Helper
{
    public function input($input = '', $old_data = null)
    {
        if (!$old_data) {
            $old_data = $_POST;
        }
        $value = $this->avalue_dot($input, $old_data);
        if ($value) {
            return $value;
        }
        return '';
    }

    public function array_get($key = null, $array = array(), $default = false)
    {
        return $this->avalue_dot($key, $array, $default);
    }

    public function avalue_dot($key = null, $array = array(), $default = false)
    {
        $array = (array)$array;
        if (!$key || !count($array)) {
            return $default;
        }
        $option_key_array = explode('.', $key);

        $value = $array;

        foreach ($option_key_array as $dotKey) {
            if (isset($value[$dotKey])) {
                $value = $value[$dotKey];
            } else {
                return $default;
            }
        }
        return $value;
    }
}
