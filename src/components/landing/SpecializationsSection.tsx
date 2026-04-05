import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SmartLink from "./SmartLink";

type SpecialtyItem = {
  id: string;
  name: string;
  slug?: string;
  imageSrc?: string | null;
};

type SpecialtiesSectionProps = {
  specialties: SpecialtyItem[];
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

export default function SpecialtiesSection({
  specialties,
  isLoading,
  hasLoadedEmpty,
}: SpecialtiesSectionProps) {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const useGridMode = specialties.length <= 4;

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
  }, [specialties.length, useGridMode]);

  return (
    <motion.section
      {...sectionMotionProps}
      ref={sectionRef}
      className="relative z-[10] w-full bg-[#f4f8fd] px-6 py-20 md:px-12 lg:px-20"
    >
      <style>{".spec-scroll-container::-webkit-scrollbar { display: none; }"}</style>

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
            Uzmanlık Alanlarımız
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SmartLink
              href="/specialties"
              className="shrink-0 text-sm font-medium text-[#4f8fe6] transition-colors duration-200 hover:text-[#2f75ca]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Tümünü Gör →
            </SmartLink>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[420px] w-[300px] shrink-0 overflow-hidden rounded-[18px] border border-[#e8f0f8] bg-white shadow-[0_2px_16px_rgba(79,143,230,0.08)] lg:w-auto"
              >
                <div className="h-[260px] overflow-hidden rounded-t-[18px] rounded-b-none bg-[linear-gradient(160deg,#eaf5ff_0%,#c8e6f5_55%,#b5d1cc_100%)]" />
                <div className="rounded-b-[18px] rounded-t-none px-[22px] pb-6 pt-5">
                  <div className="mb-3 h-6 rounded-full bg-[#eef4fb]" />
                  <div className="mb-5 h-4 w-4/5 rounded-full bg-[#f3f7fb]" />
                  <div className="mt-5 flex items-center justify-center gap-4">
                    <div className="h-10 w-28 rounded-full bg-[#eef4fb]" />
                    <div className="h-10 w-32 rounded-full bg-[#f3f7fb]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasLoadedEmpty ? (
          <div style={{ textAlign: "center", color: "#5a7a8a", padding: 40 }}>Yakında eklenecek</div>
        ) : (
          <div className={useGridMode ? "" : "relative px-0 md:px-6"}>
            {!useGridMode ? (
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: -340, behavior: "smooth" })}
                className="hidden md:flex absolute left-[-20px] top-1/2 z-10 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.15)]"
                style={{
                  opacity: canScrollLeft ? 1 : 0.3,
                  pointerEvents: canScrollLeft ? "auto" : "none",
                }}
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
                style={{
                  opacity: canScrollRight ? 1 : 0.3,
                  pointerEvents: canScrollRight ? "auto" : "none",
                }}
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
              className={[
                "spec-scroll-container scroll-smooth",
                useGridMode
                  ? "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4"
                  : "flex snap-x snap-mandatory gap-5 overflow-x-auto pl-2",
              ].join(" ")}
              style={
                useGridMode
                  ? undefined
                  : {
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                      cursor: "grab",
                      scrollBehavior: "smooth",
                      paddingRight: "24px",
                    }
              }
            >
              {specialties.map((specialty, index) => (
                <motion.div
                  key={specialty.id}
                  initial={{ opacity: 0, y: 20, x: -30 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: (index % 5) * 0.08, ease: appleEase }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 8px 32px rgba(79,143,230,0.18)",
                  }}
                  className={[
                    "min-h-[420px]",
                    useGridMode ? "w-full" : "w-[280px] shrink-0 snap-start",
                  ].join(" ")}
                  style={{
                    borderRadius: "18px",
                    overflow: "visible",
                    background: "transparent",
                    flexShrink: 0,
                    width: useGridMode ? undefined : "300px",
                    cursor: "grab",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                >
                  <div
                    style={{
                      height: "260px",
                      width: "100%",
                      borderRadius: "18px",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {specialty.imageSrc ? (
                      <img
                        src={specialty.imageSrc}
                        alt={specialty.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(160deg, #eaf5ff 0%, #c8e6f5 55%, #b5d1cc 100%)",
                        }}
                      />
                    )}
                  </div>

                  <div style={{ height: "16px" }} />

                  <div
                    className="min-h-[150px]"
                    style={{
                      padding: "0 8px 8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: "0",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        fontFamily: "Manrope, sans-serif",
                        color: "#1a2e3b",
                        marginBottom: "8px",
                        letterSpacing: "-0.3px",
                        lineHeight: "1.2",
                      }}
                    >
                      {specialty.name}
                    </h3>

                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: "400",
                        fontFamily: "Inter, sans-serif",
                        color: "#5a7a8a",
                        marginBottom: "0",
                        lineHeight: "1.5",
                        maxWidth: "220px",
                      }}
                    >
                      Uzman kadromuzla hizmetinizdeyiz
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "16px",
                        justifyContent: "center",
                        marginTop: "20px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/patient/doctors?specialty=${encodeURIComponent(specialty.slug ?? specialty.name.toLowerCase())}`)}
                        className="transition-colors duration-200 hover:bg-[#2f75ca]"
                        style={{
                          borderRadius: "980px",
                          padding: "9px 22px",
                          background: "#4f8fe6",
                          color: "white",
                          border: "none",
                          fontWeight: 600,
                          fontSize: "14px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Randevu Al
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {/* spacer to prevent last card from being clipped */}
              <div style={{ minWidth: "32px", flexShrink: 0 }} />
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
