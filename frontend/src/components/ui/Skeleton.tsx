import * as React from "react";
import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // UI Upgrade: shimmer skeleton loader for premium perceived performance
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  );
}
