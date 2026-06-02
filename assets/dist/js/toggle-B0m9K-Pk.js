import { j as jsxRuntimeExports } from "./react-vendor-zODANjVp.js";
const Toggle = ({
  checked,
  onChange,
  disabled = false
}) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": checked,
      disabled,
      onClick: () => !disabled && onChange(!checked),
      className: `
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: `
          inline-block h-5 w-5 transform rounded-full bg-white transition-transform
          ${checked ? "translate-x-5" : "translate-x-0.5"}
        `
        }
      )
    }
  );
};
export {
  Toggle as T
};
//# sourceMappingURL=toggle-B0m9K-Pk.js.map
