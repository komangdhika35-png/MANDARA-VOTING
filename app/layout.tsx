import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suara Kita — Pemilihan Organisasi",
  description:
    "Portal pemilihan ketua MPK, OSIS, dan KY. Satu suara untuk perubahan yang lebih baik.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
