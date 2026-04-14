import * as React from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";

export interface TimePickerProps {
  value?: string; // HH:mm format
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  className = "",
  error = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [hours, setHours] = React.useState<string>("");
  const [minutes, setMinutes] = React.useState<string>("");
  const [ampm, setAmpm] = React.useState<"AM" | "PM">("AM");

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      const hour = parseInt(h);
      if (hour === 0) {
        setHours("12");
        setAmpm("AM");
      } else if (hour < 12) {
        setHours(hour.toString());
        setAmpm("AM");
      } else if (hour === 12) {
        setHours("12");
        setAmpm("PM");
      } else {
        setHours((hour - 12).toString());
        setAmpm("PM");
      }
      setMinutes(m || "00");
    }
  }, [value]);

  const handleTimeSelect = (h: string, m: string, a: "AM" | "PM") => {
    let hour24 = parseInt(h);
    if (a === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (a === "AM" && hour24 === 12) {
      hour24 = 0;
    }
    const timeString = `${hour24.toString().padStart(2, "0")}:${m.padStart(2, "0")}`;
    onChange?.(timeString);
    setOpen(false);
  };

  const formatDisplayTime = () => {
    if (!value) return "";
    const [h, m] = value.split(":");
    const hour = parseInt(h);
    if (hour === 0) return `12:${m} AM`;
    if (hour < 12) return `${hour}:${m} AM`;
    if (hour === 12) return `12:${m} PM`;
    return `${hour - 12}:${m} PM`;
  };

  const hourOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minuteOptions = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={`w-full justify-start text-left font-normal ${error ? "border-red-500" : ""} ${!value ? "text-gray-500" : ""} ${className}`}
        >
          <Clock className="mr-2 h-4 w-4" />
          {formatDisplayTime() || (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Hour
            </label>
            <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
              {hourOptions.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setHours(h);
                    if (hours && minutes) {
                      handleTimeSelect(h, minutes, ampm);
                    }
                  }}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    hours === h
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Minute
            </label>
            <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
              {minuteOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMinutes(m);
                    if (hours && m) {
                      handleTimeSelect(hours, m, ampm);
                    }
                  }}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    minutes === m
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              AM/PM
            </label>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setAmpm("AM");
                  if (hours && minutes) {
                    handleTimeSelect(hours, minutes, "AM");
                  }
                }}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  ampm === "AM"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmpm("PM");
                  if (hours && minutes) {
                    handleTimeSelect(hours, minutes, "PM");
                  }
                }}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  ampm === "PM"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                PM
              </button>
            </div>
          </div>
        </div>
        {hours && minutes && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={() => handleTimeSelect(hours, minutes, ampm)}
              className="w-full"
              size="sm"
            >
              Set Time
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
