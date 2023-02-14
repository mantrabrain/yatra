<?php

namespace Yatra\Core\Hooks;


use Yatra_Core_DB;
use Yatra_Tables;

class BookingHooks
{

    public static function init()
    {
        $self = new self;

        add_action('yatra_after_booking_status_change', array($self, 'on_booking_status_change'), 11);

    }

    public function on_booking_status_change($params)
    {

        $booking_id = $params['booking_id'] ?? 0;

        $status = $params['status'] ?? '';

        $yatra_booking_statuses = yatra_get_booking_statuses();

        if ($booking_id < 1 || !isset($yatra_booking_statuses[$status])) {

            return false;
        }
        $valid_status = ['yatra-cancelled', 'yatra-failed'];

        if (in_array($status, $valid_status)) {

            Yatra_Core_DB::delete(Yatra_Tables::TOUR_BOOKING_STATS, array(
                'booking_id' => $booking_id
            ));
        } else {

            $total_count = Yatra_Core_DB::get_count(Yatra_Tables::TOUR_BOOKING_STATS, array('booking_id' => $booking_id));

            $booking = new \Yatra_Tour_Booking($booking_id);

            $all_bookings = $booking->get_all_booking_details($booking_id);

            $customer_id = $booking->get_customer_id();

            $booking_metas = $all_bookings->yatra_booking_meta ?? [];

            foreach ($booking_metas as $parameter) {

                $number_of_person = $parameter['number_of_person'] ?? 0;

                $total_number_of_pax = is_array($number_of_person) ? array_sum($number_of_person) : absint($number_of_person);

                $stats_data = array(
                    'booking_id' => $booking_id,
                    'tour_id' => $parameter['yatra_tour_id'],
                    'customer_id' => $customer_id,
                    'booked_date' => $parameter['yatra_selected_date'],
                    'currency' => $parameter['yatra_currency'],
                    'total_number_of_pax' => $total_number_of_pax,
                    'gross_total_price' => yatra_get_final_tour_price($parameter['yatra_tour_id'], $number_of_person, $parameter['yatra_selected_date']),
                    'net_total_price' => yatra_get_final_tour_price($parameter['yatra_tour_id'], $number_of_person, $parameter['yatra_selected_date']),
                    'ip_address' => yatra_get_visitor_ip_address(),
                    'created_at' => current_time('mysql')
                );
                if ($total_count < 1) {
                    Yatra_Core_DB::save_data(Yatra_Tables::TOUR_BOOKING_STATS, $stats_data);
                } else {
                    unset($stats_data['ip_address']);
                    unset($stats_data['created_at']);
                    Yatra_Core_DB::update_data(Yatra_Tables::TOUR_BOOKING_STATS, $stats_data, array('booking_id' => $booking_id));
                }
            }

        }


    }
}