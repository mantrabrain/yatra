/**
 * Booking workspace (3.2): the actions an operator takes on one booking —
 * record a payment, record a refund, change the price — and the booking's
 * history with internal notes. Server: /bookings/{id}/activity, /notes,
 * /adjustments, /payments, /payments/{id}/refund.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  CircleDollarSign,
  Clock,
  Edit3,
  Inbox,
  Link2,
  Mail,
  MessageSquare,
  Percent,
  Plus,
  RefreshCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { apiClient } from "../../lib/api-client";
import { __, sprintf } from "../../lib/i18n";
import { formatYatraMoney } from "../../lib/currency-display";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Modal } from "../ui/modal";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "../ui/toast";
import { ConditionalRender } from "../ui/conditional-render";

type TimelineEvent = {
  id: string;
  type: string;
  message: string;
  author: string;
  at: string;
  meta: Record<string, unknown>;
};

const money = (n: number, currency?: string) =>
  formatYatraMoney(Number(n) || 0, currency || "USD", { zeroAsUnknown: false });

const errorMessage = (e: any, fallback: string) =>
  e?.response?.data?.message || e?.message || fallback;

/** Refresh everything on the booking screen that money actions change. */
const useRefresh = (bookingId: number) => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["booking", String(bookingId)] });
    qc.invalidateQueries({ queryKey: ["booking", bookingId] });
    qc.invalidateQueries({ queryKey: ["booking-activity", bookingId] });
    qc.invalidateQueries({ queryKey: ["bookings"] });
  };
};

// ---------------------------------------------------------------------------
// Record payment
// ---------------------------------------------------------------------------

const METHODS: { value: string; label: () => string }[] = [
  { value: "bank_transfer", label: () => __("Bank transfer", "yatra") },
  { value: "cash", label: () => __("Cash", "yatra") },
  { value: "card_terminal", label: () => __("Card (terminal)", "yatra") },
  { value: "cheque", label: () => __("Cheque", "yatra") },
  { value: "other", label: () => __("Other", "yatra") },
];

export const RecordPaymentButton: React.FC<{
  bookingId: number;
  amountDue: number;
  currency?: string;
}> = ({ bookingId, amountDue, currency }) => {
  const { showToast } = useToast();
  const refresh = useRefresh(bookingId);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const start = () => {
    setAmount(amountDue > 0 ? amountDue.toFixed(2) : "");
    setMethod("bank_transfer");
    setReference("");
    setNote("");
    setOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async () =>
      apiClient.post(`/bookings/${bookingId}/payments`, {
        amount: Number(amount),
        status: "completed",
        gateway: method,
        payment_method: method,
        transaction_id: reference.trim() || undefined,
        notes: note.trim() || undefined,
      }),
    onSuccess: () => {
      showToast(__("Payment recorded.", "yatra"), "success");
      setOpen(false);
      refresh();
    },
    onError: (e: any) =>
      showToast(errorMessage(e, __("The payment could not be recorded.", "yatra")), "error"),
  });

  // The server refuses more than the balance due; say so before submitting.
  const overDue = Number(amount) > Math.max(0, amountDue) + 0.009;
  const valid = Number(amount) > 0 && !overDue;

  return (
    <>
      <Button variant="outline" onClick={start} className="flex items-center gap-2" data-testid="record-payment">
        <CircleDollarSign className="w-4 h-4" />
        {__("Record payment", "yatra")}
      </Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        size="sm"
        title={__("Record a payment", "yatra")}
        description={__(
          "Money you received outside online checkout — a bank transfer, cash at the office, a card terminal. The booking's balance and payment status update straight away, and the customer gets the payment receipt email if it is switched on.",
          "yatra",
        )}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {__("Cancel", "yatra")}
            </Button>
            <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()} data-testid="record-payment-submit">
              {mutation.isPending ? __("Saving…", "yatra") : __("Record payment", "yatra")}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <Label>{sprintf(__("Amount (%s)", "yatra"), currency || "")}</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="record-payment-amount" />
            <p className={`text-xs mt-1 ${overDue ? "text-red-600" : "text-gray-500"}`} data-testid="record-payment-hint">
              {overDue
                ? sprintf(
                    __("More than the balance due (%s). Use Adjust price first if the customer owes more.", "yatra"),
                    money(Math.max(0, amountDue), currency),
                  )
                : sprintf(__("Balance due: %s", "yatra"), money(amountDue, currency))}
            </p>
          </div>
          <div>
            <Label>{__("Paid by", "yatra")}</Label>
            <select
              className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>{__("Reference (optional)", "yatra")}</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder={__("e.g. bank reference or receipt number", "yatra")} />
          </div>
          <div>
            <Label>{__("Note (optional)", "yatra")}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------
// Payment link
// ---------------------------------------------------------------------------

interface PaymentLinkRow {
  id: string;
  amount: number;
  note: string;
  status: "open" | "paid" | "cancelled" | "expired";
  created_at: string;
  expires_at: string;
  paid_at: string;
}

/**
 * Ask the customer to pay part (or all) of the balance: a link to Yatra's
 * balance checkout for that amount, copied or emailed.
 */
export const PaymentLinkButton: React.FC<{
  bookingId: number;
  amountDue: number;
  currency?: string;
}> = ({ bookingId, amountDue, currency }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [created, setCreated] = useState<string>("");

  const links = useQuery({
    queryKey: ["booking-payment-links", bookingId],
    queryFn: async () => {
      const res: any = await apiClient.get(`/bookings/${bookingId}/payment-links`);
      return {
        rows: (res?.data || []) as PaymentLinkRow[],
        // Older Free builds don't send it: assume payable.
        canPayOnline: res?.can_pay_online !== false,
      };
    },
    enabled: open,
  });
  const rows = links.data?.rows || [];
  const canPayOnline = links.data ? links.data.canPayOnline : true;
  // Open links already ask for part of the balance; together they may not exceed it.
  const requested = rows.filter((l) => l.status === "open").reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const requestable = Math.max(0, Math.max(0, amountDue) - requested);
  // Suggest what is still unrequested once the open links are known.
  useEffect(() => {
    if (open && links.data && !created && requested > 0 && amount === (amountDue > 0 ? amountDue.toFixed(2) : "")) {
      setAmount(requestable > 0 ? requestable.toFixed(2) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, links.data]);

  const start = () => {
    setAmount(amountDue > 0 ? amountDue.toFixed(2) : "");
    setNote("");
    setSendEmail(true);
    setCreated("");
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () =>
      apiClient.post(`/bookings/${bookingId}/payment-links`, {
        amount: Number(amount),
        note: note.trim(),
        send_email: sendEmail,
      }),
    onSuccess: (res: any) => {
      setCreated(String(res?.url || ""));
      showToast(sendEmail ? __("Payment link created and emailed.", "yatra") : __("Payment link created.", "yatra"), "success");
      queryClient.invalidateQueries({ queryKey: ["booking-payment-links", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking-activity", bookingId] });
    },
    onError: (e: any) => showToast(errorMessage(e, __("The payment link could not be created.", "yatra")), "error"),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/bookings/${bookingId}/payment-links/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-payment-links", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking-activity", bookingId] });
    },
    onError: (e: any) => showToast(errorMessage(e, __("The link could not be cancelled.", "yatra")), "error"),
  });

  const n = Number(amount);
  const over = n > requestable + 0.009;
  const valid = n > 0 && !over && canPayOnline;
  const statusLabel = (s: PaymentLinkRow["status"]) =>
    s === "paid"
      ? __("Paid", "yatra")
      : s === "cancelled"
        ? __("Cancelled", "yatra")
        : s === "expired"
          ? __("Expired", "yatra")
          : __("Waiting for payment", "yatra");

  return (
    <>
      <Button
        variant="outline"
        onClick={start}
        className="flex items-center gap-2"
        disabled={amountDue <= 0}
        data-testid="payment-link"
      >
        <Link2 className="w-4 h-4" />
        {__("Payment link", "yatra")}
      </Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        size="sm"
        title={__("Request a payment", "yatra")}
        description={__(
          "A link the customer opens to pay this amount by card or PayPal — part of the balance or all of it. It works once and expires after 14 days.",
          "yatra",
        )}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {__("Close", "yatra")}
            </Button>
            <Button disabled={!valid || create.isPending} onClick={() => create.mutate()} data-testid="payment-link-create">
              {create.isPending ? __("Creating…", "yatra") : __("Create link", "yatra")}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor={`payment-link-amount-${bookingId}`}>{__("Amount", "yatra")}</Label>
            <Input
              id={`payment-link-amount-${bookingId}`}
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-testid="payment-link-amount"
            />
            <p className={`text-xs mt-1 ${over ? "text-red-600" : "text-gray-500"}`}>
              {over
                ? requested > 0
                  ? sprintf(
                      __("Open links already ask for %1$s. You can ask for at most %2$s more.", "yatra"),
                      money(requested, currency),
                      money(requestable, currency),
                    )
                  : sprintf(__("More than the balance due (%s).", "yatra"), money(Math.max(0, amountDue), currency))
                : requested > 0
                  ? sprintf(
                      __("Balance due: %1$s · already requested by open links: %2$s", "yatra"),
                      money(amountDue, currency),
                      money(requested, currency),
                    )
                  : sprintf(__("Balance due: %s", "yatra"), money(amountDue, currency))}
            </p>
          </div>
          {!canPayOnline && (
            <p
              className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
              role="alert"
              data-testid="payment-link-no-gateway"
            >
              {__(
                "No online payment method is turned on, so the customer could not pay a link. Turn on a card or PayPal payment method in Settings → Payments first.",
                "yatra",
              )}
            </p>
          )}
          <div>
            <Label htmlFor={`payment-link-note-${bookingId}`}>{__("Message to the customer (optional)", "yatra")}</Label>
            <Input id={`payment-link-note-${bookingId}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder={__("e.g. Second instalment", "yatra")} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
            {__("Email the link to the customer", "yatra")}
          </label>
          {created && (
            <div className="rounded-md border border-green-200 bg-green-50 p-2 text-xs dark:border-green-800 dark:bg-green-900/20">
              <div className="font-medium text-green-800 dark:text-green-300 mb-1">{__("Link created", "yatra")}</div>
              <div className="flex gap-2 items-center">
                <code className="flex-1 break-all" data-testid="payment-link-url">{created}</code>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(created);
                      showToast(__("Copied.", "yatra"), "success");
                    } catch {
                      showToast(__("Couldn't copy — copy manually.", "yatra"), "error");
                    }
                  }}
                >
                  {__("Copy", "yatra")}
                </Button>
              </div>
            </div>
          )}
          {rows.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{__("Links for this booking", "yatra")}</div>
              <ul className="space-y-1" data-testid="payment-link-list">
                {rows.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {money(l.amount, currency)} · <span className="text-gray-500">{statusLabel(l.status)}</span>
                    </span>
                    {l.status === "open" && (
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => cancel.mutate(l.id)}
                      >
                        {__("Cancel", "yatra")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------
// Price adjustment
// ---------------------------------------------------------------------------

export const AdjustPriceButton: React.FC<{
  bookingId: number;
  total: number;
  currency?: string;
}> = ({ bookingId, total, currency }) => {
  const { showToast } = useToast();
  const refresh = useRefresh(bookingId);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"discount" | "surcharge">("discount");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res: any = await apiClient.post(`/bookings/${bookingId}/adjustments`, {
        kind,
        amount: Number(amount),
        reason: reason.trim(),
      });
      if (res && res.success === false) throw new Error(res.message);
      return res;
    },
    onSuccess: (res: any) => {
      showToast(res?.message || __("Price updated.", "yatra"), "success");
      setOpen(false);
      setAmount("");
      setReason("");
      refresh();
    },
    onError: (e: any) => showToast(errorMessage(e, __("The price could not be changed.", "yatra")), "error"),
  });

  const n = Number(amount);
  const newTotal = kind === "discount" ? total - n : total + n;
  const valid = n > 0 && reason.trim() !== "" && (kind === "surcharge" || n <= total);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="flex items-center gap-2" data-testid="adjust-price">
        <Percent className="w-4 h-4" />
        {__("Adjust price", "yatra")}
      </Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        size="sm"
        title={__("Adjust the price", "yatra")}
        description={__(
          "Give a discount or add a surcharge after the booking was made. The total, balance due and payment status update, and the change is kept in the booking history with your reason.",
          "yatra",
        )}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {__("Cancel", "yatra")}
            </Button>
            <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()} data-testid="adjust-price-submit">
              {mutation.isPending ? __("Saving…", "yatra") : __("Apply", "yatra")}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["discount", "surcharge"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${kind === k ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : "border-gray-200 dark:border-gray-700"}`}
              >
                {k === "discount" ? __("Discount", "yatra") : __("Surcharge", "yatra")}
              </button>
            ))}
          </div>
          <div>
            <Label>{sprintf(__("Amount (%s)", "yatra"), currency || "")}</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="adjust-price-amount" />
            {n > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {sprintf(__("New total: %1$s (was %2$s)", "yatra"), money(newTotal, currency), money(total, currency))}
              </p>
            )}
          </div>
          <div>
            <Label>{__("Reason", "yatra")}</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={__("e.g. Repeat customer, single room", "yatra")} data-testid="adjust-price-reason" />
          </div>
        </div>
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------
// Refund
// ---------------------------------------------------------------------------

export const RefundPaymentButton: React.FC<{
  bookingId: number;
  paymentId: number;
  maxAmount: number;
  currency?: string;
  /** The payment's gateway can send the money back (Yatra 3.2+). */
  gatewayRefundAvailable?: boolean;
  gatewayLabel?: string;
}> = ({ bookingId, paymentId, maxAmount, currency, gatewayRefundAvailable, gatewayLabel }) => {
  const { showToast } = useToast();
  const refresh = useRefresh(bookingId);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [throughGateway, setThroughGateway] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res: any = await apiClient.post(`/payments/${paymentId}/refund`, {
        amount: Number(amount),
        reason: reason.trim(),
        through_gateway: Boolean(gatewayRefundAvailable && throughGateway),
      });
      if (res && res.success === false) throw new Error(res.message);
      return res;
    },
    onSuccess: (res: any) => {
      showToast(
        res?.message ||
          (res?.through_gateway
            ? __("Refund sent to the customer and recorded.", "yatra")
            : __("Refund recorded.", "yatra")),
        res?.pending ? "warning" : "success",
      );
      setOpen(false);
      refresh();
    },
    onError: (e: any) => showToast(errorMessage(e, __("The refund could not be recorded.", "yatra")), "error"),
  });

  const n = Number(amount);
  const valid = n > 0 && n <= maxAmount;

  return (
    <ConditionalRender capability="yatra_refund_bookings">
      <button
        type="button"
        className="text-xs text-red-600 hover:underline dark:text-red-400"
        onClick={() => {
          setAmount(maxAmount.toFixed(2));
          setReason("");
          // Unticked by default: the button used to only record a refund,
          // and an operator recording one made in the provider's dashboard
          // must never send the money a second time by accident.
          setThroughGateway(false);
          setOpen(true);
        }}
        data-testid={`refund-payment-${paymentId}`}
      >
        {__("Refund", "yatra")}
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        size="sm"
        title={__("Refund", "yatra")}
        description={
          gatewayRefundAvailable && throughGateway
            ? sprintf(
                __(
                  "Sends the money back to the customer through %s, then records the refund in the booking's ledger. The original payment is kept.",
                  "yatra",
                ),
                gatewayLabel || __("the payment provider", "yatra"),
              )
            : __(
                "Records money you sent back to the customer. Send the money itself from your payment provider or bank — Yatra keeps the original payment and adds the refund to the booking's ledger.",
                "yatra",
              )
        }
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {__("Cancel", "yatra")}
            </Button>
            <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()} data-testid="refund-submit">
              {mutation.isPending
                ? __("Saving…", "yatra")
                : gatewayRefundAvailable && throughGateway
                  ? __("Refund now", "yatra")
                  : __("Record refund", "yatra")}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <Label>{sprintf(__("Amount (%s)", "yatra"), currency || "")}</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="refund-amount" />
            <p className="text-xs text-gray-500 mt-1">
              {sprintf(__("Up to %s", "yatra"), money(maxAmount, currency))}
            </p>
          </div>
          <div>
            <Label>{__("Reason", "yatra")}</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} data-testid="refund-reason" />
          </div>
          {gatewayRefundAvailable && (
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={throughGateway}
                onChange={(e) => setThroughGateway(e.target.checked)}
                data-testid="refund-through-gateway"
              />
              <span>
                {sprintf(
                  __("Send the money back through %s", "yatra"),
                  gatewayLabel || __("the payment provider", "yatra"),
                )}
                <span className="block text-xs text-gray-500">
                  {__("Untick if you already refunded it yourself and only want to record it.", "yatra")}
                </span>
              </span>
            </label>
          )}
        </div>
      </Modal>
    </ConditionalRender>
  );
};

// ---------------------------------------------------------------------------
// History + notes
// ---------------------------------------------------------------------------

const ICONS: Record<string, React.ReactNode> = {
  created: <Sparkles className="w-3.5 h-3.5" />,
  payment: <CircleDollarSign className="w-3.5 h-3.5" />,
  refund: <ArrowDownLeft className="w-3.5 h-3.5" />,
  status_changed: <RefreshCcw className="w-3.5 h-3.5" />,
  email_sent: <Mail className="w-3.5 h-3.5" />,
  note: <MessageSquare className="w-3.5 h-3.5" />,
  price_adjusted: <Percent className="w-3.5 h-3.5" />,
  edited: <Edit3 className="w-3.5 h-3.5" />,
  expired: <XCircle className="w-3.5 h-3.5" />,
  customer_request: <Inbox className="w-3.5 h-3.5" />,
};

const COLORS: Record<string, string> = {
  payment: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  refund: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  note: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  customer_request: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

// ---------------------------------------------------------------------------
// Change / cancellation requests sent by the customer from their account
// ---------------------------------------------------------------------------

export interface CustomerRequest {
  id: string;
  type: "cancel" | "change";
  message: string;
  status: "open" | "resolved";
  created_at: string;
}

export const CustomerRequestsCard: React.FC<{
  bookingId: number;
  requests: CustomerRequest[];
}> = ({ bookingId, requests }) => {
  const { showToast } = useToast();
  const refresh = useRefresh(bookingId);
  const open = (requests || []).filter((r) => r.status === "open");

  const resolve = useMutation({
    mutationFn: async (requestId: string) => {
      const res: any = await apiClient.post(
        `/bookings/${bookingId}/requests/${requestId}/resolve`,
        {},
      );
      if (res && res.success === false) throw new Error(res.message);
      return res;
    },
    onSuccess: (res: any) => {
      showToast(res?.message || __("Request marked as resolved.", "yatra"), "success");
      refresh();
    },
    onError: (e: any) =>
      showToast(errorMessage(e, __("The request could not be updated.", "yatra")), "error"),
  });

  if (open.length === 0) return null;

  return (
    <Card
      className="border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/10"
      data-testid="customer-requests-card"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Inbox className="w-4 h-4" />
          {__("Customer requests", "yatra")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {open.map((r) => (
          <div
            key={r.id}
            className="rounded-md border border-blue-100 dark:border-blue-900 bg-white dark:bg-gray-800 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {r.type === "cancel"
                    ? __("Cancellation requested", "yatra")
                    : __("Change requested", "yatra")}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{r.created_at}</div>
              </div>
              <ConditionalRender capability="yatra_edit_bookings">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={resolve.isPending}
                  onClick={() => resolve.mutate(r.id)}
                  data-testid={`resolve-request-${r.id}`}
                >
                  {__("Mark as resolved", "yatra")}
                </Button>
              </ConditionalRender>
            </div>
            <p className="mt-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
              {r.message}
            </p>
          </div>
        ))}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {__(
            "Nothing has been changed yet. Cancel, refund or edit the booking as your policy allows, reply to the customer, then mark the request as resolved.",
            "yatra",
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export const BookingActivityCard: React.FC<{ bookingId: number }> = ({ bookingId }) => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["booking-activity", bookingId],
    queryFn: async () => {
      const res: any = await apiClient.get(`/bookings/${bookingId}/activity`);
      return (res?.data ?? []) as TimelineEvent[];
    },
    enabled: bookingId > 0,
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const res: any = await apiClient.post(`/bookings/${bookingId}/notes`, { note: note.trim() });
      if (res && res.success === false) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      setNote("");
      qc.invalidateQueries({ queryKey: ["booking-activity", bookingId] });
    },
    onError: (e: any) => showToast(errorMessage(e, __("The note could not be saved.", "yatra")), "error"),
  });

  const events = useMemo(() => data ?? [], [data]);
  const shown = useMemo(() => (showAll ? events : events.slice(0, 8)), [events, showAll]);

  return (
    <Card data-testid="booking-activity-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {__("History & notes", "yatra")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ConditionalRender capability="yatra_edit_bookings">
          <div className="flex gap-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={__("Add an internal note — only your team sees it", "yatra")}
              className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              data-testid="booking-note-input"
            />
            <Button
              size="sm"
              disabled={note.trim() === "" || addNote.isPending}
              onClick={() => addNote.mutate()}
              className="self-start flex items-center gap-1"
              data-testid="booking-note-add"
            >
              <Plus className="w-4 h-4" />
              {__("Add", "yatra")}
            </Button>
          </div>
        </ConditionalRender>
        {isLoading ? (
          <div className="text-sm text-gray-500">{__("Loading…", "yatra")}</div>
        ) : (
          <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2 space-y-3">
            {shown.map((e) => (
              <li key={e.id} className="ml-4" data-testid={`activity-${e.type}`}>
                <span
                  className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ${COLORS[e.type] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
                >
                  {ICONS[e.type] || <Clock className="w-3.5 h-3.5" />}
                </span>
                <div className={`text-sm ${e.type === "note" ? "rounded-md bg-amber-50 dark:bg-amber-900/10 px-2 py-1" : ""} text-gray-900 dark:text-white whitespace-pre-line`}>
                  {e.message}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {e.at}
                  {e.author ? ` · ${e.author}` : ""}
                </div>
              </li>
            ))}
          </ol>
        )}
        {events.length > 8 && (
          <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => setShowAll(!showAll)}>
            {showAll ? __("Show less", "yatra") : sprintf(__("Show all %d entries", "yatra"), events.length)}
          </button>
        )}
      </CardContent>
    </Card>
  );
};
