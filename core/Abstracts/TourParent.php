<?php

namespace Yatra\Core\Abstracts;

use Yatra\Core\Data\TourData;

if (!defined('ABSPATH')) {
    exit;
}

abstract class TourParent extends YatraData
{

    /**
     * This is the name of this object type.
     *
     * @var string
     */
    protected $object_type = 'tour';

    /**
     * Cache group.
     *
     * @var string
     */
    protected $cache_group = 'tours';

    /**
     * Stores tour main data.
     *
     * @var array
     */
    protected $data = array(
        'name' => '',
        'status' => '',
        'type' => '',
        'can_book' => true,
        'is_featured' => false,
        'is_fixed_departure' => false,
        'external_url' => '',
        'book_now_text' => '',
    );


    public function __construct($tour = 0)
    {
        parent::__construct($tour);
        if (is_numeric($tour) && $tour > 0) {
            $this->set_id($tour);
        } elseif ($tour instanceof self) {
            $this->set_id(absint($tour->get_id()));
        } elseif (!empty($tour->ID)) {
            $this->set_id(absint($tour->ID));
        }


        $data_store = new TourData();
        if ($this->get_id() > 0) {
            $data_store->read($this);
        }
    }

    /**
     * Get tour type.
     *
     * @param string $context What the value is for. Valid values are view and edit.
     * @return string
     * @since  2.1.12
     */
    public function get_type()
    {
        return $this->get_prop('type');
    }

    /**
     * Get tour name.
     *
     * @param string $context What the value is for. Valid values are view and edit.
     * @return string
     * @since  2.1.12
     */
    public function get_name($context = 'view')
    {
        return $this->get_prop('name', $context);
    }

    /**
     * Get tour status.
     *
     * @param string $context What the value is for. Valid values are view and edit.
     * @return string
     * @since  2.1.12
     */
    public function get_status($context = 'view')
    {
        return $this->get_prop('status', $context);
    }

    /**
     * Get tour can book.
     *
     * @param string $context What the value is for. Valid values are view and edit.
     * @return string
     * @since  2.1.12
     */
    public function get_can_book($context = 'view')
    {
        return $this->get_prop('can_book', $context) && !self::is_type('external');
    }

    public function get_can_show_calendar($context = 'view')
    {
        return $this->get_prop('can_book', $context) || self::is_type('external');
    }

    /*
    |--------------------------------------------------------------------------
    | Setters
    |--------------------------------------------------------------------------
    |
    | Functions for setting tour data. These should not update anything in the
    | database itself and should only change what is stored in the class
    | object.
    */

    /**
     * Set tour name.
     *
     * @param string $name tour name.
     * @since 2.1.12
     */
    public function set_name($name)
    {
        $this->set_prop('name', $name);
    }

    /**
     * Set tour name.
     *
     * @param string $status Tour Status
     * @since 2.1.12
     */
    public function set_status($status)
    {
        $this->set_prop('status', $status);
    }

    /**
     * Set tour type.
     *
     * @param string $type Tour Type
     * @since 2.1.12
     */
    public function set_type($type)
    {
        $this->set_prop('type', $type);
    }

    /**
     * Set tour type.
     *
     * @param string $type Tour Can Book
     * @since 2.1.12
     */
    public function set_can_book($type)
    {
        $this->set_prop('can_book', $type);
    }

    /**
     * Set tour type.
     *
     * @param string $type Tour Is Featured
     * @since 2.1.12
     */
    public function set_is_featured($is_featured)
    {
        $this->set_prop('is_featured', $is_featured);
    }

    /**
     * Set tour type.
     *
     * @param string $type Tour is_fixed_departure
     * @since 2.1.12
     */
    public function set_is_fixed_departure($is_fixed_departure)
    {
        $this->set_prop('is_fixed_departure', $is_fixed_departure);
    }

    /**
     * Set external url
     *
     * @param string $external_url external url
     * @since 2.1.12
     */
    public function set_external_url($external_url)
    {
        $this->set_prop('external_url', $external_url);
    }

    /**
     * Set  book now button text
     *
     * @param string $book_now_text book now text
     * @since 2.1.12
     */
    public function set_book_now_text($book_now_text)
    {
        $this->set_prop('book_now_text', $book_now_text);
    }

    /*
  |--------------------------------------------------------------------------
  | Other Methods
  |--------------------------------------------------------------------------
  */


    /**
     * Returns whether or not the product post exists.
     *
     * @return bool
     */
    public function exists()
    {
        return false !== $this->get_status();
    }

    /**
     * Checks the tour type.
     *
     *
     * @param string|array $type Array or string of types.
     * @return bool
     */
    public function is_type($type)
    {
        return ($this->get_type() === $type || (is_array($type) && in_array($this->get_type(), $type, true)));
    }


    /**
     * Returns whether or not the product is featured.
     *
     * @return bool
     */
    public function is_featured()
    {
        return true === $this->get_prop('is_featured');
    }

    /**
     * Returns whether or not the product is featured.
     *
     * @return bool
     */
    public function is_fixed_departure()
    {
        return true === $this->get_prop('is_fixed_departure');
    }



    /*
    |--------------------------------------------------------------------------
    | Non-CRUD Getters
    |--------------------------------------------------------------------------
    */

    /**
     * Get the tour's title. For tours this is the tour name.
     *
     * @return string
     */
    public function get_title()
    {
        return apply_filters('yatra_tour_title', $this->get_name(), $this);
    }

    /**
     * tour permalink.
     *
     * @return string
     */
    public function get_permalink()
    {
        return get_permalink($this->get_id());
    }
}
