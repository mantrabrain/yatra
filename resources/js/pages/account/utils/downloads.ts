export interface DocumentDownloadOptions {
  bookingId?: number;
  paymentId?: number;
  documentType: 'voucher' | 'invoice' | 'itinerary' | 'all';
  documentName?: string;
}

// Helper functions for specific document types
export const downloadVoucher = async (bookingId: number, apiClient: any) => {
  try {
    // Fetch documents for this booking
    const response = await apiClient.get(`/customer/bookings/${bookingId}/documents`);
    const documents = response.data;
    
    // Find the voucher document
    const voucherDoc = documents.find((doc: any) => doc.category === 'voucher');
    
    if (voucherDoc && voucherDoc.url) {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = voucherDoc.url;
      link.download = voucherDoc.name || `voucher-${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('No voucher document found');
    }
  } catch (error) {
    console.error('Error downloading voucher:', error);
  }
};

export const downloadInvoice = (paymentId: number) => {
  const siteUrl = (window as any)?.yatraAdmin?.siteUrl || '';
  const nonce = (window as any)?.yatraAdmin?.nonce || '';
  const invoiceUrl = `${siteUrl}/?yatra_invoice=${paymentId}&_wpnonce=${nonce}`;
  
  // Create a temporary link to download the file
  const link = document.createElement('a');
  link.href = invoiceUrl;
  link.download = `invoice-${paymentId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadItinerary = async (bookingId: number, apiClient: any) => {
  try {
    // Fetch documents for this booking
    const response = await apiClient.get(`/customer/bookings/${bookingId}/documents`);
    const documents = response.data;
    
    // Find the itinerary document
    const itineraryDoc = documents.find((doc: any) => doc.category === 'itinerary');
    
    if (itineraryDoc && itineraryDoc.url) {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = itineraryDoc.url;
      link.download = itineraryDoc.name || `itinerary-${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('No itinerary document found');
    }
  } catch (error) {
    console.error('Error downloading itinerary:', error);
  }
};
