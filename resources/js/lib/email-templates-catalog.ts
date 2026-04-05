/**
 * Canonical list of system email templates (aligned with Yatra Pro seeds).
 * When Email Automation is off, the four isCoreFree rows are editable via site settings;
 * all other rows appear locked until the module is enabled.
 */

import { __ } from "./i18n";
import type { EmailSettingsValues } from "../components/settings/email-settings-types";

export type EmailCatalogEntry = {
  template_key: string;
  event_key: string;
  name: string;
  description: string;
  category: string;
  recipient_type: "customer" | "admin";
  to_email: string;
  /** When true, subject/body/active map to EmailSettingsValues keys. */
  isCoreFree: boolean;
  settingsFlag?: keyof EmailSettingsValues;
  settingsSubject?: keyof EmailSettingsValues;
  settingsBody?: keyof EmailSettingsValues;
  /** Shown in core editor sidebar for merge tags */
  mergeTags?: string;
};

export const CORE_FREE_TEMPLATE_KEYS = [
  "booking_confirmation",
  "payment_received",
  "booking_cancelled",
  "trip_reminder",
  "admin_new_booking",
  "admin_payment_received",
  "admin_booking_cancelled",
] as const;

export type CoreFreeTemplateKey = (typeof CORE_FREE_TEMPLATE_KEYS)[number];

export function isCoreTemplateSlug(
  slug: string | null | undefined,
): slug is CoreFreeTemplateKey {
  return (
    !!slug &&
    (CORE_FREE_TEMPLATE_KEYS as readonly string[]).includes(slug)
  );
}

export const EMAIL_TEMPLATES_CATALOG: EmailCatalogEntry[] = [
  {
    template_key: "booking_confirmation",
    event_key: "booking.created",
    name: __("Booking Confirmation", "yatra"),
    description: __(
      "Customer email for checkout, admin bookings, and confirmed status.",
      "yatra",
    ),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    settingsFlag: "email_template_booking",
    settingsSubject: "email_tpl_booking_subject",
    settingsBody: "email_tpl_booking_body",
    mergeTags:
      "{{site_name}}, {{customer_name}}, {{customer_first_name}}, {{booking_reference}}, {{booking_id}}, {{trip_name}}, {{travel_date}}, {{travelers_count}}, {{total_amount_formatted}}, {{amount_due_formatted}}, {{currency}}, {{intro_paragraph}}, {{details_html}}, {{footer_note}}",
  },
  {
    template_key: "payment_received",
    event_key: "payment.received",
    name: __("Payment Received", "yatra"),
    description: __("Sent when a payment is recorded for a booking.", "yatra"),
    category: "payment",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    settingsFlag: "email_template_confirmation",
    settingsSubject: "email_tpl_payment_subject",
    settingsBody: "email_tpl_payment_body",
    mergeTags:
      "{{site_name}}, {{customer_name}}, {{customer_first_name}}, {{booking_reference}}, {{trip_name}}, {{travel_date}}, {{payment_amount_formatted}}, {{payment_method}}, {{transaction_id}}, {{total_amount_formatted}}, {{currency}}",
  },
  {
    template_key: "booking_cancelled",
    event_key: "booking.cancelled",
    name: __("Booking Cancellation", "yatra"),
    description: __("Sent when a booking is marked cancelled.", "yatra"),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    settingsFlag: "email_template_cancellation",
    settingsSubject: "email_tpl_cancellation_subject",
    settingsBody: "email_tpl_cancellation_body",
    mergeTags:
      "{{site_name}}, {{customer_name}}, {{customer_first_name}}, {{booking_reference}}, {{trip_name}}, {{travel_date}}, {{travelers_count}}",
  },
  {
    template_key: "trip_reminder",
    event_key: "reminder.trip",
    name: __("Trip Reminder", "yatra"),
    description: __(
      "Scheduled reminder before departure (see Booking settings).",
      "yatra",
    ),
    category: "reminder",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    settingsFlag: "email_template_reminder",
    settingsSubject: "email_tpl_reminder_subject",
    settingsBody: "email_tpl_reminder_body",
    mergeTags:
      "{{site_name}}, {{customer_name}}, {{booking_reference}}, {{trip_name}}, {{travel_date}}, {{travelers_count}}, {{reminder_days}}, {{days_until_trip}}, {{amount_due_formatted}}, {{reminder_extra_html}}",
  },
  {
    template_key: "admin_new_booking",
    event_key: "booking.created",
    name: __("Admin: New Booking", "yatra"),
    description: __(
      "Sent to your admin email when a booking is created. Turn off here to stop this email.",
      "yatra",
    ),
    category: "booking",
    recipient_type: "admin",
    to_email: "{{admin_email}}",
    isCoreFree: true,
    settingsFlag: "email_template_admin_new_booking",
    settingsSubject: "email_tpl_admin_booking_subject",
    settingsBody: "email_tpl_admin_booking_body",
    mergeTags:
      "{{site_name}}, {{site_url}}, {{admin_url}}, {{booking_reference}}, {{booking_id}}, {{customer_name}}, {{customer_email}}, {{customer_phone}}, {{trip_name}}, {{travel_date}}, {{travelers_count}}, {{total_amount_formatted}}, {{currency}}, {{booking_status}}, {{payment_status}}",
  },
  {
    template_key: "admin_payment_received",
    event_key: "payment.received",
    name: __("Admin: Payment received", "yatra"),
    description: __(
      "Sent to your admin email when a payment is recorded. Customer receipt uses the Payment Received template.",
      "yatra",
    ),
    category: "payment",
    recipient_type: "admin",
    to_email: "{{admin_email}}",
    isCoreFree: true,
    settingsFlag: "email_template_admin_payment",
    settingsSubject: "email_tpl_admin_payment_subject",
    settingsBody: "email_tpl_admin_payment_body",
    mergeTags:
      "{{site_name}}, {{admin_url}}, {{booking_reference}}, {{booking_id}}, {{customer_name}}, {{payment_amount_formatted}}, {{payment_method}}, {{transaction_id}}",
  },
  {
    template_key: "admin_booking_cancelled",
    event_key: "booking.cancelled",
    name: __("Admin: Booking cancelled", "yatra"),
    description: __(
      "Sent to your admin email when a booking is cancelled. Customer notice uses the Booking Cancellation template.",
      "yatra",
    ),
    category: "booking",
    recipient_type: "admin",
    to_email: "{{admin_email}}",
    isCoreFree: true,
    settingsFlag: "email_template_admin_cancellation",
    settingsSubject: "email_tpl_admin_cancellation_subject",
    settingsBody: "email_tpl_admin_cancellation_body",
    mergeTags:
      "{{site_name}}, {{admin_url}}, {{booking_reference}}, {{booking_id}}, {{customer_name}}, {{trip_name}}, {{travel_date}}",
  },
  {
    template_key: "new_booking",
    event_key: "new_booking",
    name: __("New Booking Confirmation", "yatra"),
    description: __(
      "Pro automation template. Enable Email Automation to edit and send.",
      "yatra",
    ),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: false,
  },
  {
    template_key: "booking_payment",
    event_key: "booking_payment",
    name: __("Booking payment notice", "yatra"),
    description: __(
      "Pro automation template. Enable Email Automation to edit and send.",
      "yatra",
    ),
    category: "payment",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: false,
  },
  {
    template_key: "booking_confirmed",
    event_key: "booking.confirmed",
    name: __("Booking Confirmed", "yatra"),
    description: __(
      "Pro automation template. Enable Email Automation to edit and send.",
      "yatra",
    ),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: false,
  },
  {
    template_key: "booking_completed",
    event_key: "booking.completed",
    name: __("Trip Completed", "yatra"),
    description: __(
      "Pro automation template. Enable Email Automation to edit and send.",
      "yatra",
    ),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: false,
  },
  {
    template_key: "payment_reminder",
    event_key: "payment.reminder",
    name: __("Payment Reminder", "yatra"),
    description: __(
      "Pro automation template. Enable Email Automation to edit and send.",
      "yatra",
    ),
    category: "payment",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: false,
  },
  {
    template_key: "enquiry_received",
    event_key: "enquiry.created",
    name: __("Enquiry Received", "yatra"),
    description: __(
      "Pro automation template. Enable Email Automation to edit and send.",
      "yatra",
    ),
    category: "enquiry",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: false,
  },
  {
    template_key: "enquiry_admin",
    event_key: "enquiry.created",
    name: __("Admin: New Enquiry", "yatra"),
    description: __(
      "Pro automation template. Enable Email Automation to edit and send.",
      "yatra",
    ),
    category: "enquiry",
    recipient_type: "admin",
    to_email: "",
    isCoreFree: false,
  },
  {
    template_key: "enquiry_response",
    event_key: "enquiry.responded",
    name: __("Enquiry Response", "yatra"),
    description: __(
      "Pro automation template. Enable Email Automation to edit and send.",
      "yatra",
    ),
    category: "enquiry",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: false,
  },
  {
    template_key: "review_request",
    event_key: "marketing.review_request",
    name: __("Review Request", "yatra"),
    description: __(
      "Pro automation template. Enable Email Automation to edit and send.",
      "yatra",
    ),
    category: "marketing",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: false,
  },
];

export function getCatalogEntryByTemplateKey(
  key: string,
): EmailCatalogEntry | undefined {
  return EMAIL_TEMPLATES_CATALOG.find((e) => e.template_key === key);
}

export function getCoreTemplateDefinition(
  slug: string,
): EmailCatalogEntry | undefined {
  const e = getCatalogEntryByTemplateKey(slug);
  return e?.isCoreFree ? e : undefined;
}

/** UI row shape for the shared templates table (API or settings-backed). */
export type UnifiedEmailTemplate = {
  id: string | number;
  template_key: string;
  event_key: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  category: string;
  recipient_type: "customer" | "admin";
  to_email?: string;
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  is_active: boolean;
  is_system: boolean;
  is_locked: boolean;
  variables: string[];
  created_at?: string;
  updated_at?: string;
};

export function buildLocalTemplateRows(
  values: EmailSettingsValues,
): UnifiedEmailTemplate[] {
  return EMAIL_TEMPLATES_CATALOG.map((entry) => {
    const locked = !entry.isCoreFree;
    const subject =
      entry.settingsSubject && !locked
        ? String(values[entry.settingsSubject] ?? "")
        : "";
    const body =
      entry.settingsBody && !locked
        ? String(values[entry.settingsBody] ?? "")
        : "";
    const isActive =
      entry.settingsFlag && !locked
        ? Boolean(values[entry.settingsFlag])
        : false;

    return {
      id: locked ? `locked:${entry.template_key}` : `core:${entry.template_key}`,
      template_key: entry.template_key,
      event_key: entry.event_key,
      name: entry.name,
      description: entry.description,
      subject,
      body,
      category: entry.category,
      recipient_type: entry.recipient_type,
      to_email: entry.to_email,
      is_active: locked ? false : isActive,
      is_system: true,
      is_locked: locked,
      variables: [],
    };
  });
}
