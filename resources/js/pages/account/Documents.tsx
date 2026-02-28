import React, { useState } from "react";
import { __ } from "../../lib/i18n";
import { formatDate } from "./utils";
import { downloadDocument } from "./utils/downloads";
import type { TravelDocument } from "./types";

interface DocumentsProps {
  documents: TravelDocument[];
}

const Documents: React.FC<DocumentsProps> = ({ documents }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "itinerary" | "voucher" | "invoice" | "downloads"
  >("all");

  const displayDocuments = documents;

  // Filter documents based on search and category
  let filteredDocuments = [...displayDocuments]; // Create a copy to avoid mutation

  // Apply category filter
  if (selectedCategory !== "all") {
    filteredDocuments = filteredDocuments.filter(
      (d) => d.category === selectedCategory,
    );
  }

  // Apply search
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim();
    filteredDocuments = filteredDocuments.filter((d: any) => {
      const name = d.name || "";
      const tripTitle = d.trip_title || "";
      const category = d.category || "";
      return (
        name.toLowerCase().includes(searchLower) ||
        tripTitle.toLowerCase().includes(searchLower) ||
        category.toLowerCase().includes(searchLower)
      );
    });
  }

  // Group filtered documents by category
  const documentsByCategory = {
    itinerary: filteredDocuments.filter((d) => d.category === "itinerary"),
    voucher: filteredDocuments.filter((d) => d.category === "voucher"),
    invoice: filteredDocuments.filter((d) => d.category === "invoice"),
    downloads: filteredDocuments.filter((d) => d.category === "downloads"),
  };

  return (
    <div className="yatra-documents-page space-y-6">
      {/* Header */}
      <div className="yatra-documents-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {__("Travel Documents", "yatra")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {__(
                "Download itineraries, vouchers, invoices, and other documents for each trip.",
                "yatra",
              )}
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={__("Search documents...", "yatra")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-64 pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(
                    e.target.value as
                      | "all"
                      | "itinerary"
                      | "voucher"
                      | "invoice"
                      | "downloads",
                  )
                }
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">{__("All Documents", "yatra")}</option>
                <option value="itinerary">{__("Itineraries", "yatra")}</option>
                <option value="voucher">{__("Vouchers", "yatra")}</option>
                <option value="invoice">{__("Invoices", "yatra")}</option>
                <option value="downloads">{__("Downloads", "yatra")}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Document Statistics */}
      <div className="yatra-documents-stats flex flex-nowrap gap-6 overflow-x-auto">
        <div className="flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {__("Itinerary", "yatra")}
            </p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {documentsByCategory.itinerary.length}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {__("Voucher", "yatra")}
            </p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {documentsByCategory.voucher.length}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {__("Invoice", "yatra")}
            </p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {documentsByCategory.invoice.length}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {__("Downloads", "yatra")}
            </p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {documentsByCategory.downloads.length}
            </p>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">
            {__("No documents found", "yatra")}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {__(
              "No documents are available yet. Please check back later.",
              "yatra",
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {doc.trip_title}
                        </p>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 truncate">
                          {doc.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {__("Updated", "yatra")}: {formatDate(doc.updated_at)}
                        </p>
                        {doc.category === "downloads" && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {__("Access", "yatra")}:{" "}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {doc.access_label || doc.access || "-"}
                            </span>
                            {doc.locked && doc.locked_reason ? (
                              <span className="ml-2 text-amber-700 dark:text-amber-300">
                                ({doc.locked_reason})
                              </span>
                            ) : null}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {doc.category === "downloads" && doc.access_label && (
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {doc.access_label}
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">
                          {doc.category}
                        </span>
                      </div>
                    </div>
                    <div className="yatra-document-actions flex flex-wrap gap-3 mt-4">
                      {doc.locked || !doc.url ? (
                        <div
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors text-sm font-medium cursor-not-allowed"
                          title={
                            doc.locked_reason || __("Not available", "yatra")
                          }
                        >
                          {__("Not Available", "yatra")}
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            downloadDocument({
                              documentType: doc.category as any,
                              fallbackUrl: doc.url,
                            })
                          }
                          className="yatra-document-action yatra-document-action-download inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          {__("Download", "yatra")}
                        </button>
                      )}

                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="yatra-document-action yatra-document-action-preview inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                          {__("Preview", "yatra")}
                        </a>
                      ) : (
                        <div className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-500 text-sm font-medium cursor-not-allowed">
                          {__("Preview", "yatra")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;
