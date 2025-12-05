/**
 * Upcoming Departures Widget
 * Displays trips with upcoming departure dates
 */

import React from 'react';
import { __ } from '../../lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';

interface Departure {
  id: number;
  trip_id?: number;
  trip_title: string;
  departure_date: string;
  available_spots: number;
  total_spots: number;
  status: string;
  destination?: string;
}

interface UpcomingDeparturesProps {
  departures: Departure[];
  loading?: boolean;
  onView?: (departure: Departure) => void;
}

/**
 * Upcoming Departures Widget
 */
export const UpcomingDepartures: React.FC<UpcomingDeparturesProps> = ({
  departures,
  loading = false,
  onView,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const departure = new Date(dateString);
    const diffTime = departure.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{__('Upcoming Departures', 'Upcoming Departures')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {__('Loading...', 'Loading...')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{__('Upcoming Departures', 'Upcoming Departures')}</CardTitle>
      </CardHeader>
      <CardContent>
        {departures && departures.length > 0 ? (
          <div className="space-y-2">
            {departures.slice(0, 5).map((departure) => {
              const daysUntil = getDaysUntil(departure.departure_date);
              const total = Number(departure.total_spots) || 0;
              let occupancy = 0;
              if (total > 0) {
                occupancy = ((total - Number(departure.available_spots || 0)) / total) * 100;
              }
              // Clamp to [0, 100] to avoid negative or >100 values
              occupancy = Math.max(0, Math.min(100, occupancy));
              
              return (
                <div
                  key={departure.id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (onView) {
                      onView(departure);
                      return;
                    }
                    const admin = (window as any)?.yatraAdmin;
                    const baseUrl = admin?.siteUrl || '';
                    const tripId = departure.trip_id || '';
                    const query = `?page=yatra&subpage=departures&action=view&id=${departure.id}${tripId ? `&trip_id=${tripId}` : ''}`;
                    window.location.href = `${baseUrl}/wp-admin/admin.php${query}`;
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {departure.trip_title}
                      </h4>
                      {departure.destination && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{departure.destination}</span>
                        </div>
                      )}
                    </div>
                    {daysUntil >= 0 && daysUntil <= 7 && (
                      <Badge variant={daysUntil <= 3 ? 'error' : 'warning'}>
                        {daysUntil === 0 
                          ? __('Today', 'Today')
                          : daysUntil === 1
                          ? __('Tomorrow', 'Tomorrow')
                          : `${daysUntil} ${__('days', 'days')}`
                        }
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(departure.departure_date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {departure.available_spots} / {departure.total_spots} {__('available', 'available')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                      {occupancy.toFixed(0)}% {__('occupied', 'occupied')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {__('No upcoming departures', 'No upcoming departures')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingDepartures;

