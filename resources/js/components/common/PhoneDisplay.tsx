/**
 * Renders a stored phone value as flag + readable number in admin views.
 * International values ("+9779806015400") show the detected country flag and a
 * spaced "+977 9806015400"; legacy national-only values render as plain text
 * with no flag (never reinterpreted).
 */
import React from "react";
import { detectPhoneCountry, flagUrl, formatPhone } from "../../lib/phone";

interface PhoneDisplayProps {
  value?: string | null;
  className?: string;
}

export const PhoneDisplay: React.FC<PhoneDisplayProps> = ({
  value,
  className,
}) => {
  const raw = (value || "").trim();
  if (!raw) return null;

  const detected = detectPhoneCountry(raw);
  const url = detected ? flagUrl(detected.iso) : "";

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      {url && (
        <img
          src={url}
          alt={detected ? detected.iso : ""}
          width={18}
          height={13}
          loading="lazy"
          style={{
            borderRadius: 2,
            objectFit: "cover",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
            flex: "0 0 auto",
          }}
        />
      )}
      <span>{detected ? formatPhone(raw) : raw}</span>
    </span>
  );
};

export default PhoneDisplay;
