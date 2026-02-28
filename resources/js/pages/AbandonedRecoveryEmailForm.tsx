/**
 * Abandoned Recovery Email Campaign Form Page
 *
 * Create and edit email recovery campaigns
 *
 * @package Yatra
 * @since 3.0.0
 */

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { PageHeader } from "../components/common/PageHeader";
import { useToast } from "../components/ui/toast";
import { __ } from "../lib/i18n";
import { apiService } from "../lib/api-client";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface EmailCampaignFormData {
  name: string;
  subject: string;
  email_body: string;
  delay_hours: number;
  status: string;
  discount_code: string;
  discount_amount: number;
  discount_type: string;
}

const AbandonedRecoveryEmailForm: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("id");
  const isEdit = !!campaignId;

  const [formData, setFormData] = useState<EmailCampaignFormData>({
    name: "",
    subject: "",
    email_body: "",
    delay_hours: 1,
    status: "active",
    discount_code: "",
    discount_amount: 0,
    discount_type: "percentage",
  });

  // Fetch existing campaign if editing
  const { data: campaignData, isLoading } = useQuery({
    queryKey: ["abandoned-recovery-campaign", campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const data = await apiService.getAbandonedBookingCampaign(campaignId!);
      return data;
    },
    enabled: isEdit,
  });

  // Populate form with existing data
  useEffect(() => {
    if (campaignData?.data) {
      setFormData(campaignData.data);
    }
  }, [campaignData]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: EmailCampaignFormData) => {
      return isEdit
        ? await apiService.updateAbandonedBookingCampaign(campaignId!, data)
        : await apiService.createAbandonedBookingCampaign(data);
    },
    onSuccess: () => {
      showToast(
        isEdit
          ? __("Email campaign updated successfully")
          : __("Email campaign created successfully"),
        "success",
      );
      queryClient.invalidateQueries({
        queryKey: ["abandoned-recovery-campaigns"],
      });
      // Navigate back to main page
      window.location.href = window.location.href.split("&action=")[0];
    },
    onError: (error: any) => {
      showToast(error?.message || __("Failed to save email campaign"), "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = window.location.href.split("&action=")[0];
  };

  const handleChange = (field: keyof EmailCampaignFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? __("Edit Email Campaign") : __("Create Email Campaign")}
        description={__(
          "Configure automated email campaigns to recover abandoned bookings",
        )}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{__("Campaign Information")}</CardTitle>
            <CardDescription>{__("Basic campaign details")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">{__("Campaign Name")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={__("e.g., First Reminder Email")}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "Internal name for this campaign (not visible to customers)",
                )}
              </p>
            </div>

            <div>
              <Label htmlFor="delay_hours">{__("Send After (Hours)")} *</Label>
              <Input
                id="delay_hours"
                type="number"
                value={formData.delay_hours}
                onChange={(e) =>
                  handleChange("delay_hours", parseInt(e.target.value))
                }
                min="1"
                max="168"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "How many hours after abandonment to send this email (1-168 hours)",
                )}
              </p>
            </div>

            <div>
              <Label htmlFor="status">{__("Status")} *</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                required
              >
                <option value="active">{__("Active")}</option>
                <option value="inactive">{__("Inactive")}</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Email Content */}
        <Card>
          <CardHeader>
            <CardTitle>{__("Email Content")}</CardTitle>
            <CardDescription>
              {__("Customize the email message")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">{__("Email Subject")} *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                placeholder={__("Complete your booking and save 10%")}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "Available variables: {customer_name}, {trip_name}, {booking_amount}",
                )}
              </p>
            </div>

            <div>
              <Label htmlFor="email_body">{__("Email Body")} *</Label>
              <textarea
                id="email_body"
                value={formData.email_body}
                onChange={(e) => handleChange("email_body", e.target.value)}
                placeholder={__(
                  "Hi {customer_name},\n\nWe noticed you started booking {trip_name} but didn't complete it...",
                )}
                required
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__(
                  "Available variables: {customer_name}, {trip_name}, {booking_amount}, {recovery_link}, {discount_code}",
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Incentive */}
        <Card>
          <CardHeader>
            <CardTitle>{__("Discount Incentive (Optional)")}</CardTitle>
            <CardDescription>
              {__("Offer a discount to encourage completion")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="discount_code">{__("Discount Code")}</Label>
              <Input
                id="discount_code"
                value={formData.discount_code}
                onChange={(e) => handleChange("discount_code", e.target.value)}
                placeholder={__("e.g., COMEBACK10")}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {__("Leave empty if no discount should be offered")}
              </p>
            </div>

            <div>
              <Label htmlFor="discount_type">{__("Discount Type")}</Label>
              <Select
                id="discount_type"
                value={formData.discount_type}
                onChange={(e) => handleChange("discount_type", e.target.value)}
              >
                <option value="percentage">{__("Percentage")}</option>
                <option value="fixed">{__("Fixed Amount")}</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="discount_amount">{__("Discount Amount")}</Label>
              <Input
                id="discount_amount"
                type="number"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) =>
                  handleChange("discount_amount", parseFloat(e.target.value))
                }
                min="0"
                placeholder={
                  formData.discount_type === "percentage" ? "10" : "50"
                }
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.discount_type === "percentage"
                  ? __("Enter percentage (e.g., 10 for 10% off)")
                  : __("Enter fixed amount (e.g., 50 for $50 off)")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>{__("Email Preview")}</CardTitle>
            <CardDescription>{__("How the email will look")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <strong className="text-sm text-gray-600 dark:text-gray-400">
                  {__("Subject:")}
                </strong>
                <p className="text-gray-900 dark:text-white">
                  {formData.subject || __("(No subject)")}
                </p>
              </div>
              <div>
                <strong className="text-sm text-gray-600 dark:text-gray-400">
                  {__("Body:")}
                </strong>
                <div className="text-gray-900 dark:text-white whitespace-pre-wrap mt-2">
                  {formData.email_body || __("(No content)")}
                </div>
              </div>
              {formData.discount_code && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    <strong>{__("Discount:")}</strong> {formData.discount_code}{" "}
                    - {formData.discount_amount}
                    {formData.discount_type === "percentage" ? "%" : ""}{" "}
                    {__("off")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {__("Cancel")}
          </Button>

          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {__("Saving...")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEdit ? __("Update Campaign") : __("Create Campaign")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AbandonedRecoveryEmailForm;
