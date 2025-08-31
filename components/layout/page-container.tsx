import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PageContainer({
  children,
  scrollable = true,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className="h-[calc(100dvh-52px)]">
          <div className="p-4 md:px-6">
            <div className="w-full">{children}</div>
          </div>
        </ScrollArea>
      ) : (
        <div className="p-4 md:px-6 h-[calc(100dvh-52px)] flex flex-col">
          <div className="w-full flex flex-1 flex-col">{children}</div>
        </div>
      )}
    </>
  );
}
