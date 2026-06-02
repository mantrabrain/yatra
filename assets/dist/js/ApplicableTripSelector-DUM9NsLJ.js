import { r as reactExports, u as useQuery, j as jsxRuntimeExports, aO as Search, D as Loader2, ax as X } from "./react-vendor-zODANjVp.js";
import { _ as __, a as apiClient } from "./index-CG-QHfTA.js";
import { S as Select, B as Button, I as Input } from "../../admin/dist/js/app.js";
const toTripOption = (item) => {
  const id = Number((item == null ? void 0 : item.id) || 0);
  const label = (item == null ? void 0 : item.title) || (item == null ? void 0 : item.name) || (item == null ? void 0 : item.slug) || `Trip #${id}`;
  return { id, label };
};
const ApplicableTripSelector = ({
  value,
  onValueChange,
  selectedTripIds,
  onTripIdsChange,
  description = __(
    "Control whether this applies to all trips or only selected trips."
  ),
  placeholder = __("Click to select trips..."),
  helperText = __("Only the selected trips will be eligible."),
  disabled = false
}) => {
  const [showDropdown, setShowDropdown] = reactExports.useState(false);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [debouncedSearch, setDebouncedSearch] = reactExports.useState("");
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const {
    data: trips = [],
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ["applicable-trips", debouncedSearch],
    queryFn: async () => {
      var _a;
      const params = { per_page: 100 };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      const response = await apiClient.get("/trips", { params });
      const items = ((_a = response == null ? void 0 : response.data) == null ? void 0 : _a.data) || (response == null ? void 0 : response.data) || response || [];
      return Array.isArray(items) ? items.map(toTripOption) : [];
    },
    enabled: value === "specific_trips",
    staleTime: 5 * 60 * 1e3
  });
  const { data: selectedTripsData = [] } = useQuery({
    queryKey: ["selected-trips", selectedTripIds],
    queryFn: async () => {
      var _a;
      if (selectedTripIds.length === 0) return [];
      try {
        const response = await apiClient.get("/trips", {
          params: {
            per_page: 100,
            include: selectedTripIds.join(",")
            // Try to include specific IDs
          }
        });
        const items = ((_a = response == null ? void 0 : response.data) == null ? void 0 : _a.data) || (response == null ? void 0 : response.data) || response || [];
        const trips2 = Array.isArray(items) ? items.map(toTripOption) : [];
        return trips2;
      } catch (error) {
        console.warn("List API failed, trying individual calls:", error);
        const results = await Promise.all(
          selectedTripIds.map(async (id) => {
            try {
              const response = await apiClient.get(`/trips/${id}`);
              if (response == null ? void 0 : response.data) {
                const trip = toTripOption(response.data);
                return trip;
              }
            } catch (error2) {
              console.warn(`Failed to fetch trip ${id}:`, error2);
            }
            return { id, label: `Trip #${id}` };
          })
        );
        return results;
      }
    },
    enabled: selectedTripIds.length > 0,
    staleTime: 10 * 60 * 1e3
    // Cache for 10 minutes
  });
  const tripLookup = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    trips.forEach((trip) => {
      map.set(trip.id, trip.label);
    });
    selectedTripsData.forEach((trip) => {
      map.set(trip.id, trip.label);
    });
    return map;
  }, [trips, selectedTripsData]);
  const selectedChips = reactExports.useMemo(() => {
    const chips = selectedTripIds.map((id) => ({
      id,
      label: tripLookup.get(id) || `Trip #${id}`
    }));
    return chips;
  }, [selectedTripIds, tripLookup]);
  const toggleTrip = (tripId, checked) => {
    if (checked) {
      if (!selectedTripIds.includes(tripId)) {
        onTripIdsChange([...selectedTripIds, tripId]);
      }
    } else {
      onTripIdsChange(selectedTripIds.filter((id) => id !== tripId));
    }
  };
  const clearTrips = (e) => {
    e == null ? void 0 : e.stopPropagation();
    onTripIdsChange([]);
  };
  const handleModeChange = (newValue) => {
    onValueChange(newValue);
    if (newValue === "all" && selectedTripIds.length > 0) {
      onTripIdsChange([]);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-2", children: description }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value,
          onChange: (e) => handleModeChange(e.target.value),
          disabled,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: __("All Trips") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "specific_trips", children: __("Specific Trips") })
          ]
        }
      )
    ] }),
    value === "specific_trips" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `border border-gray-300 dark:border-gray-600 rounded-lg p-2 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800 ${disabled ? "opacity-70 cursor-not-allowed" : ""}`,
          onClick: () => !disabled && setShowDropdown((prev) => !prev),
          children: selectedChips.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
            selectedChips.map((chip) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: "inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded-full h-6 min-w-[24px]",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: chip.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] text-gray-500 font-normal flex-shrink-0", children: [
                    "#",
                    chip.id
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: (e) => {
                        e.stopPropagation();
                        toggleTrip(chip.id, false);
                      },
                      className: "hover:text-blue-600 text-[10px] flex-shrink-0 leading-none",
                      children: "×"
                    }
                  )
                ]
              },
              chip.id
            )),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "sm",
                onClick: clearTrips,
                className: "text-xs text-red-500 hover:text-red-600 px-2 py-0 h-6 flex items-center",
                children: __("Clear")
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: placeholder })
        }
      ),
      helperText && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: helperText }),
      showDropdown && !disabled && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "text",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              placeholder: __("Search trips..."),
              className: "pl-8"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" }),
          isFetching && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-4 h-4 animate-spin text-gray-400 absolute right-2 top-1/2 -translate-y-1/2" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-64 overflow-y-auto", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 text-center text-sm text-gray-500 dark:text-gray-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { className: "w-5 h-5 animate-spin mx-auto mb-2" }),
          __("Loading trips...")
        ] }) : trips.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-gray-100 dark:divide-gray-700", children: trips.map((trip) => {
          const checked = selectedTripIds.includes(trip.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "label",
            {
              className: "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40",
              onClick: (e) => e.stopPropagation(),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked,
                    onChange: (e) => toggleTrip(trip.id, e.target.checked),
                    className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm text-gray-900 dark:text-white truncate", children: trip.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400 dark:text-gray-500", children: [
                  "#",
                  trip.id
                ] })
              ]
            },
            trip.id
          );
        }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-center text-sm text-gray-500 dark:text-gray-400", children: searchTerm ? __("No trips found") : __("No trips available") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
            selectedTripIds.length,
            " ",
            __("selected")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "sm",
              onClick: () => setShowDropdown(false),
              className: "text-xs",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4 mr-1" }),
                __("Close")
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
};
export {
  ApplicableTripSelector as A
};
//# sourceMappingURL=ApplicableTripSelector-DUM9NsLJ.js.map
