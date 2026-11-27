import apiFetch from "@wordpress/api-fetch";
import { useEffect, useState } from "@wordpress/element";
import { SelectControl, Spinner } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

interface TripRow {
  id: number | string;
  title?: string;
}

interface TripPickerProps {
  value: number;
  onChange: (id: number) => void;
  help?: string;
}

let cache: Promise<TripRow[]> | null = null;

/**
 * Published trips, from the public trips endpoint (GET yatra/v1/trips/public —
 * published, non-deleted trips only). Fetched once per editor session.
 */
function loadTrips(): Promise<TripRow[]> {
  if (!cache) {
    cache = apiFetch<{ data?: TripRow[] | { data?: TripRow[] } }>({
      path: "/yatra/v1/trips/public?per_page=100",
    })
      .then((response) => {
        const data = response?.data;
        if (Array.isArray(data)) {
          return data;
        }
        return Array.isArray(data?.data) ? data.data : [];
      })
      .catch(() => {
        cache = null;
        return [];
      });
  }
  return cache;
}

export function TripPicker({ value, onChange, help }: TripPickerProps) {
  const [trips, setTrips] = useState<TripRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTrips().then((rows) => {
      if (!cancelled) {
        setTrips(rows);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (trips === null) {
    return <Spinner />;
  }

  const options = [
    { label: __("Current trip (trip pages)", "yatra"), value: "0" },
    ...trips.map((trip) => ({
      label: String(trip.title || `#${trip.id}`),
      value: String(trip.id),
    })),
  ];

  // Keep a picked trip selectable even if it is no longer in the public list.
  if (value > 0 && !options.some((o) => o.value === String(value))) {
    options.push({ label: `#${value}`, value: String(value) });
  }

  return (
    <SelectControl
      label={__("Trip", "yatra")}
      help={help}
      value={String(value || 0)}
      options={options}
      onChange={(next: string) => onChange(parseInt(next, 10) || 0)}
      __nextHasNoMarginBottom
    />
  );
}
