/**
 * Canonical list of system email templates (aligned with Yatra Pro seeds).
 * When Email Automation is off, settings-backed templates stay editable in the free plugin;
 * Pro-only catalog rows stay visible but locked until Pro + Email Automation is on.
 * Module-gated templates (e.g. trip consent, abandoned recovery) stay listed with real
 * on/off + content from site settings while the module is off — view-only until the module is active.
 */

import { __, sprintf, brandName } from "./i18n";

// Pre-compute "{brand} Pro" once at module load. Used by the
// operator-facing template descriptions below so a white-labelled
// site shows the operator's brand instead of literal "Yatra Pro".
// brandName() reads window.yatraAdmin.brandName which is injected
// before any React module loads, so this value is always correct.
const BRAND_PRO_NAME = brandName() + " Pro";
import type { EmailSettingsValues } from "../components/settings/email-settings-types";

/** Rich booking merge tags (gateway, schedule, travelers, booking meta, special requests). */
const BOOKING_RICH_MERGE_TAGS =
  "{{payment_gateway}}, {{payment_gateway_label}}, {{payment_schedule}}, {{payment_schedule_label}}, {{travelers_list}}, {{travelers_list_html}}, {{traveler_custom_fields_html}}, {{booking_custom_fields_html}}, {{special_requests}}, {{special_requests_html}}";

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
  /** If set, subject/body cannot be edited until Pro + this module slug is active (row still listed). */
  requiresModule?: string;
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
  "trip_consent_request",
  "customer_email_verification",
  "guest_email_verification",
  "booking_completed",
  "booking_expired_customer",
  "admin_booking_expired",
  "scheduled_payment_reminder",
  "scheduled_payment_succeeded",
  "scheduled_payment_failed",
  "admin_scheduled_payment_failed",
  "enquiry_received",
  "enquiry_admin",
  "enquiry_response",
  "review_request",
  "abandoned_booking_recovery_first",
  "abandoned_booking_recovery_second",
  "abandoned_booking_recovery_final",
  "admin_new_booking",
  "admin_payment_received",
  "admin_booking_cancelled",
] as const;

export type CoreFreeTemplateKey = (typeof CORE_FREE_TEMPLATE_KEYS)[number];

export function isCoreTemplateSlug(
  slug: string | null | undefined,
): slug is CoreFreeTemplateKey {
  return (
    !!slug && (CORE_FREE_TEMPLATE_KEYS as readonly string[]).includes(slug)
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
      "{{site_name}}, {{customer_name}}, {{customer_first_name}}, {{booking_reference}}, {{booking_id}}, {{trip_name}}, {{travel_date}}, {{travelers_count}}, {{total_amount_formatted}}, {{amount_due_formatted}}, {{currency}}, {{intro_paragraph}}, {{details_html}}, {{footer_note}}, " +
      BOOKING_RICH_MERGE_TAGS,
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
      "{{site_name}}, {{customer_name}}, {{customer_first_name}}, {{booking_reference}}, {{trip_name}}, {{travel_date}}, {{payment_amount_formatted}}, {{payment_method}}, {{transaction_id}}, {{total_amount_formatted}}, {{currency}}, " +
      BOOKING_RICH_MERGE_TAGS,
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
      "{{site_name}}, {{customer_name}}, {{customer_first_name}}, {{booking_reference}}, {{trip_name}}, {{travel_date}}, {{travelers_count}}, " +
      BOOKING_RICH_MERGE_TAGS,
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
      "{{site_name}}, {{customer_name}}, {{booking_reference}}, {{trip_name}}, {{travel_date}}, {{travelers_count}}, {{reminder_days}}, {{days_until_trip}}, {{amount_due_formatted}}, {{reminder_extra_html}}, " +
      BOOKING_RICH_MERGE_TAGS,
  },
  {
    template_key: "trip_consent_request",
    event_key: "consent.requested",
    name: __("Trip consent request", "yatra"),
    description: __(
      "Sent when a traveler must sign a trip consent form (Trip Consent module).",
      "yatra",
    ),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    requiresModule: "trip_consent",
    settingsFlag: "email_template_trip_consent",
    settingsSubject: "email_tpl_trip_consent_subject",
    settingsBody: "email_tpl_trip_consent_body",
    mergeTags:
      "{{site_name}}, {{recipient_name}}, {{form_name}}, {{consent_link}}, {{trip_name}}, {{travel_date}}, {{booking_reference}}, {{expiry_notice_html}}, {{consent_test_notice_html}}",
  },
  {
    template_key: "customer_email_verification",
    event_key: "account.email_verification",
    name: __("Customer email verification", "yatra"),
    description: __(
      "Sent when a customer registers (e.g. from checkout) and must verify their email before logging in.",
      "yatra",
    ),
    category: "account",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    settingsFlag: "email_template_customer_verification",
    settingsSubject: "email_tpl_customer_verification_subject",
    settingsBody: "email_tpl_customer_verification_body",
    mergeTags:
      "{{site_name}}, {{site_url}}, {{customer_first_name}}, {{customer_name}}, {{verification_link}}, {{intro_paragraph}}, {{expiry_notice_html}}, {{footer_note}}",
  },
  {
    template_key: "guest_email_verification",
    event_key: "account.email_verification",
    name: __("Guest email verification (checkout)", "yatra"),
    description: __(
      "Sent to a guest at checkout who must verify their email before the booking is finalized (when 'Require guest email verification' is enabled). Distinct from the account-registration verification above.",
      "yatra",
    ),
    category: "account",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    settingsFlag: "email_template_guest_verification",
    settingsSubject: "email_tpl_guest_verification_subject",
    settingsBody: "email_tpl_guest_verification_body",
    mergeTags:
      "{{site_name}}, {{site_url}}, {{customer_first_name}}, {{customer_name}}, {{verification_link}}, {{intro_paragraph}}, {{expiry_notice_html}}, {{footer_note}}",
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
      "{{site_name}}, {{site_url}}, {{admin_url}}, {{booking_reference}}, {{booking_id}}, {{customer_name}}, {{customer_email}}, {{customer_phone}}, {{trip_name}}, {{travel_date}}, {{travelers_count}}, {{total_amount_formatted}}, {{currency}}, {{booking_status}}, {{payment_status}}, " +
      BOOKING_RICH_MERGE_TAGS,
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
      "{{site_name}}, {{admin_url}}, {{booking_reference}}, {{booking_id}}, {{customer_name}}, {{payment_amount_formatted}}, {{payment_method}}, {{transaction_id}}, " +
      BOOKING_RICH_MERGE_TAGS,
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
      "{{site_name}}, {{admin_url}}, {{booking_reference}}, {{booking_id}}, {{customer_name}}, {{trip_name}}, {{travel_date}}, " +
      BOOKING_RICH_MERGE_TAGS,
  },
  {
    template_key: "new_booking",
    event_key: "booking.created",
    name: __("New Booking Confirmation", "yatra"),
    description: __(
      "Pro automation alternative for the free Booking Confirmation template. Enable Email Automation to edit and send.",
      "yatra",
    ),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: false,
    // Gate behind Email Automation so the free / Pro versions don't appear as
    // a confusing duplicate in the customer's view (e.g. two "Payment Received"
    // rows). isModuleGatedLocked() reads this and locks the row when the
    // module isn't active.
    requiresModule: "email_automation",
  },
  {
    template_key: "booking_payment",
    event_key: "payment.received",
    name: __("Booking payment notice", "yatra"),
    description: __(
      "Pro automation alternative for the free Payment Received template. Enable Email Automation to edit and send.",
      "yatra",
    ),
    category: "payment",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: false,
    requiresModule: "email_automation",
  },
  {
    template_key: "booking_confirmed",
    event_key: "booking.confirmed",
    name: __("Booking Confirmed", "yatra"),
    description: __(
      "Pro automation template fired on booking confirmation. Enable Email Automation to edit and send.",
      "yatra",
    ),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: false,
    requiresModule: "email_automation",
  },
  {
    template_key: "booking_completed",
    event_key: "booking.completed",
    name: __("Trip completed", "yatra"),
    description: __(
      "Sent when a booking is marked completed (after travel).",
      "yatra",
    ),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    settingsFlag: "email_template_booking_completed",
    settingsSubject: "email_tpl_booking_completed_subject",
    settingsBody: "email_tpl_booking_completed_body",
    mergeTags:
      "{{site_name}}, {{customer_name}}, {{booking_reference}}, {{booking_id}}, {{trip_name}}, {{travel_date}}, {{trip_url}}, " +
      BOOKING_RICH_MERGE_TAGS,
  },
  {
    template_key: "booking_expired_customer",
    event_key: "booking.expired",
    name: __("Booking expired (customer)", "yatra"),
    description: __(
      "Sent when a pending booking is auto-cancelled for non-payment.",
      "yatra",
    ),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    settingsFlag: "email_template_booking_expired_customer",
    settingsSubject: "email_tpl_booking_expired_customer_subject",
    settingsBody: "email_tpl_booking_expired_customer_body",
    mergeTags:
      "{{site_name}}, {{customer_name}}, {{booking_reference}}, {{trip_name}}, {{travel_date}}, {{trip_url}}, {{expiry_policy_note}}, " +
      BOOKING_RICH_MERGE_TAGS,
  },
  {
    template_key: "admin_booking_expired",
    event_key: "booking.expired",
    name: __("Admin: Booking expired", "yatra"),
    description: __(
      "Admin notice when a booking is auto-cancelled for non-payment.",
      "yatra",
    ),
    category: "booking",
    recipient_type: "admin",
    to_email: "{{admin_email}}",
    isCoreFree: true,
    settingsFlag: "email_template_admin_booking_expired",
    settingsSubject: "email_tpl_admin_booking_expired_subject",
    settingsBody: "email_tpl_admin_booking_expired_body",
    mergeTags:
      "{{site_name}}, {{admin_url}}, {{booking_reference}}, {{booking_id}}, {{customer_name}}, {{customer_email}}, {{trip_name}}, " +
      BOOKING_RICH_MERGE_TAGS,
  },
  {
    template_key: "scheduled_payment_reminder",
    event_key: "scheduled.payment.reminder",
    name: __("Scheduled payment reminder", "yatra"),
    description: __(
      "Sent before an installment or gateway-scheduled charge when Scheduled payments is enabled in settings.",
      "yatra",
    ),
    category: "payment",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    requiresModule: "scheduled_payments",
    settingsFlag: "email_template_scheduled_payment_reminder",
    settingsSubject: "email_tpl_scheduled_payment_reminder_subject",
    settingsBody: "email_tpl_scheduled_payment_reminder_body",
    mergeTags:
      "{{site_name}}, {{customer_first_name}}, {{customer_name}}, {{booking_reference}}, {{booking_id}}, {{trip_name}}, {{trip_url}}, {{scheduled_amount_formatted}}, {{scheduled_date_formatted}}, {{payment_type_label}}, {{scheduled_payment_id}}, {{currency}}, " +
      BOOKING_RICH_MERGE_TAGS,
  },
  {
    template_key: "scheduled_payment_succeeded",
    event_key: "scheduled.payment.succeeded",
    name: __("Scheduled payment succeeded", "yatra"),
    description: __(
      "Sent after a scheduled / installment charge succeeds.",
      "yatra",
    ),
    category: "payment",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    requiresModule: "scheduled_payments",
    settingsFlag: "email_template_scheduled_payment_succeeded",
    settingsSubject: "email_tpl_scheduled_payment_succeeded_subject",
    settingsBody: "email_tpl_scheduled_payment_succeeded_body",
    mergeTags:
      "{{site_name}}, {{customer_first_name}}, {{customer_name}}, {{booking_reference}}, {{booking_id}}, {{trip_name}}, {{scheduled_amount_formatted}}, {{payment_type_label}}, {{balance_after_formatted}}, {{scheduled_payment_id}}, {{currency}}, " +
      BOOKING_RICH_MERGE_TAGS,
  },
  {
    template_key: "scheduled_payment_failed",
    event_key: "scheduled.payment.failed",
    name: __("Scheduled payment failed", "yatra"),
    description: __(
      "Sent when a scheduled charge fails (temporary or final).",
      "yatra",
    ),
    category: "payment",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    requiresModule: "scheduled_payments",
    settingsFlag: "email_template_scheduled_payment_failed",
    settingsSubject: "email_tpl_scheduled_payment_failed_subject",
    settingsBody: "email_tpl_scheduled_payment_failed_body",
    mergeTags:
      "{{site_name}}, {{customer_first_name}}, {{customer_name}}, {{booking_reference}}, {{booking_id}}, {{trip_name}}, {{scheduled_amount_formatted}}, {{scheduled_payment_id}}, {{failure_reason}}, {{failure_intro_html}}, {{failure_followup_html}}, " +
      BOOKING_RICH_MERGE_TAGS,
  },
  {
    template_key: "admin_scheduled_payment_failed",
    event_key: "scheduled.payment.failed",
    name: __("Admin: Scheduled payment failed", "yatra"),
    description: __(
      "Admin notice when a scheduled payment permanently fails.",
      "yatra",
    ),
    category: "payment",
    recipient_type: "admin",
    to_email: "{{admin_email}}",
    isCoreFree: true,
    requiresModule: "scheduled_payments",
    settingsFlag: "email_template_admin_scheduled_payment_failed",
    settingsSubject: "email_tpl_admin_scheduled_payment_failed_subject",
    settingsBody: "email_tpl_admin_scheduled_payment_failed_body",
    mergeTags:
      "{{site_name}}, {{admin_url}}, {{booking_reference}}, {{booking_id}}, {{trip_name}}, {{customer_name}}, {{customer_email}}, {{scheduled_amount_formatted}}, {{scheduled_payment_id}}, {{failure_reason}}, " +
      BOOKING_RICH_MERGE_TAGS,
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
      "Confirmation sent to the customer after they submit an enquiry.",
      "yatra",
    ),
    category: "enquiry",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    settingsFlag: "email_template_enquiry_received",
    settingsSubject: "email_tpl_enquiry_received_subject",
    settingsBody: "email_tpl_enquiry_received_body",
    mergeTags:
      "{{site_name}}, {{customer_name}}, {{customer_email}}, {{customer_phone}}, {{trip_name}}, {{trip_url}}, {{message}}",
  },
  {
    template_key: "enquiry_admin",
    event_key: "enquiry.created",
    name: __("Admin: New Enquiry", "yatra"),
    description: __(
      "Sent to your admin email when a new enquiry is submitted.",
      "yatra",
    ),
    category: "enquiry",
    recipient_type: "admin",
    to_email: "{{admin_email}}",
    isCoreFree: true,
    settingsFlag: "email_template_enquiry_admin",
    settingsSubject: "email_tpl_enquiry_admin_subject",
    settingsBody: "email_tpl_enquiry_admin_body",
    mergeTags:
      "{{site_name}}, {{admin_url}}, {{customer_name}}, {{customer_email}}, {{customer_phone}}, {{trip_name}}, {{message}}",
  },
  {
    template_key: "enquiry_response",
    event_key: "enquiry.responded",
    name: __("Enquiry Response", "yatra"),
    description: __(
      "Sent to the customer when you reply to their enquiry.",
      "yatra",
    ),
    category: "enquiry",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    settingsFlag: "email_template_enquiry_response",
    settingsSubject: "email_tpl_enquiry_response_subject",
    settingsBody: "email_tpl_enquiry_response_body",
    mergeTags:
      "{{site_name}}, {{customer_name}}, {{customer_email}}, {{trip_name}}, {{trip_url}}, {{response}}, {{response_message}}, {{original_message}}",
  },
  {
    template_key: "review_request",
    event_key: "marketing.review_request",
    name: __("Review Request", "yatra"),
    description: __(
      "Queued when a booking is marked completed, then sent after the delay in Review settings (if reviews are enabled).",
      "yatra",
    ),
    category: "marketing",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    settingsFlag: "email_template_review_request",
    settingsSubject: "email_tpl_review_request_subject",
    settingsBody: "email_tpl_review_request_body",
    mergeTags:
      "{{site_name}}, {{customer_name}}, {{trip_name}}, {{review_url}}, {{booking_reference}}, " +
      BOOKING_RICH_MERGE_TAGS,
  },
  {
    template_key: "abandoned_booking_recovery_first",
    event_key: "booking.abandoned_recovery",
    name: __("Abandoned booking recovery (First)", "yatra"),
    description: sprintf(
      /* translators: %s: brand name (e.g. "Yatra Pro" or operator's white-labeled brand) */
      __(
        "First reminder sent by %s abandoned checkout recovery (module copy in {{recovery_intro_html}}).",
        "yatra",
      ),
      BRAND_PRO_NAME,
    ),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    requiresModule: "abandoned_booking_recovery",
    settingsFlag: "email_template_abandoned_booking_recovery_first",
    settingsSubject: "email_tpl_abandoned_booking_recovery_first_subject",
    settingsBody: "email_tpl_abandoned_booking_recovery_first_body",
    mergeTags:
      "{{site_name}}, {{customer_name}}, {{trip_name}}, {{recovery_link}}, {{booking_reference}}, {{recovery_reminder_label}}, {{recovery_intro_html}}, " +
      BOOKING_RICH_MERGE_TAGS,
  },
  {
    template_key: "abandoned_booking_recovery_second",
    event_key: "booking.abandoned_recovery",
    name: __("Abandoned booking recovery (Second)", "yatra"),
    description: sprintf(
      /* translators: %s: brand name */
      __(
        "Second reminder sent by %s abandoned checkout recovery (module copy in {{recovery_intro_html}}).",
        "yatra",
      ),
      BRAND_PRO_NAME,
    ),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    requiresModule: "abandoned_booking_recovery",
    settingsFlag: "email_template_abandoned_booking_recovery_second",
    settingsSubject: "email_tpl_abandoned_booking_recovery_second_subject",
    settingsBody: "email_tpl_abandoned_booking_recovery_second_body",
    mergeTags:
      "{{site_name}}, {{customer_name}}, {{trip_name}}, {{recovery_link}}, {{booking_reference}}, {{recovery_reminder_label}}, {{recovery_intro_html}}, " +
      BOOKING_RICH_MERGE_TAGS,
  },
  {
    template_key: "abandoned_booking_recovery_final",
    event_key: "booking.abandoned_recovery",
    name: __("Abandoned booking recovery (Final)", "yatra"),
    description: sprintf(
      /* translators: %s: brand name */
      __(
        "Final reminder sent by %s abandoned checkout recovery (module copy in {{recovery_intro_html}}).",
        "yatra",
      ),
      BRAND_PRO_NAME,
    ),
    category: "booking",
    recipient_type: "customer",
    to_email: "{customer_email}",
    isCoreFree: true,
    requiresModule: "abandoned_booking_recovery",
    settingsFlag: "email_template_abandoned_booking_recovery_final",
    settingsSubject: "email_tpl_abandoned_booking_recovery_final_subject",
    settingsBody: "email_tpl_abandoned_booking_recovery_final_body",
    mergeTags:
      "{{site_name}}, {{customer_name}}, {{trip_name}}, {{recovery_link}}, {{booking_reference}}, {{recovery_reminder_label}}, {{recovery_intro_html}}, " +
      BOOKING_RICH_MERGE_TAGS,
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

export type BuildLocalTemplateRowsOptions = {
  isProPluginActive: boolean;
  isModuleActive: (slug: string) => boolean;
};

export function buildLocalTemplateRows(
  values: EmailSettingsValues,
  options?: BuildLocalTemplateRowsOptions,
): UnifiedEmailTemplate[] {
  const pro = options?.isProPluginActive ?? false;
  const moduleOk = (slug: string) =>
    options?.isModuleActive ? options.isModuleActive(slug) : false;

  return EMAIL_TEMPLATES_CATALOG.map((entry) => {
    const moduleGateOk =
      !entry.requiresModule || (pro && moduleOk(entry.requiresModule));

    const proCatalogLocked = !entry.isCoreFree;
    const moduleContentLocked = Boolean(entry.requiresModule) && !moduleGateOk;

    const is_locked = proCatalogLocked || moduleContentLocked;

    const hasSettingsKeys = Boolean(
      entry.settingsFlag && entry.settingsSubject && entry.settingsBody,
    );

    const subject = entry.settingsSubject
      ? String(values[entry.settingsSubject] ?? "")
      : "";
    const body = entry.settingsBody
      ? String(values[entry.settingsBody] ?? "")
      : "";
    const isActive = entry.settingsFlag
      ? Boolean(values[entry.settingsFlag])
      : false;

    const id =
      entry.isCoreFree || hasSettingsKeys
        ? `core:${entry.template_key}`
        : `locked:${entry.template_key}`;

    return {
      id,
      template_key: entry.template_key,
      event_key: entry.event_key,
      name: entry.name,
      description: entry.description,
      subject,
      body,
      category: entry.category,
      recipient_type: entry.recipient_type,
      to_email: entry.to_email,
      is_active: hasSettingsKeys ? isActive : false,
      is_system: true,
      is_locked,
      variables: [],
    };
  });
}
