import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  selected,
  onSelect,
  disabled,
  minDate,
  maxDate,
  className = "",
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isDateDisabled = (date: Date) => {
    if (disabled && disabled(date)) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    onSelect?.(date);
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className={`p-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={previousMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, dayIdx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selected && isSameDay(day, selected);
          const isTodayDate = isToday(day);
          const isDisabled = isDateDisabled(day);

          return (
            <button
              key={dayIdx}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={`
                h-9 w-9 text-sm rounded-md transition-colors
                ${isCurrentMonth ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}
                ${
                  isSelected
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : isTodayDate
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }
                ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
};
