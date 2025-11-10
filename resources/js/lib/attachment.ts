/**
 * Attachment utility functions
 * Handles conversion between attachment IDs and URLs
 */

/**
 * Get image URL from attachment ID
 * @param attachmentId - WordPress attachment ID
 * @returns Image URL or null if invalid
 */
export const getAttachmentUrl = (attachmentId: string | number | null | undefined): string | null => {
  if (!attachmentId) return null;
  
  const id = String(attachmentId);
  
  // If it's already a URL (for backward compatibility), return it
  if (id.startsWith('http://') || id.startsWith('https://')) {
    return id;
  }
  
  // If it's a numeric attachment ID, use wp_get_attachment_image_url
  // This will be handled by the backend API
  // For frontend, we'll use a REST API endpoint or inline script
  if (/^\d+$/.test(id)) {
    // Use WordPress REST API to get attachment URL
    // For now, return null and let the backend handle it
    // The backend should convert attachment IDs to URLs
    return null;
  }
  
  return null;
};

/**
 * Check if a value is an attachment ID (numeric string)
 */
export const isAttachmentId = (value: string | null | undefined): boolean => {
  if (!value) return false;
  return /^\d+$/.test(String(value));
};

/**
 * Check if a value is a URL
 */
export const isUrl = (value: string | null | undefined): boolean => {
  if (!value) return false;
  return value.startsWith('http://') || value.startsWith('https://');
};

