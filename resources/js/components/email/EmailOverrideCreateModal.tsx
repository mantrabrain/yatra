import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { __, sprintf } from "../../lib/i18n";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { SearchableSelect } from "../ui/searchable-select";
import { MultiSelect } from "../ui/multi-select";
import { useToast } from "../ui/toast";
import {
  decodeTargets,
  describeTargets,
  encodeTargets,
  hasTargets,
  useTripTargets,
  type TripTargets,
} from "../../hooks/useTripTargets";
import { createEmailTemplateOverride } from "../../api/email-automation-api";
import type { UnifiedEmailTemplate } from "../../lib/email-templates-catalog";

/**
 * "Add an override" — the first step of creating a trip-specific version of a
 * global email template (Pro Email Automation). Asks WHICH trips first so an
 * override can never exist without a target, suggests a name from the
 * selection, then opens the new override in the editor.
 */
interface EmailOverrideCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Global templates the operator may override (overridable, not overrides). */
  globals: UnifiedEmailTemplate[];
  /** Preselected global template; when omitted the modal asks which one. */
  parent?: UnifiedEmailTemplate | null;
}

export const EmailOverrideCreateModal: React.FC<
  EmailOverrideCreateModalProps
> = ({ isOpen, onClose, globals, parent }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [parentId, setParentId] = useState<string>("");
  const [targets, setTargets] = useState<TripTargets>({});
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [copy, setCopy] = useState(true);
  const { options } = useTripTargets(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setParentId(parent ? String(parent.id) : String(globals[0]?.id ?? ""));
    setTargets({});
    setName("");
    setNameTouched(false);
    setCopy(true);
  }, [isOpen, parent, globals]);

  const selectedParent = useMemo(
    () => globals.find((g) => String(g.id) === parentId) || parent || null,
    [globals, parentId, parent],
  );

  const suggestedName = useMemo(() => {
    if (!selectedParent) return "";
    const where = describeTargets(targets, options);
    return where ? `${selectedParent.name} — ${where}` : "";
  }, [selectedParent, targets, options]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedParent)
        throw new Error(__("Pick a global template.", "yatra"));
      const response: any = await createEmailTemplateOverride(
        selectedParent.id,
        {
          targets,
          name: (nameTouched ? name : suggestedName).trim(),
          copy,
        },
      );
      if (response && response.success === false) {
        throw new Error(
          response.message || __("Failed to create override.", "yatra"),
        );
      }
      return response;
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      const newId = response?.data?.id;
      showToast(
        __("Override created — now edit the wording.", "yatra"),
        "success",
      );
      onClose();
      if (newId) {
        window.location.href = `admin.php?page=yatra&subpage=email-automation&tab=templates&action=edit&id=${newId}`;
      }
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to create override.", "yatra"),
        "error",
      );
    },
  });

  const canSubmit =
    !!selectedParent && hasTargets(targets) && !createMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        parent
          ? sprintf(__("Add an override of “%s”", "yatra"), parent.name)
          : __("Add an override", "yatra")
      }
      description={__(
        "Same event, same merge tags, your own wording. Bookings on the trips you pick get this override; every other booking keeps the global template.",
        "yatra",
      )}
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button type="button" variant="outline" onClick={onClose}>
            {__("Cancel", "yatra")}
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => createMutation.mutate()}
            data-testid="override-create-submit"
          >
            {createMutation.isPending
              ? __("Creating…", "yatra")
              : __("Create & edit →", "yatra")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4" data-testid="override-create-modal">
        {!parent && (
          <div>
            <Label className="text-sm font-medium">
              {__("Override which global template?", "yatra")}
            </Label>
            <div className="mt-1" data-testid="override-parent">
              <SearchableSelect
                value={parentId}
                onChange={(value) => setParentId(value)}
                options={globals.map((g) => ({
                  value: String(g.id),
                  label: `${g.name} · ${g.event_key}`,
                }))}
                placeholder={__("Pick a global template…", "yatra")}
                searchPlaceholder={__("Search templates…", "yatra")}
              />
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium">
            {__("Use this override for", "yatra")}
          </Label>
          <MultiSelect
            value={encodeTargets(targets)}
            onChange={(vals) => setTargets(decodeTargets(vals))}
            options={options}
            placeholder={__("Search trips, categories, trip types…", "yatra")}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            {__(
              "Trips, whole categories (sub-categories included) or a trip type. You can change this later.",
              "yatra",
            )}
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium">{__("Name", "yatra")}</Label>
          <Input
            value={nameTouched ? name : suggestedName}
            onChange={(e) => {
              setNameTouched(true);
              setName(e.target.value);
            }}
            placeholder={
              selectedParent
                ? `${selectedParent.name} — …`
                : __("Name", "yatra")
            }
            className="mt-1"
            data-testid="override-name"
          />
          <p className="text-xs text-gray-500 mt-1">
            {__(
              "Suggested from what you picked; shown in the list and in Email logs.",
              "yatra",
            )}
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium">
            {__("Start from", "yatra")}
          </Label>
          <div className="mt-1 space-y-2">
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${copy ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700"}`}
            >
              <input
                type="radio"
                name="override-start"
                checked={copy}
                onChange={() => setCopy(true)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium">
                  {__("A copy of the global template", "yatra")}
                </span>
                <span className="block text-xs text-gray-500">
                  {__(
                    "Recommended — edit only the parts that differ.",
                    "yatra",
                  )}
                </span>
              </span>
            </label>
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${!copy ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700"}`}
            >
              <input
                type="radio"
                name="override-start"
                checked={!copy}
                onChange={() => setCopy(false)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium">
                  {__("A blank template", "yatra")}
                </span>
                <span className="block text-xs text-gray-500">
                  {__(
                    "Start from scratch with the same merge tags. It stays unused until it has a body.",
                    "yatra",
                  )}
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmailOverrideCreateModal;
