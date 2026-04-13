/**
 * Independent Location Picker Component
 * Allows users to either manually enter location details or select from OpenStreetMap
 * Fully reusable across different forms and contexts
 */

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Globe, X, Loader2 } from "lucide-react";

// Translation function - can be overridden via props
const defaultTranslate = (key: string) => {
  const translations: Record<string, string> = {
    "Enter location name": "Enter location name",
    "Show Map": "Show Map",
    "Hide Map": "Hide Map",
    Clear: "Clear",
    "Coordinates:": "Coordinates:",
    "Search for a location...": "Search for a location...",
    "Click on the map to set the location, or search for a place above.":
      "Click on the map to set the location, or search for a place above.",
  };
  return translations[key] || key;
};

export interface LocationData {
  name: string;
  latitude: string;
  longitude: string;
}

interface LocationPickerProps {
  // Core functionality
  value: LocationData;
  onChange: (location: LocationData) => void;

  // Display options
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;

  // Map options
  showMapButton?: boolean;
  defaultMapCenter?: [number, number]; // [lat, lng]
  defaultZoom?: number;
  mapHeight?: string;

  // Search options
  searchPlaceholder?: string;
  searchLimit?: number;

  // Styling
  className?: string;
  inputClassName?: string;
  mapClassName?: string;

  // Translation function (optional)
  __?: (key: string, domain?: string) => string;

  // Events
  onLocationSelect?: (location: LocationData) => void;
  onLocationClear?: () => void;
  onMapToggle?: (isOpen: boolean) => void;

  // Validation
  validateCoordinates?: (lat: string, lng: string) => boolean;
  errorMessage?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  label,
  helpText,
  required = false,
  showMapButton = true,
  defaultMapCenter = [25.2048, 55.2708], // Dubai coordinates
  defaultZoom = 13,
  mapHeight = "300px",
  searchLimit = 5,
  className = "",
  inputClassName = "",
  mapClassName = "",
  __: translate = defaultTranslate,
  onLocationSelect,
  onLocationClear,
  onMapToggle,
}) => {
  const [showMap, setShowMap] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Update marker when coordinates change and map is already initialized
  useEffect(() => {
    if (mapInstanceRef.current && value.latitude && value.longitude) {
      const lat = parseFloat(value.latitude);
      const lng = parseFloat(value.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        // Small delay to ensure map is fully ready
        setTimeout(() => {
          if (mapInstanceRef.current) {
            // Add or update marker
            addMarker(mapInstanceRef.current, lat, lng);

            // Update map view to new coordinates
            mapInstanceRef.current.setView([lat, lng], defaultZoom);
          }
        }, 100);
      }
    }
  }, [value.latitude, value.longitude, defaultZoom]);

  // Load Leaflet dynamically when map is shown
  useEffect(() => {
    if (showMap && !mapLoading && !mapInstanceRef.current) {
      loadMap();
    }
  }, [showMap]);

  // Add marker when map becomes ready with existing coordinates
  useEffect(() => {
    if (
      mapReady &&
      mapInstanceRef.current &&
      value.latitude &&
      value.longitude
    ) {
      const lat = parseFloat(value.latitude);
      const lng = parseFloat(value.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            addMarker(mapInstanceRef.current, lat, lng);
            mapInstanceRef.current.setView([lat, lng], defaultZoom);
          }
        }, 150);
      }
    }
  }, [mapReady]);

  const loadMap = async () => {
    setMapLoading(true);

    try {
      // Load Leaflet CSS and JS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const leafletCSS = document.createElement("link");
        leafletCSS.rel = "stylesheet";
        leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        leafletCSS.integrity =
          "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        leafletCSS.crossOrigin = "";
        document.head.appendChild(leafletCSS);
      }

      if (!window.L) {
        const leafletJS = document.createElement("script");
        leafletJS.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        leafletJS.integrity =
          "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
        leafletJS.crossOrigin = "";
        document.head.appendChild(leafletJS);

        leafletJS.onload = initializeMap;
      } else {
        initializeMap();
      }
    } catch (error) {
      console.error("Error loading map:", error);
      setMapLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return;

    const L = window.L;

    // Initialize map with default view or current coordinates
    const lat = value.latitude
      ? parseFloat(value.latitude)
      : defaultMapCenter[0];
    const lng = value.longitude
      ? parseFloat(value.longitude)
      : defaultMapCenter[1];

    const map = L.map(mapRef.current).setView([lat, lng], defaultZoom);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add marker if coordinates exist
    if (value.latitude && value.longitude) {
      addMarker(map, lat, lng);
    }

    // Handle map clicks
    map.on("click", function (e: any) {
      const { lat, lng } = e.latlng;
      addMarker(map, lat, lng);

      // Reverse geocode to get location name
      reverseGeocode(lat, lng);
    });

    mapInstanceRef.current = map;
    setMapLoading(false);
    setMapReady(true);
  };

  const addMarker = (map: any, lat: number, lng: number) => {
    const L = window.L;

    // Remove existing marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    // Create custom marker
    const customIcon = L.divIcon({
      html: '<div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><svg style="transform: rotate(45deg); width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      className: "yatra-custom-marker",
    });

    const marker = L.marker([lat, lng], {
      icon: customIcon,
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    // Handle marker drag events
    marker.on("dragend", function (e: any) {
      const position = e.target.getLatLng();
      const newLat = position.lat;
      const newLng = position.lng;

      // Update form values
      const newLocation = {
        ...value,
        latitude: newLat.toString(),
        longitude: newLng.toString(),
      };
      onChange(newLocation);

      // Reverse geocode to get updated location name
      reverseGeocode(newLat, newLng);
    });

    // Update form values
    const newLocation = {
      ...value,
      latitude: lat.toString(),
      longitude: lng.toString(),
    };
    onChange(newLocation);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Use WordPress AJAX endpoint to avoid CORS issues
      const formData = new FormData();
      formData.append("action", "yatra_reverse_geocode");
      formData.append("lat", lat.toString());
      formData.append("lng", lng.toString());
      formData.append(
        "nonce",
        (window as any).yatraAdmin?.geocodingNonce || "",
      );

      const response = await fetch(
        (window as any).yatraAdmin?.ajaxUrl || "/wp-admin/admin-ajax.php",
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.result) {
          const data = result.data.result;
          const locationName =
            data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          const newLocation = {
            ...value,
            name: locationName,
            latitude: lat.toString(),
            longitude: lng.toString(),
          };
          onChange(newLocation);
          return;
        }
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }

    // Fallback: always update with coordinates if reverse geocoding fails
    const locationName = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const newLocation = {
      ...value,
      name: locationName,
      latitude: lat.toString(),
      longitude: lng.toString(),
    };
    onChange(newLocation);
  };

  // Debounced search for better performance
  const searchTimeoutRef = useRef<number>();

  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Use WordPress AJAX endpoint to avoid CORS issues
      const formData = new FormData();
      formData.append("action", "yatra_search_locations");
      formData.append("query", query);
      formData.append("limit", searchLimit.toString());
      formData.append(
        "nonce",
        (window as any).yatraAdmin?.geocodingNonce || "",
      );

      const response = await fetch(
        (window as any).yatraAdmin?.ajaxUrl || "/wp-admin/admin-ajax.php",
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSearchResults(result.data.results);
        } else {
          console.error("Search error:", result.data.message);
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error("Error searching locations:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search with 300ms delay
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(query);
    }, 300);
  };

  const selectLocation = (location: any) => {
    const lat = parseFloat(location.lat);
    const lng = parseFloat(location.lon);

    const newLocation = {
      name: location.display_name,
      latitude: lat.toString(),
      longitude: lng.toString(),
    };

    onChange(newLocation);
    onLocationSelect?.(newLocation);

    // Update map if it's open
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      addMarker(mapInstanceRef.current, lat, lng);
    }

    // Reset search
    setSearchQuery("");
    setSearchResults([]);
  };

  const clearLocation = () => {
    const emptyLocation = { name: "", latitude: "", longitude: "" };
    onChange(emptyLocation);
    onLocationClear?.();

    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  };

  const toggleMap = () => {
    const newState = !showMap;
    setShowMap(newState);
    onMapToggle?.(newState);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-normal text-gray-500 dark:text-gray-400">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {showMapButton && (
          <button
            type="button"
            onClick={toggleMap}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
          >
            <MapPin className="w-3 h-3" />
            {showMap ? translate("Hide Map") : translate("Show Map")}
          </button>
        )}
      </div>

      {/* Search Input Field with Suggestions */}
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery || value.name}
            onChange={(e) => {
              const query = e.target.value;
              setSearchQuery(query);
              handleSearchChange({
                target: { value: query },
              } as React.ChangeEvent<HTMLInputElement>);
              // Also update the location name directly for manual entry
              onChange({ ...value, name: query });
            }}
            placeholder="Type location here..."
            className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${inputClassName}`}
          />
          {searchLoading ? (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          ) : searchQuery || value.name ? (
            <button
              type="button"
              onClick={() => {
                clearLocation();
                setSearchQuery("");
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            style={{ zIndex: 9999 }}
          >
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectLocation(result)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {result.display_name.split(",")[0]}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {result.display_name.split(",").slice(1).join(",").trim()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Coordinates Display */}
      {(value.latitude || value.longitude) && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Globe className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {translate("Coordinates:")} {value.latitude || "0"},{" "}
            {value.longitude || "0"}
          </span>
        </div>
      )}

      {/* Map Interface */}
      {showMap && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          {/* Map Container */}
          <div className="relative">
            {mapLoading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            )}
            <div
              ref={mapRef}
              style={{ height: mapHeight, width: "100%" }}
              className={`bg-gray-100 ${mapClassName}`}
            />
          </div>

          {/* Instructions */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
            {translate(
              "Click on the map to set the location, or drag the marker to adjust coordinates.",
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      {helpText && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </div>
      )}
    </div>
  );
};

// Add TypeScript declaration for Leaflet
declare global {
  interface Window {
    L: any;
  }
}
