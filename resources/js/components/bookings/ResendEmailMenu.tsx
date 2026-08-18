import React from "react";
import { useMutation } from "@tanstack/react-query";
import { ChevronDown, Mail } from "lucide-react";
import { apiClient } from "../../lib/api-client";
import { useToast } from "../ui/toast";
import { Button } from "../ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { __ } from "../../lib/i18n";

interface ResendEmailMenuProps {
  bookingId: number;
  /** Booking status (e.g. "cancelled", "completed") used to gate items. */
  status?: string;
  /** Amount already paid — payment emails only show when > 0. */
  amountPaid?: number;
}

type EmailItem = {
  type: string;
  label: string;
  group: "customer" | "admin";
  /** Only show when the booking has a recorded payment. */
  needsPayment?: boolean;
  /** Only show for these booking statuses. */
  statuses?: string[];
};

const EMAIL_ITEMS: EmailItem[] = [
  { type: "confirmation", label: __("Booking confirmation", "yatra"), group: "customer" },
  {
    type: "payment_confirmation",
    label: __("Payment confirmation", "yatra"),
    group: "customer",
    needsPayment: true,
  },
  { type: "reminder", label: __("Trip reminder", "yatra"), group: "customer" },
  {
    type: "cancellation",
    label: __("Cancellation notice", "yatra"),
    group: "customer",
    statuses: ["cancelled"],
  },
  {
    type: "completed",
    label: __("Trip completed / thank-you", "yatra"),
    group: "customer",
    statuses: ["completed"],
  },
  { type: "admin_new_booking", label: __("New booking", "yatra"), group: "admin" },
  {
    type: "admin_payment_received",
    label: __("Payment received", "yatra"),
    group: "admin",
    needsPayment: true,
  },
];

/**
 * "Resend Email" menu for a booking. Lets an administrator manually re-send any
 * of the booking/payment transactional emails after manual changes or a failed
 * automated send. Items are contextual to the booking's state.
 */
export const ResendEmailMenu: React.FC<ResendEmailMenuProps> = ({
  bookingId,
  status = "",
  amountPaid = 0,
}) => {
  const { showToast } = useToast();
  const [open, setOpen] = React.useState(false);

  const mutation = useMutation({
    mutationFn: async (type: string) => {
      const res: any = await apiClient.post(`/bookings/${bookingId}/send-email`, {
        type,
      });
      // The endpoint returns { success, message }. Treat success:false as an error.
      if (res && res.success === false) {
        throw new Error(res.message || __("Failed to send email.", "yatra"));
      }
      return res;
    },
    onSuccess: (res: any) => {
      showToast(res?.message || __("Email sent.", "yatra"), "success");
      setOpen(false);
    },
    onError: (err: any) => {
      showToast(err?.message || __("Failed to send email.", "yatra"), "error");
    },
  });

  const paid = Number(amountPaid || 0) > 0;
  const items = EMAIL_ITEMS.filter((item) => {
    if (item.needsPayment && !paid) return false;
    if (item.statuses && !item.statuses.includes(status)) return false;
    return true;
  });

  const customerItems = items.filter((i) => i.group === "customer");
  const adminItems = items.filter((i) => i.group === "admin");

  const renderItem = (item: EmailItem) => (
    <button
      key={item.type}
      type="button"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(item.type)}
      className="w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {item.label}
    </button>
  );

  const groupLabel = (text: string) => (
    <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
      {text}
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          {__("Resend Email", "yatra")}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1">
        {customerItems.length > 0 && (
          <>
            {groupLabel(__("To customer", "yatra"))}
            {customerItems.map(renderItem)}
          </>
        )}
        {adminItems.length > 0 && (
          <>
            {groupLabel(__("To admin", "yatra"))}
            {adminItems.map(renderItem)}
          </>
        )}
        {mutation.isPending && (
          <div className="px-3 py-2 text-xs text-gray-400">
            {__("Sending…", "yatra")}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ResendEmailMenu;
