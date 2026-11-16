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

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, parameters: RecaptchaParameters) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

type Props = { siteKey: string; disabled?: boolean };

export default function RecaptchaGate({ siteKey, disabled = false }: Props) {
  const widgetContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
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
    if (!scriptReady || !widgetContainer.current || !window.grecaptcha || widgetId.current !== null) return;

    try {
      widgetId.current = window.grecaptcha.render(widgetContainer.current, {
        sitekey: siteKey,
        tabindex: 0,
        callback: (token) => {
          setCaptchaToken(token);
          setMessage("");
        },
        "expired-callback": () => {
          setCaptchaToken("");
          setVerified(false);
          setMessage("Waktu verifikasi habis. Silakan centang ulang.");
        },
        "error-callback": () => {
          setCaptchaToken("");
          setVerified(false);
          setMessage("Verifikasi tidak dapat dimuat. Periksa koneksi atau pengaturan domain CAPTCHA.");
        },
      });
    } catch {
      setScriptError(true);
      setMessage("Widget verifikasi tidak dapat dimulai. Periksa Site Key dan domain yang terdaftar.");
    }
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

      {message && <p className={`form-message${verified ? " success-message" : ""}`} role="status" aria-live="polite">{message}</p>}
      {scriptError && <p className="form-hint">Jika masalah berlanjut, pastikan key yang digunakan adalah reCAPTCHA v2 Checkbox dan hostname telah didaftarkan di Google.</p>}

      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit&hl=id"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => {
          setScriptError(true);
          setMessage("Skrip Google reCAPTCHA gagal dimuat. Periksa koneksi atau pemblokir konten.");
        }}
      />
    </div>
  );
}
