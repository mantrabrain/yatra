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


    public function create_roles()
    {
        add_role(
            'yatra_customer',
            __('Yatra Customer', 'yatra'),
            array(
                'read' => true
            )
        );

        global $wp_roles;

        $capabilities = $this->get_core_capabilities();

        foreach ($capabilities as $cap_group) {
            foreach ($cap_group as $cap) {
                $wp_roles->add_cap('administrator', $cap);
            }
        }
    }

    public function remove_roles()
    {
        global $wp_roles;

        if (!class_exists('WP_Roles')) {
            return;
        }

        if (!isset($wp_roles)) {
            $wp_roles = new WP_Roles(); // @codingStandardsIgnoreLine
        }

        $capabilities = $this->get_core_capabilities();

        foreach ($capabilities as $cap_group) {
            foreach ($cap_group as $cap) {
                $wp_roles->remove_cap('yatra_customer', $cap);
                $wp_roles->remove_cap('administrator', $cap);
            }
        }

        remove_role('yatra_customer');
    }

    public function get_core_capabilities()
    {
        $capabilities = array();

        $capabilities['core'] = array(
            'manage_yatra'
        );

        $capability_types = array('tour', 'yatra-booking', 'yatra-customers', 'yatra-coupons');

        foreach ($capability_types as $capability_type) {

            $capabilities[$capability_type] = array(
                // Post type.
                "edit_{$capability_type}",
                "read_{$capability_type}",
                "delete_{$capability_type}",
                "edit_{$capability_type}s",
                "edit_others_{$capability_type}s",
                "publish_{$capability_type}s",
                "read_private_{$capability_type}s",
                "delete_{$capability_type}s",
                "delete_private_{$capability_type}s",
                "delete_published_{$capability_type}s",
                "delete_others_{$capability_type}s",
                "edit_private_{$capability_type}s",
                "edit_published_{$capability_type}s",

                // Terms.
                "manage_{$capability_type}_terms",
                "edit_{$capability_type}_terms",
                "delete_{$capability_type}_terms",
                "assign_{$capability_type}_terms",
            );
        }

        return $capabilities;
    }
}