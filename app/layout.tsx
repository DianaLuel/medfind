import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: { default: "MedFind Ethiopia — Find your medicine before you travel", template: "%s | MedFind Ethiopia" },
  description: "An Ethiopian pharmacy availability directory. Check genuine recent confirmations when a network is connected, and always contact a pharmacy to reconfirm stock.",
  applicationName: "MedFind Ethiopia",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <div className="page-enter">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
