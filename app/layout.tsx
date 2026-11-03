import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suara Mandara — Pemilihan Organisasi",
  description:
    "Portal pemilihan ketua MPK, OSIS, dan KY di Mandara. Satu suara untuk perubahan yang lebih baik.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
