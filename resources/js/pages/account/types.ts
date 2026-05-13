export type Section =
  | "dashboard"
  | "bookings"
  | "payments"
  | "documents"
  | "profile"
  | "saved-trips";

export interface Booking {
  id: number;
  booking_number: string;
  trip_title: string;
  trip_id: number;
  booking_date: string;
  travel_date: string;
  /** Trip end (multi-day); optional on older rows. */
  end_date?: string | null;
  start_date?: string | null;
  /** Traveler count. The bookings-list endpoint returns this as an integer,
   *  but the single-booking detail endpoint overrides `travelers` with an
   *  array of traveler-detail objects (see
   *  BookingService::formatBookingWithDetails). Use `travelers_count` when
   *  rendering the count — it is preserved as an integer in both shapes. */
  travelers: number;
  travelers_count: number;
  total_amount: number;
  amount_paid?: number | null;
  amount_due?: number | null;
  payment_status: "paid" | "pending" | "partial" | "refunded";
  booking_status: "confirmed" | "pending" | "cancelled" | "completed";
  destination?: string;
  created_at?: string;
}

export interface Payment {
  id: number;
  reference: string;
  booking_number: string;
  booking_id?: number;
  amount: number;
  status: "paid" | "pending" | "failed" | "refunded" | "completed";
  method: string;
  date: string;
  type: "deposit" | "balance" | "installment";
  booking_amount_due?: number | null;
  booking_amount_paid?: number | null;
  booking_total_amount?: number | null;
}

export interface TravelDocument {
  id: string | number;
  name: string;
  trip_title: string;
  category: "itinerary" | "voucher" | "invoice" | "downloads";
  updated_at: string;
  url: string;

  // Optional metadata for Pro downloads
  trip_id?: number;
  booking_id?: number;
  /** Payment row id for invoice PDFs (REST /payment/{id}/invoice). */
  payment_id?: number;
  access?: "public" | "logged_in" | "booked_only" | "paid_only";
  access_label?: string;
  locked?: boolean;
  locked_reason?: string;
}

export interface SupportTicket {
  id: number;
  subject: string;
  status: "open" | "awaiting_response" | "resolved";
  updated_at: string;
}

export interface CustomerProfile {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  /** Member since; API may send `created_at` only. */
  registered_at?: string;
  created_at?: string;
  total_bookings: number;
  total_spent: number;
  loyalty_tier?: string;
}
