import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SmartLink from "./SmartLink";
import { getInitials } from "./HeroSection";

type DoctorItem = {
  id: string;
  name: string;
  specialtyName?: string;
  title?: string;
  imageSrc?: string;
};

type DoctorsSectionProps = {
  doctors: DoctorItem[];
  isLoading: boolean;
  hasLoadedEmpty: boolean;
};

const sectionMotionProps = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

const appleEase = [0.25, 0.1, 0.25, 1] as const;

export default function DoctorsSection({
  doctors,
  isLoading,
  hasLoadedEmpty,
}: DoctorsSectionProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  useInView(sectionRef, { once: true, amount: 0.2 });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const useGridMode = false;

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [doctors.length, useGridMode]);

  return (
    <motion.section
      {...sectionMotionProps}
      ref={sectionRef}
      id="doktorlarimiz"
      className="relative z-[10] w-full bg-[#f4f8fd] px-6 py-20 md:px-12 lg:px-20"
    >
      <style>{".doctor-scroll-container::-webkit-scrollbar { display: none; }"}</style>

      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10 flex items-end justify-between gap-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: appleEase }}
            className="text-[2rem] font-bold text-[#1a2e3b]"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            {t.doctorsPageTitle}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SmartLink
              href="/doctors"
              className="shrink-0 text-sm font-medium text-[#4f8fe6] transition-colors duration-200 hover:text-[#2f75ca]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {t.viewAll} →
            </SmartLink>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{ borderRadius: "18px", overflow: "visible", background: "transparent", flexShrink: 0, width: "300px", display: "flex", flexDirection: "column", alignItems: "stretch" }}
                className="min-h-[420px] lg:w-auto"
              >
                <div style={{ height: "260px", width: "100%", borderRadius: "18px", overflow: "hidden", background: "linear-gradient(160deg, #eaf5ff 0%, #c8e6f5 55%, #b5d1cc 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} />
                <div style={{ height: "16px" }} />
                <div style={{ padding: "0 8px 8px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <div className="mb-2 h-7 w-40 rounded-full bg-[#eef4fb]" />
                  <div className="h-5 w-32 rounded-full bg-[#f3f7fb]" />
                  <div className="mt-5 flex items-center justify-center gap-4">
                    <div className="h-10 w-28 rounded-full bg-[#eef4fb]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasLoadedEmpty ? (
          <div style={{ textAlign: "center", color: "#5a7a8a", padding: 40 }}>{t.noActiveDoctors}</div>
        ) : (
          <div className={useGridMode ? "" : "relative px-0 md:px-6"}>
            {!useGridMode ? (
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: -340, behavior: "smooth" })}
                className="hidden md:flex absolute left-[-20px] top-1/2 z-10 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.15)]"
                style={{ opacity: canScrollLeft ? 1 : 0.3, pointerEvents: canScrollLeft ? "auto" : "none" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 3 5 8l5 5" stroke="#4f8fe6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}

            {!useGridMode ? (
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: 340, behavior: "smooth" })}
                className="hidden md:flex absolute right-[-20px] top-1/2 z-10 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.15)]"
                style={{ opacity: canScrollRight ? 1 : 0.3, pointerEvents: canScrollRight ? "auto" : "none" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="m6 3 5 5-5 5" stroke="#4f8fe6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}

            <div
              ref={scrollRef}
              onScroll={updateScrollState}
              onMouseDown={
                useGridMode
                  ? undefined
                  : (e) => {
                      if (!scrollRef.current) return;
                      isDragging.current = true;
                      startX.current = e.pageX - scrollRef.current.offsetLeft;
                      scrollLeft.current = scrollRef.current.scrollLeft;
                      scrollRef.current.style.cursor = "grabbing";
                      scrollRef.current.style.userSelect = "none";
                    }
              }
              onMouseLeave={
                useGridMode
                  ? undefined
                  : () => {
                      isDragging.current = false;
                      if (scrollRef.current) {
                        scrollRef.current.style.cursor = "grab";
                        scrollRef.current.style.userSelect = "";
                      }
                    }
              }
              onMouseUp={
                useGridMode
                  ? undefined
                  : () => {
                      isDragging.current = false;
                      if (scrollRef.current) {
                        scrollRef.current.style.cursor = "grab";
                        scrollRef.current.style.userSelect = "";
                      }
                    }
              }
              onMouseMove={
                useGridMode
                  ? undefined
                  : (e) => {
                      if (!isDragging.current || !scrollRef.current) return;
                      e.preventDefault();
                      const x = e.pageX - scrollRef.current.offsetLeft;
                      const walk = (x - startX.current) * 1.5;
                      scrollRef.current.scrollLeft = scrollLeft.current - walk;
                    }
              }
              className={["doctor-scroll-container scroll-smooth", useGridMode ? "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4" : "flex snap-x snap-mandatory gap-5 overflow-x-auto px-2 py-2"].join(" ")}
              style={useGridMode ? undefined : { scrollbarWidth: "none", msOverflowStyle: "none", cursor: "grab", paddingRight: "24px" }}
            >
              {doctors.map((doctor, index) => (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, y: 20, x: -30 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: (index % 5) * 0.08, ease: appleEase }}
                  whileHover={{ scale: 1.02 }}
                  className={["min-h-[420px]", useGridMode ? "w-full" : "w-[300px] shrink-0 snap-start"].join(" ")}
                  style={{ borderRadius: "18px", overflow: "visible", background: "transparent", flexShrink: 0, width: useGridMode ? undefined : "300px", cursor: "grab", display: "flex", flexDirection: "column", alignItems: "stretch" }}
                >
                  <div style={{ height: "260px", width: "100%", borderRadius: "18px", overflow: "hidden", background: "linear-gradient(160deg, #eaf5ff 0%, #c8e6f5 55%, #b5d1cc 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {doctor.imageSrc ? (
                      <img src={doctor.imageSrc} alt={doctor.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
                    ) : (
                      <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: "28px", color: "#005cae" }}>
                        {getInitials(doctor.name)}
                      </div>
                    )}
                  </div>

                  <div style={{ height: "16px" }} />

                  <div style={{ padding: "0 8px 8px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <h3 style={{ fontSize: "22px", fontWeight: "700", fontFamily: "Manrope, sans-serif", color: "#1a2e3b", marginBottom: "6px", lineHeight: "1.2" }}>
                      {doctor.name}
                    </h3>

                    <p style={{ fontSize: "14px", fontWeight: "400", fontFamily: "Inter, sans-serif", color: "#5a7a8a", marginBottom: "0", lineHeight: "1.5" }}>
                      {doctor.specialtyName || doctor.title}
                    </p>

                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "20px" }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/patient/doctors/${doctor.id}`)}
                        className="transition-colors duration-200 hover:bg-[#2f75ca]"
                        style={{ borderRadius: "980px", background: "#4f8fe6", color: "white", padding: "9px 22px", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "14px", border: "none", whiteSpace: "nowrap", cursor: "pointer" }}
                      >
                        {t.bookAppointment}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div style={{ minWidth: "32px", flexShrink: 0 }} />
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
