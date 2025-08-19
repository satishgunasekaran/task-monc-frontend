"use client";

import React from "react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { format } from "date-fns";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { combineDateAndTime, extractTimeFromDate } from "@/lib/datetime-utils";

interface DateTimePickerFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  readOnly?: boolean;
}

export function DateTimePickerField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  placeholder = "Pick a date and time",
  readOnly,
}: DateTimePickerFieldProps<T>) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const selectedDate = field.value as Date | undefined;
        const dateString = selectedDate ? format(selectedDate, "PPP") : "";
        const timeString = selectedDate
          ? extractTimeFromDate(selectedDate)
          : "09:00";

        const handleDateSelect = (date: Date | undefined) => {
          if (date) {
            // If there's already a time set, preserve it
            const currentTime = selectedDate
              ? extractTimeFromDate(selectedDate)
              : "09:00";
            const combined = combineDateAndTime(date, currentTime);
            field.onChange(combined);
          } else {
            field.onChange(undefined);
          }
          setIsCalendarOpen(false);
        };

        const handleTimeChange = (timeValue: string) => {
          if (selectedDate && timeValue) {
            const combined = combineDateAndTime(selectedDate, timeValue);
            field.onChange(combined);
          } else if (!selectedDate && timeValue) {
            // If no date is selected but time is, use today
            const today = new Date();
            const combined = combineDateAndTime(today, timeValue);
            field.onChange(combined);
          }
        };

        const clearDateTime = () => {
          field.onChange(undefined);
        };

        return (
          <FormItem className="flex flex-col">
            {label && <FormLabel>{label}</FormLabel>}
            <div className="flex gap-2">
              {/* Date Picker */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      disabled={readOnly}
                      className={`flex-1 justify-start text-left font-normal ${!selectedDate ? "text-muted-foreground" : ""}`}
                    >
                      {selectedDate ? dateString : <span>{placeholder}</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 z-50 pointer-events-auto"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Time Input */}
              <div>
                <Input
                  type="time"
                  value={timeString}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  disabled={readOnly}
                  className="w-32"
                />
              </div>

              {/* Clear Button */}
              {selectedDate && !readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={clearDateTime}
                  className="shrink-0"
                >
                  ×
                </Button>
              )}
            </div>

            {/* Display current selection */}
            {selectedDate && (
              <div className="text-sm text-muted-foreground">
                Selected: {format(selectedDate, "PPP 'at' p")}
              </div>
            )}

            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
