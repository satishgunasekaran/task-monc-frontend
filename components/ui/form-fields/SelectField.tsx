"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Option {
  value: string;
  label: React.ReactNode;
}

interface SelectFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  options: Option[];
  readOnly?: boolean;
}

export function SelectField({
  form,
  name,
  label,
  description,
  placeholder,
  options,
  readOnly,
}: SelectFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Select
              onValueChange={(val) => field.onChange(val)}
              defaultValue={field.value}
              value={field.value}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
