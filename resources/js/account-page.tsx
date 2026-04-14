/**
 * Frontend Account Page Entry Point
 * Loads the customer account page on the frontend
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AccountPage from "./pages/AccountPage";
import { ToastProvider } from "./components/ui/toast";
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
  try {
    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AccountPage />
          </ToastProvider>
        </QueryClientProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error("Error rendering account page:", error);
    rootElement.innerHTML =
      '<div style="padding: 40px; text-align: center;"><h2>Error loading account page</h2><p>Please refresh the page or contact support.</p></div>';
  }
}
