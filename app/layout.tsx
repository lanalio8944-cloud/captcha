import type { Metadata } from "next";
import "./globals.css";
import "./ad-placement.css";

export const metadata: Metadata = {
  title: "Pakpol | Verifikasi tautan",
  description: "Selesaikan verifikasi keamanan singkat untuk melanjutkan ke tautan.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
