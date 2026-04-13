/**
 * Email → Delivery: admin/from identity and optional SMTP only.
 */

import React from "react";
import { Info } from "lucide-react";
import { __ } from "../../lib/i18n";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Label } from "../ui/label";
import type {
  EmailFieldChangeHandler,
  EmailSettingsValues,
} from "./email-settings-types";

const Field = React.memo(
  ({
    id,
    label,
    description,
    required = false,
    children,
  }: {
    id: string;
    label: string;
    description?: React.ReactNode;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span className="min-w-0 leading-relaxed">{description}</span>
        </p>
      )}
      {children}
    </div>
  ),
);
Field.displayName = "Field";

const SectionDivider = ({ title }: { title: string }) => (
  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
      {title}
    </h3>
  </div>
);

export type EmailDeliverySectionProps = {
  values: Pick<
    EmailSettingsValues,
    | "admin_email"
    | "from_email"
    | "from_name"
    | "smtp_enabled"
    | "smtp_host"
    | "smtp_port"
    | "smtp_username"
    | "smtp_password"
    | "smtp_encryption"
  >;
  onFieldChange: EmailFieldChangeHandler;
};

export const EmailDeliverySection: React.FC<EmailDeliverySectionProps> = ({
  values,
  onFieldChange,
}) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        {__("Email Configuration", "yatra")}
      </h3>
      <div className="space-y-4">
        <Field
          id="admin_email"
          label={__("Admin Email", "yatra")}
          description={__(
            "Email address to receive admin notifications",
            "yatra",
          )}
          required
        >
          <Input
            id="admin_email"
            type="email"
            value={values.admin_email}
            name="admin_email"
            onChange={onFieldChange}
            placeholder={__("admin@example.com", "yatra")}
          />
        </Field>

        <Field
          id="from_email"
          label={__("From Email", "yatra")}
          description={__(
            "Email address used as sender for customer emails",
            "yatra",
          )}
          required
        >
          <Input
            id="from_email"
            type="email"
            value={values.from_email}
            name="from_email"
            onChange={onFieldChange}
            placeholder={__("noreply@example.com", "yatra")}
          />
        </Field>

        <Field
          id="from_name"
          label={__("From Name", "yatra")}
          description={__(
            "Name displayed as sender in customer emails",
            "yatra",
          )}
        >
          <Input
            id="from_name"
            value={values.from_name}
            name="from_name"
            onChange={onFieldChange}
            placeholder={__("Travel Agency Name", "yatra")}
          />
        </Field>
      </div>
    </div>

    <SectionDivider title={__("SMTP Settings (Optional)", "yatra")} />

    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
        <input
          type="checkbox"
          id="smtp_enabled"
          checked={values.smtp_enabled}
          name="smtp_enabled"
          onChange={onFieldChange}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex-1">
          <Label htmlFor="smtp_enabled" className="font-medium cursor-pointer">
            {__("Enable SMTP", "yatra")}
          </Label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {__(
              "Use custom SMTP server instead of default WordPress mail",
              "yatra",
            )}
          </p>
        </div>
      </div>

      {values.smtp_enabled && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              id="smtp_host"
              label={__("SMTP Host", "yatra")}
              description={__("SMTP server address", "yatra")}
            >
              <Input
                id="smtp_host"
                value={values.smtp_host}
                name="smtp_host"
                onChange={onFieldChange}
                placeholder="smtp.gmail.com"
              />
            </Field>

            <Field
              id="smtp_port"
              label={__("SMTP Port", "yatra")}
              description={__("SMTP server port (usually 587 or 465)", "yatra")}
            >
              <Input
                id="smtp_port"
                type="number"
                value={values.smtp_port}
                name="smtp_port"
                onChange={onFieldChange}
                placeholder="587"
              />
            </Field>
          </div>

          <Field
            id="smtp_encryption"
            label={__("Encryption", "yatra")}
            description={__("Connection encryption type", "yatra")}
          >
            <Select
              id="smtp_encryption"
              value={values.smtp_encryption}
              name="smtp_encryption"
              onChange={onFieldChange}
            >
              <option value="tls">{__("TLS", "yatra")}</option>
              <option value="ssl">{__("SSL", "yatra")}</option>
              <option value="none">{__("None", "yatra")}</option>
            </Select>
          </Field>

          <Field
            id="smtp_username"
            label={__("SMTP Username", "yatra")}
            description={__("Your SMTP account username", "yatra")}
          >
            <Input
              id="smtp_username"
              value={values.smtp_username}
              name="smtp_username"
              onChange={onFieldChange}
              placeholder={__("your-email@gmail.com", "yatra")}
            />
          </Field>

          <Field
            id="smtp_password"
            label={__("SMTP Password", "yatra")}
            description={__(
              "Your SMTP account password or app password",
              "yatra",
            )}
          >
            <Input
              id="smtp_password"
              type="password"
              value={values.smtp_password}
              name="smtp_password"
              onChange={onFieldChange}
              placeholder={__("Enter SMTP password", "yatra")}
            />
          </Field>
        </>
      )}
    </div>
  </div>
);

export default EmailDeliverySection;
