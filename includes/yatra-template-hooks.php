<?php

add_action('yatra_account_navigation', 'yatra_account_navigation');
add_action('yatra_account_content', 'yatra_account_content');
add_action('yatra_account_dashboard_endpoint', 'yatra_account_dashboard');
add_action('yatra_account_bookings_endpoint', 'yatra_account_bookings');
add_action('yatra_account_payment_endpoint', 'yatra_account_payment_history');
add_action('yatra_account_bookings_item_endpoint', 'yatra_account_bookings_item');
add_action('yatra_account_bookings_item_endpoint', 'yatra_account_booking_payment_history');
add_action('yatra_account_edit-profile_endpoint', 'yatra_account_edit_profile');
add_action('yatra_account_change-password_endpoint', 'yatra_account_change_password');
add_action('yatra_my_account_edit_profile_form_fields', 'yatra_my_account_edit_profile_form_fields');
add_action('yatra_my_account_change_password_form_fields', 'yatra_my_account_change_password_form_fields');
add_action('yatra_before_account_content', 'yatra_account_notices');
add_action('yatra_before_customer_login_form', 'yatra_login_notices');
add_action('yatra_before_customer_registration_form', 'yatra_registration_notices');
add_action('yatra_registration_form_start', 'yatra_registration_form_fields');
add_action('yatra_checkout_before_form', 'yatra_checkout_form_error', 20);
add_action('yatra_checkout_form_fields', 'yatra_payment_gateway_fields', 15);

// Single Tour

add_action('yatra_enquiry_form_fields', 'yatra_enquiry_form_fields');

// Log Hooks
