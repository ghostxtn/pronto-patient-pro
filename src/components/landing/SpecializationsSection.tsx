import { motion } from "framer-motion";
import SmartLink from "./SmartLink";

type SpecialtyItem = {
  id: string;
  name: string;
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

export default function SpecialtiesSection({
  specialties,
  isLoading,
  hasLoadedEmpty,
}: SpecialtiesSectionProps) {
  return (
    <motion.section {...sectionMotionProps} style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 48px" }}>
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
        Uzmanlık Alanlarımız
      </h2>
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{ borderRadius: 16, border: "0.5px solid #b5d1cc", background: "white", padding: 24, height: 120 }}
            />
          ))}
        </div>
      ) : hasLoadedEmpty ? (
        <div style={{ textAlign: "center", color: "#5a7a8a", padding: 40 }}>Yakında eklenecek</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {specialties.map((specialty) => (
            <div
              key={specialty.id}
              style={{
                borderRadius: 16,
                border: "0.5px solid #b5d1cc",
                background: "white",
                padding: 24,
                transition: "all 0.2s",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#eaf5ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#4f8fe6",
                  marginBottom: 14,
                }}
              >
                {specialty.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2e3b", marginBottom: 4 }}>
                {specialty.name}
              </div>
              <SmartLink href="/request-appointment" style={{ fontSize: 11, color: "#4f8fe6", textDecoration: "none" }}>
                Randevu Al →
              </SmartLink>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
