import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carbon — understand and shrink your footprint",
  description:
    "Track your carbon footprint across transport, energy, diet, and shopping, and get personalized, actionable insights from a smart assistant.",
  applicationName: "Carbon",
  authors: [{ name: "Carbon" }],
  keywords: ["carbon footprint", "sustainability", "climate", "emissions"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f7a4d" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1410" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
