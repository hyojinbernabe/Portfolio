import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hyojin Bernabe",
  description: "Full stack developer from Baguio, Philippines.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
