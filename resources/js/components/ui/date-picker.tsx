import * as React from "react";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  error?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  minDate,
  maxDate,
  className = "",
  error = false,
}) => {
  const [open, setOpen] = React.useState(false);
  
  // Parse date safely - check if value is valid and parse correctly
  let selectedDate: Date | undefined = undefined;
  if (value && value.trim()) {
    try {
      const parsed = parse(value, "yyyy-MM-dd", new Date());
      // Check if parsed date is valid
      if (!isNaN(parsed.getTime())) {
        selectedDate = parsed;
      }
    } catch (e) {
      // Invalid date format, leave as undefined
      selectedDate = undefined;
    }
  }

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange?.(format(date, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  // Format display value safely
  let displayValue = "";
  if (selectedDate && !isNaN(selectedDate.getTime())) {
    try {
      displayValue = format(selectedDate, "MMM dd, yyyy");
    } catch (e) {
      displayValue = "";
    }
  }

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
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selected={selectedDate}
          onSelect={handleSelect}
          minDate={minDate}
          maxDate={maxDate}
        />
      </PopoverContent>
    </Popover>
  );
};

