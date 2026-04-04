import { useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

/* ─────────────────────────────────────────────────────
   Card copy
───────────────────────────────────────────────────── */
const cardCopy = {
  tr: [
    { icon: "📅", title: "Akıllı Randevu",  desc: "Müsaitlik bazlı slot yönetimi, çakışma önleme." },
    { icon: "🩺", title: "Hasta Notları",   desc: "AES-256 şifreli klinik notlar, staff kısıtlaması." },
    { icon: "🔐", title: "KVKK Uyumu",      desc: "Rıza takibi, audit log, veri şifreleme." },
    { icon: "👥", title: "Rol Yönetimi",    desc: "5 farklı rol ile tam yetki izolasyonu." },
  ],
  en: [
    { icon: "📅", title: "Smart Scheduling", desc: "Availability-based slot planning with conflict prevention." },
    { icon: "🩺", title: "Patient Notes",    desc: "AES-256 encrypted notes with role-based staff restrictions." },
    { icon: "🔐", title: "Privacy Ready",    desc: "Consent tracking, audit logs, and encrypted data flow." },
    { icon: "👥", title: "Role Control",     desc: "Five role layers with strict permission isolation." },
  ],
} as const;

void cardCopy;

/* ─────────────────────────────────────────────────────
   HeroSection
───────────────────────────────────────────────────── */
export default function HeroSection() {
  const navigate   = useNavigate();
  const { lang }   = useLanguage();
  const rafRef     = useRef<number>(0);
  const heroTotalRef = useRef<number>(1);

  /* ── Scroll engine ── */
  useEffect(() => {
    const heroEl    = document.getElementById("hero-section");
    const heroBg    = document.getElementById("hero-sticky-bg");
    const heroC     = document.getElementById("hero-content");
    const b1        = document.getElementById("hero-blob-1");
    const b2        = document.getElementById("hero-blob-2");
    const b3        = document.getElementById("hero-blob-3");
    const b4        = document.getElementById("hero-blob-4");
    const r1        = document.getElementById("hero-ring-1");
    const r2        = document.getElementById("hero-ring-2");

    if (!heroEl) return;

    // Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    /* ── Boyutu hesapla ── */
    const calcSize = () => {
      heroTotalRef.current = Math.max(1, heroEl.offsetHeight - window.innerHeight);
    };
    calcSize();
    window.addEventListener("resize", calcSize, { passive: true });

    // CSS smooth scroll — native, sifir bagimlilik
    document.documentElement.style.scrollBehavior = "smooth";

    // Lenis kendi RAF loop'unu calistir
    function lenisRaf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(lenisRaf);
    }
    const lenisRafId = requestAnimationFrame(lenisRaf);

    // Lenis scroll event'i dinle — window.scrollY yerine lenis'in degerini kullan
    lenis.on("scroll", ({ scroll }: { scroll: number }) => {
      const p = Math.max(0, Math.min(1, scroll / heroTotalRef.current));
      const pStr = p.toFixed(5);

      heroBg?.style.setProperty("--p", pStr);
      heroC?.style.setProperty("--p", pStr);

      if (b1) b1.style.transform = `translate(${p * -60}px, ${p * -50}px) scale(${1 - p * 0.08})`;
      if (b2) b2.style.transform = `translate(${p * 55}px, ${p * -35}px) scale(${1 - p * 0.10})`;
      if (b4) b4.style.transform = `translateX(${p * 35}px)`;
      if (r1) { r1.style.transform = `translate(-50%,-50%) scale(${1 + p * 0.6})`; r1.style.opacity = `${Math.max(0, 0.6 - p * 0.55)}`; }
      if (r2) { r2.style.transform = `translate(-50%,-50%) scale(${1 + p * 0.3})`; r2.style.opacity = `${Math.max(0, 0.4 - p * 0.35)}`; }
      if (heroC) heroC.style.transform = `translateY(${p * -18}%)`;
    });

    const initialScroll = window.scrollY;
    const initialProgress = Math.max(0, Math.min(1, initialScroll / heroTotalRef.current));
    const initialProgressStr = initialProgress.toFixed(5);
    heroBg?.style.setProperty("--p", initialProgressStr);
    heroC?.style.setProperty("--p", initialProgressStr);
    if (b1) b1.style.transform = `translate(${initialProgress * -60}px, ${initialProgress * -50}px) scale(${1 - initialProgress * 0.08})`;
    if (b2) b2.style.transform = `translate(${initialProgress * 55}px, ${initialProgress * -35}px) scale(${1 - initialProgress * 0.10})`;
    if (b4) b4.style.transform = `translateX(${initialProgress * 35}px)`;
    if (r1) { r1.style.transform = `translate(-50%,-50%) scale(${1 + initialProgress * 0.6})`; r1.style.opacity = `${Math.max(0, 0.6 - initialProgress * 0.55)}`; }
    if (r2) { r2.style.transform = `translate(-50%,-50%) scale(${1 + initialProgress * 0.3})`; r2.style.opacity = `${Math.max(0, 0.4 - initialProgress * 0.35)}`; }
    if (heroC) heroC.style.transform = `translateY(${initialProgress * -18}%)`;

    return () => {
      cancelAnimationFrame(lenisRafId);
      cancelAnimationFrame(rafRef.current);
      lenis.destroy();
      window.removeEventListener("resize", calcSize);
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <section id="hero-section" className="hero-section">

      {/* ── Sticky animasyon katmanı ── */}
      <div id="hero-sticky-bg" className="hero-sticky-bg">

        {/* Halkalar */}
        <div
          id="hero-ring-1"
          className="hero-ring"
          style={{ width: 420, height: 420 }}
        />
        <div
          id="hero-ring-2"
          className="hero-ring"
          style={{ width: 750, height: 750, borderColor: "rgba(101,169,143,0.08)" }}
        />

        {/* Blob'lar */}
        <div id="hero-blob-1" className="hero-blob hero-blob-1" />
        <div id="hero-blob-2" className="hero-blob hero-blob-2" />
        <div id="hero-blob-3" className="hero-blob hero-blob-3" />
        <div id="hero-blob-4" className="hero-blob hero-blob-4" />

        {/* ── Başlık — viewport dibinde, scroll ile yukarı çıkar ── */}
        <div id="hero-content" className="hero-content">
          <div className="hero-content-shell">

            {/* Logo satırı */}
            <div className="hero-logo-row">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
                <rect x="4"  y="16" width="32" height="8" rx="4" fill="#65a98f" />
                <rect x="16" y="4"  width="8"  height="32" rx="4" fill="#4f8fe6" />
              </svg>
              <span className="hero-brand-text">
                {lang === "tr" ? "Pronto Tıp Merkezi" : "Pronto Medical Center"}
              </span>
            </div>

            {/* Başlık */}
            <h1 className="hero-tagline">
              {lang === "tr" ? (
                <>Sağlığınız İçin<br />Burdayız!</>
              ) : (
                <>Your Health,<br />Our Priority.</>
              )}
            </h1>

            {/* Alt başlık */}
            <p className="hero-sub">
              {lang === "tr"
                ? "Pronto Tıp Merkezi Hizmetinizde"
                : "Pronto Medical Center at Your Service"}
            </p>

            {/* CTA */}
            <button
              className="hero-cta-btn"
              onClick={() => navigate("/register")}
            >
              {lang === "tr" ? "Ücretsiz Deneyin →" : "Try It Free →"}
            </button>

          </div>
        </div>

        {/* Scroll ipucu */}
        <div className="hero-scroll-hint" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2v12M3 9l5 5 5-5"
              stroke="#5a7a8a"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{lang === "tr" ? "kaydırın" : "scroll"}</span>
        </div>

      </div>
    </section>
  );
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
