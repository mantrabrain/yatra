/**
 * Booking form builder types (Settings → Booking Form). Shared by the
 * Settings page and the per-trip Conditions popup.
 */

export interface FormFieldConfig {
  id: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "date"
    | "select"
    | "country"
    | "textarea"
    | "checkbox"
    | "number"
    | "text_block";
  label: string;
  placeholder: string;
  required: boolean;
  enabled: boolean;
  order: number;
  width: "full" | "half" | "third";
  section?: string;
  options?: { value: string; label: string }[];
  content?: string; // For text_block: the display-only content (safe HTML)
  locked?: boolean; // If true, field cannot be deleted and required cannot be changed
  /**
   * Traveler-section only: which travelers this field is shown to.
   * "all" (default) = every traveler; "lead" = the lead traveler (Traveler 1) only.
   * Absent is treated as "all" for backward compatibility.
   */
  applies_to?: "all" | "lead";
  /**
   * Phone (tel) fields only: show the international country-code selector
   * (flag + dial code) on the input. Absent is treated as `true` (on) for
   * backward compatibility, so existing forms keep the widget without a re-save.
   */
  show_country_code?: boolean;
}

/**
 * Which trips a form condition applies to. Any match applies: a listed trip,
 * a listed category (sub-categories included) or the trip's type.
 */
export interface FormConditionTargets {
  trips?: number[];
  categories?: number[];
  trip_types?: string[];
}

/**
 * Pro (Dynamic Form Field): an alternative version of a form section used on
 * the trips its targets name. A complete copy — title, description and field
 * list — independent of the global section once created.
 */
export interface FormCondition {
  id: string;
  targets: FormConditionTargets;
  title: string;
  description: string;
  fields: FormFieldConfig[];
}

export interface FormSectionConfig {
  title: string;
  description: string;
  enabled?: boolean;
  fields: FormFieldConfig[];
  /** Pro: per-trip versions of this section, checked in order; first match wins. */
  conditions?: FormCondition[];
}

export interface BookingFormConfig {
  contact_form: FormSectionConfig;
  emergency_contact_form: FormSectionConfig;
  traveler_form: FormSectionConfig;
}

export type BookingFormType = keyof BookingFormConfig;
