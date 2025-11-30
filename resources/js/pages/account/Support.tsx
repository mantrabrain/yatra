import React, { useState } from 'react';
import {
  LifeBuoy,
  AlertTriangle,
  CheckCircle,
  Clock as ClockIcon,
  FileText as FileTextIcon,
  Eye,
  Phone as PhoneIcon,
  Mail,
} from 'lucide-react';
import { __ } from '../../lib/i18n';
import { formatDate, getBadge } from './utils';
import type { SupportTicket } from './types';

interface SupportProps {
  tickets: SupportTicket[];
}

const Support: React.FC<SupportProps> = ({ tickets }) => {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  const displayTickets = tickets;

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement ticket submission
    setTicketSubject('');
    setTicketMessage('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'awaiting_response':
        return <ClockIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'open':
        return <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <LifeBuoy className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
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
              {__('Support & Help Center', 'Support & Help Center')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {__('Our team is available 24/7 for urgent requests. Submit a ticket or contact us directly.', 'Our team is available 24/7 for urgent requests. Submit a ticket or contact us directly.')}
            </p>
          </div>
        </div>
      </div>

      {/* Support Statistics */}
      <div className="yatra-support-stats flex flex-nowrap gap-6 overflow-x-auto">
        <div className="flex-shrink-0 yatra-support-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Total Tickets', 'Total Tickets')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{displayTickets.length}</p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <LifeBuoy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 yatra-support-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Open', 'Open')}</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {displayTickets.filter((t) => t.status === 'open' || t.status === 'awaiting_response').length}
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Resolved', 'Resolved')}</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {displayTickets.filter((t) => t.status === 'resolved').length}
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
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{__('Create New Support Ticket', 'Create New Support Ticket')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{__('Describe your issue and we\'ll get back to you as soon as possible.', 'Describe your issue and we\'ll get back to you as soon as possible.')}</p>
          </div>
        </div>
        <form onSubmit={handleSubmitTicket} className="yatra-support-form space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {__('Subject', 'Subject')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder={__('Enter ticket subject', 'Enter ticket subject')}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {__('Message', 'Message')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder={__('How can we help?', 'How can we help?')}
              required
              rows={6}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="yatra-support-submit-btn inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <LifeBuoy className="w-4 h-4" /> {__('Submit Ticket', 'Submit Ticket')}
          </button>
        </form>
      </div>

      {/* Support Tickets List */}
      <div className="yatra-support-tickets bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {__('Your Support Tickets', 'Your Support Tickets')}
          </h3>
        </div>
        {displayTickets.length === 0 ? (
          <div className="text-center py-12">
            <LifeBuoy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">{__('No support tickets yet', 'No support tickets yet')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">{__('Create a ticket above to get started.', 'Create a ticket above to get started.')}</p>
          </div>
        ) : (
          <div className="yatra-support-tickets-list space-y-4">
            {displayTickets.map((ticket) => {
              const isResolved = ticket.status === 'resolved';
              const isAwaiting = ticket.status === 'awaiting_response';

              return (
                <div
                  key={ticket.id}
                  className="yatra-support-ticket-card group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          isResolved ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                          isAwaiting ? 'bg-amber-50 dark:bg-amber-900/20' :
                          'bg-blue-50 dark:bg-blue-900/20'
                        }`}>
                          {getStatusIcon(ticket.status)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{ticket.subject}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {__('Last updated', 'Last updated')}: {formatDate(ticket.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={getBadge(ticket.status)}>{__(ticket.status, ticket.status)}</span>
                      <div role="button" tabIndex={0} onClick={() => {}} className="yatra-support-ticket-view inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer">
                        <Eye className="w-4 h-4" />
                        {__('View', 'View')}
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
      <div className="yatra-support-contact rounded-xl p-6 text-white shadow-xl" style={{ backgroundColor: '#2563eb', backgroundImage: 'linear-gradient(to bottom right, #2563eb, #4f46e5)' }}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg flex-shrink-0">
            <PhoneIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white mb-2">{__('Need Immediate Assistance?', 'Need Immediate Assistance?')}</h3>
            <p className="text-sm text-white/90 mb-4">{__('Call our 24/7 concierge desk for urgent travel support.', 'Call our 24/7 concierge desk for urgent travel support.')}</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-white flex-shrink-0" />
                <a href="tel:+18005550199" className="text-sm font-medium text-white hover:underline">
                  +1-800-555-0199
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-white flex-shrink-0" />
                <a href="mailto:support@yatra.com" className="text-sm font-medium text-white hover:underline">
                  support@yatra.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;

