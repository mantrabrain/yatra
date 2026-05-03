/**
 * Trips Table Component
 * Modular table component for displaying trips
 * Supports extensibility for Pro features
 */

import React from "react";
import { __ } from "../../lib/i18n";
import { formatYatraMoney } from "../../lib/currency-display";
import { ConditionalRender } from "../ui/conditional-render";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Edit, Trash2, Eye } from "lucide-react";

interface Trip {
  id: number;
  title: string;
  slug: string;
  price: number;
  status: string;
  created_at: string;
  bookings_count?: number;
  featured?: boolean;
}

interface TripsTableProps {
  trips: Trip[];
  loading?: boolean;
  onEdit?: (trip: Trip) => void;
  onDelete?: (trip: Trip) => void;
  onView?: (trip: Trip) => void;
  showProFeatures?: boolean;
}

/**
 * Trips Table Component
 * Displays trips in a table format with actions
 */
export const TripsTable: React.FC<TripsTableProps> = ({
  trips,
  loading = false,
  onEdit,
  onDelete,
  onView,
  showProFeatures = false,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const defaultCurrency =
    (typeof window !== "undefined" &&
      ((window as unknown as { yatraAdmin?: { currency?: string } })
        .yatraAdmin?.currency ||
        (window as unknown as { yatraBookingData?: { currency?: string } })
          .yatraBookingData?.currency)) ||
    "USD";

  const formatPrice = (price: number) =>
    formatYatraMoney(Number(price) || 0, defaultCurrency, {
      zeroAsUnknown: false,
    });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        variant: "default" | "success" | "warning" | "error" | "info";
        label: string;
      }
    > = {
      active: { variant: "success", label: __("Active", "yatra") },
      draft: { variant: "default", label: __("Draft", "yatra") },
      inactive: { variant: "error", label: __("Inactive", "yatra") },
      pending: { variant: "warning", label: __("Pending", "yatra") },
    };

    const statusInfo = statusMap[status] || {
      variant: "default" as const,
      label: status,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        {__("Loading trips...", "yatra")}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        {__("No trips found", "yatra")}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{__("Title", "yatra")}</TableHead>
            <TableHead>{__("Slug", "yatra")}</TableHead>
            <TableHead>{__("Price", "yatra")}</TableHead>
            <TableHead>{__("Status", "yatra")}</TableHead>
            {showProFeatures && (
              <TableHead>{__("Bookings", "yatra")}</TableHead>
            )}
            <TableHead>{__("Created", "yatra")}</TableHead>
            <TableHead className="text-right">
              {__("Actions", "yatra")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {trip.title}
                  {trip.featured && showProFeatures && (
                    <Badge variant="info" className="text-xs">
                      {__("Featured", "yatra")}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-gray-500 dark:text-gray-400">
                {trip.slug}
              </TableCell>
              <TableCell>{formatPrice(trip.price)}</TableCell>
              <TableCell>{getStatusBadge(trip.status)}</TableCell>
              {showProFeatures && (
                <TableCell>{trip.bookings_count || 0}</TableCell>
              )}
              <TableCell className="text-gray-500 dark:text-gray-400">
                {formatDate(trip.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <ConditionalRender capability="yatra_view_trips">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(trip)}
                        aria-label={__("View trip", "yatra")}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </ConditionalRender>

                  <ConditionalRender capability="yatra_edit_trips">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(trip)}
                        aria-label={__("Edit trip", "yatra")}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </ConditionalRender>

                  <ConditionalRender capability="yatra_delete_trips">
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              __(
                                "Are you sure you want to delete this trip?",
                                "yatra",
                              ),
                            )
                          ) {
                            onDelete(trip);
                          }
                        }}
                        aria-label={__("Delete trip", "yatra")}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </ConditionalRender>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TripsTable;
