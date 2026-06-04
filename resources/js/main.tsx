import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ToastProvider } from "./components/ui/toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./css/index.css";

// Create React Query client with proper configuration
let queryClient: QueryClient;

try {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });
} catch (error) {
  console.error("Error initializing QueryClient:", error);
  // Fallback: create with minimal config
  queryClient = new QueryClient();
}

// When a lazily-loaded page chunk fails to load — almost always because a new
// build replaced the content-hashed chunk while this tab still holds an old
// reference — Vite fires `vite:preloadError`. Reload once to fetch the current
// bundle instead of crashing with "Failed to fetch dynamically imported module".
// The time-based guard prevents a reload loop if the chunk is genuinely missing.
window.addEventListener("vite:preloadError", () => {
  const KEY = "yatra-last-chunk-reload";
  const last = Number(window.sessionStorage.getItem(KEY) || 0);
  const now = Date.now();
  if (now - last > 10000) {
    window.sessionStorage.setItem(KEY, String(now));
    window.location.reload();
  }
});

// Get mount point
const rootElement = document.getElementById("yatra-app-root");

if (rootElement) {
  // Tell browser translation engines (Google Translate, Edge, etc.) not to
  // rewrite React-managed text nodes. When they do, the DOM no longer matches
  // React's fiber tree and unmounting a subtree throws
  // "Failed to execute 'removeChild' on 'Node'". Opting out here keeps
  // reconciliation safe without changing any behaviour.
  rootElement.setAttribute("translate", "no");
  rootElement.classList.add("notranslate");

  try {
    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </ToastProvider>
        </QueryClientProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error("Error rendering React app:", error);
    rootElement.innerHTML =
      '<div style="padding: 40px; text-align: center;"><h2>Error loading Yatra Admin</h2><p>Please refresh the page or contact support.</p></div>';
  }
}
