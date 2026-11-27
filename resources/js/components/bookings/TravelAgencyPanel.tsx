/**
 * Booking view: the travel agency that made this booking (Pro "Travel
 * Agencies" module). Shown only while the module is enabled; an editor can
 * link the booking to an agency or remove the link.
 *
 * @package Yatra
 */

import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import { __ } from "../../lib/i18n";
import { apiClient } from "../../lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { useToast } from "../ui/toast";

interface Props {
  bookingId: number;
  canEdit: boolean;
}

export const TravelAgencyPanel: React.FC<Props> = ({ bookingId, canEdit }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [choice, setChoice] = useState<string>("0");
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["booking-travel-agency", bookingId],
    queryFn: async () => await apiClient.get(`/bookings/${bookingId}/travel-agency`),
    enabled: bookingId > 0,
  });
  const agency = (data as any)?.data?.agency ?? null;
  const agencies: { id: number; name: string }[] = (data as any)?.data?.agencies ?? [];

  useEffect(() => {
    setChoice(agency ? String(agency.id) : "0");
  }, [agency?.id]);

  if (isLoading || (!agency && !canEdit && !isError)) {
    return null;
  }

  // Never say "not booked through an agency" when we simply couldn't ask.
  if (isError) {
    return (
      <Card data-testid="booking-travel-agency-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            {__("Travel Agency", "yatra")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-500 dark:text-gray-400">
          {__("The travel agency for this booking could not be loaded.", "yatra")}
        </CardContent>
      </Card>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.post(`/bookings/${bookingId}/travel-agency`, { agency_id: Number(choice) });
      showToast(__("Saved.", "yatra"), "success");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["booking-travel-agency", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking-activity", bookingId] });
    } catch (e: any) {
      showToast(e?.message || __("Could not be saved.", "yatra"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card data-testid="booking-travel-agency-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          {__("Travel Agency", "yatra")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!editing ? (
          <>
            {agency ? (
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{agency.name}</div>
                <div className="text-gray-600 dark:text-gray-300">
                  {agency.contact_name ? `${agency.contact_name} · ` : ""}
                  {agency.email}
                </div>
                {agency.billing_email && agency.billing_email !== agency.email ? (
                  <div className="text-gray-500 dark:text-gray-400">
                    {__("Billing:", "yatra")} {agency.billing_email}
                  </div>
                ) : null}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {__("The contact details on this booking are the guest's.", "yatra")}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                {__("Not booked through an agency.", "yatra")}
              </div>
            )}
            {canEdit && agencies.length > 0 ? (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                {agency ? __("Change", "yatra") : __("Link to an agency", "yatra")}
              </Button>
            ) : null}
          </>
        ) : (
          <div className="space-y-2">
            <Select
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
              aria-label={__("Travel Agency", "yatra")}
            >
              <option value="0">{__("No agency", "yatra")}</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? __("Saving…", "yatra") : __("Save", "yatra")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                {__("Cancel", "yatra")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TravelAgencyPanel;
