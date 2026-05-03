/**
 * Load and save core email settings (SMTP, from addresses, transactional templates)
 * via the same /settings API as the main Settings page.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState, useEffect } from "react";
import { fetchSettings, saveSettings } from "../api/settings-api";
import { useToast } from "../components/ui/toast";
import { usePermissions } from "./usePermissions";
import { __ } from "../lib/i18n";
import type {
  EmailFieldChangeHandler,
  EmailSettingsValues,
} from "../components/settings/email-settings-types";

const EMAIL_KEYS: (keyof EmailSettingsValues)[] = [
  "admin_email",
  "from_email",
  "from_name",
  "email_template_booking",
  "email_template_confirmation",
  "email_template_cancellation",
  "email_template_reminder",
  "email_template_admin_new_booking",
  "email_template_admin_payment",
  "email_template_admin_cancellation",
  "email_template_trip_consent",
  "email_template_customer_verification",
  "smtp_enabled",
  "smtp_host",
  "smtp_port",
  "smtp_username",
  "smtp_password",
  "smtp_encryption",
  "email_tpl_booking_subject",
  "email_tpl_booking_body",
  "email_tpl_payment_subject",
  "email_tpl_payment_body",
  "email_tpl_cancellation_subject",
  "email_tpl_cancellation_body",
  "email_tpl_reminder_subject",
  "email_tpl_reminder_body",
  "email_tpl_admin_booking_subject",
  "email_tpl_admin_booking_body",
  "email_tpl_admin_payment_subject",
  "email_tpl_admin_payment_body",
  "email_tpl_admin_cancellation_subject",
  "email_tpl_admin_cancellation_body",
  "email_tpl_trip_consent_subject",
  "email_tpl_trip_consent_body",
  "email_tpl_customer_verification_subject",
  "email_tpl_customer_verification_body",
  "email_template_booking_completed",
  "email_template_booking_expired_customer",
  "email_template_admin_booking_expired",
  "email_template_scheduled_payment_reminder",
  "email_template_scheduled_payment_succeeded",
  "email_template_scheduled_payment_failed",
  "email_template_admin_scheduled_payment_failed",
  "email_template_enquiry_received",
  "email_template_enquiry_admin",
  "email_template_enquiry_response",
  "email_template_review_request",
  "email_template_abandoned_booking_recovery",
  "email_tpl_booking_completed_subject",
  "email_tpl_booking_completed_body",
  "email_tpl_booking_expired_customer_subject",
  "email_tpl_booking_expired_customer_body",
  "email_tpl_admin_booking_expired_subject",
  "email_tpl_admin_booking_expired_body",
  "email_tpl_scheduled_payment_reminder_subject",
  "email_tpl_scheduled_payment_reminder_body",
  "email_tpl_scheduled_payment_succeeded_subject",
  "email_tpl_scheduled_payment_succeeded_body",
  "email_tpl_scheduled_payment_failed_subject",
  "email_tpl_scheduled_payment_failed_body",
  "email_tpl_admin_scheduled_payment_failed_subject",
  "email_tpl_admin_scheduled_payment_failed_body",
  "email_tpl_enquiry_received_subject",
  "email_tpl_enquiry_received_body",
  "email_tpl_enquiry_admin_subject",
  "email_tpl_enquiry_admin_body",
  "email_tpl_enquiry_response_subject",
  "email_tpl_enquiry_response_body",
  "email_tpl_review_request_subject",
  "email_tpl_review_request_body",
  "email_tpl_abandoned_booking_recovery_subject",
  "email_tpl_abandoned_booking_recovery_body",
];

const BOOL_KEYS = new Set<keyof EmailSettingsValues>([
  "email_template_booking",
  "email_template_confirmation",
  "email_template_cancellation",
  "email_template_reminder",
  "email_template_admin_new_booking",
  "email_template_admin_payment",
  "email_template_admin_cancellation",
  "email_template_trip_consent",
  "email_template_customer_verification",
  "email_template_booking_completed",
  "email_template_booking_expired_customer",
  "email_template_admin_booking_expired",
  "email_template_scheduled_payment_reminder",
  "email_template_scheduled_payment_succeeded",
  "email_template_scheduled_payment_failed",
  "email_template_admin_scheduled_payment_failed",
  "email_template_enquiry_received",
  "email_template_enquiry_admin",
  "email_template_enquiry_response",
  "email_template_review_request",
  "email_template_abandoned_booking_recovery",
  "smtp_enabled",
]);

export const EMAIL_SETTINGS_DEFAULTS: EmailSettingsValues = {
  admin_email: "admin@yatra.com",
  from_email: "noreply@yatra.com",
  from_name: "Yatra Travel",
  email_template_booking: true,
  email_template_confirmation: true,
  email_template_cancellation: true,
  email_template_reminder: true,
  email_template_admin_new_booking: true,
  email_template_admin_payment: true,
  email_template_admin_cancellation: true,
  email_template_trip_consent: true,
  email_template_customer_verification: true,
  email_template_booking_completed: true,
  email_template_booking_expired_customer: true,
  email_template_admin_booking_expired: true,
  email_template_scheduled_payment_reminder: true,
  email_template_scheduled_payment_succeeded: true,
  email_template_scheduled_payment_failed: true,
  email_template_admin_scheduled_payment_failed: true,
  email_template_enquiry_received: true,
  email_template_enquiry_admin: true,
  email_template_enquiry_response: true,
  email_template_review_request: true,
  email_template_abandoned_booking_recovery: true,
  smtp_enabled: false,
  smtp_host: "smtp.gmail.com",
  smtp_port: 587,
  smtp_username: "",
  smtp_password: "",
  smtp_encryption: "tls",
  email_tpl_booking_subject: "",
  email_tpl_booking_body: "",
  email_tpl_payment_subject: "",
  email_tpl_payment_body: "",
  email_tpl_cancellation_subject: "",
  email_tpl_cancellation_body: "",
  email_tpl_reminder_subject: "",
  email_tpl_reminder_body: "",
  email_tpl_admin_booking_subject: "",
  email_tpl_admin_booking_body: "",
  email_tpl_admin_payment_subject: "",
  email_tpl_admin_payment_body: "",
  email_tpl_admin_cancellation_subject: "",
  email_tpl_admin_cancellation_body: "",
  email_tpl_trip_consent_subject: "",
  email_tpl_trip_consent_body: "",
  email_tpl_customer_verification_subject: "",
  email_tpl_customer_verification_body: "",
  email_tpl_booking_completed_subject: "",
  email_tpl_booking_completed_body: "",
  email_tpl_booking_expired_customer_subject: "",
  email_tpl_booking_expired_customer_body: "",
  email_tpl_admin_booking_expired_subject: "",
  email_tpl_admin_booking_expired_body: "",
  email_tpl_scheduled_payment_reminder_subject: "",
  email_tpl_scheduled_payment_reminder_body: "",
  email_tpl_scheduled_payment_succeeded_subject: "",
  email_tpl_scheduled_payment_succeeded_body: "",
  email_tpl_scheduled_payment_failed_subject: "",
  email_tpl_scheduled_payment_failed_body: "",
  email_tpl_admin_scheduled_payment_failed_subject: "",
  email_tpl_admin_scheduled_payment_failed_body: "",
  email_tpl_enquiry_received_subject: "",
  email_tpl_enquiry_received_body: "",
  email_tpl_enquiry_admin_subject: "",
  email_tpl_enquiry_admin_body: "",
  email_tpl_enquiry_response_subject: "",
  email_tpl_enquiry_response_body: "",
  email_tpl_review_request_subject: "",
  email_tpl_review_request_body: "",
  email_tpl_abandoned_booking_recovery_subject: "",
  email_tpl_abandoned_booking_recovery_body: "",
};

function coerceEmailValues(
  raw: Record<string, unknown> | undefined,
): EmailSettingsValues {
  const out: EmailSettingsValues = { ...EMAIL_SETTINGS_DEFAULTS };
  if (!raw) return out;

  for (const key of EMAIL_KEYS) {
    const v = raw[key as string];
    if (v === undefined || v === null) continue;

    if (key === "smtp_port") {
      const n = typeof v === "number" ? v : parseInt(String(v), 10);
      out.smtp_port = Number.isFinite(n)
        ? n
        : EMAIL_SETTINGS_DEFAULTS.smtp_port;
    } else if (BOOL_KEYS.has(key)) {
      (out as Record<string, unknown>)[key as string] =
        v === true || v === "true" || v === 1 || v === "1";
    } else {
      (out as Record<string, unknown>)[key as string] = String(v);
    }
  }
  return out;
}

function sliceEqual(a: EmailSettingsValues, b: EmailSettingsValues): boolean {
  for (const key of EMAIL_KEYS) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function applyEmailSlice(
  base: Record<string, unknown>,
  slice: EmailSettingsValues,
): Record<string, unknown> {
  const next = { ...base };
  for (const key of EMAIL_KEYS) {
    next[key as string] = slice[key] as unknown;
  }
  return next;
}

export function useEmailSettingsManager() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { can } = usePermissions();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        return await fetchSettings();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : __("Failed to load settings", "yatra");
        showToast(message, "error");
        throw error;
      }
    },
    enabled: can("manage_yatra"),
  });

  const serverSlice = useMemo(
    () => coerceEmailValues(settings as Record<string, unknown> | undefined),
    [settings],
  );

  const [localSlice, setLocalSlice] = useState<EmailSettingsValues | null>(
    null,
  );

  useEffect(() => {
    if (settings) {
      setLocalSlice((prev) =>
        prev === null
          ? coerceEmailValues(settings as Record<string, unknown>)
          : prev,
      );
    }
  }, [settings]);

  const ready = Boolean(settings) && !isLoading;
  const values = localSlice ?? serverSlice;
  const isDirty = localSlice ? !sliceEqual(localSlice, serverSlice) : false;

  const handleFieldChange: EmailFieldChangeHandler = useCallback(
    (e) => {
      const field = (e.target.name || e.target.id) as keyof EmailSettingsValues;
      if (!(EMAIL_KEYS as readonly string[]).includes(field as string)) return;

      let value: string | number | boolean;
      if (e.target.type === "checkbox") {
        value = (e.target as HTMLInputElement).checked;
      } else if (e.target.type === "number") {
        const num = parseFloat(e.target.value);
        value = Number.isFinite(num) ? num : 0;
      } else {
        value = e.target.value;
      }

      setLocalSlice((prev) => {
        const base =
          prev ??
          (settings
            ? coerceEmailValues(settings as Record<string, unknown>)
            : { ...EMAIL_SETTINGS_DEFAULTS });
        return { ...base, [field]: value } as EmailSettingsValues;
      });
    },
    [settings],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings || !localSlice) {
        throw new Error(__("Settings not loaded", "yatra"));
      }
      const payload = applyEmailSlice(
        settings as Record<string, unknown>,
        localSlice,
      );
      await saveSettings(payload);
      return payload;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(["settings"], saved);
      setLocalSlice(coerceEmailValues(saved));
      showToast(__("Email settings saved", "yatra"), "success");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : __("Failed to save settings", "yatra");
      showToast(message, "error");
    },
  });

  const save = useCallback(() => {
    saveMutation.mutate();
  }, [saveMutation]);

  return {
    values,
    handleFieldChange,
    save,
    isLoading,
    ready,
    isSaving: saveMutation.isPending,
    canSave: ready && Boolean(localSlice) && isDirty && !saveMutation.isPending,
  };
}
