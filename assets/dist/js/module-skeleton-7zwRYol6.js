import { j as jsxRuntimeExports } from "./react-vendor-zODANjVp.js";
import { C as Card, d as CardContent, f as CardHeader } from "../../admin/dist/js/app.js";
const Bar = ({ className = "" }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: `animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`
  }
);
const ModulePageSkeleton = ({ variant = "tabs" }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-7 w-48" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-4 w-96 max-w-full" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-9 w-28" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-9 w-24" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-5 w-5 rounded-full" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-4 w-40" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-3 w-full max-w-2xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-3 w-3/4 max-w-xl" })
    ] }) }),
    variant === "tabs" && /* @__PURE__ */ jsxRuntimeExports.jsx(ModuleTabsSkeleton, {}),
    variant === "form" && /* @__PURE__ */ jsxRuntimeExports.jsx(ModuleFormSkeleton, {}),
    variant === "list" && /* @__PURE__ */ jsxRuntimeExports.jsx(ModuleListSkeleton, {})
  ] });
};
const ModuleTabsSkeleton = ({ tabCount = 4, rows = 5, columns = 5 }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-gray-200 dark:border-gray-700 pb-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 -mb-px", children: Array.from({ length: tabCount }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `px-4 py-2.5 ${i === 0 ? "border-b-2 border-gray-300 dark:border-gray-600" : ""}`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-4 w-20" })
      },
      i
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ModuleTableSkeleton, { rows, columns }) })
  ] });
};
const ModuleTableSkeleton = ({ rows = 5, columns = 5 }) => {
  const cols = Math.max(1, columns);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 animate-pulse", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 pb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-9 w-64" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-9 w-32" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-9 w-28" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "grid gap-3 border-b border-gray-200 dark:border-gray-700 pb-2",
        style: { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` },
        children: Array.from({ length: cols }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-3.5" }, i))
      }
    ),
    Array.from({ length: rows }).map((_, rowIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "grid gap-3 py-2",
        style: { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` },
        children: Array.from({ length: cols }).map((_2, colIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          Bar,
          {
            className: `h-4 ${colIndex === 0 ? "w-3/4" : colIndex === cols - 1 ? "w-1/2" : "w-full"}`
          },
          colIndex
        ))
      },
      rowIndex
    ))
  ] });
};
const ModuleFormSkeleton = ({ rows = 6 }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 space-y-5", children: [
    Array.from({ length: rows }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-3.5 w-32" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-10 w-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-3 w-72 max-w-full" })
    ] }, i)),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-10 w-24" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-10 w-28" })
    ] })
  ] }) });
};
const ModuleListSkeleton = ({ rows = 4 }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 animate-pulse", children: Array.from({ length: rows }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-10 w-10 rounded-full flex-shrink-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2 min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-4 w-1/3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-3 w-2/3 max-w-md" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-6 w-16 rounded-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-9 w-9" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-9 w-9" })
    ] })
  ] }) }, i)) });
};
const ModuleStatGridSkeleton = ({ tiles = 4 }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse", children: Array.from({ length: tiles }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-3 w-20" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-7 w-24" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-3 w-32 max-w-full" })
  ] }) }, i)) });
};
const ModuleSectionSkeleton = ({ lines = 4 }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 animate-pulse", children: Array.from({ length: lines }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-3 w-28" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { className: "h-9 w-full" })
  ] }, i)) });
};
export {
  ModulePageSkeleton as M,
  ModuleFormSkeleton as a,
  ModuleListSkeleton as b,
  ModuleTableSkeleton as c,
  ModuleSectionSkeleton as d,
  ModuleStatGridSkeleton as e
};
//# sourceMappingURL=module-skeleton-7zwRYol6.js.map
