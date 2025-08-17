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
import { Input } from "@/components/ui/input";

interface TextFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  readOnly?: boolean;
  type?: React.HTMLInputTypeAttribute;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export function TextField({
  form,
  name,
  label,
  description,
  placeholder,
  readOnly,
  type = "text",
  inputProps,
}: TextFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={placeholder}
              readOnly={readOnly}
              type={type}
              {...inputProps}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
