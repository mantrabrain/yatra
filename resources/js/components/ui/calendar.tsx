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
  setMonth,
  setYear,
  getMonth,
  getYear,
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

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const Calendar: React.FC<CalendarProps> = ({
  selected,
  onSelect,
  disabled,
  minDate,
  maxDate,
  className = "",
}) => {
  // Open on the selected date (e.g. a saved date of birth lands on its own
  // year), falling back to today for a blank field.
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    () => selected ?? new Date(),
  );

  // When the bound value changes (popover reopened with an existing value),
  // jump the grid to that month so the user isn't stranded on today.
  React.useEffect(() => {
    if (selected) setCurrentMonth(selected);
  }, [selected]);

  // Year range for the dropdown: honour min/max when provided, else a wide
  // span that comfortably covers dates of birth (back ~120 years) and future
  // trip dates (~10 years ahead). Listed newest-first.
  const today = new Date();
  const fromYear = minDate ? getYear(minDate) : getYear(today) - 120;
  const toYear = maxDate ? getYear(maxDate) : getYear(today) + 10;
  const years: number[] = [];
  for (let y = toYear; y >= fromYear; y--) {
    years.push(y);
  }

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(setMonth(currentMonth, monthIndex));
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonth(setYear(currentMonth, year));
  };

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
      <div className="flex items-center justify-between gap-1 mb-4">
        <button
          type="button"
          onClick={previousMonth}
          aria-label="Previous month"
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {/* Month dropdown — jump to any month in one click */}
          <select
            value={getMonth(currentMonth)}
            onChange={(e) => handleMonthSelect(Number(e.target.value))}
            aria-label="Month"
            className="text-sm font-semibold text-gray-900 dark:text-white bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 rounded-md px-1 py-0.5 cursor-pointer focus:outline-none dark:bg-gray-800"
          >
            {MONTH_LABELS.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>

          {/* Year dropdown — jump straight to e.g. 1990 without month-stepping */}
          <select
            value={getYear(currentMonth)}
            onChange={(e) => handleYearSelect(Number(e.target.value))}
            aria-label="Year"
            className="text-sm font-semibold text-gray-900 dark:text-white bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 rounded-md px-1 py-0.5 cursor-pointer focus:outline-none dark:bg-gray-800"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={nextMonth}
          aria-label="Next month"
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors shrink-0"
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
