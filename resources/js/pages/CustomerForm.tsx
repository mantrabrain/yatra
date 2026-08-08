/**
 * Customer Form Page
 * Add/Edit Customer form with dynamic data from API
 */

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { __ } from "../lib/i18n";
import { apiService } from "../lib/api-client";
import { useToast } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { PageHeader } from "../components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ConditionalRender } from "../components/ui/conditional-render";
import { Skeleton } from "../components/ui/skeleton";
import { DatePicker } from "../components/ui/date-picker";
import { ConfirmationDialog } from "../components/ui/confirmation-dialog";

interface CustomerFormData {
  first_name: string;
  /** Create-mode only: also create a WordPress login account for this customer */
  create_account?: boolean;
  last_name: string;
  email: string;
  phone: string;
  secondary_phone: string;
  country: string;
  city: string;
  state: string;
  address: string;
  postal_code: string;
  nationality: string;
  date_of_birth: string;
  gender: string;
  emergency_name: string;
  emergency_phone: string;
  emergency_relationship: string;
  dietary_requirements: string;
  medical_conditions: string;
  special_needs: string;
  newsletter_optin: boolean;
  marketing_optin: boolean;
  status: string;
  notes: string;
  loyalty_tier: string;
  loyalty_points: number;
}

const CustomerForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const baseAdminUrl = (window as any).yatraAdmin?.adminUrl || "";
  const [formData, setFormData] = useState<CustomerFormData>({
    first_name: "",
    create_account: false,
    last_name: "",
    email: "",
    phone: "",
    secondary_phone: "",
    country: "",
    city: "",
    state: "",
    address: "",
    postal_code: "",
    nationality: "",
    date_of_birth: "",
    gender: "",
    emergency_name: "",
    emergency_phone: "",
    emergency_relationship: "",
    dietary_requirements: "",
    medical_conditions: "",
    special_needs: "",
    newsletter_optin: false,
    marketing_optin: false,
    status: "active",
    notes: "",
    loyalty_tier: "bronze",
    loyalty_points: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // When the entered email already has a login account, we ask before linking.
  const [linkConfirm, setLinkConfirm] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  // Get action and id from URL
  const action = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") || "create";
  }, []);

  const customerId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") ? parseInt(params.get("id") || "0") : null;
  }, []);

  const isEditMode = action === "edit" && customerId !== null;

  // Fetch customer data if editing

  const { data: customerData, isLoading: isLoadingCustomer } = useQuery<
    { data?: any } | CustomerFormData | null
  >({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const response = await apiService.getCustomer(customerId);
      const data = (response as any)?.data ?? response;

      const emergency = (data as any).emergency_contact || {};

      return {
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        secondary_phone: data.secondary_phone || "",
        country: data.country || "",
        city: data.city || "",
        state: data.state || "",
        address: data.address || "",
        postal_code: data.postal_code || "",
        nationality: data.nationality || "",
        date_of_birth: data.date_of_birth || "",
        gender: data.gender || "",
        emergency_name: (data as any).emergency_name || emergency.name || "",
        emergency_phone: (data as any).emergency_phone || emergency.phone || "",
        emergency_relationship:
          (data as any).emergency_relationship || emergency.relationship || "",
        dietary_requirements: data.dietary_requirements || "",
        medical_conditions: data.medical_conditions || "",
        special_needs: data.special_needs || "",
        newsletter_optin: Boolean(data.newsletter_optin),
        marketing_optin: Boolean(data.marketing_optin),
        status: data.status || "active",
        notes: data.notes || "",
        loyalty_tier: data.loyalty_tier || "bronze",
        loyalty_points:
          typeof data.loyalty_points === "number"
            ? data.loyalty_points
            : parseInt(data.loyalty_points || "0", 10) || 0,
        // Carried through so the form can tell whether this customer already has
        // a login account (controls the "Create a login account" option below).
        user_id: (data as any).user_id ?? null,
      } as CustomerFormData;
    },
    enabled: isEditMode,
  });

  // True only when editing a customer that already has a WordPress login. Used
  // to HIDE the "Create a login account" option — an existing account is never
  // touched from this form; the option is only for adding one where none exists.
  const customerHasAccount =
    isEditMode && !!(customerData as any)?.user_id;

  // Load customer data into form when editing
  useEffect(() => {
    if (customerData && isEditMode) {
      setFormData(customerData as CustomerFormData);
    }
  }, [customerData, isEditMode]);

  const handleFieldChange = (field: keyof CustomerFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = __("First name is required", "yatra");
    }

    if (!formData.email.trim()) {
      newErrors.email = __("Email is required", "yatra");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = __("Invalid email address", "yatra");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const payload = { ...data };

      if (isEditMode && customerId) {
        return await apiService.updateCustomer(customerId, payload);
      } else {
        return await apiService.createCustomer(payload);
      }
    },
    onSuccess: (result: any) => {
      // The email already has a login account — don't treat this as saved. Ask
      // the operator to confirm the link; nothing was written server-side.
      if (result?.needs_link_confirmation) {
        setIsSubmitting(false);
        setLinkConfirm({
          open: true,
          message:
            result.message ||
            __(
              "This email already has a login account. Link this customer to it?",
              "yatra",
            ),
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      setIsSubmitting(false);
      // The server returns a message tailored to what happened (created, created
      // with a login account, or linked to an existing account); prefer it.
      const message =
        result?.message ||
        (isEditMode
          ? __("Customer updated successfully", "yatra")
          : __("Customer created successfully", "yatra"));
      showToast(message, "success");
      if (!isEditMode) {
        window.location.href = `${baseAdminUrl}?page=yatra&subpage=customers`;
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message ||
        __("An error occurred while saving the customer", "yatra");
      setErrors({ submit: errorMessage });
      setIsSubmitting(false);
      showToast(errorMessage, "error");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    window.location.href = `${baseAdminUrl}?page=yatra&subpage=customers`;
  };

  // Skeleton loader
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2 space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (isEditMode && isLoadingCustomer) {
    return (
      <div className="space-y-3">
        <PageHeader
          title={__("Edit Customer", "yatra")}
          description={__("Loading...", "yatra")}
          actions={
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {__("Back", "yatra")}
            </Button>
          }
        />
        {renderSkeleton()}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={
          isEditMode
            ? __("Edit Customer", "yatra")
            : __("Add New Customer", "yatra")
        }
        description={
          isEditMode
            ? __("Update customer information", "yatra")
            : __("Create a new customer profile", "yatra")
        }
        actions={
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {__("Back", "yatra")}
          </Button>
        }
      />

      <ConditionalRender capability="yatra_edit_customers">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Form Fields */}
            <div className="lg:col-span-2 space-y-3">
              {/* Personal Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Personal Information", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* First Name */}
                    <div>
                      <label
                        htmlFor="first_name"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("First Name", "yatra")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={(e) =>
                          handleFieldChange("first_name", e.target.value)
                        }
                        placeholder={__("Enter first name", "yatra")}
                        className={errors.first_name ? "border-red-500" : ""}
                        required
                      />
                      {errors.first_name && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.first_name}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label
                        htmlFor="last_name"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Last Name", "yatra")}
                      </label>
                      <Input
                        id="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={(e) =>
                          handleFieldChange("last_name", e.target.value)
                        }
                        placeholder={__("Enter last name", "yatra")}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Email Address", "yatra")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleFieldChange("email", e.target.value)
                      }
                      placeholder={__("customer@example.com", "yatra")}
                      className={errors.email ? "border-red-500" : ""}
                      required
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.email}
                      </p>
                    )}
                    {isEditMode && !errors.email && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {__(
                          "If this customer can sign in, a confirmation link is sent to the new address and their email changes only once it is confirmed there. Customers without an account are updated straight away.",
                          "yatra",
                        )}
                      </p>
                    )}
                    {/* Editing a customer that already signs in: no checkbox —
                        their account is managed elsewhere, never from here. */}
                    {customerHasAccount && (
                      <div className="mt-3 flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm text-gray-600 dark:text-gray-400">
                        {__("This customer has a login account.", "yatra")}
                      </div>
                    )}
                    {/* Shown on Add, and on Edit when the customer has no login
                        yet — ticking it creates one on save (never removes one). */}
                    {!customerHasAccount && (
                      <div className="mt-3 flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <input
                          type="checkbox"
                          id="create_account"
                          checked={!!formData.create_account}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              create_account: e.target.checked,
                            })
                          }
                          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="create_account"
                          className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          {__("Create a login account for this customer", "yatra")}
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {__(
                              "They'll receive an email to set their own password and can then sign in to see their bookings. If this email already has an account, it will be linked instead.",
                              "yatra",
                            )}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Phone Numbers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Phone Number", "yatra")}
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          handleFieldChange("phone", e.target.value)
                        }
                        placeholder={__("+1234567890", "yatra")}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="secondary_phone"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Secondary Phone", "yatra")}
                      </label>
                      <Input
                        id="secondary_phone"
                        type="tel"
                        value={formData.secondary_phone}
                        onChange={(e) =>
                          handleFieldChange("secondary_phone", e.target.value)
                        }
                        placeholder={__("+1234567890", "yatra")}
                      />
                    </div>
                  </div>

                  {/* Date of Birth & Gender */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="date_of_birth"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Date of Birth", "yatra")}
                      </label>
                      <DatePicker
                        value={formData.date_of_birth}
                        onChange={(value: string) =>
                          handleFieldChange("date_of_birth", value)
                        }
                        placeholder={__("Select date of birth", "yatra")}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="gender"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Gender", "yatra")}
                      </label>
                      <Select
                        id="gender"
                        value={formData.gender}
                        onChange={(e) =>
                          handleFieldChange("gender", e.target.value)
                        }
                      >
                        <option value="">{__("Select gender", "yatra")}</option>
                        <option value="male">{__("Male", "yatra")}</option>
                        <option value="female">{__("Female", "yatra")}</option>
                        <option value="other">{__("Other", "yatra")}</option>
                        <option value="prefer_not_to_say">
                          {__("Prefer not to say", "yatra")}
                        </option>
                      </Select>
                    </div>
                  </div>

                  {/* Nationality */}
                  <div>
                    <label
                      htmlFor="nationality"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Nationality", "yatra")}
                    </label>
                    <Input
                      id="nationality"
                      type="text"
                      value={formData.nationality}
                      onChange={(e) =>
                        handleFieldChange("nationality", e.target.value)
                      }
                      placeholder={__("Enter nationality", "yatra")}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Address Information", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Address */}
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Street Address", "yatra")}
                    </label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        handleFieldChange("address", e.target.value)
                      }
                      placeholder={__("Enter street address", "yatra")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* City */}
                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("City", "yatra")}
                      </label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          handleFieldChange("city", e.target.value)
                        }
                        placeholder={__("Enter city", "yatra")}
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label
                        htmlFor="state"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("State/Province", "yatra")}
                      </label>
                      <Input
                        id="state"
                        type="text"
                        value={formData.state}
                        onChange={(e) =>
                          handleFieldChange("state", e.target.value)
                        }
                        placeholder={__("Enter state", "yatra")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Country */}
                    <div>
                      <label
                        htmlFor="country"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Country", "yatra")}
                      </label>
                      <Input
                        id="country"
                        type="text"
                        value={formData.country}
                        onChange={(e) =>
                          handleFieldChange("country", e.target.value)
                        }
                        placeholder={__("Enter country", "yatra")}
                      />
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label
                        htmlFor="postal_code"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Postal Code", "yatra")}
                      </label>
                      <Input
                        id="postal_code"
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) =>
                          handleFieldChange("postal_code", e.target.value)
                        }
                        placeholder={__("Enter postal code", "yatra")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Emergency Contact", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor="emergency_name"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Contact Name", "yatra")}
                      </label>
                      <Input
                        id="emergency_name"
                        type="text"
                        value={formData.emergency_name}
                        onChange={(e) =>
                          handleFieldChange("emergency_name", e.target.value)
                        }
                        placeholder={__("Full name", "yatra")}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="emergency_phone"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Contact Phone", "yatra")}
                      </label>
                      <Input
                        id="emergency_phone"
                        type="tel"
                        value={formData.emergency_phone}
                        onChange={(e) =>
                          handleFieldChange("emergency_phone", e.target.value)
                        }
                        placeholder={__("+1234567890", "yatra")}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="emergency_relationship"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Relationship", "yatra")}
                      </label>
                      <Input
                        id="emergency_relationship"
                        type="text"
                        value={formData.emergency_relationship}
                        onChange={(e) =>
                          handleFieldChange(
                            "emergency_relationship",
                            e.target.value,
                          )
                        }
                        placeholder={__("e.g., Spouse, Parent", "yatra")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Special Requirements */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Special Requirements", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label
                      htmlFor="dietary_requirements"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Dietary Requirements", "yatra")}
                    </label>
                    <Input
                      id="dietary_requirements"
                      type="text"
                      value={formData.dietary_requirements}
                      onChange={(e) =>
                        handleFieldChange(
                          "dietary_requirements",
                          e.target.value,
                        )
                      }
                      placeholder={__("e.g., Vegetarian, Gluten-free", "yatra")}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="medical_conditions"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Medical Conditions", "yatra")}
                    </label>
                    <textarea
                      id="medical_conditions"
                      value={formData.medical_conditions}
                      onChange={(e) =>
                        handleFieldChange("medical_conditions", e.target.value)
                      }
                      placeholder={__(
                        "Any relevant medical conditions",
                        "yatra",
                      )}
                      rows={2}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="special_needs"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Special Needs", "yatra")}
                    </label>
                    <textarea
                      id="special_needs"
                      value={formData.special_needs}
                      onChange={(e) =>
                        handleFieldChange("special_needs", e.target.value)
                      }
                      placeholder={__(
                        "Any special accommodations needed",
                        "yatra",
                      )}
                      rows={2}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Internal Notes", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                    placeholder={__(
                      "Enter any internal notes about this customer (not visible to customer)",
                      "yatra",
                    )}
                    rows={4}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400 resize-none"
                  />
                </CardContent>
              </Card>
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
                <CardContent className="space-y-3">
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {__("Customer Status", "yatra")}
                    </label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        handleFieldChange("status", e.target.value)
                      }
                    >
                      <option value="active">{__("Active", "yatra")}</option>
                      <option value="inactive">
                        {__("Inactive", "yatra")}
                      </option>
                      <option value="blocked">{__("Blocked", "yatra")}</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Loyalty */}
              {isEditMode && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {__("Loyalty", "yatra")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label
                        htmlFor="loyalty_tier"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Loyalty Tier", "yatra")}
                      </label>
                      <Select
                        id="loyalty_tier"
                        value={formData.loyalty_tier}
                        onChange={(e) =>
                          handleFieldChange("loyalty_tier", e.target.value)
                        }
                      >
                        <option value="bronze">
                          {__("🥉 Bronze", "yatra")}
                        </option>
                        <option value="silver">
                          {__("🥈 Silver", "yatra")}
                        </option>
                        <option value="gold">{__("🥇 Gold", "yatra")}</option>
                        <option value="platinum">
                          {__("💎 Platinum", "yatra")}
                        </option>
                      </Select>
                    </div>
                    <div>
                      <label
                        htmlFor="loyalty_points"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {__("Loyalty Points", "yatra")}
                      </label>
                      <Input
                        id="loyalty_points"
                        type="number"
                        min={0}
                        value={formData.loyalty_points}
                        onChange={(e) =>
                          handleFieldChange(
                            "loyalty_points",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Preferences */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {__("Preferences", "yatra")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.newsletter_optin}
                      onChange={(e) =>
                        handleFieldChange("newsletter_optin", e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {__("Subscribe to newsletter", "yatra")}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.marketing_optin}
                      onChange={(e) =>
                        handleFieldChange("marketing_optin", e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {__("Receive marketing emails", "yatra")}
                    </span>
                  </label>
                </CardContent>
              </Card>

              {/* Submit Actions */}
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {errors.submit && (
                      <div className="p-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                        {errors.submit}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2"
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
                              ? __("Update Customer", "yatra")
                              : __("Create Customer", "yatra")}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        {__("Cancel", "yatra")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </ConditionalRender>

      {/* Shown when the entered email already has a login account. Confirming
          re-submits with confirm_link_existing so the backend links to it;
          cancelling leaves everything unsaved (nothing was written). */}
      <ConfirmationDialog
        isOpen={linkConfirm.open}
        onClose={() => setLinkConfirm({ open: false, message: "" })}
        onConfirm={() => {
          setLinkConfirm({ open: false, message: "" });
          setIsSubmitting(true);
          saveMutation.mutate({
            ...formData,
            confirm_link_existing: true,
          } as any);
        }}
        title={__("Link to existing account?", "yatra")}
        message={linkConfirm.message}
        confirmText={__("Link account", "yatra")}
      />
    </div>
  );
};

export default CustomerForm;
