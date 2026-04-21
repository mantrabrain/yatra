import type { ChangeEventHandler } from "react";

/** Core email fields stored via Settings API (`/settings`). */
export type EmailSettingsValues = {
  admin_email: string;
  from_email: string;
  from_name: string;
  email_template_booking: boolean;
  email_template_confirmation: boolean;
  email_template_cancellation: boolean;
  email_template_reminder: boolean;
  email_template_admin_new_booking: boolean;
  email_template_admin_payment: boolean;
  email_template_admin_cancellation: boolean;
  smtp_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  email_tpl_booking_subject: string;
  email_tpl_booking_body: string;
  email_tpl_payment_subject: string;
  email_tpl_payment_body: string;
  email_tpl_cancellation_subject: string;
  email_tpl_cancellation_body: string;
  email_tpl_reminder_subject: string;
  email_tpl_reminder_body: string;
  email_tpl_admin_booking_subject: string;
  email_tpl_admin_booking_body: string;
  email_tpl_admin_payment_subject: string;
  email_tpl_admin_payment_body: string;
  email_tpl_admin_cancellation_subject: string;
  email_tpl_admin_cancellation_body: string;
};

export type EmailFieldChangeHandler = ChangeEventHandler<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;
