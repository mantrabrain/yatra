<?php

class Yatra_Messages
{

    /**
     * Stores the list of messages.
     *
     * @since 2.1.0
     * @var array
     */
    public $messages = array();


    public $message_type = array(
        'info',
        'success',
        'warning'
    );


    public function __construct($code = '', $message = '', $type = '')
    {
        if (empty($code) || empty($type) || !in_array($type, $this->message_type)) {
            return;
        }
        $this->messages[$code][$type][] = $message;

    }

    public function get_messages($code = '')
    {
        if (empty($code)) {
            $all_messages = array();
            foreach ((array)$this->messages as $code => $messages) {
                $all_messages = array_merge($all_messages, $messages);
            }

            return $all_messages;
        }

        if (isset($this->messages[$code])) {
            return $this->messages[$code];
        } else {
            return array();
        }
    }

    public function has_messages($code = '')
    {
        if (!empty($code)) {

            if (!isset($this->messages[$code])) {

                return false;
            }
            return true;
        }
        if (!empty($this->messages)) {
            return true;
        }
        return false;
    }


    public function add($code, $message, $type)
    {
        if (!in_array($type, $this->message_type)) {
            return;
        }
        $this->messages[$code][$type][] = $message;
    }


}
