import React, { useCallback, useEffect, useState } from "react";
import { apiService } from "../../lib/api-client";
import { __ } from "../../lib/i18n";
import { Crown, Star, Zap } from "lucide-react";

type NoticeAction = {
  label: string;
  url: string;
  target?: string;
};

type NoticeItem = {
  id: string;
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
  actions?: NoticeAction[];
};

function typeToClasses(type: NoticeItem["type"]) {
  switch (type) {
    case "success":
      return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/40 text-green-900 dark:text-green-100";
    case "warning":
      return "bg-amber-50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-100";
    case "error":
      return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-100";
    default:
      return "bg-blue-50 dark:bg-blue-950/25 border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-100";
  }
}

export const InlineNotices: React.FC = () => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await apiService.getNotices();
      const data = (res as any)?.data;
      setNotices(Array.isArray(data) ? data : []);
    } catch {
      // Fail silent: notices should never block the UI.
      setNotices([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dismiss = useCallback(
    async (id: string) => {
      // Optimistic UI.
      setNotices((prev) => prev.filter((n) => n.id !== id));
      try {
        await apiService.dismissNotice(id);
      } catch {
        // Reload if dismiss failed (permissions / nonce / etc.)
        load();
      }
    },
    [load],
  );

  if (notices.length === 0) {
    return null;
  }

  const renderUpgradeNotice = (n: NoticeItem) => {
    const primary = Array.isArray(n.actions) ? n.actions[0] : undefined;
    return (
      <div
        key={n.id}
        className="mx-6 mt-4 border border-amber-200/60 dark:border-amber-900/40 rounded-xl overflow-hidden bg-amber-50/60 dark:bg-amber-950/20 shadow-sm"
      >
        <div className="border-l-4 border-amber-400">
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-amber-100/70 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {n.title || __("Upgrade to Pro", "yatra")}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {n.message}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  {__("LIMITED TIME", "yatra")}
                </span>
                <button
                  type="button"
                  onClick={() => dismiss(n.id)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label={__("Dismiss notice", "yatra")}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/15 border-l-4 border-amber-400 px-3 py-2 text-amber-800 dark:text-amber-200 text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {__(
                "Special Offer: Upgrade today and save 30%+ with premium features and priority support.",
                "yatra",
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              {primary?.url && primary?.label && (
                <a
                  href={primary.url}
                  target={primary.target}
                  rel={
                    primary.target === "_blank"
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  {primary.label}
                </a>
              )}
              <button
                type="button"
                onClick={() => dismiss(n.id)}
                className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {__("Maybe later", "yatra")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {notices.map((n) => {
        if (n.id === "buy_pro") {
          return renderUpgradeNotice(n);
        }

        const primary = Array.isArray(n.actions) ? n.actions[0] : undefined;
        return (
          <div
            key={n.id}
            className="mx-6 mt-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                </div>
                <div className="min-w-0">
                  {n.title && (
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {n.title}
                    </div>
                  )}
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {n.message}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {primary?.url && primary?.label && (
                  <a
                    href={primary.url}
                    target={primary.target}
                    rel={
                      primary.target === "_blank"
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                  >
                    {primary.label}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => dismiss(n.id)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label={__("Dismiss notice", "yatra")}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
