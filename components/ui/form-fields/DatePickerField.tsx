"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
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
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DatePickerFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  readOnly?: boolean;
}

export function DatePickerField({
  form,
  name,
  label,
  description,
  placeholder = "Pick a date",
  readOnly,
}: DatePickerFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          {label && <FormLabel>{label}</FormLabel>}
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  disabled={readOnly}
                  className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                >
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span>{placeholder}</span>
                  )}
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
                selected={field.value}
                onSelect={(date) => field.onChange(date)}
                disabled={(date) => date < new Date("1900-01-01")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
