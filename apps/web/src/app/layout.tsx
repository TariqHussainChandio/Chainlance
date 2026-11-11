import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ChainWork — Freelancing, secured by code",
  description:
    "Decentralized AI-powered freelancing marketplace. Smart contract escrow, AI recommendations, fraud detection.",
  openGraph: {
    title: "ChainWork — Freelancing, secured by code",
    description:
      "Decentralized AI-powered freelancing marketplace. Smart contract escrow, AI recommendations, fraud detection.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChainWork — Freelancing, secured by code",
    description:
      "Decentralized AI-powered freelancing marketplace. Smart contract escrow, AI recommendations, fraud detection.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
