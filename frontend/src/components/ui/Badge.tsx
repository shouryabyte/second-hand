import * as React from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  // UI Upgrade: subtle outlined chip with glow on hover
  return (
    <span
      className={cn(
        "chip transition-all duration-300 hover:border-violet-300/30 hover:bg-white/10",
        className
      )}
      {...props}
    />
  );
}
