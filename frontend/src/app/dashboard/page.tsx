"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Skeleton } from "@/components/ui/Skeleton";

// Dashboard: single entry point after auth.
// Redirects to listings when logged in, otherwise to login.
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) router.replace("/listings");
    else router.replace("/auth/login");
  }, [router]);

  return (
    <div className="grid gap-4">
      <Skeleton className="h-[140px]" />
      <Skeleton className="h-[320px]" />
    </div>
  );
}