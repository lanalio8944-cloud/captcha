import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RecaptchaGate from "@/app/components/RecaptchaGate";
import { getDestinationById } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const destination = getDestinationById(id);
  if (!destination) return { title: "Tautan tidak ditemukan", robots: { index: false, follow: false } };

  return {
    title: `Verifikasi Keamanan | ${destination.name}`,
    description: `Verifikasi akses aman sebelum melanjutkan ke ${new URL(destination.url).hostname}.`,
    robots: { index: false, follow: false },
  };
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M12 3.25 19 6v5.1c0 4.65-2.85 7.95-7 9.65-4.15-1.7-7-5-7-9.65V6l7-2.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.3 12.1h5.4M12 9.4v5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default async function DestinationVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const destination = getDestinationById(id);
  if (!destination) notFound();

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const hostname = new URL(destination.url).hostname;

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Pakpol — halaman utama">
          <span className="brand-mark"><ShieldIcon /></span>
          <span className="brand-name">pakpol<span className="brand-dot">.</span></span>
        </a>
        <span className="header-label">AKSES TAUTAN</span>
      </header>

      <section className="verification-card" aria-labelledby="page-title">
        <div className="card-kicker"><span className="kicker-line" /><span>VERIFIKASI KEAMANAN</span></div>
        <h1 id="page-title">Satu langkah lagi.</h1>
        <p className="intro">Selesaikan verifikasi singkat sebelum melanjutkan ke situs tujuan.</p>
        <p className="destination-preview">
          Tujuan: <strong>{destination.name}</strong> · <span>{hostname}</span>
        </p>

        {siteKey ? (
          <RecaptchaGate siteKey={siteKey} destinationId={id} />
        ) : (
          <p className="setup-notice" role="status">Verifikasi belum tersedia saat ini. Silakan coba lagi nanti.</p>
        )}

        <div className="card-footer">
          <span className="footer-lock" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.3"/><path d="M5.2 7V4.8a2.8 2.8 0 0 1 5.6 0V7" stroke="currentColor" strokeWidth="1.3"/></svg>
          </span>
          <span>Verifikasi aman · Tujuan tercantum di atas</span>
        </div>
      </section>

      <footer className="page-footer">
        <span>© {new Date().getFullYear()} Pakpol</span>
        <span className="footer-separator" aria-hidden="true">·</span>
        <span>Halaman perlindungan tautan</span>
      </footer>
    </main>
  );
}
