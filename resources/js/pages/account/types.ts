export type Section = 'dashboard' | 'bookings' | 'payments' | 'documents' | 'profile' | 'support' | 'saved-trips';

export interface Booking {
  id: number;
  booking_number: string;
  trip_title: string;
  trip_id: number;
  booking_date: string;
  travel_date: string;
  travelers: number;
  total_amount: number;
  amount_paid?: number | null;
  amount_due?: number | null;
  payment_status: 'paid' | 'pending' | 'partial' | 'refunded';
  booking_status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  destination?: string;
  created_at?: string;
}

export interface Payment {
  id: number;
  reference: string;
  booking_number: string;
  booking_id?: number;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded' | 'completed';
  method: string;
  date: string;
  type: 'deposit' | 'balance' | 'installment';
  booking_amount_due?: number | null;
  booking_amount_paid?: number | null;
  booking_total_amount?: number | null;
}

export interface TravelDocument {
  id: number;
  name: string;
  trip_title: string;
  category: 'itinerary' | 'voucher' | 'invoice';
  updated_at: string;
  url: string;
}

export interface SupportTicket {
  id: number;
  subject: string;
  status: 'open' | 'awaiting_response' | 'resolved';
  updated_at: string;
}

export interface CustomerProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  registered_at: string;
  total_bookings: number;
  total_spent: number;
  loyalty_tier?: string;
}

