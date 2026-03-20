import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// UI Upgrade: className helper (Tailwind + conditional classes)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
