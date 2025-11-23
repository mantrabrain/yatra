import { r as reactExports, j as jsxRuntimeExports, J as X, I as Info, ap as AlertTriangle, E as AlertCircle, al as CheckCircle2 } from "./react-vendor-B9jO9ufg.js";
const __ = (key, defaultValue = "") => {
  var _a;
  const translations = ((_a = window.yatraAdmin) == null ? void 0 : _a.translations) || {};
  return translations[key] || defaultValue || key;
};
const ToastContext = reactExports.createContext(void 0);
const useToast = () => {
  const context = reactExports.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = reactExports.useState([]);
  const showToast = reactExports.useCallback((message, type = "success", duration = 4e3) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);
  const removeToast = reactExports.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ToastContext.Provider, { value: { showToast, removeToast }, children: [
    children,
    /* @__PURE__ */ jsxRuntimeExports.jsx(ToastContainer, { toasts, onRemove: removeToast })
  ] });
};
const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none", children: toasts.map((toast) => /* @__PURE__ */ jsxRuntimeExports.jsx(ToastItem, { toast, onRemove }, toast.id)) });
};
const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);
  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "w-5 h-5 text-green-600" });
      case "error":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5 text-red-600" });
      case "warning":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "w-5 h-5 text-yellow-600" });
      case "info":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-5 h-5 text-blue-600" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-5 h-5 text-gray-600" });
    }
  };
  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
      case "error":
        return "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-400";
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `
        pointer-events-auto
        flex items-start gap-3
        p-4 rounded-lg border
        shadow-lg backdrop-blur-sm
        min-w-[320px] max-w-[400px]
        transition-all duration-300 ease-out
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        ${getStyles()}
      `,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 mt-0.5", children: getIcon() }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 text-sm font-medium", children: toast.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleRemove,
            className: "flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors",
            "aria-label": __("Close", "Close"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
          }
        )
      ]
    }
  );
};
export {
  ToastProvider as T,
  __ as _,
  useToast as u
};
//# sourceMappingURL=index-DYr_m6Td.js.map
