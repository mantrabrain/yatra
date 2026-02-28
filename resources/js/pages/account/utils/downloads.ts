import { apiClient } from "../../../lib/api-client";

export interface DocumentDownloadOptions {
  bookingId?: number;
  paymentId?: number;
  documentType: "voucher" | "invoice" | "itinerary" | "all";
  fallbackUrl?: string;
}

export const downloadDocument = async (
  options: DocumentDownloadOptions,
): Promise<void> => {
  try {
    let documents: any[] = [];
    let targetDoc: any = null;

    // For booking-related documents (voucher, itinerary)
    if (options.bookingId) {
      const response = await apiClient.get(
        `/customer/bookings/${options.bookingId}/documents`,
      );
      documents = response.data || [];

      // Find specific document type
      targetDoc = documents.find(
        (doc: any) => doc.category === options.documentType,
      );

      // Fallback to direct URL if API doesn't have the document
      if (!targetDoc && options.fallbackUrl) {
        const link = document.createElement("a");
        link.href = options.fallbackUrl;
        link.download = `${options.documentType}-${options.bookingId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    }

    // For payment-related documents (invoice)
    else if (options.paymentId && options.fallbackUrl) {
      // Use direct URL for invoices as fallback
      const link = document.createElement("a");
      link.href = options.fallbackUrl;
      link.download = `${options.documentType}-${options.paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Download the document if found
    if (targetDoc && targetDoc.url) {
      const link = document.createElement("a");
      link.href = targetDoc.url;
      link.download =
        targetDoc.name ||
        `${options.documentType}-${options.bookingId || options.paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error(`No ${options.documentType} document found`);
    }
  } catch (error) {
    console.error(`Error downloading ${options.documentType}:`, error);
  }
};

// Helper functions for specific document types
export const downloadVoucher = (bookingId: number) => {
  return downloadDocument({
    bookingId,
    documentType: "voucher",
  });
};

export const downloadInvoice = (paymentId: number) => {
  const siteUrl = (window as any)?.yatraAdmin?.siteUrl || "";
  const nonce = (window as any)?.yatraAdmin?.nonce || "";
  const fallbackUrl = `${siteUrl}/?yatra_invoice=${paymentId}&_wpnonce=${nonce}`;

  return downloadDocument({
    paymentId,
    documentType: "invoice",
    fallbackUrl,
  });
};

export const downloadItinerary = (bookingId: number) => {
  return downloadDocument({
    bookingId,
    documentType: "itinerary",
  });
};
