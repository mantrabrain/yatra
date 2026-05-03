import { __ } from "../../../lib/i18n";

/**
 * Account PDFs use Yatra REST routes with cookie auth + X-WP-Nonce.
 * Plain-permalink sites use index.php?rest_route=/yatra/v1 — query params must
 * stay on the URL, not inside rest_route.
 */

type RestConfig = { base: string; nonce: string };

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

function parseYatraRestSubpath(href: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  try {
    const u = new URL(href, origin);
    const rr = u.searchParams.get("rest_route");
    if (rr) {
      const decoded = decodeURIComponent(rr.replace(/\+/g, " "));
      const idx = decoded.indexOf("/yatra/v1");
      if (idx !== -1) {
        return decoded.slice(idx + "/yatra/v1".length) || decoded;
      }
      return decoded;
    }
    const path = u.pathname || "";
    const marker = "/yatra/v1";
    const pos = path.indexOf(marker);
    if (pos !== -1) {
      return path.slice(pos + marker.length);
    }
  } catch {
    /* ignore */
  }
  return "";
}

function parsePaymentIdFromHref(href: string): number | null {
  const sub = parseYatraRestSubpath(href);
  const m = sub.match(/^\/payment\/(\d+)\/invoice(?:\/?|$)/i);
  return m ? parseInt(m[1], 10) : null;
}

function parseBookingDocFromHref(
  href: string,
  kind: "voucher" | "itinerary",
): number | null {
  const sub = parseYatraRestSubpath(href);
  const re = new RegExp(`^/bookings/(\\d+)/${kind}(?:/?|$)`, "i");
  const m = sub.match(re);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Build GET URL for booking PDF endpoints.
 */
function buildBookingDocumentUrl(
  baseRaw: string,
  bookingId: number,
  kind: "voucher" | "itinerary",
  mode: "download" | "preview" = "download",
): string {
  const suffix = `/bookings/${bookingId}/${kind}`;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";

  let u: URL;
  try {
    u = new URL(String(baseRaw).trim(), origin);
  } catch {
    const b = String(baseRaw).replace(/\/$/, "");
    const q = mode === "download" ? "?download=1" : "?preview=1";
    return `${b}${suffix}${q}`;
  }

  if (u.searchParams.has("rest_route")) {
    const route = (u.searchParams.get("rest_route") || "").replace(/\/$/, "");
    u.searchParams.set("rest_route", `${route}${suffix}`);
    if (mode === "download") {
      u.searchParams.set("download", "1");
      u.searchParams.delete("preview");
    } else {
      u.searchParams.set("preview", "1");
      u.searchParams.delete("download");
    }
    return u.toString();
  }

  u.pathname = (u.pathname || "").replace(/\/$/, "") + suffix;
  if (mode === "download") {
    u.searchParams.set("download", "1");
    u.searchParams.delete("preview");
  } else {
    u.searchParams.set("preview", "1");
    u.searchParams.delete("download");
  }
  return u.toString();
}

function buildPaymentInvoiceUrl(
  baseRaw: string,
  paymentId: number,
  mode: "download" | "preview",
): string {
  const suffix = `/payment/${paymentId}/invoice`;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";

  let u: URL;
  try {
    u = new URL(String(baseRaw).trim(), origin);
  } catch {
    const b = String(baseRaw).replace(/\/$/, "");
    const q = mode === "download" ? "?download=1" : "?preview=1";
    return `${b}${suffix}${q}`;
  }

  if (u.searchParams.has("rest_route")) {
    const route = (u.searchParams.get("rest_route") || "").replace(/\/$/, "");
    u.searchParams.set("rest_route", `${route}${suffix}`);
    if (mode === "download") {
      u.searchParams.set("download", "1");
      u.searchParams.delete("preview");
    } else {
      u.searchParams.set("preview", "1");
      u.searchParams.delete("download");
    }
    return u.toString();
  }

  u.pathname = (u.pathname || "").replace(/\/$/, "") + suffix;
  if (mode === "download") {
    u.searchParams.set("download", "1");
    u.searchParams.delete("preview");
  } else {
    u.searchParams.set("preview", "1");
    u.searchParams.delete("download");
  }
  return u.toString();
}

async function readFetchErrorMessage(res: Response): Promise<string> {
  let msg = res.statusText || __("Request failed", "yatra");
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
  return msg;
}

async function fetchPreviewPdf(url: string): Promise<Blob> {
  const { nonce } = getAccountRestConfig();
  if (!nonce) {
    throw new Error(
      __("Missing security token. Reload the account page and try again.", "yatra"),
    );
  }
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-WP-Nonce": nonce,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(await readFetchErrorMessage(res));
  }
  const data = (await res.json()) as {
    pdf_data?: string;
    filename?: string;
  };
  if (!data?.pdf_data || typeof data.pdf_data !== "string") {
    throw new Error(
      __("Invalid preview response from the server.", "yatra"),
    );
  }
  const binary = atob(data.pdf_data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "application/pdf" });
}

function openPdfInNewTab(blob: Blob): void {
  const objectUrl = URL.createObjectURL(blob);
  const win = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!win) {
    URL.revokeObjectURL(objectUrl);
    throw new Error(
      __(
        "Popup blocked. Allow popups for this site to preview the PDF.",
        "yatra",
      ),
    );
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

async function downloadBookingBinary(
  bookingId: number,
  kind: "voucher" | "itinerary",
): Promise<void> {
  const { base, nonce } = getAccountRestConfig();
  if (!nonce) {
    throw new Error(
      __("Missing security token. Reload the account page and try again.", "yatra"),
    );
  }
  const url = buildBookingDocumentUrl(base, bookingId, kind, "download");
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-WP-Nonce": nonce,
      Accept: "application/pdf, application/octet-stream, */*",
    },
  });
  if (!res.ok) {
    throw new Error(await readFetchErrorMessage(res));
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

async function downloadPaymentInvoiceBinary(paymentId: number): Promise<void> {
  const { base, nonce } = getAccountRestConfig();
  if (!nonce) {
    throw new Error(
      __("Missing security token. Reload the account page and try again.", "yatra"),
    );
  }
  const url = buildPaymentInvoiceUrl(base, paymentId, "download");
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-WP-Nonce": nonce,
      Accept: "application/pdf, application/octet-stream, */*",
    },
  });
  if (!res.ok) {
    throw new Error(await readFetchErrorMessage(res));
  }
  const blob = await res.blob();
  const dispo = res.headers.get("Content-Disposition");
  let filename = `invoice-${paymentId}.pdf`;
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
  documentType: "voucher" | "invoice" | "itinerary" | "all" | "downloads";
  fallbackUrl?: string;
}

export const downloadDocument = async (
  options: DocumentDownloadOptions,
): Promise<void> => {
  if (options.documentType === "downloads" && options.fallbackUrl) {
    window.open(options.fallbackUrl, "_blank", "noopener,noreferrer");
    return;
  }

  if (options.documentType === "invoice") {
    const pid =
      options.paymentId ?? parsePaymentIdFromHref(options.fallbackUrl || "");
    if (pid) {
      await downloadPaymentInvoiceBinary(pid);
      return;
    }
  }

  if (
    options.documentType === "voucher" ||
    options.documentType === "itinerary"
  ) {
    const kind = options.documentType === "voucher" ? "voucher" : "itinerary";
    const bid =
      options.bookingId ??
      parseBookingDocFromHref(options.fallbackUrl || "", kind);
    if (bid) {
      await downloadBookingBinary(bid, kind);
      return;
    }
  }

  if (options.bookingId && options.documentType === "all") {
    await downloadBookingBinary(options.bookingId, "voucher");
    return;
  }

  console.error(`No handler for document type: ${options.documentType}`);
};

export const downloadVoucher = (bookingId: number) =>
  downloadBookingBinary(bookingId, "voucher");

export const downloadInvoice = (paymentId: number) =>
  downloadPaymentInvoiceBinary(paymentId);

export const downloadItinerary = (bookingId: number) =>
  downloadBookingBinary(bookingId, "itinerary");

/** Open payment invoice PDF in a new tab (REST preview JSON → blob). */
export const previewPaymentInvoice = async (
  paymentId: number,
): Promise<void> => {
  const { base, nonce } = getAccountRestConfig();
  if (!nonce) {
    throw new Error(
      __("Missing security token. Reload the account page and try again.", "yatra"),
    );
  }
  const url = buildPaymentInvoiceUrl(base, paymentId, "preview");
  const blob = await fetchPreviewPdf(url);
  openPdfInNewTab(blob);
};

export async function previewTravelDocument(doc: {
  category: string;
  url: string;
  booking_id?: number;
  payment_id?: number;
}): Promise<void> {
  const { base, nonce } = getAccountRestConfig();
  if (!nonce) {
    throw new Error(
      __("Missing security token. Reload the account page and try again.", "yatra"),
    );
  }

  if (doc.category === "invoice") {
    const pid = doc.payment_id ?? parsePaymentIdFromHref(doc.url);
    if (!pid) {
      throw new Error(
        __("Could not resolve invoice link.", "yatra"),
      );
    }
    const url = buildPaymentInvoiceUrl(base, pid, "preview");
    const blob = await fetchPreviewPdf(url);
    openPdfInNewTab(blob);
    return;
  }

  if (doc.category === "voucher" || doc.category === "itinerary") {
    const kind = doc.category === "voucher" ? "voucher" : "itinerary";
    const bid = doc.booking_id ?? parseBookingDocFromHref(doc.url, kind);
    if (!bid) {
      throw new Error(
        __("Could not resolve document link.", "yatra"),
      );
    }
    const url = buildBookingDocumentUrl(base, bid, kind, "preview");
    const blob = await fetchPreviewPdf(url);
    openPdfInNewTab(blob);
    return;
  }

  window.open(doc.url, "_blank", "noopener,noreferrer");
}
