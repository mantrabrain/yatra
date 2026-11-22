import { __, sprintf } from "./i18n";
import type { MultiSelectOption } from "../components/ui/multi-select";
import {
  decodeTargets,
  describeTargets,
  hasTargets,
  type TripTargets,
} from "../hooks/useTripTargets";

/**
 * Targets of an email override template: the trip targets shared with the
 * booking-form conditions, plus payment methods (Pro Email Automation builds
 * that publish `yatraAdmin.emailTemplatePaymentMethods`). Kept apart from the
 * shared trip picker so booking-form conditions never offer payment methods.
 */
export type EmailOverrideTargets = TripTargets & { payment_methods?: string[] };

/** Payment methods the installed Pro can target, or null when it can't. */
export const paymentMethodOptions = (): MultiSelectOption[] | null => {
  const raw = (window as any).yatraAdmin?.emailTemplatePaymentMethods;
  if (!Array.isArray(raw)) return null;
  const options = raw
    .filter((o: any) => o && typeof o.value === "string" && o.value !== "")
    .map((o: any) => ({
      value: String(o.value),
      label: o.hint
        ? `${String(o.label || o.value)} (${String(o.hint)})`
        : String(o.label || o.value),
    }));
  return options.length ? options : null;
};

export const hasEmailTargets = (t?: EmailOverrideTargets): boolean =>
  hasTargets(t) || (t?.payment_methods?.length ?? 0) > 0;

/** New trip picker values, keeping the payment methods already chosen. */
export const withTripValues = (
  prev: EmailOverrideTargets,
  values: (string | number)[],
): EmailOverrideTargets => {
  const next: EmailOverrideTargets = decodeTargets(values);
  if (prev.payment_methods?.length) next.payment_methods = prev.payment_methods;
  return next;
};

/** New payment-method picker values, keeping the trip targets. */
export const withPaymentMethods = (
  prev: EmailOverrideTargets,
  values: (string | number)[],
): EmailOverrideTargets => {
  const next: EmailOverrideTargets = { ...prev };
  const methods = values.map(String).filter((v) => v !== "");
  if (methods.length) next.payment_methods = methods;
  else delete next.payment_methods;
  return next;
};

/** "Multi-Day Trip · payment: Bank Transfer" for lists and suggested names. */
export const describeEmailTargets = (
  t: EmailOverrideTargets | undefined,
  tripOptions: MultiSelectOption[],
): string => {
  const trips = describeTargets(t, tripOptions);
  const methods = t?.payment_methods ?? [];
  if (!methods.length) return trips;
  const raw = (window as any).yatraAdmin?.emailTemplatePaymentMethods;
  const known: { value: string; label: string }[] = Array.isArray(raw)
    ? raw
    : [];
  const names = methods
    .map((m) => known.find((o) => String(o?.value) === m)?.label || m)
    .join(", ");
  const paid = sprintf(__("payment: %s", "yatra"), names);
  return trips ? `${trips} · ${paid}` : paid;
};
