"use client";

import React from "react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TagsFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  readOnly?: boolean;
}

export function TagsField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  placeholder,
  readOnly,
}: TagsFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const tags = (field.value || "")
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);
        return (
          <FormItem>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={placeholder}
                readOnly={readOnly}
              />
            </FormControl>
            <div className="flex gap-2 mt-2 flex-wrap">
              {tags.map((t: string, i: number) => (
                <Badge key={i} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
