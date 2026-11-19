import RecaptchaGate from "@/app/components/RecaptchaGate";
import { getRedirectDestination } from "@/lib/security";

export const dynamic = "force-dynamic";

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M12 3.25 19 6v5.1c0 4.65-2.85 7.95-7 9.65-4.15-1.7-7-5-7-9.65V6l7-2.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.3 12.1h5.4M12 9.4v5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function HomePage() {
  const destination = getRedirectDestination();
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() || null;

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
        <div className="card-kicker">
          <span className="kicker-line" />
          <span>VERIFIKASI KEAMANAN</span>
        </div>

        <h1 id="page-title">Satu langkah lagi.</h1>
        <p className="intro">Selesaikan verifikasi singkat di bawah ini untuk melanjutkan dengan aman.</p>

        {destination ? (
          <p className="destination-preview">
            Tujuan lama: <strong>{destination.hostname}</strong>
          </p>
        ) : null}

        {siteKey && destination ? (
          <RecaptchaGate siteKey={siteKey} disabled={!destination} />
        ) : (
          <p className="setup-notice" role="status">
            {!destination ? "Layanan belum siap. Silakan coba lagi nanti." : "Verifikasi belum tersedia saat ini. Silakan coba lagi nanti."}
          </p>
        )}

        <div className="card-footer">
          <span className="footer-lock" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.3"/><path d="M5.2 7V4.8a2.8 2.8 0 0 1 5.6 0V7" stroke="currentColor" strokeWidth="1.3"/></svg>
          </span>
          <span>Verifikasi aman · Privasi Anda tetap terlindungi</span>
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
