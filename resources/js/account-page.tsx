/**
 * Frontend Account Page Entry Point
 * Loads the customer account page on the frontend
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AccountPage from "./pages/AccountPage";
import { ToastProvider } from "./components/ui/toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { __ } from "./lib/i18n";
import "./css/index.css";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Get mount point
const rootElement = document.getElementById("yatra-account-page-root");

if (rootElement) {
  // Opt out of browser auto-translation so it never rewrites React-managed
  // text nodes (which otherwise causes "removeChild" reconciliation crashes).
  rootElement.setAttribute("translate", "no");
  rootElement.classList.add("notranslate");

  try {
    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ErrorBoundary>
              <AccountPage />
            </ErrorBoundary>
          </ToastProvider>
        </QueryClientProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error("Error rendering account page:", error);
    const wrap = document.createElement("div");
    wrap.style.cssText = "padding: 40px; text-align: center;";
    const h2 = document.createElement("h2");
    h2.textContent = __("Error loading account page", "yatra");
    const p = document.createElement("p");
    p.textContent = __(
      "Please refresh the page or contact support if the problem continues.",
      "yatra",
    );
    wrap.appendChild(h2);
    wrap.appendChild(p);
    rootElement.replaceChildren(wrap);
  }
}
