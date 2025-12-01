import * as React from "react";
import { format, parse, isWithinInterval, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths, 
  subMonths, 
  isToday 
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface DateRangePickerProps {
  dateFrom?: string; // YYYY-MM-DD format
  dateTo?: string; // YYYY-MM-DD format
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  placeholder = "Select date range",
  disabled = false,
  className = "",
  error = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [hoverDate, setHoverDate] = React.useState<Date | undefined>();
  
  // Parse dates safely
  let fromDate: Date | undefined = undefined;
  let toDate: Date | undefined = undefined;
  
  if (dateFrom && dateFrom.trim()) {
    try {
      const parsed = parse(dateFrom, "yyyy-MM-dd", new Date());
      if (!isNaN(parsed.getTime())) {
        fromDate = parsed;
      }
    } catch (e) {
      fromDate = undefined;
    }
  }
  
  if (dateTo && dateTo.trim()) {
    try {
      const parsed = parse(dateTo, "yyyy-MM-dd", new Date());
      if (!isNaN(parsed.getTime())) {
        toDate = parsed;
      }
    } catch (e) {
      toDate = undefined;
    }
  }

  const handleSelect = (date: Date) => {
    if (!fromDate || (fromDate && toDate)) {
      // Start new selection
      onDateFromChange?.(format(date, "yyyy-MM-dd"));
      onDateToChange?.("");
      setHoverDate(undefined);
    } else if (fromDate && !toDate) {
      // Complete the range
      if (date < fromDate) {
        // If selected date is before start, swap them
        onDateToChange?.(format(fromDate, "yyyy-MM-dd"));
        onDateFromChange?.(format(date, "yyyy-MM-dd"));
      } else {
        onDateToChange?.(format(date, "yyyy-MM-dd"));
      }
      setHoverDate(undefined);
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
    setHoverDate(undefined);
  };

  const isInRange = (date: Date) => {
    if (!fromDate) return false;
    const endDate = toDate || hoverDate;
    if (!endDate) return false;
    
    const start = fromDate < endDate ? fromDate : endDate;
    const end = fromDate < endDate ? endDate : fromDate;
    
    try {
      return isWithinInterval(date, { start, end });
    } catch {
      return false;
    }
  };

  const isRangeStart = (date: Date) => {
    return fromDate && isSameDay(date, fromDate);
  };

  const isRangeEnd = (date: Date) => {
    const endDate = toDate || hoverDate;
    return endDate && isSameDay(date, endDate);
  };

  // Helper to generate calendar days
  const getDaysForMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const nextMonthDate = addMonths(currentMonth, 1);
  const currentMonthDays = getDaysForMonth(currentMonth);
  const nextMonthDays = getDaysForMonth(nextMonthDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Format display value
  let displayValue = "";
  if (fromDate && !isNaN(fromDate.getTime())) {
    try {
      displayValue = format(fromDate, "MMM dd, yyyy");
      if (toDate && !isNaN(toDate.getTime())) {
        displayValue += " - " + format(toDate, "MMM dd, yyyy");
      }
    } catch (e) {
      displayValue = "";
    }
  }

  const hasValue = dateFrom || dateTo;

  const renderMonth = (monthDate: Date, days: Date[]) => (
    <div className="w-[280px]">
      <div className="font-semibold text-center mb-4">
        {format(monthDate, "MMMM yyyy")}
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 p-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, monthDate);
          const isSelected = isRangeStart(day) || isRangeEnd(day);
          const inRange = isInRange(day);
          const isTodayDate = isToday(day);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(day)}
              onMouseEnter={() => fromDate && !toDate && setHoverDate(day)}
              onMouseLeave={() => setHoverDate(undefined)}
              className={`
                p-2 text-sm rounded transition-colors relative w-9 h-9 flex items-center justify-center mx-auto
                ${!isCurrentMonth ? "text-gray-300 dark:text-gray-700 invisible" : ""}
                ${isSelected ? "bg-blue-600 text-white font-semibold hover:bg-blue-700 z-10" : ""}
                ${inRange && !isSelected ? "bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 rounded-none" : ""}
                ${!isSelected && !inRange && isCurrentMonth ? "hover:bg-gray-100 dark:hover:bg-gray-700" : ""}
                ${isTodayDate && !isSelected ? "border border-blue-500" : ""}
                ${isRangeStart(day) && inRange ? "rounded-l-md" : ""}
                ${isRangeEnd(day) && inRange ? "rounded-r-md" : ""}
              `}
              disabled={!isCurrentMonth}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={`w-full justify-start text-left font-normal ${error ? "border-red-500" : ""} ${!displayValue ? "text-gray-500" : ""} ${className}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || <span className="text-gray-500">{placeholder}</span>}
          {hasValue && !disabled && (
            <X
              className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-8">
            {renderMonth(currentMonth, currentMonthDays)}
            <div className="border-l border-gray-200 dark:border-gray-700 pl-8">
              {renderMonth(nextMonthDate, nextMonthDays)}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
