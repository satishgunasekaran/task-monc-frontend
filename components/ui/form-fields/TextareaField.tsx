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
import { Textarea } from "@/components/ui/textarea";

interface TextareaFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function TextareaField({
  form,
  name,
  label,
  description,
  placeholder,
  readOnly,
  className,
}: TextareaFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Textarea
              {...field}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={placeholder}
              readOnly={readOnly}
              className={className}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
