import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next"

// The stand-in for Aptos — see --font-sans in globals.css. Aptos is
// Microsoft-proprietary and can't be served, and Office installs it where
// browsers can't see it, so most visitors (the client included) never get it.
// Inter with its tailed "l" (cv05, set on body) is the closest free match.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
