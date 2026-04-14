/**
 * Date and Time Formatting Utilities
 * Uses global Yatra settings for consistent date/time formatting across all pages
 */

// Supported PHP date formats:
// 'Y-m-d'   -> 2025-12-15
// 'm/d/Y'   -> 12/15/2025
// 'd/m/Y'   -> 15/12/2025
// 'd-m-Y'   -> 15-12-2025
// 'M d, Y'  -> Dec 15, 2025
// 'F d, Y'  -> December 15, 2025
// 'd M Y'   -> 15 Dec 2025
// 'd F Y'   -> 15 December 2025

// Supported PHP time formats:
// 'H:i'     -> 14:30 (24-hour)
// 'h:i A'   -> 02:30 PM (12-hour)
// 'h:i a'   -> 02:30 pm (12-hour lowercase)
// 'H:i:s'   -> 14:30:00 (24-hour with seconds)
// 'h:i:s A' -> 02:30:00 PM (12-hour with seconds)

/**
 * Get date format from Yatra settings
 */
export function getDateFormat(): string {
  return (
    (window as any)?.yatraAdmin?.date_format ||
    (window as any)?.yatraAdmin?.dateFormat ||
    "Y-m-d"
  );
}

/**
 * Get time format from Yatra settings
 */
export function getTimeFormat(): string {
  return (
    (window as any)?.yatraAdmin?.time_format ||
    (window as any)?.yatraAdmin?.timeFormat ||
    "H:i"
  );
}

/**
 * Get timezone from Yatra settings
 */
export function getTimezone(): string {
  return (window as any)?.yatraAdmin?.timezone || "UTC";
}

/**
 * Format a date string according to Yatra settings
 * @param dateString - Date string in any parseable format (ISO, YYYY-MM-DD, etc.)
 * @param includeTime - Whether to include time in the output
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date | null | undefined,
  includeTime: boolean = false,
): string {
  if (!dateString) return "-";

  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return String(dateString);
    }

    const phpDateFormat = getDateFormat();
    const phpTimeFormat = getTimeFormat();

    // Format date part
    const formattedDate = formatDatePart(date, phpDateFormat);

    // Format time part if requested
    if (includeTime) {
      const formattedTime = formatTimePart(date, phpTimeFormat);
      return `${formattedDate} ${formattedTime}`;
    }

    return formattedDate;
  } catch (e) {
    return String(dateString);
  }
}

/**
 * Format only the date part
 */
function formatDatePart(date: Date, phpFormat: string): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const pad = (n: number) => n.toString().padStart(2, "0");

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = date.getDay();

  switch (phpFormat) {
    // Numeric formats
    case "Y-m-d":
      return `${year}-${pad(month + 1)}-${pad(day)}`;
    case "Y/m/d":
      return `${year}/${pad(month + 1)}/${pad(day)}`;
    case "m/d/Y":
      return `${pad(month + 1)}/${pad(day)}/${year}`;
    case "d/m/Y":
      return `${pad(day)}/${pad(month + 1)}/${year}`;
    case "d-m-Y":
      return `${pad(day)}-${pad(month + 1)}-${year}`;
    case "d.m.Y":
      return `${pad(day)}.${pad(month + 1)}.${year}`;
    // Month name formats with padded day
    case "M d, Y":
      return `${monthShort[month]} ${pad(day)}, ${year}`;
    case "F d, Y":
      return `${monthNames[month]} ${pad(day)}, ${year}`;
    case "d M Y":
      return `${pad(day)} ${monthShort[month]} ${year}`;
    case "d F Y":
      return `${pad(day)} ${monthNames[month]} ${year}`;
    // Month name formats with day without leading zero
    case "M j, Y":
      return `${monthShort[month]} ${day}, ${year}`;
    case "F j, Y":
      return `${monthNames[month]} ${day}, ${year}`;
    case "j M Y":
      return `${day} ${monthShort[month]} ${year}`;
    case "j F Y":
      return `${day} ${monthNames[month]} ${year}`;
    // Year first with month name
    case "Y M j":
      return `${year} ${monthShort[month]} ${day}`;
    case "Y F j":
      return `${year} ${monthNames[month]} ${day}`;
    // With weekday
    case "l, F j, Y":
      return `${dayNames[dayOfWeek]}, ${monthNames[month]} ${day}, ${year}`;
    case "D, M j, Y":
      return `${dayShort[dayOfWeek]}, ${monthShort[month]} ${day}, ${year}`;
    default:
      // Default to ISO format
      return `${year}-${pad(month + 1)}-${pad(day)}`;
  }
}

/**
 * Format only the time part
 */
function formatTimePart(date: Date, phpFormat: string): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const pad = (n: number) => n.toString().padStart(2, "0");

  const hours12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";

  switch (phpFormat) {
    case "H:i":
      return `${pad(hours)}:${pad(minutes)}`;
    case "h:i A":
      return `${pad(hours12)}:${pad(minutes)} ${ampm}`;
    case "h:i a":
      return `${pad(hours12)}:${pad(minutes)} ${ampm.toLowerCase()}`;
    case "H:i:s":
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    case "h:i:s A":
      return `${pad(hours12)}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
    default:
      return `${pad(hours)}:${pad(minutes)}`;
  }
}

/**
 * Format a date for display with time
 * @param dateString - Date string
 * @returns Formatted date and time string
 */
export function formatDateTime(
  dateString: string | Date | null | undefined,
): string {
  return formatDate(dateString, true);
}

/**
 * Format time only
 * @param dateString - Date string or time string
 * @returns Formatted time string
 */
export function formatTime(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "-";

  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      // Try to parse as time only (HH:mm or HH:mm:ss)
      if (
        typeof dateString === "string" &&
        /^\d{1,2}:\d{2}(:\d{2})?$/.test(dateString)
      ) {
        const [hours, minutes] = dateString.split(":").map(Number);
        const tempDate = new Date();
        tempDate.setHours(hours, minutes, 0, 0);
        return formatTimePart(tempDate, getTimeFormat());
      }
      return String(dateString);
    }

    return formatTimePart(date, getTimeFormat());
  } catch (e) {
    return String(dateString);
  }
}

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 * @param dateString - Date string
 * @returns Relative time string
 */
export function formatRelativeTime(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "-";

  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return String(dateString);
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffWeeks < 4)
      return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
    if (diffMonths < 12)
      return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
    return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  } catch (e) {
    return String(dateString);
  }
}

/**
 * Parse a date string to Date object
 * @param dateString - Date string in various formats
 * @returns Date object or null if invalid
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
}

/**
 * Format date for input fields (always YYYY-MM-DD for HTML date inputs)
 * @param dateString - Date string
 * @returns Date in YYYY-MM-DD format for input fields
 */
export function formatDateForInput(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "";

  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch (e) {
    return "";
  }
}
