import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisaReady KR",
  description: "Personalized Korean visa document checklists for international residents.",
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
