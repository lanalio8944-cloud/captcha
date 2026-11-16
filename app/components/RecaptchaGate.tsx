"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type RecaptchaParameters = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  tabindex: number;
};

type RecaptchaApi = {
  ready: (callback: () => void) => void;
  render: (container: HTMLElement, parameters: RecaptchaParameters) => number;
  reset: (widgetId?: number) => void;
};

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
  }
}

type Props = { siteKey: string; disabled?: boolean };

const adUnitMarkup = `<!-- BEGIN AADS AD UNIT 2462330 -->

<div id="frame" style="width: 100%;margin: auto;position: relative; z-index: 99998;">
          <iframe data-aa='2462330' src='//acceptable.a-ads.com/2462330/?size=Adaptive&background_color=E5F2EB&title_color=176B50&title_hover_color=23966D&text_color=35443D&link_color=16845E&link_hover_color=105B42'
                            style='border:0; padding:0; width:70%; height:auto; overflow:hidden;display: block;margin: auto'></iframe>
        </div>

<!-- END AADS AD UNIT 2462330 -->`;

export default function RecaptchaGate({ siteKey, disabled = false }: Props) {
  const widgetContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [scriptError, setScriptError] = useState(false);

  const resetCaptcha = useCallback(() => {
    setCaptchaToken("");
    setVerified(false);
    if (widgetId.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(widgetId.current);
    }
  }, []);

  useEffect(() => {
    const recaptcha = window.grecaptcha;
    if (!scriptReady || !widgetContainer.current || !recaptcha || widgetId.current !== null) return;

    let cancelled = false;
    recaptcha.ready(() => {
      if (cancelled || !widgetContainer.current || widgetId.current !== null) return;

      try {
        widgetId.current = recaptcha.render(widgetContainer.current, {
          sitekey: siteKey,
          tabindex: 0,
          callback: (token) => {
            setCaptchaToken(token);
            setMessage("");
            setScriptError(false);
          },
          "expired-callback": () => {
            setCaptchaToken("");
            setVerified(false);
            setMessage("Waktu verifikasi habis. Silakan centang ulang.");
          },
          "error-callback": () => {
            setCaptchaToken("");
            setVerified(false);
            setWidgetReady(false);
            setScriptError(true);
            setMessage("Widget verifikasi tidak dapat dimuat. Silakan muat ulang halaman. Jika masalah berulang, periksa Site Key reCAPTCHA v2 Checkbox dan hostname yang terdaftar.");
          },
        });
        setWidgetReady(true);
      } catch {
        setScriptError(true);
        setMessage("Widget verifikasi tidak dapat dimulai. Silakan muat ulang halaman. Jika masalah berulang, periksa Site Key reCAPTCHA v2 Checkbox dan hostname yang terdaftar.");
      }
    });

    return () => { cancelled = true; };
  }, [scriptReady, siteKey]);

  async function handleVerify() {
    if (!captchaToken || busy || disabled) return;
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken }),
        cache: "no-store",
      });
      const data = await response.json() as { success?: boolean; error?: string };
      if (!response.ok || data.success !== true) throw new Error(data.error || "Verifikasi belum berhasil. Silakan coba lagi.");

      setVerified(true);
      setCaptchaToken("");
      setMessage("Verifikasi berhasil. Anda sekarang dapat melanjutkan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verifikasi gagal. Silakan coba lagi.");
      resetCaptcha();
    } finally {
      setBusy(false);
    }
  }

  function continueToSite() {
    if (verified) window.location.assign("/r");
  }

  function reloadPage() {
    window.location.reload();
  }

  return (
    <div className="verification-flow">
      <div className="flow-heading">
        <span className={`step-indicator${verified ? " is-complete" : ""}`} aria-hidden="true">
          {verified ? "2" : "1"}
        </span>
        <div>
          <p className="flow-title">{verified ? "Verifikasi selesai" : "Konfirmasi bahwa Anda manusia"}</p>
          <p className="flow-subtitle">{verified ? "Akses siap dilanjutkan." : "Centang kotak reCAPTCHA untuk melanjutkan."}</p>
        </div>
      </div>

      {!verified && <>
        <div className="captcha-viewport" aria-label="Google reCAPTCHA">
          <div className="captcha-container" ref={widgetContainer} />
          {!widgetReady && !scriptError && <p className="widget-loading" role="status">Memuat verifikasi…</p>}
        </div>
        <button className="primary-button" type="button" onClick={() => void handleVerify()} disabled={disabled || busy || !captchaToken}>
          {busy ? <><span className="button-spinner" aria-hidden="true" /> Memeriksa…</> : "Verifikasi dan lanjutkan"}
          {!busy && <span className="button-arrow" aria-hidden="true">→</span>}
        </button>
      </>}

      {verified && (
        <button className="primary-button continue-button" type="button" onClick={continueToSite}>
          Lanjutkan ke situs utama <span className="button-arrow" aria-hidden="true">→</span>
        </button>
      )}

      <section className="ad-placement" aria-label="Iklan">
        <span className="ad-label">IKLAN</span>
        <div dangerouslySetInnerHTML={{ __html: adUnitMarkup }} />
      </section>

      {message && <p className={`form-message${verified ? " success-message" : ""}`} role="status" aria-live="polite">{message}</p>}
      {scriptError && !verified && <>
        <p className="form-hint">Jika pemuatan pertama gagal, muat ulang halaman. Jika pesan jenis kunci tidak valid tetap muncul, buat atau gunakan key reCAPTCHA v2 Checkbox dan daftarkan hostname situs ini di Google.</p>
        <button className="reload-button" type="button" onClick={reloadPage}>Muat ulang halaman</button>
      </>}

      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit&hl=id"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => {
          setScriptError(true);
          setMessage("Skrip Google reCAPTCHA gagal dimuat. Silakan muat ulang halaman atau periksa koneksi dan pemblokir konten.");
        }}
      />
    </div>
  );
}
