/**
 * Admin invoice download helper.
 *
 * Calls the public invoice REST endpoint with the WordPress admin nonce + cookie,
 * so administrators can trigger an invoice PDF download from the admin UI without
 * any extra permission/login round-trip. The same endpoint is used on the
 * customer account page (with the same auth pattern), and supports an HMAC
 * `invoice_token` for guests on the booking confirmation page.
 */

interface AdminRestConfig {
  base: string;
  nonce: string;
}

function getAdminRestConfig(): AdminRestConfig {
  const w = window as unknown as {
    yatraAdmin?: { restUrl?: string; nonce?: string };
  };
  const raw = w?.yatraAdmin?.restUrl || "/wp-json";
  const base = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  const nonce = w?.yatraAdmin?.nonce || "";
  return { base, nonce };
}

function buildInvoiceUrl(base: string, paymentId: number): string {
  const suffix = `/yatra/v1/payment/${paymentId}/invoice`;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";

  let u: URL;
  try {
    u = new URL(base, origin);
  } catch {
    return `${base.replace(/\/$/, "")}${suffix}?download=1`;
  }

  // Plain permalinks: /wp-json is exposed as ?rest_route=
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

async function readError(res: Response): Promise<string> {
  let msg = res.statusText || "Request failed";
  try {
    const j = await res.json();
    if (j?.message && typeof j.message === "string") {
      msg = j.message;
    }
  } catch {
    const t = await res.text().catch(() => "");
    if (t && t.length < 300) {
      msg = t;
    }
  }
  return msg;
}

/**
 * Download a payment invoice PDF as a file.
 *
 * Authentication is handled server-side via the admin REST nonce + cookie
 * (administrators bypass the ownership check inside `download_invoice`).
 */
export async function downloadAdminInvoice(paymentId: number): Promise<void> {
  if (!paymentId || paymentId <= 0) {
    throw new Error("Invalid payment ID");
  }

  const { base, nonce } = getAdminRestConfig();
  if (!nonce) {
    throw new Error("Missing REST nonce; please reload the page.");
  }

  const url = buildInvoiceUrl(base, paymentId);
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-WP-Nonce": nonce,
      Accept: "application/pdf, application/octet-stream, */*",
    },
  });

  if (!res.ok) {
    throw new Error(await readError(res));
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
