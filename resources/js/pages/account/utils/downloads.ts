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
      __(
        "Missing security token. Reload the account page and try again.",
        "yatra",
      ),
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
    throw new Error(__("Invalid preview response from the server.", "yatra"));
  }
  const binary = atob(data.pdf_data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "application/pdf" });
}

/**
 * Open a blob in a new tab while keeping the browser's user-gesture
 * heuristic happy.
 *
 * Browsers gate `window.open` on the call originating from a *sync*
 * user gesture. The preview flows here go user-click → `await fetch(…)`
 * → `window.open(blobUrl)`; the await breaks the gesture chain, so
 * Chrome/Safari block the popup and the user gets a noisy alert.
 *
 * Two-step pattern instead:
 *   1. caller opens an `about:blank` window SYNCHRONOUSLY inside the
 *      click handler — that pre-opened window IS attributed to the
 *      gesture, so no popup-blocker dance.
 *   2. once the fetch resolves, we navigate that same window to the
 *      blob URL. If the pre-opened window was already blocked (rare —
 *      means the site is restricted entirely), we silently fall back
 *      to a download anchor so the user still gets the PDF.
 */
function openPdfInPreOpenedWindow(
  blob: Blob,
  preOpened: Window | null,
  filename: string,
): void {
  const objectUrl = URL.createObjectURL(blob);

  if (preOpened && !preOpened.closed) {
    try {
      preOpened.location.href = objectUrl;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return;
    } catch {
      // Cross-origin / sandboxed navigation refused — close the empty
      // window and fall through to the anchor fallback below.
      try {
        preOpened.close();
      } catch {
        /* ignore */
      }
    }
  }

  // Fallback: open in a new tab via an anchor click. Crucially we DO
  // NOT set `link.download` here — this is the PREVIEW path; using
  // `download` would force the browser to save the file, which is
  // exactly the bug we're trying to fix ("Preview button does the
  // same as Download"). target="_blank" + no download attribute
  // makes the browser open the PDF in its built-in viewer.
  const link = document.createElement("a");
  link.href = objectUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  void filename; // filename only matters for the download path
}

async function downloadBookingBinary(
  bookingId: number,
  kind: "voucher" | "itinerary",
): Promise<void> {
  const { base, nonce } = getAccountRestConfig();
  if (!nonce) {
    throw new Error(
      __(
        "Missing security token. Reload the account page and try again.",
        "yatra",
      ),
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
      __(
        "Missing security token. Reload the account page and try again.",
        "yatra",
      ),
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

/**
 * Pre-open an `about:blank` window inside the synchronous click
 * handler so the browser still attributes the eventual navigation to
 * the user gesture. Returns null when popups are blocked outright —
 * callers degrade gracefully to a download anchor (see
 * `openPdfInPreOpenedWindow`).
 *
 * IMPORTANT: we do NOT pass "noopener" / "noreferrer" here. With
 * `noopener` set, `window.open()` is specified to return `null` so
 * the caller can't navigate the new tab — which is the exact thing
 * we need to do once the fetch resolves. The previous version of
 * this function included noopener and silently always returned null,
 * making EVERY click on Preview fall through to the download anchor.
 * The blob URL we navigate to is same-origin and untrusted by
 * design, so opener access from the new tab is harmless here.
 */
function preOpenPreviewWindow(): Window | null {
  if (typeof window === "undefined") return null;
  try {
    return window.open("about:blank", "_blank");
  } catch {
    return null;
  }
}

/** Open payment invoice PDF in a new tab (REST preview JSON → blob). */
export const previewPaymentInvoice = async (
  paymentId: number,
): Promise<void> => {
  // Open the window BEFORE the async fetch — the click is still the
  // active user gesture at this point, so the popup blocker doesn't
  // fire. Subsequent `await` calls are fine; we just navigate the
  // already-opened window once we have the blob.
  const preOpened = preOpenPreviewWindow();
  try {
    const { base, nonce } = getAccountRestConfig();
    if (!nonce) {
      throw new Error(
        __(
          "Missing security token. Reload the account page and try again.",
          "yatra",
        ),
      );
    }
    const url = buildPaymentInvoiceUrl(base, paymentId, "preview");
    const blob = await fetchPreviewPdf(url);
    openPdfInPreOpenedWindow(blob, preOpened, `invoice-${paymentId}.pdf`);
  } catch (e) {
    if (preOpened && !preOpened.closed) {
      try {
        preOpened.close();
      } catch {
        /* ignore */
      }
    }
    throw e;
  }
};

export async function previewTravelDocument(doc: {
  category: string;
  url: string;
  booking_id?: number;
  payment_id?: number;
}): Promise<void> {
  const preOpened = preOpenPreviewWindow();
  try {
    const { base, nonce } = getAccountRestConfig();
    if (!nonce) {
      throw new Error(
        __(
          "Missing security token. Reload the account page and try again.",
          "yatra",
        ),
      );
    }

    if (doc.category === "invoice") {
      const pid = doc.payment_id ?? parsePaymentIdFromHref(doc.url);
      if (!pid) {
        throw new Error(__("Could not resolve invoice link.", "yatra"));
      }
      const url = buildPaymentInvoiceUrl(base, pid, "preview");
      const blob = await fetchPreviewPdf(url);
      openPdfInPreOpenedWindow(blob, preOpened, `invoice-${pid}.pdf`);
      return;
    }

    if (doc.category === "voucher" || doc.category === "itinerary") {
      const kind = doc.category === "voucher" ? "voucher" : "itinerary";
      const bid = doc.booking_id ?? parseBookingDocFromHref(doc.url, kind);
      if (!bid) {
        throw new Error(__("Could not resolve document link.", "yatra"));
      }
      const url = buildBookingDocumentUrl(base, bid, kind, "preview");
      const blob = await fetchPreviewPdf(url);
      openPdfInPreOpenedWindow(blob, preOpened, `${kind}-${bid}.pdf`);
      return;
    }

    // Unknown category — fall back to navigating the pre-opened
    // window directly to the original URL, or open it fresh if the
    // pre-open was blocked.
    if (preOpened && !preOpened.closed) {
      preOpened.location.href = doc.url;
    } else {
      window.open(doc.url, "_blank", "noopener,noreferrer");
    }
  } catch (e) {
    if (preOpened && !preOpened.closed) {
      try {
        preOpened.close();
      } catch {
        /* ignore */
      }
    }
    throw e;
  }
}
