import React from 'react';
import {
  FileText as FileTextIcon,
  Calendar as CalendarIcon,
  Download,
  Eye,
} from 'lucide-react';
import { __ } from '../../lib/i18n';
import { formatDate } from './utils';
import type { TravelDocument } from './types';

interface DocumentsProps {
  documents: TravelDocument[];
}

const Documents: React.FC<DocumentsProps> = ({ documents }) => {
  const displayDocuments = documents;
  
  // Group documents by category
  const documentsByCategory = {
    itinerary: displayDocuments.filter((d) => d.category === 'itinerary'),
    voucher: displayDocuments.filter((d) => d.category === 'voucher'),
    invoice: displayDocuments.filter((d) => d.category === 'invoice'),
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'itinerary':
        return <FileTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'voucher':
        return <FileTextIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'invoice':
        return <FileTextIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <FileTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'itinerary':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'voucher':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'invoice':
        return 'bg-purple-50 dark:bg-purple-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-900/40';
    }
  };

  return (
    <div className="yatra-documents-page space-y-6">
      {/* Header */}
      <div className="yatra-documents-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <FileTextIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              {__('Travel Documents', 'Travel Documents')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {__('Download itineraries, vouchers, invoices, and other documents for each trip.', 'Download itineraries, vouchers, invoices, and other documents for each trip.')}
            </p>
          </div>
        </div>
      </div>

      {/* Document Statistics */}
      <div className="yatra-documents-stats flex flex-nowrap gap-6 overflow-x-auto">
        <div className="flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Itineraries', 'Itineraries')}</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{documentsByCategory.itinerary.length}</p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Vouchers', 'Vouchers')}</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{documentsByCategory.voucher.length}</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <FileTextIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 yatra-document-stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{__('Invoices', 'Invoices')}</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{documentsByCategory.invoice.length}</p>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <FileTextIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {displayDocuments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
          <FileTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">{__('No documents found', 'No documents found')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">{__('Documents will appear here once you make a booking.', 'Documents will appear here once you make a booking.')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayDocuments.map((doc) => (
            <div
              key={doc.id}
              className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getCategoryBg(doc.category)} flex-shrink-0`}>
                    {getCategoryIcon(doc.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{doc.trip_title}</p>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 truncate">{doc.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {__('Updated', 'Updated')}: {formatDate(doc.updated_at)}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize flex-shrink-0">
                        {doc.category}
                      </span>
                    </div>
                    <div className="yatra-document-actions flex flex-wrap gap-3 mt-4">
                      <div role="button" tabIndex={0} onClick={() => {}} className="yatra-document-action yatra-document-action-download inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer">
                        <Download className="w-4 h-4" />
                        {__('Download', 'Download')}
                      </div>
                      <div role="button" tabIndex={0} onClick={() => {}} className="yatra-document-action yatra-document-action-preview inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer">
                        <Eye className="w-4 h-4" />
                        {__('Preview', 'Preview')}
                      </div>
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

