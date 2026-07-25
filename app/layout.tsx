import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Autopaisa — Automated Indian Stock Trading Simulator",
  description: "Automated paper trading simulator for NIFTY 50 stocks with live market prices, real-time strategy signals, and simulated wallet management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080c14] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1 pb-20 md:pb-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
