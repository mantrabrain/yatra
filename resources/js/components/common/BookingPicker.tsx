/**
 * Booking Picker
 *
 * Async-search dropdown that lets admins select a booking by typing its
 * booking code (reference), customer name, or email. Used by forms that
 * need to associate a record with a booking — e.g. recording a new
 * payment from the admin Payments screen — instead of asking the user to
 * type a raw numeric booking ID.
 *
 * Backend: hits `GET /yatra/v1/bookings?search=…` which already searches
 * across `b.reference`, contact email, name, and phone.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { __ } from "../../lib/i18n";
import { apiService } from "../../lib/api-client";
import { Input } from "../ui/input";

export interface BookingPickerBooking {
  id: number;
  booking_number?: string;
  reference?: string;
  customer_name?: string;
  customer_email?: string;
  trip_title?: string;
  total_amount?: number | string;
  currency?: string;
  booking_status?: string;
  payment_status?: string;
}

export interface BookingPickerProps {
  /** The selected booking id, as a string. Empty string means "no selection". */
  value: string;
  /**
   * Called whenever the selection changes. Receives the new id (string,
   * empty when cleared) and, when available, the booking object.
   */
  onChange: (id: string, booking?: BookingPickerBooking | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  /** How many bookings to fetch per query. */
  perPage?: number;
  /** ms to wait after the last keystroke before firing a request. */
  debounceMs?: number;
  /** Maximum dropdown height in pixels (default 320). */
  maxHeight?: number;
}

const formatBookingLabel = (b: BookingPickerBooking): string => {
  const code = b.booking_number || b.reference || `#${b.id}`;
  const customer = b.customer_name?.trim();
  return customer ? `${code} — ${customer}` : code;
};

const formatBookingMeta = (b: BookingPickerBooking): string => {
  const parts: string[] = [];
  if (b.trip_title) parts.push(b.trip_title);
  if (b.customer_email) parts.push(b.customer_email);
  return parts.join(" · ");
};

export const BookingPicker: React.FC<BookingPickerProps> = ({
  value,
  onChange,
  placeholder = __("Select a booking…", "yatra"),
  searchPlaceholder = __("Search by booking code, name, or email…", "yatra"),
  className = "",
  error = false,
  disabled = false,
  perPage = 20,
  debounceMs = 300,
  maxHeight = 320,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [results, setResults] = useState<BookingPickerBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");

  // The currently selected booking object, used to render the closed-state
  // label. We keep this separate from `results` so a selection persists even
  // after the user clears the search box.
  const [selected, setSelected] = useState<BookingPickerBooking | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  // Debounce the search input so we don't issue a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Issue a search whenever the dropdown is open and the debounced term
  // changes (including the empty string, which surfaces the most-recent
  // bookings as a useful default list).
  useEffect(() => {
    if (!isOpen) return;

    const reqId = ++requestIdRef.current;
    setIsLoading(true);
    setLoadError("");

    apiService
      .getBookings({ search: debouncedTerm, per_page: perPage, page: 1 })
      .then((response: any) => {
        if (reqId !== requestIdRef.current) return;
        const list: BookingPickerBooking[] = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];
        setResults(list);
      })
      .catch((err: any) => {
        if (reqId !== requestIdRef.current) return;
        setLoadError(err?.message || __("Failed to load bookings.", "yatra"));
        setResults([]);
      })
      .finally(() => {
        if (reqId === requestIdRef.current) {
          setIsLoading(false);
        }
      });
  }, [isOpen, debouncedTerm, perPage]);

  // When the value changes externally (e.g. edit mode loads existing
  // booking_id), resolve the booking so we can show a useful label.
  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }

    if (selected && String(selected.id) === String(value)) {
      return;
    }

    let cancelled = false;
    apiService
      .getBooking(value)
      .then((response: any) => {
        if (cancelled) return;
        const data = response?.data ?? response;
        if (data && typeof data === "object" && data.id) {
          setSelected(data as BookingPickerBooking);
        }
      })
      .catch(() => {
        // Silent — if we can't resolve, the dropdown still works; the user
        // simply sees the raw id until they pick a new booking.
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    if (!isOpen) return;

    const handler = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handler);
    const focusTimer = setTimeout(() => searchInputRef.current?.focus(), 80);

    return () => {
      document.removeEventListener("mousedown", handler);
      clearTimeout(focusTimer);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (booking: BookingPickerBooking) => {
    setSelected(booking);
    setIsOpen(false);
    setSearchTerm("");
    onChange(String(booking.id), booking);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(null);
    onChange("", null);
  };

  const closedLabel = useMemo(() => {
    if (selected) return formatBookingLabel(selected);
    if (value) return `#${value}`;
    return "";
  }, [selected, value]);

  const closedMeta = useMemo(
    () => (selected ? formatBookingMeta(selected) : ""),
    [selected],
  );

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ zIndex: isOpen ? 9999 : "auto" }}
    >
      <div
        className={`flex min-h-[2.75rem] w-full rounded-md border-2 ${
          error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
        } bg-white dark:bg-gray-800 px-4 py-2 text-base ring-offset-white focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-gray-900 dark:focus-within:ring-blue-400 transition-colors`}
      >
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`flex-1 flex items-center justify-between text-left ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span
            className={
              closedLabel
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }
          >
            {closedLabel ? (
              <span className="flex flex-col">
                <span className="font-medium">{closedLabel}</span>
                {closedMeta && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {closedMeta}
                  </span>
                )}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <span className="flex items-center gap-1 ml-2">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                aria-label={__("Clear selection", "yatra")}
              >
                <X className="w-4 h-4 text-gray-400" />
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-md shadow-lg overflow-hidden"
          style={{ maxHeight }}
        >
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8"
                onClick={(e) => e.stopPropagation()}
              />
              {isLoading && (
                <Loader2 className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>
          </div>

          <div
            className="overflow-y-auto"
            style={{ maxHeight: maxHeight - 56 }}
          >
            {loadError ? (
              <div className="px-3 py-3 text-sm text-red-600 dark:text-red-400">
                {loadError}
              </div>
            ) : isLoading && results.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                {__("Loading bookings…", "yatra")}
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                {debouncedTerm
                  ? __("No bookings match this search.", "yatra")
                  : __("No bookings found.", "yatra")}
              </div>
            ) : (
              results.map((booking) => {
                const isActive = String(booking.id) === String(value);
                return (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => handleSelect(booking)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">
                          {formatBookingLabel(booking)}
                        </span>
                        {formatBookingMeta(booking) && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {formatBookingMeta(booking)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        ID: {booking.id}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPicker;
