/**
 * "Traveller details missing — Complete now" on the customer's booking page,
 * and an editor for the booking form's traveller fields
 * (PUT /customers/my-bookings/{id}/travelers). The server decides which
 * fields exist, validates each by type and refuses to empty a required one.
 */
import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, UserCog } from "lucide-react";
import { __, sprintf } from "../../lib/i18n";
import { apiClient } from "../../lib/api-client";
import { API_ENDPOINTS } from "../../lib/api-endpoints";
import { getCountrySelectOptions } from "../../lib/countries";

export interface TravelerFormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  applies_to: "all" | "lead";
  options: { value: string; label: string }[];
}

interface Props {
  bookingId: number;
  travelers: any[];
  fields: TravelerFormField[];
  missing: { traveller: number; fields: string[] }[];
  canEdit: boolean;
  /** Travellers booked; extra slots appear for any without a record yet. */
  travelersCount?: number;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white";

const TravellerDetailsEditor: React.FC<Props> = ({ bookingId, travelers: recorded, fields, missing, canEdit, travelersCount }) => {
  // Recorded travellers plus empty slots up to the number booked (id < 0 =
  // not saved yet; the server creates the record from its position).
  const travelers = useMemo(() => {
    const list = [...(recorded || [])];
    for (let i = list.length; i < (Number(travelersCount) || 0); i++) {
      list.push({ id: -(i + 1), index: i, fields: {} });
    }
    return list;
  }, [recorded, travelersCount]);
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const initial = useMemo(() => {
    const out: Record<number, Record<string, string>> = {};
    (travelers || []).forEach((t: any) => {
      const values = t?.fields || {};
      const row: Record<string, string> = {};
      fields.forEach((f) => {
        row[f.id] = values[f.id] !== undefined && values[f.id] !== null ? String(values[f.id]) : "";
      });
      out[Number(t.id)] = row;
    });
    return out;
  }, [travelers, fields]);
  const [values, setValues] = useState(initial);

  const save = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(values).map(([id, f]) =>
        Number(id) < 0
          ? { id: 0, index: -Number(id) - 1, fields: f }
          : { id: Number(id), fields: f },
      );
      const res: any = await apiClient.put(
        `${API_ENDPOINTS.CUSTOMER_MY_BOOKING(bookingId)}/travelers`,
        { travelers: payload },
      );
      if (res && res.success === false) throw new Error(res.message);
      return res;
    },
    onSuccess: (res: any) => {
      setFeedback({ ok: true, text: res?.message || __("Traveller details saved. Thank you!", "yatra") });
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["booking-details"] }); // prefix: the list keys it by the id as it came in (number or string)
    },
    onError: (e: any) =>
      setFeedback({
        ok: false,
        text: e?.response?.data?.message || e?.message || __("The details could not be saved.", "yatra"),
      }),
  });

  if (!fields.length || !(travelers || []).length) return null;
  if (!canEdit && missing.length === 0 && !feedback) return null;

  const set = (tid: number, fid: string, v: string) =>
    setValues((prev) => ({ ...prev, [tid]: { ...(prev[tid] || {}), [fid]: v } }));

  const renderInput = (tid: number, f: TravelerFormField) => {
    const v = values[tid]?.[f.id] ?? "";
    const common = {
      id: `t${tid}-${f.id}`,
      "data-testid": `traveler-${tid}-${f.id}`,
    };
    switch (f.type) {
      case "select":
      case "radio":
        return (
          <select {...common} className={inputClass} value={v} onChange={(e) => set(tid, f.id, e.target.value)}>
            <option value="">{__("Select", "yatra")}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        );
      case "country":
        return (
          <select {...common} className={inputClass} value={v} onChange={(e) => set(tid, f.id, e.target.value)}>
            <option value="">{__("Select", "yatra")}</option>
            {getCountrySelectOptions().map((o: any) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        );
      case "textarea":
        return <textarea {...common} className={inputClass} rows={3} value={v} onChange={(e) => set(tid, f.id, e.target.value)} />;
      case "checkbox":
        return (
          <input
            {...common}
            type="checkbox"
            className="mt-2"
            checked={v === "1"}
            onChange={(e) => set(tid, f.id, e.target.checked ? "1" : "0")}
          />
        );
      default:
        return (
          <input
            {...common}
            type={["email", "date", "number"].includes(f.type) ? f.type : f.type === "phone" || f.type === "tel" ? "tel" : "text"}
            className={inputClass}
            value={v}
            onChange={(e) => set(tid, f.id, e.target.value)}
          />
        );
    }
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6"
      data-testid="traveller-details-editor"
    >
      {missing.length > 0 && !editing && (
        <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2" data-testid="travellers-missing">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">{__("Traveller details missing", "yatra")}</div>
            <ul className="list-none m-0 p-0 mt-1">
              {missing.map((m) => (
                <li key={m.traveller} className="m-0">
                  {sprintf(__("Traveller %1$d: %2$s", "yatra"), m.traveller, m.fields.join(", "))}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {feedback && (
        <div
          role="status"
          className={`mb-3 rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${
            feedback.ok
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
          }`}
          data-testid="traveller-details-feedback"
        >
          {feedback.ok && <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
          {feedback.text}
        </div>
      )}

      {!editing ? (
        canEdit && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              setValues(initial);
              setFeedback(null);
              setEditing(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setValues(initial);
                setFeedback(null);
                setEditing(true);
              }
            }}
            className={`yatra-booking-action inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              missing.length > 0
                ? "bg-yatra-primary text-white hover:bg-yatra-primary-dark"
                : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            data-testid="traveller-details-edit"
          >
            <UserCog className="w-4 h-4" />
            {missing.length > 0 ? __("Complete now", "yatra") : __("Edit traveller details", "yatra")}
          </div>
        )
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-6"
        >
          {(travelers || []).map((t: any, i: number) => (
            <fieldset key={t.id} className="border-0 p-0 m-0">
              <legend className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {sprintf(__("Traveller %d", "yatra"), i + 1)}
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fields
                  .filter((f) => f.applies_to !== "lead" || i === 0)
                  .map((f) => (
                    <label key={f.id} htmlFor={`t${t.id}-${f.id}`} className="block text-sm text-gray-700 dark:text-gray-300">
                      {f.label}
                      {f.required && <span className="text-red-500"> *</span>}
                      {renderInput(Number(t.id), f)}
                    </label>
                  ))}
              </div>
            </fieldset>
          ))}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="yatra-booking-action inline-flex items-center px-4 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium disabled:opacity-50"
              data-testid="traveller-details-save"
            >
              {save.isPending ? __("Saving…", "yatra") : __("Save details", "yatra")}
            </button>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
              className="yatra-booking-action inline-flex items-center px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:underline cursor-pointer"
            >
              {__("Cancel", "yatra")}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default TravellerDetailsEditor;
