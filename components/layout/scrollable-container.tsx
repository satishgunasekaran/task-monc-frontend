import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScrollableContainerProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function ScrollableContainer({
  header,
  children,
  className = "",
  contentClassName = "",
}: ScrollableContainerProps) {
  return (
    <div className={`flex flex-1 flex-col space-y-4 ${className}`}>
      {header}
      <div className="relative flex flex-1">
        <div className="absolute inset-0 flex overflow-hidden rounded-lg border">
          <ScrollArea className="h-full w-full">
            <div className={`p-4 ${contentClassName}`}>{children}</div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
