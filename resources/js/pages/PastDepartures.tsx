/**
 * Past Departures Page
 * View and manage past departures archive
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Trash2, AlertCircle } from "lucide-react";
import { __ } from "../lib/i18n";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { apiClient } from "../lib/api-client";
import { useToast } from "../components/ui/toast";

// Format date helper
const formatDate = (dateString: string): string => {
  if (!dateString) return "--";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

interface Departure {
  id: number;
  trip_id: number;
  date: string;
  time?: string;
  max_capacity: number;
  booked_count: number;
  available_capacity: number;
  status: "upcoming" | "full" | "past" | "cancelled";
  source: "manual" | "recurring_generated";
  created_at: string;
}

const PastDepartures: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Get trip_id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("trip_id")
    ? parseInt(urlParams.get("trip_id")!)
    : null;
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Fetch trip details
  const { data: tripData } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      if (!tripId) return null;
      const response = await apiClient.get(`/trips/${tripId}`);
      return response?.data || response;
    },
    enabled: !!tripId,
  });

  // Fetch past departures
  const { data: departuresData, isLoading } = useQuery({
    queryKey: ["past-departures", tripId, page, searchTerm],
    queryFn: async () => {
      if (!tripId) return { data: [], total: 0 };
      const response = await apiClient.get(`/trips/${tripId}/departures/past`, {
        params: {
          page,
          per_page: 20,
          search: searchTerm || undefined,
        },
      });
      return {
        data: response?.data || [],
        total: response?.meta?.total || 0,
      };
    },
    enabled: !!tripId,
  });

  // Delete departure mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!tripId) return;
      await apiClient.delete(`/trips/${tripId}/departures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["past-departures", tripId] });
      showToast(__("Departure deleted successfully", "yatra"), "success");
    },
    onError: (error: any) => {
      showToast(
        error?.message || __("Failed to delete departure", "yatra"),
        "error",
      );
    },
  });

  const handleDelete = (id: number, source: string, bookedCount: number) => {
    if (source !== "recurring_generated" || bookedCount > 0) {
      showToast(
        __("Only empty recurring-generated departures can be deleted", "yatra"),
        "error",
      );
      return;
    }

    if (
      !confirm(__("Are you sure you want to delete this departure?", "yatra"))
    ) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const handleBack = () => {
    window.location.href = `?page=yatra&subpage=trips&tab=departures${tripId ? `&trip_id=${tripId}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={__("Past Departures", "yatra")}
        description={
          tripData
            ? `${__("Past departures for", "yatra")}: ${tripData.title}`
            : __("View past trip departures", "yatra")
        }
        actions={
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {__("Back", "yatra")}
          </Button>
        }
      />

      {!tripId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {__("Trip ID is required", "yatra")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__("Search", "yatra")}
                  </label>
                  <Input
                    type="text"
                    placeholder={__("Search by date...", "yatra")}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Past Departures Table */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  {__("Loading...", "yatra")}
                </div>
              ) : !departuresData?.data?.length ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {__("No past departures found", "yatra")}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{__("Date", "yatra")}</TableHead>
                      <TableHead>{__("Time", "yatra")}</TableHead>
                      <TableHead>{__("Capacity", "yatra")}</TableHead>
                      <TableHead>{__("Booked", "yatra")}</TableHead>
                      <TableHead>{__("Source", "yatra")}</TableHead>
                      <TableHead>{__("Actions", "yatra")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departuresData.data.map((departure: Departure) => (
                      <TableRow key={departure.id}>
                        <TableCell>{formatDate(departure.date)}</TableCell>
                        <TableCell>{departure.time || "--"}</TableCell>
                        <TableCell>{departure.max_capacity}</TableCell>
                        <TableCell>{departure.booked_count}</TableCell>
                        <TableCell>
                          {departure.source === "manual" ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              {__("Manual", "yatra")}
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                              {__("Recurring", "yatra")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {departure.source === "recurring_generated" &&
                            departure.booked_count === 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDelete(
                                    departure.id,
                                    departure.source,
                                    departure.booked_count,
                                  )
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default PastDepartures;
