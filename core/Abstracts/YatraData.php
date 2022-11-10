<?php

namespace Yatra\Core\Abstracts;

if (!defined('ABSPATH')) {
    exit;
}

abstract class YatraData
{

    protected $id = 0;

    protected $data = array();

    protected $changes = array();

    protected $object_read = false;

    protected $object_type = 'data';

    protected $extra_data = array();

    protected $default_data = array();

    protected $cache_group = '';

    protected $meta_data = null;

    public function __construct()
    {
        $this->data = array_merge($this->data, $this->extra_data);
        $this->default_data = $this->data;
    }


    public function __sleep()
    {
        return array('id');
    }

    public function __wakeup()
    {
        try {
            $this->__construct(absint($this->id));
        } catch (\Exception $e) {
            $this->set_id(0);
        }
    }

    public function __clone()
    {
        if (!empty($this->meta_data)) {
            foreach ($this->meta_data as $array_key => $meta) {
                $this->meta_data[$array_key] = clone $meta;
                if (!empty($meta->id)) {
                    $this->meta_data[$array_key]->id = null;
                }
            }
        }
    }


    public function get_id()
    {
        return $this->id;
    }

    public function __toString()
    {
        return wp_json_encode($this->get_data());
    }

    public function get_data()
    {
        return array_merge(array('id' => $this->get_id()), $this->data, array('meta_data' => []));
    }

    public function get_data_keys()
    {
        return array_keys($this->data);
    }

    public function get_extra_data_keys()
    {
        return array_keys($this->extra_data);
    }

    public function set_id($id)
    {
        $this->id = absint($id);
    }

    public function set_props($props, $context = 'set')
    {
        $errors = false;

        foreach ($props as $prop => $value) {
            try {
                /**
                 * Checks if the prop being set is allowed, and the value is not null.
                 */
                if (is_null($value) || in_array($prop, array('prop', 'date_prop', 'meta_data'), true)) {
                    continue;
                }
                $setter = "set_$prop";

                if (is_callable(array($this, $setter))) {
                    $this->{$setter}($value);
                }
            } catch (\Exception $e) {
                if (!$errors) {
                    $errors = new \WP_Error();
                }
                $errors->add($e->getCode(), $e->getMessage());
            }
        }

        return $errors && count($errors->get_error_codes()) ? $errors : true;
    }

    protected function set_prop($prop, $value)
    {
        if (array_key_exists($prop, $this->data)) {
            if (true === $this->object_read) {
                if ($value !== $this->data[$prop] || array_key_exists($prop, $this->changes)) {
                    $this->changes[$prop] = $value;
                }
            } else {
                $this->data[$prop] = $value;
            }
        }
    }

    public function get_changes()
    {
        return $this->changes;
    }

    protected function get_hook_prefix()
    {
        return 'yatra_' . $this->object_type . '_get_';
    }

    protected function get_prop($prop, $context = 'view')
    {
        $value = null;

        if (array_key_exists($prop, $this->data)) {
            $value = array_key_exists($prop, $this->changes) ? $this->changes[$prop] : $this->data[$prop];

            if ('view' === $context) {
                $value = apply_filters($this->get_hook_prefix() . $prop, $value, $this);
            }
        }

        return $value;
    }


}
