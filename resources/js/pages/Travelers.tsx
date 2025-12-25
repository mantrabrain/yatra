/**
 * Travelers Listing Page
 * Display all travelers from bookings with dynamic columns from Form Builder
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Eye, Mail, Phone, Calendar, MapPin, Trash2 } from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Pagination, Table as SharedTable, BulkActionToolbar } from '../components/shared';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { useToast } from '../components/ui/toast';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  enabled: boolean;
  order: number;
  width?: string;
  locked?: boolean;
}

interface FormConfig {
  traveler_form?: {
    title: string;
    description: string;
    enabled: boolean;
    fields: FormField[];
  };
}

interface Traveler {
  id: string | number;
  booking_id: number;
  booking_reference: string;
  trip_id: number;
  trip_title: string;
  travel_date: string;
  traveler_index: number;
  is_lead: boolean;
  // Dynamic fields
  [key: string]: any;
}

// Fields to exclude from dynamic columns (already shown in fixed columns)
const EXCLUDED_DYNAMIC_FIELDS = [
  'first_name', 'last_name', 'gender', 'nationality', 'phone',
  '_traveller_id', '_is_lead', '_traveller_index',
  'booking_id', 'booking_reference', 'trip_id', 'trip_title', 'travel_date',
  'traveler_index', 'is_lead', 'id',
];

// Country code to full name mapping
const COUNTRY_NAMES: Record<string, string> = {
  'AF': 'Afghanistan', 'AL': 'Albania', 'DZ': 'Algeria', 'AD': 'Andorra', 'AO': 'Angola',
  'AG': 'Antigua and Barbuda', 'AR': 'Argentina', 'AM': 'Armenia', 'AU': 'Australia', 'AT': 'Austria',
  'AZ': 'Azerbaijan', 'BS': 'Bahamas', 'BH': 'Bahrain', 'BD': 'Bangladesh', 'BB': 'Barbados',
  'BY': 'Belarus', 'BE': 'Belgium', 'BZ': 'Belize', 'BJ': 'Benin', 'BT': 'Bhutan',
  'BO': 'Bolivia', 'BA': 'Bosnia and Herzegovina', 'BW': 'Botswana', 'BR': 'Brazil', 'BN': 'Brunei',
  'BG': 'Bulgaria', 'BF': 'Burkina Faso', 'BI': 'Burundi', 'KH': 'Cambodia', 'CM': 'Cameroon',
  'CA': 'Canada', 'CV': 'Cape Verde', 'CF': 'Central African Republic', 'TD': 'Chad', 'CL': 'Chile',
  'CN': 'China', 'CO': 'Colombia', 'KM': 'Comoros', 'CG': 'Congo', 'CD': 'DR Congo',
  'CR': 'Costa Rica', 'CI': 'Ivory Coast', 'HR': 'Croatia', 'CU': 'Cuba', 'CY': 'Cyprus',
  'CZ': 'Czech Republic', 'DK': 'Denmark', 'DJ': 'Djibouti', 'DM': 'Dominica', 'DO': 'Dominican Republic',
  'EC': 'Ecuador', 'EG': 'Egypt', 'SV': 'El Salvador', 'GQ': 'Equatorial Guinea', 'ER': 'Eritrea',
  'EE': 'Estonia', 'SZ': 'Eswatini', 'ET': 'Ethiopia', 'FJ': 'Fiji', 'FI': 'Finland',
  'FR': 'France', 'GA': 'Gabon', 'GM': 'Gambia', 'GE': 'Georgia', 'DE': 'Germany',
  'GH': 'Ghana', 'GR': 'Greece', 'GD': 'Grenada', 'GT': 'Guatemala', 'GN': 'Guinea',
  'GW': 'Guinea-Bissau', 'GY': 'Guyana', 'HT': 'Haiti', 'HN': 'Honduras', 'HU': 'Hungary',
  'IS': 'Iceland', 'IN': 'India', 'ID': 'Indonesia', 'IR': 'Iran', 'IQ': 'Iraq',
  'IE': 'Ireland', 'IL': 'Israel', 'IT': 'Italy', 'JM': 'Jamaica', 'JP': 'Japan',
  'JO': 'Jordan', 'KZ': 'Kazakhstan', 'KE': 'Kenya', 'KI': 'Kiribati', 'KP': 'North Korea',
  'KR': 'South Korea', 'KW': 'Kuwait', 'KG': 'Kyrgyzstan', 'LA': 'Laos', 'LV': 'Latvia',
  'LB': 'Lebanon', 'LS': 'Lesotho', 'LR': 'Liberia', 'LY': 'Libya', 'LI': 'Liechtenstein',
  'LT': 'Lithuania', 'LU': 'Luxembourg', 'MG': 'Madagascar', 'MW': 'Malawi', 'MY': 'Malaysia',
  'MV': 'Maldives', 'ML': 'Mali', 'MT': 'Malta', 'MH': 'Marshall Islands', 'MR': 'Mauritania',
  'MU': 'Mauritius', 'MX': 'Mexico', 'FM': 'Micronesia', 'MD': 'Moldova', 'MC': 'Monaco',
  'MN': 'Mongolia', 'ME': 'Montenegro', 'MA': 'Morocco', 'MZ': 'Mozambique', 'MM': 'Myanmar',
  'NA': 'Namibia', 'NR': 'Nauru', 'NP': 'Nepal', 'NL': 'Netherlands', 'NZ': 'New Zealand',
  'NI': 'Nicaragua', 'NE': 'Niger', 'NG': 'Nigeria', 'MK': 'North Macedonia', 'NO': 'Norway',
  'OM': 'Oman', 'PK': 'Pakistan', 'PW': 'Palau', 'PS': 'Palestine', 'PA': 'Panama',
  'PG': 'Papua New Guinea', 'PY': 'Paraguay', 'PE': 'Peru', 'PH': 'Philippines', 'PL': 'Poland',
  'PT': 'Portugal', 'QA': 'Qatar', 'RO': 'Romania', 'RU': 'Russia', 'RW': 'Rwanda',
  'KN': 'Saint Kitts and Nevis', 'LC': 'Saint Lucia', 'VC': 'Saint Vincent and the Grenadines',
  'WS': 'Samoa', 'SM': 'San Marino', 'ST': 'Sao Tome and Principe', 'SA': 'Saudi Arabia',
  'SN': 'Senegal', 'RS': 'Serbia', 'SC': 'Seychelles', 'SL': 'Sierra Leone', 'SG': 'Singapore',
  'SK': 'Slovakia', 'SI': 'Slovenia', 'SB': 'Solomon Islands', 'SO': 'Somalia', 'ZA': 'South Africa',
  'SS': 'South Sudan', 'ES': 'Spain', 'LK': 'Sri Lanka', 'SD': 'Sudan', 'SR': 'Suriname',
  'SE': 'Sweden', 'CH': 'Switzerland', 'SY': 'Syria', 'TW': 'Taiwan', 'TJ': 'Tajikistan',
  'TZ': 'Tanzania', 'TH': 'Thailand', 'TL': 'Timor-Leste', 'TG': 'Togo', 'TO': 'Tonga',
  'TT': 'Trinidad and Tobago', 'TN': 'Tunisia', 'TR': 'Turkey', 'TM': 'Turkmenistan', 'TV': 'Tuvalu',
  'UG': 'Uganda', 'UA': 'Ukraine', 'AE': 'United Arab Emirates', 'GB': 'United Kingdom', 'US': 'United States',
  'UY': 'Uruguay', 'UZ': 'Uzbekistan', 'VU': 'Vanuatu', 'VA': 'Vatican City', 'VE': 'Venezuela',
  'VN': 'Vietnam', 'YE': 'Yemen', 'ZM': 'Zambia', 'ZW': 'Zimbabwe'
};

// Helper to get full country name from code
const getCountryName = (code: string): string => {
  if (!code) return '';
  const upperCode = code.toUpperCase();
  return COUNTRY_NAMES[upperCode] || code;
};

const Travelers: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [travelerToDelete, setTravelerToDelete] = useState<Traveler | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tripFilter, setTripFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        traveler_info: true,
        trip: true,
        travel_date: true,
        booking_reference: true,
      };
    }
    const saved = window.localStorage.getItem('yatra-travelers-visible-columns');
    return saved
      ? JSON.parse(saved)
      : {
          traveler_info: true,
          trip: true,
          travel_date: true,
          booking_reference: true,
        };
  });

  // Fetch form configuration for dynamic columns
  const { data: formConfigData } = useQuery({
    queryKey: ['booking-form-config'],
    queryFn: async () => {
      const response = await fetch(
        `${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/settings`,
        {
          headers: {
            'X-WP-Nonce': window.yatraAdmin?.nonce || '',
          },
        }
      );
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data?.booking_form_config : null;
    },
  });

  // Store available trips from first page load
  const [availableTrips, setAvailableTrips] = useState<Array<{ id: number; title: string }>>([]);

  // Fetch travelers from API (includes trip info via JOIN, and available_trips in meta on first page)
  const { data, isLoading } = useQuery({
    queryKey: ['travelers', searchTerm, tripFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (searchTerm) params.append('search', searchTerm);
      if (tripFilter) params.append('trip_id', tripFilter);

      const response = await fetch(
        `${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/travelers?${params.toString()}`,
        {
          headers: {
            'X-WP-Nonce': window.yatraAdmin?.nonce || '',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch travelers');
      }

      const result = await response.json();
      
      // Store available trips from meta (returned on first page with no search filter)
      if (result.meta?.available_trips?.length > 0) {
        setAvailableTrips(result.meta.available_trips);
      }
      
      return result;
    },
    enabled: can('yatra_view_bookings'),
  });

  // Use available trips from state for filter dropdown
  const tripsData = useMemo(() => ({ data: availableTrips }), [availableTrips]);

  // Get dynamic columns from form config
  const dynamicColumns = useMemo(() => {
    const formConfig = formConfigData as FormConfig | null;
    if (!formConfig?.traveler_form?.fields) {
      return [];
    }

    // Get enabled fields from form config, sorted by order
    const enabledFields = formConfig.traveler_form.fields
      .filter(field => field.enabled && !EXCLUDED_DYNAMIC_FIELDS.includes(field.id))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return enabledFields.map(field => ({
      id: field.id,
      label: field.label,
      type: field.type,
    }));
  }, [formConfigData]);

  const travelers = data?.data || [];
  const totalTravelers = data?.meta?.total || 0;
  const totalPages = Math.ceil(totalTravelers / perPage);

  const handleViewBooking = (bookingId: number) => {
    window.location.href = `${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings&action=view&id=${bookingId}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Bulk delete travelers
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: (string | number)[] }) => {
      const response = await fetch(
        `${window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1'}/travelers/bulk`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.yatraAdmin?.nonce || '',
          },
          body: JSON.stringify({ action, ids }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to perform bulk traveler action');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travelers'] });
      setSelectedIds([]);
      setBulkAction('');
    },
  });

  const handleBulkApply = () => {
    if (!bulkAction || selectedIds.length === 0) {
      return;
    }

    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };

  // Handle single traveler delete
  const handleDelete = (traveler: Traveler) => {
    setTravelerToDelete(traveler);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!travelerToDelete) return;

    try {
      await bulkMutation.mutateAsync({ action: 'delete', ids: [travelerToDelete.id] });
      showToast(__('Traveler deleted successfully', 'Traveler deleted successfully'), 'success');
      setDeleteDialogOpen(false);
      setTravelerToDelete(null);
    } catch (error: any) {
      showToast(error?.message || __('Failed to delete traveler', 'Failed to delete traveler'), 'error');
    }
  };

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey],
    };
    setVisibleColumns(newVisibleColumns);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('yatra-travelers-visible-columns', JSON.stringify(newVisibleColumns));
    }
  };

  // Column options for the columns dropdown
  const columnOptions = [
    { key: 'traveler_info', label: __('Traveler', 'Traveler'), visible: visibleColumns.traveler_info },
    { key: 'trip', label: __('Trip', 'Trip'), visible: visibleColumns.trip },
    { key: 'travel_date', label: __('Travel Date', 'Travel Date'), visible: visibleColumns.travel_date },
    { key: 'booking_reference', label: __('Booking', 'Booking'), visible: visibleColumns.booking_reference },
  ];

  // Actions for the 3-dot menu
  const actions = [
    {
      key: 'view',
      label: __('View Booking', 'View Booking'),
      icon: <Eye className="w-4 h-4" />,
      onClick: (traveler: Traveler) => handleViewBooking(traveler.booking_id),
    },
    {
      key: 'delete',
      label: __('Delete', 'Delete'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (traveler: Traveler) => handleDelete(traveler),
      variant: 'destructive' as const,
      condition: () => can('yatra_delete_bookings'),
    },
  ];

  // Format cell value based on field type
  const formatCellValue = (value: any, fieldType: string): React.ReactNode => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-gray-400">-</span>;
    }

    switch (fieldType) {
      case 'date':
        return formatDate(value);
      case 'email':
        return (
          <div className="flex items-center gap-1 text-sm">
            <Mail className="w-3 h-3 text-gray-400" />
            <span className="truncate max-w-[150px]">{value}</span>
          </div>
        );
      case 'tel':
        return (
          <div className="flex items-center gap-1 text-sm">
            <Phone className="w-3 h-3 text-gray-400" />
            <span>{value}</span>
          </div>
        );
      case 'country':
        return (
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span>{getCountryName(value)}</span>
          </div>
        );
      default:
        return <span className="text-sm">{String(value)}</span>;
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Travelers', 'Travelers')}
        description={__('View all travelers from bookings', 'View all travelers from bookings')}
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Search Field - Takes most space */}
            <div className="lg:col-span-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={__('Search by name, email, phone, passport...', 'Search by name, email, phone, passport...')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Trip Filter */}
            <div className="lg:col-span-4">
              <Select
                value={tripFilter}
                onChange={(e) => {
                  setTripFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              >
                <option value="all">{__('All Trips', 'All Trips')}</option>
                {tripsData?.data?.map((trip: any) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{__('Total Travelers', 'Total Travelers')}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? <Skeleton className="h-6 w-16" /> : totalTravelers}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk actions toolbar */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        bulkAction={bulkAction}
        setBulkAction={setBulkAction}
        onApply={handleBulkApply}
        onClearSelection={() => setSelectedIds([])}
        statusFilter="all"
        setStatusFilter={() => {}}
        statusOptions={[
          { key: 'all', label: __('All', 'All'), count: totalTravelers },
        ]}
        showColumnsDropdown={showColumnsDropdown}
        setShowColumnsDropdown={setShowColumnsDropdown}
        columnOptions={columnOptions}
        onToggleColumn={toggleColumn}
        bulkMutationPending={bulkMutation.isPending}
        totalItems={travelers.length}
        bulkActionOptions={[
          { value: 'delete', label: __('Delete', 'Delete') },
        ]}
      />

      {/* Travelers Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <SharedTable
            data={travelers}
            isLoading={isLoading}
            isError={false}
            skeletonRows={5}
            emptyText={
              (searchTerm || tripFilter)
                ? __('No travelers found matching your criteria', 'No travelers found matching your criteria')
                : __('No travelers found', 'No travelers found')
            }
            emptyDescription={__('View and manage travelers collected from your bookings.', 'View and manage travelers collected from your bookings.')}
            capability="yatra_view_bookings"
            selectedItemIds={selectedIds}
            onSelectItem={(id: string | number, checked: boolean) => {
              if (checked) {
                setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
              } else {
                setSelectedIds((prev) => prev.filter((existingId) => existingId !== id));
              }
            }}
            onSelectAll={(checked: boolean) => {
              if (checked) {
                setSelectedIds(travelers.map((t: Traveler) => t.id));
              } else {
                setSelectedIds([]);
              }
            }}
            isAllSelected={travelers.length > 0 && selectedIds.length === travelers.length}
            getItemId={(traveler: Traveler) => traveler.id}
            actions={actions}
            columns={[
              visibleColumns.traveler_info && {
                key: 'traveler_info',
                label: __('Traveler', 'Traveler'),
                render: (traveler: Traveler) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                      {(traveler.first_name?.[0] || '?').toUpperCase()}
                      {(traveler.last_name?.[0] || '').toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {[traveler.first_name, traveler.last_name].filter(Boolean).join(' ') || 'N/A'}
                        {traveler.is_lead && (
                          <Badge variant="info" className="text-xs">
                            {__('Lead', 'Lead')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 space-y-0.5">
                        {traveler.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{traveler.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {traveler.gender && <span className="capitalize">{traveler.gender}</span>}
                          {traveler.nationality && (
                            <>
                              {traveler.gender && <span>•</span>}
                              <span>{getCountryName(traveler.nationality)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
              ...dynamicColumns.map(col => ({
                key: `dynamic_${col.id}`,
                label: col.label,
                render: (traveler: Traveler) => formatCellValue(traveler[col.id], col.type),
              })),
              visibleColumns.trip && {
                key: 'trip',
                label: __('Trip', 'Trip'),
                render: (traveler: Traveler) => (
                  <div className="max-w-[200px] truncate" title={traveler.trip_title}>
                    {traveler.trip_title || `Trip #${traveler.trip_id}`}
                  </div>
                ),
              },
              visibleColumns.travel_date && {
                key: 'travel_date',
                label: __('Travel Date', 'Travel Date'),
                render: (traveler: Traveler) => (
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    {formatDate(traveler.travel_date)}
                  </div>
                ),
              },
              visibleColumns.booking_reference && {
                key: 'booking_reference',
                label: __('Booking', 'Booking'),
                render: (traveler: Traveler) => (
                  <a
                    href={`${window.yatraAdmin?.siteUrl || ''}/wp-admin/admin.php?page=yatra&subpage=bookings&action=view&id=${traveler.booking_id}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono text-sm"
                  >
                    {traveler.booking_reference}
                  </a>
                ),
              },
            ].filter(Boolean)}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalTravelers > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalTravelers}
          itemsPerPage={perPage}
          onPageChange={setPage}
          itemName={__('travelers', 'travelers')}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTravelerToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={__('Delete Traveler', 'Delete Traveler')}
        message={
          travelerToDelete
            ? __(`Are you sure you want to delete ${[travelerToDelete.first_name, travelerToDelete.last_name].filter(Boolean).join(' ')}? This action cannot be undone.`, `Are you sure you want to delete ${[travelerToDelete.first_name, travelerToDelete.last_name].filter(Boolean).join(' ')}? This action cannot be undone.`)
            : __('Are you sure you want to delete this traveler?', 'Are you sure you want to delete this traveler?')
        }
        confirmText={__('Delete', 'Delete')}
        cancelText={__('Cancel', 'Cancel')}
        variant="danger"
        isLoading={bulkMutation.isPending}
      />
    </div>
  );
};

export default Travelers;
