import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePublicDoctors } from "@/hooks/usePublicDoctors";

const appleEase = [0.25, 0.1, 0.25, 1] as const;

function getDoctorInitials(fullName: string) {
  return (
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "D"
  );
}

export default function FindDoctors() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const isPatientDoctorsRoute = user?.role === "patient" && location.pathname.startsWith("/patient/doctors");
  const { doctors, specialties, isLoading, isError, hasLoadedEmptyDoctors } = usePublicDoctors();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const selectedSlug = searchParams.get("doctor");
  const selectedSpecialtySlug = searchParams.get("specialty");

  const activeSpecialty = useMemo(() => {
    if (!selectedSpecialtySlug) return "all";

    const matchedSpecialty = specialties.find(
      (specialty) => specialty.slug === selectedSpecialtySlug || specialty.key === selectedSpecialtySlug,
    );

    return matchedSpecialty?.key ?? "all";
  }, [selectedSpecialtySlug, specialties]);

  const filteredDoctors = useMemo(() => {
    if (activeSpecialty === "all") return doctors;
    return doctors.filter((doctor) => doctor.specialtyId === activeSpecialty);
  }, [activeSpecialty, doctors]);

  const selectedDoctor = useMemo(
    () => filteredDoctors.find((doctor) => doctor.slug === selectedSlug) ?? null,
    [filteredDoctors, selectedSlug],
  );

  useEffect(() => {
    if (selectedSpecialtySlug && !isLoading) {
      const specialtyExists = specialties.some(
        (specialty) => specialty.slug === selectedSpecialtySlug || specialty.key === selectedSpecialtySlug,
      );

      if (!specialtyExists) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("specialty");
        setSearchParams(nextParams, { replace: true });
        return;
      }
    }

    if (!selectedSlug || isLoading) return;

    const existsInAllDoctors = doctors.some((doctor) => doctor.slug === selectedSlug);
    if (!existsInAllDoctors) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("doctor");
      setSearchParams(nextParams, { replace: true });
      return;
    }

    const existsInFilteredDoctors = filteredDoctors.some((doctor) => doctor.slug === selectedSlug);
    if (!existsInFilteredDoctors) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("doctor");
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    doctors,
    filteredDoctors,
    isLoading,
    searchParams,
    selectedSlug,
    selectedSpecialtySlug,
    setSearchParams,
    specialties,
  ]);

  function setSpecialtyFilter(nextSpecialty: string) {
    const nextParams = new URLSearchParams(searchParams);

    if (nextSpecialty === "all") {
      nextParams.delete("specialty");
    } else {
      const matchedSpecialty = specialties.find((specialty) => specialty.key === nextSpecialty);
      nextParams.set("specialty", matchedSpecialty?.slug ?? nextSpecialty);
    }

    nextParams.delete("doctor");
    setSearchParams(nextParams);
  }

  function toggleDoctor(slug: string) {
    const nextParams = new URLSearchParams(searchParams);

    if (selectedSlug === slug) {
      nextParams.delete("doctor");
    } else {
      nextParams.set("doctor", slug);
    }

    setSearchParams(nextParams);
  }

  function closeDoctorDetail() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("doctor");
    setSearchParams(nextParams);
  }

  function handleProfileClick(doctor: (typeof doctors)[number]) {
    if (user?.role === "patient") {
      navigate(`/patient/doctors/${doctor.id}`);
      return;
    }

    toggleDoctor(doctor.slug);
  }

  if (user?.role === "patient" && location.pathname === "/doctors") {
    const target = `/patient/doctors${location.search}`;
    return <Navigate to={target} replace />;
  }

  const pageContent = (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-[rgb(var(--homepage-shell))] text-[rgb(var(--homepage-ink))]"
    >
      {!isPatientDoctorsRoute ? <LandingNav /> : null}

      <main className={isPatientDoctorsRoute ? "pb-12 pt-6" : "pt-20"}>
        <section className="mx-auto max-w-[1200px] px-6 pb-8 pt-10 md:px-10 md:pb-12 md:pt-16 lg:px-20 lg:pb-12 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: appleEase }}
          >
            <p className="text-[11px] font-medium uppercase tracking-[2px] text-[rgb(var(--homepage-muted))]" style={{ fontFamily: "Inter, sans-serif" }}>
              {t.ourDoctorsUpper}
            </p>
            <h1 className="mt-2 text-[34px] font-bold leading-tight text-[rgb(var(--homepage-ink))] md:text-[42px]" style={{ fontFamily: "Manrope, sans-serif" }}>
              {t.doctorsPageTitle}
            </h1>
            <p className="mt-3 max-w-[520px] text-[16px] leading-7 text-[rgb(var(--homepage-muted))]" style={{ fontFamily: "Inter, sans-serif" }}>
              {t.doctorsPageDesc}
            </p>
          </motion.div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 pb-8 md:px-10 md:pb-10 lg:px-20 lg:pb-8">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSpecialtyFilter("all")}
              style={{
                background: activeSpecialty === "all" ? "rgb(var(--homepage-brand))" : "rgb(var(--homepage-card))",
                color: activeSpecialty === "all" ? "white" : "rgb(var(--homepage-muted))",
                borderRadius: "980px",
                padding: "7px 18px",
                fontFamily: "Inter, sans-serif",
                fontWeight: activeSpecialty === "all" ? 600 : 500,
                fontSize: "13px",
                border: activeSpecialty === "all" ? "none" : "1px solid rgb(var(--homepage-border))",
                cursor: "pointer",
              }}
            >
              {t.all}
            </button>

            {specialties.map((specialty) => {
              const isActive = activeSpecialty === specialty.key;

              return (
                <button
                  key={specialty.key}
                  type="button"
                  onClick={() => setSpecialtyFilter(specialty.key)}
                  style={{
                    background: isActive ? "rgb(var(--homepage-brand))" : "rgb(var(--homepage-card))",
                    color: isActive ? "white" : "rgb(var(--homepage-muted))",
                    borderRadius: "980px",
                    padding: "7px 18px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: "13px",
                    border: isActive ? "none" : "1px solid rgb(var(--homepage-border))",
                    cursor: "pointer",
                  }}
                >
                  {specialty.name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 pb-12 md:px-10 md:pb-16 lg:px-20 lg:pb-20">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`doctor-skeleton-${index}`} className="flex flex-col" style={{ borderRadius: "18px", overflow: "visible", background: "transparent" }}>
                  <div
                    className="animate-pulse"
                    style={{
                      height: "280px",
                      width: "100%",
                      borderRadius: "18px",
                      background: "linear-gradient(160deg, rgb(var(--homepage-shell-cool)) 0%, rgb(var(--homepage-footer-bg-from)) 55%, rgb(var(--homepage-border)) 100%)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ height: "16px" }} />
                  <div className="px-2 pb-2 text-center">
                    <div className="mx-auto h-7 w-48 rounded-full bg-[rgb(var(--homepage-skeleton-1))]" />
                    <div className="mx-auto mt-3 h-4 w-32 rounded-full bg-[rgb(var(--homepage-skeleton-2))]" />
                    <div className="mx-auto mt-5 h-10 w-56 rounded-full bg-[rgb(var(--homepage-skeleton-3))]" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && isError ? (
            <div className="rounded-[24px] border border-[rgb(var(--homepage-info-border))] bg-[rgb(var(--homepage-shell-cool))] px-6 py-10 text-center text-[rgb(var(--homepage-muted))]" style={{ fontFamily: "Inter, sans-serif" }}>
              {t.doctorsLoadError}
            </div>
          ) : null}

          {!isLoading && !isError && filteredDoctors.length === 0 ? (
            <div className="rounded-[24px] border border-[rgb(var(--homepage-info-border))] bg-[rgb(var(--homepage-shell-cool))] px-6 py-10 text-center text-[rgb(var(--homepage-muted))]" style={{ fontFamily: "Inter, sans-serif" }}>
              {hasLoadedEmptyDoctors ? t.noActiveDoctors : t.noSpecDoctors}
            </div>
          ) : null}

          {!isLoading && !isError && filteredDoctors.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredDoctors.map((doctor, index) => (
                <motion.article
                  key={doctor.id}
                  initial={{ opacity: 0, y: 20, x: -20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: (index % 5) * 0.07, ease: appleEase }}
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-stretch"
                  style={{ borderRadius: "18px", overflow: "visible", background: "transparent", display: "flex", flexDirection: "column", alignItems: "stretch" }}
                >
                  <div
                    style={{
                      height: "280px",
                      width: "100%",
                      borderRadius: "18px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: doctor.imageSrc ? undefined : "linear-gradient(160deg, rgb(var(--homepage-shell-cool)) 0%, rgb(var(--homepage-footer-bg-from)) 55%, rgb(var(--homepage-border)) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {doctor.imageSrc ? (
                      <img
                        src={doctor.imageSrc}
                        alt={doctor.fullName}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "Manrope, sans-serif",
                          fontWeight: 700,
                          fontSize: "28px",
                          color: "rgb(var(--homepage-brand-strong))",
                        }}
                      >
                        {getDoctorInitials(doctor.fullName)}
                      </div>
                    )}
                  </div>

                  <div style={{ height: "16px" }} />

                  <div style={{ padding: "0 8px 8px", textAlign: "center", alignItems: "center", display: "flex", flexDirection: "column" }}>
                    <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: "20px", color: "rgb(var(--homepage-ink))", marginBottom: "4px", lineHeight: 1.3 }}>
                      {[doctor.title, doctor.fullName].filter(Boolean).join(" ")}
                    </h2>

                    <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "14px", color: "rgb(var(--homepage-muted))", marginBottom: 0 }}>
                      {doctor.specialtyName}
                    </p>

                    <div style={{ marginTop: "20px", display: "flex", flexDirection: "row", justifyContent: "center", gap: "16px" }}>
                      <button
                        type="button"
                        onClick={() => handleProfileClick(doctor)}
                        style={{
                          borderRadius: "980px",
                          background: "rgb(var(--homepage-brand))",
                          color: "white",
                          padding: "9px 22px",
                          border: "none",
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 600,
                          fontSize: "14px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.bookAppointment}
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : null}

          {!isPatientDoctorsRoute && selectedDoctor ? (
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: appleEase }}
              className="mt-10 rounded-[24px] border border-[rgb(var(--homepage-info-border))] bg-[rgb(var(--homepage-card))] p-6 md:p-8"
            >
              <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                <div
                  style={{
                    height: "320px",
                    width: "100%",
                    borderRadius: "18px",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: selectedDoctor.imageSrc ? undefined : "linear-gradient(160deg, rgb(var(--homepage-shell-cool)) 0%, rgb(var(--homepage-footer-bg-from)) 55%, rgb(var(--homepage-border)) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedDoctor.imageSrc ? (
                    <img
                      src={selectedDoctor.imageSrc}
                      alt={selectedDoctor.fullName}
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Manrope, sans-serif",
                        fontWeight: 700,
                        fontSize: "28px",
                        color: "rgb(var(--homepage-brand-strong))",
                      }}
                    >
                      {getDoctorInitials(selectedDoctor.fullName)}
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: "32px", lineHeight: 1.2, color: "rgb(var(--homepage-ink))" }}>
                    {[selectedDoctor.title, selectedDoctor.fullName].filter(Boolean).join(" ")}
                  </h3>
                  <p className="mt-3" style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "rgb(var(--homepage-muted))" }}>
                    {selectedDoctor.specialtyName}
                  </p>

                  <p className="mt-6" style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", lineHeight: 1.8, color: "rgb(var(--homepage-muted))" }}>
                    {selectedDoctor.biography || selectedDoctor.previewText}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-2">
                    {selectedDoctor.focusTags.map((tag) => (
                      <span
                        key={`${selectedDoctor.id}-${tag}`}
                        style={{
                          borderRadius: "980px",
                          background: "rgb(var(--homepage-shell-cool))",
                          color: "rgb(var(--homepage-brand-strong))",
                          padding: "4px 10px",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => navigate("/request-appointment")}
                      style={{
                        borderRadius: "980px",
                        background: "rgb(var(--homepage-brand))",
                        color: "white",
                        padding: "9px 22px",
                        border: "none",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.bookAppointment}
                    </button>

                    <button
                      type="button"
                      onClick={closeDoctorDetail}
                      style={{
                        borderRadius: "980px",
                        background: "rgb(var(--homepage-card))",
                        color: "rgb(var(--homepage-muted))",
                        padding: "9px 18px",
                        border: "1px solid rgb(var(--homepage-border))",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 500,
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      {t.closeDetails}
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          ) : null}
        </section>
      </main>

      {!isPatientDoctorsRoute ? <LandingFooter /> : null}
    </motion.div>
  );

  if (isPatientDoctorsRoute) {
    return <AppLayout>{pageContent}</AppLayout>;
  }

  return pageContent;
}
