import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ToastProvider } from "./components/ui/toast";
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

// Get mount point
const rootElement = document.getElementById("yatra-app-root");

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <App />
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
