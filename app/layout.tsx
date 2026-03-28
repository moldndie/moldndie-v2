import type { Metadata } from "next";
import { Funnel_Display, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next"
import { PageViewTracker } from "@/components/analytics/PageViewTracker"

const funnelDisplay = Funnel_Display({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mold N Die — Molds, Courses & Resources",
    template: "%s | Mold N Die",
  },
  description:
    "Browse professional mold designs, enroll in courses, discover events and suppliers — everything the mold and die industry needs in one place.",
  openGraph: {
    type: "website",
    siteName: "Mold N Die",
    title: "Mold N Die — Molds, Courses & Resources",
    description:
      "Browse professional mold designs, enroll in courses, discover events and suppliers — everything the mold and die industry needs in one place.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mold N Die — Molds, Courses & Resources",
    description:
      "Browse professional mold designs, enroll in courses, discover events and suppliers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${funnelDisplay.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <Providers>
          <PageViewTracker />
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
