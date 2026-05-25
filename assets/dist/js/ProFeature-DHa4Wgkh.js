import { r as reactExports, j as jsxRuntimeExports, ax as X, x as ChevronDown, aO as Search, aA as Check } from "./react-vendor-CqkbFEvK.js";
import { _ as __, j as __$1 } from "./index-DRAt5dnR.js";
import { I as Input, B as Button } from "../../admin/dist/js/app.js";
const MultiSelect = ({
  value,
  onChange,
  options,
  placeholder = __("Select options...", "yatra"),
  searchPlaceholder = __("Search...", "yatra"),
  className = "",
  error = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = reactExports.useState(false);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const containerRef = reactExports.useRef(null);
  const searchInputRef = reactExports.useRef(null);
  const filteredOptions = options.filter(
    (option) => option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const selectedOptions = options.filter(
    (opt) => value.some((v) => String(v) === String(opt.value))
  );
  reactExports.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => {
        var _a;
        (_a = searchInputRef.current) == null ? void 0 : _a.focus();
      }, 100);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);
  const handleToggle = (optionValue) => {
    const isSelected = value.some((v) => String(v) === String(optionValue));
    if (isSelected) {
      onChange(value.filter((v) => String(v) !== String(optionValue)));
    } else {
      onChange([...value, optionValue]);
    }
  };
  const handleRemove = (optionValue, e) => {
    e.stopPropagation();
    onChange(value.filter((v) => String(v) !== String(optionValue)));
  };
  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: containerRef,
      className: `relative ${className}`,
      style: { zIndex: isOpen ? 9999 : "auto" },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => !disabled && setIsOpen(!isOpen),
            className: `flex min-h-11 w-full rounded-md border-2 ${error ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-800 px-3 py-2 text-base ring-offset-white cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-gray-900 dark:focus-within:ring-blue-400 transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex flex-wrap gap-1.5 items-center", children: selectedOptions.length > 0 ? selectedOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "span",
                {
                  className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-sm",
                  children: [
                    option.label,
                    !disabled && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: (e) => handleRemove(option.value, e),
                        className: "hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" })
                      }
                    )
                  ]
                },
                option.value
              )) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500 dark:text-gray-400", children: placeholder }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 ml-2", children: [
                value.length > 0 && !disabled && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: handleClearAll,
                    className: "p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded",
                    "aria-label": __("Clear all", "yatra"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4 text-gray-400" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ChevronDown,
                  {
                    className: `w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`
                  }
                )
              ] })
            ]
          }
        ),
        isOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-72 overflow-visible", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                ref: searchInputRef,
                type: "text",
                placeholder: searchPlaceholder,
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "pl-8 h-9",
                onClick: (e) => e.stopPropagation()
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-52 overflow-y-auto", children: filteredOptions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-3 text-sm text-gray-500 dark:text-gray-400 text-center", children: __("No options found", "yatra") }) : filteredOptions.map((option) => {
            const isSelected = value.some(
              (v) => String(v) === String(option.value)
            );
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => handleToggle(option.value),
                className: `w-full px-3 py-2.5 text-left text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isSelected ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: option.label }),
                  isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" })
                ]
              },
              option.value
            );
          }) }),
          value.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400", children: [
            value.length,
            " ",
            value.length === 1 ? __("selected", "yatra") : __("selected", "yatra")
          ] })
        ] })
      ]
    }
  );
};
const ProBadge = ({ isProActive }) => {
  if (!isProActive) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white", children: "PRO" });
  }
  return null;
};
const ProFeature = ({
  title,
  description,
  moduleName,
  pricingUrl,
  isProActive,
  isModuleEnabled,
  children
}) => {
  const modulesPageUrl = reactExports.useMemo(() => {
    var _a;
    const baseUrl = ((_a = window.yatraAdmin) == null ? void 0 : _a.siteUrl) ? `${window.yatraAdmin.siteUrl}/wp-admin/admin.php?page=yatra` : "/wp-admin/admin.php?page=yatra";
    return `${baseUrl}&subpage=modules`;
  }, []);
  if (isProActive && isModuleEnabled) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
  }
  if (isProActive && !isModuleEnabled) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "svg",
        {
          className: "w-6 h-6 text-amber-500",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 2,
              d: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-sm font-semibold text-amber-900 dark:text-amber-100", children: [
          __$1("Please activate", "yatra"),
          " ",
          moduleName
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-amber-700 dark:text-amber-300 mt-1", children: [
          __$1("You have Yatra Pro installed. Enable the", "yatra"),
          " ",
          moduleName,
          " ",
          __$1("module to access", "yatra"),
          " ",
          description.toLowerCase(),
          " ",
          __$1("features.", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            onClick: () => window.open(modulesPageUrl, "_blank"),
            className: "mt-3 bg-amber-600 hover:bg-amber-700 text-white",
            children: __$1("Activate Module", "yatra")
          }
        )
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "svg",
      {
        className: "w-6 h-6 text-purple-500",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-sm font-semibold text-purple-900 dark:text-purple-100", children: [
        __$1("Upgrade to Pro for", "yatra"),
        " ",
        moduleName
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-purple-700 dark:text-purple-300 mt-1", children: __$1(
        `Get Yatra Pro to access ${description} and unlock all premium features.`,
        "yatra"
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "a",
        {
          href: pricingUrl,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all",
          children: [
            __$1("Upgrade to Pro", "yatra"),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "svg",
              {
                className: "w-4 h-4",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  }
                )
              }
            )
          ]
        }
      )
    ] })
  ] }) });
};
export {
  MultiSelect as M,
  ProBadge as P,
  ProFeature as a
};
//# sourceMappingURL=ProFeature-DHa4Wgkh.js.map
