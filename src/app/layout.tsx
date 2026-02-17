import type { Metadata } from "next";
import { Inter, Nunito, JetBrains_Mono, DM_Sans, Space_Mono, Instrument_Serif } from "next/font/google";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-nunito" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-jetbrains" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dm-sans" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: ["400"], variable: "--font-serif" });

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
      <body className={`${inter.variable} ${nunito.variable} ${jetbrains.variable} ${dmSans.variable} ${spaceMono.variable} ${instrumentSerif.variable} antialiased`}>
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
