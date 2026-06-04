/**
 * App-level error boundary.
 *
 * Catches render/commit-phase exceptions (including DOM reconciliation errors
 * such as "Failed to execute 'removeChild' on 'Node'", which browser
 * auto-translation can trigger by mutating React-managed text nodes) so a
 * single subtree failure degrades to a friendly reload prompt instead of an
 * uncaught exception that white-screens the admin.
 */

import React from "react";
import { __ } from "../lib/i18n";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown): void {
    // Keep a console record for support/debugging; not shown to the user.
    // eslint-disable-next-line no-console
    console.error("Yatra admin caught a rendering error:", error, info);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {__("Something went wrong", "yatra")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            {__(
              "The page hit an unexpected error and needs to reload. Your data is safe.",
              "yatra",
            )}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {__("Reload page", "yatra")}
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
