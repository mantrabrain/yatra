/**
 * Booking document downloads use GET /yatra/v1/bookings/{id}/voucher|itinerary (not /customer/...).
 * Binary responses must use fetch + blob; apiClient.get expects JSON.
 */

type RestConfig = { base: string; nonce: string };

/**
 * Build GET URL for booking PDF endpoints. Plain-permalink sites use
 * index.php?rest_route=/yatra/v1 — appending "?download=1" after the path
 * would put "?" inside rest_route and break routing (rest_no_route).
 */
function buildBookingDocumentUrl(
  baseRaw: string,
  bookingId: number,
  kind: "voucher" | "itinerary",
): string {
  const suffix = `/bookings/${bookingId}/${kind}`;
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost";

  let u: URL;
  try {
    u = new URL(String(baseRaw).trim(), origin);
  } catch {
    const b = String(baseRaw).replace(/\/$/, "");
    return `${b}${suffix}?download=1`;
  }

  if (u.searchParams.has("rest_route")) {
    const route = (u.searchParams.get("rest_route") || "").replace(/\/$/, "");
    u.searchParams.set("rest_route", `${route}${suffix}`);
    u.searchParams.set("download", "1");
    return u.toString();
  }

  u.pathname = (u.pathname || "").replace(/\/$/, "") + suffix;
  u.searchParams.set("download", "1");
  return u.toString();
}

function getAccountRestConfig(): RestConfig {
  if (typeof window === "undefined") {
    return { base: "/wp-json/yatra/v1", nonce: "" };
  }
  const w = window as unknown as {
    yatraAccountPage?: { apiUrl?: string; nonce?: string };
    yatraAdmin?: { apiUrl?: string; nonce?: string };
  };
  const raw =
    w.yatraAccountPage?.apiUrl || w.yatraAdmin?.apiUrl || "/wp-json/yatra/v1";
  const base = String(raw).replace(/\/$/, "");
  const nonce = w.yatraAccountPage?.nonce || w.yatraAdmin?.nonce || "";
  return { base, nonce };
}

async function downloadBookingBinary(
  bookingId: number,
  kind: "voucher" | "itinerary",
): Promise<void> {
  const { base, nonce } = getAccountRestConfig();
  if (!nonce) {
    throw new Error("Missing REST nonce; reload the account page.");
  }
  const url = buildBookingDocumentUrl(base, bookingId, kind);
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-WP-Nonce": nonce,
      Accept: "application/pdf, application/octet-stream, */*",
    },
  });
  if (!res.ok) {
    let msg = res.statusText || "Download failed";
    try {
      const j = await res.json();
      if (j?.message) {
        msg = typeof j.message === "string" ? j.message : msg;
      }
    } catch {
      const t = await res.text().catch(() => "");
      if (t && t.length < 200) {
        msg = t;
      }
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const dispo = res.headers.get("Content-Disposition");
  let filename = `${kind}-${bookingId}.pdf`;
  if (dispo) {
    const m = /filename\*?=(?:UTF-8'')?["']?([^";\n]+)/i.exec(dispo);
    if (m?.[1]) {
      try {
        filename = decodeURIComponent(m[1].replace(/['"]/g, "").trim());
      } catch {
        filename = m[1].replace(/['"]/g, "").trim();
      }
    }
  }
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export interface DocumentDownloadOptions {
  bookingId?: number;
  paymentId?: number;
  documentType: "voucher" | "invoice" | "itinerary" | "all";
  fallbackUrl?: string;
}

export const downloadDocument = async (
  options: DocumentDownloadOptions,
): Promise<void> => {
  if (
    options.bookingId &&
    (options.documentType === "voucher" || options.documentType === "itinerary")
  ) {
    await downloadBookingBinary(
      options.bookingId,
      options.documentType === "voucher" ? "voucher" : "itinerary",
    );
    return;
  }

  if (options.bookingId && options.documentType === "all") {
    await downloadBookingBinary(options.bookingId, "voucher");
    return;
  }

  if (options.paymentId && options.fallbackUrl) {
    const link = document.createElement("a");
    link.href = options.fallbackUrl;
    link.download = `${options.documentType}-${options.paymentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  console.error(`No handler for document type: ${options.documentType}`);
};

export const downloadVoucher = (bookingId: number) =>
  downloadBookingBinary(bookingId, "voucher");

export const downloadInvoice = (paymentId: number) => {
  const siteUrl =
    (typeof window !== "undefined" &&
      (window as unknown as { yatraAccountPage?: { siteUrl?: string } })
        .yatraAccountPage?.siteUrl) ||
    (typeof window !== "undefined" &&
      (window as unknown as { yatraAdmin?: { siteUrl?: string } }).yatraAdmin
        ?.siteUrl) ||
    "";
  const nonce =
    (typeof window !== "undefined" &&
      (window as unknown as { yatraAccountPage?: { nonce?: string } })
        .yatraAccountPage?.nonce) ||
    (typeof window !== "undefined" &&
      (window as unknown as { yatraAdmin?: { nonce?: string } }).yatraAdmin
        ?.nonce) ||
    "";
  const fallbackUrl = `${siteUrl}/?yatra_invoice=${paymentId}&_wpnonce=${nonce}`;

  return downloadDocument({
    paymentId,
    documentType: "invoice",
    fallbackUrl,
  });
};

export const downloadItinerary = (bookingId: number) =>
  downloadBookingBinary(bookingId, "itinerary");
