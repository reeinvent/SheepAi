import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Peristil — Pratilac gradskih problema Splita",
  description: "Prijavljivanje gradskih problema uz podršku zajednice u Splitu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr" className={`${dmSans.variable} antialiased`}>
      <body className="font-sans text-slate-800">{children}</body>
    </html>
  );
}
