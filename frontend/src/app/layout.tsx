import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata = {
  title: "NexChakra Market",
  description: "Buy and sell pre-owned items"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
