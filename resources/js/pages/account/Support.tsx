import React, { useState } from "react";
import {
  LifeBuoy,
  AlertTriangle,
  CheckCircle,
  Clock as ClockIcon,
  FileText as FileTextIcon,
  Eye,
  Phone as PhoneIcon,
  Mail,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { formatDate, getBadge, phoneToTelHref, getYatraAccountPageGlobals } from "./utils";
import type { SupportTicket } from "./types";

interface SupportProps {
  tickets: SupportTicket[];
}

const Support: React.FC<SupportProps> = ({ tickets }) => {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const accountShell = getYatraAccountPageGlobals();
  const supportTel = phoneToTelHref(accountShell.companyPhone);
  const supportMail = String(accountShell.companyEmail || "").trim();

  const displayTickets = tickets;

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement ticket submission
    setTicketSubject("");
    setTicketMessage("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return (
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        );
      case "awaiting_response":
        return (
          <ClockIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        );
      case "open":
        return (
          <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        );
      default:
        return (
          <LifeBuoy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  return (
    <div className="yatra-support-page space-y-6">
      {/* Header */}
      <div className="yatra-support-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <LifeBuoy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              {__("Support & Help Center", "yatra")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {__(
                "Our team is available 24/7 for urgent requests. Submit a ticket or contact us directly.",
                "yatra",
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Support Statistics */}
      <div className="yatra-support-stats flex flex-nowrap gap-6 overflow-x-auto">
        <div className="flex-shrink-0 yatra-support-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {__("Total Tickets", "yatra")}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {displayTickets.length}
              </p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <LifeBuoy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 yatra-support-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {__("Open", "yatra")}
              </p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {
                  displayTickets.filter(
                    (t) =>
                      t.status === "open" || t.status === "awaiting_response",
                  ).length
                }
              </p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 yatra-support-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {__("Resolved", "yatra")}
              </p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {displayTickets.filter((t) => t.status === "resolved").length}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Create New Ticket */}
      <div className="yatra-support-form-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="yatra-support-form-header flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <LifeBuoy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {__("Create a new support ticket", "yatra")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {__(
                "Please describe your issue and we will get back to you as soon as possible.",
                "yatra",
              )}
            </p>
          </div>
        </div>
        <form
          onSubmit={handleSubmitTicket}
          className="yatra-support-form space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {__("Subject", "yatra")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder={__("Enter ticket subject", "yatra")}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {__("Message", "yatra")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder={__("How can we help?", "yatra")}
              required
              rows={6}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="yatra-support-submit-btn inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <LifeBuoy className="w-4 h-4" /> {__("Submit Ticket", "yatra")}
          </button>
        </form>
      </div>

      {/* Support Tickets List */}
      <div className="yatra-support-tickets bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {__("Your Support Tickets", "yatra")}
          </h3>
        </div>
        {displayTickets.length === 0 ? (
          <div className="text-center py-12">
            <LifeBuoy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">
              {__("No support tickets yet", "yatra")}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {__("Create a ticket above to get started.", "yatra")}
            </p>
          </div>
        ) : (
          <div className="yatra-support-tickets-list space-y-4">
            {displayTickets.map((ticket) => {
              const isResolved = ticket.status === "resolved";
              const isAwaiting = ticket.status === "awaiting_response";

              return (
                <div
                  key={ticket.id}
                  className="yatra-support-ticket-card group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isResolved
                              ? "bg-emerald-50 dark:bg-emerald-900/20"
                              : isAwaiting
                                ? "bg-amber-50 dark:bg-amber-900/20"
                                : "bg-blue-50 dark:bg-blue-900/20"
                          }`}
                        >
                          {getStatusIcon(ticket.status)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                            {ticket.subject}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {__("Last updated", "yatra")}:{" "}
                            {formatDate(ticket.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={getBadge(ticket.status)}>
                        {__(ticket.status, ticket.status)}
                      </span>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {}}
                        className="yatra-support-ticket-view inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        {__("View", "yatra")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div
        className="yatra-support-contact rounded-xl p-6 text-white shadow-xl"
        style={{
          backgroundColor: "#2563eb",
          backgroundImage: "linear-gradient(to bottom right, #2563eb, #4f46e5)",
        }}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg flex-shrink-0">
            <PhoneIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white mb-2">
              {__("Need Immediate Assistance?", "yatra")}
            </h3>
            <p className="text-sm text-white/90 mb-4">
              {__(
                "Call our 24/7 concierge desk for urgent travel support.",
                "yatra",
              )}
            </p>
            <div className="flex flex-wrap gap-4">
              {supportTel ? (
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-white flex-shrink-0" />
                  <a
                    href={supportTel}
                    className="text-sm font-medium text-white hover:underline"
                  >
                    {accountShell.companyPhone}
                  </a>
                </div>
              ) : null}
              {supportMail ? (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-white flex-shrink-0" />
                  <a
                    href={`mailto:${encodeURIComponent(supportMail)}`}
                    className="text-sm font-medium text-white hover:underline break-all"
                  >
                    {supportMail}
                  </a>
                </div>
              ) : null}
              {!supportTel && !supportMail ? (
                <p className="text-sm text-white/80">
                  {__(
                    "Contact details are not configured. Please reach out through your booking confirmation email.",
                    "yatra",
                  )}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
