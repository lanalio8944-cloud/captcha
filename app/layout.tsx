import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verifikasi keamanan",
  description: "Selesaikan verifikasi sebelum melanjutkan ke situs tujuan.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
