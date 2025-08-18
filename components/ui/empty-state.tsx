import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={`flex items-center justify-center py-8 ${className || ""}`}>
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-center">
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="text-center">{action}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export type { EmptyStateProps };
