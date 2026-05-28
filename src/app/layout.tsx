import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/provider/Providers";
import { appName, orgName } from "../utils/logo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description:
    `${orgName} Member Portal and Event Management System — self-service ` +
    "membership, subscription payments, event registration, attendance, " +
    "and CPD certificates for nurses across Kenya.",
  applicationName: appName,
  authors: [{ name: "Data Systems Engineering Ltd" }],
  keywords: [
    "NNAK",
    "National Nurses Association of Kenya",
    "nursing",
    "membership portal",
    "CPD",
    "M-Pesa",
    "event management",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/assets/nnak_logo.png", type: "image/png" },
    ],
    apple: "/assets/nnak_logo.png",
  },
  openGraph: {
    title: appName,
    description: `${orgName} — Member Portal & Event Management`,
    siteName: appName,
    type: "website",
    locale: "en_KE",
    images: [{ url: "/assets/nnak_logo.png" }],
  },
  twitter: {
    card: "summary",
    title: appName,
    description: `${orgName} — Member Portal & Event Management`,
    images: ["/assets/nnak_logo.png"],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
