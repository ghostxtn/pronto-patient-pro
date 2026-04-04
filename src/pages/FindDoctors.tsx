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
  const { lang } = useLanguage();
  const location = useLocation();
  const isPatientDoctorsRoute =
    user?.role === "patient" && location.pathname.startsWith("/patient/doctors");
  const { doctors, specialties, isLoading, isError, hasLoadedEmptyDoctors } = usePublicDoctors();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedSlug = searchParams.get("doctor");
  const selectedSpecialtySlug = searchParams.get("specialty");

  const activeSpecialty = useMemo(() => {
    if (!selectedSpecialtySlug) {
      return "all";
    }

    const matchedSpecialty = specialties.find(
      (specialty) => specialty.slug === selectedSpecialtySlug || specialty.key === selectedSpecialtySlug,
    );

    return matchedSpecialty?.key ?? "all";
  }, [selectedSpecialtySlug, specialties]);

  const filteredDoctors = useMemo(() => {
    if (activeSpecialty === "all") {
      return doctors;
    }

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

    if (!selectedSlug || isLoading) {
      return;
    }

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
    <div className="min-h-screen bg-[#f4f8fd] text-[#1a2e3b]">
      {!isPatientDoctorsRoute ? <LandingNav /> : null}

      <main className={isPatientDoctorsRoute ? "pb-12 pt-6" : "pt-20"}>
        <section className="mx-auto max-w-[1200px] px-6 pb-8 pt-10 md:px-10 md:pb-12 md:pt-16 lg:px-20 lg:pb-12 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: appleEase }}
          >
            <p
              className="text-[11px] font-medium uppercase tracking-[2px] text-[#5a7a8a]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              DOKTORLARIMIZ
            </p>
            <h1
              className="mt-2 text-[34px] font-bold leading-tight text-[#1a2e3b] md:text-[42px]"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Doktorlarımız
            </h1>
            <p
              className="mt-3 max-w-[520px] text-[16px] leading-7 text-[#5a7a8a]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Kliniğimizin uzman hekim kadrosunu inceleyin ve randevu alın.
            </p>
          </motion.div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 pb-8 md:px-10 md:pb-10 lg:px-20 lg:pb-8">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSpecialtyFilter("all")}
              style={{
                background: activeSpecialty === "all" ? "#4f8fe6" : "white",
                color: activeSpecialty === "all" ? "white" : "#5a7a8a",
                borderRadius: "980px",
                padding: "7px 18px",
                fontFamily: "Inter, sans-serif",
                fontWeight: activeSpecialty === "all" ? 600 : 500,
                fontSize: "13px",
                border: activeSpecialty === "all" ? "none" : "1px solid #b5d1cc",
                cursor: "pointer",
              }}
            >
              Tümü
            </button>

            {specialties.map((specialty) => {
              const isActive = activeSpecialty === specialty.key;

              return (
                <button
                  key={specialty.key}
                  type="button"
                  onClick={() => setSpecialtyFilter(specialty.key)}
                  style={{
                    background: isActive ? "#4f8fe6" : "white",
                    color: isActive ? "white" : "#5a7a8a",
                    borderRadius: "980px",
                    padding: "7px 18px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: "13px",
                    border: isActive ? "none" : "1px solid #b5d1cc",
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
                <div
                  key={`doctor-skeleton-${index}`}
                  className="flex flex-col"
                  style={{ borderRadius: "18px", overflow: "visible", background: "transparent" }}
                >
                  <div
                    className="animate-pulse"
                    style={{
                      height: "280px",
                      width: "100%",
                      borderRadius: "18px",
                      background: "linear-gradient(160deg, #eaf5ff 0%, #c8e6f5 55%, #b5d1cc 100%)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ height: "16px" }} />
                  <div className="px-2 pb-2 text-center">
                    <div className="mx-auto h-7 w-48 rounded-full bg-[#dfeaf7]" />
                    <div className="mx-auto mt-3 h-4 w-32 rounded-full bg-[#e7eff9]" />
                    <div className="mx-auto mt-5 h-10 w-56 rounded-full bg-[#eef4fb]" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && isError ? (
            <div
              className="rounded-[24px] border border-[#d9e6f3] bg-[#eaf5ff] px-6 py-10 text-center text-[#5a7a8a]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Doktor verileri şu anda yüklenemiyor. Lütfen biraz sonra tekrar deneyin.
            </div>
          ) : null}

          {!isLoading && !isError && filteredDoctors.length === 0 ? (
            <div
              className="rounded-[24px] border border-[#d9e6f3] bg-[#eaf5ff] px-6 py-10 text-center text-[#5a7a8a]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {hasLoadedEmptyDoctors
                ? "Görüntülenecek aktif doktor bulunamadı."
                : "Seçili uzmanlıkta aktif doktor bulunamadı."}
            </div>
          ) : null}

          {!isLoading && !isError && filteredDoctors.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredDoctors.map((doctor, index) => (
                <motion.article
                  key={doctor.id}
                  initial={{ opacity: 0, y: 40, x: -30 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.65, delay: index * 0.08, ease: appleEase }}
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-stretch"
                  style={{
                    borderRadius: "18px",
                    overflow: "visible",
                    background: "transparent",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                >
                  <div
                    style={{
                      height: "280px",
                      width: "100%",
                      borderRadius: "18px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: doctor.imageSrc
                        ? undefined
                        : "linear-gradient(160deg, #eaf5ff 0%, #c8e6f5 55%, #b5d1cc 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {doctor.imageSrc ? (
                      <img
                        src={doctor.imageSrc}
                        alt={doctor.fullName}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center top",
                          display: "block",
                        }}
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
                          color: "#005cae",
                        }}
                      >
                        {getDoctorInitials(doctor.fullName)}
                      </div>
                    )}
                  </div>

                  <div style={{ height: "16px" }} />

                  <div
                    style={{
                      padding: "0 8px 8px",
                      textAlign: "center",
                      alignItems: "center",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: "Manrope, sans-serif",
                        fontWeight: 700,
                        fontSize: "20px",
                        color: "#1a2e3b",
                        marginBottom: "4px",
                        lineHeight: 1.3,
                      }}
                    >
                      {[doctor.title, doctor.fullName].filter(Boolean).join(" ")}
                    </h2>

                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 400,
                        fontSize: "14px",
                        color: "#5a7a8a",
                        marginBottom: 0,
                      }}
                    >
                      {doctor.specialtyName}
                    </p>

                    <div
                      style={{
                        marginTop: "20px",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: "16px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => navigate("/request-appointment")}
                        style={{
                          borderRadius: "980px",
                          background: "#4f8fe6",
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
                        Randevu Al
                      </button>

                      <button
                        type="button"
                        onClick={() => handleProfileClick(doctor)}
                        style={{
                          borderRadius: "0",
                          background: "transparent",
                          border: "none",
                          color: "#4f8fe6",
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 500,
                          fontSize: "14px",
                          cursor: "pointer",
                          padding: "9px 8px",
                        }}
                      >
                        Profili Gör ›
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
              className="mt-10 rounded-[24px] border border-[#d9e6f3] bg-white p-6 md:p-8"
            >
              <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                <div
                  style={{
                    height: "320px",
                    width: "100%",
                    borderRadius: "18px",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: selectedDoctor.imageSrc
                      ? undefined
                      : "linear-gradient(160deg, #eaf5ff 0%, #c8e6f5 55%, #b5d1cc 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedDoctor.imageSrc ? (
                    <img
                      src={selectedDoctor.imageSrc}
                      alt={selectedDoctor.fullName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center top",
                        display: "block",
                      }}
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
                        color: "#005cae",
                      }}
                    >
                      {getDoctorInitials(selectedDoctor.fullName)}
                    </div>
                  )}
                </div>

                <div>
                  <h3
                    style={{
                      fontFamily: "Manrope, sans-serif",
                      fontWeight: 700,
                      fontSize: "32px",
                      lineHeight: 1.2,
                      color: "#1a2e3b",
                    }}
                  >
                    {[selectedDoctor.title, selectedDoctor.fullName].filter(Boolean).join(" ")}
                  </h3>
                  <p
                    className="mt-3"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#5a7a8a" }}
                  >
                    {selectedDoctor.specialtyName}
                  </p>

                  <p
                    className="mt-6"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", lineHeight: 1.8, color: "#5a7a8a" }}
                  >
                    {selectedDoctor.biography || selectedDoctor.previewText}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-2">
                    {selectedDoctor.focusTags.map((tag) => (
                      <span
                        key={`${selectedDoctor.id}-${tag}`}
                        style={{
                          borderRadius: "980px",
                          background: "#eaf5ff",
                          color: "#005cae",
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
                        background: "#4f8fe6",
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
                      Randevu Al
                    </button>

                    <button
                      type="button"
                      onClick={closeDoctorDetail}
                      style={{
                        borderRadius: "980px",
                        background: "white",
                        color: "#5a7a8a",
                        padding: "9px 18px",
                        border: "1px solid #b5d1cc",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 500,
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      Detayı Kapat
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          ) : null}
        </section>
      </main>

      {!isPatientDoctorsRoute ? <LandingFooter /> : null}
    </div>
  );

  if (isPatientDoctorsRoute) {
    return <AppLayout>{pageContent}</AppLayout>;
  }

  return pageContent;
}
