var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { r as reactExports, j as jsxRuntimeExports, J as X, I as Info, ap as AlertTriangle, E as AlertCircle, al as CheckCircle2 } from "./react-vendor-CGK9ZD9t.js";
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
class ApiClient {
  constructor() {
    __publicField(this, "baseUrl");
    __publicField(this, "nonce");
    var _a, _b;
    const rawUrl = ((_a = window.yatraAdmin) == null ? void 0 : _a.apiUrl) || "/wp-json/yatra/v1";
    this.baseUrl = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
    this.nonce = ((_b = window.yatraAdmin) == null ? void 0 : _b.nonce) || "";
  }
  async request(endpoint, options = {}, queryParams) {
    const [endpointPath, endpointQuery] = endpoint.split("?");
    const cleanEndpoint = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
    let url;
    if (this.baseUrl.includes("?rest_route=")) {
      const [base, queryString] = this.baseUrl.split("?");
      const params = new URLSearchParams(queryString);
      const restRoute = params.get("rest_route") || "";
      params.set("rest_route", restRoute + cleanEndpoint);
      if (endpointQuery) {
        const endpointParams = new URLSearchParams(endpointQuery);
        endpointParams.forEach((value, key) => {
          params.append(key, value);
        });
      }
      if (queryParams) {
        queryParams.forEach((value, key) => {
          params.append(key, value);
        });
      }
      url = `${base}?${params.toString()}`;
    } else {
      url = `${this.baseUrl}${cleanEndpoint}`;
      if (endpointQuery || queryParams) {
        const params = new URLSearchParams();
        if (endpointQuery) {
          const endpointParams = new URLSearchParams(endpointQuery);
          endpointParams.forEach((value, key) => {
            params.append(key, value);
          });
        }
        if (queryParams) {
          queryParams.forEach((value, key) => {
            params.append(key, value);
          });
        }
        url += `?${params.toString()}`;
      }
    }
    const headers = {
      "Content-Type": "application/json",
      "X-WP-Nonce": this.nonce,
      ...options.headers
    };
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include"
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "An error occurred" }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
  async get(endpoint, config) {
    let queryParams;
    if (config == null ? void 0 : config.params) {
      queryParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== void 0 && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return this.request(endpoint, {
      method: "GET"
    }, queryParams);
  }
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }
  async delete(endpoint, config) {
    return this.request(endpoint, {
      method: "DELETE",
      body: (config == null ? void 0 : config.data) ? JSON.stringify(config.data) : void 0
    });
  }
}
const apiClient = new ApiClient();
export {
  ToastProvider as T,
  __ as _,
  apiClient as a,
  useToast as u
};
//# sourceMappingURL=index-52HewPnd.js.map
