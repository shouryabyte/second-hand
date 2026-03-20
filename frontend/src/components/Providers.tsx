"use client";

import { Toaster } from "react-hot-toast";

// UI Upgrade: global client providers (toasts)
export function Providers() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "rgba(15, 23, 42, 0.72)",
          color: "#e2e8f0",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(10px)",
          borderRadius: "16px"
        }
      }}
    />
  );
}
