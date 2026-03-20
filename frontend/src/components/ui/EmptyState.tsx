import * as React from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  // UI Upgrade: polished empty state for grids and lists
  return (
    <div className="glass p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
        {icon}
      </div>
      <div className="mt-4 text-lg font-semibold tracking-tight">{title}</div>
      {description ? <div className="mt-2 text-sm text-slate-300/80">{description}</div> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  // UI Upgrade: consistent page header layout + hierarchy
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4")}> 
      <div>
        <div className="text-xl font-semibold tracking-tight text-white">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-slate-300/80">{subtitle}</div> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}
