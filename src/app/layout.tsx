import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  ThemeProvider,
  themeInitScript,
} from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";

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
    default: "Carbon — understand and reduce your footprint",
    template: "%s · Carbon",
  },
  description:
    "Carbon is a personal climate companion: log everyday activities, see a precise breakdown of your emissions, and get personalized, data-grounded guidance from an AI assistant.",
  applicationName: "Carbon",
  authors: [{ name: "Carbon" }],
  keywords: [
    "carbon footprint",
    "sustainability",
    "climate",
    "emissions tracker",
    "personal carbon",
  ],
  openGraph: {
    title: "Carbon — understand and reduce your footprint",
    description:
      "Track your carbon footprint and get personalized, data-grounded guidance.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0d" },
    { media: "(prefers-color-scheme: light)", color: "#f7f8f7" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Set theme before paint to avoid a flash of the wrong colour scheme. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
