/**
 * Enquiry Form Page
 * Create or edit enquiry in a clean, minimal SaaS-style design
 */

import React, { useMemo, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { __ } from "../lib/i18n";
import { apiService } from "../lib/api-client";
import { usePermissions } from "../hooks/usePermissions";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { DatePicker } from "../components/ui/date-picker";
import { Select } from "../components/ui/select";
import { useToast } from "../components/ui/toast";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";
import { useNavigate } from "../hooks/useNavigate";
import { Skeleton } from "../components/ui/skeleton";
import { EnquiryReplyAffordance } from "../components/ai/EnquiryReplyAffordance";
import { Sparkles } from "lucide-react";

interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  trip_id?: number;
  trip_title?: string;
  message: string;
  travelers_count?: number;
  travel_date?: string;
  status:
    | "new"
    | "pending"
    | "responded"
    | "closed"
    | "converted"
    | "read"
    | "archived"
    | "spam"
    | "trash";
  response_notes?: string;
  created_at: string;
  responded_at?: string;
}

interface Trip {
  id: number;
  title: string;
}

const EnquiryForm: React.FC = () => {
  const { can } = usePermissions();
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Form state
  const [formData, setFormData] = useState<Partial<Enquiry>>({
    name: "",
    email: "",
    phone: "",
    trip_id: undefined,
    message: "",
    travelers_count: 1,
    travel_date: "",
    status: "new",
    response_notes: "",
  });
  // Tracks whether the AI is currently drafting a reply so the banner
  // above the textarea can show / hide. Lives in EnquiryForm (not in
  // EnquiryReplyAffordance) so the textarea + banner can render side by
  // side without the affordance owning the layout.
  const [aiDrafting, setAiDrafting] = useState(false);

  // Get enquiry id from URL (null for create, number for edit)
  const enquiryId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? parseInt(id) : null;
  }, []);

  const isEdit = !!enquiryId;

  // Fetch enquiry data for editing
  const { data: enquiry, isLoading: isLoadingEnquiry } =
    useQuery<Enquiry | null>({
      queryKey: ["enquiry", enquiryId],
      queryFn: async () => {
        if (!enquiryId) return null;
        const response = await apiService.getEnquiry(enquiryId!);
        // Some endpoints return { success, data }, others return the object directly
        return (response as any)?.data ?? response;
      },
      enabled: !!enquiryId && can("yatra_respond_to_enquiries"),
    });

  // Fetch trips for dropdown
  const { data: tripsData } = useQuery({
    queryKey: ["trips-select"],
    queryFn: async () => {
      return await apiService.getTrips({ per_page: 100 });
    },
    enabled: can("yatra_respond_to_enquiries"),
  });

  // Normalize trips response to array
  const trips: Trip[] = Array.isArray((tripsData as any)?.data)
    ? (tripsData as any).data
    : Array.isArray(tripsData)
      ? (tripsData as Trip[])
      : [];

  // Update form when enquiry data loads
  useEffect(() => {
    if (enquiry) {
      setFormData({
        name: enquiry.name || "",
        email: enquiry.email || "",
        phone: enquiry.phone || "",
        trip_id: enquiry.trip_id,
        message: enquiry.message || "",
        travelers_count: enquiry.travelers_count || 1,
        travel_date: enquiry.travel_date || "",
        status: enquiry.status || "new",
        response_notes: enquiry.response_notes || "",
      });
    }
  }, [enquiry]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Enquiry>) => {
      return isEdit
        ? await apiService.updateEnquiry(enquiryId!, data)
        : await apiService.createEnquiry(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      queryClient.invalidateQueries({ queryKey: ["enquiry", enquiryId] });
      showToast(__("Enquiry saved successfully.", "yatra"), "success");
      navigate({ subpage: "enquiries" });
    },
  });

  const handleBack = () => {
    navigate({ subpage: "enquiries" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleChange = (field: keyof Enquiry, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isEdit && isLoadingEnquiry) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__("Edit Enquiry", "yatra")}
          actions={
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          }
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={
          isEdit ? __("Edit Enquiry", "yatra") : __("Create Enquiry", "yatra")
        }
        description={
          isEdit
            ? __("Update enquiry details", "yatra")
            : __("Add a new enquiry", "yatra")
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__("Back", "yatra")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveMutation.isPending
                ? __("Saving...", "yatra")
                : __("Save", "yatra")}
            </Button>
          </div>
        }
      />

      <ConditionalRender capability="yatra_respond_to_enquiries">
        <form onSubmit={handleSubmit}>
          {saveMutation.isError && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {saveMutation.error?.message ||
                __("Failed to save enquiry. Please try again.", "yatra")}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-3">
              {/* Customer Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Customer Information", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__("Name", "yatra")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.name || ""}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder={__("Customer name", "yatra")}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__("Email", "yatra")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder={__("customer@example.com", "yatra")}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__("Phone", "yatra")}
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder={__("Phone number", "yatra")}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Enquiry Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Enquiry Details", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {__("Message", "yatra")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.message || ""}
                      onChange={(e) => handleChange("message", e.target.value)}
                      placeholder={__("Enquiry message...", "yatra")}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={5}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {__("Number of Travelers", "yatra")}
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.travelers_count || ""}
                        onChange={(e) =>
                          handleChange(
                            "travelers_count",
                            parseInt(e.target.value, 10) || 1,
                          )
                        }
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {__("Preferred Travel Date", "yatra")}
                      </label>
                      <DatePicker
                        value={formData.travel_date || ""}
                        onChange={(val) => handleChange("travel_date", val)}
                        placeholder={__("Select date", "yatra")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Notes */}
              {isEdit && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {__("Response Notes", "yatra")}
                      </CardTitle>
                      {enquiryId && (
                        <EnquiryReplyAffordance
                          enquiryId={Number(enquiryId)}
                          value={formData.response_notes || ""}
                          onAccept={(text) =>
                            handleChange("response_notes", text)
                          }
                          autoDraftOnMount={
                            !(formData.response_notes || "").trim() &&
                            (formData.status === "new" ||
                              !formData.responded_at)
                          }
                          onDraftingChange={setAiDrafting}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {aiDrafting && (
                      <div className="mb-2 flex items-center gap-2 rounded-md border border-purple-200 bg-purple-50/60 px-2 py-1 text-xs text-purple-700 dark:border-purple-500/40 dark:bg-purple-900/20 dark:text-purple-200">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        {__(
                          "AI is drafting a reply based on this enquiry, the trip details, and the customer's history…",
                          "yatra",
                        )}
                      </div>
                    )}
                    <textarea
                      value={formData.response_notes || ""}
                      onChange={(e) =>
                        handleChange("response_notes", e.target.value)
                      }
                      placeholder={__(
                        "Internal notes about responses to this enquiry...",
                        "yatra",
                      )}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={6}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Status", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.status || "new"}
                    onChange={(e) => handleChange("status", e.target.value)}
                  >
                    <option value="new">{__("New", "yatra")}</option>
                    <option value="pending">{__("Pending", "yatra")}</option>
                    <option value="responded">
                      {__("Responded", "yatra")}
                    </option>
                    <option value="converted">
                      {__("Converted", "yatra")}
                    </option>
                    <option value="closed">{__("Closed", "yatra")}</option>
                    <option value="spam">{__("Spam", "yatra")}</option>
                    <option value="trash">{__("Trash", "yatra")}</option>
                  </Select>
                </CardContent>
              </Card>

              {/* Related Trip */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Related Trip", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.trip_id?.toString() || ""}
                    onChange={(e) =>
                      handleChange(
                        "trip_id",
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                  >
                    <option value="">{__("No trip selected", "yatra")}</option>
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id.toString()}>
                        {trip.title}
                      </option>
                    ))}
                  </Select>
                </CardContent>
              </Card>

              {/* Created Info */}
              {isEdit && enquiry && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {__("Information", "yatra")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {__("Created:", "yatra")}
                      </span>
                      <p className="text-gray-900 dark:text-white mt-0.5">
                        {new Date(enquiry.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                    {enquiry.responded_at && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          {__("Responded:", "yatra")}
                        </span>
                        <p className="text-gray-900 dark:text-white mt-0.5">
                          {new Date(enquiry.responded_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </ConditionalRender>
    </div>
  );
};

export default EnquiryForm;
