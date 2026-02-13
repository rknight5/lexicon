import type { Metadata } from "next";
import { Inter, Nunito, JetBrains_Mono } from "next/font/google";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-nunito" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Lexicon — AI Word Puzzles",
  description: "Turn your interests into word puzzles",
  manifest: "/manifest.json",
  themeColor: "#1A0A2E",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lexicon",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.variable} ${nunito.variable} ${jetbrains.variable} antialiased`}>
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
