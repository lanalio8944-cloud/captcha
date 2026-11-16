import type { Metadata } from "next";
import "./globals.css";

const siteUrl = new URL("https://www.pakpol.web.id");
const pageTitle = "Verifikasi Keamanan Tautan | Pakpol";
const pageDescription =
  "Halaman verifikasi keamanan Pakpol. Selesaikan pemeriksaan singkat sebelum melanjutkan melalui tautan.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: pageTitle,
  description: pageDescription,
  applicationName: "Pakpol — Verifikasi Tautan",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    // Apple devices generally expect a PNG touch icon; keep the SVG favicon as fallback.
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Pakpol",
    title: pageTitle,
    description: pageDescription,
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
