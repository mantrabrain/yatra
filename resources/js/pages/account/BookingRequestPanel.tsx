/**
 * "Need to change or cancel?" on the customer's booking page.
 *
 * Sends a request to the operator (POST /customers/my-bookings/{id}/requests).
 * Nothing about the booking changes until the operator acts on it, which the
 * copy says plainly so customers don't assume an instant cancellation/refund.
 */
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Inbox, CheckCircle2 } from "lucide-react";
import { __ } from "../../lib/i18n";
import { apiClient } from "../../lib/api-client";
import { API_ENDPOINTS } from "../../lib/api-endpoints";
import { formatDate } from "./utils";

export interface CustomerBookingRequest {
  id: string;
  type: "cancel" | "change";
  type_label: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
}

interface Props {
  bookingId: number;
  requests: CustomerBookingRequest[];
  canRequest: boolean;
  unavailableReason: string;
  enabled: boolean;
}

const BookingRequestPanel: React.FC<Props> = ({
  bookingId,
  requests,
  canRequest,
  unavailableReason,
  enabled,
}) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"change" | "cancel">("change");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const send = useMutation({
    mutationFn: async () => {
      const res: any = await apiClient.post(
        `${API_ENDPOINTS.CUSTOMER_MY_BOOKING(bookingId)}/requests`,
        { type, message: message.trim() },
      );
      if (res && res.success === false) throw new Error(res.message);
      return res;
    },
    onSuccess: (res: any) => {
      setFeedback({ ok: true, text: res?.message || __("Your request has been sent.", "yatra") });
      setOpen(false);
      setMessage("");
      qc.invalidateQueries({ queryKey: ["booking-details"] }); // prefix: the list keys it by the id as it came in (number or string)
    },
    onError: (e: any) =>
      setFeedback({
        ok: false,
        text:
          e?.response?.data?.message ||
          e?.message ||
          __("Your request could not be sent. Please try again or contact us.", "yatra"),
      }),
  });

  const list = Array.isArray(requests) ? requests : [];
  // The operator switched requests off and none were sent before: say nothing.
  if (!enabled && list.length === 0) return null;
  const hasOpen = (t: string) => list.some((r) => r.status === "open" && r.type === t);

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6"
      data-testid="booking-request-panel"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <Inbox className="w-5 h-5" />
        {__("Need to change or cancel?", "yatra")}
      </h3>

      {list.length > 0 && (
        <ul className="mb-4 space-y-2 list-none p-0 m-0">
          {list.map((r) => (
            <li
              key={r.id}
              className="list-none m-0 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm"
              data-testid={`my-request-${r.type}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-900 dark:text-white">{r.type_label}</span>
                <span
                  className={`shrink-0 whitespace-nowrap text-xs rounded-full px-2 py-0.5 ${
                    r.status === "open"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  }`}
                >
                  {r.status === "open" ? __("Waiting for reply", "yatra") : __("Resolved", "yatra")}
                </span>
              </div>
              <p className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-line">{r.message}</p>
              <p className="mt-1 text-xs text-gray-400">{formatDate(r.created_at)}</p>
            </li>
          ))}
        </ul>
      )}

      {feedback && (
        <div
          role="status"
          className={`mb-3 rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${
            feedback.ok
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
          }`}
          data-testid="booking-request-feedback"
        >
          {feedback.ok && <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
          {feedback.text}
        </div>
      )}

      {!canRequest ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">{unavailableReason}</p>
      ) : hasOpen("change") && hasOpen("cancel") ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {__("We have your requests and will reply by email.", "yatra")}
        </p>
      ) : !open ? (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {__(
              "Send us a request and we'll get back to you. Your booking stays as it is until we confirm.",
              "yatra",
            )}
          </p>
          {/* A div, like the other account actions: themes restyle <button>. */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              setFeedback(null);
              if (hasOpen(type)) setType(type === "change" ? "cancel" : "change");
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setFeedback(null);
                if (hasOpen(type)) setType(type === "change" ? "cancel" : "change");
                setOpen(true);
              }
            }}
            className="yatra-booking-action inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer"
            data-testid="booking-request-open"
          >
            {/* One request of each kind at a time: once a change request is
                waiting, only a cancellation can still be asked (and back). */}
            {hasOpen("change")
              ? __("Request a cancellation", "yatra")
              : hasOpen("cancel")
                ? __("Request a change", "yatra")
                : __("Request a change or cancellation", "yatra")}
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
          className="space-y-3"
        >
          <fieldset className="flex flex-wrap gap-4 text-sm">
            <legend className="sr-only">{__("What would you like to do?", "yatra")}</legend>
            {(["change", "cancel"] as const).map((t) => (
              <label key={t} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="yatra-request-type"
                  value={t}
                  checked={type === t}
                  disabled={hasOpen(t)}
                  onChange={() => setType(t)}
                  data-testid={`booking-request-type-${t}`}
                />
                {t === "change"
                  ? __("Change my booking", "yatra")
                  : __("Cancel my booking", "yatra")}
              </label>
            ))}
          </fieldset>
          <label className="block text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              {type === "cancel"
                ? __("Why are you cancelling?", "yatra")
                : __("What would you like to change?", "yatra")}
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              data-testid="booking-request-message"
            />
          </label>
          {type === "cancel" && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {__(
                "Any refund follows the cancellation policy of your trip. We'll confirm the cancellation and any refund by email.",
                "yatra",
              )}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={send.isPending || message.trim() === "" || hasOpen(type)}
              className="yatra-booking-action inline-flex items-center px-4 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium disabled:opacity-50"
              data-testid="booking-request-submit"
            >
              {send.isPending ? __("Sending…", "yatra") : __("Send request", "yatra")}
            </button>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(false);
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

export default BookingRequestPanel;
