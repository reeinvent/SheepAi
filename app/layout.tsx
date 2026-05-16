import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AppShell } from "./components/AppShell";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "City Issue Tracker",
  description: "Municipal Services Department dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} antialiased`}>
      <body className="font-sans bg-slate-50 text-slate-800">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
