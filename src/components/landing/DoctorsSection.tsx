import { motion } from "framer-motion";
import SmartLink from "./SmartLink";
import { getInitials } from "./HeroSection";

type DoctorItem = {
  id: string;
  name: string;
  specialtyName?: string;
  title?: string;
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

export default function DoctorsSection({
  doctors,
  isLoading,
  hasLoadedEmpty,
}: DoctorsSectionProps) {
  return (
    <motion.section
      {...sectionMotionProps}
      id="doktorlarimiz"
      style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px 80px" }}
    >
      <h2
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: 32,
          fontWeight: 300,
          letterSpacing: "-0.025em",
          color: "#1a2e3b",
          marginBottom: 40,
        }}
      >
        Doktorlarımız
      </h2>
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{ borderRadius: 16, border: "0.5px solid #b5d1cc", background: "white", padding: 24, height: 160 }}
            />
          ))}
        </div>
      ) : hasLoadedEmpty ? (
        <div style={{ textAlign: "center", color: "#5a7a8a", padding: 40 }}>Doktorlarımız yakında eklenecek</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              style={{
                borderRadius: 16,
                border: "0.5px solid #b5d1cc",
                background: "white",
                padding: 24,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#eaf5ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#4f8fe6",
                  marginBottom: 16,
                }}
              >
                {getInitials(doctor.name)}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2e3b", marginBottom: 4 }}>
                {doctor.name}
              </div>
              <div style={{ fontSize: 13, color: "#5a7a8a", marginBottom: 16 }}>
                {doctor.specialtyName || doctor.title}
              </div>
              <SmartLink
                href="/request-appointment"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#4f8fe6",
                  color: "white",
                  borderRadius: 999,
                  padding: "6px 16px",
                  fontSize: 12,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Randevu Al
              </SmartLink>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
