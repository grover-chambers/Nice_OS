import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NiceOS — Market Activation & Intelligence Platform",
  description:
    "Internal platform for NICE MILLERS LIMITED field operations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}