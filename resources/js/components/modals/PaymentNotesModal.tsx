/**
 * Payment note history.
 *
 * The payments table has always had one editable Notes field, so recording why
 * a refund was issued overwrote whatever was there before, and nothing recorded
 * when a note was written or by whom. This shows the history instead: existing
 * entries stay visible as new ones are added, each with its time and author.
 *
 * The note stored in the old single field still appears, first and marked as
 * earlier, because that column carries no author or timestamp of its own.
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StickyNote, User, Clock } from "lucide-react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { __ } from "../../lib/i18n";
import { apiService } from "../../lib/api-client";
import { useToast } from "../ui/toast";
import { formatDateTime } from "../../lib/dateFormat";

export interface PaymentNote {
  id: number;
  note: string;
  author_id: number | null;
  author_name: string;
  created_at: string;
  legacy: boolean;
}

interface PaymentNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: number | null;
  paymentReference?: string;
  /** Hide the composer for roles that may read but not record. */
  canAdd?: boolean;
}

export const PaymentNotesModal: React.FC<PaymentNotesModalProps> = ({
  isOpen,
  onClose,
  paymentId,
  paymentReference,
  canAdd = true,
}) => {
  const [draft, setDraft] = useState("");
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaymentNote[]>({
    queryKey: ["payment-notes", paymentId],
    enabled: isOpen && !!paymentId,
    queryFn: async () => {
      const response = await apiService.getPaymentNotes(paymentId as number);
      const rows = response?.data ?? response;
      return Array.isArray(rows) ? (rows as PaymentNote[]) : [];
    },
  });

  const notes = data ?? [];

  const addNote = useMutation({
    mutationFn: async (note: string) =>
      apiService.addPaymentNote(paymentId as number, note),
    onSuccess: (response: any) => {
      if (response && response.success === false) {
        showToast(
          response.message || __("Failed to save the note.", "yatra"),
          "error",
        );
        return;
      }
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["payment-notes", paymentId] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      showToast(__("Note added.", "yatra"), "success");
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to save the note.", "yatra"),
        "error",
      );
    },
  });

  const handleSubmit = () => {
    const note = draft.trim();
    if (!note) {
      showToast(__("Please write a note before saving.", "yatra"), "error");
      return;
    }
    addNote.mutate(note);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <StickyNote className="w-5 h-5" />
          {__("Payment Notes", "yatra")}
          {paymentReference ? (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {paymentReference}
            </span>
          ) : null}
        </span>
      }
      description={__(
        "Everything recorded against this payment, oldest first. Adding a note never changes the ones already here.",
        "yatra",
      )}
    >
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {__("Loading notes…", "yatra")}
          </p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {__("No notes recorded against this payment yet.", "yatra")}
          </p>
        ) : (
          <ol className="space-y-3">
            {notes.map((note, index) => (
              <li
                key={`${note.id}-${index}`}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800"
              >
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {note.note}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {note.author_name || __("Unknown", "yatra")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(note.created_at)}
                  </span>
                  {note.legacy ? (
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                      {__(
                        "Recorded before notes were kept as a history",
                        "yatra",
                      )}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}

        {canAdd ? (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <label
              htmlFor="yatra-payment-note"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              {__("Add a note", "yatra")}
            </label>
            <textarea
              id="yatra-payment-note"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder={__(
                "e.g. why a refund was issued, or how a manual payment arrived",
                "yatra",
              )}
            />
            <div className="mt-2 flex justify-end">
              <Button onClick={handleSubmit} disabled={addNote.isPending}>
                {addNote.isPending
                  ? __("Saving…", "yatra")
                  : __("Add Note", "yatra")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};

export default PaymentNotesModal;
