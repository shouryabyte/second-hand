import * as React from "react";
import { cn } from "@/lib/cn";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "glass" | "soft";
};

// UI Upgrade: glassmorphism cards (consistent surface + shadows)
export function Card({ className, variant = "glass", ...props }: CardProps) {
  return (
    <div
      className={cn(
        variant === "glass" ? "glass" : "glass-soft",
        "p-5 sm:p-6",
        className
      )}
      {...props}
    />
  );
}
