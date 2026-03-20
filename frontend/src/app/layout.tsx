import "./globals.css";
import { Inter } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { BackendStatus } from "@/components/BackendStatus";
import { Providers } from "@/components/Providers";
import { PageTransition } from "@/components/PageTransition";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "NexChakra Market",
  description: "Buy and sell pre-owned items"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="app-bg">
        {/* UI Upgrade: sticky glass navbar */}
        <div className="app-content">
          <NavBar />
          <BackendStatus />

          {/* UI Upgrade: responsive max-width container + page transitions */}
          <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-6 sm:px-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>

        {/* UI Upgrade: subtle grid overlay behind content */}
        <div className="pointer-events-none fixed inset-0 opacity-[0.15] bg-grid" aria-hidden />

        {/* UI Upgrade: global toast notifications */}
        <Providers />
      </body>
    </html>
  );
}