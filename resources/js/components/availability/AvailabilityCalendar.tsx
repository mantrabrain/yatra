/**
 * Availability Calendar Component
 * Displays availability dates in a calendar grid with color coding
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, Bell, Ban, Edit, Eye } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { __ } from '../../lib/i18n';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useNavigate } from '../../hooks/useNavigate';

interface AvailabilityDate {
  id: string;
  departure_date: string;
  departure_time?: string;
  arrival_date: string;
  arrival_time?: string;
  total_seats: number;
  booked_seats: number;
  available_seats: number;
  waitlist_count: number;
  status: 'available' | 'sold_out' | 'limited' | 'closed' | 'blocked' | 'cancelled';
  is_blocked?: boolean;
  block_reason?: string;
  alert_threshold?: number;
  original_price: string;
  discounted_price: string;
}

interface AvailabilityCalendarProps {
  dates: AvailabilityDate[];
  tripType?: 'single_day' | 'multi_day';
  currency?: string;
  onDateClick?: (date: AvailabilityDate) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  dates,
  tripType = 'multi_day',
  currency = 'USD',
  onDateClick,
}) => {
  const { navigate } = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group dates by departure date
  const datesByDate = useMemo(() => {
    const grouped: Record<string, AvailabilityDate[]> = {};
    dates.forEach(date => {
      const key = date.departure_date;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(date);
    });
    return grouped;
  }, [dates]);

  // Get availability info for a specific date
  const getDateAvailability = (date: Date): AvailabilityDate[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return datesByDate[dateKey] || [];
  };

  // Get color class based on availability status
  const getDateColorClass = (dateAvailabilities: AvailabilityDate[]): string => {
    if (dateAvailabilities.length === 0) {
      return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }

    // Check if any date is blocked
    if (dateAvailabilities.some(d => d.is_blocked)) {
      return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-800';
    }

    // Check if all are sold out
    if (dateAvailabilities.every(d => d.available_seats === 0 || d.status === 'sold_out')) {
      return 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
    }

    // Check if any has low availability (below threshold)
    const hasLowAvailability = dateAvailabilities.some(d => {
      const threshold = d.alert_threshold || 5;
      return d.available_seats > 0 && d.available_seats <= threshold;
    });

    if (hasLowAvailability) {
      return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800';
    }

    // Check if any has limited availability
    if (dateAvailabilities.some(d => d.status === 'limited')) {
      return 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800';
    }

    // Available
    return 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-800';
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
    };
    return symbols[currency] || currency;
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={previousMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={nextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, dayIdx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const dateAvailabilities = getDateAvailability(day);
            const colorClass = getDateColorClass(dateAvailabilities);
            const hasMultipleSlots = dateAvailabilities.length > 1;

            return (
              <div
                key={dayIdx}
                className={`
                  min-h-[80px] p-1 border-r border-b border-gray-200 dark:border-gray-700
                  ${isCurrentMonth ? '' : 'bg-gray-50 dark:bg-gray-900/50 opacity-50'}
                  ${colorClass}
                `}
              >
                <div className="flex flex-col h-full">
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`
                        text-xs font-medium
                        ${isTodayDate ? 'bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : ''}
                        ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}
                      `}
                    >
                      {isTodayDate ? format(day, 'd') : format(day, 'd')}
                    </span>
                    {hasMultipleSlots && (
                      <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        {dateAvailabilities.length}
                      </Badge>
                    )}
                  </div>

                  {/* Availability Info */}
                  {isCurrentMonth && dateAvailabilities.length > 0 && (
                    <div className="flex-1 space-y-1 relative">
                      {dateAvailabilities.slice(0, 2).map((availability) => {
                        const isBlocked = availability.is_blocked;
                        const isSoldOut = availability.available_seats === 0;
                        const isLow = availability.available_seats > 0 && availability.available_seats <= (availability.alert_threshold || 5);

                        return (
                          <Popover key={availability.id}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="w-full text-left p-1 rounded text-xs hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-1 mb-0.5">
                                  {tripType === 'single_day' && availability.departure_time && (
                                    <span className="text-xs font-medium">
                                      {formatTime(availability.departure_time)}
                                    </span>
                                  )}
                                  {isBlocked && (
                                    <Ban className="w-3 h-3 text-red-600 dark:text-red-400" />
                                  )}
                                  {isLow && !isBlocked && (
                                    <Bell className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span className={`text-xs font-semibold ${
                                    isSoldOut
                                      ? 'text-red-600 dark:text-red-400'
                                      : isLow
                                      ? 'text-yellow-600 dark:text-yellow-400'
                                      : 'text-green-600 dark:text-green-400'
                                  }`}>
                                    {availability.available_seats}
                                  </span>
                                  {availability.waitlist_count > 0 && (
                                    <span className="text-xs text-blue-600 dark:text-blue-400">
                                      +{availability.waitlist_count}
                                    </span>
                                  )}
                                </div>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4 z-50" align="start" side="right">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                                    {format(parseISO(availability.departure_date), 'EEEE, MMMM d, yyyy')}
                                  </h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (onDateClick) {
                                        onDateClick(availability);
                                      } else {
                                        navigate({ subpage: 'trips', tab: 'availability', action: 'edit', id: availability.id });
                                      }
                                    }}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                                
                                {tripType === 'single_day' && availability.departure_time && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {__('Time', 'Time')}: {formatTime(availability.departure_time)} - {availability.arrival_time ? formatTime(availability.arrival_time) : ''}
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <div className="text-gray-500 dark:text-gray-400 mb-1">{__('Capacity', 'Capacity')}</div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{availability.total_seats}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500 dark:text-gray-400 mb-1">{__('Booked', 'Booked')}</div>
                                    <div className="font-semibold text-orange-600 dark:text-orange-400">{availability.booked_seats}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500 dark:text-gray-400 mb-1">{__('Available', 'Available')}</div>
                                    <div className={`font-semibold ${
                                      availability.available_seats === 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : availability.available_seats <= (availability.alert_threshold || 5)
                                        ? 'text-yellow-600 dark:text-yellow-400'
                                        : 'text-green-600 dark:text-green-400'
                                    }`}>
                                      {availability.available_seats}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500 dark:text-gray-400 mb-1">{__('Price', 'Price')}</div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                      {getCurrencySymbol(currency)}{parseFloat(availability.discounted_price || availability.original_price).toLocaleString()}
                                    </div>
                                  </div>
                                </div>

                                {availability.waitlist_count > 0 && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {availability.waitlist_count} {__('people on waitlist', 'people on waitlist')}
                                    </span>
                                  </div>
                                )}

                                {availability.is_blocked && availability.block_reason && (
                                  <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                    <Ban className="w-4 h-4" />
                                    <span>{__('Blocked', 'Blocked')}: {availability.block_reason}</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (onDateClick) {
                                        onDateClick(availability);
                                      } else {
                                        navigate({ subpage: 'trips', tab: 'availability', action: 'edit', id: availability.id });
                                      }
                                    }}
                                    className="flex-1 text-xs h-7"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    {__('Edit', 'Edit')}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate({ subpage: 'trips', tab: 'availability', action: 'view', id: availability.id })}
                                    className="flex-1 text-xs h-7"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    {__('View', 'View')}
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                      {dateAvailabilities.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                          +{dateAvailabilities.length - 2} {__('more', 'more')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-green-300 dark:border-green-800 bg-green-100 dark:bg-green-900/20"></div>
          <span className="text-gray-600 dark:text-gray-400">{__('Available', 'Available')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-yellow-300 dark:border-yellow-800 bg-yellow-100 dark:bg-yellow-900/20"></div>
          <span className="text-gray-600 dark:text-gray-400">{__('Low Availability', 'Low Availability')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-orange-300 dark:border-orange-800 bg-orange-100 dark:bg-orange-900/20"></div>
          <span className="text-gray-600 dark:text-gray-400">{__('Limited', 'Limited')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700"></div>
          <span className="text-gray-600 dark:text-gray-400">{__('Sold Out', 'Sold Out')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-900/20"></div>
          <span className="text-gray-600 dark:text-gray-400">{__('Blocked', 'Blocked')}</span>
        </div>
      </div>
    </div>
  );
};

