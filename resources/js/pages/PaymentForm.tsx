/**
 * Payment Form Page
 * Add/Edit Payment form
 */

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Info } from "lucide-react";
import { __ } from "../lib/i18n";
import { apiService } from "../lib/api-client";
import { usePermissions } from "../hooks/usePermissions";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { DatePicker } from "../components/ui/date-picker";
import { PageHeader } from "../components/common/PageHeader";
import { BookingPicker } from "../components/common/BookingPicker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";
import { HelpText } from "../components/ui/help-text";
import { Alert } from "../components/ui/alert";

interface PaymentFormData {
  booking_id: string;
  amount: string;
  payment_method: string;
  payment_status: "pending" | "completed" | "failed" | "refunded" | "partial";
  payment_date: string;
  transaction_id: string;
  notes: string;
}

const PaymentForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [formData, setFormData] = useState<PaymentFormData>({
    booking_id: "",
    amount: "",
    payment_method: "Credit Card",
    payment_status: "pending",
    payment_date: new Date().toISOString().split("T")[0],
    transaction_id: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") || "create";
  }, []);

  const paymentId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);

  const isEditMode = action === "edit" && paymentId !== null;

  // Fetch payment data if editing
  const { data: paymentData, isLoading: isLoadingPayment } = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => {
      if (!paymentId) return null;

      const result = await apiService.getPayment(paymentId);

      if (!result) {
        throw new Error("Failed to fetch payment");
      }

      if (!result.success) {
        throw new Error(result.message || "Payment not found");
      }

      const data = result.data;
      const processedAt = data.processed_at;
      const processedDate =
        typeof processedAt === "string" && processedAt.includes(" ")
          ? processedAt.split(" ")[0]
          : new Date().toISOString().split("T")[0];
      return {
        id: data.id,
        booking_id: data.booking_id,
        amount: data.amount,
        payment_method: data.gateway,
        payment_status: data.status,
        payment_date: processedDate,
        transaction_id: data.transaction_id ?? "",
        notes: data.notes ?? "",
      };
    },
    enabled: isEditMode && can("yatra_view_bookings"),
  });

  // Load payment data into form when editing
  useEffect(() => {
    if (paymentData && isEditMode) {
      setFormData({
        booking_id: String(paymentData.booking_id ?? ""),
        amount: String(paymentData.amount ?? ""),
        payment_method: String(paymentData.payment_method || "Credit Card"),
        payment_status: (String(paymentData.payment_status || "pending") ||
          "pending") as PaymentFormData["payment_status"],
        payment_date: String(
          paymentData.payment_date || new Date().toISOString().split("T")[0],
        ),
        transaction_id: String(paymentData.transaction_id ?? ""),
        notes: String(paymentData.notes ?? ""),
      });
    }
  }, [paymentData, isEditMode]);

  const handleFieldChange = (field: keyof PaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.booking_id.trim()) {
      newErrors.booking_id = __("Booking is required", "yatra");
    } else {
      const bookingId = parseInt(formData.booking_id);
      if (isNaN(bookingId) || bookingId <= 0) {
        newErrors.booking_id = __("Valid booking ID is required", "yatra");
      }
    }

    if (!formData.amount.trim()) {
      newErrors.amount = __("Payment amount is required", "yatra");
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = __(
          "Payment amount must be a positive number",
          "yatra",
        );
      }
    }

    if (!formData.payment_method.trim()) {
      newErrors.payment_method = __("Payment method is required", "yatra");
    }

    if (!formData.payment_date.trim()) {
      newErrors.payment_date = __("Payment date is required", "yatra");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const payload = {
        booking_id: parseInt(data.booking_id),
        amount: parseFloat(data.amount),
        gateway: data.payment_method,
        status: data.payment_status,
        processed_at: data.payment_date,
        transaction_id: data.transaction_id.trim() || null,
        notes: data.notes.trim() || null,
      };

      return isEditMode && paymentId
        ? await apiService.updatePayment(paymentId, payload)
        : await apiService.createPayment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      // Redirect to payments list
      window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=payments`;
    },
    onError: (error: any) => {
      console.error("Error saving payment:", error);
      setErrors({
        submit: error.message || __("Failed to save payment", "yatra"),
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await saveMutation.mutateAsync(formData);
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ""}/wp-admin/admin.php?page=yatra&subpage=payments`;
  };

  if (isLoadingPayment) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={
          isEditMode
            ? __("Edit Payment", "yatra")
            : __("Add New Payment", "yatra")
        }
        description={
          isEditMode
            ? __("Update payment details", "yatra")
            : __("Record a new payment for a booking", "yatra")
        }
        actions={
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {__("Back", "yatra")}
          </Button>
        }
      />

      <ConditionalRender capability="yatra_edit_bookings">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Form Fields */}
            <div className="lg:col-span-2 space-y-3">
              {/* Payment Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Payment Information", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Booking */}
                  <div>
                    <label
                      htmlFor="booking_id"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Booking", "yatra")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <HelpText
                      text={__(
                        "Search by booking code (e.g. YTR-123), customer name, or email. Results load from your existing bookings as you type.",
                        "yatra",
                      )}
                      className="mb-2"
                    />
                    <BookingPicker
                      value={formData.booking_id}
                      onChange={(id) => handleFieldChange("booking_id", id)}
                      error={Boolean(errors.booking_id)}
                      disabled={isEditMode}
                      placeholder={__("Select a booking…", "yatra")}
                      searchPlaceholder={__(
                        "Search by booking code, name, or email…",
                        "yatra",
                      )}
                    />
                    {errors.booking_id && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.booking_id}
                      </p>
                    )}
                    {isEditMode && (
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {__(
                          "The booking linked to a payment cannot be changed after creation.",
                          "yatra",
                        )}
                      </p>
                    )}
                  </div>

                  {/* Amount and Payment Method */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Amount */}
                    <div>
                      <label
                        htmlFor="amount"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Payment Amount", "yatra")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <HelpText
                        text={__("Enter the payment amount received.", "yatra")}
                        className="mb-2"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          $
                        </span>
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) =>
                            handleFieldChange("amount", e.target.value)
                          }
                          placeholder={__("e.g., 2500.00", "yatra")}
                          className={`pl-7 ${errors.amount ? "border-red-500" : ""}`}
                          required
                        />
                      </div>
                      {errors.amount && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.amount}
                        </p>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label
                        htmlFor="payment_method"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Payment Method", "yatra")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <HelpText
                        text={__(
                          "Select the payment method used for this transaction.",
                          "yatra",
                        )}
                        className="mb-2"
                      />
                      <Select
                        id="payment_method"
                        value={formData.payment_method}
                        onChange={(e) =>
                          handleFieldChange("payment_method", e.target.value)
                        }
                        className={
                          errors.payment_method ? "border-red-500" : ""
                        }
                        required
                      >
                        <option value="Credit Card">
                          {__("Credit Card", "yatra")}
                        </option>
                        <option value="Debit Card">
                          {__("Debit Card", "yatra")}
                        </option>
                        <option value="PayPal">{__("PayPal", "yatra")}</option>
                        <option value="Bank Transfer">
                          {__("Bank Transfer", "yatra")}
                        </option>
                        <option value="Cash">{__("Cash", "yatra")}</option>
                        <option value="Check">{__("Check", "yatra")}</option>
                        <option value="Other">{__("Other", "yatra")}</option>
                      </Select>
                      {errors.payment_method && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.payment_method}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment Date and Transaction ID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Payment Date */}
                    <div>
                      <label
                        htmlFor="payment_date"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Payment Date", "yatra")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <HelpText
                        text={__(
                          "Date when the payment was received.",
                          "yatra",
                        )}
                        className="mb-2"
                      />
                      <DatePicker
                        value={formData.payment_date}
                        onChange={(value) =>
                          handleFieldChange("payment_date", value)
                        }
                        placeholder={__("Select payment date", "yatra")}
                        maxDate={new Date()}
                        error={Boolean(errors.payment_date)}
                      />
                      {errors.payment_date && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.payment_date}
                        </p>
                      )}
                    </div>

                    {/* Transaction ID */}
                    <div>
                      <label
                        htmlFor="transaction_id"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Transaction ID", "yatra")}
                      </label>
                      <HelpText
                        text={__(
                          "Optional transaction ID or reference number from the payment gateway.",
                          "yatra",
                        )}
                        className="mb-2"
                      />
                      <Input
                        id="transaction_id"
                        type="text"
                        value={formData.transaction_id}
                        onChange={(e) =>
                          handleFieldChange("transaction_id", e.target.value)
                        }
                        placeholder={__("e.g., TXN123456789", "yatra")}
                        className={
                          errors.transaction_id ? "border-red-500" : ""
                        }
                      />
                      {errors.transaction_id && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          {errors.transaction_id}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Notes", "yatra")}
                    </label>
                    <HelpText
                      text={__(
                        "Optional notes about this payment for internal reference.",
                        "yatra",
                      )}
                      className="mb-2"
                    />
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        handleFieldChange("notes", e.target.value)
                      }
                      placeholder={__(
                        "e.g., Full payment received, Partial payment - balance pending",
                        "yatra",
                      )}
                      rows={3}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Payment Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Payment Status", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={formData.payment_status}
                    onChange={(e) =>
                      handleFieldChange(
                        "payment_status",
                        e.target.value as PaymentFormData["payment_status"],
                      )
                    }
                  >
                    <option value="pending">{__("Pending", "yatra")}</option>
                    <option value="completed">
                      {__("Completed", "yatra")}
                    </option>
                    <option value="partial">{__("Partial", "yatra")}</option>
                    <option value="failed">{__("Failed", "yatra")}</option>
                    <option value="refunded">{__("Refunded", "yatra")}</option>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.payment_status === "completed" &&
                      __("Payment has been successfully processed.", "yatra")}
                    {formData.payment_status === "pending" &&
                      __("Payment is pending confirmation.", "yatra")}
                    {formData.payment_status === "partial" &&
                      __(
                        "Partial payment recorded. Balance may be pending.",
                        "yatra",
                      )}
                    {formData.payment_status === "failed" &&
                      __(
                        "Payment processing failed. Please check the details.",
                        "yatra",
                      )}
                    {formData.payment_status === "refunded" &&
                      __("Payment has been refunded to the customer.", "yatra")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          {errors.submit && (
            <Alert variant="error" className="mt-3">
              {errors.submit}
            </Alert>
          )}

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              {__("Cancel", "yatra")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {__("Saving...", "yatra")}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode
                    ? __("Update Payment", "yatra")
                    : __("Record Payment", "yatra")}
                </>
              )}
            </Button>
          </div>
        </form>
      </ConditionalRender>
    </div>
  );
};

export default PaymentForm;
