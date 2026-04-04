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
];

const BOOL_KEYS = new Set<keyof EmailSettingsValues>([
  "email_template_booking",
  "email_template_confirmation",
  "email_template_cancellation",
  "email_template_reminder",
  "email_template_admin_new_booking",
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
      out.smtp_port = Number.isFinite(n) ? n : EMAIL_SETTINGS_DEFAULTS.smtp_port;
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

  const handleFieldChange: EmailFieldChangeHandler = useCallback((e) => {
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
  }, [settings]);

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
    canSave:
      ready &&
      Boolean(localSlice) &&
      isDirty &&
      !saveMutation.isPending,
  };
}
