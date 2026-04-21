import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LGC Fleet Management",
  description: "Operational dashboard for routes, stops, assignments, and fleet visibility."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
