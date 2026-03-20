import * as React from "react";
import { cn } from "@/lib/cn";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase() || "U";
}

export function Avatar({
  className,
  name,
  size = "md"
}: {
  className?: string;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  // UI Upgrade: profile avatar circle (initials fallback)
  const dim = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-sm" : "h-10 w-10 text-xs";
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-violet-600/70 via-indigo-600/60 to-sky-600/60 ring-1 ring-white/15 shadow-lg shadow-violet-500/20 flex items-center justify-center",
        dim,
        className
      )}
      aria-label={name ? `Avatar for ${name}` : "Avatar"}
    >
      <span className="font-bold tracking-wide text-white/95">
        {name ? initials(name) : "U"}
      </span>
    </div>
  );
}
