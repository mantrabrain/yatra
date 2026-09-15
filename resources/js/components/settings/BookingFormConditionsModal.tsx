import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, RotateCcw } from "lucide-react";
import { __, sprintf } from "../../lib/i18n";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { MultiSelect } from "../ui/multi-select";
import type {
  BookingFormType,
  FormCondition,
  FormConditionTargets,
  FormFieldConfig,
  FormSectionConfig,
} from "./booking-form-types";
import { BookingFormFieldsEditor } from "./BookingFormFieldsEditor";

/**
 * Settings → Booking Form → "Conditions" popup (Pro — Dynamic Form Field).
 *
 * A condition is a complete alternative version of one form section — its own
 * title, description and field list — used on the trips it names. Each one
 * starts as a copy of the global section and is edited with the same controls
 * as the global builder. Conditions are part of `booking_form_config` and are
 * saved with the page's Save Settings button; this popup only edits a draft.
 */

// Trip targeting (picker options, encode/decode, labels) is shared with the
// email template overrides — see hooks/useTripTargets.
import {
  decodeTargets,
  describeTargets,
  encodeTargets,
  hasTargets,
  useTripTargets,
} from "../../hooks/useTripTargets";
export { describeTargets, hasTargets, useTripTargets as useConditionTargets };

// ---- helpers ---------------------------------------------------------------

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const reorder = (fields: FormFieldConfig[]): FormFieldConfig[] =>
  fields.map((f, i) => ({ ...f, order: i + 1 }));

const newConditionFrom = (section: FormSectionConfig): FormCondition => ({
  id: `condition_${Date.now().toString(36)}`,
  targets: {},
  title: section.title || "",
  description: section.description || "",
  fields: clone(section.fields || []),
});

// ---- component -------------------------------------------------------------

interface Option {
  value: string;
  label: string;
}

interface BookingFormConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formType: BookingFormType;
  formLabel: string;
  /** The global section this popup's conditions are versions of. */
  section: FormSectionConfig;
  onSave: (conditions: FormCondition[]) => void;
  fieldTypes: Option[];
  widthOptions: Option[];
  appliesToOptions: Option[];
}

export const BookingFormConditionsModal: React.FC<
  BookingFormConditionsModalProps
> = ({
  isOpen,
  onClose,
  formType,
  formLabel,
  section,
  onSave,
  fieldTypes,
  widthOptions,
  appliesToOptions,
}) => {
  const [draft, setDraft] = useState<FormCondition[]>([]);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [addFromGlobal, setAddFromGlobal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { options: targetOptions } = useTripTargets(isOpen);

  // Fresh draft every time the popup opens.
  useEffect(() => {
    if (!isOpen) return;
    setDraft(clone(section.conditions || []));
    setCollapsed(new Set());
    setAddFromGlobal(null);
    setError(null);
  }, [isOpen, section.conditions]);

  const globalFields = section.fields || [];
  const isTraveler = formType === "traveler_form";

  const update = (ci: number, patch: Partial<FormCondition>) =>
    setDraft((d) => d.map((c, i) => (i === ci ? { ...c, ...patch } : c)));

  const moveCondition = (ci: number, delta: number) =>
    setDraft((d) => {
      const next = [...d];
      const to = ci + delta;
      if (to < 0 || to >= next.length) return next;
      [next[ci], next[to]] = [next[to], next[ci]];
      return next;
    });

  const toggleCollapsed = (ci: number) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(ci)) n.delete(ci);
      else n.add(ci);
      return n;
    });

  const addCondition = () => {
    setDraft((d) => [...d, newConditionFrom(section)]);
    setCollapsed(new Set(draft.map((_, i) => i)));
  };

  const done = () => {
    const bad = draft.findIndex((c) => !hasTargets(c.targets));
    if (bad >= 0) {
      setError(
        sprintf(
          __(
            "Condition %d needs at least one trip, category or trip type.",
            "yatra",
          ),
          bad + 1,
        ),
      );
      setCollapsed((s) => {
        const n = new Set(s);
        n.delete(bad);
        return n;
      });
      return;
    }
    onSave(draft);
    onClose();
  };

  const typeLabel = (t: string) =>
    fieldTypes.find((x) => x.value === t)?.label || t;

  // ---- renderers -----------------------------------------------------------

  const renderCondition = (c: FormCondition, ci: number) => {
    const isCollapsed = collapsed.has(ci);
    const missingFromGlobal = globalFields.filter(
      (g) => !c.fields.some((f) => f.id === g.id),
    );
    const enabledCount = c.fields.filter((f) => f.enabled !== false).length;
    const where = describeTargets(c.targets, targetOptions);
    return (
      <div
        key={c.id}
        className="rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 border-l-purple-500 overflow-hidden"
        data-testid={`condition-${ci}`}
      >
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
          <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {sprintf(__("COND %d", "yatra"), ci + 1)}
          </span>
          <span className="text-sm font-semibold">
            {where || __("Choose where this applies", "yatra")}
          </span>
          <span className="text-xs text-gray-500">
            {sprintf(
              __("→ “%1$s” · %2$d fields", "yatra"),
              c.title,
              enabledCount,
            )}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30"
            disabled={ci === 0}
            onClick={() => moveCondition(ci, -1)}
            title={__("Higher priority", "yatra")}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30"
            disabled={ci === draft.length - 1}
            onClick={() => moveCondition(ci, 1)}
            title={__("Lower priority", "yatra")}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const fresh = newConditionFrom(section);
              update(ci, {
                title: fresh.title,
                description: fresh.description,
                fields: fresh.fields,
              });
            }}
            title={__(
              "Replace this condition's form with a fresh copy of the global form",
              "yatra",
            )}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            {__("Reset to global form", "yatra")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={() => setDraft((d) => d.filter((_, i) => i !== ci))}
          >
            {__("Remove", "yatra")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => toggleCollapsed(ci)}
          >
            {isCollapsed ? __("Expand", "yatra") : __("Collapse", "yatra")}
          </Button>
        </div>

        {!isCollapsed && (
          <div className="p-3 space-y-4">
            <div>
              <Label className="text-xs">
                {__("Use this form on", "yatra")}
                <span className="ml-2 font-normal text-gray-400">
                  {__(
                    "trips, categories or trip types — any match applies",
                    "yatra",
                  )}
                </span>
              </Label>
              <MultiSelect
                value={encodeTargets(c.targets)}
                onChange={(vals) =>
                  update(ci, { targets: decodeTargets(vals) })
                }
                options={targetOptions}
                placeholder={__(
                  "Search trips, categories, trip types…",
                  "yatra",
                )}
                className="mt-1"
              />
              {!hasTargets(c.targets) && (
                <p className="text-xs text-red-600 mt-1">
                  {__(
                    "Pick at least one trip, category or trip type.",
                    "yatra",
                  )}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {__("Form Section Settings", "yatra")}
                </span>
                <span className="text-xs text-gray-400">
                  {__("for these trips", "yatra")}
                </span>
              </div>
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">
                    {__("Section Title", "yatra")}
                  </Label>
                  <Input
                    value={c.title}
                    onChange={(e) => update(ci, { title: e.target.value })}
                    className="mt-1 text-sm"
                    data-testid={`condition-${ci}-title`}
                  />
                </div>
                <div>
                  <Label className="text-xs">
                    {__("Section Description", "yatra")}
                  </Label>
                  <Input
                    value={c.description}
                    onChange={(e) =>
                      update(ci, { description: e.target.value })
                    }
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Same builder as the global list — drag to reorder, arrows,
                inline editor, Add New Field — plus "Add from global form". */}
            <BookingFormFieldsEditor
              formType={formType}
              fields={c.fields}
              onChange={(fields) => update(ci, { fields })}
              fieldTypes={fieldTypes}
              widthOptions={widthOptions}
              appliesToOptions={appliesToOptions}
              headerExtra={
                addFromGlobal === ci ? (
                  <Select
                    autoFocus
                    className="text-sm h-9 w-56"
                    value=""
                    onChange={(e) => {
                      const g = globalFields.find(
                        (f) => f.id === e.target.value,
                      );
                      if (g) {
                        update(ci, {
                          fields: reorder([...c.fields, clone(g)]),
                        });
                      }
                      setAddFromGlobal(null);
                    }}
                    onBlur={() => setAddFromGlobal(null)}
                    data-testid="add-from-global-select"
                  >
                    <option value="">
                      {__("Pick a global field…", "yatra")}
                    </option>
                    {missingFromGlobal.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.type === "text_block"
                          ? __("Text Block", "yatra")
                          : g.label}{" "}
                        ({typeLabel(g.type)})
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={missingFromGlobal.length === 0}
                    onClick={() => setAddFromGlobal(ci)}
                    title={
                      missingFromGlobal.length === 0
                        ? __(
                            "Every global field is already in this condition",
                            "yatra",
                          )
                        : undefined
                    }
                    data-testid="add-from-global"
                  >
                    {__("Add from global form", "yatra")}
                  </Button>
                )
              }
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={sprintf(__("Conditions — %s", "yatra"), formLabel)}
      description={__(
        "Give some trips their own version of this form. Each condition is a full copy of the form builder — change the section title, add or remove fields, reorder, edit labels, required, widths and options — and applies only to the trips it names.",
        "yatra",
      )}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <span className="text-xs text-gray-500">
            {__(
              "Conditions are saved with Save Settings, like every other form change.",
              "yatra",
            )}
          </span>
          <div className="flex items-center gap-2">
            {error && <span className="text-xs text-red-600">{error}</span>}
            <Button type="button" variant="outline" onClick={onClose}>
              {__("Cancel", "yatra")}
            </Button>
            <Button type="button" onClick={done} data-testid="conditions-done">
              {__("Done", "yatra")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3" data-testid="conditions-modal">
        {draft.length === 0 && (
          <p className="text-sm text-gray-500">
            {__(
              "No conditions yet — every trip uses the global form. Add one to give some trips their own version.",
              "yatra",
            )}
          </p>
        )}
        {draft.map(renderCondition)}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 hover:border-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/10"
          onClick={addCondition}
          data-testid="add-condition"
        >
          <Plus className="w-4 h-4" />
          {__("Add condition", "yatra")}
          <span className="text-xs text-gray-400">
            {__("— starts as a copy of the global form", "yatra")}
          </span>
        </button>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 text-sm">
          <span className="font-semibold">
            {__("All other trips", "yatra")}
          </span>{" "}
          <span className="text-gray-500">
            {__(
              "Trips that match no condition use the global form behind this popup — the behaviour before conditions existed.",
              "yatra",
            )}
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default BookingFormConditionsModal;
