import { j as jsxRuntimeExports, r as reactExports } from "./react-vendor-BJn7BIDO.js";
import { B as Button } from "../../admin/dist/js/app.js";
import { o as __ } from "./index-CH-UeeqR.js";
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
          __("Please activate", "yatra"),
          " ",
          moduleName
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-amber-700 dark:text-amber-300 mt-1", children: [
          __("You have Yatra Pro installed. Enable the", "yatra"),
          " ",
          moduleName,
          " ",
          __("module to access", "yatra"),
          " ",
          description.toLowerCase(),
          " ",
          __("features.", "yatra")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            onClick: () => window.open(modulesPageUrl, "_blank"),
            className: "mt-3 bg-amber-600 hover:bg-amber-700 text-white",
            children: __("Activate Module", "yatra")
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
        __("Upgrade to Pro for", "yatra"),
        " ",
        moduleName
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-purple-700 dark:text-purple-300 mt-1", children: __(
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
            __("Upgrade to Pro", "yatra"),
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
  ProBadge as P,
  ProFeature as a
};
//# sourceMappingURL=ProFeature-CoknA3cp.js.map
