<?php

class Yatra_User_Role
{
    public function is_customer($customer_id = 0)
    {
        $customer_id = absint($customer_id);

        if ($customer_id < 1) {

            return false;
        }

        $user = get_user_by('id', $customer_id);

        if (in_array('yatra_customer', (array)$user->roles)) {

            return true;
        }

        return false;
    }

    public function add_customer_role($customer_id = 0)
    {
        $customer_id = absint($customer_id);

        if ($customer_id < 1) {

            return false;
        }
        do_action('yatra_before_add_customer_role', $customer_id);

        if (!$this->is_customer($customer_id)) {

            $customer = new \WP_User($customer_id);

            $customer->add_role('yatra_customer');
        }

        do_action('yatra_after_add_customer_role', $customer_id);
    }


    public function init()
    {
        add_role(
            'yatra_customer',
            __('Yatra Customer', 'yatra'),
            array(
                'read' => true
            )
        );
    }
}