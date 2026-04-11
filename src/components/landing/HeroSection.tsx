import { useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHomepagePreviewData } from "@/hooks/useHomepagePreviewData";

export default function HeroSection() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const previewData = useHomepagePreviewData(lang);
  const clinic = (previewData.data as { clinic?: { name?: string | null; logo_url?: string | null; updated_at?: string | null } | null } | undefined)?.clinic;
  const logoUrl = clinic?.logo_url
    ? `${clinic.logo_url}?t=${new Date(clinic.updated_at ?? Date.now()).getTime()}`
    : null;
  const clinicName = clinic?.name ?? "MediBook";
  const rafRef = useRef<number>(0);
  const heroTotalRef = useRef<number>(1);

  useEffect(() => {
    const heroEl = document.getElementById("hero-section");
    const heroBg = document.getElementById("hero-sticky-bg");
    const heroContent = document.getElementById("hero-content");
    const blob1 = document.getElementById("hero-blob-1");
    const blob2 = document.getElementById("hero-blob-2");
    const blob4 = document.getElementById("hero-blob-4");
    const ring1 = document.getElementById("hero-ring-1");
    const ring2 = document.getElementById("hero-ring-2");

    if (!heroEl) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (value: number) => Math.min(1, 1.001 - Math.pow(2, -10 * value)),
      smoothWheel: true,
    });

    const calcSize = () => {
      heroTotalRef.current = Math.max(1, heroEl.offsetHeight - window.innerHeight);
    };

    calcSize();
    window.addEventListener("resize", calcSize, { passive: true });
    document.documentElement.style.scrollBehavior = "smooth";

    function lenisRaf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(lenisRaf);
    }

    const lenisRafId = requestAnimationFrame(lenisRaf);

    lenis.on("scroll", ({ scroll }: { scroll: number }) => {
      const progress = Math.max(0, Math.min(1, scroll / heroTotalRef.current));
      const progressValue = progress.toFixed(5);

      heroBg?.style.setProperty("--p", progressValue);
      heroContent?.style.setProperty("--p", progressValue);

      if (blob1) {
        blob1.style.transform = `translate(${progress * -60}px, ${progress * -50}px) scale(${1 - progress * 0.08})`;
      }
      if (blob2) {
        blob2.style.transform = `translate(${progress * 55}px, ${progress * -35}px) scale(${1 - progress * 0.1})`;
      }
      if (blob4) {
        blob4.style.transform = `translateX(${progress * 35}px)`;
      }
      if (ring1) {
        ring1.style.transform = `translate(-50%,-50%) scale(${1 + progress * 0.6})`;
        ring1.style.opacity = `${Math.max(0, 0.6 - progress * 0.55)}`;
      }
      if (ring2) {
        ring2.style.transform = `translate(-50%,-50%) scale(${1 + progress * 0.3})`;
        ring2.style.opacity = `${Math.max(0, 0.4 - progress * 0.35)}`;
      }
      if (heroContent) {
        heroContent.style.transform = `translateY(${progress * -18}%)`;
      }
    });

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
      <div id="hero-sticky-bg" className="hero-sticky-bg">
        <video autoPlay muted loop playsInline className="hero-video-bg" src="/hero-animation.mp4" />

        <div id="hero-content" className="hero-content">
          <div className="hero-content-shell">
            <div className="hero-logo-row">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={clinicName}
                  style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }}
                />
              ) : (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
                  <rect x="4" y="16" width="32" height="8" rx="4" fill="#65a98f" />
                  <rect x="16" y="4" width="8" height="32" rx="4" fill="#4f8fe6" />
                </svg>
              )}
              <span className="hero-brand-text">{t.landingHeroBrand}</span>
            </div>

            <h1 className="hero-tagline">
              <>
                {t.landingHeroLine1}
                <br />
                {t.landingHeroLine2}
              </>
            </h1>

            <p className="hero-sub">{t.landingHeroSub}</p>

            <button className="hero-cta-btn" onClick={() => navigate("/register")}>
              {t.tryItFree} →
            </button>
          </div>
        </div>

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
          <span>{t.scrollHint}</span>
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
